import re
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.modules.workspaces.models import Tenant, Membership, UserRole
from app.modules.workspaces.schemas import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    MembershipResponse,
    WorkspaceMemberInvite,
    WorkspaceMemberUpdate,
    WorkspaceMemberDetail,
)
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

    @staticmethod
    async def get_workspace(db: AsyncSession, tenant_id: str) -> Tenant:
        result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = result.scalars().first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )
        return tenant

    @staticmethod
    async def update_workspace(
        db: AsyncSession, tenant_id: str, update_in: WorkspaceUpdate
    ) -> Tenant:
        tenant = await WorkspaceService.get_workspace(db, tenant_id)
        if update_in.name is not None:
            tenant.name = update_in.name
        if update_in.currency is not None:
            tenant.currency = update_in.currency
        if update_in.timezone is not None:
            tenant.timezone = update_in.timezone
        if update_in.date_basis is not None:
            if update_in.date_basis not in ["order_date", "delivery_date"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="date_basis must be either 'order_date' or 'delivery_date'",
                )
            tenant.date_basis = update_in.date_basis

        await db.commit()
        await db.refresh(tenant)
        return tenant

    @staticmethod
    async def list_members(db: AsyncSession, tenant_id: str) -> List[WorkspaceMemberDetail]:
        result = await db.execute(
            select(Membership)
            .where(Membership.tenant_id == tenant_id)
            .options(selectinload(Membership.user))
        )
        return result.scalars().all()

    @staticmethod
    async def add_or_invite_member(
        db: AsyncSession, tenant_id: str, invite_in: WorkspaceMemberInvite
    ) -> WorkspaceMemberDetail:
        # 1. Find user by email
        user_res = await db.execute(select(User).where(User.email == invite_in.email))
        target_user = user_res.scalars().first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email '{invite_in.email}' does not have an account yet. Please ask them to sign up first.",
            )

        # 2. Check if already a member
        mem_res = await db.execute(
            select(Membership).where(
                Membership.tenant_id == tenant_id,
                Membership.user_id == target_user.id,
            )
        )
        existing_mem = mem_res.scalars().first()
        if existing_mem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this workspace.",
            )

        # 3. Create membership
        new_mem = Membership(
            tenant_id=tenant_id,
            user_id=target_user.id,
            role=invite_in.role,
        )
        db.add(new_mem)
        await db.commit()

        # Re-fetch with user loaded
        result = await db.execute(
            select(Membership)
            .where(Membership.id == new_mem.id)
            .options(selectinload(Membership.user))
        )
        return result.scalars().first()

    @staticmethod
    async def update_member_role(
        db: AsyncSession,
        tenant_id: str,
        membership_id: str,
        update_in: WorkspaceMemberUpdate,
        current_user: User,
    ) -> WorkspaceMemberDetail:
        result = await db.execute(
            select(Membership)
            .where(Membership.id == membership_id, Membership.tenant_id == tenant_id)
            .options(selectinload(Membership.user))
        )
        membership = result.scalars().first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membership record not found in this workspace",
            )

        # If changing an OWNER's role, verify there is at least one other owner
        if membership.role == UserRole.OWNER and update_in.role != UserRole.OWNER:
            owners_count = await db.execute(
                select(Membership).where(
                    Membership.tenant_id == tenant_id,
                    Membership.role == UserRole.OWNER,
                )
            )
            if len(owners_count.scalars().all()) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the only Owner of this workspace. Assign another Owner first.",
                )

        membership.role = update_in.role
        await db.commit()
        await db.refresh(membership)
        return membership

    @staticmethod
    async def remove_member(
        db: AsyncSession, tenant_id: str, membership_id: str, current_user: User
    ) -> dict:
        result = await db.execute(
            select(Membership).where(
                Membership.id == membership_id, Membership.tenant_id == tenant_id
            )
        )
        membership = result.scalars().first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membership not found in this workspace",
            )

        if membership.role == UserRole.OWNER:
            owners_count = await db.execute(
                select(Membership).where(
                    Membership.tenant_id == tenant_id,
                    Membership.role == UserRole.OWNER,
                )
            )
            if len(owners_count.scalars().all()) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the only Owner of this workspace.",
                )

        await db.delete(membership)
        await db.commit()
        return {"message": "Member removed successfully"}
