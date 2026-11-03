from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.workspaces.schemas import WorkspaceCreate, WorkspaceResponse, MembershipResponse
from app.modules.workspaces.service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


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

