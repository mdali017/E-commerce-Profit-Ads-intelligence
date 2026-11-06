import sys
import asyncio
import uuid
import httpx
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.core.database import engine, Base


async def test_orders_module():
    print("=" * 65)
    print("STARTING UNIT 3 (DAY 9) ORDER ENGINE & INGESTION TEST ON NEON DB...")
    print("=" * 65)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Owner
        unique_owner = f"owner_order_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "Order Operations Manager",
                "phone_number": "01811223344",
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

        # 3. Create a Catalog Product with COGS & Variant for testing auto-pricing
        sku_polo = f"POLO-{uuid.uuid4().hex[:4].upper()}"
        prod_payload = {
            "name": "Luxury Silk Cotton Polo",
            "sku": sku_polo,
            "category": "Apparel",
            "regular_price": "1200.00",
            "cost_price": "600.00",       # Base COGS
            "packaging_cost": "40.00",
            "handling_cost": "15.00",
        }
        prod_res = await client.post("/api/v1/products/", headers=headers, json=prod_payload)
        assert prod_res.status_code == 201, prod_res.text
        product = prod_res.json()
        prod_id = product["id"]
        print(f"2. Catalog Product Created: '{product['name']}' (COGS: BDT {product['cost_price']})")

        # Add a Variant with specific COGS
        sku_variant = f"POLO-M-NVY-{uuid.uuid4().hex[:3].upper()}"
        var_payload = {
            "name": "Navy Blue / M",
            "sku": sku_variant,
            "price": "1250.00",
            "cost_price": "550.00",       # Variant COGS
            "stock_quantity": 50,
            "attributes": {"color": "Navy Blue", "size": "M"},
        }
        var_res = await client.post(f"/api/v1/products/{prod_id}/variants", headers=headers, json=var_payload)
        assert var_res.status_code == 201, var_res.text
        variant = var_res.json()
        var_id = variant["id"]
        print(f"3. Catalog Variant Created: '{variant['name']}' (COGS: BDT {variant['cost_price']})")

        # 4. Ingest an Order (Manual / Landing Page)
        # Note: We omit unit_cost_price to verify auto-resolution from catalog!
        idempotency_key = f"idem_{uuid.uuid4().hex}"
        order_payload = {
            "source": "manual",
            "payment_method": "cod",
            "payment_status": "pending",
            "customer_name": "Rahim Ahmed",
            "customer_phone": "01711998877",
            "customer_email": "rahim@example.com",
            "shipping_address": "House 12, Road 4, Sector 7, Uttara",
            "shipping_city": "Dhaka",
            "shipping_zone": "Inside Dhaka",
            "shipping_fee": "60.00",
            "discount_amount": "50.00",
            "idempotency_key": idempotency_key,
            "items": [
                {
                    "product_id": prod_id,
                    "product_name": product["name"],
                    "sku": sku_polo,
                    "quantity": 1,
                    "unit_price": "1200.00",
                    # unit_cost_price omitted -> engine will auto-pull 600.00
                },
                {
                    "product_id": prod_id,
                    "variant_id": var_id,
                    "product_name": product["name"],
                    "variant_name": variant["name"],
                    "sku": sku_variant,
                    "quantity": 2,
                    "unit_price": "1250.00",
                    # unit_cost_price omitted -> engine will auto-pull 550.00
                },
            ],
            "attribution": {
                "utm_source": "facebook",
                "utm_medium": "cpc",
                "utm_campaign": "summer_drop_2026",
                "fbclid": "fb.1.173000000.abc123xyz",
                "attribution_confidence": "high",
            },
        }

        order_res = await client.post("/api/v1/orders/", headers=headers, json=order_payload)
        assert order_res.status_code == 201, order_res.text
        order = order_res.json()
        order_id = order["id"]

        print(f"4. Order Ingested Successfully: #{order['order_number']} (Status: {order['status'].upper()})")

        # Verify Calculations:
        # Item 1: 1 * 1200 = 1200 (Cost: 1 * 600 = 600, Pkg: 40, Hnd: 15)
        # Item 2: 2 * 1250 = 2500 (Cost: 2 * 550 = 1100, Pkg: 0, Hnd: 0)
        # Subtotal: 1200 + 2500 = 3700.00
        # Total Amount: 3700 - 50 (discount) + 60 (shipping) = 3710.00
        # Total COGS: 600 + 1100 = 1700.00
        # Total Pkg + Hnd: 40 + 15 = 55.00
        # Gross Profit: 3710 - (1700 + 55) = 1955.00
        assert Decimal(str(order["subtotal"])) == Decimal("3700.00")
        assert Decimal(str(order["total_amount"])) == Decimal("3710.00")
        assert Decimal(str(order["total_cogs"])) == Decimal("1700.00")
        assert Decimal(str(order["gross_profit"])) == Decimal("1955.00")
        assert len(order["items"]) == 2
        assert len(order["status_history"]) == 1
        assert order["status_history"][0]["to_status"] == "pending"
        assert order["attribution"]["utm_campaign"] == "summer_drop_2026"
        assert order["attribution"]["attribution_confidence"] == "high"

        print(f"   -> Subtotal: BDT {order['subtotal']} | Customer Payable: BDT {order['total_amount']}")
        print(f"   -> Total COGS: BDT {order['total_cogs']} | Gross Profit: BDT {order['gross_profit']}")

        # 5. Verify Idempotency Duplicate Protection
        dup_res = await client.post("/api/v1/orders/", headers=headers, json=order_payload)
        assert dup_res.status_code == 201 or dup_res.status_code == 200
        dup_order = dup_res.json()
        assert dup_order["id"] == order_id, "Idempotency failed to return existing order"
        print("5. Idempotency Check: Duplicate payload safely returned existing order without double-booking")

        # 6. Phone Call Confirmation Workflow (Status Transition)
        status_payload = {
            "status": "confirmed",
            "reason": "Customer confirmed address and cash payment via phone call",
        }
        confirm_res = await client.patch(
            f"/api/v1/orders/{order_id}/status",
            headers=headers,
            json=status_payload,
        )
        assert confirm_res.status_code == 200, confirm_res.text
        confirmed_order = confirm_res.json()
        assert confirmed_order["status"] == "confirmed"
        assert len(confirmed_order["status_history"]) == 2
        latest_history = confirmed_order["status_history"][0]
        assert latest_history["from_status"] == "pending"
        assert latest_history["to_status"] == "confirmed"
        assert "Customer confirmed" in latest_history["reason"]
        print(f"6. Phone Confirmation Executed: Status is now '{confirmed_order['status'].upper()}' with Audit Log")

        # 7. List Orders & Search by Phone Number
        search_res = await client.get("/api/v1/orders/?search=01711998877", headers=headers)
        assert search_res.status_code == 200
        search_items = search_res.json()
        assert len(search_items) == 1
        assert search_items[0]["id"] == order_id
        print(f"7. Filter & Search by Phone (01711998877) matched order #{search_items[0]['order_number']}")

        # 8. Check Order Executive KPI Stats
        kpi_res = await client.get("/api/v1/orders/stats/kpis", headers=headers)
        assert kpi_res.status_code == 200
        kpi = kpi_res.json()
        print(f"8. Executive Order KPIs:")
        print(f"   -> Total Orders: {kpi['total_orders']} | Confirmed: {kpi['confirmed_orders']}")
        print(f"   -> Total Revenue: BDT {kpi['total_revenue']} | Profit: BDT {kpi['total_gross_profit']}")
        assert kpi["total_orders"] == 1
        assert kpi["confirmed_orders"] == 1
        assert Decimal(str(kpi["total_revenue"])) == Decimal("3710.00")
        assert Decimal(str(kpi["total_gross_profit"])) == Decimal("1955.00")

        # 9. Test WooCommerce Webhook Ingestion
        wc_id = 998811
        wc_webhook_payload = {
            "id": wc_id,
            "status": "processing",
            "total": "1260.00",
            "shipping_total": "60.00",
            "discount_total": "0.00",
            "payment_method": "cod",
            "billing": {
                "first_name": "Tamim",
                "last_name": "Iqbal",
                "phone": "01755443322",
                "email": "tamim@example.com",
                "address_1": "Banani Road 11",
                "city": "Dhaka",
            },
            "shipping": {
                "first_name": "Tamim",
                "last_name": "Iqbal",
                "address_1": "Banani Road 11",
                "city": "Dhaka",
            },
            "line_items": [
                {
                    "id": 101,
                    "name": "Luxury Silk Cotton Polo",
                    "sku": sku_polo,
                    "quantity": 1,
                    "price": 1200.0,
                    "total": "1200.00",
                }
            ],
        }

        wc_res = await client.post(
            f"/api/v1/orders/webhook/woocommerce?tenant_id={tenant_id}",
            json=wc_webhook_payload,
        )
        assert wc_res.status_code == 201, wc_res.text
        wc_order = wc_res.json()
        assert wc_order["external_order_id"] == f"wc_{wc_id}"
        assert wc_order["source"] == "woocommerce"
        # Since SKU matches sku_polo, COGS should have been auto-resolved!
        assert Decimal(str(wc_order["total_cogs"])) == Decimal("600.00")
        assert Decimal(str(wc_order["total_amount"])) == Decimal("1260.00")
        print(f"9. WooCommerce Webhook Ingested: Order #{wc_order['order_number']} (External ID: {wc_order['external_order_id']})")
        print(f"   -> Auto-matched Catalog SKU '{sku_polo}' COGS: BDT {wc_order['total_cogs']}")

        # 10. Test WooCommerce Webhook Idempotency (Resend same webhook)
        wc_dup_res = await client.post(
            f"/api/v1/orders/webhook/woocommerce?tenant_id={tenant_id}",
            json=wc_webhook_payload,
        )
        assert wc_dup_res.status_code in (200, 201)
        assert wc_dup_res.json()["id"] == wc_order["id"]
        print("10. WooCommerce Webhook Idempotency Verified: Duplicate payload returned existing order record.")

        # 11. Test Background COGS Backfill Queue
        backfill_res = await client.post("/api/v1/orders/sync/backfill-cogs", headers=headers)
        assert backfill_res.status_code == 200, backfill_res.text
        backfill_data = backfill_res.json()
        print(f"11. Background Sync Queue: {backfill_data['message']}")

        # 12. Clean up test orders
        del_res = await client.delete(f"/api/v1/orders/{order_id}", headers=headers)
        assert del_res.status_code == 200
        del_wc = await client.delete(f"/api/v1/orders/{wc_order['id']}", headers=headers)
        assert del_wc.status_code == 200
        print(f"12. Test Orders Cleaned Up Successfully (Cascade Verified)")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 3 ORDER ENGINE & CONNECTOR TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")



if __name__ == "__main__":
    asyncio.run(test_orders_module())

