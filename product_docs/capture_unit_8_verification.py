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

    print("Launching FastAPI backend on port 8009...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--port", "8009", "--host", "127.0.0.1"],
        cwd=backend_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        import httpx
        ready = False
        for _ in range(40):
            try:
                r = httpx.get("http://127.0.0.1:8009/api/v1/openapi.json", timeout=2.0)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.5)

        if not ready:
            print("Failed to reach FastAPI on port 8009!")
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

            # 1. Capture Executive Dashboard & AI Insights Endpoints in Swagger
            print("Capturing 01_unit8_analytics_endpoints.png...")
            page.goto("http://127.0.0.1:8009/api/v1/docs", wait_until="networkidle")
            page.wait_for_selector(".swagger-ui", timeout=15000)
            time.sleep(1.5)

            ana_tag = page.locator("#operations-tag-Executive_Dashboard___AI_Insights")
            if ana_tag.count() > 0:
                ana_tag.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_unit8_analytics_endpoints.png"), full_page=False)

            # 2. Capture Executive Overview & Correlated KPIs Endpoint Expanded
            print("Capturing 02_unit8_executive_overview.png...")
            over_btn = page.locator("#operations-Executive_Dashboard___AI_Insights-get_executive_overview_api_v1_analytics_overview_get")
            if over_btn.count() > 0:
                over_btn.click()
                time.sleep(0.8)
                over_btn.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_unit8_executive_overview.png"), full_page=False)

            # 3. Capture AI Business Analyst Briefing Endpoint Expanded
            print("Capturing 03_unit8_ai_briefing.png...")
            ai_btn = page.locator("#operations-Executive_Dashboard___AI_Insights-generate_ai_briefing_api_v1_analytics_ai_briefing_post")
            if ai_btn.count() > 0:
                ai_btn.click()
                time.sleep(0.8)
                ai_btn.scroll_into_view_if_needed()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_unit8_ai_briefing.png"), full_page=False)

            browser.close()
            print("All Unit 8 verification screenshots captured successfully!")

    finally:
        print("Terminating backend process...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except Exception:
            backend_proc.kill()

if __name__ == "__main__":
    main()

