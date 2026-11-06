import asyncio
import sys
import uuid
from decimal import Decimal
from datetime import date, timedelta

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import httpx
from app.main import app


async def test_analytics_and_ai_engine():
    print("\n" + "=" * 65)
    print("STARTING UNIT 8 EXECUTIVE DASHBOARD & AI INSIGHTS TEST ON NEON DB...")
    print("=" * 65)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Executive User
        uid = uuid.uuid4().hex[:6]
        email = f"ceo_exec_{uid}@ecomprofit.com"
        password = "Password123!"

        reg_res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": email,
                "password": password,
                "full_name": "Executive Managing Director",
                "phone_number": "01788990011",
            },
        )
        assert reg_res.status_code == 201, reg_res.text
        access_token = reg_res.json()["access_token"]

        ws_res = await client.get(
            "/api/v1/workspaces/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert ws_res.status_code == 200, ws_res.text
        tenant_id = ws_res.json()[0]["tenant_id"]

        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Tenant-ID": tenant_id,
        }
        print(f"1. Executive Registered & Logged in -> Tenant: {tenant_id}")

        # 2. Create Product with COGS
        prod_res = await client.post(
            "/api/v1/products/",
            json={
                "name": f"Premium Leather Bag {uid}",
                "sku": f"PLB-{uid}",
                "selling_price": "2850.00",
                "cost_price": "1100.00",
                "packaging_cost": "60.00",
                "handling_cost": "40.00",
                "stock_quantity": 50,
            },
            headers=headers,
        )
        assert prod_res.status_code == 201, prod_res.text
        product = prod_res.json()
        product_id = product["id"]
        print(f"2. Product created: '{product['name']}' (Selling: ৳2850, COGS: ৳1100)")

        # 3. Add Fixed Operating Expense (Office Rent ৳15,000 monthly)
        exp_res = await client.post(
            "/api/v1/finance/expenses",
            json={
                "title": "Corporate Office Rent",
                "category": "rent",
                "amount": "15000.00",
                "expense_date": date.today().isoformat(),
                "is_recurring": True,
                "recurrence_period": "monthly",
            },
            headers=headers,
        )
        assert exp_res.status_code == 201, exp_res.text
        print("3. Fixed Recurring OPEX logged: ৳15,000/month")

        # 4. Connect Meta Ad Account & Campaign with Insights
        meta_acc_res = await client.post(
            "/api/v1/ads/accounts/connect",
            json={
                "account_id": f"act_exec_{uid}",
                "name": "Primary Meta Scaling Account",
                "access_token": "EAAX_SIMULATED_TEST_TOKEN",
                "currency": "BDT",
                "timezone_name": "Asia/Dhaka",
                "is_primary": True,
            },
            headers=headers,
        )
        assert meta_acc_res.status_code in (200, 201), meta_acc_res.text
        print("4. Meta Ad Account connected with active campaign insights")

        # 5. Create 3 Orders across Facebook and WooCommerce
        # Order 1: Facebook -> Delivered (Profitable)
        ord1_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Farhan Ahmed",
                "customer_phone": "01711002233",
                "shipping_address": "Dhanmondi, Dhaka",
                "shipping_city": "Dhaka",
                "shipping_fee": "80.00",
                "items": [
                    {
                        "product_id": product_id,
                        "product_name": product["name"],
                        "sku": product["sku"],
                        "quantity": 1,
                        "unit_price": "2850.00",
                        "unit_cost_price": "1100.00",
                    }
                ],
            },
            headers=headers,
        )
        assert ord1_res.status_code == 201, ord1_res.text
        ord1_id = ord1_res.json()["id"]

        # Transition Order 1 to In Courier & Delivered
        await client.patch(
            f"/api/v1/orders/{ord1_id}/status",
            json={"status": "confirmed", "reason": "Verified on phone call"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{ord1_id}/status",
            json={"status": "in_courier", "reason": "Handed over to Steadfast"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{ord1_id}/status",
            json={"status": "delivered", "reason": "Customer received & paid COD"},
            headers=headers,
        )
        print("5. Order 1 Delivered via Steadfast (Profitable Revenue: ৳2,930.00)")

        # Order 2: WooCommerce -> Returned (Loss)
        ord2_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "woocommerce",
                "customer_name": "Risky Buyer",
                "customer_phone": "01999887766",
                "shipping_address": "Chittagong",
                "shipping_city": "Chittagong",
                "shipping_fee": "120.00",
                "items": [
                    {
                        "product_id": product_id,
                        "product_name": product["name"],
                        "sku": product["sku"],
                        "quantity": 1,
                        "unit_price": "2850.00",
                        "unit_cost_price": "1100.00",
                    }
                ],
            },
            headers=headers,
        )
        assert ord2_res.status_code == 201, ord2_res.text
        ord2_id = ord2_res.json()["id"]

        await client.patch(
            f"/api/v1/orders/{ord2_id}/status",
            json={"status": "in_courier", "reason": "Shipped to Chittagong"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{ord2_id}/status",
            json={"status": "returned", "reason": "Doorstep rejection"},
            headers=headers,
        )
        print("6. Order 2 Returned (Return Loss & Return Rate tracked)")

        # 6. Fetch Executive Overview Dashboard
        overview_res = await client.get("/api/v1/analytics/overview?date_range=last_7_days", headers=headers)
        assert overview_res.status_code == 200, overview_res.text
        overview = overview_res.json()
        kpis = overview["kpis"]

        assert float(kpis["delivered_revenue"]) > 0.0
        assert kpis["delivered_orders"] == 1
        assert kpis["returned_orders"] == 1
        assert kpis["delivery_success_rate"] == 50.0
        assert kpis["return_rate"] == 50.0
        assert float(kpis["total_ad_spend"]) > 0.0
        assert kpis["real_delivered_roas"] > 0.0
        assert len(overview["revenue_by_source"]) >= 2
        assert len(overview["daily_trends"]) >= 1
        print(f"7. Executive Dashboard Verified:")
        print(f"   - Delivered Revenue: BDT {kpis['delivered_revenue']}")
        print(f"   - Net Profit: BDT {kpis['net_profit']} (Margin: {kpis['net_margin_percent']}%)")
        print(f"   - Delivery Rate: {kpis['delivery_success_rate']}% | Return Rate: {kpis['return_rate']}%")
        print(f"   - Real Delivered ROAS: {kpis['real_delivered_roas']}x (vs Meta Claimed: {kpis['meta_claimed_roas']}x)")
        print(f"   - Revenue Sources: {[s['source'] for s in overview['revenue_by_source']]}")

        # 7. Verify Rule-Based Alert Generation
        assert len(overview["alerts"]) >= 1
        alert = overview["alerts"][0]
        alert_id = alert["id"]
        print(f"8. Anomaly Alert Triggered: [{alert['severity'].upper()}] {alert['title']}")

        # 8. Dismiss Alert
        dismiss_res = await client.patch(f"/api/v1/analytics/alerts/{alert_id}/dismiss", headers=headers)
        assert dismiss_res.status_code == 200, dismiss_res.text
        print("9. Executive Alert Dismissed successfully")

        # 9. Generate AI Business Analyst Briefing
        ai_res = await client.post(
            "/api/v1/analytics/ai-briefing",
            json={"date_range": "last_7_days"},
            headers=headers,
        )
        assert ai_res.status_code == 200, ai_res.text
        briefing = ai_res.json()
        assert 20 <= briefing["health_score"] <= 100
        assert len(briefing["executive_summary"]) > 50
        assert len(briefing["key_findings"]) >= 2
        assert len(briefing["action_items"]) >= 1
        print(f"\n10. AI Business Analyst Briefing Generated:")
        print(f"    - Health Score: {briefing['health_score']}/100")
        print(f"    - Summary: {briefing['executive_summary'][:120]}...")
        print(f"    - Findings: {len(briefing['key_findings'])} insights identified")
        print(f"    - Action Items: {briefing['action_items'][0]}")

        # 10. Fetch Latest Cached AI Briefing
        latest_res = await client.get("/api/v1/analytics/ai-briefing/latest", headers=headers)
        assert latest_res.status_code == 200, latest_res.text
        latest = latest_res.json()
        assert latest["id"] == briefing["id"]
        print("11. Latest AI Briefing retrieved from database cache")

        # Clean up test orders & product
        await client.delete(f"/api/v1/orders/{ord1_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{ord2_id}", headers=headers)
        print("12. Test Data Cleaned up cleanly")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 8 EXECUTIVE DASHBOARD & AI INSIGHTS TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(test_analytics_and_ai_engine())
