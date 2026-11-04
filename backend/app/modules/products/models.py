import uuid
from decimal import Decimal
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Boolean,
    Text,
    Integer,
    ForeignKey,
    DateTime,
    JSON,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.common.models import TimestampMixin, TenantMixin


class Product(Base, TimestampMixin, TenantMixin):
    """
    Core product entity scoped to a workspace/tenant.
    Tracks selling price, base COGS (cost price), packaging and handling costs.
    """
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)

    # Financial / Cost fields
    regular_price = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    cost_price = Column(Numeric(12, 2), nullable=True)  # Base COGS (null = missing cost warning)
    packaging_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    handling_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    variants = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductVariant.created_at",
    )
    cost_history = relationship(
        "ProductCostHistory",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="desc(ProductCostHistory.effective_from)",
    )


class ProductVariant(Base, TimestampMixin, TenantMixin):
    """
    Variant entity (size, color, weight) with variant-specific SKU and optional overridden cost/price.
    """
    __tablename__ = "product_variants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)  # e.g., "Red / XL" or "500g"
    sku = Column(String(100), nullable=True, index=True)

    # Specific price/cost overrides (if None, fallback to product level)
    price = Column(Numeric(12, 2), nullable=True)
    cost_price = Column(Numeric(12, 2), nullable=True)

    stock_quantity = Column(Integer, default=0, nullable=False)
    attributes = Column(JSON, nullable=True)  # e.g. {"color": "Red", "size": "XL"}
    is_active = Column(Boolean, default=True, nullable=False)

    product = relationship("Product", back_populates="variants")


class ProductCostHistory(Base, TimestampMixin, TenantMixin):
    """
    Audit log of cost changes over time.
    Crucial for retroactive profit calculation (an order placed yesterday uses yesterday's cost).
    """
    __tablename__ = "product_cost_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_id = Column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    old_cost_price = Column(Numeric(12, 2), nullable=True)
    new_cost_price = Column(Numeric(12, 2), nullable=False)
    effective_from = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(String(255), nullable=True)  # e.g. "Supplier batch import", "Price increase"

    product = relationship("Product", back_populates="cost_history")
