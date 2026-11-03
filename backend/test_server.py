import sys
import asyncio
import uuid
import httpx

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from app.main import app
from app.core.database import engine, Base


async def test_full_pipeline():
    print("=" * 60)
    print("INITIALIZING DATABASE TABLES...")
    print("=" * 60)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health Check
        health_res = await client.get("/health")
        print("1. Health Check:", health_res.status_code, health_res.json())
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # 2. Signup Owner
        unique_owner = f"owner_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        owner_payload = {
            "email": unique_owner,
            "password": "Password123!",
            "full_name": "Ecom Owner",
            "phone_number": "01711223344",
        }
        res = await client.post("/api/v1/auth/signup", json=owner_payload)
        assert res.status_code == 201, res.text
        owner_data = res.json()
        owner_token = owner_data["access_token"]
        print(f"2. Owner Registered: {unique_owner}")

        # 3. Get Owner Workspace
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        ws_res = await client.get("/api/v1/workspaces/me", headers=owner_headers)
        assert ws_res.status_code == 200
        workspaces = ws_res.json()
        assert len(workspaces) >= 1
        tenant_id = workspaces[0]["tenant_id"]
        owner_headers["X-Tenant-ID"] = tenant_id
        print(f"3. Workspace Verified: ID={tenant_id}")

        # 4. Signup Second User (Operator)
        unique_operator = f"operator_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        op_payload = {
            "email": unique_operator,
            "password": "Password123!",
            "full_name": "Ecom Operator",
            "phone_number": "01799887766",
        }
        res_op = await client.post("/api/v1/auth/signup", json=op_payload)
        assert res_op.status_code == 201, res_op.text
        op_token = res_op.json()["access_token"]
        op_headers = {"Authorization": f"Bearer {op_token}", "X-Tenant-ID": tenant_id}
        print(f"4. Operator User Registered: {unique_operator}")

        # 5. Add Operator to Owner's Workspace
        add_res = await client.post(
            f"/api/v1/workspaces/{tenant_id}/members",
            headers=owner_headers,
            json={"email": unique_operator, "role": "operator"},
        )
        assert add_res.status_code == 201, add_res.text
        op_membership = add_res.json()
        op_membership_id = op_membership["id"]
        print(f"5. Operator Added to Workspace with Role: {op_membership['role']}")

        # 6. List Members
        members_res = await client.get(
            f"/api/v1/workspaces/{tenant_id}/members", headers=owner_headers
        )
        assert members_res.status_code == 200
        members = members_res.json()
        assert len(members) == 2
        print(f"6. Workspace Member Count Verified: {len(members)} members")

        # 7. RBAC Protection Test: Operator cannot update workspace settings (Requires OWNER or ADMIN)
        bad_update_res = await client.patch(
            f"/api/v1/workspaces/{tenant_id}",
            headers=op_headers,
            json={"name": "Hacked Workspace Name"},
        )
        print("7. RBAC Check (Operator Update Forbidden):", bad_update_res.status_code)
        assert bad_update_res.status_code == 403, "Operator should NOT have permission to update workspace!"

        # 8. RBAC Success Test: Owner can update workspace settings
        good_update_res = await client.patch(
            f"/api/v1/workspaces/{tenant_id}",
            headers=owner_headers,
            json={"name": "Premium BD Brand", "date_basis": "delivery_date"},
        )
        assert good_update_res.status_code == 200, good_update_res.text
        assert good_update_res.json()["name"] == "Premium BD Brand"
        print("8. Owner Workspace Update Succeeded:", good_update_res.json()["name"])

        # 9. Role Promotion Test: Owner promotes Operator to Admin
        promote_res = await client.patch(
            f"/api/v1/workspaces/{tenant_id}/members/{op_membership_id}",
            headers=owner_headers,
            json={"role": "admin"},
        )
        assert promote_res.status_code == 200, promote_res.text
        assert promote_res.json()["role"] == "admin"
        print("9. Operator Successfully Promoted to Admin!")

        # 10. Admin Can Now Update Workspace Settings
        admin_update_res = await client.patch(
            f"/api/v1/workspaces/{tenant_id}",
            headers=op_headers,
            json={"currency": "BDT"},
        )
        assert admin_update_res.status_code == 200
        print("10. Promoted Admin Update Permitted:", admin_update_res.status_code)

        # 11. Remove Member Test
        del_res = await client.delete(
            f"/api/v1/workspaces/{tenant_id}/members/{op_membership_id}",
            headers=owner_headers,
        )
        assert del_res.status_code == 200
        print("11. Member Successfully Removed from Workspace!")

        print("\n" + "=" * 60)
        print(">>> ALL DAY 2 & DAY 3 RBAC & MULTI-TENANCY TESTS PASSED 100%! <<<")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
