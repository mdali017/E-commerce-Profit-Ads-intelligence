from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.modules.workspaces.models import UserRole


class WorkspaceBase(BaseModel):
    name: str
    currency: Optional[str] = "BDT"
    timezone: Optional[str] = "Asia/Dhaka"


class WorkspaceCreate(WorkspaceBase):
    slug: Optional[str] = None


class WorkspaceResponse(WorkspaceBase):
    id: str
    slug: str
    date_basis: str
    created_at: datetime

    class Config:
        from_attributes = True


class MembershipResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    role: UserRole
    tenant: WorkspaceResponse

    class Config:
        from_attributes = True

