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
    Enum as SQLEnum,
)
import enum

from app.core.database import Base


class ExpenseCategory(str, enum.Enum):
    SALARIES = "salaries"
    RENT = "rent"
    UTILITIES = "utilities"
    SOFTWARE = "software"
    MARKETING_OTHER = "marketing_other"
    OFFICE = "office"
    PACKAGING_BULK = "packaging_bulk"
    TRANSPORT = "transport"
    OTHER = "other"


class RecurrencePeriod(str, enum.Enum):
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    WEEKLY = "weekly"


class OperatingExpense(Base):
    """
    Fixed and variable operating expenses (OPEX) deducted from Contribution Profit to compute Net Profit.
    Supports daily proration for monthly/weekly recurring expenses.
    """
    __tablename__ = "operating_expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    category = Column(String(50), default=ExpenseCategory.OTHER.value, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False, index=True)

    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_period = Column(String(20), default=RecurrencePeriod.ONE_TIME.value, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

