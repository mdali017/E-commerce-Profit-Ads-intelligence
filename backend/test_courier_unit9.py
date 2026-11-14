import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hmac
import hashlib
import asyncio
import uuid
import httpx
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, delete, update
from app.main import app
from app.core.database import engine, Base, AsyncSessionLocal
from app.modules.couriers.migrations import ensure_courier_schema
from app.modules.couriers.models import CourierCredential, CourierProvider, CourierSettlement, CourierShipment
from app.modules.couriers.crypto import decrypt_secret


async def run_unit9_courier_tests():
    print("=" * 72)
    print("STARTING UNIT 9 MULTI-COURIER INTEGRATION VERIFICATION SUITE...")
    print("=" * 72)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # 1. Idempotency check on schema upgrade migration
    await ensure_courier_schema(engine)
    await ensure_courier_schema(engine)
    print("1. Schema Migration Idempotency Verified (ensure_courier_schema x2 OK)")

    transport = httpx.ASGITransport(app=app)
    created_order_ids = []
    settlement_id = None
    tenant_id = None

    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 2. Signup Owner & Retrieve Workspace
        unique_owner = f"unit9_courier_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        signup = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "Unit 9 Logistics Admin",
                "phone_number": "01711002233",
            },
        )
        assert signup.status_code == 201, signup.text
        token = signup.json()["access_token"]
        ws_res = await client.get(
            "/api/v1/workspaces/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert ws_res.status_code == 200
        tenant_id = ws_res.json()[0]["tenant_id"]
        headers = {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_id}
        print(f"2. Workspace Initialized: ID={tenant_id}")

        # 3. Credential Encryption + Masking + Secret Preservation
        stdf_res = await client.post(
            "/api/v1/couriers/credentials",
            headers=headers,
            json={
                "provider": "steadfast",
                "api_key": f"stdf_key_{uuid.uuid4().hex[:6]}",
                "secret_key": "my_real_secret_1234",
                "is_active": True,
                "is_default": True,
            },
        )
        assert stdf_res.status_code == 201, stdf_res.text
        stdf_json = stdf_res.json()
        assert stdf_json["has_secret"] is True
        assert stdf_json["secret_key"].endswith("1234")
        assert "my_real_secret" not in stdf_json["secret_key"]

        # Verify at-rest encryption in DB + partial re-save preserves existing secret
        async with AsyncSessionLocal() as db:
            row = (
                await db.execute(
                    select(CourierCredential).where(
                        CourierCredential.tenant_id == tenant_id,
                        CourierCredential.provider == CourierProvider.STEADFAST,
                    )
                )
            ).scalar_one()
            assert row.secret_key.startswith("enc:v1:"), row.secret_key
            assert decrypt_secret(row.secret_key) == "my_real_secret_1234"

        resave_masked = await client.post(
            "/api/v1/couriers/credentials",
            headers=headers,
            json={
                "provider": "steadfast",
                "api_key": stdf_json["api_key"],
                "secret_key": stdf_json["secret_key"],  # masked "••••1234"
                "is_active": True,
                "is_default": True,
            },
        )
        assert resave_masked.status_code == 201
        async with AsyncSessionLocal() as db:
            row2 = (
                await db.execute(
                    select(CourierCredential).where(
                        CourierCredential.tenant_id == tenant_id,
                        CourierCredential.provider == CourierProvider.STEADFAST,
                    )
                )
            ).scalar_one()
            assert decrypt_secret(row2.secret_key) == "my_real_secret_1234"
        print("3. Fernet Encryption, Secret Masking & Partial Update Preservation Verified")

        # 4. Pathao OAuth Credentials & Test Connection
        pathao_wh_secret = "pathao_wh_secret_2026"
        pth_res = await client.post(
            "/api/v1/couriers/credentials",
            headers=headers,
            json={
                "provider": "pathao",
                "api_key": f"pth_key_{uuid.uuid4().hex[:6]}",
                "client_id": f"pth_key_{uuid.uuid4().hex[:6]}",
                "client_secret": "pth_client_secret_9876",
                "username": "merchant@unit9.bd",
                "password": "PathaoPass!99",
                "store_id": "12345",
                "webhook_secret": pathao_wh_secret,
                "is_sandbox": True,
                "is_active": True,
                "is_default": False,
            },
        )
        assert pth_res.status_code == 201, pth_res.text
        pth_json = pth_res.json()
        assert pth_json["has_password"] is True
        assert pth_json["is_sandbox"] is True

        pth_test = await client.post(
            "/api/v1/couriers/credentials/test",
            headers=headers,
            json={
                "provider": "pathao",
                "client_id": pth_json["client_id"],
                "client_secret": "pth_client_secret_9876",
                "username": "merchant@unit9.bd",
                "password": "PathaoPass!99",
                "is_sandbox": True,
            },
        )
        assert pth_test.status_code == 200, pth_test.text
        assert pth_test.json()["success"] is True

        # 5. eCourier Credentials & Test Connection
        ecr_res = await client.post(
            "/api/v1/couriers/credentials",
            headers=headers,
            json={
                "provider": "ecourier",
                "api_key": f"ecr_key_{uuid.uuid4().hex[:6]}",
                "secret_key": "ecr_secret_5555",
                "user_id": "ECR_UNIT9_USER",
                "is_sandbox": True,
                "is_active": True,
                "is_default": False,
            },
        )
        assert ecr_res.status_code == 201, ecr_res.text
        assert ecr_res.json()["user_id"] == "ECR_UNIT9_USER"

        ecr_test = await client.post(
            "/api/v1/couriers/credentials/test",
            headers=headers,
            json={"provider": "ecourier", "is_sandbox": True},
        )
        assert ecr_test.status_code == 200 and ecr_test.json()["success"] is True

        stdf_test = await client.post(
            "/api/v1/couriers/credentials/test",
            headers=headers,
            json={"provider": "steadfast"},
        )
        assert stdf_test.status_code == 200 and stdf_test.json()["success"] is True
        print("4. Steadfast, Pathao OAuth & eCourier Connection Tests Passed")

        # 6. Pathao & eCourier Location Trees + Pathao Delivery Price Calculation
        stores = (await client.get("/api/v1/couriers/locations/pathao/stores", headers=headers)).json()
        cities = (await client.get("/api/v1/couriers/locations/pathao/cities", headers=headers)).json()
        zones = (await client.get("/api/v1/couriers/locations/pathao/cities/1/zones", headers=headers)).json()
        areas = (await client.get("/api/v1/couriers/locations/pathao/zones/298/areas", headers=headers)).json()
        assert len(stores) > 0 and len(cities) > 0 and len(zones) > 0 and len(areas) > 0

        price_res = await client.post(
            "/api/v1/couriers/pricing/pathao",
            headers=headers,
            json={"item_type": 2, "delivery_type": 48, "item_weight": 0.5, "recipient_city": 1, "recipient_zone": 298},
        )
        assert price_res.status_code == 200, price_res.text
        assert Decimal(str(price_res.json()["final_price"])) > Decimal("0")

        ec_cities = (await client.get("/api/v1/couriers/locations/ecourier/cities", headers=headers)).json()
        ec_thanas = (await client.get("/api/v1/couriers/locations/ecourier/thanas?city=Dhaka", headers=headers)).json()
        ec_pcs = (await client.get("/api/v1/couriers/locations/ecourier/postcodes?city=Dhaka&thana=Dhanmondi", headers=headers)).json()
        ec_areas = (await client.get("/api/v1/couriers/locations/ecourier/areas?postcode=1209", headers=headers)).json()
        ec_pkgs = (await client.get("/api/v1/couriers/locations/ecourier/packages", headers=headers)).json()
        assert all(len(x) > 0 for x in [ec_cities, ec_thanas, ec_pcs, ec_areas, ec_pkgs])
        print("5. Pathao & eCourier Location Cascading & Live Price Calculator Passed")

        # 7. Steadfast Merchant Balance & Fraud Check
        bal_res = await client.get("/api/v1/couriers/balance/steadfast", headers=headers)
        assert bal_res.status_code == 200, bal_res.text
        assert Decimal(str(bal_res.json()["current_balance"])) > Decimal("0")

        fraud_res = await client.get("/api/v1/couriers/fraud-check/01711002233", headers=headers)
        assert fraud_res.status_code == 200, fraud_res.text
        assert "risk_level" in fraud_res.json() and "success_rate" in fraud_res.json()
        print("6. Steadfast Balance & Hybrid Customer Fraud Check Passed")

        # 8. Create 6 Orders across Steadfast Bulk (3), Pathao (1), eCourier (2)
        async def make_order(name: str, phone: str, city: str, amount: str):
            res = await client.post(
                "/api/v1/orders/",
                headers=headers,
                json={
                    "customer_name": name,
                    "customer_phone": phone,
                    "shipping_address": f"Road 7, {city}",
                    "shipping_city": city,
                    "shipping_fee": "60.00",
                    "total_amount": amount,
                    "source": "facebook",
                    "payment_method": "cod",
                    "items": [{"product_name": "Unit 9 Test Item", "quantity": 1, "unit_price": str(Decimal(amount) - Decimal("60.00"))}],
                },
            )
            assert res.status_code == 201, res.text
            o = res.json()
            created_order_ids.append(o["id"])
            return o

        bulk_o1 = await make_order("Rahim Mia", "01711000001", "Dhaka", "1260.00")
        bulk_o2 = await make_order("Karim Uddin", "01711000002", "Chattogram", "1560.00")
        bulk_o3 = await make_order("Nadia Islam", "01711000003", "Sylhet", "960.00")
        pth_o = await make_order("Tanvir Ahmed", "01812000004", "Dhaka", "1860.00")
        ecr_o1 = await make_order("Sadia Akter", "01913000005", "Dhaka", "1460.00")
        ecr_o2 = await make_order("Hasan Mahmud", "01614000006", "Dhaka", "860.00")

        # 9. Steadfast Bulk Dispatch (3 orders at once)
        bulk_res = await client.post(
            "/api/v1/couriers/dispatch/bulk",
            headers=headers,
            json={
                "order_ids": [bulk_o1["id"], bulk_o2["id"], bulk_o3["id"]],
                "provider": "steadfast",
                "notes": "Bulk pickup afternoon slot",
            },
        )
        assert bulk_res.status_code == 200, bulk_res.text
        bulk_data = bulk_res.json()
        assert bulk_data["succeeded_count"] == 3 and bulk_data["failed_count"] == 0
        stdf_shipment_ids = [r["shipment_id"] for r in bulk_data["results"]]
        stdf_cids = [r["consignment_id"] for r in bulk_data["results"]]
        print(f"7. Steadfast Bulk Dispatch Passed (3/3 parcels booked)")

        # Mark first two Steadfast parcels Delivered via Steadfast Webhook
        for idx, cid in enumerate(stdf_cids[:2]):
            cod_val = "1260.00" if idx == 0 else "1560.00"
            wh = await client.post(
                "/api/v1/couriers/webhook/steadfast",
                json={"consignment_id": cid, "status": "delivered", "cod_amount": cod_val},
            )
            assert wh.status_code == 200 and wh.json()["new_status"] == "delivered"

        # 10. Pathao Dispatch + HMAC Signature Rejection (401) & Valid Signature (200)
        pth_disp = await client.post(
            "/api/v1/couriers/dispatch",
            headers=headers,
            json={
                "order_id": pth_o["id"],
                "provider": "pathao",
                "recipient_city": "Dhaka",
                "recipient_zone": "Dhanmondi",
                "recipient_area": "Dhanmondi 27",
                "city_id": 1,
                "zone_id": 298,
                "area_id": 1001,
                "item_weight": 0.5,
                "delivery_type": 48,
            },
        )
        assert pth_disp.status_code == 201, pth_disp.text
        pth_ship = pth_disp.json()
        pth_cid = pth_ship["consignment_id"]
        assert pth_ship["provider"] == "pathao" and pth_ship["recipient_zone"] == "Dhanmondi"

        pth_payload_bytes = json.dumps({
            "consignment_id": pth_cid,
            "order_status_slug": "Delivered",
            "collected_amount": "1860.00",
        }).encode("utf-8")

        # Invalid signature MUST return 401
        bad_sig = await client.post(
            "/api/v1/couriers/webhook/pathao",
            content=pth_payload_bytes,
            headers={"Content-Type": "application/json", "X-PATHAO-Signature": "bad_sig_value"},
        )
        assert bad_sig.status_code == 401, bad_sig.text

        # Valid HMAC-SHA256 signature returns 200
        valid_hmac = hmac.new(pathao_wh_secret.encode("utf-8"), pth_payload_bytes, hashlib.sha256).hexdigest()
        good_sig = await client.post(
            "/api/v1/couriers/webhook/pathao",
            content=pth_payload_bytes,
            headers={"Content-Type": "application/json", "X-PATHAO-Signature": valid_hmac},
        )
        assert good_sig.status_code == 200 and good_sig.json()["new_status"] == "delivered"
        print("8. Pathao Dispatch & X-PATHAO-Signature Security Verification Passed")

        # 11. eCourier Dispatch, Polling Sync, Webhook Delivery & Cancel Flow
        ecr_disp1 = await client.post(
            "/api/v1/couriers/dispatch",
            headers=headers,
            json={
                "order_id": ecr_o1["id"],
                "provider": "ecourier",
                "recipient_city": "Dhaka",
                "recipient_zone": "Dhanmondi",
                "recipient_postcode": "1209",
                "recipient_area": "Dhanmondi 27",
                "package_code": "#2477",
            },
        )
        assert ecr_disp1.status_code == 201, ecr_disp1.text
        ecr_ship1 = ecr_disp1.json()
        assert ecr_ship1["provider"] == "ecourier"
        assert ecr_ship1["recipient_postcode"] == "1209"

        # Verify GET /shipments/order/{order_id}
        by_order = await client.get(f"/api/v1/couriers/shipments/order/{ecr_o1['id']}", headers=headers)
        assert by_order.status_code == 200 and by_order.json()["id"] == ecr_ship1["id"]

        # Trigger eCourier Polling
        poll_res = await client.post("/api/v1/couriers/sync/poll?provider=ecourier", headers=headers)
        assert poll_res.status_code == 200 and poll_res.json()["checked"] >= 1

        # Deliver eCourier Shipment 1 via webhook
        ecr_wh = await client.post(
            "/api/v1/couriers/webhook/ecourier",
            json={"consignment_id": ecr_ship1["consignment_id"], "status": "Delivered", "collected_amount": "1460.00"},
        )
        assert ecr_wh.status_code == 200 and ecr_wh.json()["new_status"] == "delivered"

        # Verify eCourier Order 1 is now DELIVERED & PAID
        ecr_o1_check = (await client.get(f"/api/v1/orders/{ecr_o1['id']}", headers=headers)).json()
        assert ecr_o1_check["status"] == "delivered"
        assert ecr_o1_check["payment_status"] == "paid"

        # Book eCourier Shipment 2 and Cancel it before pickup
        ecr_disp2 = await client.post(
            "/api/v1/couriers/dispatch",
            headers=headers,
            json={"order_id": ecr_o2["id"], "provider": "ecourier"},
        )
        assert ecr_disp2.status_code == 201
        ecr_ship2_id = ecr_disp2.json()["id"]
        cancel_res = await client.post(
            f"/api/v1/couriers/shipments/{ecr_ship2_id}/cancel",
            headers=headers,
            json={"reason": "Customer asked to hold"},
        )
        assert cancel_res.status_code == 200 and cancel_res.json()["status"] == "cancelled"
        print("9. eCourier Dispatch, Polling Sync, Delivery Webhook & Pre-Pickup Cancel Passed")

        # 12. COD Settlement Reconciliation Flow
        unsettled = (await client.get("/api/v1/couriers/settlements/unsettled?provider=steadfast", headers=headers)).json()
        assert len(unsettled) == 2

        settle_res = await client.post(
            "/api/v1/couriers/settlements",
            headers=headers,
            json={
                "provider": "steadfast",
                "settlement_number": f"STL-U9-{uuid.uuid4().hex[:5].upper()}",
                "shipment_ids": stdf_shipment_ids[:2],
                "reference_number": "BKASH-TXN-99881",
                "bank_account": "City Bank ****4421",
                "notes": "Steadfast weekly batch",
            },
        )
        assert settle_res.status_code == 201, settle_res.text
        stl = settle_res.json()
        settlement_id = stl["id"]
        assert stl["shipment_count"] == 2
        assert Decimal(str(stl["total_collected_amount"])) == Decimal("2820.00")
        assert Decimal(str(stl["net_payout_amount"])) < Decimal("2820.00")

        # Detail & Patch Settlement
        stl_det = await client.get(f"/api/v1/couriers/settlements/{settlement_id}", headers=headers)
        assert stl_det.status_code == 200 and len(stl_det.json()["shipments"]) == 2

        stl_upd = await client.patch(
            f"/api/v1/couriers/settlements/{settlement_id}",
            headers=headers,
            json={"notes": "Reconciled against bank statement"},
        )
        assert stl_upd.status_code == 200 and stl_upd.json()["notes"] == "Reconciled against bank statement"

        # Unsettled for steadfast should now be 0
        unsettled_after = (await client.get("/api/v1/couriers/settlements/unsettled?provider=steadfast", headers=headers)).json()
        assert len(unsettled_after) == 0
        print("10. COD Settlement Creation, Net Payout Calculation & Reconciliation Passed")

        # 13. Courier Analytics Endpoints
        perf = await client.get("/api/v1/couriers/analytics/delivery-performance?days=30", headers=headers)
        cost = await client.get("/api/v1/couriers/analytics/cost-analysis?days=30", headers=headers)
        city = await client.get("/api/v1/couriers/analytics/city-performance?days=30", headers=headers)
        stale = await client.get("/api/v1/couriers/analytics/stale-shipments?hours=48", headers=headers)
        assert perf.status_code == 200 and len(perf.json()["providers"]) >= 3
        assert cost.status_code == 200 and Decimal(str(cost.json()["total_courier_cost"])) > Decimal("0")
        assert city.status_code == 200 and len(city.json()) >= 1
        assert stale.status_code == 200
        print("11. Provider Performance, Cost Analysis, City Breakdown & Stale Shipments Passed")

        # 14. Clean up test settlements, orders, credentials
        async with AsyncSessionLocal() as db:
            if settlement_id:
                await db.execute(
                    update(CourierShipment)
                    .where(CourierShipment.settlement_id == settlement_id)
                    .values(settlement_id=None, is_settled=False)
                )
                await db.execute(delete(CourierSettlement).where(CourierSettlement.id == settlement_id))
            await db.commit()

        for oid in created_order_ids:
            await client.delete(f"/api/v1/orders/{oid}", headers=headers)

        creds_all = (await client.get("/api/v1/couriers/credentials", headers=headers)).json()
        for c in creds_all:
            await client.delete(f"/api/v1/couriers/credentials/{c['id']}", headers=headers)

        print("12. Test Data Cleaned Up Successfully")
        print("\n" + "=" * 72)
        print(">>> ALL UNIT 9 MULTI-COURIER & SETTLEMENT TESTS PASSED 100%! <<<")
        print("=" * 72 + "\n")


if __name__ == "__main__":
    asyncio.run(run_unit9_courier_tests())
