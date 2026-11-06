from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field
from app.modules.crm.models import CustomerSegment, SMSProvider, SMSTriggerEvent, SMSMessageStatus


# ==========================================
# Customer CRM Schemas
# ==========================================

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    tags: Optional[List[str]] = None
    opted_out_marketing: Optional[bool] = None
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None

    total_orders: int
    delivered_orders: int
    returned_orders: int
    cancelled_orders: int

    total_spent: Decimal
    average_order_value: Decimal
    return_risk_score: float
    is_repeat_customer: bool
    segment: str
    tags: List[str]

    opted_out_marketing: bool
    first_order_date: Optional[datetime] = None
    last_order_date: Optional[datetime] = None
    notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerRecentOrder(BaseModel):
    id: str
    order_number: str
    status: str
    total_amount: Decimal
    order_date: datetime


class SMSMessageLogResponse(BaseModel):
    id: str
    tenant_id: str
    recipient_phone: str
    message_body: str
    status: str
    provider: str
    sms_count: int
    cost: Decimal
    error_message: Optional[str] = None
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerDetailResponse(CustomerResponse):
    recent_orders: List[CustomerRecentOrder] = []
    message_history: List[SMSMessageLogResponse] = []


class CRMKPIStats(BaseModel):
    total_customers: int
    repeat_customers_count: int
    repeat_rate_percent: float
    average_ltv: Decimal
    high_risk_customers_count: int
    total_sms_sent: int


# ==========================================
# SMS Gateway & Automation Schemas
# ==========================================

class ConfigureSMSGatewayRequest(BaseModel):
    provider: str = Field(default=SMSProvider.SIMULATED.value)
    api_key: str = Field(..., min_length=2)
    sender_id: str = Field(..., min_length=2, max_length=100)
    api_url: Optional[str] = None
    is_active: bool = True


class SMSGatewayResponse(BaseModel):
    id: str
    tenant_id: str
    provider: str
    sender_id: str
    api_url: Optional[str] = None
    is_active: bool
    remaining_balance: Decimal
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AutomationRuleCreate(BaseModel):
    name: str = Field(..., max_length=255)
    trigger_event: str = Field(default=SMSTriggerEvent.ORDER_DELIVERED.value)
    delay_minutes: int = Field(default=0, ge=0)
    template_text: str = Field(..., min_length=5)
    is_active: bool = True
    min_order_value: Optional[Decimal] = None


class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    trigger_event: Optional[str] = None
    delay_minutes: Optional[int] = None
    template_text: Optional[str] = None
    is_active: Optional[bool] = None
    min_order_value: Optional[Decimal] = None


class AutomationRuleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    trigger_event: str
    delay_minutes: int
    template_text: str
    is_active: bool
    min_order_value: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TestSendSMSRequest(BaseModel):
    recipient_phone: str = Field(..., min_length=11, max_length=15)
    message: str = Field(..., min_length=3)


class TestSendSMSResponse(BaseModel):
    success: bool
    status: str
    provider_ref: Optional[str] = None
    sms_count: int
    recipient_phone: str
    message_preview: str
    error: Optional[str] = None

