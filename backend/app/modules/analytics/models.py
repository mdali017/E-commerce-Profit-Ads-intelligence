import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Index,
)
from app.core.database import Base


class AlertType(str, Enum):
    BLEEDING_AD = "bleeding_ad"
    HIGH_RETURN = "high_return"
    ROAS_INFLATION = "roas_inflation"
    UNSETTLED_CASH = "unsettled_cash"
    HIGH_RISK_ORDER = "high_risk_order"
    OPPORTUNITY = "opportunity"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    OPPORTUNITY = "opportunity"


class ExecutiveAlert(Base):
    __tablename__ = "executive_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    alert_type = Column(String, nullable=False, default=AlertType.BLEEDING_AD.value)
    severity = Column(String, nullable=False, default=AlertSeverity.WARNING.value)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    action_cta = Column(String(100), nullable=True)
    action_url = Column(String(255), nullable=True)

    metrics_snapshot = Column(JSON, nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    dismissed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    @property
    def generated_at(self):
        return self.created_at
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_executive_alerts_tenant_active", "tenant_id", "is_dismissed"),
    )


class AIBriefing(Base):
    __tablename__ = "ai_briefings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    date_range = Column(String(50), nullable=False, default="last_7_days")
    health_score = Column(Integer, nullable=False, default=75)

    executive_summary = Column(Text, nullable=False)
    key_findings = Column(JSON, nullable=False, default=list)
    action_items = Column(JSON, nullable=False, default=list)
    source_metrics = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    @property
    def generated_at(self):
        return self.created_at

