from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.modules.orders.models import (
    OrderSource,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    AttributionConfidence,
)


# ==========================================
# Order Item Schemas
# ==========================================
class OrderItemBase(BaseModel):
    product_name: str
    variant_name: Optional[str] = None
    sku: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    unit_cost_price: Optional[Decimal] = None
    unit_packaging_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    unit_handling_cost: Decimal = Field(default=Decimal("0.00"), ge=0)


class OrderItemCreate(OrderItemBase):
    product_id: Optional[str] = None
    variant_id: Optional[str] = None


class OrderItemResponse(OrderItemBase):
    id: str
    order_id: str
    product_id: Optional[str] = None
    variant_id: Optional[str] = None
    total_price: Decimal
    total_cost: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Marketing Attribution Schemas
# ==========================================
class OrderAttributionCreate(BaseModel):
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    fbclid: Optional[str] = None
    campaign_id: Optional[str] = None
    adset_id: Optional[str] = None
    ad_id: Optional[str] = None
    attribution_confidence: AttributionConfidence = AttributionConfidence.ORGANIC


class OrderAttributionResponse(BaseModel):
    id: str
    order_id: str
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    fbclid: Optional[str] = None
    campaign_id: Optional[str] = None
    adset_id: Optional[str] = None
    ad_id: Optional[str] = None
    attribution_confidence: str

    class Config:
        from_attributes = True


# ==========================================
# Order Status History Schemas
# ==========================================
class OrderStatusHistoryResponse(BaseModel):
    id: str
    order_id: str
    from_status: Optional[str] = None
    to_status: str
    changed_by_user_id: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Order Main Schemas
# ==========================================
class OrderBase(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    shipping_address: str
    shipping_city: Optional[str] = None
    shipping_zone: Optional[str] = None
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    source: OrderSource = OrderSource.MANUAL
    payment_method: PaymentMethod = PaymentMethod.COD
    payment_status: PaymentStatus = PaymentStatus.PENDING
    shipping_fee: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)


class OrderCreate(OrderBase):
    external_order_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    order_date: Optional[datetime] = None
    items: List[OrderItemCreate]
    attribution: Optional[OrderAttributionCreate] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    reason: Optional[str] = "Status updated via dashboard"


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_zone: Optional[str] = None
    shipping_fee: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    payment_status: Optional[PaymentStatus] = None
    internal_notes: Optional[str] = None


class OrderResponse(OrderBase):
    id: str
    tenant_id: str
    order_number: str
    status: str
    source: str
    payment_method: str
    payment_status: str
    subtotal: Decimal
    total_amount: Decimal
    total_cogs: Decimal
    total_packaging_cost: Decimal
    total_handling_cost: Decimal
    gross_profit: Decimal
    external_order_id: Optional[str] = None
    order_date: datetime
    created_at: datetime
    updated_at: datetime
    item_count: Optional[int] = 0

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []
    attribution: Optional[OrderAttributionResponse] = None

    class Config:
        from_attributes = True


# ==========================================
# Order KPI Summary Statistics
# ==========================================
class OrderKPIStats(BaseModel):
    total_orders: int
    pending_orders: int
    confirmed_orders: int
    processing_orders: int
    in_courier_orders: int
    delivered_orders: int
    cancelled_orders: int
    returned_orders: int

    total_revenue: Decimal
    total_cogs: Decimal
    total_gross_profit: Decimal
    average_order_value: Decimal

    delivery_rate_percent: float
    return_rate_percent: float

