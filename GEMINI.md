# E-commerce Profit & Ads Intelligence — Developer Rules & Guidelines

## 📌 Git Commit Message Standards
- **Tone & Style:** All Git commit messages must strictly sound like a real, experienced human developer — natural, direct, concise, and to the point.
- **Forbidden:** Never use artificial, robotic, or AI-generated conventional boilerplate (e.g. `feat(unit-1): complete multi-tenant auth, RBAC permissions...`).
- **Standard Format:**
  - Lowercase or natural sentence case.
  - Imperative mood (e.g., `implement ...`, `add ...`, `fix ...`, `setup ...`).
  - Directly describe the primary features or fixes without unnecessary fluff.
  - Examples:
    - `implement workspace member management, RBAC and auth pages`
    - `add login/signup flow, workspace switcher and member permissions`
    - `fix tailwind css build and update dev server config`
    - `add product cost models and cogs tracking api`

## 📌 Unit Completion & Verification Test Report Standard
- **Automatic Execution:** Every time a development Unit (or major checkpoint) is completed, automatically perform live browser/API verification and capture screenshots.
- **Location:** Save all screenshots in `product_docs/screenshots/` and write the test report to `product_docs/unit_<N>_test_report.md`.
- **Required Report Structure:**
  - Executive summary and status.
  - Test cases structured strictly with:
    - `issue:` (None/Passed or specific issue title)
    - `screenshot:` (Markdown link or embedded image)
    - `description:` (Action taken / endpoint or UI tested)
    - `expected:` (Expected result)
  - Live data log & potential edge cases verified (idempotency, calculations, audit history).


