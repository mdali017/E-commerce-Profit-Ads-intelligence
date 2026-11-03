from typing import Optional, List, Any
from dataclasses import dataclass
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


@dataclass
class TenantContext:
    tenant_id: str
    user: Any
    membership: Any
    role: Any
    tenant: Any


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    from app.modules.auth.models import User

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def get_tenant_context(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    """
    Validates that the current user has access to the workspace (tenant)
    and returns a structured TenantContext with membership & role.
    """
    if not x_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-ID header is required for workspace-scoped operations",
        )

    from app.modules.workspaces.models import Membership

    result = await db.execute(
        select(Membership)
        .options(selectinload(Membership.tenant))
        .where(
            Membership.tenant_id == x_tenant_id,
            Membership.user_id == current_user.id,
        )
    )
    membership = result.scalars().first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace",
        )
    return TenantContext(
        tenant_id=x_tenant_id,
        user=current_user,
        membership=membership,
        role=membership.role,
        tenant=membership.tenant,
    )


async def get_current_tenant(
    context: TenantContext = Depends(get_tenant_context),
) -> str:
    """Convenience dependency returning strictly the tenant_id string."""
    return context.tenant_id


def require_roles(allowed_roles: List[Any]):
    """
    RBAC dependency factory that validates the user's role in the active workspace.
    Example: Depends(require_roles([UserRole.OWNER, UserRole.ADMIN]))
    """
    async def role_checker(
        context: TenantContext = Depends(get_tenant_context),
    ) -> TenantContext:
        if context.role not in allowed_roles:
            role_names = [r.value if hasattr(r, "value") else str(r) for r in allowed_roles]
            user_role = context.role.value if hasattr(context.role, "value") else str(context.role)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles {role_names}, but you are '{user_role}'.",
            )
        return context

    return role_checker
