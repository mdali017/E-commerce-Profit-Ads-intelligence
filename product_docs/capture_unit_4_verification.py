import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def main():
    print("Launching FastAPI backend on port 8005...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8005", "--host", "127.0.0.1"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        import httpx
        ready = False
        for _ in range(30):
            try:
                r = httpx.get("http://127.0.0.1:8005/api/v1/openapi.json", timeout=2.0)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.5)

        if not ready:
            print("Failed to reach FastAPI on port 8005!")
            return

        print("Backend ready. Starting Playwright headless Chrome...")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=CHROME_PATH,
                headless=True,
                args=["--no-sandbox", "--disable-gpu"],
            )
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            # 1. Capture Courier API Endpoints in Swagger
            print("Capturing 01_unit4_courier_endpoints.png...")
            page.goto("http://127.0.0.1:8005/api/v1/docs", wait_until="networkidle")
            page.wait_for_selector(".swagger-ui", timeout=15000)
            time.sleep(1.5)

            courier_tag = page.locator("#operations-tag-Courier_Integration___Operations")
            if courier_tag.count() > 0:
                courier_tag.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_unit4_courier_endpoints.png"), full_page=False)

            # 2. Capture Dispatch endpoint expanded
            print("Capturing 02_unit4_dispatch_endpoint.png...")
            dispatch_btn = page.locator("#operations-Courier_Integration___Operations-dispatch_order_api_v1_couriers_dispatch_post")
            if dispatch_btn.count() > 0:
                dispatch_btn.click()
                time.sleep(0.8)
                dispatch_btn.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_unit4_dispatch_endpoint.png"), full_page=False)

            # 3. Capture Courier Webhooks expanded
            print("Capturing 03_unit4_courier_webhooks.png...")
            stdf_btn = page.locator("#operations-Courier_Integration___Operations-steadfast_webhook_api_v1_couriers_webhook_steadfast_post")
            if stdf_btn.count() > 0:
                stdf_btn.click()
                time.sleep(0.8)
                stdf_btn.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_unit4_courier_webhooks.png"), full_page=False)

            browser.close()
            print("Unit 4 verification screenshots captured successfully!")

    finally:
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()

if __name__ == "__main__":
    main()

