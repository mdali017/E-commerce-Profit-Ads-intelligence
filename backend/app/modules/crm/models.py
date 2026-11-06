import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Numeric,
    Text,
    ForeignKey,
    Integer,
    Float,
    JSON,
    UniqueConstraint,
)
import enum

from app.core.database import Base


class CustomerSegment(str, enum.Enum):
    NEW = "new"              # 1 order placed
    REPEAT = "repeat"        # 2+ delivered orders
    VIP = "vip"              # High lifetime spending (e.g. ৳10,000+)
    AT_RISK = "at_risk"      # No order for 60+ days or high return rate
    LAPSED = "lapsed"        # No order for 120+ days


class SMSProvider(str, enum.Enum):
    ELITBUZZ = "elitbuzz"
    GREENWEB = "greenweb"
    SSL_WIRELESS = "ssl_wireless"
    SIMULATED = "simulated"


class SMSTriggerEvent(str, enum.Enum):
    ORDER_DELIVERED = "order_delivered"
    ORDER_CONFIRMED = "order_confirmed"
    ORDER_DISPATCHED = "order_dispatched"
    ORDER_RETURNED = "order_returned"


class SMSMessageStatus(str, enum.Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class Customer(Base):
    """
    Normalized customer profile aggregated by unique phone number within tenant workspace.
    Tracks purchase history, lifetime value (LTV), and return risk score.
    """
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("tenant_id", "phone", name="uq_tenant_customer_phone"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, index=True)  # Normalized 11-digit or +880
    email = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)

    # Lifetime Metrics
    total_orders = Column(Integer, default=0, nullable=False)
    delivered_orders = Column(Integer, default=0, nullable=False)
    returned_orders = Column(Integer, default=0, nullable=False)
    cancelled_orders = Column(Integer, default=0, nullable=False)

    total_spent = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    average_order_value = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    # Risk & Segmentation
    return_risk_score = Column(Float, default=0.0, nullable=False)  # % of total orders returned
    is_repeat_customer = Column(Boolean, default=False, nullable=False)
    segment = Column(String(50), default=CustomerSegment.NEW.value, nullable=False, index=True)
    tags = Column(JSON, default=list, nullable=False)  # e.g. ["VIP", "High Return Risk"]

    opted_out_marketing = Column(Boolean, default=False, nullable=False)
    first_order_date = Column(DateTime, nullable=True)
    last_order_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SMSGatewayCredential(Base):
    """
    Local Bangladeshi SMS Gateway credentials per workspace (Elitbuzz, Greenweb, SSL Wireless, or Simulated).
    """
    __tablename__ = "sms_gateway_credentials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    provider = Column(String(50), default=SMSProvider.SIMULATED.value, nullable=False)
    api_key = Column(String(255), nullable=False)
    sender_id = Column(String(100), nullable=False)  # Masking or Non-masking sender ID
    api_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    remaining_balance = Column(Numeric(10, 2), default=Decimal("500.00"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SMSAutomationRule(Base):
    """
    Automated messaging rules triggered by order/courier events (e.g. Order Delivered -> Thank you & review SMS).
    """
    __tablename__ = "sms_automation_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    trigger_event = Column(String(50), default=SMSTriggerEvent.ORDER_DELIVERED.value, nullable=False)
    delay_minutes = Column(Integer, default=0, nullable=False)  # 0 = immediate, 120 = 2 hours later
    template_text = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    min_order_value = Column(Numeric(10, 2), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SMSMessageLog(Base):
    """
    Audit log of all SMS messages sent, delivery statuses, and unit costs.
    """
    __tablename__ = "sms_message_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)

    recipient_phone = Column(String(20), nullable=False, index=True)
    message_body = Column(Text, nullable=False)
    status = Column(String(50), default=SMSMessageStatus.SENT.value, nullable=False)
    provider = Column(String(50), default=SMSProvider.SIMULATED.value, nullable=False)
    sms_count = Column(Integer, default=1, nullable=False)
    cost = Column(Numeric(6, 2), default=Decimal("0.35"), nullable=False)
    error_message = Column(Text, nullable=True)

    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

