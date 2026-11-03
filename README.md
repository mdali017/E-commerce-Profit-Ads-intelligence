# 🚀 E-commerce Profit & Ads Intelligence SaaS

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=flat&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20Postgres-4169E1?style=flat&logo=postgresql)](https://neon.tech)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

A comprehensive multi-tenant **E-commerce & F-commerce Profit & Ads Intelligence Platform** designed to solve the data fragmentation problem. It connects **Meta Ads**, **WooCommerce / Manual Orders**, **Local Couriers (Steadfast, Pathao, RedX)**, and an intelligent **P&L Financial Engine** to calculate **True Net Profit** based on actual delivered COD cash rather than claimed numbers.

---

## 🌟 Key Capabilities

1. **Single Source of Truth:** Unifies ad spend, orders, courier status, and overhead expenses in one real-time dashboard.
2. **Meta Ads vs Actual Delivered ROAS:** Direct comparison between Meta-claimed purchase conversions and actual cash collected post-delivery.
3. **End-to-End Funnel Attribution:** Tracks order sources using UTM parameters and `fbclid` confidence scoring.
4. **Automated Courier Reconciliation:** Syncs with Steadfast, Pathao, and RedX for automated delivery tracking, return rate monitoring, and COD settlements.
5. **Accurate P&L Engine:** Calculates true net profit deducting COGS (Cost of Goods Sold), courier shipping fees, return losses, ad spend, and operating overheads.
6. **Customer CRM & Post-Delivery Automation:** Retains delivered customers with automated review requests and repeat purchase reminders.

---

## 🛠️ Architecture & Tech Stack

- **Backend:** **FastAPI (Python 3.11+)**
  - Modular Monolith architecture organized by domain/feature
  - Asynchronous SQLAlchemy 2.0 with connection pooling (`asyncpg`)
  - Pydantic v2 data validation & settings
  - JWT Authentication & Role-Based Access Control (RBAC)
  - Interactive Swagger docs at `/api/v1/docs`
- **Frontend:** **Next.js 15 (TypeScript)**
  - App Router architecture with route groups
  - Tailwind CSS + Lucide Icons
  - Type-safe API client and responsive layout
- **Database:** **Neon Serverless PostgreSQL**
  - Multi-tenant tenant-level data isolation
- **Task Queue & Cache:** Redis + Celery / ARQ (Background polling & webhooks)

---

## 📁 Repository Structure

```
├── backend/                  # FastAPI Application (Modular Architecture)
│   ├── app/
│   │   ├── core/             # Config, Database engine, Security & Auth dependencies
│   │   ├── common/           # Shared models & tenant mixins
│   │   ├── modules/          # Domain-driven feature modules
│   │   │   ├── auth/         # Authentication & User Management
│   │   │   ├── workspaces/   # Multi-tenant Workspaces & Roles
│   │   │   ├── products/     # Products & COGS History
│   │   │   ├── orders/       # Order Ingestion (WooCommerce & Manual)
│   │   │   ├── couriers/     # Courier Integrations (Steadfast, Pathao, RedX)
│   │   │   ├── ads/          # Meta Marketing API Connector
│   │   │   ├── finance/      # P&L Calculation Engine
│   │   │   ├── crm/          # Customer CRM & SMS Automation
│   │   │   └── analytics/    # Executive Dashboard & AI Insights
│   │   └── main.py           # Application entrypoint & CORS
│   ├── requirements.txt      # Python dependencies
│   ├── test_server.py        # Integration test suite
│   └── .env.example          # Environment variables template
│
├── frontend/                 # Next.js 15 Dashboard
│   ├── src/
│   │   ├── app/              # App Router Pages ((dashboard), (auth))
│   │   ├── components/       # Layout & shared UI components
│   │   ├── lib/              # API client and utilities
│   │   ├── types/            # TypeScript interfaces
│   │   └── constants/        # Navigation & route definitions
│   ├── package.json
│   └── tsconfig.json
│
├── product_docs/             # PRD & Day-by-Day Implementation Roadmap
│   ├── PRD E-commerce Profit & Ads Intelligence SaaS.md
│   └── PROJECT_EXECUTION_PLAN.md
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Neon PostgreSQL connection string (or local SQLite for dev)

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at `http://localhost:8000/api/v1/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run Next.js development server
npm run dev
```
Open `http://localhost:3000` to view the dashboard.

---

## 📄 Implementation Status & Roadmap

The development follows an 8-Unit roadmap detailed in [`product_docs/PROJECT_EXECUTION_PLAN.md`](./product_docs/PROJECT_EXECUTION_PLAN.md).

- [x] **Unit 1: Core Foundation & Multi-Tenancy** (100% Complete: Auth, Multi-Tenancy, RBAC & UI Shell)
- [ ] **Unit 2: Product Catalog & COGS Engine**
- [ ] **Unit 3: Order Engine & WooCommerce Ingestion**
- [ ] **Unit 4: Courier Integration & Delivery Tracking**
- [ ] **Unit 5: Meta Ads Integration & Attribution Engine**
- [ ] **Unit 6: Profit & Loss (P&L) Financial Engine**
- [ ] **Unit 7: Customer CRM & SMS Automation**
- [ ] **Unit 8: Executive Dashboard & AI Insights**

