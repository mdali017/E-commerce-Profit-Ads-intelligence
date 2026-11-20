import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.http import close_http_client
from app.core.redis import ping_redis
from app.modules.couriers.migrations import ensure_courier_schema
from app.modules.couriers.tasks import courier_background_sync_loop

# Import all module models so Base.metadata knows about them
import app.modules.auth.models  # noqa: F401
import app.modules.workspaces.models  # noqa: F401
import app.modules.products.models  # noqa: F401
import app.modules.orders.models  # noqa: F401
import app.modules.couriers.models  # noqa: F401
import app.modules.ads.models  # noqa: F401
import app.modules.finance.models  # noqa: F401
import app.modules.crm.models  # noqa: F401
import app.modules.analytics.models  # noqa: F401



# Import module routers
from app.modules.auth.router import router as auth_router
from app.modules.workspaces.router import router as workspaces_router
from app.modules.products.router import router as products_router
from app.modules.orders.router import router as orders_router
from app.modules.couriers.router import router as couriers_router
from app.modules.ads.router import router as ads_router
from app.modules.finance.router import router as finance_router
from app.modules.crm.router import router as crm_router
from app.modules.analytics.router import router as analytics_router
from app.modules.jobs.router import router as jobs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist and apply incremental schema upgrades
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_courier_schema(engine)

    # Start periodic eCourier polling & Pathao token refresh loop
    sync_task = asyncio.create_task(courier_background_sync_loop())
    try:
        yield
    finally:
        sync_task.cancel()
        with suppress(asyncio.CancelledError):
            await sync_task
        # Shutdown
        await close_http_client()
        await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-tenant E-commerce Profit & Ads Intelligence SaaS Platform Backend",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health", tags=["Health Check"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Verifies that both API service, Database engine, and Redis cache are healthy and reachable."""
    try:
        result = await db.execute(text("SELECT 1"))
        db_status = "connected" if result.scalar() == 1 else "unexpected_result"
    except Exception as e:
        db_status = f"error: {str(e)}"

    redis_ok = await ping_redis()
    redis_status = "connected" if redis_ok else "offline"

    return {
        "status": "healthy",
        "database": db_status,
        "redis": redis_status,
        "environment": settings.ENVIRONMENT,
    }


# Include Module Routers under API v1
api_v1 = FastAPI()
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(workspaces_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(couriers_router, prefix=settings.API_V1_STR)
app.include_router(ads_router, prefix=settings.API_V1_STR)
app.include_router(finance_router, prefix=settings.API_V1_STR)
app.include_router(crm_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)

