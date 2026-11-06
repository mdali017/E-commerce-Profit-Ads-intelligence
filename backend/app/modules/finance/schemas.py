from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.modules.finance.models import ExpenseCategory, RecurrencePeriod


# ==========================================
# Operating Expense Schemas
# ==========================================

class ExpenseCreate(BaseModel):
    title: str = Field(..., max_length=255)
    category: str = Field(default=ExpenseCategory.OTHER.value)
    amount: Decimal = Field(..., gt=0)
    expense_date: date
    is_recurring: bool = False
    recurrence_period: str = Field(default=RecurrencePeriod.ONE_TIME.value)
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    expense_date: Optional[date] = None
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    category: str
    amount: Decimal
    expense_date: date
    is_recurring: bool
    recurrence_period: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# P&L Waterfall & Summary Schemas
# ==========================================

class PnLWaterfallItem(BaseModel):
    line_name: str
    amount: Decimal
    percentage_of_revenue: float
    type: str  # "addition", "deduction", "subtotal", "metric"


class PnLSummaryResponse(BaseModel):
    currency: str = "BDT"
    date_basis: str  # "delivery_date" or "order_date"
    start_date: date
    end_date: date

    # Order Volume Metrics
    total_orders_placed: int
    delivered_orders_count: int
    cancelled_orders_count: int
    returned_orders_count: int
    delivery_rate_percent: float

    # Core Financial Waterfall
    gross_sales: Decimal
    cancelled_returned_amount: Decimal
    delivered_revenue: Decimal

    total_cogs: Decimal
    gross_profit: Decimal
    gross_margin_percent: float

    courier_charges: Decimal  # Delivery fee + COD 1% + Return charges
    packaging_handling_fees: Decimal
    payment_gateway_fees: Decimal
    ad_spend: Decimal

    contribution_profit: Decimal
    contribution_margin_percent: float

    operating_expenses: Decimal
    net_profit: Decimal
    net_margin_percent: float

    # Efficiency Benchmarks
    breakeven_roas: float
    actual_delivered_roas: float

    waterfall: List[PnLWaterfallItem]


# ==========================================
# Timeseries / Daily Trends Schemas
# ==========================================

class PnLTimeSeriesPoint(BaseModel):
    report_date: date
    delivered_orders: int
    delivered_revenue: Decimal
    cogs: Decimal
    courier_cost: Decimal
    packaging_handling: Decimal
    ad_spend: Decimal
    operating_expense: Decimal
    gross_profit: Decimal
    net_profit: Decimal
    is_profitable: bool


# ==========================================
# Break-Even Benchmark Schemas
# ==========================================

class BreakEvenAnalysisResponse(BaseModel):
    delivered_revenue: Decimal
    variable_costs: Decimal
    variable_cost_ratio: float
    gross_margin_ratio: float
    breakeven_roas: float
    actual_delivered_roas: float
    safety_margin_percent: float
    status: str  # "profitable", "break_even", "loss_making"
    recommended_action: str


# ==========================================
# Product & Campaign P&L Breakdowns
# ==========================================

class ProductPnLItem(BaseModel):
    product_id: str
    product_name: str
    sku: Optional[str] = None
    units_sold: int
    delivered_revenue: Decimal
    cogs: Decimal
    gross_profit: Decimal
    gross_margin_percent: float


class CampaignPnLItem(BaseModel):
    campaign_id: str
    campaign_name: str
    ad_spend: Decimal
    delivered_revenue: Decimal
    cogs: Decimal
    courier_packaging_cost: Decimal
    gross_profit: Decimal
    net_contribution: Decimal
    delivered_roas: float
    poas: float

