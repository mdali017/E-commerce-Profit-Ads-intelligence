from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_tenant_context,
    require_roles,
    TenantContext,
)
from app.modules.workspaces.models import UserRole
from app.modules.ads.schemas import (
    ConnectAdAccountRequest,
    MetaAdAccountResponse,
    MetaCampaignResponse,
    CampaignPerformanceItem,
    AdsKPIStats,
)
from app.modules.ads.service import AdsService

router = APIRouter(prefix="/ads", tags=["Meta Ads & Attribution Engine"])


@router.post(
    "/accounts/connect",
    response_model=MetaAdAccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect Meta (Facebook) Ad Account",
)
async def connect_ad_account(
    request_in: ConnectAdAccountRequest,
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.MARKETER])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Connects a Meta Ad Account via Access Token.
    Automatically triggers discovery of active campaigns and daily insights.
    """
    return await AdsService.connect_ad_account(db, context.tenant_id, request_in)


@router.get(
    "/accounts",
    response_model=List[MetaAdAccountResponse],
    summary="List Connected Ad Accounts",
)
async def list_ad_accounts(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all connected Meta Ad Accounts for the workspace."""
    return await AdsService.get_ad_accounts(db, context.tenant_id)


@router.post(
    "/sync/daily-insights",
    summary="Trigger Meta Insights Synchronization",
)
async def sync_daily_insights(
    context: TenantContext = Depends(
        require_roles([UserRole.OWNER, UserRole.ADMIN, UserRole.MARKETER])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Fetches latest spend, impressions, clicks, and Pixel conversion metrics from Meta."""
    synced = await AdsService.sync_daily_insights(db, context.tenant_id)
    return {
        "status": "success",
        "synced_records": len(synced),
        "message": f"Successfully synced {len(synced)} campaign insights records.",
    }


@router.get(
    "/campaigns",
    response_model=List[MetaCampaignResponse],
    summary="List Meta Campaigns",
)
async def list_campaigns(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """List all synced campaigns for the active workspace."""
    return await AdsService.get_campaigns(db, context.tenant_id)


@router.get(
    "/performance",
    response_model=List[CampaignPerformanceItem],
    summary="Campaign Attribution & Ground-Truth ROAS Comparison",
)
async def get_campaign_performance(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns campaign-by-campaign comparison of:
    - Meta Pixel Claimed ROAS vs Actual Delivered ROAS (from Courier)
    - Blended POAS (Profit On Ad Spend)
    - Inflation Gap percentage
    """
    return await AdsService.get_campaign_performance(db, context.tenant_id)


@router.get(
    "/stats/kpis",
    response_model=AdsKPIStats,
    summary="Get Overall Ads Performance KPIs",
)
async def get_ads_kpis(
    context: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    """
    Executive summary of total ad spend, impressions, CPC, CTR,
    Meta Claimed Revenue/ROAS vs Ground-Truth Delivered Cash/ROAS and POAS.
    """
    return await AdsService.get_ads_kpis(db, context.tenant_id)
