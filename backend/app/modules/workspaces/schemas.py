from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.modules.workspaces.models import UserRole


class WorkspaceBase(BaseModel):
    name: str
    currency: Optional[str] = "BDT"
    timezone: Optional[str] = "Asia/Dhaka"


class WorkspaceCreate(WorkspaceBase):
    slug: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    date_basis: Optional[str] = None  # order_date or delivery_date


class WorkspaceResponse(WorkspaceBase):
    id: str
    slug: str
    date_basis: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemberUserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True


class WorkspaceMemberInvite(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.OPERATOR


class WorkspaceMemberUpdate(BaseModel):
    role: UserRole


class WorkspaceMemberDetail(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    role: UserRole
    created_at: datetime
    user: Optional[MemberUserResponse] = None

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


class WorkspaceSwitchResponse(BaseModel):
    active_tenant: WorkspaceResponse
    role: UserRole
    available_workspaces: List[MembershipResponse]
