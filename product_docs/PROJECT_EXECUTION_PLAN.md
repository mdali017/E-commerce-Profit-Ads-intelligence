# 🚀 E-commerce Profit & Ads Intelligence SaaS
## 📋 Master Implementation Plan & Daily Progress Tracker

> **প্রজেক্টের উদ্দেশ্য:** Ads (Meta) থেকে শুরু করে Website/F-Commerce Orders, Courier Delivery এবং ব্যালেন্স শিট P&L (আসল নিট লাভ/ক্ষতি) পর্যন্ত সমস্ত ডেটা এক জায়গায় এনে E-commerce উদ্যোক্তাদের জন্য একটি স্বয়ংক্রিয় Single Source of Truth তৈরি করা।

---

### 🛠️ নির্ধারিত প্রযুক্তি স্ট্যাক (Selected Tech Stack)

- **Backend:** **FastAPI (Python 3.11+)**
  - ORM: SQLAlchemy 2.0 (Async) + Alembic
  - Data Validation: Pydantic v2
  - Auth: JWT + Passlib (bcrypt)
  - Interactive API Docs: `/docs` (Swagger)
- **Frontend:** **Next.js 15 (TypeScript)**
  - UI Library: Tailwind CSS + Shadcn UI + Radix UI
  - Charts: Recharts / ECharts
  - State & Data Fetching: TanStack React Query + Axios
- **Database:** **Neon DB (Serverless PostgreSQL Free Tier)**
  - Driver: `asyncpg` + Built-in PgBouncer Connection Pooling
  - Multi-tenancy: Workspace/Tenant-based row level isolation
- **Task Queue & Cache:** Redis + ARQ / Celery (Background polling & webhooks)
- **AI Engine:** Anthropic Claude / Google Gemini API + Custom Rule Engine

---

## 📁 প্রস্তাবিত প্রোজেক্ট ফোল্ডার স্ট্রাকচার

```
E-commerce Profit & Ads intelligence/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API Endpoints (v1)
│   │   │   ├── auth.py
│   │   │   ├── workspaces.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── couriers.py
│   │   │   ├── ads.py
│   │   │   ├── analytics.py
│   │   │   ├── crm.py
│   │   │   └── automations.py
│   │   ├── core/             # Config, Security, DB session
│   │   ├── models/           # SQLAlchemy Data Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # Business Logic & External Connectors
│   │   │   ├── meta_connector.py
│   │   │   ├── woocommerce_connector.py
│   │   │   ├── courier_steadfast.py
│   │   │   ├── courier_pathao.py
│   │   │   ├── profit_engine.py
│   │   │   └── sms_gateway.py
│   │   └── workers/          # Background Jobs & Polling
│   ├── alembic/              # DB Migrations
│   ├── requirements.txt
│   └── main.py
│
├── frontend/                 # Next.js 15 Dashboard
│   ├── src/
│   │   ├── app/              # App Router Pages
│   │   │   ├── (auth)/       # Login, Register
│   │   │   ├── (dashboard)/  # Main App Shell
│   │   │   │   ├── overview/
│   │   │   │   ├── ads/
│   │   │   │   ├── orders/
│   │   │   │   ├── couriers/
│   │   │   │   ├── products/
│   │   │   │   ├── pnl/
│   │   │   │   ├── crm/
│   │   │   │   └── settings/
│   │   ├── components/       # UI Components & Charts
│   │   ├── lib/              # API Client & Helpers
│   │   └── types/            # TypeScript Interfaces
│   └── package.json
│
├── docs/                     # API & Integration Documentation
└── PROJECT_EXECUTION_PLAN.md # এই মাস্টার ট্র্যাকার ফাইল
```

---

## 📅 দিনভিত্তিক ও ইউনিটভিত্তিক কর্মপরিকল্পনা (Day-by-Day Implementation)

---

### 🟢 Unit 1: Core Foundation & Multi-Tenancy (দিন ১ – ৫)
> **ফলাফল:** ইউজার রেজিস্ট্রেশন, লগইন, মাল্টি-টেন্যান্ট ওয়ার্কস্পেস সুইচিং এবং এপিআই আর্কিটেকচার পুরোপুরি প্রস্তুত হওয়া।

