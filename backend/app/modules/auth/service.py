from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.core.security import get_password_hash, verify_password, create_access_token
from app.modules.auth.models import User
from app.modules.auth.schemas import UserCreate, UserLogin, Token
from app.modules.workspaces.models import Tenant, Membership, UserRole


class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, user_in: UserCreate) -> Token:
        # Check if email exists
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )

        # Create user
        user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            phone_number=user_in.phone_number,
        )
        db.add(user)
        await db.flush()

        # Create default workspace for new user
        slug = user_in.email.split("@")[0].lower() + "-store"
        # Check slug collision
        slug_check = await db.execute(select(Tenant).where(Tenant.slug == slug))
        if slug_check.scalars().first():
            slug = f"{slug}-{user.id[:6]}"

        tenant = Tenant(
            name=f"{user_in.full_name or 'My'} Workspace",
            slug=slug,
            currency="BDT",
            timezone="Asia/Dhaka",
        )
        db.add(tenant)
        await db.flush()

        # Add owner membership
        membership = Membership(
            tenant_id=tenant.id,
            user_id=user.id,
            role=UserRole.OWNER,
        )
        db.add(membership)
        await db.commit()
        await db.refresh(user)

        token = create_access_token(subject=user.id)
        return Token(access_token=token, token_type="bearer", user=user)

    @staticmethod
    async def authenticate(db: AsyncSession, login_data: UserLogin) -> Token:
        result = await db.execute(select(User).where(User.email == login_data.email))
        user = result.scalars().first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account."
            )

        token = create_access_token(subject=user.id)
        return Token(access_token=token, token_type="bearer", user=user)

