import re
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.modules.workspaces.models import Tenant, Membership, UserRole
from app.modules.workspaces.schemas import WorkspaceCreate, WorkspaceResponse, MembershipResponse
from app.modules.auth.models import User


class WorkspaceService:
    @staticmethod
    async def create_workspace(
        db: AsyncSession, user: User, workspace_in: WorkspaceCreate
    ) -> WorkspaceResponse:
        slug = workspace_in.slug or re.sub(r"[^a-zA-Z0-9]+", "-", workspace_in.name.lower()).strip("-")
        
        # Check slug uniqueness
        res = await db.execute(select(Tenant).where(Tenant.slug == slug))
        if res.scalars().first():
            slug = f"{slug}-{user.id[:4]}"

        tenant = Tenant(
            name=workspace_in.name,
            slug=slug,
            currency=workspace_in.currency or "BDT",
            timezone=workspace_in.timezone or "Asia/Dhaka",
        )
        db.add(tenant)
        await db.flush()

        membership = Membership(
            tenant_id=tenant.id,
            user_id=user.id,
            role=UserRole.OWNER,
        )
        db.add(membership)
        await db.commit()
        await db.refresh(tenant)
        return tenant

    @staticmethod
    async def get_user_workspaces(db: AsyncSession, user: User) -> List[MembershipResponse]:
        result = await db.execute(
            select(Membership)
            .where(Membership.user_id == user.id)
            .options(selectinload(Membership.tenant))
        )
        return result.scalars().all()

