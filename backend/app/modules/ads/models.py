import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Date,
    Numeric,
    Text,
    ForeignKey,
    Integer,
    Float,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class MetaAdAccount(Base):
    """
    Stores connected Meta (Facebook) Ad Account credentials & configuration per workspace.
    """
    __tablename__ = "meta_ad_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    account_id = Column(String(100), nullable=False, index=True)  # e.g. act_1029384756
    name = Column(String(255), nullable=False)
    currency = Column(String(10), default="BDT", nullable=False)
    timezone_name = Column(String(50), default="Asia/Dhaka", nullable=False)
    access_token = Column(Text, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    is_primary = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    campaigns = relationship("MetaCampaign", back_populates="ad_account", cascade="all, delete-orphan")


class MetaCampaign(Base):
    """
    Campaign metadata mapped from Meta Marketing API.
    """
    __tablename__ = "meta_campaigns"
    __table_args__ = (
        UniqueConstraint("tenant_id", "campaign_id", name="uq_tenant_meta_campaign"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    ad_account_id = Column(String(36), ForeignKey("meta_ad_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    campaign_id = Column(String(100), nullable=False, index=True)  # Meta numeric ID
    name = Column(String(255), nullable=False, index=True)
    objective = Column(String(100), nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, PAUSED, ARCHIVED

    daily_budget = Column(Numeric(12, 2), nullable=True)
    lifetime_budget = Column(Numeric(12, 2), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    ad_account = relationship("MetaAdAccount", back_populates="campaigns")


class MetaDailyInsight(Base):
    """
    Daily aggregated campaign ad spend, impressions, clicks, and Pixel reported conversions.
    """
    __tablename__ = "meta_daily_insights"
    __table_args__ = (
        Index("ix_meta_daily_insights_query", "tenant_id", "ad_account_id", "report_date"),
        Index("ix_meta_daily_insights_campaign", "tenant_id", "campaign_id", "report_date"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    ad_account_id = Column(String(36), ForeignKey("meta_ad_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    campaign_id = Column(String(100), nullable=False, index=True)
    campaign_name = Column(String(255), nullable=False, index=True)
    adset_id = Column(String(100), nullable=True, index=True)
    ad_id = Column(String(100), nullable=True, index=True)

    report_date = Column(Date, nullable=False, index=True)  # Normalized to Asia/Dhaka date

    # Performance Metrics
    spend = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    impressions = Column(Integer, default=0, nullable=False)
    clicks = Column(Integer, default=0, nullable=False)
    cpc = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    cpm = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    ctr = Column(Float, default=0.0, nullable=False)

    # Meta Pixel Claimed Numbers
    meta_reported_purchases = Column(Integer, default=0, nullable=False)
    meta_reported_conversion_value = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    meta_claimed_roas = Column(Float, default=0.0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
