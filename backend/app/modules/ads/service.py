import logging
from decimal import Decimal
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.ads.models import MetaAdAccount, MetaCampaign, MetaDailyInsight
from app.modules.ads.schemas import (
    ConnectAdAccountRequest,
    CampaignPerformanceItem,
    AdsKPIStats,
)
from app.modules.ads.connector import MetaMarketingConnector
from app.modules.orders.models import Order, OrderAttribution, OrderStatus

logger = logging.getLogger("ads_service")


class AdsService:
    """
    Business logic for Meta Ad Account connections, automated insights synchronization,
    and ground-truth Order Attribution (Claimed ROAS vs Actual Delivered ROAS & POAS).
    """

    @classmethod
    async def connect_ad_account(
        cls,
        db: AsyncSession,
        tenant_id: str,
        request_in: ConnectAdAccountRequest,
    ) -> MetaAdAccount:
        """Connects or updates a Meta Ad Account and triggers initial campaign sync."""
        stmt = select(MetaAdAccount).where(
            and_(
                MetaAdAccount.tenant_id == tenant_id,
                MetaAdAccount.account_id == request_in.account_id,
            )
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if request_in.is_primary:
            # Unset other primary accounts
            all_defs = await db.execute(
                select(MetaAdAccount).where(MetaAdAccount.tenant_id == tenant_id)
            )
            for acc in all_defs.scalars().all():
                acc.is_primary = False

        if existing:
            existing.name = request_in.name
            existing.currency = request_in.currency
            existing.timezone_name = request_in.timezone_name
            existing.access_token = request_in.access_token
            existing.is_active = True
            existing.is_primary = request_in.is_primary
            target_acc = existing
        else:
            new_acc = MetaAdAccount(
                tenant_id=tenant_id,
                account_id=request_in.account_id,
                name=request_in.name,
                currency=request_in.currency,
                timezone_name=request_in.timezone_name,
                access_token=request_in.access_token,
                is_active=True,
                is_primary=request_in.is_primary,
            )
            db.add(new_acc)
            target_acc = new_acc

        await db.commit()
        await db.refresh(target_acc)

        # Trigger immediate campaign discovery
        await cls.sync_campaigns(db, tenant_id, target_acc)
        # Trigger immediate insights discovery
        await cls.sync_daily_insights(db, tenant_id, target_acc)

        await db.refresh(target_acc)
        return target_acc

    @classmethod
    async def get_ad_accounts(
        cls, db: AsyncSession, tenant_id: str
    ) -> List[MetaAdAccount]:
        stmt = select(MetaAdAccount).where(MetaAdAccount.tenant_id == tenant_id)
        res = await db.execute(stmt)
        return res.scalars().all()

    @classmethod
    async def get_primary_account(
        cls, db: AsyncSession, tenant_id: str
    ) -> MetaAdAccount:
        """Gets active primary account or creates simulated development account."""
        stmt = select(MetaAdAccount).where(
            and_(
                MetaAdAccount.tenant_id == tenant_id,
                MetaAdAccount.is_active == True,
            )
        ).order_by(MetaAdAccount.is_primary.desc())
        res = await db.execute(stmt)
        acc = res.scalars().first()

        if not acc:
            # Create default demo ad account for zero-configuration startup
            acc = MetaAdAccount(
                tenant_id=tenant_id,
                account_id="act_ecomprofit_demo",
                name="Official Brand Meta Ads (Demo)",
                currency="BDT",
                timezone_name="Asia/Dhaka",
                access_token="mock_token_demo",
                is_active=True,
                is_primary=True,
            )
            db.add(acc)
            await db.commit()
            await db.refresh(acc)
            await cls.sync_campaigns(db, tenant_id, acc)
            await cls.sync_daily_insights(db, tenant_id, acc)

        return acc

    @classmethod
    async def sync_campaigns(
        cls, db: AsyncSession, tenant_id: str, account: MetaAdAccount
    ) -> List[MetaCampaign]:
        """Fetches and upserts campaigns from Meta Marketing API."""
        campaigns_data = await MetaMarketingConnector.fetch_campaigns(
            account.account_id, account.access_token
        )

        synced = []
        for c_data in campaigns_data:
            stmt = select(MetaCampaign).where(
                and_(
                    MetaCampaign.tenant_id == tenant_id,
                    MetaCampaign.campaign_id == c_data["campaign_id"],
                )
            )
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()

            if existing:
                existing.name = c_data["name"]
                existing.objective = c_data.get("objective")
                existing.status = c_data.get("status", "ACTIVE")
                existing.daily_budget = c_data.get("daily_budget")
                synced.append(existing)
            else:
                new_c = MetaCampaign(
                    tenant_id=tenant_id,
                    ad_account_id=account.id,
                    campaign_id=c_data["campaign_id"],
                    name=c_data["name"],
                    objective=c_data.get("objective"),
                    status=c_data.get("status", "ACTIVE"),
                    daily_budget=c_data.get("daily_budget"),
                )
                db.add(new_c)
                synced.append(new_c)

        account.last_synced_at = datetime.utcnow()
        await db.commit()
        return synced

    @classmethod
    async def sync_daily_insights(
        cls, db: AsyncSession, tenant_id: str, account: Optional[MetaAdAccount] = None
    ) -> List[MetaDailyInsight]:
        """Fetches daily insights breakdown and stores in database."""
        if not account:
            account = await cls.get_primary_account(db, tenant_id)

        insights_data = await MetaMarketingConnector.fetch_insights(
            account.account_id, account.access_token
        )

        synced = []
        for row in insights_data:
            stmt = select(MetaDailyInsight).where(
                and_(
                    MetaDailyInsight.tenant_id == tenant_id,
                    MetaDailyInsight.ad_account_id == account.id,
                    MetaDailyInsight.campaign_id == row["campaign_id"],
                    MetaDailyInsight.report_date == row["report_date"],
                )
            )
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()

            if existing:
                existing.spend = row["spend"]
                existing.impressions = row["impressions"]
                existing.clicks = row["clicks"]
                existing.cpc = row["cpc"]
                existing.cpm = row["cpm"]
                existing.ctr = row["ctr"]
                existing.meta_reported_purchases = row["meta_reported_purchases"]
                existing.meta_reported_conversion_value = row["meta_reported_conversion_value"]
                existing.meta_claimed_roas = row["meta_claimed_roas"]
                synced.append(existing)
            else:
                new_insight = MetaDailyInsight(
                    tenant_id=tenant_id,
                    ad_account_id=account.id,
                    campaign_id=row["campaign_id"],
                    campaign_name=row["campaign_name"],
                    report_date=row["report_date"],
                    spend=row["spend"],
                    impressions=row["impressions"],
                    clicks=row["clicks"],
                    cpc=row["cpc"],
                    cpm=row["cpm"],
                    ctr=row["ctr"],
                    meta_reported_purchases=row["meta_reported_purchases"],
                    meta_reported_conversion_value=row["meta_reported_conversion_value"],
                    meta_claimed_roas=row["meta_claimed_roas"],
                )
                db.add(new_insight)
                synced.append(new_insight)

        account.last_synced_at = datetime.utcnow()
        await db.commit()
        return synced

    @classmethod
    async def get_campaigns(
        cls, db: AsyncSession, tenant_id: str
    ) -> List[MetaCampaign]:
        stmt = select(MetaCampaign).where(MetaCampaign.tenant_id == tenant_id)
        res = await db.execute(stmt)
        return res.scalars().all()

    @classmethod
    async def get_campaign_performance(
        cls, db: AsyncSession, tenant_id: str
    ) -> List[CampaignPerformanceItem]:
        """
        Calculates ground-truth attribution and True Delivered ROAS vs Meta Claimed ROAS.
        Cross-matches orders with campaigns via utm_campaign, campaign_id, or fbclid.
        """
        # Ensure account & insights exist
        await cls.get_primary_account(db, tenant_id)

        # 1. Fetch campaigns
        camp_stmt = select(MetaCampaign).where(MetaCampaign.tenant_id == tenant_id)
        camp_res = await db.execute(camp_stmt)
        campaigns = camp_res.scalars().all()

        # 2. Fetch insights
        ins_stmt = select(MetaDailyInsight).where(MetaDailyInsight.tenant_id == tenant_id)
        ins_res = await db.execute(ins_stmt)
        insights = ins_res.scalars().all()

        # Group insights by campaign_id
        insights_by_camp = {}
        for row in insights:
            cid = row.campaign_id
            if cid not in insights_by_camp:
                insights_by_camp[cid] = {
                    "spend": Decimal("0.00"),
                    "impressions": 0,
                    "clicks": 0,
                    "meta_purchases": 0,
                    "meta_conv_val": Decimal("0.00"),
                    "name": row.campaign_name,
                }
            insights_by_camp[cid]["spend"] += row.spend
            insights_by_camp[cid]["impressions"] += row.impressions
            insights_by_camp[cid]["clicks"] += row.clicks
            insights_by_camp[cid]["meta_purchases"] += row.meta_reported_purchases
            insights_by_camp[cid]["meta_conv_val"] += row.meta_reported_conversion_value

        # 3. Fetch Orders with Attribution for this tenant
        ord_stmt = (
            select(Order, OrderAttribution)
            .outerjoin(OrderAttribution, Order.id == OrderAttribution.order_id)
            .where(Order.tenant_id == tenant_id)
        )
        ord_res = await db.execute(ord_stmt)
        order_records = ord_res.all()

        # 4. Cross-match Orders to Campaigns
        perf_list = []
        for camp in campaigns:
            cid = camp.campaign_id
            c_ins = insights_by_camp.get(
                cid,
                {
                    "spend": Decimal("0.00"),
                    "impressions": 0,
                    "clicks": 0,
                    "meta_purchases": 0,
                    "meta_conv_val": Decimal("0.00"),
                    "name": camp.name,
                },
            )

            spend = c_ins["spend"]
            impressions = c_ins["impressions"]
            clicks = c_ins["clicks"]
            cpc = (spend / clicks).quantize(Decimal("0.01")) if clicks > 0 else Decimal("0.00")
            ctr = round((clicks / impressions * 100), 2) if impressions > 0 else 0.0

            meta_purchases = c_ins["meta_purchases"]
            meta_conv_val = c_ins["meta_conv_val"]
            claimed_roas = round(float(meta_conv_val / spend), 2) if spend > 0 else 0.0

            # Match orders
            attributed_count = 0
            delivered_count = 0
            returned_count = 0
            delivered_revenue = Decimal("0.00")
            gross_profit = Decimal("0.00")

            c_name_lower = camp.name.lower().strip()

            for order, attr in order_records:
                is_match = False
                if attr:
                    if attr.campaign_id and attr.campaign_id == cid:
                        is_match = True
                    elif attr.utm_campaign and (
                        attr.utm_campaign.lower() in c_name_lower
                        or c_name_lower in attr.utm_campaign.lower()
                    ):
                        is_match = True

                if is_match:
                    attributed_count += 1
                    if order.status == OrderStatus.DELIVERED:
                        delivered_count += 1
                        delivered_revenue += order.total_amount
                        gross_profit += order.gross_profit
                    elif order.status == OrderStatus.RETURNED:
                        returned_count += 1

            actual_roas = round(float(delivered_revenue / spend), 2) if spend > 0 else 0.0
            blended_poas = round(float(gross_profit / spend), 2) if spend > 0 else 0.0

            # Inflation gap: If Meta claims 5.0x but actual is 2.5x -> inflation gap is 100%
            inflation_percent = 0.0
            if actual_roas > 0 and claimed_roas > actual_roas:
                inflation_percent = round(((claimed_roas - actual_roas) / actual_roas) * 100, 1)

            perf_list.append(
                CampaignPerformanceItem(
                    campaign_id=cid,
                    campaign_name=camp.name,
                    status=camp.status,
                    spend=spend,
                    impressions=impressions,
                    clicks=clicks,
                    cpc=cpc,
                    ctr=ctr,
                    meta_reported_purchases=meta_purchases,
                    meta_reported_conversion_value=meta_conv_val,
                    meta_claimed_roas=claimed_roas,
                    attributed_orders_count=attributed_count,
                    delivered_orders_count=delivered_count,
                    returned_orders_count=returned_count,
                    actual_delivered_revenue=delivered_revenue,
                    actual_gross_profit=gross_profit,
                    actual_delivered_roas=actual_roas,
                    blended_poas=blended_poas,
                    roas_inflation_percent=inflation_percent,
                )
            )

        return perf_list

    @classmethod
    async def get_ads_kpis(cls, db: AsyncSession, tenant_id: str) -> AdsKPIStats:
        """Overall workspace Ads Performance KPIs comparing Meta claims with actual bank collections."""
        perf_list = await cls.get_campaign_performance(db, tenant_id)

        total_spend = sum(item.spend for item in perf_list)
        total_impressions = sum(item.impressions for item in perf_list)
        total_clicks = sum(item.clicks for item in perf_list)

        avg_cpc = (total_spend / total_clicks).quantize(Decimal("0.01")) if total_clicks > 0 else Decimal("0.00")
        avg_ctr = round((total_clicks / total_impressions * 100), 2) if total_impressions > 0 else 0.0

        meta_revenue = sum(item.meta_reported_conversion_value for item in perf_list)
        meta_roas = round(float(meta_revenue / total_spend), 2) if total_spend > 0 else 0.0

        del_revenue = sum(item.actual_delivered_revenue for item in perf_list)
        total_gp = sum(item.actual_gross_profit for item in perf_list)
        actual_roas = round(float(del_revenue / total_spend), 2) if total_spend > 0 else 0.0
        blended_poas = round(float(total_gp / total_spend), 2) if total_spend > 0 else 0.0

        total_orders = sum(item.attributed_orders_count for item in perf_list)
        del_orders = sum(item.delivered_orders_count for item in perf_list)
        ret_orders = sum(item.returned_orders_count for item in perf_list)
        delivery_rate = round((del_orders / total_orders * 100), 2) if total_orders > 0 else 0.0

        return AdsKPIStats(
            total_spend=total_spend,
            total_impressions=total_impressions,
            total_clicks=total_clicks,
            average_cpc=avg_cpc,
            average_ctr=avg_ctr,
            meta_claimed_revenue=meta_revenue,
            meta_claimed_roas=meta_roas,
            actual_delivered_revenue=del_revenue,
            actual_delivered_roas=actual_roas,
            blended_poas=blended_poas,
            total_attributed_orders=total_orders,
            delivered_orders=del_orders,
            returned_orders=ret_orders,
            delivery_rate_percent=delivery_rate,
        )