- [x] **Day 1: Project Skeleton & Database Connection**
  - [x] `backend` (FastAPI) ও `frontend` (Next.js) ইনিশিয়ালাইজেশন।
  - [x] Neon DB PostgreSQL ডাটাবেস সংযোগ কনফিগারেশন (`pool_pre_ping=True`)।
  - [x] এনভায়রনমেন্ট ভ্যারিয়েবল ফাইল (`.env` ও `.env.example`) সাজানো এবং ইন্টিগ্রেশন টেস্ট সম্পন্ন।
- [x] **Day 2: Multi-tenant Data Models & Auth System**
  - [x] ডাটাবেস মডেল তৈরি: `User`, `Tenant (Workspace)`, `Membership`, `Role`।
  - [x] সিকিউর পাসওয়ার্ড হ্যাশিং, JWT টোকেন জেনারেশন এবং Auth API (`/api/v1/auth/signup`, `/login`, `/me`)।
  - [x] Role-Based Access Control (RBAC): Owner, Admin, Marketer, Operator, Accountant।
- [x] **Day 3: Workspace Management & Switching API**
  - [x] ওয়ার্কস্পেস তৈরি, সদস্য ইনভাইটেশন এবং অ্যাক্টিভ ওয়ার্কস্পেস সুইচার এন্ডপয়েন্ট।
  - [x] প্রতিটি এপিআই রিকোয়েস্টে `tenant_id` ভ্যালিডেশন ডিপেন্ডেন্সি (`get_current_tenant`)।
- [x] **Day 4: Next.js Frontend Shell & Auth UI**
  - [x] Tailwind CSS + Shadcn UI ইনস্টলেশন ও সেটআপ।
  - [x] লগইন ও সাইনআপ পেজ ডেভেলপমেন্ট এবং টোকেন স্টোরেজ ম্যানেজমেন্ট।
  - [x] রেসপনসিভ ড্যাশবোর্ড সাইডবার, হেডার এবং ওয়ার্কস্পেস সুইচার ড্রপডাউন।
- [x] **Day 5: 🔍 Unit 1 Review & Checkpoint**
  - [x] **চেকলিস্ট:** ইউজার সাইনআপ, লগইন, নতুন ওয়ার্কস্পেস তৈরি ও সুইচিং, এবং Swagger UI (`/docs`) টেস্ট করা।

---

### 🟢 Unit 2: Product Catalog & Cost Management (COGS) (দিন ৬ – ৮)
> **ফলাফল:** পণ্যের ক্রয়মূল্য (Cost Price) ও মার্জিন ট্র্যাকিং যা সঠিক নিট প্রফিট হিসাবের মূল ভিত্তি।

- [x] **Day 6: Product Schema & CRUD API**
  - [x] মডেল তৈরি: `Product`, `ProductVariant`, `ProductCostHistory`।
  - [x] প্রোডাক্ট যোগ, এডিট, ভ্যারিয়েন্ট কনফিগারেশন এবং তারিখভিত্তিক ক্রয়মূল্য পরিবর্তনের হিস্ট্রি এপিআই।
- [x] **Day 7: Product Management UI & CSV Bulk Upload**
  - [x] প্রোডাক্ট তালিকা, ফিল্টারিং এবং নতুন প্রোডাক্ট যোগ করার মডাল/ফর্ম।
  - [x] এক ক্লিকে শত শত প্রোডাক্টের ক্রয়মূল্য আপডেট করতে Excel/CSV বাল্ক আপলোড ফিচার।
  - [x] কস্ট কভারেজ রেট সূচক (কত শতাংশ অর্ডারে ক্রয়মূল্য সংযুক্ত আছে)।
- [x] **Day 8: 🔍 Unit 2 Review & Checkpoint**
  - [x] **চেকলিস্ট:** প্রোডাক্ট যোগ করা, ভ্যারিয়েন্ট তৈরি, CSV দিয়ে বাল্ক কস্ট আপডেট এবং কস্ট হিস্ট্রি যাচাই।

---

### 🟢 Unit 3: Order Engine & Ingestion System (দিন ৯ – ১৪)
> **ফলাফল:** ওয়েবসাইট (WooCommerce) ও ফেসবুক মেসেঞ্জারের অর্ডার একক জায়গায় প্রসেসিং ও কনফার্মেশন।

