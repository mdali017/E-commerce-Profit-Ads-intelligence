import os
import sys
import json
import time
import hmac
import hashlib
import uuid
import subprocess
from pathlib import Path
from decimal import Decimal
import httpx
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
SCREENSHOTS_DIR = ROOT_DIR / "product_docs" / "screenshots"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)


def wait_for_http(url: str, timeout: float = 90.0, proc=None, log_path: Path = None):
    deadline = time.time() + timeout
    with httpx.Client(trust_env=False, timeout=2.5) as client:
        while time.time() < deadline:
            if proc is not None and proc.poll() is not None:
                log_txt = log_path.read_text(encoding="utf-8", errors="replace") if log_path and log_path.exists() else ""
                raise RuntimeError(f"Server exited early ({proc.returncode}) before {url} ready.\nLog:\n{log_txt[-2000:]}")
            try:
                r = client.get(url)
                if r.status_code < 500:
                    return True
            except Exception:
                pass
            time.sleep(0.5)
    log_txt = log_path.read_text(encoding="utf-8", errors="replace") if log_path and log_path.exists() else ""
    raise RuntimeError(f"Server at {url} did not become ready within {timeout}s.\nLog:\n{log_txt[-2000:]}")


def main():
    backend_python = str(BACKEND_DIR / ".venv" / "Scripts" / "python.exe")
    node_next_bin = str(FRONTEND_DIR / "node_modules" / "next" / "dist" / "bin" / "next")

    backend_log_path = ROOT_DIR / "product_docs" / "_u9_backend.log"
    frontend_log_path = ROOT_DIR / "product_docs" / "_u9_frontend.log"
    backend_log = open(backend_log_path, "w", encoding="utf-8")
    frontend_log = open(frontend_log_path, "w", encoding="utf-8")

    backend_proc = subprocess.Popen(
        [backend_python, "-u", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(BACKEND_DIR),
        stdout=backend_log,
        stderr=subprocess.STDOUT,
    )
    frontend_proc = subprocess.Popen(
        ["node", node_next_bin, "start", "-H", "127.0.0.1", "-p", "3000"],
        cwd=str(FRONTEND_DIR),
        stdout=frontend_log,
        stderr=subprocess.STDOUT,
    )

    api_base = "http://127.0.0.1:8000/api/v1"
    created_orders = []
    token = None
    tenant_id = None

    try:
        print("Waiting for FastAPI backend & Next.js frontend servers...")
        wait_for_http("http://127.0.0.1:8000/health", timeout=120.0, proc=backend_proc, log_path=backend_log_path)
        wait_for_http("http://127.0.0.1:3000/login", timeout=45.0, proc=frontend_proc, log_path=frontend_log_path)
        print("Both servers are UP!")

        # Seed clean realistic multi-courier tenant data
        with httpx.Client(base_url=api_base, timeout=120.0, trust_env=False) as client:
            email = f"ui_verify_u9_{uuid.uuid4().hex[:6]}@ecomprofit.com"
            s_res = client.post(
                "/auth/signup",
                json={
                    "email": email,
                    "password": "Password123!",
                    "full_name": "Nusrat Jahan",
                    "phone_number": "01711002233",
                },
            )
            assert s_res.status_code == 201, s_res.text
            token = s_res.json()["access_token"]
            me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert me_res.status_code == 200
            user_obj = me_res.json()

            ws_res = client.get("/workspaces/me", headers={"Authorization": f"Bearer {token}"})
            assert ws_res.status_code == 200
            tenant_id = ws_res.json()[0]["tenant_id"]
            headers = {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_id}

            # Configure Steadfast, Pathao & eCourier
            client.post(
                "/couriers/credentials",
                headers=headers,
                json={
                    "provider": "steadfast",
                    "api_key": f"stdf_key_{uuid.uuid4().hex[:6]}",
                    "secret_key": "stdf_demo_secret_8812",
                    "is_active": True,
                    "is_default": True,
                },
            ).raise_for_status()

            pth_wh_sec = "pth_wh_unit9_sec"
            client.post(
                "/couriers/credentials",
                headers=headers,
                json={
                    "provider": "pathao",
                    "api_key": f"pth_key_{uuid.uuid4().hex[:6]}",
                    "client_id": f"pth_cid_{uuid.uuid4().hex[:6]}",
                    "client_secret": "pth_demo_secret_4410",
                    "username": "merchant@ecomprofit.bd",
                    "password": "DemoPassword!99",
                    "store_id": "12345",
                    "webhook_secret": pth_wh_sec,
                    "is_sandbox": True,
                    "is_active": True,
                    "is_default": False,
                },
            ).raise_for_status()
            client.post(
                "/couriers/credentials/test",
                headers=headers,
                json={"provider": "pathao", "is_sandbox": True},
            ).raise_for_status()

            client.post(
                "/couriers/credentials",
                headers=headers,
                json={
                    "provider": "ecourier",
                    "api_key": f"ecr_key_{uuid.uuid4().hex[:6]}",
                    "secret_key": "ecr_demo_secret_9011",
                    "user_id": "ECR_BD_2041",
                    "is_sandbox": True,
                    "is_active": True,
                    "is_default": False,
                },
            ).raise_for_status()

            def make_order(name, phone, addr, city, product, price, confirm=False):
                r = client.post(
                    "/orders/",
                    headers=headers,
                    json={
                        "customer_name": name,
                        "customer_phone": phone,
                        "shipping_address": addr,
                        "shipping_city": city,
                        "shipping_fee": "60.00",
                        "total_amount": str(Decimal(price) + Decimal("60.00")),
                        "source": "facebook",
                        "payment_method": "cod",
                        "items": [{"product_name": product, "quantity": 1, "unit_price": price}],
                    },
                )
                r.raise_for_status()
                o = r.json()
                created_orders.append(o["id"])
                if confirm:
                    st = client.patch(
                        f"/orders/{o['id']}/status",
                        headers=headers,
                        json={"status": "confirmed", "reason": "Confirmed by verification operator"},
                    )
                    st.raise_for_status()
                return o

            o_stdf_1 = make_order("Tanvir Ahmed", "01711223344", "House 14, Road 6, Mirpur 10", "Dhaka", "Premium Denim Jacket", "1590.00")
            o_stdf_2 = make_order("Farhana Yasmin", "01819445566", "GEC Circle, Plot 22", "Chattogram", "Silk Eid Kurti", "2140.00")
            o_pth_1 = make_order("Mahmudul Hasan", "01911778899", "Road 27, House 8, Dhanmondi", "Dhaka", "Leather Wallet Combo", "1430.00")
            o_pth_2 = make_order("Rashedul Islam", "01612334455", "Zindabazar Main Road", "Sylhet", "Smart Watch Pro", "1790.00")
            o_ecr_1 = make_order("Sadia Rahman", "01755667788", "Road 11, Block F, Banani", "Dhaka", "Canvas Tote Bag", "1060.00")
            o_ready = make_order("Nafisa Chowdhury", "01711998877", "Sector 7, Uttara", "Dhaka", "Linen Summer Dress", "1320.00", confirm=True)

            # Dispatch parcels
            s_stdf_1 = client.post("/couriers/dispatch", headers=headers, json={"order_id": o_stdf_1["id"], "provider": "steadfast"}).json()
            s_stdf_2 = client.post("/couriers/dispatch", headers=headers, json={"order_id": o_stdf_2["id"], "provider": "steadfast"}).json()
            s_pth_1 = client.post(
                "/couriers/dispatch",
                headers=headers,
                json={
                    "order_id": o_pth_1["id"],
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
            ).json()
            s_pth_2 = client.post(
                "/couriers/dispatch",
                headers=headers,
                json={
                    "order_id": o_pth_2["id"],
                    "provider": "pathao",
                    "recipient_city": "Sylhet",
                    "recipient_zone": "Zindabazar",
                    "city_id": 3,
                    "zone_id": 501,
                    "item_weight": 0.5,
                    "delivery_type": 48,
                },
            ).json()
            s_ecr_1 = client.post(
                "/couriers/dispatch",
                headers=headers,
                json={
                    "order_id": o_ecr_1["id"],
                    "provider": "ecourier",
                    "recipient_city": "Dhaka",
                    "recipient_zone": "Banani",
                    "recipient_postcode": "1213",
                    "recipient_area": "Road 11 Banani",
                    "package_code": "#2477",
                },
            ).json()

            # Simulate realistic webhook updates
            client.post(
                "/couriers/webhook/steadfast",
                json={"consignment_id": s_stdf_1["consignment_id"], "status": "delivered", "cod_amount": "1650.00"},
            ).raise_for_status()
            client.post(
                "/couriers/webhook/steadfast",
                json={"consignment_id": s_stdf_2["consignment_id"], "status": "delivered", "cod_amount": "2200.00"},
            ).raise_for_status()

            pth1_body = json.dumps({
                "consignment_id": s_pth_1["consignment_id"],
                "order_status_slug": "In_Transit",
                "message": "Arrived at Dhanmondi Hub & assigned to rider",
                "hub_name": "Dhanmondi Last-Mile Hub",
            }).encode("utf-8")
            pth1_sig = hmac.new(pth_wh_sec.encode("utf-8"), pth1_body, hashlib.sha256).hexdigest()
            client.post(
                "/couriers/webhook/pathao",
                content=pth1_body,
                headers={"Content-Type": "application/json", "X-PATHAO-Signature": pth1_sig},
            ).raise_for_status()

            pth2_body = json.dumps({
                "consignment_id": s_pth_2["consignment_id"],
                "order_status_slug": "Delivered",
                "collected_amount": "1850.00",
                "delivery_fee": "120.00",
            }).encode("utf-8")
            pth2_sig = hmac.new(pth_wh_sec.encode("utf-8"), pth2_body, hashlib.sha256).hexdigest()
            client.post(
                "/couriers/webhook/pathao",
                content=pth2_body,
                headers={"Content-Type": "application/json", "X-PATHAO-Signature": pth2_sig},
            ).raise_for_status()

            # Create 1 settled COD remittance for s_stdf_1, leaving s_stdf_2 & s_pth_2 in unsettled queue
            client.post(
                "/couriers/settlements",
                headers=headers,
                json={
                    "provider": "steadfast",
                    "settlement_number": f"STL-U9-{uuid.uuid4().hex[:4].upper()}",
                    "shipment_ids": [s_stdf_1["id"]],
                    "reference_number": "BKASH-TXN-88412",
                    "bank_account": "BRAC Bank ****3910",
                    "notes": "Verified COD remittance batch",
                },
            ).raise_for_status()

        # Launch Playwright Headless Browser to verify live UI & capture screenshots
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=CHROME_PATH,
                headless=True,
                args=["--disable-gpu", "--no-sandbox"],
            )
            context = browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=1.5,
            )
            page = context.new_page()
            page.set_default_timeout(45000)

            # Inject auth tokens into localStorage
            page.goto("http://127.0.0.1:3000/login", wait_until="domcontentloaded")
            page.evaluate(
                """([tok, usr, tid]) => {
                    localStorage.setItem("profitpulse_token", tok);
                    localStorage.setItem("profitpulse_user", JSON.stringify(usr));
                    localStorage.setItem("profitpulse_tenant_id", tid);
                }""",
                [token, user_obj, tenant_id],
            )

            try:
                # 1. /couriers Dashboard
                page.goto("http://127.0.0.1:3000/couriers", wait_until="networkidle")
                page.wait_for_selector("text=Courier Tracking & COD Intelligence", timeout=45000)
                page.wait_for_selector(f"text={s_pth_1['consignment_id']}", timeout=45000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(SCREENSHOTS_DIR / "01_unit9_couriers_dashboard.png"), full_page=False)
                print("Saved 01_unit9_couriers_dashboard.png")

                # 2. Tracking Timeline Drawer (click Pathao In-Transit shipment row)
                page.locator(f"text={s_pth_1['consignment_id']}").first.click()
                page.wait_for_selector("text=Booked", timeout=30000)
                page.wait_for_selector("text=In Transit", timeout=30000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(SCREENSHOTS_DIR / "02_unit9_tracking_drawer.png"), full_page=False)
                print("Saved 02_unit9_tracking_drawer.png")

                # 3. Orders Page -> DispatchOrderModal (Pathao + Fraud Check + Price Calculator)
                page.goto("http://127.0.0.1:3000/orders", wait_until="networkidle")
                page.wait_for_selector(f"text={o_ready['order_number']}", timeout=45000)
                row = page.locator("tr", has_text=o_ready["order_number"]).first
                row.locator("button:has-text('Send Courier')").click()
                page.wait_for_selector(f"text=Dispatch Order #{o_ready['order_number']}", timeout=30000)
                # Switch to Pathao tab to show cascading City -> Zone -> Area & Delivery Price Estimate
                page.locator("button:has-text('Pathao')").first.click()
                page.wait_for_selector("text=Est. Fee:", timeout=45000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(SCREENSHOTS_DIR / "03_unit9_orders_dispatch_modal.png"), full_page=False)
                print("Saved 03_unit9_orders_dispatch_modal.png")

                # 4. COD Settlements Page
                page.goto("http://127.0.0.1:3000/couriers/settlements", wait_until="networkidle")
                page.wait_for_selector("text=COD Settlement & Cash Reconciliation", timeout=45000)
                page.wait_for_selector("text=STL-U9-", timeout=45000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(SCREENSHOTS_DIR / "04_unit9_settlements.png"), full_page=True)
                print("Saved 04_unit9_settlements.png")

                # 5. Courier Analytics Page
                page.goto("http://127.0.0.1:3000/couriers/analytics", wait_until="networkidle")
                page.wait_for_selector("text=Courier Performance & Cost Analytics", timeout=45000)
                page.wait_for_selector("text=parcels", timeout=45000)
                page.wait_for_timeout(500)
                page.screenshot(path=str(SCREENSHOTS_DIR / "05_unit9_analytics.png"), full_page=True)
                print("Saved 05_unit9_analytics.png")

                # 6. Dedicated Courier Settings Page + Check Steadfast Balance
                page.goto("http://127.0.0.1:3000/settings/couriers", wait_until="networkidle")
                page.wait_for_selector("text=Courier API & Webhook Settings", timeout=45000)
                page.locator("button:has-text('Check Balance')").click()
                page.wait_for_selector("text=mode", timeout=45000)
                page.wait_for_timeout(1000)
                page.screenshot(path=str(SCREENSHOTS_DIR / "06_unit9_courier_settings.png"), full_page=True)
                print("Saved 06_unit9_courier_settings.png")
            except Exception:
                try:
                    page.screenshot(path=str(SCREENSHOTS_DIR / "_debug_fail.png"), full_page=True)
                except Exception:
                    pass
                log_p = ROOT_DIR / "product_docs" / "_u9_backend.log"
                if log_p.exists():
                    lines = log_p.read_text(encoding="utf-8", errors="replace").splitlines()
                    print("BACKEND LOG TAIL:\n" + "\n".join(lines[-40:]))
                raise
            finally:
                browser.close()

    finally:
        # Clean up synthetic UI verification data if API still up
        try:
            if token and tenant_id:
                hdrs = {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_id}
                with httpx.Client(base_url=api_base, timeout=15.0) as c:
                    for oid in created_orders:
                        c.delete(f"/orders/{oid}", headers=hdrs)
        except Exception:
            pass
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except Exception:
            backend_proc.kill()
        try:
            frontend_proc.wait(timeout=5)
        except Exception:
            frontend_proc.kill()
        backend_log.close()
        frontend_log.close()
        for p_log in [ROOT_DIR / "product_docs" / "_u9_backend.log", ROOT_DIR / "product_docs" / "_u9_frontend.log"]:
            try:
                p_log.unlink()
            except Exception:
                pass


if __name__ == "__main__":
    main()
