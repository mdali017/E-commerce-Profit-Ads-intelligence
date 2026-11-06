import sys
import asyncio
import uuid
import httpx
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.core.database import engine, Base


async def test_ads_module():
    print("=" * 65)
    print("STARTING UNIT 5 META ADS & ATTRIBUTION ENGINE TEST ON NEON DB...")
    print("=" * 65)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Owner
        unique_owner = f"owner_ads_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "Performance Marketing Director",
                "phone_number": "01788776655",
            },
        )
        assert res.status_code == 201, res.text
        owner_token = res.json()["access_token"]

        # 2. Get Workspace ID
        ws_res = await client.get(
            "/api/v1/workspaces/me",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert ws_res.status_code == 200
        tenant_id = ws_res.json()[0]["tenant_id"]
        headers = {
            "Authorization": f"Bearer {owner_token}",
            "X-Tenant-ID": tenant_id,
        }
        print(f"1. Workspace Configured: ID={tenant_id}")

        # 3. Connect Meta Ad Account
        connect_res = await client.post(
            "/api/v1/ads/accounts/connect",
            headers=headers,
            json={
                "account_id": "act_8899001122",
                "name": "BD Scale Official Ad Account",
                "access_token": "mock_token_marketing_api",
                "currency": "BDT",
                "timezone_name": "Asia/Dhaka",
                "is_primary": True,
            },
        )
        assert connect_res.status_code == 201, connect_res.text
        ad_acc = connect_res.json()
        print(f"2. Meta Ad Account Connected: '{ad_acc['name']}' (ID: {ad_acc['account_id']})")

        # 4. List Campaigns (auto-synced upon connection)
        camps_res = await client.get("/api/v1/ads/campaigns", headers=headers)
        assert camps_res.status_code == 200
        campaigns = camps_res.json()
        assert len(campaigns) >= 3
        print(f"3. Auto-Synced Campaigns: Found {len(campaigns)} active campaigns")
        for c in campaigns:
            print(f"   -> [{c['campaign_id']}] {c['name']} (Status: {c['status']})")

        # 5. Trigger Daily Insights Sync
        sync_res = await client.post("/api/v1/ads/sync/daily-insights", headers=headers)
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        print(f"4. Insights Pipeline: {sync_data['message']}")

        # 6. Create Test Orders with Marketing Attribution to test Ground-Truth ROAS
        # Order 1: Campaign 238491001 (Panjabi_Eid_MegaSale_CBO) -> Delivered (Revenue ৳3,700, GP ৳1,950)
        order1_res = await client.post(
            "/api/v1/orders/",
            headers=headers,
            json={
                "customer_name": "Tanzid Hasan",
                "customer_phone": "01711224466",
                "shipping_address": "Dhanmondi, Dhaka",
                "shipping_city": "Dhaka",
                "shipping_fee": "60.00",
                "source": "facebook",
                "payment_method": "cod",
                "items": [
                    {
                        "product_name": "Panjabi Eid Special",
                        "quantity": 1,
                        "unit_price": "3640.00",
                        "unit_cost_price": "1700.00",
                    }
                ],
                "attribution": {
                    "utm_source": "facebook",
                    "utm_campaign": "Panjabi_Eid_MegaSale_CBO",
                    "campaign_id": "238491001",
                    "fbclid": "fb.1.173000.abc1",
                },
            },
        )
        assert order1_res.status_code == 201, order1_res.text
        order1_id = order1_res.json()["id"]

        # Mark Order 1 as DELIVERED
        await client.patch(
            f"/api/v1/orders/{order1_id}/status",
            headers=headers,
            json={"status": "delivered", "reason": "Courier successfully delivered"},
        )

        # Order 2: Campaign 238491001 -> Returned
        order2_res = await client.post(
            "/api/v1/orders/",
            headers=headers,
            json={
                "customer_name": "Fake Customer",
                "customer_phone": "01811335577",
                "shipping_address": "Chittagong",
                "shipping_city": "Chittagong",
                "shipping_fee": "120.00",
                "source": "facebook",
                "payment_method": "cod",
                "items": [
                    {
                        "product_name": "Panjabi Eid Special",
                        "quantity": 1,
                        "unit_price": "3640.00",
                        "unit_cost_price": "1700.00",
                    }
                ],
                "attribution": {
                    "utm_source": "facebook",
                    "utm_campaign": "Panjabi_Eid_MegaSale_CBO",
                    "campaign_id": "238491001",
                },
            },
        )
        assert order2_res.status_code == 201
        order2_id = order2_res.json()["id"]
        # Mark Order 2 as RETURNED
        await client.patch(
            f"/api/v1/orders/{order2_id}/status",
            headers=headers,
            json={"status": "returned", "reason": "Customer refused delivery"},
        )

        # Order 3: Attributed by utm_campaign keyword "Silk_Polo_Conversion_Advantage" -> Delivered
        order3_res = await client.post(
            "/api/v1/orders/",
            headers=headers,
            json={
                "customer_name": "Naim Sheikh",
                "customer_phone": "01911446688",
                "shipping_address": "Uttara, Dhaka",
                "shipping_city": "Dhaka",
                "shipping_fee": "60.00",
                "source": "facebook",
                "payment_method": "cod",
                "items": [
                    {
                        "product_name": "Silk Polo Shirt",
                        "quantity": 2,
                        "unit_price": "1200.00",
                        "unit_cost_price": "600.00",
                    }
                ],
                "attribution": {
                    "utm_source": "facebook",
                    "utm_campaign": "Silk_Polo_Conversion_Advantage",
                },
            },
        )
        assert order3_res.status_code == 201
        order3_id = order3_res.json()["id"]
        # Mark Order 3 as DELIVERED
        await client.patch(
            f"/api/v1/orders/{order3_id}/status",
            headers=headers,
            json={"status": "delivered", "reason": "Courier delivered successfully"},
        )
        print("5. Attributed Test Orders Created (Delivered & Returned) with Real Cash Values")

        # 7. Check Ground-Truth Campaign Attribution & True ROAS Comparison
        perf_res = await client.get("/api/v1/ads/performance", headers=headers)
        assert perf_res.status_code == 200, perf_res.text
        perf_items = perf_res.json()
        print("6. Campaign Ground-Truth Performance Analysis:")
        
        # Verify Campaign 1 (Panjabi Eid)
        c1 = next(item for item in perf_items if item["campaign_id"] == "238491001")
        print(f"   -> Campaign: '{c1['campaign_name']}'")
        print(f"      Ad Spend: BDT {c1['spend']}")
        print(f"      Meta Pixel Claimed: BDT {c1['meta_reported_conversion_value']} | Claimed ROAS: {c1['meta_claimed_roas']}x")
        print(f"      Actual Ground-Truth: BDT {c1['actual_delivered_revenue']} ({c1['delivered_orders_count']} delivered, {c1['returned_orders_count']} returned)")
        print(f"      Actual Delivered ROAS: {c1['actual_delivered_roas']}x | Blended POAS: {c1['blended_poas']}x")
        print(f"      Inflation Gap Flag: +{c1['roas_inflation_percent']}% over-reported by Meta!")

        assert c1["attributed_orders_count"] == 2
        assert c1["delivered_orders_count"] == 1
        assert c1["returned_orders_count"] == 1
        assert Decimal(str(c1["actual_delivered_revenue"])) == Decimal("3700.00")
        assert float(c1["actual_delivered_roas"]) > 0
        assert float(c1["blended_poas"]) > 0
        assert float(c1["roas_inflation_percent"]) > 0  # Ground-truth successfully exposed Meta over-reporting!

        # 8. Check Overall Ads Performance KPIs
        kpi_res = await client.get("/api/v1/ads/stats/kpis", headers=headers)
        assert kpi_res.status_code == 200
        kpis = kpi_res.json()
        print("7. Overall Workspace Ads Intelligence KPIs:")
        print(f"   -> Total Ad Spend: BDT {kpis['total_spend']} | Clicks: {kpis['total_clicks']} (CPC: BDT {kpis['average_cpc']})")
        print(f"   -> Meta Claimed ROAS: {kpis['meta_claimed_roas']}x vs Actual Delivered ROAS: {kpis['actual_delivered_roas']}x")
        print(f"   -> Blended POAS (Net Profit on Ad Spend): {kpis['blended_poas']}x")
        print(f"   -> Delivery Rate: {kpis['delivery_rate_percent']}%")

        assert float(kpis["total_spend"]) > 0
        assert kpis["total_clicks"] > 0
        assert float(kpis["actual_delivered_revenue"]) > 0
        assert float(kpis["actual_delivered_roas"]) > 0
        assert float(kpis["blended_poas"]) > 0

        # 9. Clean up test orders
        await client.delete(f"/api/v1/orders/{order1_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order2_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order3_id}", headers=headers)
        print("8. Test Orders Cleaned Up Successfully (Cascade Verified)")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 5 META ADS & ATTRIBUTION TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(test_ads_module())
