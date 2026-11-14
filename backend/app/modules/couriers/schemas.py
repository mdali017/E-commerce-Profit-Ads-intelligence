from decimal import Decimal
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.modules.couriers.models import CourierProvider, ShipmentStatus


# ==========================================
# Courier Credential Schemas
# ==========================================
class CourierCredentialBase(BaseModel):
    provider: CourierProvider
    api_key: str = ""
    secret_key: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    user_id: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_sandbox: bool = False
    is_active: bool = True
    is_default: bool = False


class CourierCredentialCreate(CourierCredentialBase):
    pass


class CourierCredentialUpdate(BaseModel):
    api_key: Optional[str] = None
    secret_key: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    user_id: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_sandbox: Optional[bool] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class CourierCredentialResponse(BaseModel):
    id: str
    tenant_id: str
    provider: CourierProvider
    api_key: str
    secret_key: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    user_id: Optional[str] = None
    client_id: Optional[str] = None
    username: Optional[str] = None
    is_sandbox: bool = False
    has_secret: bool = False
    has_password: bool = False
    has_valid_token: bool = False
    token_expires_at: Optional[datetime] = None
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourierTestConnectionRequest(BaseModel):
    provider: CourierProvider
    api_key: Optional[str] = None
    secret_key: Optional[str] = None
    store_id: Optional[str] = None
    user_id: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_sandbox: Optional[bool] = None


class CourierTestConnectionResponse(BaseModel):
    success: bool
    provider: CourierProvider
    mode: str  # "live", "sandbox", "mock"
    message: str
    details: Dict[str, Any] = {}


# ==========================================
# Courier Shipment & Dispatch Schemas
# ==========================================
class BookShipmentRequest(BaseModel):
    order_id: str
    provider: CourierProvider = CourierProvider.STEADFAST
    custom_cod_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    # Structured location & parcel fields (Pathao / eCourier)
    recipient_city: Optional[str] = None
    recipient_zone: Optional[str] = None
    recipient_area: Optional[str] = None
    recipient_postcode: Optional[str] = None
    city_id: Optional[int] = None
    zone_id: Optional[int] = None
    area_id: Optional[int] = None
    item_weight: Decimal = Field(default=Decimal("0.50"), ge=Decimal("0.10"))
    delivery_type: int = 48  # Pathao: 48=Normal, 12=On-Demand
    package_code: Optional[str] = None
    payment_method: Optional[str] = None
    store_id: Optional[str] = None


class BulkDispatchRequest(BaseModel):
    order_ids: List[str] = Field(..., min_length=1, max_length=500)
    provider: CourierProvider = CourierProvider.STEADFAST
    notes: Optional[str] = None
    delivery_type: int = 48
    item_weight: Decimal = Field(default=Decimal("0.50"), ge=Decimal("0.10"))


class BulkDispatchItemResult(BaseModel):
    order_id: str
    order_number: Optional[str] = None
    success: bool
    consignment_id: Optional[str] = None
    tracking_code: Optional[str] = None
    shipment_id: Optional[str] = None
    error: Optional[str] = None


class BulkDispatchResponse(BaseModel):
    provider: CourierProvider
    total_requested: int
    succeeded_count: int
    failed_count: int
    results: List[BulkDispatchItemResult]


class CourierTrackingEventResponse(BaseModel):
    id: str
    event_status: str
    raw_status: Optional[str] = None
    message: str
    location: Optional[str] = None
    source: str = "system"
    timestamp: datetime

    class Config:
        from_attributes = True


class CourierShipmentResponse(BaseModel):
    id: str
    tenant_id: str
    order_id: str
    provider: CourierProvider
    consignment_id: str
    tracking_code: Optional[str] = None
    invoice_number: Optional[str] = None
    status: ShipmentStatus
    raw_status: Optional[str] = None
    recipient_name: str
    recipient_phone: str
    recipient_address: str
    recipient_city: Optional[str] = None
    recipient_zone: Optional[str] = None
    recipient_area: Optional[str] = None
    recipient_postcode: Optional[str] = None
    city_id: Optional[int] = None
    zone_id: Optional[int] = None
    area_id: Optional[int] = None
    item_weight: Decimal = Decimal("0.50")
    delivery_type: int = 48
    cod_amount: Decimal
    collected_amount: Decimal
    delivery_fee: Decimal
    cod_fee: Decimal
    return_fee: Decimal
    is_settled: bool
    settled_at: Optional[datetime] = None
    settlement_id: Optional[str] = None
    delivery_date: Optional[datetime] = None
    estimated_delivery_date: Optional[datetime] = None
    last_polled_at: Optional[datetime] = None
    hub_name: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tracking_events: List[CourierTrackingEventResponse] = []

    class Config:
        from_attributes = True