- [x] **Day 9: Canonical Order Data Models**
  - [x] মডেল তৈরি: `Order`, `OrderItem`, `OrderStatusHistory`, `OrderAttribution`।
  - [x] স্ট্যান্ডার্ড অর্ডার স্ট্যাটাস সাইকেল: `Pending` ➔ `Confirmed` ➔ `In Courier` ➔ `Delivered` / `Cancelled` / `Returned`।
- [x] **Day 10: F-Commerce Manual Order Entry Form**
  - [x] ফেসবুক ও ফোন কলের অর্ডারের জন্য সুপার-ফাস্ট ম্যানুয়াল অর্ডার এন্ট্রি ফর্ম।
  - [x] কাস্টমার ইনফো অটো-সাজেস্ট এবং প্রোডাক্ট সিলেক্ট করলে অটোমেটিক প্রাইজ ও ডেলিভারি ফি ক্যালকুলেশন।
- [x] **Day 11: WooCommerce Integration Connector**
  - [x] WooCommerce REST API ক্লায়েন্ট (অর্ডার ফেচ ও ব্যাকগ্রাউন্ড পোলিং)।
  - [x] WooCommerce Webhook হ্যান্ডলার (নতুন অর্ডার পড়ার সাথে সাথে ডাটাবেসে রিয়েলটাইম ইনজেস্ট হওয়া)।
  - [x] ডুপ্লিকেট এন্ট্রি প্রতিরোধে আইডেমপোটেন্ট হ্যাশিং।
- [x] **Day 12: Order Operations & Confirmation Pipeline**
  - [x] অর্ডার ম্যানেজমেন্ট ড্যাশবোর্ড UI: স্ট্যাটাস ট্যাব, সার্চ, ফিল্টারিং ও বাল্ক অ্যাকশন।
  - [x] ফোন কনফার্মেশন কলিং চেকলিস্ট ও এক ক্লিকে স্ট্যাটাস আপডেট।
- [x] **Day 13: Background Order Sync Queue**
  - [x] ব্যাকগ্রাউন্ড সিঙ্ক জব সেটআপ (অর্ডারের ফেইল্ড সিঙ্ক রিট্রাই ও ডাটা ম্যাচিং)।
- [x] **Day 14: 🔍 Unit 3 Review & Checkpoint**
  - [x] **চেকলিস্ট:** ম্যানুয়াল অর্ডার এন্ট্রি, WooCommerce সিঙ্ক টেস্ট, ফিল্টারিং এবং স্ট্যাটাস পরিবর্তন যাচাই।

---

### 🟢 Unit 4: Courier Integration & Delivery Tracking (দিন ১৫ – ১৯)
> **ফলাফল:** Steadfast, Pathao ও RedX-এর সাথে ডেলিভারি ট্র্যাকিং এবং ক্যাশ অন ডেলিভারি (COD) টাকা মেলানো।

- [x] **Day 15: Courier Connector Interface & Steadfast Integration**
  - [x] প্লাগেবল কুরিয়ার ইন্টারফেস ডিজাইন।
  - [x] Steadfast Courier API: কনসাইনমেন্ট বুকিং ও ট্র্যাকিং স্ট্যাটাস রিড।
- [x] **Day 16: Pathao Courier & RedX Connectors**
  - [x] Pathao API ক্লায়েন্ট (অর্ডার বুকিং ও স্ট্যাটাস আপডেট)।
  - [x] RedX কানেক্টর ও স্ট্যাটাস ম্যাপিং।
- [x] **Day 17: Unified Delivery Normalizer & Polling Worker**
  - [x] সব কুরিয়ারের স্ট্যাটাসকে ইউনিভার্সাল প্ল্যাটফর্ম স্ট্যাটাসে রূপান্তর (`Delivered`, `Returned`, `Lost`)।
  - [x] প্রতি ৩০ মিনিটে ব্যাকগ্রাউন্ড ট্র্যাকিং জব রান করানো।
- [x] **Day 18: Courier Payment & COD Settlement Reconciliation**
  - [x] কুরিয়ার থেকে প্রাপ্ত COD পেমেন্ট স্টেটমেন্ট ও ইনভয়েস এন্ট্রি।
  - [x] কোন অর্ডারের টাকা এসেছে আর কোন টাকা বকেয়া—তার স্পষ্ট রিপোর্ট।
