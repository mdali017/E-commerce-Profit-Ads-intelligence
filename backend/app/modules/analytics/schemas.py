from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ExecutiveKPIs(BaseModel):
    # Revenue & Profit
    gross_revenue: Decimal
    delivered_revenue: Decimal
    net_profit: Decimal
    net_margin_percent: float

    # Advertising & True ROAS
    total_ad_spend: Decimal
    meta_claimed_roas: float
    real_delivered_roas: float
    true_poas: float
    break_even_roas: float

    # Logistics & Operations
    total_orders: int
    delivered_orders: int
    returned_orders: int
    cancelled_orders: int
    delivery_success_rate: float
    return_rate: float
    unsettled_courier_balance: Decimal
    total_opex: Decimal

    # CRM
    total_customers: int
    repeat_rate_percent: float
    high_risk_customers_count: int


class AlertResponse(BaseModel):
    id: str
    tenant_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    action_cta: Optional[str] = None
    action_url: Optional[str] = None
    metrics_snapshot: Optional[Dict[str, Any]] = None
    is_dismissed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BleedingCampaignSummary(BaseModel):
    campaign_id: str
    campaign_name: str
    ad_spend: Decimal
    meta_claimed_roas: float
    delivered_orders: int
    delivered_revenue: Decimal
    delivered_profit: Decimal
    actual_delivered_roas: float
    return_rate: float
    severity: str
    diagnostic_issue: str
    recommendation: str


class SourceRevenueItem(BaseModel):
    source: str
    order_count: int
    total_revenue: Decimal
    percentage: float


class DailyProfitTrendPoint(BaseModel):
    date: str
    revenue: Decimal
    ad_spend: Decimal
    cogs: Decimal
    net_profit: Decimal
    delivered_orders: int


class IntegrationStatus(BaseModel):
    meta_ads_connected: bool = False
    store_connected: bool = False
    courier_connected: bool = False
    products_configured: bool = False
    total_connected: int = 0
    all_connected: bool = False
    is_fresh_workspace: bool = True


class ExecutiveOverviewResponse(BaseModel):
    date_range: str
    start_date: str
    end_date: str
    kpis: ExecutiveKPIs
    alerts: List[AlertResponse]
    bleeding_campaigns: List[BleedingCampaignSummary]
    revenue_by_source: List[SourceRevenueItem]
    daily_trends: List[DailyProfitTrendPoint]
    integrations: Optional[IntegrationStatus] = None


class AIBriefingGenerateRequest(BaseModel):
    date_range: Optional[str] = "last_7_days"
    focus_topic: Optional[str] = None  # e.g. "ad_spend", "returns", "profitability"


class AIBriefingResponse(BaseModel):
    id: str
    date_range: str
    health_score: int
    executive_summary: str
    key_findings: List[str]
    action_items: List[str]
    created_at: Optional[datetime] = None
    generated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

