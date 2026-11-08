import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def main():
    print("Launching FastAPI backend on port 8008...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8008", "--host", "127.0.0.1"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        import httpx
        ready = False
        for _ in range(40):
            try:
                r = httpx.get("http://127.0.0.1:8008/api/v1/openapi.json", timeout=2.0)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.5)

        if not ready:
            print("Failed to reach FastAPI on port 8008!")
            return

        print("Backend ready. Starting Playwright...")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=CHROME_PATH,
                headless=True,
                args=["--no-sandbox", "--disable-gpu"],
            )
            context = browser.new_context(viewport={"width": 1440, "height": 960})
            page = context.new_page()

            # 1. Capture Swagger Docs Overview with all Webhook Endpoints
            print("Capturing store_connectors_swagger.png...")
            page.goto("http://127.0.0.1:8008/api/v1/docs", wait_until="networkidle")
            page.wait_for_selector(".swagger-ui", timeout=15000)
            time.sleep(1.5)

            orders_tag = page.locator("#operations-tag-Orders___Ingestion")
            if orders_tag.count() > 0:
                orders_tag.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "store_connectors_swagger.png"), full_page=False)

            # 2. Expand Custom Webhook endpoint
            custom_op = page.locator("#operations-Orders___Ingestion-custom_store_webhook_api_v1_orders_webhook_custom_post")
            if custom_op.count() > 0:
                custom_op.click()
                time.sleep(0.8)
                custom_op.scroll_into_view_if_needed()
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, "store_connector_custom_webhook_expanded.png"), full_page=False)

            browser.close()
            print("Screenshots captured successfully!")

    finally:
        print("Terminating backend process...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except Exception:
            backend_proc.kill()

if __name__ == "__main__":
    main()

