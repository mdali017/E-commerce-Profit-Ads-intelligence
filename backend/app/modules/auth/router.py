from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.schemas import UserCreate, UserLogin, UserResponse, Token
from app.modules.auth.service import AuthService
from app.modules.auth.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user and automatically provision their default workspace."""
    return await AuthService.register_user(db, user_in)


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a user with email and password."""
    return await AuthService.authenticate(db, login_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the currently authenticated user's profile."""
    return current_user

