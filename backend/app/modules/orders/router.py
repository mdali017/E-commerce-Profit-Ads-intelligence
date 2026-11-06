from datetime import datetime
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
from app.modules.orders.schemas import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderDetailResponse,
    OrderKPIStats,
)
from app.modules.orders.service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders & Ingestion"])


@router.post(
    "/",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create / Ingest Order",
)
async def create_order(
    order_in: OrderCreate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.MARKETER, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new order (Manual F-Commerce entry or WooCommerce Ingestion).
    Automatically maps line items to the product catalog, snapshots COGS, and calculates profit.
    """
    return await OrderService.create_order(
        db, context.tenant_id, order_in, user_id=context.user.id
    )


@router.get(
    "/stats/kpis",
    response_model=OrderKPIStats,
    summary="Get Order Executive KPI Stats",
)
async def get_order_kpis(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns order totals, status distribution, revenue, COGS, and delivery/return rates.
    """
    return await OrderService.get_order_kpis(db, context.tenant_id)


@router.get(
    "/",
    response_model=List[OrderResponse],
    summary="List Orders with Filters",
)
async def list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    source_filter: Optional[str] = Query(None, alias="source"),
    payment_status_filter: Optional[str] = Query(None, alias="payment_status"),
    search: Optional[str] = Query(None, description="Search by order number, customer name, phone, or external ID"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """List orders with multi-criteria filtering, search, and pagination."""
    return await OrderService.list_orders(
        db,
        context.tenant_id,
        status_filter=status_filter,
        source_filter=source_filter,
        payment_status_filter=payment_status_filter,
        search=search,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
    summary="Get Order Detail",
)
async def get_order_detail(
    order_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full order details including line items, status history timeline, and marketing attribution."""
    return await OrderService.get_order_detail(db, context.tenant_id, order_id)


@router.patch(
    "/{order_id}/status",
    response_model=OrderDetailResponse,
    summary="Update Order Status",
)
async def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update order lifecycle status (e.g. Phone call confirmation: PENDING -> CONFIRMED).
    Automatically logs an audit record in order_status_history.
    """
    return await OrderService.update_order_status(
        db, context.tenant_id, order_id, status_in, user_id=context.user.id
    )


@router.patch(
    "/{order_id}",
    response_model=OrderDetailResponse,
    summary="Update Order Details",
)
async def update_order(
    order_id: str,
    update_in: OrderUpdate,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update customer details, shipping fees, or notes."""
    return await OrderService.update_order(db, context.tenant_id, order_id, update_in)


@router.delete(
    "/{order_id}",
    summary="Delete Order",
)
async def delete_order(
    order_id: str,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Delete an order and its items. Requires OWNER or ADMIN role."""
    return await OrderService.delete_order(db, context.tenant_id, order_id)
