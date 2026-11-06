from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_tenant_context,
    require_roles,
    TenantContext,
)
from app.modules.workspaces.models import UserRole
from app.modules.couriers.models import CourierProvider, ShipmentStatus
from app.modules.couriers.schemas import (
    CourierCredentialCreate,
    CourierCredentialResponse,
    BookShipmentRequest,
    CourierShipmentResponse,
    CourierKPIStats,
)
from app.modules.couriers.service import CourierService

router = APIRouter(prefix="/couriers", tags=["Courier Integration & Operations"])


# ==========================================
# Courier Credentials Management
# ==========================================
@router.post(
    "/credentials",
    response_model=CourierCredentialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Courier API Credentials",
)
async def save_courier_credential(
    credential_in: CourierCredentialCreate,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Save API Key & Secret for Steadfast, Pathao, or RedX."""
    return await CourierService.save_credential(db, context.tenant_id, credential_in)


@router.get(
    "/credentials",
    response_model=List[CourierCredentialResponse],
    summary="List Configured Courier Credentials",
)
async def list_courier_credentials(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all configured courier connectors for the active workspace."""
    return await CourierService.get_credentials(db, context.tenant_id)


# ==========================================
# Order Dispatch & Shipments
# ==========================================
@router.post(
    "/dispatch",
    response_model=CourierShipmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch Order to Courier (One-Click)",
)
async def dispatch_order(
    request_in: BookShipmentRequest,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Automated one-click parcel booking.
    Calls Steadfast/Pathao API, generates consignment tracking code,
    and updates Order status to IN_COURIER.
    """
    return await CourierService.dispatch_order(
        db, context.tenant_id, request_in, user_id=context.user.id
    )


@router.get(
    "/shipments",
    response_model=List[CourierShipmentResponse],
    summary="List Courier Shipments",
)
async def list_shipments(
    provider: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search by consignment ID, tracking code, phone, or name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """List all courier shipments with filtering and search."""
    return await CourierService.list_shipments(
        db,
        context.tenant_id,
        provider=provider,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/shipments/{shipment_id}",
    response_model=CourierShipmentResponse,
    summary="Get Courier Shipment Details & Tracking Timeline",
)
async def get_shipment_detail(
    shipment_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full shipment record including tracking event history."""
    return await CourierService.get_shipment_detail(db, context.tenant_id, shipment_id)


@router.get(
    "/stats/kpis",
    response_model=CourierKPIStats,
    summary="Get Courier Executive KPIs",
)
async def get_courier_kpis(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Delivery success rate, return rate, COD cash collectable vs collected, and unsettled balance."""
    return await CourierService.get_courier_kpis(db, context.tenant_id)


# ==========================================
# Realtime Webhook Listeners
# ==========================================
@router.post(
    "/webhook/steadfast",
    summary="Steadfast Realtime Webhook Ingestion",
)
async def steadfast_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Listens for Steadfast parcel status updates (Delivered, Returned, In Transit)."""
    payload = await request.json()
    return await CourierService.process_courier_webhook(
        db, CourierProvider.STEADFAST, payload
    )


@router.post(
    "/webhook/pathao",
    summary="Pathao Realtime Webhook Ingestion",
)
async def pathao_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Listens for Pathao parcel status updates (Delivered, Returned, In Transit)."""
    payload = await request.json()
    return await CourierService.process_courier_webhook(
        db, CourierProvider.PATHAO, payload
    )
