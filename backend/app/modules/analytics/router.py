from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_tenant
from app.modules.analytics.schemas import (
    ExecutiveOverviewResponse,
    BleedingCampaignSummary,
    AlertResponse,
    AIBriefingGenerateRequest,
    AIBriefingResponse,
)
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Executive Dashboard & AI Insights"])


@router.get("/overview", response_model=ExecutiveOverviewResponse)
@router.get("/dashboard", response_model=ExecutiveOverviewResponse)
async def get_executive_overview(
    date_range: str = Query("last_7_days", description="today, yesterday, last_7_days, last_30_days, this_month, all"),
    start_date: Optional[date] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Custom end date (YYYY-MM-DD)"),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Module 10 Day 35: Executive Unified Dashboard.
    Returns correlated Net Profit, Real Delivered ROAS vs Meta Claimed ROAS,
    True POAS, Courier Delivery % & Unsettled Cash, Bleeding Ads, and Source breakdown.
    """
    return await AnalyticsService.get_executive_overview(
        db=db,
        tenant_id=tenant_id,
        date_range=date_range,
        custom_start=start_date,
        custom_end=end_date,
    )


@router.get("/bleeding-campaigns", response_model=List[BleedingCampaignSummary])
async def get_bleeding_campaigns(
    date_range: str = Query("last_7_days"),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Module 10 Day 36: Bleeding Ad Campaigns & Budget Drain Detector.
    Identifies campaigns with high spend, 0 deliveries, or negative delivered profit.
    """
    overview = await AnalyticsService.get_executive_overview(
        db=db, tenant_id=tenant_id, date_range=date_range
    )
    return overview.bleeding_campaigns


@router.patch("/alerts/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Dismisses an executive notification alert."""
    success = await AnalyticsService.dismiss_alert(db, tenant_id, alert_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or already dismissed",
        )
    return {"message": "Alert dismissed successfully", "alert_id": alert_id}


@router.post("/ai-briefing", response_model=AIBriefingResponse)
async def generate_ai_briefing(
    request: AIBriefingGenerateRequest,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Module 10 Day 37: AI Business Analyst Engine.
    Correlates P&L, ROAS, Courier Returns & OPEX to generate an actionable executive briefing in natural Bengali.
    """
    return await AnalyticsService.generate_ai_briefing(
        db=db,
        tenant_id=tenant_id,
        request=request,
    )


@router.get("/ai-briefing/latest", response_model=Optional[AIBriefingResponse])
async def get_latest_ai_briefing(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Fetches the latest cached AI briefing report."""
    return await AnalyticsService.get_latest_ai_briefing(db, tenant_id)
