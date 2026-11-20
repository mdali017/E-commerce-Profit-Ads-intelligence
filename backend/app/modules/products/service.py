from typing import List, Optional, Tuple
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_

from app.modules.products.models import Product, ProductVariant, ProductCostHistory
from app.core.redis import get_cache, set_cache, delete_cache
from app.modules.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantUpdate,
    ProductCostUpdate,
    CostCoverageStats,
    BulkCostUploadRequest,
    BulkCostUploadResult,
)


class ProductService:
    @staticmethod
    def _compute_product_metrics(product: Product) -> dict:
        """Helper to calculate unit gross profit and margin percentage."""
        has_cost = product.cost_price is not None and product.cost_price > Decimal("0.00")
        unit_gross_profit = None
        margin_percentage = None

        if has_cost and product.regular_price is not None:
            total_unit_cost = (
                product.cost_price
                + (product.packaging_cost or Decimal("0.00"))
                + (product.handling_cost or Decimal("0.00"))
            )
            unit_gross_profit = product.regular_price - total_unit_cost
            if product.regular_price > Decimal("0.00"):
                margin_percentage = round(
                    (unit_gross_profit / product.regular_price) * Decimal("100"), 2
                )

        return {
            "has_cost": has_cost,
            "unit_gross_profit": unit_gross_profit,
            "margin_percentage": margin_percentage,
        }

    @staticmethod
    async def create_product(
        db: AsyncSession, tenant_id: str, product_in: ProductCreate
    ) -> Product:
        # Check SKU collision if provided
        if product_in.sku:
            existing = await db.execute(
                select(Product).where(
                    Product.tenant_id == tenant_id, Product.sku == product_in.sku
                )
            )
            if existing.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A product with SKU '{product_in.sku}' already exists in this workspace.",
                )

        product = Product(
            tenant_id=tenant_id,
            name=product_in.name,
            sku=product_in.sku,
            category=product_in.category,
            description=product_in.description,
            image_url=product_in.image_url,
            regular_price=product_in.regular_price,
            cost_price=product_in.cost_price,
            packaging_cost=product_in.packaging_cost,
            handling_cost=product_in.handling_cost,
            is_active=product_in.is_active,
        )
        db.add(product)
        await db.flush()

        # Add variants if any
        if product_in.variants:
            for v_in in product_in.variants:
                variant = ProductVariant(
                    tenant_id=tenant_id,
                    product_id=product.id,
                    name=v_in.name,
                    sku=v_in.sku,
                    price=v_in.price or product.regular_price,
                    cost_price=v_in.cost_price or product.cost_price,
                    stock_quantity=v_in.stock_quantity,
                    attributes=v_in.attributes,
                    is_active=v_in.is_active,
                )
                db.add(variant)

        # Initial Cost History Entry if cost_price was provided
        if product_in.cost_price is not None:
            history = ProductCostHistory(
                tenant_id=tenant_id,
                product_id=product.id,
                old_cost_price=None,
                new_cost_price=product_in.cost_price,
                reason="Initial cost price setup",
            )
            db.add(history)

        await db.commit()

        # Fetch with relationships loaded
        return await ProductService.get_product_detail(db, tenant_id, product.id)

    @staticmethod
    async def get_product_detail(
        db: AsyncSession, tenant_id: str, product_id: str
    ) -> Product:
        result = await db.execute(
            select(Product)
            .where(Product.id == product_id, Product.tenant_id == tenant_id)
            .options(
                selectinload(Product.variants),
                selectinload(Product.cost_history),
            )
        )
        product = result.scalars().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this workspace",
            )

        # Attach computed fields
        metrics = ProductService._compute_product_metrics(product)
        for k, v in metrics.items():
            setattr(product, k, v)

        return product

    @staticmethod
    async def list_products(
        db: AsyncSession,
        tenant_id: str,
        search: Optional[str] = None,
        category: Optional[str] = None,
        has_cost: Optional[bool] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Product], int]:
        query = select(Product).where(Product.tenant_id == tenant_id)

        if search:
            search_filter = f"%{search}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_filter),
                    Product.sku.ilike(search_filter),
                )
            )

        if category:
            query = query.where(Product.category == category)

        if is_active is not None:
            query = query.where(Product.is_active == is_active)

        if has_cost is True:
            query = query.where(Product.cost_price.isnot(None), Product.cost_price > 0)
        elif has_cost is False:
            query = query.where(or_(Product.cost_price.is_(None), Product.cost_price == 0))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Fetch paginated items
        result = await db.execute(
            query.order_by(Product.name.asc()).offset(skip).limit(limit)
        )
        products = result.scalars().all()

        # Attach computed metrics
        for p in products:
            metrics = ProductService._compute_product_metrics(p)
            for k, v in metrics.items():
                setattr(p, k, v)

        return products, total

    @staticmethod
    async def update_product(
        db: AsyncSession, tenant_id: str, product_id: str, update_in: ProductUpdate
    ) -> Product:
        product = await ProductService.get_product_detail(db, tenant_id, product_id)

        # Check if cost price is being changed
        if (
            update_in.cost_price is not None
            and update_in.cost_price != product.cost_price
        ):
            history = ProductCostHistory(
                tenant_id=tenant_id,
                product=product,
                old_cost_price=product.cost_price,
                new_cost_price=update_in.cost_price,
                reason="Cost price updated via product edit",
            )
            db.add(history)
            product.cost_price = update_in.cost_price

        # Update other fields
        for field in [
            "name",
            "sku",
            "category",
            "description",
            "image_url",
            "regular_price",
            "packaging_cost",
            "handling_cost",
            "is_active",
        ]:
            val = getattr(update_in, field)
            if val is not None:
                setattr(product, field, val)

        await db.commit()
        await db.refresh(product, ["cost_history", "variants"])
        metrics = ProductService._compute_product_metrics(product)
        for k, v in metrics.items():
            setattr(product, k, v)
        return product

    @staticmethod
    async def update_cost_price(
        db: AsyncSession, tenant_id: str, product_id: str, cost_in: ProductCostUpdate
    ) -> Product:
        product = await ProductService.get_product_detail(db, tenant_id, product_id)

        if cost_in.variant_id:
            # Update variant cost
            var_res = await db.execute(
                select(ProductVariant).where(
                    ProductVariant.id == cost_in.variant_id,
                    ProductVariant.product_id == product_id,
                    ProductVariant.tenant_id == tenant_id,
                )
            )
            variant = var_res.scalars().first()
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Variant not found for this product",
                )

            old_cost = variant.cost_price
            variant.cost_price = cost_in.new_cost_price
            history = ProductCostHistory(
                tenant_id=tenant_id,
                product_id=product.id,
                variant_id=variant.id,
                old_cost_price=old_cost,
                new_cost_price=cost_in.new_cost_price,
                reason=cost_in.reason or f"Cost updated for variant {variant.name}",
            )
            db.add(history)
        else:
            # Update base product cost
            old_cost = product.cost_price
            product.cost_price = cost_in.new_cost_price
            history = ProductCostHistory(
                tenant_id=tenant_id,
                product_id=product.id,
                old_cost_price=old_cost,
                new_cost_price=cost_in.new_cost_price,
                reason=cost_in.reason or "Direct cost price update",
            )
            db.add(history)

        await db.commit()
        await db.refresh(product, ["cost_history", "variants"])
        metrics = ProductService._compute_product_metrics(product)
        for k, v in metrics.items():
            setattr(product, k, v)
        return product

    @staticmethod
    async def delete_product(db: AsyncSession, tenant_id: str, product_id: str) -> dict:
        product = await ProductService.get_product_detail(db, tenant_id, product_id)
        await db.delete(product)
        await db.commit()
        return {"message": f"Product '{product.name}' deleted successfully"}

    @staticmethod
    async def add_variant(
        db: AsyncSession,
        tenant_id: str,
        product_id: str,
        variant_in: ProductVariantCreate,
    ) -> ProductVariant:
        product = await ProductService.get_product_detail(db, tenant_id, product_id)

        variant = ProductVariant(
            tenant_id=tenant_id,
            product_id=product.id,
            name=variant_in.name,
            sku=variant_in.sku,
            price=variant_in.price or product.regular_price,
            cost_price=variant_in.cost_price or product.cost_price,
            stock_quantity=variant_in.stock_quantity,
            attributes=variant_in.attributes,
            is_active=variant_in.is_active,
        )
        db.add(variant)
        await db.commit()
        await db.refresh(variant)
        return variant

    @staticmethod
    async def update_variant(
        db: AsyncSession,
        tenant_id: str,
        product_id: str,
        variant_id: str,
        update_in: ProductVariantUpdate,
    ) -> ProductVariant:
        result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.id == variant_id,
                ProductVariant.product_id == product_id,
                ProductVariant.tenant_id == tenant_id,
            )
        )
        variant = result.scalars().first()
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Variant not found",
            )

        # If cost price changes, record history
        if (
            update_in.cost_price is not None
            and update_in.cost_price != variant.cost_price
        ):
            history = ProductCostHistory(
                tenant_id=tenant_id,
                product_id=product_id,
                variant_id=variant.id,
                old_cost_price=variant.cost_price,
                new_cost_price=update_in.cost_price,
                reason=f"Variant '{variant.name}' cost updated",
            )
            db.add(history)

        for field in [
            "name",
            "sku",
            "price",
            "cost_price",
            "stock_quantity",
            "attributes",
            "is_active",
        ]:
            val = getattr(update_in, field)
            if val is not None:
                setattr(variant, field, val)

        await db.commit()
        await db.refresh(variant)
        return variant

    @staticmethod
    async def delete_variant(
        db: AsyncSession, tenant_id: str, product_id: str, variant_id: str
    ) -> dict:
        result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.id == variant_id,
                ProductVariant.product_id == product_id,
                ProductVariant.tenant_id == tenant_id,
            )
        )
        variant = result.scalars().first()
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Variant not found",
            )

        await db.delete(variant)
        await db.commit()
        return {"message": "Variant deleted successfully"}

    @staticmethod
    async def get_cost_coverage_stats(
        db: AsyncSession, tenant_id: str
    ) -> CostCoverageStats:
        cache_key = f"products:coverage:{tenant_id}"
        cached = await get_cache(cache_key)
        if cached:
            try:
                return CostCoverageStats(**cached)
            except Exception:
                pass

        # 1. Total products
        total_p_res = await db.execute(
            select(func.count(Product.id)).where(Product.tenant_id == tenant_id)
        )
        total_products = total_p_res.scalar() or 0

        # 2. Products with cost
        with_cost_res = await db.execute(
            select(func.count(Product.id)).where(
                Product.tenant_id == tenant_id,
                Product.cost_price.isnot(None),
                Product.cost_price > 0,
            )
        )
        products_with_cost = with_cost_res.scalar() or 0

        # 3. Variants stats
        total_v_res = await db.execute(
            select(func.count(ProductVariant.id)).where(
                ProductVariant.tenant_id == tenant_id
            )
        )
        total_variants = total_v_res.scalar() or 0

        v_with_cost_res = await db.execute(
            select(func.count(ProductVariant.id)).where(
                ProductVariant.tenant_id == tenant_id,
                ProductVariant.cost_price.isnot(None),
                ProductVariant.cost_price > 0,
            )
        )
        variants_with_cost = v_with_cost_res.scalar() or 0

        products_missing_cost = total_products - products_with_cost
        coverage_pct = (
            round((products_with_cost / total_products) * 100, 2)
            if total_products > 0
            else 0.0
        )

        stats = CostCoverageStats(
            total_products=total_products,
            products_with_cost=products_with_cost,
            products_missing_cost=products_missing_cost,
            cost_coverage_percentage=coverage_pct,
            total_variants=total_variants,
            variants_with_cost=variants_with_cost,
        )
        await set_cache(cache_key, stats.model_dump(mode="json"), ttl_seconds=180)
        return stats

    @staticmethod
    async def bulk_update_costs(
        db: AsyncSession, tenant_id: str, bulk_in: BulkCostUploadRequest
    ) -> BulkCostUploadResult:
        updated = 0
        errors = []

        for item in bulk_in.items:
            sku = item.sku.strip() if item.sku else ""
            if not sku:
                continue

            # 1. Check if matching a variant SKU first
            var_res = await db.execute(
                select(ProductVariant).where(
                    ProductVariant.tenant_id == tenant_id,
                    ProductVariant.sku == sku,
                )
            )
            variant = var_res.scalars().first()
            if variant:
                old_cost = variant.cost_price
                variant.cost_price = item.cost_price
                history = ProductCostHistory(
                    tenant_id=tenant_id,
                    product_id=variant.product_id,
                    variant_id=variant.id,
                    old_cost_price=old_cost,
                    new_cost_price=item.cost_price,
                    reason=item.reason or "Bulk CSV cost upload",
                )
                db.add(history)
                updated += 1
                continue

            # 2. Check base product SKU
            prod_res = await db.execute(
                select(Product).where(
                    Product.tenant_id == tenant_id,
                    Product.sku == sku,
                )
            )
            product = prod_res.scalars().first()
            if product:
                old_cost = product.cost_price
                product.cost_price = item.cost_price
                if item.packaging_cost is not None:
                    product.packaging_cost = item.packaging_cost
                if item.handling_cost is not None:
                    product.handling_cost = item.handling_cost

                history = ProductCostHistory(
                    tenant_id=tenant_id,
                    product_id=product.id,
                    old_cost_price=old_cost,
                    new_cost_price=item.cost_price,
                    reason=item.reason or "Bulk CSV cost upload",
                )
                db.add(history)
                updated += 1
            else:
                errors.append({"sku": sku, "error": f"SKU '{sku}' not found in catalog."})

        await db.commit()
        return BulkCostUploadResult(
            updated_count=updated,
            failed_count=len(errors),
            errors=errors,
        )
