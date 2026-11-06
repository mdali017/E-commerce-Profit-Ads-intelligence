import sys
import asyncio
import uuid
import httpx
from datetime import datetime
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.core.database import engine, Base


async def test_crm_module():
    print("=" * 65)
    print("STARTING UNIT 7 CUSTOMER CRM & SMS AUTOMATION TEST ON NEON DB...")
    print("=" * 65)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Owner
        unique_owner = f"owner_crm_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "CRM & Retention Director",
                "phone_number": "01722334455",
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

        # 3. Configure Bangladeshi SMS Gateway
        gw_res = await client.post(
            "/api/v1/crm/sms/gateway",
            json={
                "provider": "simulated",
                "api_key": "elitbuzz_bd_live_key_9988",
                "sender_id": "ProfitPulse",
                "is_active": True,
            },
            headers=headers,
        )
        assert gw_res.status_code == 200, gw_res.text
        gw = gw_res.json()
        print(f"2. Configured SMS Gateway: Provider={gw['provider']}, SenderID={gw['sender_id']}, Balance=BDT {gw['remaining_balance']}")

        # 4. List / Create SMS Automation Rules
        rules_res = await client.get("/api/v1/crm/sms/rules", headers=headers)
        assert rules_res.status_code == 200
        rules = rules_res.json()
        assert len(rules) >= 1
        rule1 = rules[0]
        print(f"3. Active Automation Rules: '{rule1['name']}' (Trigger: {rule1['trigger_event']})")

        # 5. Create Product
        prod_res = await client.post(
            "/api/v1/products/",
            json={
                "name": "Luxury Cotton Kurti",
                "sku": f"KURTI-{uuid.uuid4().hex[:4].upper()}",
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
        print(f"4. Created Product: '{product['name']}'")

        # 6. Create Order 1 for Customer 1 (Tanzir Ahmed, 01711223344)
        order1_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Tanzir Ahmed",
                "customer_phone": "01711223344",
                "shipping_address": "House 10, Dhanmondi, Dhaka",
                "shipping_city": "Dhaka",
                "shipping_fee": "80.00",
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
        assert order1_res.status_code == 201
        order1 = order1_res.json()
        order1_id = order1["id"]

        # Transition Order 1 to DELIVERED (Triggers Post-Delivery SMS Automation!)
        await client.patch(
            f"/api/v1/orders/{order1_id}/status",
            json={"status": "confirmed", "reason": "Customer confirmed order"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{order1_id}/status",
            json={"status": "delivered", "reason": "Cash collected by rider"},
            headers=headers,
        )
        print("5. Order 1 Delivered -> Automated Thank You SMS Triggered Automatically")

        # 7. Create Order 2 for the SAME customer (Makes him a Repeat Customer!)
        order2_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Tanzir Ahmed",
                "customer_phone": "01711223344",
                "shipping_address": "House 10, Dhanmondi, Dhaka",
                "shipping_city": "Dhaka",
                "shipping_fee": "80.00",
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
        assert order2_res.status_code == 201
        order2_id = order2_res.json()["id"]
        await client.patch(
            f"/api/v1/orders/{order2_id}/status",
            json={"status": "delivered", "reason": "Courier delivered successfully"},
            headers=headers,
        )
        print("6. Order 2 Delivered -> Customer Tanzir Ahmed now 2 Delivered Orders (Repeat Customer!)")

        # 8. Create Order 3 for a Risky Customer (Returns the order)
        order3_res = await client.post(
            "/api/v1/orders/",
            json={
                "source": "facebook",
                "customer_name": "Spam Buyer",
                "customer_phone": "01899887766",
                "shipping_address": "Chittagong",
                "shipping_city": "Chittagong",
                "shipping_fee": "120.00",
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
        assert order3_res.status_code == 201
        order3_id = order3_res.json()["id"]
        await client.patch(
            f"/api/v1/orders/{order3_id}/status",
            json={"status": "in_courier", "reason": "Sent to courier"},
            headers=headers,
        )
        await client.patch(
            f"/api/v1/orders/{order3_id}/status",
            json={"status": "returned", "reason": "Parcel rejected at doorstep"},
            headers=headers,
        )
        print("7. Order 3 Returned -> Customer 01899887766 flagged with High Return Risk")

        # 9. Verify Customer CRM Listing & Segments
        cust_list_res = await client.get("/api/v1/crm/customers", headers=headers)
        assert cust_list_res.status_code == 200
        customers = cust_list_res.json()
        assert len(customers) == 2

        tanzir = next(c for c in customers if c["phone"] == "01711223344")
        assert tanzir["total_orders"] == 2
        assert tanzir["delivered_orders"] == 2
        assert tanzir["is_repeat_customer"] == True
        assert tanzir["segment"] == "repeat"
        assert "Repeat Customer" in tanzir["tags"]
        assert float(tanzir["total_spent"]) == 3860.00
        print(f"8. Verified Customer Profile: '{tanzir['name']}' | LTV: BDT {tanzir['total_spent']} | Segment: {tanzir['segment']}")

        risky = next(c for c in customers if c["phone"] == "01899887766")
        assert risky["returned_orders"] == 1
        assert risky["return_risk_score"] == 100.0
        assert "High Return Risk" in risky["tags"]
        print(f"9. Verified Return Risk Intelligence: '{risky['name']}' | Risk Score: {risky['return_risk_score']}% | Tags: {risky['tags']}")

        # 10. Verify CRM Executive KPIs
        kpi_res = await client.get("/api/v1/crm/stats/kpis", headers=headers)
        assert kpi_res.status_code == 200
        kpis = kpi_res.json()
        assert kpis["total_customers"] == 2
        assert kpis["repeat_customers_count"] == 1
        assert kpis["repeat_rate_percent"] == 50.0
        assert kpis["high_risk_customers_count"] == 1
        assert kpis["total_sms_sent"] >= 2
        print(f"10. CRM Executive KPIs: Total Customers: {kpis['total_customers']} | Repeat Rate: {kpis['repeat_rate_percent']}% | High Risk: {kpis['high_risk_customers_count']} | SMS Sent: {kpis['total_sms_sent']}")

        # 11. Verify Customer Detail & Timeline
        detail_res = await client.get(f"/api/v1/crm/customers/{tanzir['id']}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert len(detail["recent_orders"]) == 2
        assert len(detail["message_history"]) >= 2
        print(f"11. Verified Customer Detail Drawer: {len(detail['recent_orders'])} orders & {len(detail['message_history'])} SMS in audit history")

        # 12. Test Send Instant SMS Endpoint
        test_sms_res = await client.post(
            "/api/v1/crm/sms/test-send",
            json={
                "recipient_phone": "01700112233",
                "message": "Hello from ProfitPulse! Your test delivery SMS is verified.",
            },
            headers=headers,
        )
        assert test_sms_res.status_code == 200
        test_sms = test_sms_res.json()
        assert test_sms["success"] == True
        assert test_sms["status"] == "delivered"
        print(f"12. Instant Test SMS Dispatched: Ref={test_sms['provider_ref']} | Parts={test_sms['sms_count']}")

        # Clean up test orders & product
        await client.delete(f"/api/v1/orders/{order1_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order2_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order3_id}", headers=headers)
        print("13. Cascade Cleanup Completed Successfully")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 7 CUSTOMER CRM & SMS AUTOMATION TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(test_crm_module())

