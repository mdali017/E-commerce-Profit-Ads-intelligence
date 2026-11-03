from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles, get_tenant_context, TenantContext
from app.modules.auth.models import User
from app.modules.workspaces.models import UserRole
from app.modules.workspaces.schemas import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    MembershipResponse,
    WorkspaceMemberInvite,
    WorkspaceMemberUpdate,
    WorkspaceMemberDetail,
)
from app.modules.workspaces.service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces & Multi-Tenancy"])


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workspace (tenant) and assign current user as OWNER."""
    return await WorkspaceService.create_workspace(db, current_user, workspace_in)


@router.get("/me", response_model=List[MembershipResponse])
async def list_my_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces the authenticated user belongs to."""
    return await WorkspaceService.get_user_workspaces(db, current_user)


@router.get("/{tenant_id}", response_model=WorkspaceResponse)
async def get_workspace_details(
    tenant_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Get active workspace details. User must belong to this tenant."""
    if context.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Header X-Tenant-ID must match the path tenant_id",
        )
    return await WorkspaceService.get_workspace(db, tenant_id)


@router.patch("/{tenant_id}", response_model=WorkspaceResponse)
async def update_workspace_settings(
    tenant_id: str,
    update_in: WorkspaceUpdate,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Update workspace settings (Currency, Timezone, Name, Date Basis). Requires OWNER or ADMIN."""
    if context.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Header X-Tenant-ID must match the path tenant_id",
        )
    return await WorkspaceService.update_workspace(db, tenant_id, update_in)


@router.get("/{tenant_id}/members", response_model=List[WorkspaceMemberDetail])
async def list_workspace_members(
    tenant_id: str,
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """List all team members and their roles in this workspace."""
    if context.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Header X-Tenant-ID must match the path tenant_id",
        )
    return await WorkspaceService.list_members(db, tenant_id)


@router.post(
    "/{tenant_id}/members",
    response_model=WorkspaceMemberDetail,
    status_code=status.HTTP_201_CREATED,
)
async def add_workspace_member(
    tenant_id: str,
    invite_in: WorkspaceMemberInvite,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Add a registered user to the workspace with a specific role. Requires OWNER or ADMIN."""
    if context.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Header X-Tenant-ID must match the path tenant_id",
        )
    return await WorkspaceService.add_or_invite_member(db, tenant_id, invite_in)


@router.patch(
    "/{tenant_id}/members/{membership_id}",
    response_model=WorkspaceMemberDetail,
)
async def update_member_role(
    tenant_id: str,
    membership_id: str,
    update_in: WorkspaceMemberUpdate,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Change a team member's role (e.g. promote to Admin, Marketer, Operator). Requires OWNER or ADMIN."""
    if context.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Header X-Tenant-ID must match the path tenant_id",
        )
    return await WorkspaceService.update_member_role(
        db, tenant_id, membership_id, update_in, context.user
    )


@router.delete("/{tenant_id}/members/{membership_id}")
async def remove_workspace_member(
    tenant_id: str,
    membership_id: str,
    context: TenantContext = Depends(require_roles([UserRole.OWNER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Remove a team member from this workspace. Requires OWNER or ADMIN."""
    if context.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Header X-Tenant-ID must match the path tenant_id",
        )
    return await WorkspaceService.remove_member(
        db, tenant_id, membership_id, context.user
    )
