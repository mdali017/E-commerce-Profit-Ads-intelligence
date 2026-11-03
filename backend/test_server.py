import asyncio
import uuid
import httpx
from app.main import app
from app.core.database import engine, Base


async def test_full_pipeline():
    print("Initializing Database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Testing Backend Pipeline...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health Check
        health_res = await client.get("/health")
        print("Health Check:", health_res.status_code, health_res.json())
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # 2. Signup
        unique_email = f"owner_{uuid.uuid4().hex[:6]}@ecomprofit.com"
        signup_payload = {
            "email": unique_email,
            "password": "Password123!",
            "full_name": "Ecom Owner",
            "phone_number": "01711223344",
        }
        signup_res = await client.post("/api/v1/auth/signup", json=signup_payload)
        print("Signup Response Status:", signup_res.status_code)
        assert signup_res.status_code == 201
        data = signup_res.json()
        token = data["access_token"]
        assert token is not None

        # 3. Get Workspaces
        headers = {"Authorization": f"Bearer {token}"}
        ws_res = await client.get("/api/v1/workspaces/me", headers=headers)
        print("Workspaces Response Status:", ws_res.status_code)
        assert ws_res.status_code == 200
        workspaces = ws_res.json()
        assert len(workspaces) >= 1
        tenant_id = workspaces[0]["tenant_id"]
        print(f"User automatically assigned to workspace: {workspaces[0]['tenant']['name']} (ID: {tenant_id})")

        # 4. Access Tenant-scoped endpoint
        headers["X-Tenant-ID"] = tenant_id
        prod_res = await client.get("/api/v1/products/", headers=headers)
        print("Products Module Response Status:", prod_res.status_code, prod_res.json())
        assert prod_res.status_code == 200

        print(">>> ALL BACKEND DAY 1 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<")


if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