- [x] **Day 19: 🔍 Unit 4 Review & Checkpoint**
  - [x] **চেকলিস্ট:** ড্যাশবোর্ড থেকে কুরিয়ার বুকিং, লাইভ ট্র্যাকিং স্ট্যাটাস আপডেট এবং COD রিকনসিলিয়েশন টেস্ট।


---

### 🟢 Unit 5: Meta Ads Integration & Attribution Engine (দিন ২০ – ২৫)
> **ফলাফল:** ফেসবুক অ্যাড খরচ আনা এবং "Ad Spend vs Actual Delivered Revenue" মেলানো।

- [x] **Day 20: Meta Marketing API Connector**
  - [x] Meta API ক্লায়েন্ট ও টোকেন ম্যানেজমেন্ট।
  - [x] Ad Accounts লিস্ট দেখা ও নির্দিষ্ট অ্যাকাউন্ট সিলেক্ট করা।
- [x] **Day 21: Meta Insights Data Pipeline**
  - [x] Campaign, Ad Set, Ad লেভেলে দৈনিক Spend, Impressions, Clicks এবং Meta Claimed Purchases সিঙ্ক।
  - [x] টাইমজোন হ্যান্ডলিং (UTC ➔ BDT)।
- [x] **Day 22: Ads Performance Dashboard UI**
  - [x] ক্যাম্পেইনভিত্তিক স্পেন্ড, Reported ROAS, Reported CPA-এর টেবিল ও গ্রাফিকাল ভিউ।
- [x] **Day 23: Attribution Engine (UTM & Click Matching)**
  - [x] অর্ডারের সাথে UTM Parameter (`utm_campaign`) ও `fbclid` ম্যাচিং।
  - [x] ফানেল কনফিডেন্স স্কোরিং (High / Medium / Unknown)।
- [x] **Day 24: Claimed ROAS vs Actual Delivered ROAS Comparison**
  - [x] মেটা ড্যাশবোর্ডে দেখানো রেজাল্ট বনাম **আসলে কত টাকার পণ্য ডেলিভারি ও কালেকশন হলো** তার পাশাপাশি তুলনা।
- [x] **Day 25: 🔍 Unit 5 Review & Checkpoint**
  - [x] **চেকলিস্ট:** মেটা অ্যাড ডেটা সিঙ্ক, ক্যাম্পেইন থেকে অর্ডার অ্যাট্রিবিউশন এবং Actual ROAS ক্যালকুলেশন টেস্ট।

---

### 🟢 Unit 6: Profit & Loss (P&L) Engine & Finance (দিন ২৬ – ৩০)
> **ফলাফল:** পণ্যের খরচ, কুরিয়ার চার্জ, রিটার্ন ক্ষতি ও অ্যাড খরচ সমন্বয় করে নির্ভুল নিট লাভ/ক্ষতি নির্ধারণ।

- [x] **Day 26: P&L Mathematical Engine**
  - [x] নিট লাভ ক্যালকুলেশন লজিক:
    $$\text{Net Profit} = \text{Delivered Revenue} - \text{COGS} - \text{Courier Charge} - \text{Return Cost} - \text{Ad Spend} - \text{Operating Expenses}$$
- [x] **Day 27: Operating Expense Management**
  - [x] অফিস ভাড়া, বেতন, প্যাকেজিং ইত্যাদি ফিক্সড ও ভেরিয়েবল খরচ এন্ট্রি মডিউল।
- [x] **Day 28: Interactive Financial Dashboard**
  - [x] দৈনিক, সাপ্তাহিক ও মাসিক লাভ-ক্ষতির সামারি ও ট্রেন্ড চার্ট।
  - [x] ব্রেক-ইভেন ROAS ক্যালকুলেটর (Break-even Benchmark)।
- [x] **Day 29: Product-wise & Campaign-wise Profit Breakdown**
  - [x] কোন প্রোডাক্ট বা ক্যাম্পেইন আসলে মুনাফা দিচ্ছে এবং কোনটিতে লোকসান হচ্ছে তার ড্যাশবোর্ড ভিউ।
  - [x] এক ক্লিকে পূর্ণাঙ্গ P&L এক্সেল/CSV এক্সপোর্ট।
- [x] **Day 30: 🔍 Unit 6 Review & Checkpoint**
  - [x] **চেকলিস্ট:** টেস্ট ডেটা দিয়ে P&L হিসাব মেলানো, এক্সপেন্স সমন্বয় এবং এক্সেল এক্সপোর্ট যাচাই।

