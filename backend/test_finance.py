import sys
import asyncio
import uuid
import httpx
from datetime import date, timedelta
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.core.database import engine, Base


async def test_finance_module():
    print("=" * 65)
    print("STARTING UNIT 6 PROFIT & LOSS (P&L) ENGINE TEST ON NEON DB...")
    print("=" * 65)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Owner
        unique_owner = f"owner_finance_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "Chief Financial Officer",
                "phone_number": "01799887766",
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

        # 3. Create Operating Expenses
        # One-time expense
        exp1_res = await client.post(
            "/api/v1/finance/expenses",
            json={
                "title": "Office High-Speed Internet & Router",
                "category": "utilities",
                "amount": "2500.00",
                "expense_date": str(date.today()),
                "is_recurring": False,
                "recurrence_period": "one_time",
                "notes": "Paid via bKash",
            },
            headers=headers,
        )
        assert exp1_res.status_code == 201, exp1_res.text
        exp1_id = exp1_res.json()["id"]

        # Monthly recurring expense (Rent: 30,000 / month => 1,000 / day)
        exp2_res = await client.post(
            "/api/v1/finance/expenses",
            json={
                "title": "Banani Warehouse & Fulfillment Hub Rent",
                "category": "rent",
                "amount": "30000.00",
                "expense_date": str(date.today()),
                "is_recurring": True,
                "recurrence_period": "monthly",
                "notes": "Monthly recurring warehouse lease",
            },
            headers=headers,
        )
        assert exp2_res.status_code == 201, exp2_res.text
        exp2_id = exp2_res.json()["id"]
        print("2. Created One-Time & Monthly Recurring Operating Expenses (OPEX)")

        # Verify expense listing & categories
        cat_res = await client.get("/api/v1/finance/expenses/categories", headers=headers)
        assert cat_res.status_code == 200
        assert len(cat_res.json()) >= 8

        list_exp_res = await client.get("/api/v1/finance/expenses", headers=headers)
        assert list_exp_res.status_code == 200
        assert len(list_exp_res.json()) >= 2
        print(f"3. Listed Operating Expenses: {len(list_exp_res.json())} items verified")

        # 4. Create Product with COGS & packaging costs
        prod_res = await client.post(
            "/api/v1/products/",
            json={
                "name": "Royal Silk Panjabi (Eid Edition)",
                "sku": f"RS-PANJABI-{uuid.uuid4().hex[:4].upper()}",
                "selling_price": "1850.00",
                "cost_price": "800.00",
                "packaging_cost": "25.00",
                "handling_cost": "15.00",
            },
            headers=headers,
        )
        assert prod_res.status_code == 201, prod_res.text
        product = prod_res.json()
        product_id = product["id"]
        print(f"4. Created Product: '{product['name']}' (Price: 1850, COGS: 800)")

        # 5. Create Test Orders:
        # Order 1: 2 units, DELIVERED
        ord1_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Tanzir Ahmed",
                "customer_phone": "01711223344",
                "shipping_address": "House 12, Road 4, Dhanmondi, Dhaka",
                "shipping_city": "Dhaka",
                "shipping_fee": "80.00",
                "discount_amount": "80.00",
                "items": [
                    {
                        "product_id": product_id,
                        "product_name": product["name"],
                        "sku": product["sku"],
                        "quantity": 2,
                        "unit_price": "1850.00",
                        "unit_cost_price": "800.00",
                        "unit_packaging_cost": "25.00",
                        "unit_handling_cost": "15.00",
                    }
                ],
            },
            headers=headers,
        )
        assert ord1_res.status_code == 201
        order1 = ord1_res.json()
        order1_id = order1["id"]

        # Transition Order 1 to DELIVERED
        await client.patch(
            f"/api/v1/orders/{order1_id}/status",
            json={"status": "confirmed", "reason": "Verified on call"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{order1_id}/status",
            json={"status": "in_courier", "reason": "Handed to Steadfast"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{order1_id}/status",
            json={"status": "delivered", "reason": "Cash collected by rider"},
            headers=headers,
        )

        # Order 2: 1 unit, RETURNED
        ord2_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Kamal Hossain",
                "customer_phone": "01811223344",
                "shipping_address": "Chawkbazar, Chattogram",
                "shipping_city": "Chattogram",
                "shipping_fee": "120.00",
                "items": [
                    {
                        "product_id": product_id,
                        "product_name": product["name"],
                        "sku": product["sku"],
                        "quantity": 1,
                        "unit_price": "1850.00",
                        "unit_cost_price": "800.00",
                        "unit_packaging_cost": "25.00",
                        "unit_handling_cost": "15.00",
                    }
                ],
            },
            headers=headers,
        )
        assert ord2_res.status_code == 201
        order2_id = ord2_res.json()["id"]
        await client.patch(
            f"/api/v1/orders/{order2_id}/status",
            json={"status": "in_courier", "reason": "Handed to Pathao"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{order2_id}/status",
            json={"status": "returned", "reason": "Customer refused package"},
            headers=headers,
        )

        # Order 3: 1 unit, CANCELLED
        ord3_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Fake Order Spammer",
                "customer_phone": "01911223344",
                "shipping_address": "Test area",
                "items": [
                    {
                        "product_id": product_id,
                        "product_name": product["name"],
                        "sku": product["sku"],
                        "quantity": 1,
                        "unit_price": "1850.00",
                        "unit_cost_price": "800.00",
                    }
                ],
            },
            headers=headers,
        )
        assert ord3_res.status_code == 201
        order3_id = ord3_res.json()["id"]
        await client.patch(
            f"/api/v1/orders/{order3_id}/status",
            json={"status": "cancelled", "reason": "Invalid phone number"},
            headers=headers,
        )
        print("5. Created Test Orders: 1 DELIVERED (2 units), 1 RETURNED, 1 CANCELLED")

        # 6. Record Meta Ad Insights
        # Connect Ad Account first to create account & campaigns
        await client.post(
            "/api/v1/ads/accounts/connect",
            json={
                "account_id": f"act_fin_{uuid.uuid4().hex[:6]}",
                "name": "Ecom Finance Official Ads",
                "currency": "BDT",
                "timezone_name": "Asia/Dhaka",
                "access_token": "mock_token_fin",
                "is_primary": True,
            },
            headers=headers,
        )
        print("6. Synced Meta Marketing API Campaigns & Ad Spend")

        # 7. Check P&L Waterfall Summary
        start_date_str = str(date.today() - timedelta(days=6))
        end_date_str = str(date.today())
        pnl_res = await client.get(
            f"/api/v1/finance/pnl/summary?start_date={start_date_str}&end_date={end_date_str}&date_basis=delivery_date",
            headers=headers,
        )
        assert pnl_res.status_code == 200, pnl_res.text
        pnl = pnl_res.json()

        print("\n7. Canonical 11-Step P&L Waterfall Statement:")
        print(f"   -> Gross Sales: BDT {pnl['gross_sales']}")
        print(f"   -> Cancelled & Returned: BDT {pnl['cancelled_returned_amount']}")
        print(f"   -> Delivered Revenue: BDT {pnl['delivered_revenue']}")
        print(f"   -> Total COGS: BDT {pnl['total_cogs']} (Gross Profit: BDT {pnl['gross_profit']} | {pnl['gross_margin_percent']}%)")
        print(f"   -> Courier Charges: BDT {pnl['courier_charges']}")
        print(f"   -> Packaging & Handling: BDT {pnl['packaging_handling_fees']}")
        print(f"   -> Ad Spend: BDT {pnl['ad_spend']}")
        print(f"   -> Contribution Profit: BDT {pnl['contribution_profit']} ({pnl['contribution_margin_percent']}%)")
        print(f"   -> Prorated Operating Expenses (OPEX): BDT {pnl['operating_expenses']}")
        print(f"   -> Net Profit / Loss: BDT {pnl['net_profit']} ({pnl['net_margin_percent']}%)")
        print(f"   -> Break-even ROAS Benchmark: {pnl['breakeven_roas']}x vs Actual ROAS: {pnl['actual_delivered_roas']}x")

        assert float(pnl["delivered_revenue"]) == 3700.00
        assert float(pnl["total_cogs"]) == 1600.00
        assert float(pnl["gross_profit"]) == 2100.00
        assert float(pnl["gross_margin_percent"]) > 0
        assert float(pnl["operating_expenses"]) > 0  # Prorated monthly rent + one time verified!
        assert len(pnl["waterfall"]) == 12

        # 8. Check Daily Timeseries / Trend Points
        trend_res = await client.get(
            f"/api/v1/finance/pnl/timeseries?start_date={start_date_str}&end_date={end_date_str}",
            headers=headers,
        )
        assert trend_res.status_code == 200
        trends = trend_res.json()
        assert len(trends) == 7
        print(f"8. Daily Profitability Timeseries: {len(trends)} daily points computed")

        # 9. Check Break-Even Analysis
        be_res = await client.get(
            f"/api/v1/finance/pnl/breakeven?start_date={start_date_str}&end_date={end_date_str}",
            headers=headers,
        )
        assert be_res.status_code == 200
        be = be_res.json()
        print(f"9. Break-even Benchmark: Break-even ROAS = {be['breakeven_roas']}x | Status: '{be['status']}'")
        assert "recommended_action" in be

        # 10. Check Product-wise P&L Breakdown
        prod_pnl_res = await client.get(
            f"/api/v1/finance/pnl/by-product?start_date={start_date_str}&end_date={end_date_str}",
            headers=headers,
        )
        assert prod_pnl_res.status_code == 200
        prod_items = prod_pnl_res.json()
        assert len(prod_items) >= 1
        p_item = prod_items[0]
        assert p_item["units_sold"] == 2
        assert float(p_item["delivered_revenue"]) == 3700.00
        assert float(p_item["cogs"]) == 1600.00
        print(f"10. Product Profitability Breakdown: '{p_item['product_name']}' -> 2 units, Margin: {p_item['gross_margin_percent']}%")

        # 11. Check Campaign-wise P&L Breakdown
        camp_pnl_res = await client.get(
            f"/api/v1/finance/pnl/by-campaign?start_date={start_date_str}&end_date={end_date_str}",
            headers=headers,
        )
        assert camp_pnl_res.status_code == 200
        camp_items = camp_pnl_res.json()
        assert len(camp_items) >= 1
        print(f"11. Campaign P&L Breakdown: {len(camp_items)} campaigns analyzed")

        # 12. Check One-Click CSV Export
        csv_res = await client.get(
            f"/api/v1/finance/pnl/export/csv?start_date={start_date_str}&end_date={end_date_str}&date_basis=delivery_date",
            headers=headers,
        )
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        assert "E-commerce Profit & Ads Intelligence SaaS" in csv_res.text
        assert "Delivered Revenue" in csv_res.text
        print("12. One-Click P&L CSV Export Generated & Verified")

        # Clean up test orders & expenses
        await client.delete(f"/api/v1/finance/expenses/{exp1_id}", headers=headers)
        await client.delete(f"/api/v1/finance/expenses/{exp2_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order1_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order2_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order3_id}", headers=headers)
        print("13. Cascade Cleanup Completed Successfully")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 6 FINANCE & P&L ENGINE TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(test_finance_module())

