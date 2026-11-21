import uuid
from enum import Enum
from decimal import Decimal
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Text,
    Integer,
    ForeignKey,
    DateTime,
    JSON,
    Boolean,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.common.models import TimestampMixin, TenantMixin


class OrderSource(str, Enum):
    MANUAL = "manual"
    WOOCOMMERCE = "woocommerce"
    SHOPIFY = "shopify"
    WIX = "wix"
    CUSTOM_WEBHOOK = "custom_webhook"
    LANDING_PAGE = "landing_page"
    API = "api"
    FACEBOOK = "facebook"
    MESSENGER = "messenger"
    WHATSAPP = "whatsapp"



class OrderStatus(str, Enum):
    PENDING = "pending"              # New order, awaiting phone call / confirmation
    CONFIRMED = "confirmed"          # Confirmed by customer, ready for packing
    PROCESSING = "processing"        # Picked & packed
    IN_COURIER = "in_courier"        # Handed over to courier (Steadfast/Pathao)
    DELIVERED = "delivered"          # Successfully delivered, cash collected
    CANCELLED = "cancelled"          # Cancelled by customer or fake order
    RETURNED = "returned"            # Courier returned / delivery failed
    ON_HOLD = "on_hold"              # Customer asked to delay delivery
    FAILED = "failed"                # System or payment failure


class PaymentMethod(str, Enum):
    COD = "cod"                      # Cash on Delivery
    BKASH = "bkash"
    NAGAD = "nagad"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    REFUNDED = "refunded"


class AttributionConfidence(str, Enum):
    HIGH = "high"                    # Exact fbclid / click ID matched
    MEDIUM = "medium"                # UTM campaign matched
    LOW = "low"                      # IP / referrer heuristic
    ORGANIC = "organic"              # Direct / non-ad traffic


class Order(Base, TimestampMixin, TenantMixin):
    """
    Canonical Order Entity.
    Acts as the single source of truth for orders from WooCommerce, Manual F-Commerce, or Landing Pages.
    """
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_tenant_order_date", "tenant_id", "order_date"),
        Index("ix_orders_tenant_status", "tenant_id", "status"),
        Index("ix_orders_tenant_status_date", "tenant_id", "status", "order_date"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(50), nullable=False, index=True)

    source = Column(String(30), default=OrderSource.MANUAL.value, nullable=False, index=True)
    status = Column(String(30), default=OrderStatus.PENDING.value, nullable=False, index=True)
    payment_method = Column(String(30), default=PaymentMethod.COD.value, nullable=False)
    payment_status = Column(String(30), default=PaymentStatus.PENDING.value, nullable=False)

    # Customer & Shipping details
    customer_name = Column(String(255), nullable=False, index=True)
    customer_phone = Column(String(50), nullable=False, index=True)
    customer_email = Column(String(255), nullable=True)
    shipping_address = Column(Text, nullable=False)
    shipping_city = Column(String(100), nullable=True)
    shipping_zone = Column(String(100), nullable=True)  # e.g. "Inside Dhaka", "Outside Dhaka"
    customer_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    # Financial / Economics Totals
    subtotal = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    shipping_fee = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))  # Customer bill

    # COGS & Unit Gross Profit (Retroactively locked at order creation)
    total_cogs = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total_packaging_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total_handling_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    gross_profit = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    # Ingestion & Webhook tracking
    external_order_id = Column(String(100), nullable=True, index=True)
    idempotency_key = Column(String(100), nullable=True, index=True)
    order_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.created_at",
    )
    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="desc(OrderStatusHistory.created_at)",
    )
    attribution = relationship(
        "OrderAttribution",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )


class OrderItem(Base, TimestampMixin, TenantMixin):
    """
    Individual line item in an order.
    Locks in the product's selling price and COGS at the time of purchase.
    """
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)

    product_name = Column(String(255), nullable=False)
    variant_name = Column(String(255), nullable=True)
    sku = Column(String(100), nullable=True, index=True)
    quantity = Column(Integer, default=1, nullable=False)

    unit_price = Column(Numeric(12, 2), nullable=False)
    unit_cost_price = Column(Numeric(12, 2), nullable=True)  # Snapshot of product COGS
    unit_packaging_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    unit_handling_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    total_price = Column(Numeric(12, 2), nullable=False)
    total_cost = Column(Numeric(12, 2), nullable=True)

    order = relationship("Order", back_populates="items")


class OrderStatusHistory(Base, TimestampMixin, TenantMixin):
    """
    Audit log for order lifecycle transitions.
    Allows tracking who confirmed the order, reasons for cancellation, or delivery updates.
    """
    __tablename__ = "order_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    changed_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(255), nullable=True)  # e.g. "Customer confirmed via phone call"

    order = relationship("Order", back_populates="status_history")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id])


class OrderAttribution(Base, TimestampMixin, TenantMixin):
    """
    Marketing attribution metadata connecting orders to ad campaigns.
    """
    __tablename__ = "order_attributions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    utm_source = Column(String(100), nullable=True)      # e.g. "facebook", "tiktok"
    utm_medium = Column(String(100), nullable=True)      # e.g. "cpc", "paid_social"
    utm_campaign = Column(String(255), nullable=True, index=True)
    utm_content = Column(String(255), nullable=True)
    utm_term = Column(String(255), nullable=True)

    fbclid = Column(String(255), nullable=True, index=True)
    campaign_id = Column(String(100), nullable=True, index=True)
    adset_id = Column(String(100), nullable=True)
    ad_id = Column(String(100), nullable=True)
    attribution_confidence = Column(
        String(30), default=AttributionConfidence.ORGANIC.value, nullable=False
    )

    order = relationship("Order", back_populates="attribution")

