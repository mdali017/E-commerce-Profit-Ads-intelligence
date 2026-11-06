from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


# ==========================================
# Meta Ad Account Schemas
# ==========================================
class ConnectAdAccountRequest(BaseModel):
    account_id: str = Field(..., description="Meta Ad Account ID, e.g. act_1234567890")
    name: str = Field(..., description="Name for the ad account")
    access_token: str = Field(..., description="System user or User access token with ads_read permission")
    currency: str = "BDT"
    timezone_name: str = "Asia/Dhaka"
    is_primary: bool = True


class MetaAdAccountResponse(BaseModel):
    id: str
    tenant_id: str
    account_id: str
    name: str
    currency: str
    timezone_name: str
    is_active: bool
    is_primary: bool
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Meta Campaign Schemas
# ==========================================
class MetaCampaignResponse(BaseModel):
    id: str
    tenant_id: str
    ad_account_id: str
    campaign_id: str
    name: str
    objective: Optional[str] = None
    status: str
    daily_budget: Optional[Decimal] = None
    lifetime_budget: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Campaign Performance & True ROAS Schemas
# ==========================================
class CampaignPerformanceItem(BaseModel):
    campaign_id: str
    campaign_name: str
    status: str
    spend: Decimal
    impressions: int
    clicks: int
    cpc: Decimal
    ctr: float
    
    # Meta Pixel Claimed
    meta_reported_purchases: int
    meta_reported_conversion_value: Decimal
    meta_claimed_roas: float

    # Real Ground-Truth Data (Orders & Delivery)
    attributed_orders_count: int
    delivered_orders_count: int
    returned_orders_count: int
    actual_delivered_revenue: Decimal
    actual_gross_profit: Decimal
    actual_delivered_roas: float
    blended_poas: float  # Profit on Ad Spend (Actual Gross Profit / Ad Spend)
    roas_inflation_percent: float  # Gap between Meta claim and actual delivery


class AdsKPIStats(BaseModel):
    total_spend: Decimal
    total_impressions: int
    total_clicks: int
    average_cpc: Decimal
    average_ctr: float

    # Comparison metrics
    meta_claimed_revenue: Decimal
    meta_claimed_roas: float

    actual_delivered_revenue: Decimal
    actual_delivered_roas: float
    blended_poas: float

    total_attributed_orders: int
    delivered_orders: int
    returned_orders: int
    delivery_rate_percent: float

