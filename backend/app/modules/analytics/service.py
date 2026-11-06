import uuid
import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.analytics.models import (
    ExecutiveAlert,
    AlertType,
    AlertSeverity,
    AIBriefing,
)
from app.modules.analytics.schemas import (
    ExecutiveKPIs,
    AlertResponse,
    BleedingCampaignSummary,
    SourceRevenueItem,
    DailyProfitTrendPoint,
    ExecutiveOverviewResponse,
    AIBriefingGenerateRequest,
    AIBriefingResponse,
)
from app.modules.finance.service import FinanceService
from app.modules.couriers.service import CourierService
from app.modules.crm.service import CRMService
from app.modules.ads.service import AdsService
from app.modules.orders.models import Order, OrderStatus
from app.modules.crm.models import Customer, CustomerSegment

logger = logging.getLogger("analytics_service")


class AnalyticsService:
    """
    Module 10: Unified Executive Dashboard & AI Business Analyst Engine.
    Correlates financial waterfall, advertising attribution, logistics delivery rates,
    and customer return risk into real-time executive intelligence and actionable AI briefings.
    """

    @classmethod
    def resolve_date_range(
        cls,
        date_range: str = "last_7_days",
        custom_start: Optional[date] = None,
        custom_end: Optional[date] = None,
    ) -> Tuple[date, date]:
        """Resolves date string into start and end dates."""
        today = date.today()
        if date_range == "today":
            return today, today
        elif date_range == "yesterday":
            y = today - timedelta(days=1)
            return y, y
        elif date_range == "last_7_days":
            return today - timedelta(days=6), today
        elif date_range == "last_30_days":
            return today - timedelta(days=29), today
        elif date_range == "this_month":
            return today.replace(day=1), today
        elif date_range == "custom" and custom_start and custom_end:
            return custom_start, custom_end
        else:
            # Default to last 30 days
            return today - timedelta(days=29), today

    @classmethod
    async def get_executive_overview(
        cls,
        db: AsyncSession,
        tenant_id: str,
        date_range: str = "last_7_days",
        custom_start: Optional[date] = None,
        custom_end: Optional[date] = None,
    ) -> ExecutiveOverviewResponse:
        """
        Gathers multi-source executive KPIs:
        P&L Net Profit, Ad Spend & True ROAS, Courier Delivery Success %, Unsettled COD Cash,
        Bleeding Ad alerts, and revenue distribution by source.
        """
        start_date, end_date = cls.resolve_date_range(date_range, custom_start, custom_end)

        # 1. P&L Financial Waterfall
        pnl = await FinanceService.get_pnl_summary(db, tenant_id, start_date, end_date)

        # 2. Logistics & Courier KPIs
        courier_kpis = await CourierService.get_courier_kpis(db, tenant_id)

        # 3. CRM & Retention KPIs
        crm_kpis = await CRMService.get_crm_kpis(db, tenant_id)

        # 4. Period Orders Volume & Status Counts
        orders_stmt = select(
            Order.status,
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total_amount), Decimal("0.00")).label("revenue"),
        ).where(
            and_(
                Order.tenant_id == tenant_id,
                func.date(Order.order_date) >= start_date,
                func.date(Order.order_date) <= end_date,
            )
        ).group_by(Order.status)
        orders_res = await db.execute(orders_stmt)
        status_map = {row.status: row.count for row in orders_res.all()}

        total_orders = sum(status_map.values())
        delivered_orders = status_map.get(OrderStatus.DELIVERED.value, 0)
        returned_orders = status_map.get(OrderStatus.RETURNED.value, 0)
        cancelled_orders = status_map.get(OrderStatus.CANCELLED.value, 0)

        completed_pool = delivered_orders + returned_orders
        delivery_success_rate = (
            round((delivered_orders / completed_pool) * 100.0, 1) if completed_pool > 0 else 0.0
        )
        return_rate = (
            round((returned_orders / completed_pool) * 100.0, 1) if completed_pool > 0 else 0.0
        )

        # 5. True ROAS & POAS Calculations
        ad_spend = pnl.ad_spend
        real_delivered_roas = (
            round(float(pnl.delivered_revenue / ad_spend), 2) if ad_spend > Decimal("0.00") else 0.0
        )
        true_poas = (
            round(float(pnl.net_profit / ad_spend), 2) if ad_spend > Decimal("0.00") else 0.0
        )

        # 6. Break-Even ROAS Benchmark
        be_res = await FinanceService.get_breakeven_analysis(db, tenant_id, start_date, end_date)
        break_even_roas = getattr(be_res, "breakeven_roas", getattr(be_res, "break_even_roas", 0.0))

        # 7. Bleeding Campaigns Detection
        camp_perf = await AdsService.get_campaign_performance(db, tenant_id)
        bleeding_campaigns: List[BleedingCampaignSummary] = []
        meta_claimed_roas_weighted = 0.0
        total_meta_spend = Decimal("0.00")

        for camp in camp_perf:
            total_meta_spend += camp.spend
            if camp.spend > 0:
                meta_claimed_roas_weighted += camp.meta_claimed_roas * float(camp.spend)

            is_bleeding = False
            diagnostic = ""
            recommendation = ""
            severity = "warning"

            # Condition 1: High spend with 0 deliveries or negative profit
            if camp.spend >= Decimal("1000.00") and (camp.delivered_orders_count == 0 or camp.actual_gross_profit <= Decimal("0.00")):
                is_bleeding = True
                severity = "critical"
                diagnostic = f"৳{camp.spend:,.2f} স্পেন্ড সত্ত্বেও কোন ডেলিভারি অর্ডার আসেনি অথবা নিট লোকসান হয়েছে।"
                recommendation = "ক্যাম্পেইন অবিলম্বে পজ (Pause) করুন অথবা ক্রিয়েটিভ ও টার্গেটিং পরিবর্তন করুন।"
            # Condition 2: High return rate (>= 25% with >= 2 total orders)
            elif (camp.delivered_orders_count + camp.returned_orders_count >= 2) and (camp.returned_orders_count / (camp.delivered_orders_count + camp.returned_orders_count) >= 0.25):
                is_bleeding = True
                severity = "warning"
                ret_pct = round((camp.returned_orders_count / (camp.delivered_orders_count + camp.returned_orders_count)) * 100.0, 1)
                diagnostic = f"এই ক্যাম্পেইনের পার্সেল রিটার্ন রেট {ret_pct}% যা স্বাভাবিকের চেয়ে অনেক বেশি।"
                recommendation = "অডিয়েন্স এক্সক্লুশন প্রয়োগ করুন এবং ডেলিভারি চার্জ অগ্রিম গ্রহণের নিয়ম চালু করুন।"

            if is_bleeding:
                bleeding_campaigns.append(
                    BleedingCampaignSummary(
                        campaign_id=camp.campaign_id,
                        campaign_name=camp.campaign_name,
                        ad_spend=camp.spend,
                        meta_claimed_roas=camp.meta_claimed_roas,
                        delivered_orders=camp.delivered_orders_count,
                        delivered_revenue=camp.actual_delivered_revenue,
                        delivered_profit=camp.actual_gross_profit,
                        actual_delivered_roas=camp.actual_delivered_roas,
                        return_rate=round(
                            (camp.returned_orders_count / (camp.delivered_orders_count + camp.returned_orders_count)) * 100.0, 1
                        ) if (camp.delivered_orders_count + camp.returned_orders_count) > 0 else 0.0,
                        severity=severity,
                        diagnostic_issue=diagnostic,
                        recommendation=recommendation,
                    )
                )

        avg_claimed_roas = (
            round(meta_claimed_roas_weighted / float(total_meta_spend), 2)
            if total_meta_spend > Decimal("0.00")
            else 0.0
        )

        # 8. Dynamic Alert Evaluation & Synchronization
        await cls._sync_system_alerts(
            db=db,
            tenant_id=tenant_id,
            bleeding_campaigns=bleeding_campaigns,
            unsettled_balance=courier_kpis.unsettled_balance,
            return_rate=return_rate,
            high_risk_cust_count=crm_kpis.high_risk_customers_count,
        )

        # Fetch active alerts
        alerts_stmt = (
            select(ExecutiveAlert)
            .where(
                and_(
                    ExecutiveAlert.tenant_id == tenant_id,
                    ExecutiveAlert.is_dismissed == False,
                )
            )
            .order_by(desc(ExecutiveAlert.created_at))
            .limit(10)
        )
        alerts_res = await db.execute(alerts_stmt)
        active_alerts = [AlertResponse.model_validate(a) for a in alerts_res.scalars().all()]

        # 9. Revenue by Channel/Source
        source_stmt = select(
            Order.source,
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total_amount), Decimal("0.00")).label("revenue"),
        ).where(
            and_(
                Order.tenant_id == tenant_id,
                func.date(Order.order_date) >= start_date,
                func.date(Order.order_date) <= end_date,
            )
        ).group_by(Order.source)
        source_res = await db.execute(source_stmt)
        source_rows = source_res.all()

        tot_src_rev = sum((r.revenue for r in source_rows), Decimal("0.00"))
        revenue_by_source = [
            SourceRevenueItem(
                source=r.source,
                order_count=r.count,
                total_revenue=r.revenue,
                percentage=round(float(r.revenue / tot_src_rev) * 100.0, 1) if tot_src_rev > Decimal("0.00") else 0.0,
            )
            for r in source_rows
        ]

        # 10. Daily Profit Trends
        timeseries = await FinanceService.get_pnl_timeseries(db, tenant_id, start_date, end_date)
        daily_trends = [
            DailyProfitTrendPoint(
                date=pt.report_date.isoformat() if hasattr(pt.report_date, "isoformat") else str(pt.report_date),
                revenue=pt.delivered_revenue,
                ad_spend=pt.ad_spend,
                cogs=pt.cogs,
                net_profit=pt.net_profit,
                delivered_orders=pt.delivered_orders,
            )
            for pt in timeseries
        ]

        kpis = ExecutiveKPIs(
            gross_revenue=getattr(pnl, "gross_sales", getattr(pnl, "gross_revenue", Decimal("0.00"))),
            delivered_revenue=pnl.delivered_revenue,
            net_profit=pnl.net_profit,
            net_margin_percent=pnl.net_margin_percent,
            total_ad_spend=pnl.ad_spend,
            meta_claimed_roas=avg_claimed_roas,
            real_delivered_roas=real_delivered_roas,
            true_poas=true_poas,
            break_even_roas=break_even_roas,
            total_orders=total_orders,
            delivered_orders=delivered_orders,
            returned_orders=returned_orders,
            cancelled_orders=cancelled_orders,
            delivery_success_rate=delivery_success_rate,
            return_rate=return_rate,
            unsettled_courier_balance=courier_kpis.unsettled_balance,
            total_opex=pnl.operating_expenses,
            total_customers=crm_kpis.total_customers,
            repeat_rate_percent=crm_kpis.repeat_rate_percent,
            high_risk_customers_count=crm_kpis.high_risk_customers_count,
        )

        return ExecutiveOverviewResponse(
            date_range=date_range,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            kpis=kpis,
            alerts=active_alerts,
            bleeding_campaigns=bleeding_campaigns,
            revenue_by_source=revenue_by_source,
            daily_trends=daily_trends,
        )

    @classmethod
    async def _sync_system_alerts(
        cls,
        db: AsyncSession,
        tenant_id: str,
        bleeding_campaigns: List[BleedingCampaignSummary],
        unsettled_balance: Decimal,
        return_rate: float,
        high_risk_cust_count: int,
    ):
        """Generates or updates rule-based operational health alerts for the executive."""
        # 1. Bleeding Campaigns Alert
        if bleeding_campaigns:
            stmt = select(ExecutiveAlert).where(
                and_(
                    ExecutiveAlert.tenant_id == tenant_id,
                    ExecutiveAlert.alert_type == AlertType.BLEEDING_AD.value,
                    ExecutiveAlert.is_dismissed == False,
                )
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if not existing:
                alert = ExecutiveAlert(
                    tenant_id=tenant_id,
                    alert_type=AlertType.BLEEDING_AD.value,
                    severity=AlertSeverity.CRITICAL.value,
                    title=f"{len(bleeding_campaigns)} Bleeding Ad Campaigns Detected",
                    message=f"আপনার {len(bleeding_campaigns)}টি মেটা ক্যাম্পেইনে উল্লেখযোগ্য বাজেট স্পেন্ড হলেও ডেলিভারি না থাকায় লোকসান হচ্ছে।",
                    action_cta="View Bleeding Ads",
                    action_url="/ads",
                    metrics_snapshot={"count": len(bleeding_campaigns)},
                )
                db.add(alert)

        # 2. Unsettled Courier Balance Alert
        if unsettled_balance >= Decimal("20000.00"):
            stmt = select(ExecutiveAlert).where(
                and_(
                    ExecutiveAlert.tenant_id == tenant_id,
                    ExecutiveAlert.alert_type == AlertType.UNSETTLED_CASH.value,
                    ExecutiveAlert.is_dismissed == False,
                )
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if not existing:
                alert = ExecutiveAlert(
                    tenant_id=tenant_id,
                    alert_type=AlertType.UNSETTLED_CASH.value,
                    severity=AlertSeverity.WARNING.value,
                    title=f"৳{unsettled_balance:,.2f} Unsettled Cash at Couriers",
                    message="কুরিয়ার পার্টনারদের কাছে উল্লেখযোগ্য পরিমাণ COD কালেকশন সেটেলমেন্ট বাকি রয়েছে। অবিলম্বে ইনভয়েস যাচাই করুন।",
                    action_cta="View Courier Shipments",
                    action_url="/couriers",
                    metrics_snapshot={"unsettled_amount": str(unsettled_balance)},
                )
                db.add(alert)

        # 3. High Return Rate Alert
        if return_rate >= 25.0:
            stmt = select(ExecutiveAlert).where(
                and_(
                    ExecutiveAlert.tenant_id == tenant_id,
                    ExecutiveAlert.alert_type == AlertType.HIGH_RETURN.value,
                    ExecutiveAlert.is_dismissed == False,
                )
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if not existing:
                alert = ExecutiveAlert(
                    tenant_id=tenant_id,
                    alert_type=AlertType.HIGH_RETURN.value,
                    severity=AlertSeverity.CRITICAL.value,
                    title=f"High Return Rate Alert ({return_rate}%)",
                    message=f"পার্সেল রিটার্ন রেট {return_rate}% অতিক্রম করেছে। ফেক অর্ডার ও রিটার্ন ফ্রড রোধে অর্ডার ভেরিফিকেশন জোরদার করুন।",
                    action_cta="Check CRM Risk Tags",
                    action_url="/crm",
                    metrics_snapshot={"return_rate": return_rate},
                )
                db.add(alert)

        await db.commit()

    @classmethod
    async def dismiss_alert(
        cls, db: AsyncSession, tenant_id: str, alert_id: str
    ) -> bool:
        """Dismisses an executive notification alert."""
        stmt = select(ExecutiveAlert).where(
            and_(
                ExecutiveAlert.tenant_id == tenant_id,
                ExecutiveAlert.id == alert_id,
            )
        )
        res = await db.execute(stmt)
        alert = res.scalar_one_or_none()
        if not alert:
            return False

        alert.is_dismissed = True
        alert.dismissed_at = datetime.utcnow()
        await db.commit()
        return True

    @classmethod
    async def generate_ai_briefing(
        cls,
        db: AsyncSession,
        tenant_id: str,
        request: AIBriefingGenerateRequest,
    ) -> AIBriefingResponse:
        """
        Module 10 Day 37: AI Business Analyst Engine.
        Analyzes the full business state (P&L, ROAS, Courier Returns, OPEX, CRM) and produces
        an executive diagnostic report in natural, professional Bengali with concrete action items.
        """
        overview = await cls.get_executive_overview(
            db=db,
            tenant_id=tenant_id,
            date_range=request.date_range or "last_7_days",
        )
        kpis = overview.kpis

        # 1. Compute Business Health Score (0 - 100)
        health_score = 100
        if kpis.net_margin_percent < 10.0:
            health_score -= 20
        elif kpis.net_margin_percent < 20.0:
            health_score -= 10

        if kpis.delivery_success_rate < 60.0 and (kpis.delivered_orders + kpis.returned_orders > 0):
            health_score -= 25
        elif kpis.delivery_success_rate < 75.0 and (kpis.delivered_orders + kpis.returned_orders > 0):
            health_score -= 15

        if len(overview.bleeding_campaigns) > 0:
            health_score -= min(len(overview.bleeding_campaigns) * 10, 25)

        if kpis.real_delivered_roas < kpis.break_even_roas and kpis.total_ad_spend > 0:
            health_score -= 15

        health_score = max(20, min(100, health_score))

        # 2. Executive Summary in Bengali
        exec_summary = (
            f"চলতি সময়ে আপনার মোট ডেলিভার্ড রেভিনিউ ৳{kpis.delivered_revenue:,.2f} এবং নিট লাভ ৳{kpis.net_profit:,.2f} "
            f"(নিট মার্জিন {kpis.net_margin_percent}%)। মেটা অ্যাড স্পেন্ড ৳{kpis.total_ad_spend:,.2f} এর বিপরীতে "
            f"রিয়েল ডেলিভার্ড ROAS অর্জিত হয়েছে {kpis.real_delivered_roas:.2f}x, যেখানে প্রফিটেবল থাকার ব্রেক-ইভেন বেঞ্চমার্ক "
            f"হলো {kpis.break_even_roas:.2f}x। ব্যবসায়িক ওভারঅল হেলথ স্কোর: {health_score}/১০০।"
        )

        # 3. Key Analytical Findings
        findings: List[str] = []
        # Finding 1: Logistics & Delivery
        if kpis.delivered_orders + kpis.returned_orders > 0:
            findings.append(
                f"কুরিয়ার ডেলিভারি সাকসেস রেট {kpis.delivery_success_rate}% এবং রিটার্ন রেট {kpis.return_rate}%। "
                f"মোট {kpis.delivered_orders}টি সফল ডেলিভারি ও {kpis.returned_orders}টি পার্সেল রিটার্ন এসেছে।"
            )
        else:
            findings.append("বর্তমানে ডেলিভারি ট্রানজিশন পর্যবেক্ষণাধীন রয়েছে।")

        # Finding 2: ROAS Discrepancy / Attribution
        if kpis.total_ad_spend > 0:
            if kpis.meta_claimed_roas > kpis.real_delivered_roas:
                diff = round(kpis.meta_claimed_roas - kpis.real_delivered_roas, 2)
                findings.append(
                    f"মেটা ড্যাশবোর্ডে ক্লেইম করা ROAS ({kpis.meta_claimed_roas:.2f}x) এর তুলনায় ডেলিভার্ড গ্রাউন্ড-ট্রুথ "
                    f"ROAS ({kpis.real_delivered_roas:.2f}x) প্রায় {diff}x কম। এর প্রধান কারণ রিটার্ন হওয়া পার্সেল ও অনাদায়ি COD।"
                )
            else:
                findings.append(
                    f"অ্যাডভারটাইজিং ডেলিভার্ড ROAS ({kpis.real_delivered_roas:.2f}x) স্বাস্থ্যকর অবস্থানে রয়েছে।"
                )

        # Finding 3: Bleeding Campaigns
        if overview.bleeding_campaigns:
            findings.append(
                f"সিস্টেম {len(overview.bleeding_campaigns)}টি ব্লিডিং ক্যাম্পেইন শনাক্ত করেছে যেখানে বাজেট অপচয় হচ্ছে "
                f"(যেমন: '{overview.bleeding_campaigns[0].campaign_name}')।"
            )
        else:
            findings.append("চলমান মেটা ক্যাম্পেইনগুলোতে গুরুতর কোন ব্লিডিং বা বাজেট লিকেজ পাওয়া যায়নি।")

        # Finding 4: Courier Cash
        if kpis.unsettled_courier_balance > Decimal("0.00"):
            findings.append(
                f"কুরিয়ার কোম্পানিগুলোর কাছে ৳{kpis.unsettled_courier_balance:,.2f} ক্যাশ অন ডেলিভারি (COD) টাকা আটকে আছে।"
            )

        # 4. Actionable Prioritized Recommendations
        action_items: List[str] = []
        if overview.bleeding_campaigns:
            action_items.append(
                f"🚨 অবিলম্বে ব্লিডিং ক্যাম্পেইন '{overview.bleeding_campaigns[0].campaign_name}' পজ (Pause) করুন যাতে প্রতিদিনের বাজেট ড্রেন বন্ধ হয়।"
            )
        if kpis.return_rate >= 20.0:
            action_items.append(
                "📦 হাই রিটার্ন জোনে (চট্টগ্রাম/সিলেট/গ্রামাঞ্চলে) পাঠানোর আগে ডেলিভারি চার্জ বিকাশ/নগদে বাধ্যতামূলক অগ্রিম সংগ্রহ করুন।"
            )
        if kpis.unsettled_courier_balance >= Decimal("15000.00"):
            action_items.append(
                f"💳 স্টিডফাস্ট/পাঠাও কুরিয়ারের সাথে যোগাযোগ করে ৳{kpis.unsettled_courier_balance:,.2f} রেমিট্যান্স দ্রুত ব্যাংক ট্রান্সফার নিশ্চিত করুন।"
            )
        if kpis.real_delivered_roas >= kpis.break_even_roas and kpis.real_delivered_roas > 2.0:
            action_items.append(
                "🚀 লাভজনক পারফর্মিং ক্যাম্পেইনগুলোর দৈনিক বাজেট ধাপে ধাপে ২০% বাড়িয়ে বিজনেস স্কেল করুন।"
            )
        if kpis.repeat_rate_percent < 15.0:
            action_items.append(
                "📱 ড্যাশবোর্ড থেকে ডেলিভারি সম্পন্ন হওয়া গ্রাহকদের কাছে স্বয়ংক্রিয় রিভিউ ও পরবর্তী অর্ডারে ডিসকাউন্ট SMS পাঠান।"
            )

        if not action_items:
            action_items.append("আপনার ব্যবসায়িক মেট্রিক্স ভারসাম্যপূর্ণ। বর্তমান স্ট্র্যাটেজি বজায় রাখুন।")

        # 5. Persist Briefing to Database
        briefing = AIBriefing(
            tenant_id=tenant_id,
            date_range=request.date_range or "last_7_days",
            health_score=health_score,
            executive_summary=exec_summary,
            key_findings=findings,
            action_items=action_items,
            source_metrics={
                "net_profit": str(kpis.net_profit),
                "delivered_revenue": str(kpis.delivered_revenue),
                "ad_spend": str(kpis.total_ad_spend),
                "real_delivered_roas": kpis.real_delivered_roas,
                "delivery_success_rate": kpis.delivery_success_rate,
            },
        )
        db.add(briefing)
        await db.commit()
        await db.refresh(briefing)

        return AIBriefingResponse(
            id=briefing.id,
            date_range=briefing.date_range,
            health_score=briefing.health_score,
            executive_summary=briefing.executive_summary,
            key_findings=briefing.key_findings,
            action_items=briefing.action_items,
            created_at=briefing.created_at,
            generated_at=briefing.created_at,
        )

    @classmethod
    async def get_latest_ai_briefing(
        cls, db: AsyncSession, tenant_id: str
    ) -> Optional[AIBriefingResponse]:
        """Fetches the latest cached AI briefing report."""
        stmt = (
            select(AIBriefing)
            .where(AIBriefing.tenant_id == tenant_id)
            .order_by(desc(AIBriefing.created_at))
            .limit(1)
        )
        res = await db.execute(stmt)
        briefing = res.scalar_one_or_none()
        if not briefing:
            return None
        return AIBriefingResponse(
            id=briefing.id,
            date_range=briefing.date_range,
            health_score=briefing.health_score,
            executive_summary=briefing.executive_summary,
            key_findings=briefing.key_findings or [],
            action_items=briefing.action_items or [],
            created_at=briefing.created_at,
            generated_at=briefing.created_at,
        )
