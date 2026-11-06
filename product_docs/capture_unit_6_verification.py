import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def main():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
    python_exe = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    print("Launching FastAPI backend on port 8007...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--port", "8007", "--host", "127.0.0.1"],
        cwd=backend_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        import httpx
        ready = False
        for _ in range(40):
            try:
                r = httpx.get("http://127.0.0.1:8007/api/v1/openapi.json", timeout=2.0)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.5)

        if not ready:
            print("Failed to reach FastAPI on port 8007!")
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

            # 1. Capture Finance & P&L Endpoints in Swagger
            print("Capturing 01_unit6_finance_endpoints.png...")
            page.goto("http://127.0.0.1:8007/api/v1/docs", wait_until="networkidle")
            page.wait_for_selector(".swagger-ui", timeout=15000)
            time.sleep(1.5)

            fin_tag = page.locator("#operations-tag-Profit___Loss__P_L__Engine___Finance")
            if fin_tag.count() > 0:
                fin_tag.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_unit6_finance_endpoints.png"), full_page=False)

            # 2. Capture P&L Summary Waterfall Endpoint Expanded
            print("Capturing 02_unit6_pnl_summary.png...")
            pnl_btn = page.locator("#operations-Profit___Loss__P_L__Engine___Finance-get_pnl_summary_api_v1_finance_pnl_summary_get")
            if pnl_btn.count() > 0:
                pnl_btn.click()
                time.sleep(0.8)
                pnl_btn.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_unit6_pnl_summary.png"), full_page=False)

            # 3. Capture Break-Even Analysis Endpoint Expanded
            print("Capturing 03_unit6_expenses_crud.png...")
            be_btn = page.locator("#operations-Profit___Loss__P_L__Engine___Finance-get_breakeven_analysis_api_v1_finance_pnl_breakeven_get")
            if be_btn.count() > 0:
                be_btn.click()
                time.sleep(0.8)
                be_btn.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_unit6_expenses_crud.png"), full_page=False)

            browser.close()
            print("Unit 6 verification screenshots captured successfully!")

    finally:
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()

if __name__ == "__main__":
    main()

