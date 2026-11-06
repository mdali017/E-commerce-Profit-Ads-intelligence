import uuid
import enum
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
    Enum,
    Integer,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class CourierProvider(str, enum.Enum):
    STEADFAST = "steadfast"
    PATHAO = "pathao"
    REDX = "redx"
    PAPERFLY = "paperfly"
    CUSTOM = "custom"


class ShipmentStatus(str, enum.Enum):
    PENDING = "pending"
    BOOKED = "booked"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    PARTIALLY_DELIVERED = "partially_delivered"
    RETURNED = "returned"
    CANCELLED = "cancelled"
    LOST = "lost"


class CourierCredential(Base):
    """
    Stores tenant courier API keys and warehouse IDs (Steadfast, Pathao, RedX).
    """
    __tablename__ = "courier_credentials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(Enum(CourierProvider), nullable=False)
    
    api_key = Column(String(255), nullable=False)
    secret_key = Column(String(255), nullable=True)
    store_id = Column(String(100), nullable=True)  # Pathao store/hub ID
    webhook_secret = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CourierShipment(Base):
    """
    Canonical shipment representation mapped across Steadfast, Pathao, and RedX.
    """
    __tablename__ = "courier_shipments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    provider = Column(Enum(CourierProvider), nullable=False, index=True)
    consignment_id = Column(String(100), nullable=False, unique=True, index=True)
    tracking_code = Column(String(100), nullable=True, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)

    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.BOOKED, nullable=False, index=True)
    raw_status = Column(String(100), nullable=True)

    recipient_name = Column(String(255), nullable=False)
    recipient_phone = Column(String(50), nullable=False, index=True)
    recipient_address = Column(Text, nullable=False)
    recipient_city = Column(String(100), nullable=True)

    # Financials
    cod_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    collected_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    delivery_fee = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    cod_fee = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    return_fee = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    # Settlement
    is_settled = Column(Boolean, default=False, nullable=False, index=True)
    settled_at = Column(DateTime, nullable=True)
    settlement_id = Column(String(36), ForeignKey("courier_settlements.id", ondelete="SET NULL"), nullable=True)

    delivery_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tracking_events = relationship(
        "CourierTrackingEvent",
        back_populates="shipment",
        cascade="all, delete-orphan",
        order_by="desc(CourierTrackingEvent.timestamp)",
    )


class CourierTrackingEvent(Base):
    """
    Lifecycle tracking timeline log for parcels (e.g. Picked Up, In Transit, Out for Delivery, Delivered).
    """
    __tablename__ = "courier_tracking_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shipment_id = Column(String(36), ForeignKey("courier_shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_status = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    shipment = relationship("CourierShipment", back_populates="tracking_events")


class CourierSettlement(Base):
    """
    Cash on Delivery (COD) settlement remittance statement from couriers.
    """
    __tablename__ = "courier_settlements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(Enum(CourierProvider), nullable=False)

    settlement_number = Column(String(100), nullable=False, index=True)
    total_collected_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_delivery_fees = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_cod_fees = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    net_payout_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    shipment_count = Column(Integer, default=0, nullable=False)

    payout_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="PAID", nullable=False)  # PAID, PENDING, DISPUTED
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

