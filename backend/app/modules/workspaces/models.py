import uuid
from enum import Enum
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.common.models import TimestampMixin


class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MARKETER = "marketer"
    OPERATOR = "operator"
    ACCOUNTANT = "accountant"


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    currency = Column(String(10), default="BDT", nullable=False)
    timezone = Column(String(50), default="Asia/Dhaka", nullable=False)
    date_basis = Column(String(20), default="order_date", nullable=False)  # order_date or delivery_date

    memberships = relationship("Membership", back_populates="tenant", cascade="all, delete-orphan")


class Membership(Base, TimestampMixin):
    __tablename__ = "memberships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.OWNER, nullable=False)

    tenant = relationship("Tenant", back_populates="memberships")

