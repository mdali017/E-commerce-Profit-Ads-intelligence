from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Header, Request, HTTPException, status
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
from app.modules.orders.woocommerce import WooCommerceConnector
from app.modules.orders.connectors import (
    UniversalCustomStoreConnector,
    ShopifyConnector,
    SampleStoreOrderGenerator,
)
from app.modules.orders.sync import OrderSyncQueueService

router = APIRouter(prefix="/orders", tags=["Orders & Ingestion"])


@router.post(
    "/sync/backfill-cogs",
    summary="Trigger Retroactive COGS Backfill Queue",
)
async def backfill_order_cogs(
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Background batch process that matches uncosted order items against
    updated catalog products by SKU, updates snapshot COGS, and re-locks gross profit.
    """
    return await OrderSyncQueueService.retroactive_cogs_backfill(
        db=db, tenant_id=context.tenant_id
    )



@router.post(
    "/webhook/woocommerce",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="WooCommerce Realtime Webhook Ingestion",
)
async def woocommerce_webhook(
    request: Request,
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_wc_webhook_signature: Optional[str] = Header(None, alias="X-WC-Webhook-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest orders in real-time from WooCommerce webhooks.
    Validates HMAC signature, maps WooCommerce schema to canonical Order,
    resolves catalog COGS, and prevents duplicate submissions via idempotency.
    """
    effective_tenant_id = tenant_id or x_tenant_id
    if not effective_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id query parameter or X-Tenant-ID header is required for WooCommerce webhook.",
        )

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload.",
        )

    return await WooCommerceConnector.ingest_webhook_order(
        db=db,
        tenant_id=effective_tenant_id,
        payload=payload,
    )


@router.post(
    "/webhook/custom",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Universal Custom Store Webhook Ingestion",
)
async def custom_store_webhook(
    request: Request,
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest orders from custom websites (PHP, Laravel, Next.js, React, HTML, Node.js, Wix).
    Automatically maps line items to the product catalog, snapshots COGS, and calculates profit.
    """
    effective_tenant_id = tenant_id or x_tenant_id
    if not effective_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id query parameter or X-Tenant-ID header is required for custom store webhook.",
        )

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload.",
        )

    return await UniversalCustomStoreConnector.ingest_custom_order(
        db=db,
        tenant_id=effective_tenant_id,
        payload=payload,
    )


@router.post(
    "/webhook/shopify",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Shopify Realtime Webhook Ingestion",
)
async def shopify_webhook(
    request: Request,
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest orders in real-time from Shopify webhooks (orders/create).
    Normalizes Shopify payload, resolves catalog COGS, and locks gross profit.
    """
    effective_tenant_id = tenant_id or x_tenant_id
    if not effective_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id query parameter or X-Tenant-ID header is required for Shopify webhook.",
        )

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload.",
        )

    return await ShopifyConnector.ingest_webhook_order(
        db=db,
        tenant_id=effective_tenant_id,
        payload=payload,
    )


@router.post(
    "/webhook/test-sample",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Simulate Sample Order for Any Platform",
)
async def simulate_test_order(
    platform: str = Query("woocommerce", description="Platform type: woocommerce, custom, shopify, wix, nextjs, php"),
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Simulate and ingest a realistic sample order for any platform.
    Allows users to verify integrations immediately on their dashboard with 1 click.
    """
    effective_tenant_id = tenant_id or x_tenant_id
    if not effective_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id query parameter or X-Tenant-ID header is required.",
        )

    return await SampleStoreOrderGenerator.simulate_test_order(
        db=db,
        tenant_id=effective_tenant_id,
        platform=platform,
    )


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
