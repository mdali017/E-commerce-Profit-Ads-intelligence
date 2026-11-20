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
    JSON,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class CourierProvider(str, enum.Enum):
    STEADFAST = "steadfast"
    PATHAO = "pathao"
    ECOURIER = "ecourier"
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
    Stores tenant courier API keys, OAuth credentials, and warehouse IDs
    (Steadfast, Pathao, eCourier, RedX).
    """
    __tablename__ = "courier_credentials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(Enum(CourierProvider), nullable=False)

    api_key = Column(String(255), nullable=False)
    secret_key = Column(String(512), nullable=True)
    store_id = Column(String(100), nullable=True)  # Pathao store/hub ID
    webhook_secret = Column(String(255), nullable=True)

    # eCourier specific
    user_id = Column(String(255), nullable=True)

    # Pathao OAuth 2.0 specific
    client_id = Column(String(255), nullable=True)
    client_secret_key = Column(String(512), nullable=True)
    username = Column(String(255), nullable=True)
    password_encrypted = Column(String(512), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)

    # Environment & extra metadata
    is_sandbox = Column(Boolean, default=False, nullable=False)
    extra_config = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CourierShipment(Base):
    """
    Canonical shipment representation mapped across Steadfast, Pathao, eCourier, and RedX.
    """
    __tablename__ = "courier_shipments"
    __table_args__ = (
        Index("ix_courier_shipments_poll", "tenant_id", "status", "last_polled_at"),
        Index("ix_courier_shipments_order", "tenant_id", "order_id"),
    )

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
    recipient_zone = Column(String(100), nullable=True)
    recipient_area = Column(String(100), nullable=True)
    recipient_postcode = Column(String(20), nullable=True)

    # Structured Pathao location IDs & parcel specs
    city_id = Column(Integer, nullable=True)
    zone_id = Column(Integer, nullable=True)
    area_id = Column(Integer, nullable=True)
    item_weight = Column(Numeric(6, 2), default=Decimal("0.50"), nullable=False)
    delivery_type = Column(Integer, default=48, nullable=False)

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
    estimated_delivery_date = Column(DateTime, nullable=True)
    last_polled_at = Column(DateTime, nullable=True)
    hub_name = Column(String(150), nullable=True)
    rider_name = Column(String(150), nullable=True)
    rider_phone = Column(String(50), nullable=True)
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
    settlement = relationship("CourierSettlement", back_populates="shipments")


class CourierTrackingEvent(Base):
    """
    Lifecycle tracking timeline log for parcels (e.g. Picked Up, In Transit, Out for Delivery, Delivered).
    """
    __tablename__ = "courier_tracking_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shipment_id = Column(String(36), ForeignKey("courier_shipments.id", ondelete="CASCADE"), nullable=False, index=True)

    event_status = Column(String(100), nullable=False)
    raw_status = Column(String(100), nullable=True)
    message = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    source = Column(String(30), default="system", nullable=False)  # dispatch, webhook, polling, manual
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
    reference_number = Column(String(150), nullable=True)
    bank_account = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    shipments = relationship("CourierShipment", back_populates="settlement")
