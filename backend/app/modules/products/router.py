from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_tenant_context,
    require_roles,
    TenantContext,
)
from app.modules.workspaces.models import UserRole
from app.modules.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductDetailResponse,
    ProductVariantCreate,
    ProductVariantUpdate,
    ProductVariantResponse,
    ProductCostUpdate,
    CostCoverageStats,
)
from app.modules.products.service import ProductService

router = APIRouter(prefix="/products", tags=["Products & Cost Management (COGS)"])


@router.post(
    "/",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Product",
)
async def create_product(
    product_in: ProductCreate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new product with optional variants and initial cost price.
    Automatically captures first entry into cost history.
    """
    return await ProductService.create_product(db, context.tenant_id, product_in)


@router.get(
    "/",
    response_model=List[ProductResponse],
    summary="List Products with Filters",
)
async def list_products(
    search: Optional[str] = Query(None, description="Search by product name or SKU"),
    category: Optional[str] = Query(None, description="Filter by category"),
    has_cost: Optional[bool] = Query(
        None, description="Filter products with cost (true) or missing cost (false)"
    ),
    is_active: Optional[bool] = Query(None, description="Filter active/inactive products"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """
    List all products in the active workspace.
    Includes computed gross profit and margin percentage per unit.
    """
    products, _ = await ProductService.list_products(
        db,
        context.tenant_id,
        search=search,
        category=category,
        has_cost=has_cost,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return products


@router.get(
    "/stats/cost-coverage",
    response_model=CostCoverageStats,
    summary="Get Cost Coverage Indicator",
)
async def get_cost_coverage_stats(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns cost coverage metrics (e.g. 85.5% coverage).
    Crucial for warning users about incomplete P&L profit figures.
    """
    return await ProductService.get_cost_coverage_stats(db, context.tenant_id)


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    summary="Get Product Detail",
)
async def get_product_detail(
    product_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full product details including variants and cost history timeline."""
    return await ProductService.get_product_detail(db, context.tenant_id, product_id)


@router.patch(
    "/{product_id}",
    response_model=ProductDetailResponse,
    summary="Update Product",
)
async def update_product(
    product_id: str,
    update_in: ProductUpdate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update product details. If cost_price is changed,
    it automatically logs a cost history snapshot.
    """
    return await ProductService.update_product(
        db, context.tenant_id, product_id, update_in
    )


@router.post(
    "/{product_id}/cost",
    response_model=ProductDetailResponse,
    summary="Update Cost Price with Reason",
)
async def update_product_cost_price(
    product_id: str,
    cost_in: ProductCostUpdate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Explicitly updates base product or variant cost price with an audit reason
    (e.g., 'New supplier shipment batch #14').
    """
    return await ProductService.update_cost_price(
        db, context.tenant_id, product_id, cost_in
    )


@router.delete(
    "/{product_id}",
    summary="Delete Product",
)
async def delete_product(
    product_id: str,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Delete product and its variants. Requires OWNER or ADMIN."""
    return await ProductService.delete_product(db, context.tenant_id, product_id)


# ==========================================
# Variant Endpoints
# ==========================================
@router.post(
    "/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Product Variant",
)
async def add_product_variant(
    product_id: str,
    variant_in: ProductVariantCreate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a new variant (e.g. size/color) to an existing product."""
    return await ProductService.add_variant(
        db, context.tenant_id, product_id, variant_in
    )


@router.patch(
    "/{product_id}/variants/{variant_id}",
    response_model=ProductVariantResponse,
    summary="Update Product Variant",
)
async def update_product_variant(
    product_id: str,
    variant_id: str,
    update_in: ProductVariantUpdate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update variant price, cost, stock, or attributes."""
    return await ProductService.update_variant(
        db, context.tenant_id, product_id, variant_id, update_in
    )


@router.delete(
    "/{product_id}/variants/{variant_id}",
    summary="Delete Product Variant",
)
async def delete_product_variant(
    product_id: str,
    variant_id: str,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a variant from a product."""
    return await ProductService.delete_variant(
        db, context.tenant_id, product_id, variant_id
    )
