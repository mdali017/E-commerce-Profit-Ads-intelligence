import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_tenant_context,
    require_roles,
    TenantContext,
)
from app.modules.workspaces.models import UserRole
from app.modules.couriers.models import CourierProvider
from app.modules.couriers.schemas import (
    CourierCredentialCreate,
    CourierCredentialResponse,
    CourierTestConnectionRequest,
    CourierTestConnectionResponse,
    BookShipmentRequest,
    BulkDispatchRequest,
    BulkDispatchResponse,
    CancelShipmentRequest,
    CourierShipmentResponse,
    CourierKPIStats,
    FraudCheckResponse,
    SteadfastBalanceResponse,
    PathaoPriceRequest,
    PathaoPriceResponse,
    DeliveryPerformanceAnalyticsResponse,
    CostAnalysisResponse,
    CityPerformanceItem,
    CourierSettlementCreate,
    CourierSettlementUpdate,
    CourierSettlementResponse,
    CourierSettlementDetailResponse,
)
from app.modules.couriers.service import CourierService
from app.modules.couriers.connectors.pathao import PathaoConnector
from app.modules.couriers.connectors.ecourier import ECourierConnector
from app.modules.couriers.polling import poll_active_shipments

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
    """Save or update API / OAuth credentials for Steadfast, Pathao, or eCourier."""
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
    """Retrieve all configured courier connectors (secrets masked) for the active workspace."""
    return await CourierService.get_credentials(db, context.tenant_id)


