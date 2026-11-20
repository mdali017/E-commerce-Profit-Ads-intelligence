import csv
import io
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, and_, or_, func, desc, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.finance.models import OperatingExpense, ExpenseCategory, RecurrencePeriod
from app.modules.finance.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    PnLSummaryResponse,
    PnLWaterfallItem,
    PnLTimeSeriesPoint,
    BreakEvenAnalysisResponse,
    ProductPnLItem,
    CampaignPnLItem,
)
from app.modules.orders.models import Order, OrderItem, OrderStatus, PaymentStatus, OrderAttribution
from app.modules.couriers.models import CourierShipment, ShipmentStatus
from app.modules.ads.models import MetaDailyInsight, MetaCampaign
from app.modules.workspaces.models import Tenant
from app.core.redis import get_cache, set_cache, delete_cache


class FinanceService:
    """
    Module 7: Profit & Loss (P&L) Engine & Financial Intelligence.
    Computes mathematical waterfall, daily trends, OPEX proration, Break-even ROAS,
    and product/campaign profitability breakdowns.
    """

    # ==========================================
    # 1. Operating Expense Management
    # ==========================================

    @classmethod
    async def create_expense(
        cls, db: AsyncSession, tenant_id: str, expense_in: ExpenseCreate
    ) -> OperatingExpense:
        expense = OperatingExpense(
            tenant_id=tenant_id,
            title=expense_in.title,
            category=expense_in.category,
            amount=expense_in.amount,
            expense_date=expense_in.expense_date,
            is_recurring=expense_in.is_recurring,
            recurrence_period=expense_in.recurrence_period,
            notes=expense_in.notes,
        )
        db.add(expense)
        await db.commit()
        await db.refresh(expense)
        return expense

    @classmethod
    async def get_expenses(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category: Optional[str] = None,
    ) -> List[OperatingExpense]:
        conditions = [OperatingExpense.tenant_id == tenant_id]
        if start_date:
            conditions.append(OperatingExpense.expense_date >= start_date)
        if end_date:
            conditions.append(OperatingExpense.expense_date <= end_date)
        if category:
            conditions.append(OperatingExpense.category == category)

        stmt = (
            select(OperatingExpense)
            .where(and_(*conditions))
            .order_by(OperatingExpense.expense_date.desc(), OperatingExpense.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    @classmethod
    async def get_expense(
        cls, db: AsyncSession, tenant_id: str, expense_id: str
    ) -> Optional[OperatingExpense]:
        stmt = select(OperatingExpense).where(
            and_(
                OperatingExpense.tenant_id == tenant_id,
                OperatingExpense.id == expense_id,
            )
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @classmethod
    async def update_expense(
        cls, db: AsyncSession, tenant_id: str, expense_id: str, update_in: ExpenseUpdate
    ) -> Optional[OperatingExpense]:
        expense = await cls.get_expense(db, tenant_id, expense_id)
        if not expense:
            return None

        update_data = update_in.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(expense, key, val)

        await db.commit()
        await db.refresh(expense)
        return expense

    @classmethod
    async def delete_expense(
        cls, db: AsyncSession, tenant_id: str, expense_id: str
    ) -> bool:
        expense = await cls.get_expense(db, tenant_id, expense_id)
        if not expense:
            return False

        await db.delete(expense)
        await db.commit()
        return True

    @classmethod
    async def calculate_operating_expenses_for_period(
        cls, db: AsyncSession, tenant_id: str, start_date: date, end_date: date
    ) -> Decimal:
        """
        PRD Rule PNL-04:
        - Direct one-time expenses occurring between start_date and end_date.
        - Prorated monthly expenses: (monthly_amount / 30.0) * num_days.
        - Prorated weekly expenses: (weekly_amount / 7.0) * num_days.
        """
        num_days = Decimal(str(max((end_date - start_date).days + 1, 1)))

        # 1. Direct one-time expenses within the window
        one_time_stmt = select(func.coalesce(func.sum(OperatingExpense.amount), Decimal("0.00"))).where(
            and_(
                OperatingExpense.tenant_id == tenant_id,
                OperatingExpense.is_recurring == False,
                OperatingExpense.expense_date >= start_date,
                OperatingExpense.expense_date <= end_date,
            )
        )
        one_time_res = await db.execute(one_time_stmt)
        one_time_total = Decimal(str(one_time_res.scalar_one()))

        # 2. Recurring expenses for this tenant
        rec_stmt = select(OperatingExpense).where(
            and_(
                OperatingExpense.tenant_id == tenant_id,
                OperatingExpense.is_recurring == True,
            )
        )
        rec_res = await db.execute(rec_stmt)
        recurring_expenses = rec_res.scalars().all()

        prorated_recurring = Decimal("0.00")
        for rec in recurring_expenses:
            if rec.recurrence_period == RecurrencePeriod.MONTHLY.value:
                daily_cost = Decimal(str(rec.amount)) / Decimal("30.0")
                prorated_recurring += daily_cost * num_days
            elif rec.recurrence_period == RecurrencePeriod.WEEKLY.value:
                daily_cost = Decimal(str(rec.amount)) / Decimal("7.0")
                prorated_recurring += daily_cost * num_days
            else:
                # default fallback
                daily_cost = Decimal(str(rec.amount)) / Decimal("30.0")
                prorated_recurring += daily_cost * num_days

        total_opex = (one_time_total + prorated_recurring).quantize(Decimal("0.01"))
        return total_opex

    # ==========================================
    # 2. Mathematical P&L Waterfall Engine
    # ==========================================

    @classmethod
    async def get_pnl_summary(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        date_basis: str = "delivery_date",
    ) -> PnLSummaryResponse:
        """
        Executes the exact 11-step P&L Waterfall Formula from PRD Section 13.1.
        """
        if not end_date:
            end_date = datetime.utcnow().date()
        if not start_date:
            start_date = end_date - timedelta(days=29)  # Default 30-day view

        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        cache_key = f"pnl:summary:{tenant_id}:{date_basis}:{start_date.isoformat()}:{end_date.isoformat()}"
        cached = await get_cache(cache_key)
        if cached:
            try:
                return PnLSummaryResponse(**cached)
            except Exception:
                pass

        # 1. Fetch Tenant currency
        tenant_stmt = select(Tenant).where(Tenant.id == tenant_id)
        tenant_res = await db.execute(tenant_stmt)
        tenant_obj = tenant_res.scalar_one_or_none()
        currency = tenant_obj.currency if tenant_obj else "BDT"

        # 2. Fetch Aggregated Orders Metrics directly via SQL (zero in-memory ORM bloat)
        placed_agg_stmt = select(
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total_amount), Decimal("0.00")).label("gross_sales"),
        ).where(
            and_(
                Order.tenant_id == tenant_id,
                Order.created_at >= start_dt,
                Order.created_at <= end_dt,
            )
        )
        placed_agg = (await db.execute(placed_agg_stmt)).one()
        total_orders_placed = placed_agg.count
        gross_sales = placed_agg.gross_sales

        if date_basis == "delivery_date":
            status_date_filter = and_(Order.updated_at >= start_dt, Order.updated_at <= end_dt)
        else:
            status_date_filter = and_(Order.created_at >= start_dt, Order.created_at <= end_dt)

        status_agg_stmt = select(
            Order.status,
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total_amount), Decimal("0.00")).label("revenue"),
            func.coalesce(func.sum(Order.total_cogs), Decimal("0.00")).label("cogs"),
            func.coalesce(func.sum(Order.total_packaging_cost), Decimal("0.00")).label("packaging"),
            func.coalesce(func.sum(Order.total_handling_cost), Decimal("0.00")).label("handling"),
            func.coalesce(
                func.sum(
                    case(
                        (func.lower(Order.payment_method) != "cod", Order.total_amount * Decimal("0.015")),
                        else_=Decimal("0.00"),
                    )
                ),
                Decimal("0.00"),
            ).label("gateway_fees"),
        ).where(
            and_(
                Order.tenant_id == tenant_id,
                status_date_filter,
                Order.status.in_([
                    OrderStatus.DELIVERED.value,
                    OrderStatus.CANCELLED.value,
                    OrderStatus.RETURNED.value,
                    OrderStatus.DELIVERED,
                    OrderStatus.CANCELLED,
                    OrderStatus.RETURNED,
                ]),
            )
        ).group_by(Order.status)

        status_rows = (await db.execute(status_agg_stmt)).all()
        status_map = {}
        for r in status_rows:
            st_key = r.status.value if hasattr(r.status, "value") else str(r.status)
            status_map[st_key] = r

        delivered_row = status_map.get(OrderStatus.DELIVERED.value)
        cancelled_row = status_map.get(OrderStatus.CANCELLED.value)
        returned_row = status_map.get(OrderStatus.RETURNED.value)

        delivered_orders_count = delivered_row.count if delivered_row else 0
        cancelled_orders_count = cancelled_row.count if cancelled_row else 0
        returned_orders_count = returned_row.count if returned_row else 0

        delivery_rate_percent = (
            round((delivered_orders_count / total_orders_placed) * 100, 2)
            if total_orders_placed > 0
            else 0.0
        )

        delivered_revenue = delivered_row.revenue if delivered_row else Decimal("0.00")
        total_cogs = delivered_row.cogs if delivered_row else Decimal("0.00")
        packaging_handling_fees = (
            (delivered_row.packaging + delivered_row.handling)
            if delivered_row
            else Decimal("0.00")
        )
        payment_gateway_fees = delivered_row.gateway_fees if delivered_row else Decimal("0.00")

        cancelled_returned_amount = (
            (cancelled_row.revenue if cancelled_row else Decimal("0.00"))
            + (returned_row.revenue if returned_row else Decimal("0.00"))
        )

        # 4. Courier Charges (Delivery + COD fee + Return charges) directly aggregated in SQL
        courier_agg_stmt = select(
            func.coalesce(func.sum(CourierShipment.delivery_fee), Decimal("0.00")).label("delivery_fee"),
            func.coalesce(func.sum(CourierShipment.cod_fee), Decimal("0.00")).label("cod_fee"),
            func.coalesce(
                func.sum(
                    case(
                        (CourierShipment.status == ShipmentStatus.RETURNED,
                         func.coalesce(CourierShipment.return_fee, CourierShipment.delivery_fee, Decimal("0.00"))),
                        else_=Decimal("0.00"),
                    )
                ),
                Decimal("0.00"),
            ).label("return_fee"),
        ).where(
            and_(
                CourierShipment.tenant_id == tenant_id,
                CourierShipment.created_at >= start_dt,
                CourierShipment.created_at <= end_dt,
            )
        )
        c_agg = (await db.execute(courier_agg_stmt)).one()
        courier_charges = c_agg.delivery_fee + c_agg.cod_fee + c_agg.return_fee

        # Fallback if no explicit shipments: estimate ৳80 delivery fee per delivered + return order
        if courier_charges == Decimal("0.00") and (delivered_orders_count > 0 or returned_orders_count > 0):
            courier_charges = Decimal(str((delivered_orders_count + returned_orders_count * 2) * 80.0)).quantize(Decimal("0.01"))

        # 5. Ad Spend
        ads_stmt = select(func.coalesce(func.sum(MetaDailyInsight.spend), Decimal("0.00"))).where(
            and_(
                MetaDailyInsight.tenant_id == tenant_id,
                MetaDailyInsight.report_date >= start_date,
                MetaDailyInsight.report_date <= end_date,
            )
        )
        ads_res = await db.execute(ads_stmt)
        meta_spend = Decimal(str(ads_res.scalar_one()))

        # Any non-meta ad expenses from OPEX marketing_other
        non_meta_ads_stmt = select(func.coalesce(func.sum(OperatingExpense.amount), Decimal("0.00"))).where(
            and_(
                OperatingExpense.tenant_id == tenant_id,
                OperatingExpense.category == ExpenseCategory.MARKETING_OTHER.value,
                OperatingExpense.expense_date >= start_date,
                OperatingExpense.expense_date <= end_date,
            )
        )
        non_meta_res = await db.execute(non_meta_ads_stmt)
        other_ad_spend = Decimal(str(non_meta_res.scalar_one()))
        total_ad_spend = meta_spend + other_ad_spend

        # 6. Operating Expenses
        operating_expenses = await cls.calculate_operating_expenses_for_period(
            db, tenant_id, start_date, end_date
        )

        # 7. Waterfall Calculations
        gross_profit = delivered_revenue - total_cogs
        gross_margin_percent = (
            round(float(gross_profit / delivered_revenue) * 100, 2)
            if delivered_revenue > 0
            else 0.0
        )

        contribution_profit = (
            gross_profit
            - courier_charges
            - packaging_handling_fees
            - payment_gateway_fees
            - total_ad_spend
        )
        contribution_margin_percent = (
            round(float(contribution_profit / delivered_revenue) * 100, 2)
            if delivered_revenue > 0
            else 0.0
        )

        net_profit = contribution_profit - operating_expenses
        net_margin_percent = (
            round(float(net_profit / delivered_revenue) * 100, 2)
            if delivered_revenue > 0
            else 0.0
        )

        # 8. Break-even ROAS Benchmark
        # Break-even ROAS = 1 / Gross Margin Ratio (after variable product & delivery costs)
        variable_costs = total_cogs + courier_charges + packaging_handling_fees + payment_gateway_fees
        net_product_margin = delivered_revenue - variable_costs
        if delivered_revenue > 0 and net_product_margin > 0:
            breakeven_roas = round(float(delivered_revenue / net_product_margin), 2)
        else:
            breakeven_roas = 0.0

        actual_delivered_roas = (
            round(float(delivered_revenue / total_ad_spend), 2)
            if total_ad_spend > 0
            else 0.0
        )

        # 9. Build Waterfall Items List for Frontend Chart
        def pct(amt: Decimal) -> float:
            return round(float(amt / delivered_revenue) * 100, 2) if delivered_revenue > 0 else 0.0

        waterfall: List[PnLWaterfallItem] = [
            PnLWaterfallItem(line_name="Gross Sales", amount=gross_sales, percentage_of_revenue=pct(gross_sales), type="metric"),
            PnLWaterfallItem(line_name="Cancelled & Returned", amount=-cancelled_returned_amount, percentage_of_revenue=pct(cancelled_returned_amount), type="deduction"),
            PnLWaterfallItem(line_name="Delivered Revenue", amount=delivered_revenue, percentage_of_revenue=100.0, type="subtotal"),
            PnLWaterfallItem(line_name="Product Cost (COGS)", amount=-total_cogs, percentage_of_revenue=pct(total_cogs), type="deduction"),
            PnLWaterfallItem(line_name="Gross Profit", amount=gross_profit, percentage_of_revenue=gross_margin_percent, type="subtotal"),
            PnLWaterfallItem(line_name="Courier Charges", amount=-courier_charges, percentage_of_revenue=pct(courier_charges), type="deduction"),
            PnLWaterfallItem(line_name="Packaging & Handling", amount=-packaging_handling_fees, percentage_of_revenue=pct(packaging_handling_fees), type="deduction"),
            PnLWaterfallItem(line_name="Payment Gateway Fees", amount=-payment_gateway_fees, percentage_of_revenue=pct(payment_gateway_fees), type="deduction"),
            PnLWaterfallItem(line_name="Ad Spend (Meta & Channels)", amount=-total_ad_spend, percentage_of_revenue=pct(total_ad_spend), type="deduction"),
            PnLWaterfallItem(line_name="Contribution Profit", amount=contribution_profit, percentage_of_revenue=contribution_margin_percent, type="subtotal"),
            PnLWaterfallItem(line_name="Operating Expenses (OPEX)", amount=-operating_expenses, percentage_of_revenue=pct(operating_expenses), type="deduction"),
            PnLWaterfallItem(line_name="Net Profit / Loss", amount=net_profit, percentage_of_revenue=net_margin_percent, type="subtotal"),
        ]

        resp = PnLSummaryResponse(
            currency=currency,
            date_basis=date_basis,
            start_date=start_date,
            end_date=end_date,
            total_orders_placed=total_orders_placed,
            delivered_orders_count=delivered_orders_count,
            cancelled_orders_count=cancelled_orders_count,
            returned_orders_count=returned_orders_count,
            delivery_rate_percent=delivery_rate_percent,
            gross_sales=gross_sales,
            cancelled_returned_amount=cancelled_returned_amount,
            delivered_revenue=delivered_revenue,
            total_cogs=total_cogs,
            gross_profit=gross_profit,
            gross_margin_percent=gross_margin_percent,
            courier_charges=courier_charges,
            packaging_handling_fees=packaging_handling_fees,
            payment_gateway_fees=payment_gateway_fees,
            ad_spend=total_ad_spend,
            contribution_profit=contribution_profit,
            contribution_margin_percent=contribution_margin_percent,
            operating_expenses=operating_expenses,
            net_profit=net_profit,
            net_margin_percent=net_margin_percent,
            breakeven_roas=breakeven_roas,
            actual_delivered_roas=actual_delivered_roas,
            waterfall=waterfall,
        )
        await set_cache(cache_key, resp.model_dump(mode="json"), ttl_seconds=180)
        return resp

    # ==========================================
    # 3. Daily Profit & Loss Trend Timeseries
    # ==========================================

    @classmethod
    async def get_pnl_timeseries(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[PnLTimeSeriesPoint]:
        """
        Generates day-by-day profitability data points for trend bar charts.
        Profitable days render green, loss-making days render red.
        """
        if not end_date:
            end_date = datetime.utcnow().date()
        if not start_date:
            start_date = end_date - timedelta(days=13)  # Last 14 days default

        num_days = (end_date - start_date).days + 1
        points: List[PnLTimeSeriesPoint] = []

        # Pre-fetch delivered orders via grouped SQL aggregation (zero ORM entity overhead)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())
        orders_stmt = (
            select(
                func.date(Order.updated_at).label("order_day"),
                func.count(Order.id).label("delivered_count"),
                func.coalesce(func.sum(Order.total_amount), Decimal("0.00")).label("revenue"),
                func.coalesce(func.sum(Order.total_cogs), Decimal("0.00")).label("cogs"),
                func.coalesce(
                    func.sum(
                        func.coalesce(Order.total_packaging_cost, Decimal("0.00"))
                        + func.coalesce(Order.total_handling_cost, Decimal("0.00"))
                    ),
                    Decimal("0.00"),
                ).label("pack_handling"),
            )
            .where(
                and_(
                    Order.tenant_id == tenant_id,
                    Order.status.in_([OrderStatus.DELIVERED.value, OrderStatus.DELIVERED]),
                    Order.updated_at >= start_dt,
                    Order.updated_at <= end_dt,
                )
            )
            .group_by(func.date(Order.updated_at))
        )
        o_res = await db.execute(orders_stmt)
        orders_by_date = {row.order_day: row for row in o_res.all()}

        # Pre-fetch ads insights via SQL aggregation
        ads_stmt = (
            select(
                MetaDailyInsight.report_date.label("ad_day"),
                func.coalesce(func.sum(MetaDailyInsight.spend), Decimal("0.00")).label("spend"),
            )
            .where(
                and_(
                    MetaDailyInsight.tenant_id == tenant_id,
                    MetaDailyInsight.report_date >= start_date,
                    MetaDailyInsight.report_date <= end_date,
                )
            )
            .group_by(MetaDailyInsight.report_date)
        )
        ad_res = await db.execute(ads_stmt)
        ads_by_date: Dict[date, Decimal] = {row.ad_day: Decimal(str(row.spend)) for row in ad_res.all()}

        # Pre-fetch daily opex proration
        rec_stmt = select(OperatingExpense).where(
            and_(
                OperatingExpense.tenant_id == tenant_id,
                OperatingExpense.is_recurring == True,
            )
        )
        rec_res = await db.execute(rec_stmt)
        recurring_expenses = rec_res.scalars().all()
        daily_recurring_opex = Decimal("0.00")
        for rec in recurring_expenses:
            if rec.recurrence_period == RecurrencePeriod.MONTHLY.value:
                daily_recurring_opex += Decimal(str(rec.amount)) / Decimal("30.0")
            elif rec.recurrence_period == RecurrencePeriod.WEEKLY.value:
                daily_recurring_opex += Decimal(str(rec.amount)) / Decimal("7.0")

        # One-time opex aggregated by date
        one_time_stmt = (
            select(
                OperatingExpense.expense_date.label("expense_day"),
                func.coalesce(func.sum(OperatingExpense.amount), Decimal("0.00")).label("expense_amount"),
            )
            .where(
                and_(
                    OperatingExpense.tenant_id == tenant_id,
                    OperatingExpense.is_recurring == False,
                    OperatingExpense.expense_date >= start_date,
                    OperatingExpense.expense_date <= end_date,
                )
            )
            .group_by(OperatingExpense.expense_date)
        )
        ot_res = await db.execute(one_time_stmt)
        one_time_by_date: Dict[date, Decimal] = {
            row.expense_day: Decimal(str(row.expense_amount)) for row in ot_res.all()
        }

        for i in range(num_days):
            current_date = start_date + timedelta(days=i)
            o_row = orders_by_date.get(current_date)
            delivered_cnt = o_row.delivered_count if o_row else 0
            day_revenue = Decimal(str(o_row.revenue)) if o_row else Decimal("0.00")
            day_cogs = Decimal(str(o_row.cogs)) if o_row else Decimal("0.00")
            day_pack = Decimal(str(o_row.pack_handling)) if o_row else Decimal("0.00")
            day_courier = Decimal(str(delivered_cnt * 80.0))  # standard ~80 per delivered order
            day_ad_spend = ads_by_date.get(current_date, Decimal("0.00"))
            day_opex = (daily_recurring_opex + one_time_by_date.get(current_date, Decimal("0.00"))).quantize(Decimal("0.01"))

            day_gross_profit = day_revenue - day_cogs
            day_net_profit = day_gross_profit - day_courier - day_pack - day_ad_spend - day_opex

            points.append(
                PnLTimeSeriesPoint(
                    report_date=current_date,
                    delivered_orders=delivered_cnt,
                    delivered_revenue=day_revenue,
                    cogs=day_cogs,
                    courier_cost=day_courier,
                    packaging_handling=day_pack,
                    ad_spend=day_ad_spend,
                    operating_expense=day_opex,
                    gross_profit=day_gross_profit,
                    net_profit=day_net_profit,
                    is_profitable=day_net_profit >= Decimal("0.00"),
                )
            )

        return points

    # ==========================================
    # 4. Break-Even Benchmark & Analysis
    # ==========================================

    @classmethod
    async def get_breakeven_analysis(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> BreakEvenAnalysisResponse:
        """
        Computes the Break-even ROAS benchmark and compares it against actual delivered ROAS.
        """
        summary = await cls.get_pnl_summary(db, tenant_id, start_date, end_date)
        delivered_revenue = summary.delivered_revenue
        variable_costs = summary.total_cogs + summary.courier_charges + summary.packaging_handling_fees + summary.payment_gateway_fees

        var_ratio = float(variable_costs / delivered_revenue) if delivered_revenue > 0 else 0.0
        gross_margin_ratio = float((delivered_revenue - variable_costs) / delivered_revenue) if delivered_revenue > 0 else 0.0

        breakeven_roas = summary.breakeven_roas
        actual_delivered_roas = summary.actual_delivered_roas

        if breakeven_roas > 0:
            safety_margin = round(((actual_delivered_roas - breakeven_roas) / breakeven_roas) * 100, 2)
        else:
            safety_margin = 0.0

        if actual_delivered_roas > breakeven_roas:
            status = "profitable"
            recommended_action = f"Campaigns are operating comfortably above break-even ({actual_delivered_roas}x vs {breakeven_roas}x). Scaling ad budgets is mathematically safe."
        elif actual_delivered_roas == breakeven_roas and breakeven_roas > 0:
            status = "break_even"
            recommended_action = "Currently trading at exact break-even. Optimize ad creative or reduce courier return rates before increasing spend."
        else:
            status = "loss_making"
            recommended_action = f"Actual delivered ROAS ({actual_delivered_roas}x) is below break-even threshold ({breakeven_roas}x). Immediate ad budget reduction or product price increase required."

        return BreakEvenAnalysisResponse(
            delivered_revenue=delivered_revenue,
            variable_costs=variable_costs,
            variable_cost_ratio=round(var_ratio, 4),
            gross_margin_ratio=round(gross_margin_ratio, 4),
            breakeven_roas=breakeven_roas,
            actual_delivered_roas=actual_delivered_roas,
            safety_margin_percent=safety_margin,
            status=status,
            recommended_action=recommended_action,
        )

    # ==========================================
    # 5. Product & Campaign Profitability Breakdown
    # ==========================================

    @classmethod
    async def get_product_pnl_breakdown(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[ProductPnLItem]:
        """
        Ranks products by real Delivered Revenue and Gross Profit contributions.
        """
        if not end_date:
            end_date = datetime.utcnow().date()
        if not start_date:
            start_date = end_date - timedelta(days=29)

        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        # Join delivered OrderItem with Order
        stmt = (
            select(
                OrderItem.product_id,
                OrderItem.product_name,
                OrderItem.sku,
                func.sum(OrderItem.quantity).label("total_units"),
                func.sum(OrderItem.total_price).label("total_revenue"),
                func.sum(OrderItem.total_cost).label("total_cogs"),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                and_(
                    Order.tenant_id == tenant_id,
                    Order.status == OrderStatus.DELIVERED,
                    Order.updated_at >= start_dt,
                    Order.updated_at <= end_dt,
                )
            )
            .group_by(OrderItem.product_id, OrderItem.product_name, OrderItem.sku)
            .order_by(desc("total_revenue"))
        )
        res = await db.execute(stmt)
        rows = res.all()

        items: List[ProductPnLItem] = []
        for r in rows:
            rev = Decimal(str(r.total_revenue or 0))
            cogs = Decimal(str(r.total_cogs or 0))
            gp = rev - cogs
            margin = round(float(gp / rev) * 100, 2) if rev > 0 else 0.0

            items.append(
                ProductPnLItem(
                    product_id=r.product_id,
                    product_name=r.product_name,
                    sku=r.sku,
                    units_sold=int(r.total_units or 0),
                    delivered_revenue=rev,
                    cogs=cogs,
                    gross_profit=gp,
                    gross_margin_percent=margin,
                )
            )
        return items

    @classmethod
    async def get_campaign_pnl_breakdown(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[CampaignPnLItem]:
        """
        Calculates Net Contribution and POAS per active Meta campaign.
        """
        if not end_date:
            end_date = datetime.utcnow().date()
        if not start_date:
            start_date = end_date - timedelta(days=29)

        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        # Fetch active campaigns
        camp_stmt = select(MetaCampaign).where(MetaCampaign.tenant_id == tenant_id)
        c_res = await db.execute(camp_stmt)
        campaigns = c_res.scalars().all()

        items: List[CampaignPnLItem] = []
        for camp in campaigns:
            # Spend
            spend_stmt = select(func.coalesce(func.sum(MetaDailyInsight.spend), Decimal("0.00"))).where(
                and_(
                    MetaDailyInsight.tenant_id == tenant_id,
                    MetaDailyInsight.campaign_id == camp.campaign_id,
                    MetaDailyInsight.report_date >= start_date,
                    MetaDailyInsight.report_date <= end_date,
                )
            )
            s_res = await db.execute(spend_stmt)
            spend = Decimal(str(s_res.scalar_one()))

            # Delivered orders attributed to this campaign
            order_stmt = (
                select(Order)
                .join(OrderAttribution, Order.id == OrderAttribution.order_id)
                .where(
                    and_(
                        Order.tenant_id == tenant_id,
                        Order.status == OrderStatus.DELIVERED,
                        Order.updated_at >= start_dt,
                        Order.updated_at <= end_dt,
                        or_(
                            OrderAttribution.campaign_id == camp.campaign_id,
                            OrderAttribution.utm_campaign.ilike(camp.name),
                        ),
                    )
                )
            )
            o_res = await db.execute(order_stmt)
            orders = o_res.scalars().all()

            revenue = sum((Decimal(str(o.total_amount or 0)) for o in orders), Decimal("0.00"))
            cogs = sum((Decimal(str(o.total_cogs or 0)) for o in orders), Decimal("0.00"))
            pack = sum(((Decimal(str(o.total_packaging_cost or 0)) + Decimal(str(o.total_handling_cost or 0))) for o in orders), Decimal("0.00"))
            courier = Decimal(str(len(orders) * 80.0))
            courier_pack = courier + pack

            gross_profit = revenue - cogs
            net_contrib = gross_profit - courier_pack - spend
            roas = round(float(revenue / spend), 2) if spend > 0 else 0.0
            poas = round(float(gross_profit / spend), 2) if spend > 0 else 0.0

            items.append(
                CampaignPnLItem(
                    campaign_id=camp.campaign_id,
                    campaign_name=camp.name,
                    ad_spend=spend,
                    delivered_revenue=revenue,
                    cogs=cogs,
                    courier_packaging_cost=courier_pack,
                    gross_profit=gross_profit,
                    net_contribution=net_contrib,
                    delivered_roas=roas,
                    poas=poas,
                )
            )

        return items

    # ==========================================
    # 6. One-Click P&L CSV Export
    # ==========================================

    @classmethod
    async def generate_pnl_csv(
        cls,
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        date_basis: str = "delivery_date",
    ) -> str:
        """
        Exports full Waterfall P&L statement to formatted CSV.
        """
        summary = await cls.get_pnl_summary(db, tenant_id, start_date, end_date, date_basis)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["E-commerce Profit & Ads Intelligence SaaS - Financial P&L Statement"])
        writer.writerow(["Period", f"{summary.start_date} to {summary.end_date}"])
        writer.writerow(["Date Basis", summary.date_basis])
        writer.writerow(["Currency", summary.currency])
        writer.writerow([])

        writer.writerow(["Waterfall Line Item", f"Amount ({summary.currency})", "% of Delivered Revenue", "Category Type"])
        for item in summary.waterfall:
            writer.writerow([item.line_name, f"{item.amount:.2f}", f"{item.percentage_of_revenue:.2f}%", item.type])

        writer.writerow([])
        writer.writerow(["Volume & Efficiency Benchmarks", "Value"])
        writer.writerow(["Total Orders Placed", summary.total_orders_placed])
        writer.writerow(["Delivered Orders", summary.delivered_orders_count])
        writer.writerow(["Cancelled Orders", summary.cancelled_orders_count])
        writer.writerow(["Returned Orders", summary.returned_orders_count])
        writer.writerow(["Delivery Success Rate", f"{summary.delivery_rate_percent}%"])
        writer.writerow(["Actual Delivered ROAS", f"{summary.actual_delivered_roas}x"])
        writer.writerow(["Break-even ROAS Benchmark", f"{summary.breakeven_roas}x"])

        return output.getvalue()
