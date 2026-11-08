import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def main():
    print("Launching FastAPI backend on port 8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "127.0.0.1"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    print("Launching Next.js frontend on port 3000...")
    frontend_proc = subprocess.Popen(
        ["cmd", "/c", "npm", "--prefix", "frontend", "start", "--", "-p", "3000"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        import httpx
        ready_backend = False
        for _ in range(30):
            try:
                r = httpx.get("http://127.0.0.1:8000/api/v1/openapi.json", timeout=2.0)
                if r.status_code == 200:
                    ready_backend = True
                    break
            except Exception:
                time.sleep(0.5)

        ready_frontend = False
        for _ in range(40):
            try:
                r = httpx.get("http://127.0.0.1:3000", timeout=2.0)
                if r.status_code in (200, 307, 308):
                    ready_frontend = True
                    break
            except Exception:
                time.sleep(0.5)

        if not ready_backend or not ready_frontend:
            print(f"Server check failed: backend={ready_backend}, frontend={ready_frontend}")
            return

        print("Servers ready. Starting Playwright...")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=CHROME_PATH,
                headless=True,
                args=["--no-sandbox", "--disable-gpu"],
            )
            context = browser.new_context(viewport={"width": 1440, "height": 960})
            page = context.new_page()

            # 1. Signup / Login
            page.goto("http://127.0.0.1:3000/signup", wait_until="networkidle")
            time.sleep(1)
            unique_email = f"store_tester_{int(time.time())}@example.com"
            page.fill("#fullName", "Store Integration Tester")
            page.fill("#email", unique_email)
            page.fill("#phoneNumber", "01711223344")
            page.fill("#password", "Password123!")
            page.click("button[type='submit']")

            # Wait for dashboard navigation
            page.wait_for_url("**/overview", timeout=15000)
            time.sleep(1.5)

            # Navigate to /orders
            print("Navigating to /orders page...")
            page.goto("http://127.0.0.1:3000/orders", wait_until="networkidle")
            time.sleep(1.5)

            # Click "Connect Store / Webhook"
            print("Opening Store Connection Modal...")
            page.click("button:has-text('Connect Store / Webhook')")
            time.sleep(1)

            # Capture WooCommerce tab
            print("Capturing 01_store_modal_woocommerce.png...")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_store_modal_woocommerce.png"))

            # 3. Click "Custom Code" tab
            print("Clicking Custom Code tab...")
            page.click("button:has-text('Custom Code')")
            time.sleep(0.8)
            print("Capturing 02_store_modal_custom_code.png...")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_store_modal_custom_code.png"))

            # 4. Click "Send Sample Custom Test Order"
            print("Sending 1-Click Test Order for Custom Website...")
            page.click("button:has-text('Send Sample CUSTOM Test Order')")
            time.sleep(3)

            print("Capturing 03_store_modal_test_order_success.png...")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_store_modal_test_order_success.png"))

            # Close modal and verify Orders list
            page.click("button:has-text('Done')")
            time.sleep(2)
            print("Capturing 04_orders_list_after_test_order.png...")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "04_orders_list_after_test_order.png"))

            browser.close()
            print("All screenshots captured successfully!")

    finally:
        print("Terminating servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            pass

if __name__ == "__main__":
    main()
