import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_, desc, case

from app.modules.orders.models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderAttribution,
    OrderStatus,
    OrderSource,
    PaymentStatus,
)
from app.modules.orders.schemas import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderKPIStats,
)
from app.modules.products.models import Product, ProductVariant
from app.core.redis import get_cache, set_cache, delete_cache


class OrderService:
    @staticmethod
    async def generate_order_number(db: AsyncSession, tenant_id: str) -> str:
        """
        Generates a clean sequential human-readable order number.
        Example: ORD-20261106-0001
        """
        today_str = datetime.utcnow().strftime("%Y%m%d")
        prefix = f"ORD-{today_str}-"

        # Count orders created today for this workspace
        count_res = await db.execute(
            select(func.count(Order.id)).where(
                Order.tenant_id == tenant_id,
                Order.order_number.like(f"{prefix}%"),
            )
        )
        today_count = count_res.scalar() or 0
        return f"{prefix}{today_count + 1:04d}"

    @staticmethod
    async def create_order(
        db: AsyncSession,
        tenant_id: str,
        order_in: OrderCreate,
        user_id: Optional[str] = None,
    ) -> Order:
        """
        Ingest order from manual entry, WooCommerce webhook, or Landing page.
        Automatically resolves product catalog COGS snapshot and calculates profit.
        """
        # 1. Idempotency Check to prevent duplicate ingestion
        if order_in.idempotency_key:
            existing = await db.execute(
                select(Order).where(
                    Order.tenant_id == tenant_id,
                    Order.idempotency_key == order_in.idempotency_key,
                )
            )
            existing_order = existing.scalars().first()
            if existing_order:
                return await OrderService.get_order_detail(db, tenant_id, existing_order.id)

        if order_in.external_order_id:
            existing_ext = await db.execute(
                select(Order).where(
                    Order.tenant_id == tenant_id,
                    Order.external_order_id == order_in.external_order_id,
                    Order.source == order_in.source.value,
                )
            )
            existing_ext_order = existing_ext.scalars().first()
            if existing_ext_order:
                return await OrderService.get_order_detail(db, tenant_id, existing_ext_order.id)

        # 2. Generate sequential Order Number
        order_number = await OrderService.generate_order_number(db, tenant_id)

        # 3. Process Line Items and Calculate Financials
        subtotal = Decimal("0.00")
        total_cogs = Decimal("0.00")
        total_packaging = Decimal("0.00")
        total_handling = Decimal("0.00")
        db_items: List[OrderItem] = []

        for item_in in order_in.items:
            unit_price = item_in.unit_price
            unit_cost = item_in.unit_cost_price
            unit_pkg = item_in.unit_packaging_cost
            unit_hnd = item_in.unit_handling_cost
            matched_prod_id = item_in.product_id
            matched_var_id = item_in.variant_id

            # Auto-lookup COGS from product catalog if not provided
            if unit_cost is None:
                if matched_var_id:
                    v_res = await db.execute(
                        select(ProductVariant).where(
                            ProductVariant.id == matched_var_id,
                            ProductVariant.tenant_id == tenant_id,
                        )
                    )
                    v = v_res.scalars().first()
                    if v and v.cost_price is not None:
                        unit_cost = v.cost_price

                if unit_cost is None and matched_prod_id:
                    p_res = await db.execute(
                        select(Product).where(
                            Product.id == matched_prod_id,
                            Product.tenant_id == tenant_id,
                        )
                    )
                    p = p_res.scalars().first()
                    if p:
                        if p.cost_price is not None:
                            unit_cost = p.cost_price
                        if unit_pkg == Decimal("0.00") and p.packaging_cost is not None:
                            unit_pkg = p.packaging_cost
                        if unit_hnd == Decimal("0.00") and p.handling_cost is not None:
                            unit_hnd = p.handling_cost

                # Lookup by SKU fallback
                if unit_cost is None and item_in.sku:
                    sku_clean = item_in.sku.strip()
                    # Check variant SKU first
                    var_match = await db.execute(
                        select(ProductVariant).where(
                            ProductVariant.tenant_id == tenant_id,
                            ProductVariant.sku == sku_clean,
                        )
                    )
                    vm = var_match.scalars().first()
                    if vm:
                        matched_var_id = vm.id
                        matched_prod_id = vm.product_id
                        unit_cost = vm.cost_price
                    else:
                        prod_match = await db.execute(
                            select(Product).where(
                                Product.tenant_id == tenant_id,
                                Product.sku == sku_clean,
                            )
                        )
                        pm = prod_match.scalars().first()
                        if pm:
                            matched_prod_id = pm.id
                            unit_cost = pm.cost_price
                            if unit_pkg == Decimal("0.00"):
                                unit_pkg = pm.packaging_cost
                            if unit_hnd == Decimal("0.00"):
                                unit_hnd = pm.handling_cost

            # Calculate item totals
            qty = item_in.quantity
            item_total_price = unit_price * qty
            item_total_cost = (unit_cost * qty) if unit_cost is not None else Decimal("0.00")

            subtotal += item_total_price
            total_cogs += item_total_cost
            total_packaging += (unit_pkg * qty)
            total_handling += (unit_hnd * qty)

            db_items.append(
                OrderItem(
                    tenant_id=tenant_id,
                    product_id=matched_prod_id,
                    variant_id=matched_var_id,
                    product_name=item_in.product_name,
                    variant_name=item_in.variant_name,
                    sku=item_in.sku,
                    quantity=qty,
                    unit_price=unit_price,
                    unit_cost_price=unit_cost,
                    unit_packaging_cost=unit_pkg,
                    unit_handling_cost=unit_hnd,
                    total_price=item_total_price,
                    total_cost=item_total_cost,
                )
            )

        # 4. Total Amount (payable) & Gross Profit
        shipping_fee = order_in.shipping_fee or Decimal("0.00")
        discount = order_in.discount_amount or Decimal("0.00")
        total_amount = subtotal - discount + shipping_fee
        gross_profit = total_amount - (total_cogs + total_packaging + total_handling)

        # 5. Create Order Record
        order = Order(
            tenant_id=tenant_id,
            order_number=order_number,
            source=order_in.source.value,
            status=OrderStatus.PENDING.value,
            payment_method=order_in.payment_method.value,
            payment_status=order_in.payment_status.value,
            customer_name=order_in.customer_name.strip(),
            customer_phone=order_in.customer_phone.strip(),
            customer_email=order_in.customer_email.strip() if order_in.customer_email else None,
            shipping_address=order_in.shipping_address.strip(),
            shipping_city=order_in.shipping_city,
            shipping_zone=order_in.shipping_zone,
            customer_notes=order_in.customer_notes,
            internal_notes=order_in.internal_notes,
            subtotal=subtotal,
            discount_amount=discount,
            shipping_fee=shipping_fee,
            total_amount=total_amount,
            total_cogs=total_cogs,
            total_packaging_cost=total_packaging,
            total_handling_cost=total_handling,
            gross_profit=gross_profit,
            external_order_id=order_in.external_order_id,
            idempotency_key=order_in.idempotency_key,
            order_date=order_in.order_date or datetime.utcnow(),
        )
        db.add(order)
        await db.flush()

        # 6. Associate Items with Order
        for item in db_items:
            item.order_id = order.id
            db.add(item)

        # 7. Initial Status History Audit Entry
        history = OrderStatusHistory(
            tenant_id=tenant_id,
            order_id=order.id,
            from_status=None,
            to_status=order.status,
            changed_by_user_id=user_id,
            reason=f"Order created via {order.source.capitalize()}",
        )
        db.add(history)

        # 8. Marketing Attribution Metadata if provided
        if order_in.attribution:
            attr_in = order_in.attribution
            attribution = OrderAttribution(
                tenant_id=tenant_id,
                order_id=order.id,
                utm_source=attr_in.utm_source,
                utm_medium=attr_in.utm_medium,
                utm_campaign=attr_in.utm_campaign,
                utm_content=attr_in.utm_content,
                utm_term=attr_in.utm_term,
                fbclid=attr_in.fbclid,
                campaign_id=attr_in.campaign_id,
                adset_id=attr_in.adset_id,
                ad_id=attr_in.ad_id,
                attribution_confidence=attr_in.attribution_confidence.value,
            )
            db.add(attribution)

        await db.commit()

        # 9. Auto-sync Customer CRM profile
        try:
            from app.modules.crm.service import CRMService
            await CRMService.sync_customer_from_order(db, tenant_id, order)
        except Exception:
            pass

        return await OrderService.get_order_detail(db, tenant_id, order.id)

    @staticmethod
    async def get_order_detail(db: AsyncSession, tenant_id: str, order_id: str) -> Order:
        """Fetch complete order with items, status history, and marketing attribution."""
        result = await db.execute(
            select(Order)
            .where(Order.id == order_id, Order.tenant_id == tenant_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.status_history),
                selectinload(Order.attribution),
            )
        )
        order = result.scalars().first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found in this workspace",
            )
        order.item_count = len(order.items) if order.items else 0
        return order

    @staticmethod
    async def update_order_status(
        db: AsyncSession,
        tenant_id: str,
        order_id: str,
        status_in: OrderStatusUpdate,
        user_id: Optional[str] = None,
    ) -> Order:
        """
        Update order lifecycle status with audit history.
        E.g. Operator confirms order by phone: PENDING -> CONFIRMED
        """
        order = await OrderService.get_order_detail(db, tenant_id, order_id)
        new_status_val = status_in.status.value

        if order.status != new_status_val:
            history = OrderStatusHistory(
                tenant_id=tenant_id,
                order_id=order.id,
                from_status=order.status,
                to_status=new_status_val,
                changed_by_user_id=user_id,
                reason=status_in.reason or f"Status changed to {new_status_val}",
            )
            db.add(history)
            order.status = new_status_val

            # Auto update payment status for COD upon delivery
            if (
                new_status_val == OrderStatus.DELIVERED.value
                and order.payment_method == "cod"
                and order.payment_status == PaymentStatus.PENDING.value
            ):
                order.payment_status = PaymentStatus.PAID.value

            await db.commit()
            await db.refresh(order, ["items", "status_history", "attribution"])
            order.item_count = len(order.items) if order.items else 0

            # Auto-sync customer profile & trigger automations
            try:
                from app.modules.crm.service import CRMService
                await CRMService.sync_customer_from_order(db, tenant_id, order)
                if new_status_val == OrderStatus.DELIVERED.value:
                    await CRMService.trigger_event_automations(db, tenant_id, "order_delivered", order.id)
                elif new_status_val == OrderStatus.CONFIRMED.value:
                    await CRMService.trigger_event_automations(db, tenant_id, "order_confirmed", order.id)
            except Exception:
                pass

        return order

    @staticmethod
    async def update_order(
        db: AsyncSession,
        tenant_id: str,
        order_id: str,
        update_in: OrderUpdate,
    ) -> Order:
        """Update customer details, shipping fees, or notes."""
        order = await OrderService.get_order_detail(db, tenant_id, order_id)

        # Update address & customer fields
        for field in [
            "customer_name",
            "customer_phone",
            "customer_email",
            "shipping_address",
            "shipping_city",
            "shipping_zone",
            "internal_notes",
        ]:
            val = getattr(update_in, field)
            if val is not None:
                setattr(order, field, val)

        if update_in.payment_status:
            order.payment_status = update_in.payment_status.value

        # Recalculate financial totals if fee or discount changed
        if update_in.shipping_fee is not None or update_in.discount_amount is not None:
            if update_in.shipping_fee is not None:
                order.shipping_fee = update_in.shipping_fee
            if update_in.discount_amount is not None:
                order.discount_amount = update_in.discount_amount

            order.total_amount = order.subtotal - order.discount_amount + order.shipping_fee
            order.gross_profit = order.total_amount - (
                order.total_cogs + order.total_packaging_cost + order.total_handling_cost
            )

        await db.commit()
        await db.refresh(order, ["items", "status_history", "attribution"])
        order.item_count = len(order.items) if order.items else 0
        return order

    @staticmethod
    async def list_orders(
        db: AsyncSession,
        tenant_id: str,
        status_filter: Optional[str] = None,
        source_filter: Optional[str] = None,
        payment_status_filter: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Order]:
        """Query orders with multi-criteria filtering, search, and sorting."""
        stmt = (
            select(Order)
            .where(Order.tenant_id == tenant_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.attribution),
            )
            .order_by(desc(Order.order_date), desc(Order.created_at))
        )

        if status_filter:
            stmt = stmt.where(Order.status == status_filter)

        if source_filter:
            stmt = stmt.where(Order.source == source_filter)

        if payment_status_filter:
            stmt = stmt.where(Order.payment_status == payment_status_filter)

        if date_from:
            stmt = stmt.where(Order.order_date >= date_from)

        if date_to:
            stmt = stmt.where(Order.order_date <= date_to)

        if search:
            search_clean = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Order.order_number.ilike(search_clean),
                    Order.customer_name.ilike(search_clean),
                    Order.customer_phone.ilike(search_clean),
                    Order.external_order_id.ilike(search_clean),
                )
            )

        stmt = stmt.offset(skip).limit(limit)
        res = await db.execute(stmt)
        orders = list(res.scalars().all())

        for o in orders:
            o.item_count = len(o.items) if o.items else 0

        return orders

    @staticmethod
    async def get_order_kpis(db: AsyncSession, tenant_id: str) -> OrderKPIStats:
        """Calculate executive order metrics and status breakdown via a single consolidated SQL aggregation."""
        cache_key = f"orders:kpis:{tenant_id}"
        cached = await get_cache(cache_key)
        if cached:
            try:
                return OrderKPIStats(**cached)
            except Exception:
                pass

        stmt = select(
            func.count(Order.id).label("total_orders"),
            func.sum(case((Order.status == OrderStatus.PENDING.value, 1), else_=0)).label("pending"),
            func.sum(case((Order.status == OrderStatus.CONFIRMED.value, 1), else_=0)).label("confirmed"),
            func.sum(case((Order.status == OrderStatus.PROCESSING.value, 1), else_=0)).label("processing"),
            func.sum(case((Order.status == OrderStatus.IN_COURIER.value, 1), else_=0)).label("in_courier"),
            func.sum(case((Order.status == OrderStatus.DELIVERED.value, 1), else_=0)).label("delivered"),
            func.sum(case((Order.status == OrderStatus.CANCELLED.value, 1), else_=0)).label("cancelled"),
            func.sum(case((Order.status == OrderStatus.RETURNED.value, 1), else_=0)).label("returned"),
            func.sum(case((Order.status != OrderStatus.CANCELLED.value, Order.total_amount), else_=Decimal("0.00"))).label("revenue"),
            func.sum(case((Order.status != OrderStatus.CANCELLED.value, Order.total_cogs), else_=Decimal("0.00"))).label("cogs"),
            func.sum(case((Order.status != OrderStatus.CANCELLED.value, Order.gross_profit), else_=Decimal("0.00"))).label("profit"),
        ).where(Order.tenant_id == tenant_id)

        res = await db.execute(stmt)
        row = res.first()

        total_orders = int(row.total_orders or 0)
        pending = int(row.pending or 0)
        confirmed = int(row.confirmed or 0)
        processing = int(row.processing or 0)
        in_courier = int(row.in_courier or 0)
        delivered = int(row.delivered or 0)
        cancelled = int(row.cancelled or 0)
        returned = int(row.returned or 0)
        total_revenue = row.revenue or Decimal("0.00")
        total_cogs = row.cogs or Decimal("0.00")
        total_profit = row.profit or Decimal("0.00")

        # AOV and Delivery/Return Rates
        non_cancelled_orders = total_orders - cancelled
        aov = (
            round(total_revenue / Decimal(str(non_cancelled_orders)), 2)
            if non_cancelled_orders > 0
            else Decimal("0.00")
        )

        completed_deliveries = delivered + returned
        delivery_rate = (
            round((delivered / completed_deliveries) * 100, 2)
            if completed_deliveries > 0
            else 0.0
        )
        return_rate = (
            round((returned / completed_deliveries) * 100, 2)
            if completed_deliveries > 0
            else 0.0
        )

        kpis = OrderKPIStats(
            total_orders=total_orders,
            pending_orders=pending,
            confirmed_orders=confirmed,
            processing_orders=processing,
            in_courier_orders=in_courier,
            delivered_orders=delivered,
            cancelled_orders=cancelled,
            returned_orders=returned,
            total_revenue=total_revenue,
            total_cogs=total_cogs,
            total_gross_profit=total_profit,
            average_order_value=aov,
            delivery_rate_percent=delivery_rate,
            return_rate_percent=return_rate,
        )
        await set_cache(cache_key, kpis.model_dump(mode="json"), ttl_seconds=180)
        return kpis

    @staticmethod
    async def delete_order(db: AsyncSession, tenant_id: str, order_id: str) -> dict:
        """Deletes order. Cascades items, status history, and attribution."""
        order = await OrderService.get_order_detail(db, tenant_id, order_id)
        await db.delete(order)
        await db.commit()
        return {"message": f"Order #{order.order_number} deleted successfully"}

