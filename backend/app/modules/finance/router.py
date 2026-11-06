from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_tenant
from app.modules.finance.models import ExpenseCategory, RecurrencePeriod
from app.modules.finance.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    PnLSummaryResponse,
    PnLTimeSeriesPoint,
    BreakEvenAnalysisResponse,
    ProductPnLItem,
    CampaignPnLItem,
)
from app.modules.finance.service import FinanceService

router = APIRouter(prefix="/finance", tags=["Profit & Loss (P&L) Engine & Finance"])


# ==========================================
# Operating Expenses Endpoints
# ==========================================

@router.get("/expenses/categories", response_model=List[dict])
async def get_expense_categories():
    """Returns predefined operating expense categories with human-readable labels."""
    return [
        {"key": ExpenseCategory.SALARIES.value, "label": "Staff Salaries & Wages"},
        {"key": ExpenseCategory.RENT.value, "label": "Office & Warehouse Rent"},
        {"key": ExpenseCategory.UTILITIES.value, "label": "Electricity, Internet & Utilities"},
        {"key": ExpenseCategory.SOFTWARE.value, "label": "Software & Subscriptions"},
        {"key": ExpenseCategory.MARKETING_OTHER.value, "label": "Non-Meta Marketing & Influencer"},
        {"key": ExpenseCategory.OFFICE.value, "label": "Office Supplies & Admin"},
        {"key": ExpenseCategory.PACKAGING_BULK.value, "label": "Bulk Packaging Materials"},
        {"key": ExpenseCategory.TRANSPORT.value, "label": "Fuel & Transportation"},
        {"key": ExpenseCategory.OTHER.value, "label": "Miscellaneous Expenses"},
    ]


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_in: ExpenseCreate,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Records a new operating expense (one-time or monthly recurring)."""
    return await FinanceService.create_expense(db, tenant_id, expense_in)


@router.get("/expenses", response_model=List[ExpenseResponse])
async def list_expenses(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Lists operating expenses with optional date range and category filtering."""
    return await FinanceService.get_expenses(db, tenant_id, start_date, end_date, category)


@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense_detail(
    expense_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a specific operating expense."""
    expense = await FinanceService.get_expense(db, tenant_id, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    update_in: ExpenseUpdate,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Updates an existing operating expense."""
    expense = await FinanceService.update_expense(db, tenant_id, expense_id, update_in)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Deletes an operating expense."""
    success = await FinanceService.delete_expense(db, tenant_id, expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


# ==========================================
# P&L Financial Engine & Intelligence Endpoints
# ==========================================

@router.get("/pnl/summary", response_model=PnLSummaryResponse)
async def get_pnl_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    date_basis: str = Query("delivery_date", pattern="^(delivery_date|order_date)$"),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Computes the canonical 11-step P&L Waterfall and Net Profit for the selected date range.
    Supports 'delivery_date' (cash/accrual) and 'order_date' (cohort) views.
    """
    return await FinanceService.get_pnl_summary(
        db, tenant_id, start_date, end_date, date_basis
    )


@router.get("/pnl/timeseries", response_model=List[PnLTimeSeriesPoint])
async def get_pnl_timeseries(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns day-by-day profitability data points for trend charts.
    Highlights profitable days (green) and loss days (red).
    """
    return await FinanceService.get_pnl_timeseries(db, tenant_id, start_date, end_date)


@router.get("/pnl/breakeven", response_model=BreakEvenAnalysisResponse)
async def get_breakeven_analysis(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Calculates Break-even ROAS benchmark and compares it to actual delivered ROAS.
    """
    return await FinanceService.get_breakeven_analysis(db, tenant_id, start_date, end_date)


@router.get("/pnl/by-product", response_model=List[ProductPnLItem])
async def get_product_pnl(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns product-level revenue, delivered units, COGS, and gross profit margins.
    """
    return await FinanceService.get_product_pnl_breakdown(db, tenant_id, start_date, end_date)


@router.get("/pnl/by-campaign", response_model=List[CampaignPnLItem])
async def get_campaign_pnl(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns campaign-level ad spend, real delivered revenue, Net Contribution, and POAS.
    """
    return await FinanceService.get_campaign_pnl_breakdown(db, tenant_id, start_date, end_date)


@router.get("/pnl/export/csv")
async def export_pnl_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    date_basis: str = Query("delivery_date", pattern="^(delivery_date|order_date)$"),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Generates and downloads a complete formatted CSV of the P&L statement.
    """
    csv_content = await FinanceService.generate_pnl_csv(
        db, tenant_id, start_date, end_date, date_basis
    )
    filename = f"pnl_statement_{start_date or 'start'}_to_{end_date or 'end'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