@router.delete(
    "/credentials/{credential_id}",
    summary="Delete Courier Credential",
)
async def delete_courier_credential(
    credential_id: str,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.delete_credential(db, context.tenant_id, credential_id)


@router.post(
    "/credentials/test",
    response_model=CourierTestConnectionResponse,
    summary="Test Courier API Credentials",
)
async def test_courier_connection(
    req: CourierTestConnectionRequest,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Tests connectivity and authentication against Steadfast, Pathao OAuth, or eCourier."""
    return await CourierService.test_connection(db, context.tenant_id, req)


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
    Automated parcel booking with Steadfast, Pathao, or eCourier.
    Generates consignment tracking code and transitions Order status to IN_COURIER.
    """
    return await CourierService.dispatch_order(
        db, context.tenant_id, request_in, user_id=context.user.id
    )


@router.post(
    "/shipments/book",
    response_model=CourierShipmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch Order (Compatibility Alias)",
)
async def book_shipment_alias(
    request_in: BookShipmentRequest,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.dispatch_order(
        db, context.tenant_id, request_in, user_id=context.user.id
    )


@router.post(
    "/dispatch/bulk",
    response_model=BulkDispatchResponse,
    summary="Bulk Dispatch Multiple Orders",
)
async def bulk_dispatch_orders(
    req: BulkDispatchRequest,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Dispatches up to 500 confirmed orders in a single batch."""
    return await CourierService.bulk_dispatch_orders(
        db, context.tenant_id, req, user_id=context.user.id
    )


@router.get(
    "/shipments",
    response_model=List[CourierShipmentResponse],
    summary="List Courier Shipments",
)
async def list_shipments(
    provider: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_settled: Optional[bool] = Query(None),
    days: Optional[int] = Query(None, ge=1, le=365),
    search: Optional[str] = Query(None, description="Search by consignment ID, tracking code, phone, or name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """List all courier shipments with filtering and search."""
    return await CourierService.list_shipments(
        db,
        context.tenant_id,
        provider=provider,
        status=status,
        is_settled=is_settled,
        days=days,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/shipments/order/{order_id}",
    response_model=Optional[CourierShipmentResponse],
    summary="Get Latest Courier Shipment for Order",
)
async def get_shipment_by_order(
    order_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_shipment_by_order(db, context.tenant_id, order_id)


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


@router.post(
    "/shipments/{shipment_id}/sync",
    response_model=CourierShipmentResponse,
    summary="Sync Live Tracking Status from Courier API",
)
async def sync_shipment_status(
    shipment_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.sync_shipment_status(db, context.tenant_id, shipment_id)


@router.post(
    "/shipments/{shipment_id}/cancel",
    response_model=CourierShipmentResponse,
    summary="Cancel Active Courier Shipment",
)
async def cancel_shipment(
    shipment_id: str,
    req: Optional[CancelShipmentRequest] = None,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.cancel_shipment(
        db, context.tenant_id, shipment_id, reason=req.reason if req else None
    )


@router.post(
    "/sync/poll",
    summary="Poll Active Shipments for Live Status Updates",
)
async def trigger_courier_polling(
    provider: Optional[CourierProvider] = Query(CourierProvider.ECOURIER),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Manually triggers background status polling (essential for eCourier)."""
    return await poll_active_shipments(db, tenant_id=context.tenant_id, provider=provider)


# ==========================================
# KPIs, Fraud Check & Balance
# ==========================================
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


@router.get(
    "/kpis",
    response_model=CourierKPIStats,
    summary="Get Courier KPIs (Alias)",
)
async def get_courier_kpis_alias(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_courier_kpis(db, context.tenant_id)


@router.get(
    "/fraud-check/{phone}",
    response_model=FraudCheckResponse,
    summary="Check Customer Fraud & Return Risk Score",
)
async def check_customer_fraud(
    phone: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Combines Steadfast parcel delivery history with internal workspace CRM order history."""
    return await CourierService.fraud_check(db, context.tenant_id, phone)


@router.get(
    "/balance/steadfast",
    response_model=SteadfastBalanceResponse,
    summary="Get Steadfast Merchant Account Balance",
)
async def get_steadfast_balance(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    bal = await CourierService.get_steadfast_balance(db, context.tenant_id)
    return SteadfastBalanceResponse(
        current_balance=bal["current_balance"],
        mode=bal.get("mode", "live"),
    )


# ==========================================
# Location & Pricing Endpoints (Pathao & eCourier)
# ==========================================
@router.get("/locations/pathao/stores", summary="Get Pathao Merchant Stores")
async def pathao_stores(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.PATHAO)
    return await PathaoConnector().get_stores(cred, db=db)


@router.get("/locations/pathao/cities", summary="Get Pathao Supported Cities")
async def pathao_cities(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.PATHAO)
    return await PathaoConnector().get_cities(cred, db=db)


@router.get("/locations/pathao/cities/{city_id}/zones", summary="Get Pathao Zones by City")
async def pathao_zones(
    city_id: int,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.PATHAO)
    return await PathaoConnector().get_zones(cred, city_id, db=db)


@router.get("/locations/pathao/zones/{zone_id}/areas", summary="Get Pathao Areas by Zone")
async def pathao_areas(
    zone_id: int,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.PATHAO)
    return await PathaoConnector().get_areas(cred, zone_id, db=db)


@router.post(
    "/pricing/pathao",
    response_model=PathaoPriceResponse,
    summary="Calculate Pathao Delivery Price Estimate",
)
async def pathao_calculate_price(
    req: PathaoPriceRequest,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.PATHAO)
    res = await PathaoConnector().calculate_price(
        credential=cred,
        store_id=req.store_id,
        item_type=req.item_type,
        delivery_type=req.delivery_type,
        item_weight=req.item_weight,
        recipient_city=req.recipient_city,
        recipient_zone=req.recipient_zone,
        db=db,
    )
    return PathaoPriceResponse(**res)


@router.get("/locations/ecourier/cities", summary="Get eCourier Cities")
async def ecourier_cities(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.ECOURIER)
    return await ECourierConnector().get_cities(cred)


@router.get("/locations/ecourier/thanas", summary="Get eCourier Thanas by City")
async def ecourier_thanas(
    city: str = Query(...),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.ECOURIER)
    return await ECourierConnector().get_thanas(cred, city)


@router.get("/locations/ecourier/postcodes", summary="Get eCourier Postcodes by City & Thana")
async def ecourier_postcodes(
    city: str = Query(...),
    thana: str = Query(...),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.ECOURIER)
    return await ECourierConnector().get_postcodes(cred, city, thana)


@router.get("/locations/ecourier/areas", summary="Get eCourier Areas by Postcode")
async def ecourier_areas(
    postcode: str = Query(...),
    city: Optional[str] = Query(None),
    thana: Optional[str] = Query(None),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.ECOURIER)
    return await ECourierConnector().get_areas(cred, postcode, city=city, thana=thana)


@router.get("/locations/ecourier/packages", summary="Get eCourier Delivery Packages")
async def ecourier_packages(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    cred = await CourierService.get_optional_credential(db, context.tenant_id, CourierProvider.ECOURIER)
    return await ECourierConnector().get_packages(cred)


# ==========================================
# Courier Analytics Endpoints
# ==========================================
@router.get(
    "/analytics/delivery-performance",
    response_model=DeliveryPerformanceAnalyticsResponse,
    summary="Provider Comparison & Daily Delivery Trend",
)
async def analytics_delivery_performance(
    days: int = Query(30, ge=1, le=365),
    provider: Optional[str] = Query(None),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_delivery_performance(db, context.tenant_id, days=days, provider=provider)


@router.get(
    "/analytics/cost-analysis",
    response_model=CostAnalysisResponse,
    summary="Courier Cost Breakdown by Provider",
)
async def analytics_cost_analysis(
    days: int = Query(30, ge=1, le=365),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_cost_analysis(db, context.tenant_id, days=days)


@router.get(
    "/analytics/city-performance",
    response_model=List[CityPerformanceItem],
    summary="City-Wise Delivery & Return Performance",
)
async def analytics_city_performance(
    days: int = Query(30, ge=1, le=365),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_city_performance(db, context.tenant_id, days=days)


@router.get(
    "/analytics/stale-shipments",
    response_model=List[CourierShipmentResponse],
    summary="Stale Shipments Requiring Attention",
)
async def analytics_stale_shipments(
    hours: int = Query(48, ge=1, le=720),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_stale_shipments(db, context.tenant_id, hours=hours)


# ==========================================
# COD Settlement Management
# ==========================================
@router.get(
    "/settlements",
    response_model=List[CourierSettlementResponse],
    summary="List Courier COD Settlements",
)
async def list_settlements(
    provider: Optional[str] = Query(None),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.list_settlements(db, context.tenant_id, provider=provider)


@router.get(
    "/settlements/unsettled",
    response_model=List[CourierShipmentResponse],
    summary="List Delivered Shipments Pending Settlement",
)
async def list_unsettled_shipments(
    provider: Optional[str] = Query(None),
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_unsettled_shipments(db, context.tenant_id, provider=provider)


@router.post(
    "/settlements",
    response_model=CourierSettlementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Courier COD Settlement & Reconcile Shipments",
)
async def create_settlement(
    req: CourierSettlementCreate,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.create_settlement(db, context.tenant_id, req)


@router.get(
    "/settlements/{settlement_id}",
    response_model=CourierSettlementDetailResponse,
    summary="Get Settlement Details & Included Shipments",
)
async def get_settlement_detail(
    settlement_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.get_settlement_detail(db, context.tenant_id, settlement_id)


@router.patch(
    "/settlements/{settlement_id}",
    response_model=CourierSettlementResponse,
    summary="Update Settlement Status or Notes",
)
async def update_settlement(
    settlement_id: str,
    req: CourierSettlementUpdate,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    return await CourierService.update_settlement(db, context.tenant_id, settlement_id, req)


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
    raw_body = await request.body()
    payload: Dict[str, Any] = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    return await CourierService.process_courier_webhook(
        db,
        CourierProvider.STEADFAST,
        payload,
        headers=dict(request.headers),
        raw_body=raw_body,
    )


@router.post(
    "/webhook/pathao",
    summary="Pathao Realtime Webhook Ingestion",
)
async def pathao_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Listens for Pathao parcel status updates with X-PATHAO-Signature verification."""
    raw_body = await request.body()
    payload: Dict[str, Any] = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    return await CourierService.process_courier_webhook(
        db,
        CourierProvider.PATHAO,
        payload,
        headers=dict(request.headers),
        raw_body=raw_body,
    )


@router.post(
    "/webhook/ecourier",
    summary="eCourier Webhook Ingestion",
)
async def ecourier_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Listens for eCourier status callbacks (whitelisted via eCourier support)."""
    raw_body = await request.body()
    payload: Dict[str, Any] = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    return await CourierService.process_courier_webhook(
        db,
        CourierProvider.ECOURIER,
        payload,
        headers=dict(request.headers),
        raw_body=raw_body,
    )
