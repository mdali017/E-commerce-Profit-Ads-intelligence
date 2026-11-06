from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.modules.couriers.models import CourierProvider, ShipmentStatus


# ==========================================
# Courier Credential Schemas
# ==========================================
class CourierCredentialBase(BaseModel):
    provider: CourierProvider
    api_key: str
    secret_key: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    is_active: bool = True
    is_default: bool = False


class CourierCredentialCreate(CourierCredentialBase):
    pass


class CourierCredentialUpdate(BaseModel):
    api_key: Optional[str] = None
    secret_key: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class CourierCredentialResponse(CourierCredentialBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Courier Shipment Schemas
# ==========================================
class BookShipmentRequest(BaseModel):
    order_id: str
    provider: CourierProvider = CourierProvider.STEADFAST
    custom_cod_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class CourierTrackingEventResponse(BaseModel):
    id: str
    event_status: str
    message: str
    location: Optional[str] = None
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
    cod_amount: Decimal
    collected_amount: Decimal
    delivery_fee: Decimal
    cod_fee: Decimal
    return_fee: Decimal
    is_settled: bool
    settled_at: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tracking_events: List[CourierTrackingEventResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# Courier KPI Summary Statistics
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

