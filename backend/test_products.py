import sys
import asyncio
import uuid
import httpx
from decimal import Decimal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.core.database import engine, Base


async def test_products_module():
    print("=" * 65)
    print("STARTING UNIT 2 (DAY 6) PRODUCTS & COGS ENGINE TEST ON NEON DB...")
    print("=" * 65)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup Owner
        unique_owner = f"owner_prod_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": unique_owner,
                "password": "Password123!",
                "full_name": "Product Manager",
                "phone_number": "01700112233",
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

        # 3. Create Product with Cost Price & Packaging
        prod1_payload = {
            "name": "Premium Cotton Polo Shirt",
            "sku": f"POLO-{uuid.uuid4().hex[:4].upper()}",
            "category": "Apparel",
            "regular_price": "990.00",
            "cost_price": "450.00",
            "packaging_cost": "30.00",
            "handling_cost": "10.00",
            "description": "100% combed cotton polo shirt",
        }
        create_res = await client.post("/api/v1/products/", headers=headers, json=prod1_payload)
        assert create_res.status_code == 201, create_res.text
        prod1 = create_res.json()
        prod1_id = prod1["id"]
        print(f"2. Product Created with Cost: '{prod1['name']}' (ID: {prod1_id})")

        # Verify unit gross profit & margin calculation
        # Unit profit = 990 - (450 + 30 + 10) = 500.00
        # Margin % = (500 / 990) * 100 = 50.51%
        assert prod1["has_cost"] is True
        assert Decimal(str(prod1["unit_gross_profit"])) == Decimal("500.00")
        assert Decimal(str(prod1["margin_percentage"])) == Decimal("50.51")
        print(f"   -> Unit Gross Profit: BDT {prod1['unit_gross_profit']} (Margin: {prod1['margin_percentage']}%)")

        # 4. Create Product WITHOUT Cost Price (Missing Cost Warning Test)
        prod2_payload = {
            "name": "Imported Smart Watch Ultra",
            "sku": f"WATCH-{uuid.uuid4().hex[:4].upper()}",
            "category": "Electronics",
            "regular_price": "2450.00",
            "cost_price": None,  # Cost not entered yet!
        }
        res2 = await client.post("/api/v1/products/", headers=headers, json=prod2_payload)
        assert res2.status_code == 201
        prod2 = res2.json()
        prod2_id = prod2["id"]
        assert prod2["has_cost"] is False
        assert prod2["unit_gross_profit"] is None
        print(f"3. Product Created Without Cost (Flagged): '{prod2['name']}'")

        # 5. Check Cost Coverage Indicator Endpoint
        coverage_res = await client.get("/api/v1/products/stats/cost-coverage", headers=headers)
        assert coverage_res.status_code == 200
        coverage = coverage_res.json()
        print(f"4. Cost Coverage KPI: {coverage['cost_coverage_percentage']}% "
              f"({coverage['products_with_cost']}/{coverage['total_products']} products covered)")
        assert coverage["total_products"] == 2
        assert coverage["products_with_cost"] == 1
        assert coverage["products_missing_cost"] == 1
        assert coverage["cost_coverage_percentage"] == 50.0

        # 6. Filter by Missing Cost
        missing_cost_res = await client.get("/api/v1/products/?has_cost=false", headers=headers)
        assert missing_cost_res.status_code == 200
        missing_items = missing_cost_res.json()
        assert len(missing_items) == 1
        assert missing_items[0]["id"] == prod2_id
        print(f"5. Filter 'has_cost=false' returned exactly missing product: '{missing_items[0]['name']}'")

        # 7. Add Variants to Product 1
        var_payload = {
            "name": "Size XL / Navy Blue",
            "sku": f"POLO-XL-BLU-{uuid.uuid4().hex[:3].upper()}",
            "price": "1050.00",
            "cost_price": "480.00",
            "stock_quantity": 40,
            "attributes": {"size": "XL", "color": "Navy Blue"},
        }
        var_res = await client.post(
            f"/api/v1/products/{prod1_id}/variants",
            headers=headers,
            json=var_payload,
        )
        assert var_res.status_code == 201, var_res.text
        variant = var_res.json()
        var_id = variant["id"]
        print(f"6. Product Variant Added: '{variant['name']}' (Cost: BDT {variant['cost_price']})")

        # 8. Update Cost Price with Audit History
        cost_update_payload = {
            "new_cost_price": "490.00",
            "reason": "Supplier yarn price increase batch #09",
        }
        update_cost_res = await client.post(
            f"/api/v1/products/{prod1_id}/cost",
            headers=headers,
            json=cost_update_payload,
        )
        assert update_cost_res.status_code == 200
        updated_prod = update_cost_res.json()
        assert Decimal(str(updated_prod["cost_price"])) == Decimal("490.00")
        assert len(updated_prod["cost_history"]) == 2  # Initial + Update
        print(f"7. Cost Price Audited & Updated: New Cost=BDT 490.00, History Records={len(updated_prod['cost_history'])}")

        # 8b. Test Bulk Cost Upload via SKU
        bulk_payload = {
            "items": [
                {
                    "sku": prod2["sku"],
                    "cost_price": "1200.00",
                    "packaging_cost": "45.00",
                    "handling_cost": "15.00",
                    "reason": "Bulk CSV cost setup",
                },
                {
                    "sku": "NON-EXISTENT-SKU",
                    "cost_price": "500.00",
                },
            ]
        }
        bulk_res = await client.post("/api/v1/products/bulk/costs", headers=headers, json=bulk_payload)
        assert bulk_res.status_code == 200, bulk_res.text
        bulk_data = bulk_res.json()
        assert bulk_data["updated_count"] == 1
        assert bulk_data["failed_count"] == 1
        print(f"7b. Bulk Cost Update: Updated={bulk_data['updated_count']}, Failed={bulk_data['failed_count']} (Handled gracefully)")

        # 9. Delete Variant
        del_var_res = await client.delete(
            f"/api/v1/products/{prod1_id}/variants/{var_id}", headers=headers
        )
        assert del_var_res.status_code == 200
        print("8. Variant Deleted Successfully")

        # 10. Delete Product
        del_prod_res = await client.delete(
            f"/api/v1/products/{prod2_id}", headers=headers
        )
        assert del_prod_res.status_code == 200
        print("9. Unused Product Deleted Successfully")

        print("\n" + "=" * 65)
        print(">>> ALL UNIT 2 (DAY 6) PRODUCT & COGS TESTS PASSED 100%! <<<")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(test_products_module())