class CancelShipmentRequest(BaseModel):
    reason: Optional[str] = "Cancelled by merchant"


# ==========================================
# Fraud Check & Balance Schemas
# ==========================================
class FraudCheckResponse(BaseModel):
    phone: str
    total_parcels: int
    total_delivered: int
    total_cancelled: int
    fraud_reports: int
    success_rate: float
    risk_level: str  # "low", "medium", "high", "no_history"
    internal_total_orders: int = 0
    internal_delivered_orders: int = 0
    internal_returned_orders: int = 0
    source: str = "steadfast+crm"
    summary: str


class SteadfastBalanceResponse(BaseModel):
    provider: str = "steadfast"
    current_balance: Decimal
    currency: str = "BDT"
    mode: str = "live"


# ==========================================
# Location & Pricing Schemas
# ==========================================
class LocationOption(BaseModel):
    id: Optional[int] = None
    name: str
    code: Optional[str] = None
    extra: Dict[str, Any] = {}


class PathaoPriceRequest(BaseModel):
    store_id: Optional[str] = None
    item_type: int = 2
    delivery_type: int = 48
    item_weight: float = 0.5
    recipient_city: int
    recipient_zone: int


class PathaoPriceResponse(BaseModel):
    price: Decimal
    discount: Decimal = Decimal("0.00")
    promo_discount: Decimal = Decimal("0.00")
    final_price: Decimal
    cod_enabled: bool = True
    mode: str = "live"


# ==========================================
# Courier KPI & Analytics Schemas
# ==========================================
class CourierKPIStats(BaseModel):
    total_shipments: int
    booked_count: int
    in_transit_count: int
    delivered_count: int
    returned_count: int
    cancelled_count: int

    delivery_success_rate: float
    return_rate: float

    total_cod_amount: Decimal
    total_collected_amount: Decimal
    total_delivery_fees: Decimal
    total_courier_charges: Decimal
    unsettled_balance: Decimal
    avg_delivery_hours: Optional[float] = None


class ProviderPerformanceItem(BaseModel):
    provider: CourierProvider
    total_shipments: int
    booked_count: int
    in_transit_count: int
    delivered_count: int
    returned_count: int
    cancelled_count: int
    delivery_rate: float
    return_rate: float
    total_cod: Decimal
    total_collected: Decimal
    total_fees: Decimal
    avg_delivery_fee: Decimal
    avg_delivery_hours: Optional[float] = None


class DailyCourierTrendPoint(BaseModel):
    date: str
    booked: int
    delivered: int
    returned: int
    cod_collected: Decimal


class DeliveryPerformanceAnalyticsResponse(BaseModel):
    days: int
    overall_delivery_rate: float
    overall_return_rate: float
    avg_delivery_hours: Optional[float] = None
    providers: List[ProviderPerformanceItem]
    daily_trend: List[DailyCourierTrendPoint]


class ProviderCostBreakdown(BaseModel):
    provider: CourierProvider
    shipment_count: int
    delivery_fees: Decimal
    cod_fees: Decimal
    return_fees: Decimal
    total_cost: Decimal
    avg_cost_per_shipment: Decimal
    cost_to_collected_ratio: float


class CostAnalysisResponse(BaseModel):
    days: int
    total_delivery_fees: Decimal
    total_cod_fees: Decimal
    total_return_fees: Decimal
    total_courier_cost: Decimal
    by_provider: List[ProviderCostBreakdown]


class CityPerformanceItem(BaseModel):
    city: str
    total_shipments: int
    delivered_count: int
    returned_count: int
    delivery_rate: float
    return_rate: float
    avg_delivery_fee: Decimal


# ==========================================
# Settlement Schemas
# ==========================================
class CourierSettlementCreate(BaseModel):
    provider: CourierProvider
    settlement_number: str
    shipment_ids: List[str] = Field(..., min_length=1)
    payout_date: Optional[datetime] = None
    status: str = "PAID"
    reference_number: Optional[str] = None
    bank_account: Optional[str] = None
    notes: Optional[str] = None


class CourierSettlementUpdate(BaseModel):
    status: Optional[str] = None
    reference_number: Optional[str] = None
    bank_account: Optional[str] = None
    notes: Optional[str] = None


class CourierSettlementResponse(BaseModel):
    id: str
    tenant_id: str
    provider: CourierProvider
    settlement_number: str
    total_collected_amount: Decimal
    total_delivery_fees: Decimal
    total_cod_fees: Decimal
    net_payout_amount: Decimal
    shipment_count: int
    payout_date: datetime
    status: str
    reference_number: Optional[str] = None
    bank_account: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourierSettlementDetailResponse(CourierSettlementResponse):
    shipments: List[CourierShipmentResponse] = []
