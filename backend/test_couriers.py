import sys
import asyncio
import uuid
import httpx
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.core.database import engine, Base


async def test_courier_module():
    print("=" * 65)
    print("STARTING UNIT 4 COURIER INTEGRATION & SETTLEMENT TEST ON NEON DB...")
    print("=" * 65)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Owner
        unique_owner = f"owner_courier_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "Logistics Operations Lead",
                "phone_number": "01911223344",
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

        # 3. Configure Courier Credentials (Steadfast & Pathao)
        stdf_cred_res = await client.post(
            "/api/v1/couriers/credentials",
            headers=headers,
            json={
                "provider": "steadfast",
                "api_key": f"stdf_key_{uuid.uuid4().hex[:8]}",
                "secret_key": "stdf_secret_demo",
                "is_active": True,
                "is_default": True,
            },
        )
        assert stdf_cred_res.status_code == 201, stdf_cred_res.text
        print("2. Steadfast API Credentials Configured & Set as Primary Courier")

        pth_cred_res = await client.post(
            "/api/v1/couriers/credentials",
            headers=headers,
            json={
                "provider": "pathao",
                "api_key": f"pth_key_{uuid.uuid4().hex[:8]}",
                "secret_key": "pth_secret_demo",
                "store_id": "9921",
                "is_active": True,
                "is_default": False,
            },
        )
        assert pth_cred_res.status_code == 201, pth_cred_res.text
        print("3. Pathao API Credentials Configured (Store ID: 9921)")

        # Verify credentials list
        creds_list = (await client.get("/api/v1/couriers/credentials", headers=headers)).json()
        assert len(creds_list) == 2

        # 4. Create Order 1 for Steadfast Dispatch
        order1_res = await client.post(
            "/api/v1/orders/",
            headers=headers,
            json={
                "customer_name": "Sakib Hasan",
                "customer_phone": "01819998877",
                "shipping_address": "Flat 4A, Green Garden, Dhanmondi 27",
                "shipping_city": "Dhaka",
                "shipping_fee": "60.00",
                "total_amount": "1560.00",
                "source": "facebook",
                "payment_method": "cod",
                "items": [
                    {
                        "product_name": "Premium Cotton Panjabi",
                        "quantity": 1,
                        "unit_price": "1500.00",
                    }
                ],
            },
        )
        assert order1_res.status_code == 201, order1_res.text
        order1 = order1_res.json()
        order1_id = order1["id"]
        print(f"4. Created Test Order 1: #{order1['order_number']} (Payable: BDT {order1['total_amount']})")

        # 5. One-Click Dispatch to Steadfast Courier
        dispatch1_res = await client.post(
            "/api/v1/couriers/dispatch",
            headers=headers,
            json={
                "order_id": order1_id,
                "provider": "steadfast",
                "notes": "Fragile clothing item, call customer before delivery",
            },
        )
        assert dispatch1_res.status_code == 201, dispatch1_res.text
        shipment1 = dispatch1_res.json()
        cid1 = shipment1["consignment_id"]
        print(f"5. Order 1 Dispatched to Steadfast: Consignment ID={cid1} (Tracking: {shipment1['tracking_code']})")
        assert shipment1["status"] == "booked"
        assert Decimal(str(shipment1["cod_amount"])) == Decimal("1560.00")
        assert Decimal(str(shipment1["delivery_fee"])) == Decimal("60.00")

        # Verify Order 1 status transitioned to IN_COURIER
        order1_verify = (await client.get(f"/api/v1/orders/{order1_id}", headers=headers)).json()
        assert order1_verify["status"] == "in_courier"
        print(f"   -> Order #{order1['order_number']} Status automatically transitioned to '{order1_verify['status'].upper()}'")

        # 6. Duplicate Dispatch Protection
        dup_dispatch = await client.post(
            "/api/v1/couriers/dispatch",
            headers=headers,
            json={"order_id": order1_id, "provider": "steadfast"},
        )
        assert dup_dispatch.status_code == 400
        print("6. Duplicate Dispatch Prevention: Blocked re-booking of already dispatched order")

        # 7. Realtime Steadfast Webhook: Order Delivered
        stdf_webhook_res = await client.post(
            "/api/v1/couriers/webhook/steadfast",
            json={
                "consignment_id": cid1,
                "invoice": order1["order_number"],
                "status": "delivered",
                "collected_amount": 1560.00,
                "message": "Customer accepted parcel and paid COD cash in Dhanmondi",
            },
        )
        assert stdf_webhook_res.status_code == 200, stdf_webhook_res.text
        print("7. Steadfast Webhook Received: Status 'delivered'")

        # Verify shipment & order are both updated to DELIVERED
        shipment1_verify = (await client.get(f"/api/v1/couriers/shipments/{shipment1['id']}", headers=headers)).json()
        assert shipment1_verify["status"] == "delivered"
        assert Decimal(str(shipment1_verify["collected_amount"])) == Decimal("1560.00")
        assert len(shipment1_verify["tracking_events"]) >= 2

        order1_delivered = (await client.get(f"/api/v1/orders/{order1_id}", headers=headers)).json()
        assert order1_delivered["status"] == "delivered"
        assert order1_delivered["payment_status"] == "paid"
        print(f"   -> Order #{order1['order_number']} Status automatically updated to '{order1_delivered['status'].upper()}' (Payment: PAID)")

        # 8. Create Order 2 and Dispatch to Pathao (Simulate Return)
        order2_res = await client.post(
            "/api/v1/orders/",
            headers=headers,
            json={
                "customer_name": "Mustafizur Rahman",
                "customer_phone": "01722334455",
                "shipping_address": "House 10, Road 2, Mirpur 10",
                "shipping_city": "Dhaka",
                "shipping_fee": "60.00",
                "total_amount": "960.00",
                "source": "manual",
                "items": [{"product_name": "Casual Polo Shirt", "quantity": 1, "unit_price": "900.00"}],
            },
        )
        assert order2_res.status_code == 201
        order2 = order2_res.json()
        order2_id = order2["id"]

        dispatch2_res = await client.post(
            "/api/v1/couriers/dispatch",
            headers=headers,
            json={"order_id": order2_id, "provider": "pathao"},
        )
        assert dispatch2_res.status_code == 201
        shipment2 = dispatch2_res.json()
        cid2 = shipment2["consignment_id"]
        print(f"8. Order 2 Dispatched to Pathao: Consignment ID={cid2}")

        # Pathao Webhook: Return
        pth_webhook_res = await client.post(
            "/api/v1/couriers/webhook/pathao",
            json={
                "consignment_id": cid2,
                "status": "returned",
                "message": "Customer refused delivery, returning to warehouse",
            },
        )
        assert pth_webhook_res.status_code == 200
        order2_returned = (await client.get(f"/api/v1/orders/{order2_id}", headers=headers)).json()
        assert order2_returned["status"] == "returned"
        print(f"   -> Order #{order2['order_number']} automatically transitioned to 'RETURNED' via Pathao webhook")

        # 9. Verify Courier Executive KPIs
        kpi_res = await client.get("/api/v1/couriers/stats/kpis", headers=headers)
        assert kpi_res.status_code == 200
        kpis = kpi_res.json()
        print(f"9. Courier Executive Performance KPIs:")
        print(f"   -> Total Parcels: {kpis['total_shipments']} | Delivered: {kpis['delivered_count']} | Returned: {kpis['returned_count']}")
        print(f"   -> Delivery Rate: {kpis['delivery_success_rate']}% | Return Rate: {kpis['return_rate']}%")
        print(f"   -> Total Collected COD: BDT {kpis['total_collected_amount']} | Unsettled Cash: BDT {kpis['unsettled_balance']}")
        assert kpis["total_shipments"] == 2
        assert kpis["delivered_count"] == 1
        assert kpis["returned_count"] == 1
        assert kpis["delivery_success_rate"] == 50.0
        assert kpis["return_rate"] == 50.0
        assert Decimal(str(kpis["total_collected_amount"])) == Decimal("1560.00")

        # 10. Clean up test records
        await client.delete(f"/api/v1/orders/{order1_id}", headers=headers)
        await client.delete(f"/api/v1/orders/{order2_id}", headers=headers)
        print("10. Test Shipments and Orders cleaned up successfully.")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 4 COURIER INTEGRATION TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(test_courier_module())