---

### 🟢 Unit 7: Customer CRM & SMS Automation (দিন ৩১ – ৩৪)
> **ফলাফল:** কাস্টমার ডাটাবেস এবং ডেলিভারি সম্পন্ন হলে স্বয়ংক্রিয় থ্যাংক ইউ ও রিভিউ রিকোয়েস্ট SMS।

- [ ] **Day 31: Customer CRM & Purchase History**
  - [ ] ফোন নম্বর ভিত্তিক ইউনিক কাস্টমার প্রোফাইল ও মোট অর্ডার হিস্ট্রি।
  - [ ] কাস্টমার লাইফটাইম ভ্যালু (LTV) এবং রিটার্ন রিস্ক ট্যাগিং (যেমন: High Return Rate Warning)।
- [ ] **Day 32: Bangladeshi SMS Gateway Integration**
  - [ ] লোকাল SMS গেটওয়ে কানেক্টর (Elitbuzz / Greenweb / SSL Wireless)।
- [ ] **Day 33: Delivery-Triggered SMS Automation**
  - [ ] অর্ডার ডেলিভার্ড হলে নির্দিষ্ট সময় পর অটোমেটিক থ্যাংক ইউ বা রিভিউ SMS ট্রিগার।
  - [ ] মেসেজ হিস্ট্রি ও ডেলিভারি লগ।
- [ ] **Day 34: 🔍 Unit 7 Review & Checkpoint**
  - [ ] **চেকলিস্ট:** কাস্টমার প্রোফাইল যাচাই, অটোমেশন রুল সেট এবং টেস্ট নম্বরে লাইভ SMS টেস্ট।

---

### 🟢 Unit 8: Executive Dashboard, AI Insights & Final Launch (দিন ৩৫ – ৪০)
> **ফলাফল:** প্রধান ড্যাশবোর্ড, রুল-বেসড ও AI পরামর্শ এবং ফুল সিস্টেম লঞ্চ প্রস্তুতি।

- [ ] **Day 35: Executive Unified Dashboard**
  - [ ] ব্যবসায়ীর মূল ড্যাশবোর্ড: আজকের নিট প্রফিট, মোট অ্যাড স্পেন্ড, ডেলিভারি রেট (%) এবং রিয়েল ROAS।
- [ ] **Day 36: Rule-Based Ad Health & Anomaly Alerts**
  - [ ] হাই রিটার্ন যুক্ত ক্যাম্পেইন সতর্কবার্তা, ব্লিডিং অ্যাড অ্যালার্ট (যেখানে স্পেন্ড বেশি কিন্তু লাভ শূন্য)।
- [ ] **Day 37: AI Business Analyst Engine**
  - [ ] Gemini / Claude API দিয়ে ডেটা বিশ্লেষণ করে বাংলায় সহজ ও কার্যকরী পরামর্শ তৈরি।
- [ ] **Day 38: SaaS Multi-Tenant Security & Polish**
  - [ ] পারফরম্যান্স টিউনিং, ডাটাবেস ইনডেক্সিং ও সিকিউরিটি চেকিং।
- [ ] **Day 39: End-to-End System Testing**
  - [ ] সম্পূর্ণ ফ্লো টেস্ট: Ad ➔ Order ➔ Courier ➔ Delivery ➔ P&L ➔ SMS।
- [ ] **Day 40: 🎯 Final MVP Demo & Project Sign-off**
  - [ ] সম্পূর্ণ প্রজেক্টের লাইভ ডেমো এবং হ্যান্ডওভার।

---

## 🤝 রিভিউ এবং ফিডব্যাক দেওয়ার নিয়ম

1. আমরা যখন কোনো একটি **Unit**-এ কাজ করব, প্রতিদিনের কাজ শেষ হলে অগ্রগতি এই ফাইলে টিক চিহ্ন (`[x]`) দিয়ে আপডেট করা হবে।
2. পুরো ইউনিটের কাজ শেষ হলে আপনাকে জানানো হবে। আপনি নিজে ব্রাউজার ও Swagger UI-তে টেস্ট করবেন।
3. আপনার অনুমোদনের পর আমরা পরবর্তী ইউনিটে প্রবেশ করব।

