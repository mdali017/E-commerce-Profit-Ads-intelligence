# PRD: E-commerce Profit & Ads Intelligence SaaS

Nov 1, 2026 · @Md. Mohabbat Ali

## ১. ডকুমেন্ট ওভারভিউ

এই PRD-এর উদ্দেশ্য হলো একটি SaaS প্ল্যাটফর্মের সম্পূর্ণ product definition দেওয়া, যা E-commerce ও F-commerce ব্যবসায়ীকে Ads থেকে শুরু করে Profit পর্যন্ত পুরো ব্যবসার হিসাব এক জায়গায় দেখাবে। এই ডকুমেন্ট পড়ে একজন developer, designer বা project manager বুঝতে পারবে কী বানাতে হবে, কেন বানাতে হবে এবং কোন কাজ কোন ধাপে হবে।

| বিষয় | বিবরণ |
| --- | --- |
| প্রোডাক্টের কাজের নাম | Profit & Ads Intelligence Platform (চূড়ান্ত নাম পরে ঠিক হবে) |
| ডকুমেন্ট ভার্সন | v1.0 (Draft) |
| প্রোডাক্ট টাইপ | Multi-tenant SaaS (Web app) |
| প্রাথমিক বাজার | বাংলাদেশ (BDT, COD-ভিত্তিক ব্যবসা, স্থানীয় courier) |
| ভবিষ্যৎ বাজার | দক্ষিণ এশিয়া ও অন্যান্য COD-প্রধান দেশ |
| প্রধান ব্যবহারকারী | E-commerce ও F-commerce ব্যবসার owner, ম্যানেজার, অ্যাকাউন্টেন্ট, মার্কেটার |

### এই ডকুমেন্টের পাঠক

- **Product Owner / Client:** scope, priority ও business rule যাচাই করবেন।
- **Developer:** module, data model, integration ও API requirement দেখবেন।
- **UI/UX Designer:** user flow, screen ও dashboard-এর প্রয়োজন বুঝবেন।
- **QA:** acceptance criteria থেকে test case বানাবেন।

### কীভাবে পড়বেন

সেকশন ২–৫-এ সমস্যা, লক্ষ্য, ব্যবহারকারী ও scope আছে। সেকশন ৬–১৬-এ ১০টি core module-এর বিস্তারিত requirement আছে। সেকশন ১৭–২১-এ SaaS প্ল্যাটফর্ম, architecture, UI ও non-functional requirement আছে। সেকশন ২২-এ roadmap, risk ও open question আছে।

### Requirement লেখার নিয়ম

প্রতিটি functional requirement-এর একটি ID আছে (যেমন `ADS-01`, `ORD-03`)। Priority চিহ্ন: **P0** = MVP-তে অবশ্যই লাগবে, **P1** = MVP-এর পরের release-এ, **P2** = ভবিষ্যতে। "হবে" মানে বাধ্যতামূলক, "পারবে" মানে ঐচ্ছিক।

## ২. Background ও Problem Statement

E-commerce ও F-commerce ব্যবসার আসল লাভ-ক্ষতি আজ কোনো একক জায়গায় দেখা যায় না। Order এক জায়গায়, ad খরচ আরেক জায়গায়, courier-এর টাকা তৃতীয় জায়গায়। ফলে ব্যবসায়ীকে প্রতি সপ্তাহে বা মাসে হাতে-কলমে বা Excel-এ হিসাব মেলাতে হয়।

### বর্তমান অবস্থা (As-Is)

একজন ক্লায়েন্ট বর্তমানে যা করেন:

1. Website/WooCommerce বা Facebook page থেকে order নেন।
2. Facebook/Instagram Ads Manager ও Google Ads থেকে আলাদাভাবে ad spend দেখেন।
3. Courier panel (Pathao, Steadfast, RedX ইত্যাদি) থেকে delivered, returned ও cancelled order-এর তালিকা আলাদা করে নামান।
4. Product cost, packaging, courier charge, COD fee, staff খরচ হাতে যোগ-বিয়োগ করেন।
5. সবকিছু Excel-এ মিলিয়ে নির্ধারণ করেন লাভ হলো না ক্ষতি।

### মূল সমস্যাগুলো

| # | সমস্যা | ব্যবসায়ীর উপর প্রভাব |
| --- | --- | --- |
| 1 | Data বিচ্ছিন্ন (website, Meta, Google, courier আলাদা) | হিসাব করতে ঘণ্টার পর ঘণ্টা লাগে, ভুলের ঝুঁকি বেশি |
| 2 | Ad-এর ROAS দেখা যায় "placed order" ধরে, "delivered order" ধরে নয় | Meta-তে ভালো দেখালেও আসলে লোকসান হয়, ক্ষতি ধরা পড়ে দেরিতে |
| 3 | Return ও cancel-এর খরচ কোন campaign-এর ঘাড়ে যাবে তা অজানা | কোন ad সত্যিই লাভজনক তা বোঝা যায় না |
| 4 | COD-এর টাকা courier থেকে কবে কত এলো তার ট্র্যাকিং কঠিন | Cash flow অস্পষ্ট, courier থেকে পাওনা হারিয়ে যায় |
| 5 | Product-ওয়াইজ আসল profit জানা নেই | ভুল product-এ বেশি বিজ্ঞাপন খরচ হয় |
| 6 | Delivered customer-এর ডাটা কাজে লাগে না | Repeat order ও review হারিয়ে যায় |
| 7 | কী করলে ad ভালো হবে তা বোঝার মতো বিশ্লেষক নেই | ক্ষুদ্র ব্যবসায়ী অন্ধভাবে budget বাড়ায়-কমায় |

### সুযোগ

বাংলাদেশে COD-নির্ভর ব্যবসায় return rate সাধারণত বেশি, তাই "ad spend বনাম আসল delivered revenue" মেলানোর প্রয়োজন আরও জরুরি। বিদেশি tool (Triple Whale, Shopify-কেন্দ্রিক analytics) স্থানীয় courier, BDT ও COD workflow বোঝে না। এই ফাঁকটাই এই product-এর বাজার।

### Problem Statement (এক বাক্যে)

ব্যবসায়ী জানেন না তাঁর প্রতিটি ad টাকা সত্যিই কত লাভ বা ক্ষতি এনে দিচ্ছে, কারণ order, ad ও delivery data কোথাও একসাথে মেলানো হয় না। এই product সেই হিসাব স্বয়ংক্রিয়ভাবে, real-time-এর কাছাকাছি, সঠিকভাবে করে দেবে।

## ৩. Vision, Goals ও Success Metrics

### Vision

যেকোনো E-commerce/F-commerce ব্যবসায়ী এক dashboard খুলেই বুঝবেন: আজ কত টাকা ad-এ গেছে, কত order এসেছে, কত delivered হয়েছে, কত return এসেছে এবং শেষ পর্যন্ত পকেটে কত লাভ বা ক্ষতি হলো।

### Product Goals

1. **একটি সত্য-উৎস (Single Source of Truth):** Ads, order, courier ও expense data এক জায়গায় মিলবে।
2. **আসল লাভের হিসাব:** শুধু placed order নয়, delivered ও collected টাকার ভিত্তিতে profit দেখাবে।
3. **Campaign-স্তরের লাভ:** প্রতিটি campaign/ad set/ad কত net profit দিচ্ছে তা দেখাবে।
4. **AI-চালিত পরামর্শ:** সমস্যা কোথায় ও কী করা উচিত তা সহজ বাংলায় বলবে।
5. **Customer retention:** Delivered customer-কে স্বয়ংক্রিয়ভাবে follow-up করে repeat order বাড়াবে।
6. **সহজে সম্প্রসারণযোগ্য:** নতুন courier, ad channel ও e-commerce platform কোড না ভেঙে যোগ করা যাবে।

### Non-Goals (প্রথম ভার্সনে করা হবে না)

- সম্পূর্ণ ERP/inventory management বা warehouse management।
- নিজস্ব storefront বা checkout তৈরি।
- Ad creative তৈরি বা ad সরাসরি publish করা (প্রথমে শুধু read ও analyse)।
- Full accounting software (VAT filing, payroll, balance sheet)।
- Marketplace (Daraz) integration (Phase 3-তে বিবেচনা)।

### Success Metrics

| Metric | লক্ষ্য (MVP launch-এর ৩ মাস পর) | মাপার উপায় |
| --- | --- | --- |
| Onboarding সময় (signup থেকে প্রথম dashboard data) | ১৫ মিনিটের কম | Funnel analytics |
| Data sync-এর সঠিকতা (order ও ad spend, নিজস্ব source-এর সাথে মিল) | ≥ ৯৯% | Reconciliation job |
| Order sync delay | ৫ মিনিটের মধ্যে (webhook), সর্বোচ্চ ১৫ মিনিট (polling) | System monitoring |
| Courier status update delay | ৩০ মিনিটের মধ্যে | System monitoring |
| সক্রিয় ব্যবহারকারী (সপ্তাহে কমপক্ষে ৩ বার login) | ≥ ৬০% | Product analytics |
| Paid conversion (trial থেকে paid) | ≥ ১৫% | Billing data |
| ব্যবহারকারীর মাসিক Churn | ≤ ৫% | Billing data |
| ব্যবসায়ীর হিসাব মেলানোর সময় কমানো | সপ্তাহে ৫+ ঘণ্টা থেকে ৩০ মিনিটের নিচে | User survey |
| NPS | ≥ ৪০ | In-app survey |

> এই লক্ষ্যগুলো আমার প্রাথমিক অনুমান; প্রথম ১০–২০ জন pilot ব্যবহারকারীর data পাওয়ার পর পুনর্বিবেচনা করা উচিত।

## ৪. Target Users ও Personas

### Primary Customer Segment

- **F-commerce seller:** Facebook page ও Messenger/WhatsApp দিয়ে order নেন, Meta ad-ই প্রধান বিক্রির উৎস, Excel বা খাতায় হিসাব রাখেন।
- **WooCommerce/Website store owner:** নিজস্ব ওয়েবসাইট আছে, Meta ও Google ad চালান, courier-এ COD পাঠান।
- **Hybrid seller:** website ও Facebook দুই জায়গা থেকেই order আসে।

আকার: মাসে ১০০ থেকে ১০,০০০ order, মাসিক ad budget ৳২০,০০০ থেকে ৳১০ লক্ষ+।

### Persona ১: রাহাত (ব্যবসার মালিক)

- বয়স ২৮, ফ্যাশন ও লাইফস্টাইল পণ্য বিক্রি করেন, ৩ জন স্টাফ।
- **চান:** প্রতিদিন সকালে এক নজরে দেখতে গতকাল লাভ হলো না ক্ষতি।
- **কষ্ট:** Meta-তে ROAS ৪ দেখায় কিন্তু return-এর পর মাসের শেষে হাতে কিছুই থাকে না।
- **সফলতার মানদণ্ড:** কোন campaign বন্ধ করতে হবে আর কোনটায় budget বাড়াতে হবে তা ৫ মিনিটে বোঝা।

### Persona ২: সুমি (অপারেশন/অর্ডার ম্যানেজার)

- Order confirm করেন, courier-এ পাঠান, return handle করেন।
- **চান:** কোন order pending, কোনটা courier-এ আছে, কোনটা ফেরত এসেছে তা এক তালিকায় দেখতে।
- **কষ্ট:** ৩টি courier panel আলাদা করে খুলতে হয়।

### Persona ৩: তানভীর (মার্কেটার)

- Meta ও Google ad চালান।
- **চান:** ad-এর আসল (delivery-পরবর্তী) ফলাফল, AI-এর পরামর্শ।
- **কষ্ট:** Meta dashboard-এ purchase দেখায় কিন্তু কতগুলো আসলে ডেলিভার হয়েছে জানার উপায় নেই।

### Persona ৪: নাসরিন (অ্যাকাউন্টেন্ট/হিসাবরক্ষক)

- **চান:** মাস শেষে P&L ও COD collection report, Excel-এ export।
- **কষ্ট:** courier থেকে টাকা আসার সাথে order মেলানো।

### মূল Jobs-to-be-Done

| ব্যবহারকারী | যখন... | তখন তিনি চান... |
| --- | --- | --- |
| মালিক | সকালে ঘুম থেকে উঠে | গতকালের নিট লাভ ও সবচেয়ে বড় সমস্যা জানতে |
| মালিক | নতুন ad budget ঠিক করার সময় | কোন campaign-এ প্রতি ১ টাকায় আসল কত লাভ তা দেখতে |
| অর্ডার ম্যানেজার | সকালের shift শুরুতে | pending order ও আজকের courier handover তালিকা |
| মার্কেটার | সপ্তাহের শেষে | AI-এর বিশ্লেষণ ও পরের সপ্তাহের করণীয় |
| হিসাবরক্ষক | মাস শেষে | courier-এর পাওনা মিলিয়ে P&L report বের করতে |
| মালিক | কোনো customer ডেলিভারি পাওয়ার পর | স্বয়ংক্রিয় ধন্যবাদ ও review-এর অনুরোধ পাঠাতে |

## ৫. Scope ও Release Phasing

প্রথম release-এ সবকিছু একসাথে বানালে সময় ও খরচ দুটোই বেড়ে যাবে। তাই ১০টি module-কে তিন phase-এ ভাগ করা হয়েছে। **MVP-র লক্ষ্য:** "Ads → Order → Delivery → Profit" এই মূল পথটি পুরোপুরি কাজ করা।

| Module | MVP (Phase 1) | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| 1. Meta Ads Integration | Account connect, spend/result/CPA/ROAS dashboard, campaign-ad set-ad drill-down | Auto-sync বাড়ানো, creative-level report | Meta Conversions API (CAPI) সহ |
| 2. AI Ad Analysis | সাপ্তাহিক ও on-demand বিশ্লেষণ (rule + LLM) | Daily alert, প্রশ্ন-উত্তর (chat) | Auto-optimization সুপারিশ, budget rule |
| 3. Website Order Integration | WooCommerce, CSV/manual order | Shopify, Custom API/webhook | Daraz ও অন্যান্য marketplace |
| 4. Courier Integration | Steadfast, Pathao, RedX | Paperfly, eCourier, অন্যান্য | Auto-booking, label প্রিন্ট |
| 5. Funnel Tracking | UTM ও order-source দিয়ে attribution | Facebook Messenger/WhatsApp order attribution | Multi-touch attribution |
| 6. Product Management | Auto-sync, product-wise profit | Variant ও bundle, stock সতর্কতা | Supplier-wise cost |
| 7. Profit & Loss | Daily/Weekly/Monthly P&L, expense input | Recurring expense, Excel/PDF export | Tax summary, multi-currency |
| 8. Customer CRM | Customer DB, purchase history, tag | Segmentation, RFM, blacklist | Predictive LTV |
| 9. SMS/WhatsApp Automation | Delivered-পর SMS (একটি gateway) | WhatsApp Business API, template | Review request, repeat reminder, campaign |
| 10. Analytics Dashboard | Unified dashboard, charts | Custom report, scheduled email | Benchmark, forecast |
| Google Ads | — | Google Ads integration | Other channels (TikTok, Snapchat) |

### MVP-তে অন্তর্ভুক্ত

- Multi-tenant SaaS কাঠামো, signup, workspace, role।
- Meta Ads, WooCommerce, ২–৩টি courier।
- Funnel, Product ও P&L dashboard।
- Basic AI analysis ও Basic CRM।
- একটি SMS gateway-এর মাধ্যমে delivered-পর স্বয়ংক্রিয় মেসেজ।
- Subscription billing (SSLCommerz/bKash বা Stripe)।

### MVP-তে বাদ (Out of Scope)

- Ad create/edit বা budget পরিবর্তন করা (শুধু read)।
- Inventory ও stock management, purchase order।
- Multi-currency ও multi-warehouse।
- Native mobile app (প্রথমে responsive web, পরে PWA)।

> **ক্লায়েন্টের মূল requirement-এ Google Ads-ও আছে।** আমি MVP-তে শুধু Meta রেখেছি, কারণ Meta-ই F-commerce-এর প্রধান channel এবং Google Ads API-এর developer token অনুমোদনে সময় লাগে। Google Ads Phase 2-তে নেওয়ার প্রস্তাব করা হলো। চাইলে MVP-তে আনা যায়, তবে সময় বাড়বে।

## ৬. End-to-End Business Flow

Platform-এর মূল ধারণা একটি শৃঙ্খল: **Ads → Order → Confirmation → Courier → Delivery/Return → Revenue → Expense → Profit → Customer Follow-up**। নিচের ছবিতে দেখা যায়, order আসার সময় নয়, delivery ও টাকা হাতে আসার পরই আসল লাভ-ক্ষতি জানা যায়।

&#91;embedded content: business flow · 9 steps, from ad to follow-up\]

ছবির প্রতিটি ধাপ আলাদা module-এ বিস্তারিত বলা আছে। ধাপগুলোর মধ্যে data কীভাবে সংযুক্ত হয়, তা নিচের টেবিলে দেওয়া হলো।

| ধাপ | কী ঘটে | Data-র উৎস | সংশ্লিষ্ট module |
| --- | --- | --- | --- |
| 1. Ads | Meta-তে বিজ্ঞাপন চলে, spend ও click হয় | Meta Marketing API | Module 1, 2 |
| 2. Order | Customer website/Messenger/ফোনে order দেন | WooCommerce, manual, CSV, API | Module 3 |
| 3. Attribution | Order কোন campaign থেকে এলো তা নির্ধারণ | UTM, fbclid, manual source | Module 5 |
| 4. Confirmation | স্টাফ ফোন করে order নিশ্চিত করেন | ইন-অ্যাপ workflow | Module 3 |
| 5. Courier | Order courier-এ booking হয় | Courier API | Module 4 |
| 6. Delivery/Return | Delivered, returned বা cancelled | Courier webhook/sync | Module 4 |
| 7. Revenue | Delivered order-এর আয় ও COD collection | Courier payment data | Module 4, 7 |
| 8. Expense | Product cost, courier charge, ad spend, অন্যান্য খরচ বাদ | Product cost, Ads, Expense | Module 6, 7 |
| 9. Profit | Net profit/loss: campaign, product, দিন ভিত্তিতে | P&L engine | Module 7, 10 |
| 10. Follow-up | Delivered customer-কে SMS/WhatsApp ও repeat tracking | CRM, Messaging | Module 8, 9 |

### মূল নকশা-নীতি

1. **Order একবারই ঢোকে, সবাই একই order ব্যবহার করে।** Ads, courier, product, customer ও profit সব একই order record-এর সাথে যুক্ত।
2. **Status-ই সত্য।** Delivered হওয়ার আগে কোনো order revenue হিসেবে গণনা হয় না।
3. **Meta-র সংখ্যা ও আসল সংখ্যা পাশাপাশি।** Meta যা দাবি করে এবং আসলে যা ডেলিভারি হলো, এই ফারাকই product-এর কেন্দ্রীয় মূল্য।
4. **সব সংখ্যা যাচাইযোগ্য।** যেকোনো সংখ্যা ক্লিক করে মূল order/খরচ পর্যন্ত যাওয়া যাবে।

## ৭. Module 1: Meta Ads Integration

**উদ্দেশ্য:** ব্যবহারকারীর Meta (Facebook ও Instagram) Ads account সংযুক্ত করে ad spend ও performance data স্বয়ংক্রিয়ভাবে নিয়ে আসা এবং dashboard-এ দেখানো।

### ৭.১ Connection ও Authorization

| ID | Requirement | Priority |
| --- | --- | --- |
| ADS-01 | ব্যবহারকারী "Connect Meta" বাটনে ক্লিক করে Facebook Login (OAuth 2.0) দিয়ে অনুমতি দেবেন। | P0 |
| ADS-02 | সিস্টেম ব্যবহারকারীর সব Ad Account ও Business Manager তালিকা দেখাবে; ব্যবহারকারী কোন কোন account sync হবে তা নির্বাচন করবেন। | P0 |
| ADS-03 | একটি workspace-এ একাধিক Ad Account সংযুক্ত করা যাবে (plan-অনুযায়ী সীমা)। | P0 |
| ADS-04 | Access token এনক্রিপ্ট করে সংরক্ষণ হবে; long-lived token মেয়াদ শেষের আগে স্বয়ংক্রিয় রিফ্রেশ বা পুনঃ-অনুমতির নোটিফিকেশন যাবে। | P0 |
| ADS-05 | Token expire বা permission বাতিল হলে dashboard-এ "Reconnect" সতর্কতা দেখাবে এবং ইমেইল যাবে। | P0 |
| ADS-06 | ব্যবহারকারী যেকোনো সময় connection বিচ্ছিন্ন করতে পারবেন; তখন নতুন sync বন্ধ হবে, পুরনো data রাখা বা মুছে ফেলার বিকল্প দেওয়া হবে। | P0 |

প্রয়োজনীয় Meta permission (সম্ভাব্য): `ads_read`, `business_management`, `read_insights`। Meta App Review ও Business Verification লাগবে (সময় ও risk-এর জন্য সেকশন ২২ দেখুন)।

### ৭.২ Data Sync

| ID | Requirement | Priority |
| --- | --- | --- |
| ADS-10 | Meta Marketing API (Insights) থেকে account, campaign, ad set ও ad স্তরে data আনা হবে। | P0 |
| ADS-11 | প্রথম connect-এর সময় গত ৯০ দিনের historical data (backfill) আনা হবে; background job-এ, progress bar সহ। | P0 |
| ADS-12 | তারপর নিয়মিত sync: আজকের data প্রতি ৩০ মিনিটে, গত ৭ দিনের data প্রতিদিন পুনরায় (attribution window-এর কারণে Meta পরে সংখ্যা বদলায়)। | P0 |
| ADS-13 | ব্যবহারকারী manual "Sync now" চাপতে পারবেন (rate limit সহ)। | P1 |
| ADS-14 | Meta API rate limit ও error handling: retry with exponential backoff, ব্যর্থ job-এর লগ ও অ্যাডমিন সতর্কতা। | P0 |
| ADS-15 | সব ad account-এর timezone ও currency সংরক্ষণ হবে; dashboard-এ workspace-এর base currency (BDT) ও timezone-এ রূপান্তর হবে। USD account হলে রূপান্তর হার (daily rate) সংরক্ষিত থাকবে। | P0 |

### ৭.৩ যেসব Metric সংরক্ষণ হবে

| Metric | বিবরণ |
| --- | --- |
| Spend | খরচের পরিমাণ (account currency ও BDT) |
| Impressions, Reach, Frequency | দৃশ্যমানতা |
| Clicks (all), Link clicks, CTR, CPC | ক্লিক-সম্পর্কিত |
| Results ও Result type | campaign objective-অনুযায়ী (purchase, message, lead ইত্যাদি) |
| Purchases ও Purchase value | Pixel/CAPI-এর রিপোর্ট করা |
| Messaging conversations started | Messenger/WhatsApp campaign-এর জন্য |
| Cost per result (CPA), CPM | খরচ-দক্ষতা |
| ROAS (Meta-reported) | Meta যে ROAS দেখায় |
| Video metrics | ThruPlay, 3-sec view, hook rate, hold rate (video ad-এর জন্য) |
| Breakdown | বয়স, লিঙ্গ, placement, device, অঞ্চল (দৈনিক) |
| Status ও Budget | campaign/ad set status, daily/lifetime budget, bid strategy |
| Creative info | ad name, thumbnail URL, ad copy, CTA |

**গুরুত্বপূর্ণ ধারণা:** Meta-র ROAS ও purchase সংখ্যা "Meta-reported", আর এই product-এর নিজস্ব হিসাবকৃত ROAS হবে "**Actual (delivery-based) ROAS**"। দুটোই পাশাপাশি দেখানো হবে, কারণ তাদের ফারাকই ব্যবসায়ীর আসল তথ্য (বিস্তারিত Module 5 ও 7)।

### ৭.৪ Dashboard ও Report

| ID | Requirement | Priority |
| --- | --- | --- |
| ADS-20 | Ads overview পেজ: মোট spend, results, CPA, Meta ROAS, CTR, CPM সারাংশ কার্ড, আগের সময়ের সাথে তুলনা (% বদল)। | P0 |
| ADS-21 | তারিখ নির্বাচন: আজ, গতকাল, ৭/১৪/৩০ দিন, এই মাস, গত মাস, কাস্টম রেঞ্জ। | P0 |
| ADS-22 | Campaign → Ad Set → Ad drill-down টেবিল: sort, filter (status, objective), column নির্বাচন, search। | P0 |
| ADS-23 | Trend chart: দৈনিক spend বনাম results, CPA ও ROAS লাইন চার্ট। | P0 |
| ADS-24 | Breakdown view: বয়স, লিঙ্গ, placement, device অনুযায়ী bar chart। | P1 |
| ADS-25 | Creative gallery: thumbnail সহ ad-এর পারফরম্যান্স তুলনা (Top/Worst creative)। | P1 |
| ADS-26 | Campaign tag ও grouping (যেমন "Product A", "Eid sale")। এটি পরে product-wise profit-এ কাজে লাগবে। | P1 |
| ADS-27 | CSV/Excel export। | P1 |

### ৭.৫ Acceptance Criteria (নমুনা)

- ব্যবহারকারী OAuth সম্পূর্ণ করার পর ৩০ সেকেন্ডের মধ্যে ad account তালিকা দেখতে পাবেন।
- Backfill শেষ হওয়ার পর কোনো campaign-এর spend Meta Ads Manager-এর সাথে ≤ ১% পার্থক্যে মিলবে (একই attribution setting ও timezone ধরে)।
- Token expire হলে ২৪ ঘণ্টার মধ্যে ব্যবহারকারী ইমেইল ও in-app সতর্কতা পাবেন।
- Meta API error হলে ব্যবহারকারী ভাঙা dashboard নয়, "সর্বশেষ sync: ৩ ঘণ্টা আগে" লেখা সহ পুরনো data দেখবেন।

## ৮. Module 2: AI Ad Performance Analysis

**উদ্দেশ্য:** Meta Ads data (এবং ডেলিভারি-পরবর্তী আসল ফলাফল) বিশ্লেষণ করে ব্যবহারকারীকে সহজ বাংলায় জানানো: ad-এর অবস্থা কেমন, সমস্যা কোথায়, সম্ভাব্য কারণ কী এবং কী করা উচিত।

### ৮.১ AI যা যা করবে

1. **Performance Summary:** নির্বাচিত সময়ে মোট অবস্থা (ভালো/মাঝারি/খারাপ) এক অনুচ্ছেদে।
2. **Problem Detection:** কোন campaign, ad set বা ad সমস্যায় আছে।
3. **Root Cause Hypothesis:** সম্ভাব্য কারণ (যেমন creative fatigue, audience saturation, অতিরিক্ত return, landing page সমস্যা)।
4. **Recommendations:** অগ্রাধিকার অনুযায়ী করণীয় তালিকা (যেমন "Campaign X-এর budget ২০% কমান", "Ad Y বন্ধ করুন")।
5. **Winners & Losers:** সেরা ও সবচেয়ে খারাপ campaign/creative।
6. **Anomaly Alert:** হঠাৎ spend বেড়ে যাওয়া, CPA লাফিয়ে ওঠা, delivery বন্ধ হওয়া।

### ৮.২ বিশ্লেষণের দুটি স্তর (Hybrid Approach)

আমি শুধু LLM-এর ওপর নির্ভর করার পরিবর্তে **Rule Engine + LLM** একসাথে ব্যবহারের প্রস্তাব দিচ্ছি। কারণ সংখ্যা ও হিসাব নিশ্চিতভাবে সঠিক হওয়া দরকার, LLM সংখ্যায় ভুল করতে পারে।

| স্তর | কাজ | কেন |
| --- | --- | --- |
| Rule Engine (কোড) | সব সংখ্যা হিসাব, benchmark তুলনা, সমস্যা চিহ্নিত করা | নির্ভুল, দ্রুত, সস্তা, ব্যাখ্যাযোগ্য |
| LLM (যেমন Claude API) | Rule engine-এর ফলাফল ও সংখ্যা পেয়ে ব্যাখ্যা, কারণ ও পরামর্শ বাংলা/ইংরেজিতে লেখা | ভাষা, প্রসঙ্গ বোঝা, সহজ ব্যাখ্যা |

### ৮.৩ Rule Engine-এর নমুনা Rule

| Rule | শর্ত (উদাহরণ) | Insight |
| --- | --- | --- |
| Creative Fatigue | Frequency > ৩.৫ এবং ৭ দিনে CTR ২৫%+ কমেছে | "Creative ক্লান্ত, নতুন creative দিন" |
| High CPA | CPA লক্ষ্য CPA-র ১.৩ গুণের বেশি টানা ৩ দিন | "CPA বেশি, audience/offer পুনর্বিবেচনা করুন" |
| Return-Heavy Campaign | Campaign-এর return+cancel rate > ৩৫% | "Order আসছে কিন্তু ফেরত বেশি, Meta ROAS ভুল ছবি দিচ্ছে" |
| Negative Real Profit | Actual ROAS < Break-even ROAS | "এই campaign-এ আসলে ক্ষতি হচ্ছে" |
| Scale Opportunity | Actual ROAS > ১.৫ × break-even এবং ৭ দিন স্থিতিশীল | "Budget ১৫–২০% বাড়ানো যেতে পারে" |
| Spend Without Results | ১০০০+ ৳ খরচ, শূন্য result | "Ad বন্ধ বা পরীক্ষা করুন" |
| Low CTR | CTR < ০.৮% | "Hook/creative দুর্বল" |
| High CPM | CPM গত ৩০ দিনের গড়ের ৫০%+ বেশি | "Audience ছোট বা প্রতিযোগিতা বেড়েছে" |
| Learning Limited | Meta status "Learning limited" | "Budget/audience সংশোধন প্রয়োজন" |

Threshold গুলো প্রতিটি workspace-এ নিজের মতো পরিবর্তন করা যাবে (target CPA, break-even ROAS ইত্যাদি)।

### ৮.৪ Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| AI-01 | ব্যবহারকারী "Analyze" বাটনে চাপলে নির্বাচিত সময় ও account-এর জন্য রিপোর্ট তৈরি হবে (৩০ সেকেন্ডের মধ্যে)। | P0 |
| AI-02 | সাপ্তাহিক স্বয়ংক্রিয় রিপোর্ট ইমেইল ও dashboard-এ (সোমবার সকাল)। | P1 |
| AI-03 | প্রতিটি insight-এ থাকবে: গুরুত্বের মাত্রা (High/Medium/Low), প্রমাণ (সংখ্যা), সম্ভাব্য কারণ, করণীয়। | P0 |
| AI-04 | সব সংখ্যা Rule Engine থেকে আসবে এবং LLM-কে কেবল প্রদত্ত সংখ্যা ব্যবহার করতে নির্দেশ দেওয়া হবে; LLM-এর আউটপুটে নতুন সংখ্যা বানানো নিষিদ্ধ। | P0 |
| AI-05 | Insight-এ "নিশ্চিত" ও "সম্ভাব্য" আলাদাভাবে চিহ্নিত থাকবে। | P0 |
| AI-06 | ব্যবহারকারী insight-কে "সহায়ক/অসহায়ক" রেট করতে পারবেন (feedback loop)। | P1 |
| AI-07 | ডেটা কম থাকলে (যেমন < ৫০ click বা < ৩ দিন) AI "যথেষ্ট ডেটা নেই" বলবে, অনুমান করবে না। | P0 |
| AI-08 | Daily anomaly alert (ইমেইল/SMS/WhatsApp বা in-app)। | P1 |
| AI-09 | Chat-ভিত্তিক প্রশ্ন ("গত সপ্তাহে কোন ad সবচেয়ে খারাপ ছিল?") | P2 |
| AI-10 | AI আউটপুট ভাষা: বাংলা (ডিফল্ট) ও ইংরেজি। | P0 |
| AI-11 | AI ব্যবহারের খরচ নিয়ন্ত্রণ: plan অনুযায়ী মাসিক analysis সীমা, ফলাফল cache। | P0 |

### ৮.৫ AI Output-এর নমুনা

> **সারসংক্ষেপ (গত ৭ দিন):** মোট ৳৮৫,০০০ খরচ হয়েছে। Meta ৩২০টি purchase দেখাচ্ছে (Meta ROAS ৩.২), কিন্তু ডেলিভারি-পরবর্তী আসল ROAS ১.৮, যা break-even ২.১-এর নিচে। অর্থাৎ বিজ্ঞাপনে আপাতত ক্ষতি হচ্ছে।
>
> **প্রধান সমস্যা (High):** "Eid Combo – Broad" campaign-এ ৪২% order return হয়েছে। এই campaign-এ ৳২৮,০০০ খরচ করে নিট ক্ষতি ৳৬,৫০০।
>
> **সম্ভাব্য কারণ:** Frequency ৪.১ এবং CTR ৩০% কমেছে, যা creative ক্লান্তির ইঙ্গিত। Return বেশি হওয়ায় audience মান সন্দেহজনক হতে পারে (এটি অনুমান)।
>
> **করণীয়:** (১) এই campaign-এর budget ৩০% কমান। (২) নতুন creative পরীক্ষা করুন। (৩) "Winter Collection – Lookalike" campaign-এ ৭ দিন ধরে আসল ROAS ২.৯, budget ১৫% বাড়ানো যেতে পারে।

(উপরের সংখ্যাগুলো শুধু উদাহরণ।)

### ৮.৬ Guardrails ও সীমাবদ্ধতা

- AI কখনো সরাসরি ad বা budget পরিবর্তন করবে না (Phase 1-এ read-only)।
- ব্যবহারকারীর PII (নাম, ফোন, ঠিকানা) LLM-এ পাঠানো হবে না; শুধু aggregated metric যাবে।
- প্রতিটি insight-এর পেছনের সংখ্যা ও গণনা "কেন এই পরামর্শ?" ক্লিকে দেখা যাবে।
- সংখ্যা ও পরামর্শ "পরামর্শ" হিসেবে চিহ্নিত, ব্যবসার সিদ্ধান্ত ব্যবহারকারীর।

## ৯. Module 3: Website / WooCommerce Order Integration

**উদ্দেশ্য:** ব্যবহারকারীর ওয়েবসাইট বা অন্য উৎস থেকে order স্বয়ংক্রিয়ভাবে প্ল্যাটফর্মে আনা, এবং একটি নিজস্ব, স্বাধীন order lifecycle-এ পরিচালনা করা।

### ৯.১ Order-এর উৎস (Order Source Connectors)

| Source | Phase | সংযোগ পদ্ধতি |
| --- | --- | --- |
| WooCommerce | P0 (MVP) | REST API key + webhook (order.created, order.updated) |
| Manual order (dashboard-এ ফর্ম) | P0 | ইন-অ্যাপ ফর্ম; F-commerce (Messenger/WhatsApp) order-এর জন্য জরুরি |
| CSV/Excel import | P0 | টেমপ্লেট সহ bulk upload |
| Shopify | P1 | OAuth app + webhook |
| Custom Website (Generic API/Webhook) | P1 | আমাদের public REST API ও webhook endpoint, API key দিয়ে |
| Facebook Page/Messenger order | P2 | Chatbot বা manual-এর সাথে ইন্টিগ্রেশন |
| Daraz, অন্যান্য marketplace | P2 | Seller API |

> **গুরুত্বপূর্ণ:** অনেক F-commerce seller-এর website নেই, তাই Manual order ও CSV import-কে প্রথম শ্রেণীর feature হিসেবে MVP-তেই রাখা হয়েছে। ক্লায়েন্টের "onno business-er software connect" চাহিদা পূরণে Generic API/Webhook-ও গুরুত্বপূর্ণ।

### ৯.২ Order Sync Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| ORD-01 | ব্যবহারকারী WooCommerce-এর URL ও API key/secret দিয়ে store সংযুক্ত করবেন; সিস্টেম connection টেস্ট করে ফলাফল দেখাবে। | P0 |
| ORD-02 | সিস্টেম স্বয়ংক্রিয়ভাবে webhook তৈরি করবে (বা ব্যবহারকারীকে ধাপে ধাপে নির্দেশনা দেবে) যাতে নতুন order সাথে সাথে আসে। | P0 |
| ORD-03 | Webhook মিস হলে fallback হিসেবে প্রতি ১০–১৫ মিনিটে polling-এ নতুন/পরিবর্তিত order আনা হবে। | P0 |
| ORD-04 | প্রথম সংযোগে গত ৯০ দিনের order backfill (পরিসর বাড়ানো যাবে)। | P0 |
| ORD-05 | একই order দুইবার তৈরি হবে না (idempotency: source + external order ID unique)। | P0 |
| ORD-06 | Webhook signature যাচাই করা হবে (নিরাপত্তা)। | P0 |
| ORD-07 | একটি workspace-এ একাধিক store সংযুক্ত করা যাবে এবং order-এ store চিহ্নিত থাকবে। | P1 |
| ORD-08 | ওয়েবসাইটে order বাতিল/সম্পাদনা হলে প্ল্যাটফর্মেও আপডেট হবে (তবে প্ল্যাটফর্মের নিজস্ব status-এর সাথে সংঘর্ষের নিয়ম নিচে)। | P0 |

### ৯.৩ Order-এ যেসব তথ্য থাকবে

- **Order Header:** order নম্বর, তারিখ-সময়, source (website/manual/CSV), store, payment method (COD/prepaid), মোট, shipping charge, discount, coupon।
- **Customer:** নাম, ফোন, ইমেইল (ঐচ্ছিক), ঠিকানা (জেলা/থানা/এলাকা সহ)।
- **Line items:** product, variant, SKU, পরিমাণ, বিক্রয়মূল্য।
- **Attribution তথ্য:** UTM (source, medium, campaign, content, term), `fbclid`, landing page, referrer, "order কোথা থেকে এলো" (Meta, Google, Organic, Direct, Messenger ইত্যাদি)।
- **Notes:** customer note, internal note।

### ৯.৪ Order Lifecycle (নিজস্ব Status)

প্ল্যাটফর্মের নিজস্ব order status থাকবে, ওয়েবসাইটের status থেকে আলাদা। কারণ ওয়েবসাইট courier ও return সম্পর্কে জানে না।

| Status | অর্থ | কে পরিবর্তন করে |
| --- | --- | --- |
| New / Pending | নতুন order এসেছে, এখনো যাচাই হয়নি | সিস্টেম |
| Confirmed | ফোনে/মেসেজে customer confirm করেছেন | স্টাফ (ম্যানুয়াল) |
| Cancelled (Before Dispatch) | Courier-এ যাওয়ার আগে বাতিল | স্টাফ/ওয়েবসাইট |
| Processing / Ready to Ship | প্যাকেজিং ও handover-এর জন্য প্রস্তুত | স্টাফ |
| Sent to Courier | Courier-এ booking/handover হয়েছে | সিস্টেম/স্টাফ |
| In Transit | Courier-এর কাছে আছে, পথে | Courier webhook/sync |
| Delivered | Customer পেয়েছেন | Courier sync |
| Payment Collected / Settled | COD-এর টাকা courier থেকে পাওয়া গেছে | Courier payment sync |
| Returned / RTO | Customer নেননি, ফেরত এসেছে | Courier sync |
| Partially Delivered | আংশিক ডেলিভারি/আংশিক ফেরত | Courier sync |
| On Hold / Failed | ডেলিভারি ব্যর্থ বা সমস্যা, আবার চেষ্টা হতে পারে | Courier sync |

| ID | Requirement | Priority |
| --- | --- | --- |
| ORD-10 | সব order একটি তালিকায় (Order List) দেখা যাবে: filter (status, তারিখ, source, courier, campaign), search (নাম, ফোন, order নম্বর)। | P0 |
| ORD-11 | Order Detail পেজে সম্পূর্ণ timeline (কখন কে কী পরিবর্তন করেছে) দেখা যাবে। | P0 |
| ORD-12 | Bulk action: একাধিক order একসাথে confirm, বাতিল, courier-এ পাঠানো। | P0 |
| ORD-13 | Status পরিবর্তনের নিয়ম (state machine): কোন status থেকে কোনটিতে যাওয়া যাবে তা নির্ধারিত থাকবে (যেমন Delivered থেকে সরাসরি New নয়)। | P0 |
| ORD-14 | Courier sync দ্বারা আসা status সবসময় ম্যানুয়াল delivery-সংক্রান্ত status-কে ওভাররাইড করবে; ম্যানুয়াল override করলে কারণ লিখতে হবে ও লগ হবে। | P0 |
| ORD-15 | Duplicate order সতর্কতা: একই ফোন নম্বর থেকে ২৪ ঘণ্টায় একাধিক order। | P1 |
| ORD-16 | Fraud/Risk সংকেত: customer-এর আগের return ইতিহাস অনুযায়ী ঝুঁকি চিহ্ন (কোন courier-এ পূর্বের return/cancel)। | P1 |
| ORD-17 | Website-এ status ফেরত পাঠানো (WooCommerce order status আপডেট: delivered হলে "Completed")। | P1 |
| ORD-18 | Order-এ internal tag ও note, assign to staff। | P1 |
| ORD-19 | Confirmed হওয়ার সময়সীমা: N ঘণ্টা পরও Pending থাকলে সতর্কতা। | P1 |

### ৯.৫ Confirmation Workflow

ব্যবসায়ীদের একটি বড় কাজ হলো order confirm করা। MVP-তে পূর্ণ call-center software তৈরি হবে না; তবে Pending order তালিকা থেকে এক ক্লিকে "Confirm" ও "Cancel (কারণসহ)" করার সুবিধা থাকবে। Cancel কারণ (যেমন "customer নেবে না", "ফোন ধরেনি", "ভুল ঠিকানা") একটি ড্রপডাউন তালিকা থেকে নেওয়া হবে; পরে এটি বিশ্লেষণে কাজে লাগবে।

## ১০. Module 4: Courier Integration

**উদ্দেশ্য:** একাধিক courier-এর সাথে সংযুক্ত হয়ে order পাঠানো, delivery/return/cancel status এবং COD-এর টাকার তথ্য স্বয়ংক্রিয়ভাবে sync করা।

### ১০.১ সমর্থিত Courier

| Courier | Phase | মন্তব্য |
| --- | --- | --- |
| Steadfast | P0 | জনপ্রিয় F-commerce courier |
| Pathao Courier | P0 | Merchant API |
| RedX | P0 | Merchant API |
| Paperfly | P1 | API-র সুযোগ যাচাই প্রয়োজন |
| eCourier ও অন্যান্য | P1/P2 | চাহিদা অনুযায়ী |
| Sundarban, SA Paribahan ইত্যাদি | P2 | সাধারণত API নেই; manual/CSV fallback |

> প্রতিটি courier-এর API-র বর্তমান সুযোগ, rate limit, webhook সমর্থন ও merchant অনুমোদন discovery ধাপে (Sprint 0) যাচাই করতে হবে। কোনো courier-এ webhook না থাকলে polling ব্যবহার হবে, আর API না থাকলে CSV/manual import fallback থাকবে।

### ১০.২ Connection

| ID | Requirement | Priority |
| --- | --- | --- |
| CUR-01 | ব্যবহারকারী courier-ভিত্তিক credential (API key/secret, client ID, store ID ইত্যাদি) দিয়ে সংযুক্ত করবেন; সিস্টেম test call করে যাচাই করবে। | P0 |
| CUR-02 | একাধিক courier একই workspace-এ সক্রিয় থাকতে পারবে; একটি ডিফল্ট courier নির্ধারণ করা যাবে। | P0 |
| CUR-03 | Credential এনক্রিপ্টেড থাকবে এবং UI-তে মাস্ক করা (`****1234`) দেখাবে। | P0 |
| CUR-04 | Credential ভুল/অকার্যকর হলে সতর্কতা। | P0 |

### ১০.৩ Order পাঠানো (Dispatch)

| ID | Requirement | Priority |
| --- | --- | --- |
| CUR-10 | Confirmed order থেকে এক ক্লিকে বা bulk-এ courier-এ booking: customer নাম, ফোন, ঠিকানা, COD পরিমাণ, ওজন, নোট স্বয়ংক্রিয়ভাবে পূরণ। | P0 |
| CUR-11 | Booking সফল হলে consignment ID/tracking code সংরক্ষণ ও order status "Sent to Courier"। | P0 |
| CUR-12 | ব্যর্থ booking-এর কারণ (যেমন ঠিকানা ভুল) স্পষ্টভাবে দেখানো ও পুনরায় চেষ্টার সুযোগ। | P0 |
| CUR-13 | ঠিকানা থেকে জেলা/থানা/এলাকা স্বয়ংক্রিয় মিলানো (যেখানে courier-এর area list আছে)। | P1 |
| CUR-14 | বাইরে বুক করা order-ও (courier panel থেকে সরাসরি) consignment ID দিয়ে সিস্টেমে "link" করা যাবে। | P0 |
| CUR-15 | Label/invoice প্রিন্ট। | P2 |

**MVP-র একটি সিদ্ধান্ত যা নিতে হবে:** MVP-তে courier-এ order পাঠানো (booking) প্ল্যাটফর্ম থেকেই হবে, নাকি ব্যবহারকারী courier panel-এ বুক করে শুধু consignment ID লিংক করবেন? আমি প্রথমটি (platform থেকে booking) প্রস্তাব করছি, কারণ তাতে data সবচেয়ে নির্ভুল হয়। এটি সেকশন ২২-এ Open Question হিসেবে রাখা হয়েছে।

### ১০.৪ Status ও Data Sync

| ID | Requirement | Priority |
| --- | --- | --- |
| CUR-20 | Courier webhook (যেখানে আছে) গ্রহণ করে সাথে সাথে order status আপডেট। | P0 |
| CUR-21 | Webhook না থাকলে বা মিস হলে: সক্রিয় (non-final) consignment প্রতি ৩০ মিনিটে polling। | P0 |
| CUR-22 | প্রতিটি courier-এর নিজস্ব status কোডকে আমাদের নিজস্ব স্ট্যান্ডার্ড status-এ ম্যাপ করা (Status Mapping Table)। অজানা status পেলে "Unmapped" লগ হবে ও অ্যাডমিনকে জানাবে। | P0 |
| CUR-23 | Delivery ডেটা: delivered তারিখ-সময়, ডেলিভারির চেষ্টার সংখ্যা, ব্যর্থতার কারণ। | P0 |
| CUR-24 | Return/RTO ডেটা: return শুরু ও সম্পন্ন তারিখ, কারণ। | P0 |
| CUR-25 | **COD ও আর্থিক ডেটা:** collected COD পরিমাণ, courier delivery charge, COD charge/fee, return charge, কর্তনকৃত অন্যান্য ফি, নিট পেমেন্ট। | P0 |
| CUR-26 | Payment/Settlement tracking: কোন তারিখে কোন order-এর কত টাকা courier পরিশোধ করেছে (payment batch/invoice নম্বর সহ)। | P0 |
| CUR-27 | "Delivered কিন্তু টাকা আসেনি" তালিকা ও N দিনের বেশি পুরনো পাওনার সতর্কতা। | P0 |
| CUR-28 | Courier-এর হিসাব ও আমাদের হিসাবের অমিল (reconciliation mismatch) চিহ্নিত করা (যেমন COD পরিমাণ ভিন্ন)। | P1 |
| CUR-29 | Courier-ভিত্তিক পারফরম্যান্স রিপোর্ট: delivery rate, return rate, গড় delivery সময়, জেলা-ভিত্তিক সাফল্য। | P1 |

### ১০.৫ Standard Status Mapping (উদাহরণ)

| আমাদের স্ট্যান্ডার্ড Status | Courier-এর সম্ভাব্য status (উদাহরণ) | চূড়ান্ত (Final)? |
| --- | --- | --- |
| Booked | Pending, Created, Pickup Requested | না |
| Picked Up | Picked Up, Received at Hub | না |
| In Transit | In Transit, At Hub, Out for Delivery | না |
| Delivery Attempted / On Hold | Hold, Delivery Failed, Customer Unreachable | না |
| Delivered | Delivered | হ্যাঁ (তবে payment বাকি থাকতে পারে) |
| Partially Delivered | Partial Delivery | হ্যাঁ |
| Return In Transit | Return Initiated, Returning | না |
| Returned | Returned to Merchant | হ্যাঁ |
| Cancelled | Cancelled | হ্যাঁ |

(Courier-এর আসল status নাম ভিন্ন হতে পারে; Sprint 0-এ প্রতিটির জন্য প্রকৃত তালিকা নিশ্চিত করে mapping চূড়ান্ত হবে।)

### ১০.৬ Acceptance Criteria (নমুনা)

- Courier থেকে "Delivered" status আসার ৩০ মিনিটের মধ্যে order-এর status ও dashboard-এর সংখ্যা আপডেট হবে।
- একটি order-এর COD ৳১,৫০০ হলে, courier-এর delivery charge ৳৬০ ও COD fee ৳১৫ কাটার পর নিট প্রাপ্য ৳১,৪২৫ হিসেবে দেখাবে (নমুনা সংখ্যা)।
- নতুন courier-এর status কোড অজানা হলে system ক্র্যাশ করবে না; "Unmapped" হিসেবে সংরক্ষণ হবে ও অ্যাডমিন ড্যাশবোর্ডে দেখাবে।

## ১১. Module 5: Meta → Order → Delivery Funnel Tracking

**উদ্দেশ্য:** এটি product-এর সবচেয়ে গুরুত্বপূর্ণ মডিউল। এখানে Meta ad-এর ফলাফলকে সত্যিকারের order ও delivery-র সাথে যুক্ত করা হয় যাতে ব্যবসায়ী দেখেন: "Meta থেকে কত order এলো → কত confirmed → কত courier-এ গেল → কত delivered/returned"।

### ১১.১ Funnel-এর ধাপ

| ধাপ | সংজ্ঞা | তথ্যের উৎস |
| --- | --- | --- |
| 1. Ad Spend ও Click | বিজ্ঞাপনে খরচ, impression, click | Meta API |
| 2. Meta-reported Purchase/Lead | Meta যা order হিসেবে গণনা করেছে | Meta API |
| 3. Platform Order (Attributed) | আমাদের সিস্টেমে আসা এবং Meta-র সাথে যুক্ত order | Order source + attribution |
| 4. Confirmed | স্টাফ যাচাই করে confirm করেছেন | Order lifecycle |
| 5. Sent to Courier | Courier-এ পাঠানো | Courier module |
| 6. Delivered | Customer পেয়েছেন | Courier sync |
| 7. Payment Collected | COD-এর টাকা পাওয়া গেছে | Courier payment sync |
| বিকল্প পথ | Cancelled (confirm-এর আগে/পরে), Returned/RTO, Failed | Order + Courier |

প্রতিটি ধাপে সংখ্যা, মোট টাকার পরিমাণ এবং আগের ধাপ থেকে **drop-off %** দেখানো হবে।

### ১১.২ Attribution: Order কোন Campaign থেকে এসেছে?

এটি এই module-এর সবচেয়ে কঠিন অংশ। Facebook/Instagram থেকে আসা order নির্দিষ্ট campaign-এর সাথে যুক্ত করার জন্য একাধিক পদ্ধতি থাকবে। সিস্টেম প্রতিটি order-এ সর্বোচ্চ বিশ্বাসযোগ্য পদ্ধতিটি ব্যবহার করবে এবং কতটা নিশ্চিত তা (confidence) চিহ্নিত করবে।

| অগ্রাধিকার | পদ্ধতি | Confidence | মন্তব্য |
| --- | --- | --- | --- |
| 1 | **UTM parameter** (utm\_campaign, utm\_content ইত্যাদিতে Meta-র campaign/ad ID, URL-এ dynamic parameter `{{campaign.id}}`, `{{adset.id}}`, `{{ad.id}}`) | High | ব্যবহারকারীকে ad URL-এ UTM টেমপ্লেট সেট করতে হবে; আমরা তৈরি করে দেব |
| 2 | **fbclid ও landing-page tracking** (ছোট tracking script/WooCommerce plugin) | Medium–High | Order-এর সময় সংরক্ষিত click ID, referrer |
| 3 | **Meta Pixel/CAPI order matching** (purchase event-এর event ID ও order ID মিলানো) | Medium | Pixel ইভেন্টে order ID পাঠালে মেলানো যায় |
| 4 | **Messenger/WhatsApp order:** Click-to-Message ad-এর conversation ID বা স্টাফ order নেওয়ার সময় ড্রপডাউনে campaign/source বেছে নেন | Medium (ম্যানুয়াল) | F-commerce-এ সবচেয়ে বাস্তবসম্মত |
| 5 | **Time-based estimation (fallback):** যে order-এর source অজানা, তা নির্দিষ্ট দিনের Meta spend-এর অনুপাতে বণ্টন | Low | স্পষ্ট "Estimated" লেবেল সহ; চাইলে বন্ধ করা যাবে |

| ID | Requirement | Priority |
| --- | --- | --- |
| FUN-01 | প্রতিটি order-এ attribution source, campaign/ad set/ad (যদি পাওয়া যায়) এবং confidence লেভেল সংরক্ষিত থাকবে। | P0 |
| FUN-02 | UTM Builder টুল: ব্যবহারকারী campaign বেছে নিলে সঠিক URL parameter তৈরি হয়ে কপি করা যাবে। | P0 |
| FUN-03 | WooCommerce-এর জন্য ছোট tracking plugin/snippet (UTM, fbclid, landing page ক্যাপচার করে order meta-তে সংরক্ষণ)। | P0 |
| FUN-04 | "Unattributed order" তালিকা ও ম্যানুয়ালি campaign বসানোর সুবিধা। | P0 |
| FUN-05 | Attribution-এর স্বাস্থ্য সূচক: মোট order-এর কত % attributed (লক্ষ্য ≥ ৭০%)। | P0 |
| FUN-06 | ব্যবহারকারী attribution window (যেমন click-এর ৭ দিন) ও fallback estimation চালু/বন্ধ করতে পারবেন। | P1 |
| FUN-07 | Meta-reported purchase বনাম আমাদের attributed order এবং delivered order — পাশাপাশি তুলনা ("Meta ৩২০ বলছে, আসলে ডেলিভারি ১৮৫")। | P0 |

### ১১.৩ Funnel Dashboard-এর বিষয়বস্তু

- **Funnel Chart:** উপরের ধাপগুলো সংখ্যা ও drop-off সহ।
- **Filter:** তারিখ, campaign, ad set, ad, product, courier, জেলা।
- **Cohort দৃষ্টিভঙ্গি:** "order তারিখ" ধরে দেখা (কোন দিনের order-এর শেষ পরিণতি কী হলো)। Delivery ও return হতে কয়েকদিন সময় লাগে বলে সাম্প্রতিক দিনের সংখ্যা "অসম্পূর্ণ (maturing)" হিসেবে চিহ্নিত থাকবে।
- **Campaign Table:** প্রতি campaign-এর: Spend, Orders, Confirm %, Delivered %, Return %, Delivered Revenue, Actual ROAS, Actual CPA (প্রতি delivered order-এ খরচ), Net Profit।

### ১১.৪ Key Metrics-এর সংজ্ঞা

```latex
\text{Confirm Rate} = \frac{\text{Confirmed Orders}}{\text{Total Attributed Orders}}
```

```latex
\text{Delivery Rate} = \frac{\text{Delivered Orders}}{\text{Sent to Courier}}
```

```latex
\text{Return Rate} = \frac{\text{Returned Orders}}{\text{Sent to Courier}}
```

```latex
\text{Actual ROAS} = \frac{\text{Delivered Revenue}}{\text{Ad Spend}}
```

```latex
\text{Actual CPA} = \frac{\text{Ad Spend}}{\text{Delivered Orders}}
```

```latex
\text{Break-even ROAS} = \frac{\text{Average Selling Price}}{\text{Average Selling Price} - \text{COGS} - \text{Shipping and Other Variable Costs}}
```

প্রথম পাঁচটি সূত্রের হিসাব **order তারিখ** ধরে করা হবে (cohort), যাতে একই মাসের order ও তার ad খরচ মিলে যায়। "Delivered" গণনায় courier-এ আংশিক ডেলিভারি হলে প্রকৃত collected মূল্য ধরা হবে।

### ১১.৫ Acceptance Criteria (নমুনা)

- Meta-র একটি campaign-এর ১০০টি order-এর মধ্যে ৮০টি UTM দিয়ে সঠিকভাবে যুক্ত হলে attribution rate ৮০% দেখাবে।
- Funnel-এর প্রতিটি ধাপের সংখ্যায় ক্লিক করলে ঐ order-এর তালিকা (drill-down) খুলবে এবং তালিকার সংখ্যা funnel-এর সাথে মিলবে।
- সাম্প্রতিক ৫ দিনের order-এ "maturing" ব্যাজ দেখাবে, যাতে ব্যবহারকারী অসম্পূর্ণ data দেখে ভুল সিদ্ধান্ত না নেন।

## ১২. Module 6: Product Management

**উদ্দেশ্য:** ওয়েবসাইটের product স্বয়ংক্রিয়ভাবে sync করা, প্রতিটি product-এর **cost** (ক্রয়মূল্য) যুক্ত করা এবং product-ওয়াইজ sales, order, delivery, return ও আসল profit দেখানো।

### ১২.১ Product Sync

| ID | Requirement | Priority |
| --- | --- | --- |
| PRD-01 | সংযুক্ত store (WooCommerce) থেকে product, variant, SKU, ছবি, দাম, ক্যাটাগরি স্বয়ংক্রিয়ভাবে আনা হবে। | P0 |
| PRD-02 | Product তৈরি/সম্পাদনা/মুছলে webhook বা নিয়মিত sync-এ আপডেট হবে। | P0 |
| PRD-03 | Manual product তৈরি (যাদের website নেই) এবং CSV import। | P0 |
| PRD-04 | Variable product (সাইজ, রঙ) variant-স্তরে সংরক্ষিত হবে। | P0 |
| PRD-05 | Order line item সবসময় product/variant-এর সাথে যুক্ত থাকবে; product মুছে গেলেও পুরনো order-এর তথ্য অক্ষত থাকবে (snapshot)। | P0 |
| PRD-06 | একই product একাধিক store বা SKU-তে থাকলে ম্যানুয়ালি merge করার সুবিধা। | P1 |

### ১২.২ Cost Management

Website-এ সাধারণত product-এর ক্রয়মূল্য (COGS) থাকে না, তাই এটি আমাদের প্ল্যাটফর্মে ইনপুট দিতে হবে। এটি সঠিক profit-এর জন্য অত্যন্ত গুরুত্বপূর্ণ।

| ID | Requirement | Priority |
| --- | --- | --- |
| PRD-10 | প্রতিটি product/variant-এ **Cost Price** (ক্রয়/উৎপাদন খরচ) ইনপুট। | P0 |
| PRD-11 | অতিরিক্ত per-unit খরচ: packaging, labeling, handling (ঐচ্ছিক)। | P0 |
| PRD-12 | Bulk cost আপডেট (CSV বা তালিকায় এডিট)। | P0 |
| PRD-13 | **Cost History:** cost-এর বদল তারিখসহ সংরক্ষিত; পুরনো order পুরনো cost-এ এবং নতুন order নতুন cost-এ হিসাব হবে (order-এর সময়কার cost snapshot)। | P0 |
| PRD-14 | Cost না দেওয়া product-এর জন্য সতর্কতা: "এই product-এর cost নেই, profit অসম্পূর্ণ"; ড্যাশবোর্ডে cost coverage % দেখানো। | P0 |
| PRD-15 | ডিফল্ট cost % (যেমন বিক্রয়মূল্যের ৫০%) অস্থায়ী অনুমান হিসেবে ব্যবহারের বিকল্প, স্পষ্ট "Estimated" লেবেল সহ। | P1 |
| PRD-16 | Bundle/combo product-এর cost উপাদান থেকে স্বয়ংক্রিয় হিসাব। | P2 |

### ১২.৩ Product Analytics

প্রতিটি product-এর জন্য নির্বাচিত সময়ে:

| Metric | সংজ্ঞা |
| --- | --- |
| Orders / Units Sold | মোট order ও একক |
| Gross Sales | বিক্রয়মূল্য × পরিমাণ (delivered ও অ-delivered আলাদা) |
| Delivered Units ও Revenue | সফলভাবে ডেলিভারি হওয়া |
| Return / Cancel Rate | ফেরত ও বাতিলের হার |
| COGS | delivered unit × cost (return-এর পণ্য সাধারণত stock-এ ফেরে; ক্ষতিগ্রস্ত হলে আলাদা ধরা যাবে) |
| Allocated Ad Cost | এই product-এর campaign/ad-এর বণ্টিত খরচ |
| Allocated Courier Cost | delivery + return charge-এর অংশ |
| Net Profit ও Margin % | চূড়ান্ত লাভ ও মার্জিন |
| Profit per Unit | প্রতি ইউনিটে আসল লাভ |

**Ad Cost বণ্টন (Allocation):** একটি campaign একাধিক product বিক্রি করলে খরচ ভাগ করার নিয়ম লাগবে। MVP-তে প্রস্তাবিত নিয়ম:

1. যদি campaign/ad কোনো একটি product-এর সাথে ট্যাগ করা থাকে (ADS-26), তাহলে ১০০% খরচ ঐ product-এ।
2. ট্যাগ না থাকলে, ঐ campaign-এ attributed order-এর পণ্য-রাজস্বের অনুপাতে খরচ বণ্টন।
3. যে খরচ কোনো campaign-এ যুক্ত নয় (যেমন page boost), সেটি "Unallocated" হিসেবে সামগ্রিক P&L-এ যাবে, product-এ নয়।

| ID | Requirement | Priority |
| --- | --- | --- |
| PRD-20 | Product তালিকা: sort ও filter (সবচেয়ে লাভজনক, সবচেয়ে ক্ষতিকর, বেশি return)। | P0 |
| PRD-21 | Product Detail: trend chart, order তালিকা, কোন campaign থেকে বিক্রি হচ্ছে, কোন courier-এ return বেশি। | P1 |
| PRD-22 | "Hero product" ও "Loss-making product" স্বয়ংক্রিয় চিহ্ন। | P1 |
| PRD-23 | Category-ভিত্তিক সারাংশ। | P1 |
| PRD-24 | Stock সংখ্যা পড়ে (read-only) দেখানো; low-stock সতর্কতা (পুরো inventory management নয়)। | P2 |
| PRD-25 | Export (CSV/Excel)। | P1 |

## ১৩. Module 7: Profit & Loss Engine

**উদ্দেশ্য:** Ad cost, product cost, courier cost ও অন্যান্য খরচ বাদ দিয়ে আসল revenue ও profit/loss দৈনিক, সাপ্তাহিক ও মাসিক ভিত্তিতে দেখানো। ক্লায়েন্টের মূল চাহিদা "হাতে হিসাব না করে এক নজরে লাভ-লোকসান"।

### ১৩.১ P&L-এর কাঠামো (Waterfall)

| লাইন | বিবরণ | উৎস |
| --- | --- | --- |
| (+) Gross Sales | সব order-এর মোট বিক্রয়মূল্য (তথ্যের জন্য) | Orders |
| (−) Cancelled & Returned | বাতিল ও ফেরত order-এর মূল্য | Orders + Courier |
| (=) **Delivered Revenue** | সফলভাবে ডেলিভারি হওয়া order-এর আয় (P&L-এর ভিত্তি) | Courier sync |
| (−) Product Cost (COGS) | delivered পণ্যের ক্রয়মূল্য | Product cost snapshot |
| (=) **Gross Profit** | Revenue − COGS | গণনা |
| (−) Courier Charges | delivery charge + COD fee + return charge (return-এর ডেলিভারি চার্জও ব্যবসার খরচ) | Courier sync |
| (−) Packaging ও Handling | per-unit বা per-order | Product/Settings |
| (−) Payment Gateway Fees | অনলাইন পেমেন্টে (bKash/কার্ড) ফি | Manual/Settings |
| (−) **Ad Spend** | Meta (ও ভবিষ্যতে Google, অন্যান্য) | Ads module |
| (=) **Contribution Profit** | পরিবর্তনশীল সব খরচের পর লাভ | গণনা |
| (−) Operating Expenses | স্টাফ বেতন, অফিস ভাড়া, সফটওয়্যার, ইউটিলিটি, অন্যান্য | Manual/Recurring |
| (=) **Net Profit / Loss** | চূড়ান্ত লাভ বা ক্ষতি | গণনা |

```latex
\text{Net Profit} = R_{delivered} - COGS - C_{courier} - C_{pack} - C_{gateway} - S_{ads} - E_{opex}
```

যেখানে R = Delivered Revenue, C = পরিবর্তনশীল খরচ, S = ad spend, E = operating expense।

### ১৩.২ গুরুত্বপূর্ণ হিসাব-নীতি (Business Rules)

এই নিয়মগুলো ক্লায়েন্টের সাথে নিশ্চিত করতে হবে, কারণ এতেই সংখ্যা বদলে যায়।

| # | বিষয় | প্রস্তাবিত নিয়ম |
| --- | --- | --- |
| 1 | Revenue কখন গণনা হবে? | **Delivered** হওয়ার তারিখে (cash basis দেখতে চাইলে Payment Collected তারিখে)। ব্যবহারকারী Settings-এ "Delivery date basis" বা "Order date basis" বেছে নিতে পারবেন। |
| 2 | ad খরচ কোন দিনে ধরা হবে? | যে দিন খরচ হয়েছে (Meta-র তারিখ)। |
| 3 | দুটি ভিউ | **Order-date (cohort) view:** ঐ দিনের order-এর শেষ পরিণতি ও ঐ দিনের ad খরচ, ad কার্যকারিতা বোঝার জন্য সেরা। **Delivery-date (cash/accrual) view:** ঐ দিন যা delivered হলো, হিসাবরক্ষণের জন্য। |
| 4 | Return-এর খরচ | Return হলে revenue ও COGS বাদ (পণ্য stock-এ ফিরলে), কিন্তু courier-এর delivery ও return charge খরচ হিসেবে থাকে। |
| 5 | Partial delivery | প্রকৃত collected মূল্য ও delivered পণ্যের COGS ধরা হবে। |
| 6 | Discount ও coupon | Revenue থেকে আগেই বাদ (নিট বিক্রয়মূল্য ধরে)। |
| 7 | Courier-এর টাকা এখনো আসেনি | Delivered revenue ধরা হবে, কিন্তু "Receivable (পাওনা)" আলাদা দেখানো হবে। |
| 8 | Currency | ভিত্তি মুদ্রা BDT; USD ad account হলে ঐ দিনের রূপান্তর হারে। ব্যবহারকারী হার ম্যানুয়ালি সেট বা সংশোধন করতে পারবেন। |
| 9 | VAT/Tax | MVP-তে নয়; সেটিংসে ঐচ্ছিক "ট্যাক্স %" খরচ হিসেবে যোগ করা যাবে (P2)। |
| 10 | অসম্পূর্ণ data | Cost বা courier charge অনুপস্থিত হলে "Estimated/Incomplete" ব্যাজ ও কত % data সম্পূর্ণ তা দেখানো। |

### ১৩.৩ Expense Management

| ID | Requirement | Priority |
| --- | --- | --- |
| PNL-01 | Expense category তালিকা (প্রিসেট + কাস্টম): স্টাফ, ভাড়া, ইন্টারনেট, সফটওয়্যার, ফটোগ্রাফি/কনটেন্ট, মার্কেটিং (অ-Meta), ট্রান্সপোর্ট, অন্যান্য। | P0 |
| PNL-02 | ম্যানুয়াল expense এন্ট্রি: তারিখ, পরিমাণ, ক্যাটাগরি, নোট, ঐচ্ছিক রসিদের ছবি। | P0 |
| PNL-03 | **Recurring expense:** মাসিক/সাপ্তাহিক স্বয়ংক্রিয় এন্ট্রি (যেমন বেতন, ভাড়া)। | P1 |
| PNL-04 | মাসিক খরচকে দৈনিক/সাপ্তাহিক P&L-এ **আনুপাতিক বণ্টন** (যেমন ৳৩০,০০০ ভাড়া ÷ ৩০ দিন)। | P0 |
| PNL-05 | Expense CSV import। | P1 |
| PNL-06 | অন্য channel-এর ad খরচ (Google, TikTok, influencer) ম্যানুয়ালি বা API দিয়ে। | P0 (ম্যানুয়াল), P1 (API) |
| PNL-07 | Product/campaign-এ সরাসরি খরচ ট্যাগ করা। | P2 |

### ১৩.৪ Report ও View

| ID | Requirement | Priority |
| --- | --- | --- |
| PNL-10 | P&L ড্যাশবোর্ড: দৈনিক, সাপ্তাহিক, মাসিক, কাস্টম রেঞ্জ। | P0 |
| PNL-11 | Summary কার্ড: Delivered Revenue, Gross Profit, Ad Spend, Net Profit, Net Margin %, ROAS, Break-even অবস্থা। | P0 |
| PNL-12 | Waterfall চার্ট (Revenue থেকে Net Profit-এ কীভাবে নামল) ও দৈনিক profit/loss bar চার্ট (লাভ সবুজ, ক্ষতি লাল)। | P0 |
| PNL-13 | প্রতিটি লাইনে ক্লিক করে drill-down (যেমন Courier Charge → order-ওয়াইজ তালিকা)। | P0 |
| PNL-14 | সময়কাল তুলনা (এই সপ্তাহ বনাম গত সপ্তাহ, % বদল)। | P0 |
| PNL-15 | Break-even বিশ্লেষণ: লাভ করতে মাসে কত order বা কত ROAS দরকার। | P1 |
| PNL-16 | Campaign-ওয়াইজ, Product-ওয়াইজ, Courier-ওয়াইজ, জেলা-ওয়াইজ P&L। | P0 (campaign/product), P1 (বাকি) |
| PNL-17 | Excel/PDF export; সাপ্তাহিক/মাসিক P&L ইমেইলে স্বয়ংক্রিয় পাঠানো। | P1 |
| PNL-18 | "What-if" সিমুলেটর: return rate বা ad খরচ বদলালে লাভ কত বদলাবে। | P2 |

### ১৩.৫ একটি সংখ্যাগত উদাহরণ (একটি দিন)

| লাইন | পরিমাণ (৳) |
| --- | --- |
| Gross Sales (৮০টি order) | ১,২০,০০০ |
| Cancelled ও Returned (২৫টি order) | −৩৭,৫০০ |
| **Delivered Revenue (৫৫টি order)** | **৮২,৫০০** |
| Product Cost | −৩৩,০০০ |
| **Gross Profit** | **৪৯,৫০০** |
| Courier (delivery + COD fee + return charge) | −৮,২০০ |
| Packaging | −১,৬৫০ |
| Ad Spend | −২২,০০০ |
| **Contribution Profit** | **১৭,৬৫০** |
| Operating Expense (দৈনিক অংশ) | −১৫,০০০ |
| **Net Profit** | **২,৬৫০** |

(সংখ্যা শুধু বোঝানোর জন্য কাল্পনিক। এখানে Meta-র দেখানো ROAS ভালো দেখালেও আসল Net Margin মাত্র \~৩.২%। এই ধরনের অন্তর্দৃষ্টিই product-এর মূল্য।)

### ১৩.৬ Acceptance Criteria (নমুনা)

- P&L-এর যেকোনো সংখ্যায় ক্লিক করলে তার সমর্থক order/expense তালিকা খুলবে এবং যোগফল মিলবে।
- একই তারিখ-পরিসরের জন্য Order-date view ও Delivery-date view-এর সংজ্ঞা UI-তে স্পষ্ট ব্যাখ্যা সহ থাকবে।
- Cost না থাকা product-এর কারণে P&L অসম্পূর্ণ হলে পেজের শীর্ষে সতর্কতা ও "Complete data" লিংক দেখাবে।
- মাসিক expense ৳৩০,০০০ দেওয়ার পর ৩০ দিনের মাসে প্রতিদিনের P&L-এ ৳১,০০০ করে খরচ ধরা হবে।

## ১৪. Module 8: Customer CRM ও Follow-up

**উদ্দেশ্য:** Delivered customer-দের একটি ডাটাবেস গড়ে তোলা, তাদের কেনাকাটার ইতিহাস রাখা, repeat customer চিহ্নিত করা এবং follow-up কাজ সহজ করা।

### ১৪.১ Customer Profile তৈরি

| ID | Requirement | Priority |
| --- | --- | --- |
| CRM-01 | প্রতিটি order থেকে customer স্বয়ংক্রিয়ভাবে তৈরি/আপডেট হবে। **ফোন নম্বর (নর্মালাইজড, যেমন +8801XXXXXXXXX) প্রধান unique key**; কারণ বাংলাদেশে ইমেইল প্রায়ই থাকে না। | P0 |
| CRM-02 | একই ফোন ভিন্ন নামে এলে একই customer ধরা হবে; একাধিক ঠিকানা সংরক্ষিত থাকবে। | P0 |
| CRM-03 | Customer ডিটেইলে: নাম, ফোন, ঠিকানা, প্রথম ও শেষ order তারিখ, মোট order সংখ্যা (delivered/returned/cancelled আলাদা), মোট ব্যয়, গড় order মূল্য, উৎস (প্রথম কোন campaign/channel থেকে এসেছে)। | P0 |
| CRM-04 | Purchase History: প্রতিটি order, product, status, তারিখ। | P0 |
| CRM-05 | **Delivered Customer** তালিকা: কেবল সফলভাবে পণ্য পাওয়া customer (follow-up ও automation-এর ভিত্তি)। | P0 |
| CRM-06 | ম্যানুয়াল tag ও নোট (যেমন VIP, অভিযোগ করেছেন), ইন্টারনাল কমেন্ট। | P0 |
| CRM-07 | Customer import (CSV) ও export। | P1 |

### ১৪.২ Segmentation ও Repeat Tracking

| ID | Requirement | Priority |
| --- | --- | --- |
| CRM-10 | **Repeat Customer** চিহ্ন: ২+ delivered order; Repeat Rate মেট্রিক ও trend। | P0 |
| CRM-11 | স্বয়ংক্রিয় segment: New, Repeat, VIP (বেশি ব্যয়), At-risk (X দিন order নেই), Lapsed। X ও সীমা সেটিংসে বদলানো যাবে। | P1 |
| CRM-12 | **RFM বিশ্লেষণ** (Recency, Frequency, Monetary) ও segment-ভিত্তিক চার্ট। | P2 |
| CRM-13 | কাস্টম segment filter (জেলা, product, মোট ব্যয়, শেষ order কবে, source campaign)। Segment সংরক্ষণ করে automation-এ ব্যবহারযোগ্য। | P1 |
| CRM-14 | **Customer Lifetime Value (LTV)** ও LTV বনাম CAC (acquisition cost) তুলনা, যেটি ad সিদ্ধান্তে কাজে আসে। | P2 |
| CRM-15 | Cohort retention চার্ট (প্রথম order মাস অনুযায়ী পরের মাসগুলোয় কতজন ফিরলেন)। | P2 |

### ১৪.৩ Risk ও Blacklist

বাংলাদেশের COD ব্যবসায় বারবার return করা customer বড় ক্ষতির উৎস।

| ID | Requirement | Priority |
| --- | --- | --- |
| CRM-20 | Customer-ভিত্তিক Return/Cancel ইতিহাস ও Risk Score (যেমন কম/মাঝারি/বেশি ঝুঁকি)। | P1 |
| CRM-21 | Order আসার সময় সতর্কতা: "এই নম্বর থেকে আগে ৩টি order return হয়েছে"। | P1 |
| CRM-22 | ব্যবহারকারী নিজের workspace-এ customer "Blacklist" করতে পারবেন; blacklisted নম্বরের নতুন order-এ চিহ্ন। | P1 |
| CRM-23 | ক্রস-মার্চেন্ট (সব ব্যবসায়ীর ডাটা মিলিয়ে) risk ডাটাবেস আইনি ও গোপনীয়তার কারণে MVP-তে **নয়**। এটি ভবিষ্যতের গবেষণা বিষয়। | P2 |

### ১৪.৪ Follow-up

| ID | Requirement | Priority |
| --- | --- | --- |
| CRM-30 | Follow-up কাজ (Task): customer-এর সাথে কাজ তৈরি ("৭ দিন পর ফোন করুন"), assignee, তারিখ, স্ট্যাটাস। | P1 |
| CRM-31 | আজকের Follow-up তালিকা (Dashboard উইজেট)। | P1 |
| CRM-32 | Customer-এর যোগাযোগ ইতিহাস (SMS/WhatsApp পাঠানো মেসেজসহ) এক টাইমলাইনে। | P1 |
| CRM-33 | Customer-কে সরাসরি ফোন/WhatsApp খোলার লিংক (click-to-call, wa.me)। | P0 |

### ১৪.৫ গোপনীয়তা ও সম্মতি

- Customer-এর data সম্পূর্ণ সেই workspace-এর (tenant)। অন্য কোনো workspace এটি দেখতে পারবে না।
- Marketing SMS/WhatsApp-এ **Opt-out (সদস্যতা বাতিল)** সমর্থন বাধ্যতামূলক (সেকশন ১৫)।
- Customer ডেটা মুছে ফেলার অনুরোধ (delete/anonymize) পূরণের সুবিধা থাকবে।
- স্থানীয় ডাটা সুরক্ষা আইন ও Meta-র ডাটা নীতি মেনে চলা হবে (সেকশন ২১)।

## ১৫. Module 9: SMS / WhatsApp Automation

**উদ্দেশ্য:** Order ও delivery-র বিভিন্ন ঘটনায় customer-কে স্বয়ংক্রিয়ভাবে SMS বা WhatsApp মেসেজ পাঠানো এবং ভবিষ্যতে review, repeat order ও promotional automation যোগ করার ভিত্তি তৈরি করা।

### ১৫.১ Messaging Channel

| Channel | Phase | মন্তব্য |
| --- | --- | --- |
| SMS (স্থানীয় gateway, ব্যবহারকারীর নিজস্ব বা প্ল্যাটফর্মের কেনা credit) | P0 | বাংলাদেশে SMS-এর জন্য একাধিক স্থানীয় gateway/aggregator আছে; Sprint 0-এ বাছাই। Masking/Non-masking sender ID, BTRC-এর নিয়ম ও template অনুমোদন যাচাই লাগবে |
| WhatsApp Business Platform (Cloud API) | P1 | Template message অনুমোদন (Meta), 24 ঘণ্টার বাইরে শুধু template; ফোন নম্বর ও Business verification লাগবে |
| ইমেইল | P2 | কম জনপ্রিয় কিন্তু সহজ |
| Messenger | P2 | Meta-র নীতির সীমাবদ্ধতা আছে |

### ১৫.২ Automation Trigger ও Flow

প্রতিটি automation = **Trigger** + **শর্ত (Condition)** + **বিলম্ব (Delay)** + **Action (মেসেজ)**।

| Trigger | নমুনা Automation | Phase |
| --- | --- | --- |
| Order Confirmed | "আপনার order কনফার্ম হয়েছে, ধন্যবাদ।" | P1 |
| Sent to Courier | "আপনার পার্সেল পাঠানো হয়েছে, ট্র্যাকিং: …" | P1 |
| **Delivered** | Delivered হওয়ার ২ ঘণ্টা পর: ধন্যবাদ বার্তা | **P0** |
| Delivered + N দিন | ৩ দিন পর: পণ্য কেমন লেগেছে, review লিংক | P1 |
| Delivered + N দিন | ৩০ দিন পর: repeat order অনুস্মারক ও ডিসকাউন্ট কোড | P2 |
| Delivery Failed/On Hold | "আমাদের courier আপনার সাথে যোগাযোগ করতে পারেনি" | P1 |
| Returned | সৌজন্য বার্তা ও কারণ জানতে চাওয়া | P2 |
| Customer Segment-এ প্রবেশ (VIP, At-risk) | নির্দিষ্ট অফার | P2 |
| Manual Campaign (promotional) | নির্বাচিত segment-এ একসাথে বার্তা | P2 |

### ১৫.৩ Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| MSG-01 | SMS gateway সংযোগ: ব্যবহারকারী নিজের gateway credential দেবেন, অথবা প্ল্যাটফর্মের credit কিনবেন (Phase 2)। | P0 |
| MSG-02 | Message Template এডিটর: বাংলা/ইংরেজি, **ভেরিয়েবল** ({{customer\_name}}, {{order\_id}}, {{product\_name}}, {{tracking\_link}}, {{shop\_name}}), অক্ষর ও SMS সংখ্যা কাউন্টার (বাংলা ইউনিকোড SMS-এ প্রতি পার্টে কম অক্ষর, তাই খরচ বেশি; সতর্কতা দেখানো)। | P0 |
| MSG-03 | Automation Rule তৈরি ও চালু/বন্ধ: trigger, delay, শর্ত (যেমন order মূল্য > ৳১০০০, নির্দিষ্ট product)। | P0 |
| MSG-04 | **Delivered Customer-কে স্বয়ংক্রিয় মেসেজ:** Delivered status আসার পর নির্ধারিত বিলম্বে পাঠানো (MVP-র মূল automation)। | P0 |
| MSG-05 | একই customer-কে একই automation-এ একাধিকবার না পাঠানো (de-duplication) ও দৈনিক সর্বোচ্চ মেসেজ সীমা (frequency cap)। | P0 |
| MSG-06 | **Opt-out:** customer "STOP" বা সমমানের উত্তর দিলে বা ব্যবহারকারী নিজে চিহ্নিত করলে ভবিষ্যৎ marketing মেসেজ বন্ধ। Transactional (order আপডেট) ও Marketing আলাদা শ্রেণী। | P0 |
| MSG-07 | **Quiet hours:** রাত ৯টা থেকে সকাল ৮টা মেসেজ পাঠানো স্থগিত, পরে সকালে পাঠানো (কনফিগারযোগ্য)। | P1 |
| MSG-08 | Delivery Status ট্র্যাকিং: Sent, Delivered, Failed (গেটওয়ে রিপোর্ট অনুযায়ী), ব্যর্থতার কারণ। | P0 |
| MSG-09 | Message Log: কাকে, কখন, কোন automation, কী বার্তা, ফলাফল। Customer প্রোফাইলের টাইমলাইনেও দেখা যাবে। | P0 |
| MSG-10 | Credit/ব্যালেন্স ট্র্যাকিং ও কম হলে সতর্কতা; মেসেজের খরচ P&L-এ "Marketing/Retention Cost" হিসেবে যুক্ত হওয়ার বিকল্প। | P1 |
| MSG-11 | ব্যর্থ মেসেজ পুনরায় চেষ্টা (retry) নীতি। | P0 |
| MSG-12 | Test Send: নিজের নম্বরে নমুনা পাঠিয়ে দেখা। | P0 |
| MSG-13 | WhatsApp: Template অনুমোদনের অবস্থা দেখানো, template-এর বাইরে মেসেজ ব্লক। | P1 |
| MSG-14 | Review request: Delivered + N দিন পর review লিংক (Google/Facebook/ওয়েবসাইট) সহ মেসেজ; ক্লিক ট্র্যাকিং (ছোট লিংক)। | P1 |
| MSG-15 | Repeat order reminder ও কুপন কোড তৈরি/মেলানো (WooCommerce কুপন API)। | P2 |
| MSG-16 | Promotional Campaign: segment নির্বাচন, সময় নির্ধারণ, পরিমাণ ও খরচ আগাম দেখানো, অনুমোদনের পর পাঠানো। | P2 |
| MSG-17 | Automation-এর ফলাফল: কত মেসেজ গেল, কতজন পরে আবার order করলেন (সরল attribution: মেসেজের ৭ দিনের মধ্যে order)। | P2 |

### ১৫.৪ গুরুত্বপূর্ণ বিবেচনা

- **খরচ ও ROI:** প্রতিটি SMS-এর খরচ আছে। তাই ব্যবহারকারীকে আগেই দেখানো দরকার "এই campaign-এ ১,২০০ SMS, আনুমানিক খরচ ৳X"। Automation থেকে আসা repeat order-এর রাজস্ব দেখালে feature-টির মূল্য প্রমাণিত হয়।
- **অনুমতি:** WhatsApp-এ marketing মেসেজ পাঠাতে customer-এর opt-in প্রয়োজন হতে পারে; Meta-র নীতি যাচাই করে opt-in সংগ্রহের উপায় (যেমন checkout-এ checkbox) নির্ধারণ করা হবে।
- **ডেলিভারেবিলিটি:** স্পাম হিসেবে চিহ্নিত হওয়া এড়াতে ছোট, প্রাসঙ্গিক ও opt-out সহ বার্তা।
- **ভবিষ্যৎ সম্প্রসারণ:** Messaging provider একটি **adapter** হিসেবে বানানো হবে (সেকশন ১৮), যাতে নতুন gateway সহজে যোগ করা যায়।

### ১৫.৫ Acceptance Criteria (নমুনা)

- Delivered status আসার পর কনফিগার করা বিলম্বের (±২ মিনিট) মধ্যে মেসেজ queue-তে যাবে এবং gateway-তে পাঠানো হবে।
- Opt-out করা customer-কে marketing automation থেকে কখনো মেসেজ যাবে না, তবে transactional মেসেজ (নীতি অনুযায়ী) যেতে পারবে।
- Template-এ অসমর্থিত ভেরিয়েবল থাকলে সেভ করার সময় ত্রুটি দেখাবে।

## ১৬. Module 10: Business Analytics Dashboard ও AI Insights

**উদ্দেশ্য:** Sales, Ads, Orders, Delivery, Return, Revenue, Expense ও Profit সব একটি dashboard-এ দেখানো এবং AI দিয়ে ব্যবসার সামগ্রিক বিশ্লেষণ ও actionable পরামর্শ দেওয়া। ক্লায়েন্টের মূল চাহিদা ("graph wise, numeric wise সুন্দর করে দেখাবে") এই module-ই পূরণ করে।

### ১৬.১ Home Dashboard-এর বিন্যাস

প্রথম পেজে (উপর থেকে নিচে):

1. **শীর্ষ বার:** তারিখ নির্বাচক, store/ad account ফিল্টার, "সর্বশেষ sync" সময়, সতর্কতার ঘণ্টা।
2. **Hero কার্ড (বড়):** **Net Profit/Loss** (সবুজ বা লাল), আগের সময়ের সাথে তুলনা, Net Margin %।
3. **KPI সারি (৬–৮টি কার্ড):** Delivered Revenue, Ad Spend, Actual ROAS, Orders, Delivery Rate, Return Rate, Gross Profit, গড় order মূল্য।
4. **প্রধান চার্ট (দুটি):** (ক) দৈনিক Revenue বনাম Ad Spend বনাম Net Profit লাইন/বার চার্ট। (খ) Profit Waterfall।
5. **Funnel সারাংশ:** Meta Order → Confirmed → Courier → Delivered/Returned।
6. **সেরা ও সবচেয়ে খারাপ:** শীর্ষ ৫ campaign, শীর্ষ ৫ product (লাভ অনুযায়ী) ও ক্ষতিকর ৫টি।
7. **AI Insights প্যানেল:** আজকের ৩–৫টি গুরুত্বপূর্ণ পরামর্শ।
8. **অ্যালার্ট ও করণীয়:** pending order, "Delivered কিন্তু টাকা আসেনি", cost-অনুপস্থিত product, ব্যর্থ sync।
9. **Courier সারাংশ:** courier-ওয়াইজ delivery/return হার ও বকেয়া COD।
10. **Customer সারাংশ:** নতুন বনাম repeat, শীর্ষ customer।

### ১৬.২ Dashboard Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| DSH-01 | Home Dashboard উপরের বিন্যাস অনুযায়ী, লোড হতে ৩ সেকেন্ডের কম (cached aggregates)। | P0 |
| DSH-02 | তারিখ নির্বাচক সব widget-এ একসাথে প্রযোজ্য; আগের সময়ের সাথে তুলনা টগল। | P0 |
| DSH-03 | প্রতিটি সংখ্যা ও চার্ট ক্লিক করে drill-down (বিস্তারিত তালিকা বা সংশ্লিষ্ট পেজ)। | P0 |
| DSH-04 | চার্টের ধরন: line, bar, stacked bar, waterfall, funnel, pie/donut, heatmap (জেলা বা সময়ের হিসাবে), table। | P0 |
| DSH-05 | সবুজ = লাভ, লাল = ক্ষতি, কালার-ব্লাইন্ড বান্ধব বিকল্প (সংকেত চিহ্নসহ)। | P0 |
| DSH-06 | "Maturing data" (অসম্পূর্ণ সাম্প্রতিক সংখ্যা) স্পষ্ট চিহ্ন। | P0 |
| DSH-07 | মোবাইলে ব্যবহারযোগ্য (রেসপন্সিভ); মালিকরা প্রায়ই ফোনে দেখেন। | P0 |
| DSH-08 | দৈনিক সংক্ষিপ্ত রিপোর্ট ইমেইল/WhatsApp-এ (সকাল ৯টা: গতকালের Revenue, Ad Spend, Net Profit, শীর্ষ সমস্যা)। | P1 |
| DSH-09 | Custom Dashboard: widget সরানো, যোগ ও সরানো। | P2 |
| DSH-10 | Custom Report Builder: মেট্রিক ও ডাইমেনশন বেছে রিপোর্ট বানানো ও সংরক্ষণ। | P2 |
| DSH-11 | Scheduled Report (সাপ্তাহিক/মাসিক) ইমেইলে PDF/Excel। | P1 |
| DSH-12 | লক্ষ্য (Goal) নির্ধারণ: মাসিক বিক্রয়/লাভের লক্ষ্য ও অগ্রগতি বার। | P1 |
| DSH-13 | Role-ভিত্তিক দৃশ্য (মালিক পূর্ণ, মার্কেটার শুধু Ads ইত্যাদি)। | P1 |
| DSH-14 | Dark mode ও ভাষা পরিবর্তন (বাংলা/ইংরেজি)। | P1 |
| DSH-15 | Benchmark ও forecast (পরের ৭/৩০ দিনের অনুমান)। | P2 |

### ১৬.৩ বিশ্লেষণ পেজসমূহ

| পেজ | মূল চার্ট ও তথ্য |
| --- | --- |
| Sales Analysis | সময়ভিত্তিক বিক্রি, ঘণ্টা বনাম বার হিট-ম্যাপ, source-ওয়াইজ (Meta, Organic, Direct) |
| Ads Analysis | Spend, CPA, ROAS (Meta বনাম Actual), creative তুলনা |
| Delivery Analysis | Courier-ওয়াইজ ও জেলা-ওয়াইজ delivery/return হার, গড় delivery সময়, return-এর কারণ |
| Geo Analysis | জেলা/বিভাগ-ভিত্তিক order, return, লাভ (মানচিত্র বা বার চার্ট) |
| Customer Analysis | নতুন বনাম repeat, retention, LTV |
| Finance | P&L, expense বিভাজন (পাই), cash flow ও COD বকেয়া |

### ১৬.৪ AI Business Insights

Module 2 (Ad Analysis) যেখানে শুধু বিজ্ঞাপনে কেন্দ্রীভূত, এই অংশ সম্পূর্ণ ব্যবসার তথ্য মিলিয়ে বিশ্লেষণ করে।

| ID | Requirement | Priority |
| --- | --- | --- |
| INS-01 | **Daily Brief:** গতকালের ফলাফল, লাভ-ক্ষতির মূল কারণ, ও আজকের শীর্ষ ৩ করণীয়। | P0 |
| INS-02 | **Weekly/Monthly Business Review:** প্রবণতা, সেরা/খারাপ product, channel, courier, customer সেগমেন্ট। | P1 |
| INS-03 | ক্ষতির উৎস চিহ্নিতকরণ ("মোট ক্ষতির ৪৫% এসেছে return থেকে, ৩০% একটি campaign থেকে")। | P0 |
| INS-04 | Courier ও জেলা-ভিত্তিক পরামর্শ ("X জেলায় RedX-এর return ৪০%, Steadfast ১৮%")। | P1 |
| INS-05 | Cash flow সতর্কতা: বড় অংকের COD বকেয়া, পেমেন্ট দেরি। | P1 |
| INS-06 | Product সুপারিশ (কোথায় budget বাড়ানো/কমানো, কোন product বন্ধ করা)। | P1 |
| INS-07 | Customer সুপারিশ (repeat সম্ভাবনা বেশি এমন segment-এ প্রচারণা)। | P2 |
| INS-08 | Natural language প্রশ্ন ("গত মাসে কোন product-এ সবচেয়ে বেশি ক্ষতি হয়েছে?") ও উত্তর, ডেটা থেকে তৈরি কোয়েরি দিয়ে (সরাসরি LLM-এর অনুমান নয়)। | P2 |
| INS-09 | প্রতিটি insight-এ প্রমাণ (সংখ্যা ও লিংকড রিপোর্ট), confidence, এবং কর্ম (যেমন "campaign দেখুন" বাটন)। | P0 |
| INS-10 | Insight-এর স্ট্যাটাস: নতুন, দেখা হয়েছে, কাজ হয়েছে, বাতিল; পুনরাবৃত্ত একই insight অবরুদ্ধ। | P1 |

Module 2-এর Guardrails (সংখ্যা Rule Engine থেকে, PII LLM-এ নয়, read-only) এখানেও প্রযোজ্য।

### ১৬.৫ কর্মক্ষমতা ও ডাটা কৌশল

Dashboard দ্রুত রাখতে প্রতিটি পেজ সরাসরি কাঁচা order টেবিলে কোয়েরি করবে না। পরিবর্তে **দৈনিক/ঘণ্টাভিত্তিক aggregate টেবিল** (daily\_metrics: tenant × তারিখ × campaign × product × courier) রাতে ও ইভেন্টে আপডেট হবে। সাম্প্রতিক দিনের ডেটা (গত ৭ দিন) প্রতিবার order status বদলালে পুনর্গণনা হবে, কারণ delivery-র পর সংখ্যা বদলায়।

## ১৭. SaaS প্ল্যাটফর্ম: Multi-tenancy, Plan, Billing ও Role

### ১৭.১ Multi-tenancy

প্রতিটি ব্যবসা একটি আলাদা **Workspace (Tenant)**। এক ব্যবহারকারী একাধিক workspace-এর সদস্য হতে পারবেন (যেমন এজেন্সি যিনি অনেক ক্লায়েন্ট সামলান)।

| ID | Requirement | Priority |
| --- | --- | --- |
| SAAS-01 | সব ডাটা `tenant_id` দিয়ে বিচ্ছিন্ন; এক tenant কখনো আরেকের ডাটা দেখতে পাবে না (database-স্তরে Row-Level Security সহ)। | P0 |
| SAAS-02 | Signup: ইমেইল/ফোন + পাসওয়ার্ড, Google Login; ইমেইল যাচাই। | P0 |
| SAAS-03 | Onboarding Wizard: (১) ব্যবসার নাম, মুদ্রা, timezone (২) Store সংযোগ (৩) Meta সংযোগ (৪) Courier সংযোগ (৫) Product cost ইনপুট (৬) প্রথম dashboard। প্রতিটি ধাপ বাদ দিয়ে পরে করা যাবে; অগ্রগতি চেকলিস্ট দেখানো হবে। | P0 |
| SAAS-04 | **Agency Mode:** একটি লগইন থেকে একাধিক workspace পরিবর্তন; এজেন্সির জন্য আলাদা plan। | P2 |
| SAAS-05 | Workspace সেটিংস: ব্যবসার তথ্য, লোগো, মুদ্রা, timezone, Delivery/Order date basis (P&L), target CPA/ROAS, ভাষা। | P0 |
| SAAS-06 | Data export ও Workspace মুছে ফেলার অনুরোধ (retention নীতি মেনে)। | P1 |
| SAAS-07 | Sandbox/Demo workspace (নমুনা ডাটা দিয়ে) যাতে নতুন ব্যবহারকারী সংযোগ ছাড়াই পণ্য দেখতে পারেন। | P1 |

### ১৭.২ Roles ও Permissions

| Role | অ্যাক্সেস | মূল অনুমতি |
| --- | --- | --- |
| Owner | সম্পূর্ণ | সব কিছু, billing, সদস্য ব্যবস্থাপনা, workspace মুছে ফেলা |
| Admin | প্রায় সম্পূর্ণ | সব কিছু, billing ছাড়া |
| Marketer | Ads ও Funnel | Ads, Funnel, AI Analysis দেখা; P&L ও customer ফোন নম্বর সীমিত |
| Order Manager | Orders ও Courier | Order, courier dispatch, customer সীমিত; Ads খরচ ও P&L নয় |
| Accountant | Finance | P&L, expense, courier payment, export; Ads সম্পাদনা নয় |
| Viewer | শুধু পড়া | নির্বাচিত রিপোর্ট দেখা |

| ID | Requirement | Priority |
| --- | --- | --- |
| ROLE-01 | সদস্যকে ইমেইল/ফোনে আমন্ত্রণ ও role নির্ধারণ। | P0 |
| ROLE-02 | প্রতিটি API ও UI অ্যাকশনে permission যাচাই (server-side)। | P0 |
| ROLE-03 | Sensitive ডাটা (profit, cost, customer ফোন) role অনুযায়ী লুকানো/মাস্ক করার বিকল্প। | P1 |
| ROLE-04 | Custom role তৈরি। | P2 |
| ROLE-05 | Audit Log: কে কখন কী পরিবর্তন করেছে (cost বদল, order status override, credential বদল, export)। | P0 |
| ROLE-06 | দুই-স্তর যাচাই (2FA) অপশন। | P1 |

### ১৭.৩ Subscription Plan (প্রস্তাবিত কাঠামো)

মূল্য ও সীমা একটি **প্রস্তাব**; বাজার যাচাইয়ের পর চূড়ান্ত হবে। Pricing সাধারণত order ভলিউমের ভিত্তিতে করা হয়, কারণ ব্যবসার আকারের সাথে মূল্য মেলে।

| Plan | মাসিক order সীমা | Ad Account | সদস্য | বিশেষত্ব |
| --- | --- | --- | --- | --- |
| Free Trial (১৪ দিন) | ৫০০ | ১ | ২ | সব core feature, AI সীমিত |
| Starter | \~৫০০ | ১ | ৩ | Dashboard, P&L, ১টি courier, ১টি store, বেসিক AI |
| Growth | \~৩,০০০ | ৩ | ৮ | সব courier, CRM, SMS automation, সম্পূর্ণ AI |
| Pro | \~১০,০০০+ | ১০ | ২০ | Custom report, API অ্যাক্সেস, priority support |
| Agency / Enterprise | কাস্টম | কাস্টম | কাস্টম | একাধিক workspace, white-label (ভবিষ্যৎ), SLA |

অতিরিক্ত: SMS/WhatsApp credit আলাদা কিনতে হবে (pass-through + মার্জিন)। AI ব্যবহারের সীমা plan অনুযায়ী।

| ID | Requirement | Priority |
| --- | --- | --- |
| BILL-01 | Plan নির্বাচন, আপগ্রেড/ডাউনগ্রেড, মাসিক ও বার্ষিক বিলিং (ছাড় সহ)। | P0 |
| BILL-02 | বাংলাদেশি পেমেন্ট পদ্ধতি: bKash/Nagad/কার্ড (স্থানীয় payment gateway, যেমন SSLCommerz বা অনুরূপ); আন্তর্জাতিক গ্রাহকের জন্য Stripe। চূড়ান্ত gateway Sprint 0-এ নির্ধারিত। | P0 |
| BILL-03 | Trial শেষের ৩ ও ১ দিন আগে অনুস্মারক; Trial শেষে read-only মোড (ডাটা মোছা নয়)। | P0 |
| BILL-04 | Plan সীমা (order, ad account, সদস্য) পৌঁছালে সতর্কতা ও আপগ্রেড প্রস্তাব; সীমার বাইরে কী হবে তা স্পষ্ট নীতি (soft limit, grace)। | P0 |
| BILL-05 | ইনভয়েস/রসিদ তৈরি ও ডাউনলোড (VAT প্রযোজ্য হলে)। | P0 |
| BILL-06 | পেমেন্ট ব্যর্থ হলে dunning (পুনঃচেষ্টা ও ইমেইল), ৭ দিন grace, তারপর read-only। | P1 |
| BILL-07 | Coupon ও রেফারেল। | P2 |
| BILL-08 | সাবস্ক্রিপশন বাতিল ও ডাটা রাখার নীতি (যেমন ৯০ দিন পর মুছে ফেলা)। | P0 |

### ১৭.৪ Super Admin (প্ল্যাটফর্ম মালিকের প্যানেল)

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-01 | সব tenant-এর তালিকা, plan, ব্যবহার, শেষ সক্রিয়তা। | P0 |
| ADM-02 | Tenant-এর sync স্বাস্থ্য: ব্যর্থ job, token মেয়াদ, webhook ব্যর্থতা। | P0 |
| ADM-03 | Impersonation (সাপোর্টের জন্য, কারণ ও অডিট লগসহ, ব্যবহারকারীর সম্মতিতে)। | P1 |
| ADM-04 | Feature flag: নির্দিষ্ট tenant-এ নতুন feature চালু। | P1 |
| ADM-05 | Courier status mapping ও integration কনফিগ পরিচালনা। | P0 |
| ADM-06 | ব্যবসায়িক মেট্রিক: MRR, churn, trial-to-paid, AI খরচ, SMS খরচ। | P1 |
| ADM-07 | Announcement/ব্যানার ও সাপোর্ট টিকেট সংযোগ। | P2 |

## ১৮. Extensible Integration Framework

ক্লায়েন্টের একটি মূল দাবি: নতুন courier, marketing channel, e-commerce platform ও automation ভবিষ্যতে সহজে যোগ করা যাবে। এর সমাধান হলো **Adapter (Connector) আর্কিটেকচার**: প্রতিটি বাহ্যিক সিস্টেম একটি standard interface মেনে চলা আলাদা প্লাগইন। মূল সিস্টেম কখনো সরাসরি Pathao বা Meta-র নিজস্ব ফরম্যাট জানে না; জানে কেবল আমাদের standard model।

### ১৮.১ Connector-এর ধরন (Connector Types)

| ধরন | কাজ | বর্তমান ও ভবিষ্যৎ উদাহরণ |
| --- | --- | --- |
| Ad Channel | Spend ও performance data আনা | Meta (P0), Google Ads, TikTok Ads, Snapchat Ads |
| Order Source / Commerce | Order, product, customer আনা; status ফেরত পাঠানো | WooCommerce (P0), Shopify, Custom API, Daraz |
| Courier | Booking, status, COD, settlement | Steadfast, Pathao, RedX (P0), Paperfly, eCourier |
| Messaging | SMS, WhatsApp, ইমেইল পাঠানো ও status | স্থানীয় SMS gateway, WhatsApp Cloud API |
| Payment/Billing (প্ল্যাটফর্মের নিজস্ব) | Subscription পেমেন্ট | SSLCommerz-ধরনের স্থানীয়, Stripe |
| Accounting/Export (ভবিষ্যৎ) | ডাটা রপ্তানি | Google Sheets, Excel, Tally ইত্যাদি |

### ১৮.২ প্রতিটি Connector-কে যা যা বাস্তবায়ন করতে হবে

| দায়িত্ব | বিবরণ (Courier-এর উদাহরণসহ) |
| --- | --- |
| Authenticate | OAuth বা API key যাচাই ও সংরক্ষণ; token refresh |
| Capabilities Declaration | এই connector কী কী পারে তার ঘোষণা (যেমন `supports_webhook`, `supports_booking`, `supports_cod_settlement`) |
| Pull / Sync | নির্ধারিত সময়ে ডাটা আনা (পুরো ও incremental) |
| Webhook Handler | বাহ্যিক ইভেন্ট গ্রহণ, signature যাচাই |
| Map to Canonical Model | বাহ্যিক ডাটা (status, ক্ষেত্র) আমাদের standard model-এ রূপান্তর |
| Push / Actions | বাহ্যিক সিস্টেমে কাজ পাঠানো (booking, মেসেজ পাঠানো, status আপডেট) |
| Error Normalization | বাহ্যিক ত্রুটি আমাদের standard ত্রুটি কোডে রূপান্তর |
| Rate Limit Policy | নিজস্ব সীমা ও retry নীতি ঘোষণা |
| Config Schema | প্রয়োজনীয় credential ক্ষেত্রের বর্ণনা, যা থেকে UI স্বয়ংক্রিয় সেটআপ ফর্ম বানাবে |

### ১৮.৩ Canonical (Standard) Data Model

সব connector নিচের standard এনটিটিতে ডাটা রূপান্তর করবে। ফলে dashboard, P&L ও AI কোনো connector-এর নির্দিষ্ট ফরম্যাটের উপর নির্ভর করে না।

| Canonical Entity | মূল ক্ষেত্র |
| --- | --- |
| `AdAccount`, `Campaign`, `AdSet`, `Ad` | id, name, status, objective, budget |
| `AdInsightDaily` | তারিখ, entity, spend, impressions, clicks, results, purchase value, currency |
| `Order`, `OrderItem` | source, external\_id, status, totals, customer, UTM |
| `Shipment` | courier, consignment\_id, standard\_status, cod\_amount, charges, timestamps |
| `Settlement` | courier, batch\_id, তারিখ, order-wise পরিশোধ |
| `Product`, `Variant` | sku, price, cost, external\_id |
| `Customer` | phone, name, addresses, consent flags |
| `Message` | channel, template, status, cost |

### ১৮.৪ নতুন Connector যোগ করার প্রক্রিয়া

1. Connector SDK/টেমপ্লেট থেকে নতুন মডিউল তৈরি।
2. Capabilities ও Config Schema ঘোষণা।
3. Status mapping টেবিল লেখা ও টেস্ট (fixture/mock সহ)।
4. স্যান্ডবক্স অ্যাকাউন্টে integration test।
5. Feature flag দিয়ে নির্বাচিত tenant-এ beta।
6. সবার জন্য চালু ও Marketplace/Integrations পেজে প্রকাশ।

লক্ষ্য: একজন অভিজ্ঞ developer-এর জন্য একটি নতুন courier connector ১–২ সপ্তাহে যোগ করা সম্ভব হওয়া (এটি আমার প্রাথমিক লক্ষ্য, SDK তৈরির পর যাচাই করতে হবে)।

### ১৮.৫ Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| INT-01 | সব connector একটি নির্দিষ্ট interface মেনে চলবে; মূল কোডে কোনো courier/channel-নির্দিষ্ট শর্ত (`if courier == 'pathao'`) থাকবে না। | P0 |
| INT-02 | Integrations পেজ: সব উপলব্ধ connector, সংযুক্ত অবস্থা, স্বাস্থ্য (সুস্থ/সতর্কতা/ব্যর্থ), শেষ sync। | P0 |
| INT-03 | Credential-এর জন্য Config Schema থেকে স্বয়ংক্রিয় ফর্ম। | P0 |
| INT-04 | Sync job ব্যর্থ হলে retry, dead-letter queue ও অ্যাডমিন সতর্কতা। | P0 |
| INT-05 | Raw payload সংরক্ষণ (সীমিত সময়ের জন্য) যাতে debugging ও reprocess সম্ভব হয়। | P0 |
| INT-06 | Connector-এর ভার্সনিং ও backward compatibility। | P1 |
| INT-07 | Public API ও Webhook (Outbound): ব্যবহারকারী বা তৃতীয় পক্ষ order বা status পাঠাতে ও গ্রহণ করতে পারবে। | P1 |
| INT-08 | Zapier/Make/n8n-ধরনের সংযোগের জন্য API key-ভিত্তিক REST API। | P2 |
| INT-09 | Automation Engine সাধারণ আকারে (Trigger → Condition → Action) বানানো, যাতে ভবিষ্যতে SMS ছাড়াও অন্য action (ইমেইল, Slack, task তৈরি) যোগ করা যায়। | P1 |

## ১৯. System Architecture, Tech Stack ও Data Model

প্রস্তাবিত architecture একটি **modular monolith**: একটি codebase, কিন্তু স্পষ্ট module সীমানা। সব বাহ্যিক সিস্টেম (Meta, WooCommerce, courier, SMS) নিজস্ব connector-এর পিছনে থাকে, তাই নতুন courier বা channel যোগ করলে core কোড বদলাতে হয় না।

&#91;embedded content: system architecture · 4 layers, connectors at the edge\]

### ১৯.১ Architecture নীতি

1. **প্রথমে Modular Monolith, Microservice নয়।** ছোট টিমে দ্রুত শিপ করা ও চালানো সহজ। Module-এর সীমানা পরিষ্কার রাখলে পরে প্রয়োজনে আলাদা করা যাবে।
2. **Event-driven কাজ।** Order status বদলালে একটি event তৈরি হয়, যা থেকে profit পুনর্গণনা, automation trigger ও audit log চলে।
3. **Idempotent ingestion।** Webhook দুইবার আসলেও একই ফলাফল (কোনো duplicate order বা ডবল খরচ নয়)।
4. **সব সময় UTC-তে সংরক্ষণ, দেখার সময় workspace timezone-এ।** বাংলাদেশ (UTC+6) ও Meta account-এর timezone ভিন্ন হলে দিনের সীমানায় ভুল হওয়া অত্যন্ত সাধারণ।
5. **Raw data সংরক্ষণ।** বাহ্যিক payload সীমিত সময় রাখা হয়, যাতে ভুল হলে পুনরায় প্রক্রিয়া করা যায়।

### ১৯.২ Tech Stack (প্রস্তাবনা)

টিমের দক্ষতা অনুযায়ী বদলানো যাবে; সিদ্ধান্ত Sprint 0-তে চূড়ান্ত হবে।

| স্তর | প্রস্তাবিত প্রযুক্তি | কারণ |
| --- | --- | --- |
| Frontend | React/Next.js + TypeScript, chart library (ECharts বা Recharts) | সমৃদ্ধ dashboard ও chart সহজে বানানো যায় |
| Backend | NestJS (Node.js/TypeScript) বা Laravel (PHP) | টিমের দক্ষতা অনুযায়ী; উভয়েরই queue, ORM, auth ইকোসিস্টেম আছে |
| Database | PostgreSQL (Row-Level Security) | Multi-tenant বিচ্ছিন্নতা, JSON ও aggregate-এ ভালো |
| Queue ও Cache | Redis (BullMQ বা Laravel Horizon) | Sync job, webhook, retry, rate limiting |
| Analytics (পরে) | শুরুতে PostgreSQL aggregate table; বড় হলে ClickHouse/অনুরূপ | শুরুতে সহজ, পরে scale |
| File Storage | S3-compatible object storage | রসিদ, export, raw payload |
| AI | LLM API (যেমন Claude API) + নিজস্ব Rule Engine | সংখ্যা নির্ভুল, ব্যাখ্যা ভাষায় |
| Hosting | Docker, দক্ষিণ এশিয়ার কাছাকাছি cloud region (যেমন Singapore) | Latency ও পরিচালনা সহজ |
| Observability | Sentry, লগ ও metric dashboard (যেমন Grafana) | Sync ও webhook সমস্যা দ্রুত ধরা |
| CI/CD | GitHub Actions, staging ও production আলাদা | নিরাপদ release |

### ১৯.৩ মূল Data Model (সংক্ষিপ্ত)

সব business টেবিলে `tenant_id` থাকবে।

| ডোমেইন | টেবিল | মূল ক্ষেত্র |
| --- | --- | --- |
| Identity | `tenants`, `users`, `memberships`, `roles`, `audit_logs` | tenant সেটিংস (currency, timezone, date basis), role |
| Billing | `plans`, `subscriptions`, `invoices`, `usage_counters` | plan, স্ট্যাটাস, ব্যবহার |
| Integrations | `integrations`, `credentials` (encrypted), `sync_runs`, `webhook_events` | connector প্রকার, health, raw payload |
| Ads | `ad_accounts`, `campaigns`, `ad_sets`, `ads`, `ad_insights_daily`, `campaign_tags` | spend, results, currency, তারিখ |
| Orders | `orders`, `order_items`, `order_status_history`, `order_attribution` | source, status, UTM, campaign link, confidence |
| Shipping | `shipments`, `shipment_events`, `settlements`, `settlement_items`, `courier_status_map` | consignment, COD, charges, standard status |
| Products | `products`, `variants`, `product_cost_history` | sku, price, cost (তারিখসহ) |
| Finance | `expenses`, `expense_categories`, `recurring_expenses`, `fx_rates` | খরচ, বণ্টন, মুদ্রা হার |
| Customers | `customers`, `customer_addresses`, `customer_tags`, `consents` | ফোন (unique), সম্মতি |
| Messaging | `message_templates`, `automations`, `automation_runs`, `messages` | trigger, delay, status, খরচ |
| Analytics | `daily_metrics`, `insights`, `insight_feedback`, `goals` | পূর্ব-গণনা করা aggregate, AI পরামর্শ |

### ১৯.৪ প্রধান Background Job

| Job | সময়সূচি | কাজ |
| --- | --- | --- |
| Meta insights sync | প্রতি ৩০ মিনিট (আজ), দৈনিক (পেছনের ৭ দিন) | Ad data আনা |
| Order poll (fallback) | প্রতি ১০–১৫ মিনিট | Webhook মিস হলে order ধরা |
| Courier status poll | প্রতি ৩০ মিনিট (non-final shipment) | Status ও payment আপডেট |
| Courier settlement sync | দৈনিক | COD ও payment batch |
| Profit recompute | event-ভিত্তিক + রাতে পূর্ণ | `daily_metrics` আপডেট |
| Automation runner | প্রতি মিনিট | Delay শেষ হওয়া message পাঠানো |
| AI daily/weekly brief | দৈনিক/সাপ্তাহিক | Insight তৈরি |
| Token health check | দৈনিক | Meta/অন্যান্য token মেয়াদ |
| Reconciliation | দৈনিক | সম্পূর্ণ সংখ্যার মিল যাচাই |

### ১৯.৫ API সারসংক্ষেপ

সব API `/api/v1/` অধীনে, tenant-scoped, JWT বা API key দিয়ে যাচাইকৃত, rate-limited।

| স্থান | উদাহরণ endpoint | বিসয় |
| --- | --- | --- |
| Auth | `POST /auth/login`, `/auth/oauth/meta/callback` | login, OAuth |
| Integrations | `GET/POST /integrations`, `POST /integrations/{id}/sync` | সংযোগ ও sync |
| Orders | `GET/POST /orders`, `PATCH /orders/{id}/status`, `POST /orders/bulk` | order পরিচালনা |
| Shipments | `POST /orders/{id}/ship`, `GET /shipments` | courier booking |
| Ads | `GET /ads/campaigns`, `GET /ads/insights` | ad data |
| Analytics | `GET /analytics/pnl`, `/analytics/funnel`, `/analytics/products` | dashboard data |
| Insights | `POST /insights/analyze`, `GET /insights` | AI |
| Customers | `GET /customers`, `POST /customers/{id}/tags` | CRM |
| Messaging | `GET/POST /automations`, `GET /messages` | automation |
| Inbound Webhooks | `POST /webhooks/{connector}/{tenant}` | বাহ্যিক ইভেন্ট |
| Outbound Webhooks | ব্যবহারকারীর URL-এ | order/status পরিবর্তন |

## ২০. UI/UX: Sitemap ও প্রধান Screen

### ২০.১ ডিজাইন নীতি

1. **মালিক-প্রথম:** সবচেয়ে গুরুত্বপূর্ণ উত্তর ("আজ লাভ না ক্ষতি?") প্রথম স্ক্রিনেই, স্ক্রল ছাড়া।
2. **এক ক্লিকে কারণ:** প্রতিটি সংখ্যা ক্লিক করলে তার উৎস দেখা যায়।
3. **মোবাইল-প্রথম দেখা, ডেস্কটপ-প্রথম কাজ:** Dashboard ফোনে সুন্দর; order ও বাল্ক কাজ ডেস্কটপে সুবিধাজনক।
4. **ভাষা:** বাংলা ও ইংরেজি; সংখ্যা ও মুদ্রা `৳` ফরম্যাট (লাখ/কোটি গ্রুপিং বিকল্প, যেমন ১,২৫,০০০)।
5. **বিশ্বাসযোগ্য data:** "সর্বশেষ sync", "অসম্পূর্ণ data" ও "Estimated" লেবেল সবসময় দৃশ্যমান।
6. **সবুজ-লাল ব্যবহার:** লাভ সবুজ, ক্ষতি লাল, তবে রঙের পাশাপাশি চিহ্ন (▲▼, +/−) যাতে রং-অন্ধ ব্যবহারকারীও বোঝেন।
7. **খালি অবস্থা (Empty state) ও গাইড:** সংযোগ না থাকলে ফাঁকা চার্টের পরিবর্তে "Meta সংযুক্ত করুন" ধরনের স্পষ্ট নির্দেশ।

### ২০.২ Sitemap

| প্রধান মেনু | সাব-পেজ |
| --- | --- |
| **Dashboard** | Home Overview, Daily Brief |
| **Orders** | All Orders, Pending Confirmation, Courier Queue, Returns, Manual Order, Import |
| **Ads** | Overview, Campaigns/Ad Sets/Ads, Creatives, AI Analysis |
| **Funnel** | Meta → Delivery Funnel, Attribution Health, UTM Builder, Unattributed Orders |
| **Products** | Product List, Product Detail, Cost Management, Categories |
| **Finance** | Profit & Loss, Expenses, Courier Payments (COD), Reports |
| **Customers** | Customer List, Segments, Follow-up Tasks, Blacklist |
| **Automation** | Automations, Templates, Message Log, Credits |
| **Insights** | AI Insights, Weekly Review |
| **Integrations** | Store, Meta, Couriers, Messaging, API/Webhooks |
| **Settings** | Workspace, Team & Roles, Billing & Plan, Notifications, Business Rules (P&L basis, target CPA/ROAS), Audit Log |

### ২০.৩ প্রধান Screen-এর বিবরণ

**১. Home Dashboard** (সেকশন ১৬-তে বিস্তারিত)।

**২. Orders List:** উপরে status ট্যাব (Pending, Confirmed, With Courier, Delivered, Returned, Cancelled) সংখ্যা সহ। টেবিলে: order নম্বর, তারিখ, customer, ফোন, পরিমাণ, source/campaign (ব্যাজ), courier, status, কর্ম। সারি নির্বাচন করে bulk action বার ভেসে ওঠে। ডান পাশে বা নিচে স্লাইড-ইন প্যানেলে order detail ও timeline।

**৩. Funnel Page:** উপরে তারিখ ও campaign ফিল্টার। কেন্দ্রে বড় funnel চার্ট (ধাপ, সংখ্যা, drop-off %)। নিচে campaign টেবিল (Spend, Orders, Confirm %, Delivered %, Return %, Actual ROAS, Net Profit)। "Meta বলছে বনাম আসল" তুলনা কার্ড।

**৪. P&L Page:** উপরে Hero (Net Profit) ও সময়কাল সুইচ (দৈনিক/সাপ্তাহিক/মাসিক)। বাম পাশে Waterfall চার্ট, ডান পাশে লাইন-ভিত্তিক টেবিল (প্রতিটি লাইনে ক্লিক করে drill-down)। নিচে দৈনিক profit বার চার্ট ও expense বিভাজন (পাই)।

**৫. Product Page:** তালিকা-টেবিল (Units, Delivered %, Return %, Revenue, Net Profit, Margin %) ও সতর্কতা ("Cost নেই")। Detail পেজে trend ও কোন campaign থেকে বিক্রি হচ্ছে।

**৬. Onboarding:** ধাপে ধাপে ছয় ধাপের উইজার্ড ও অগ্রগতি বার (সেকশন ১৭)।

**৭. Integrations:** কার্ড গ্রিডে প্রতিটি connector: লোগো, অবস্থা (সুস্থ/সতর্কতা/ব্যর্থ), শেষ sync, "Connect/Reconnect" বাটন।

**৮. Automation Builder:** Trigger বেছে নেওয়া → শর্ত → বিলম্ব → টেমপ্লেট নির্বাচন; ডানে মোবাইল-ফোনে মেসেজ কেমন দেখাবে তার preview।

### ২০.৪ Notification

| চ্যানেল | কখন |
| --- | --- |
| In-app (ঘণ্টা আইকন) | সব সতর্কতা ও insight |
| ইমেইল | Token মেয়াদ, ব্যর্থ sync, সাপ্তাহিক রিপোর্ট, billing |
| SMS/WhatsApp (ঐচ্ছিক) | দৈনিক সারাংশ, গুরুতর সতর্কতা (যেমন ad খরচ হঠাৎ বেড়েছে) |

ব্যবহারকারী প্রতিটি ধরনের notification চালু/বন্ধ ও সময় ঠিক করতে পারবেন।

### ২০.৫ Accessibility ও Performance (UI)

- Keyboard ন্যাভিগেশন, পর্যাপ্ত contrast, চার্টে text বিকল্প (টেবিল ভিউ)।
- বড় তালিকায় virtual scrolling ও server-side pagination।
- Skeleton loading, ধাপে ধাপে data দেখানো (সম্পূর্ণ পেজ ব্লক না করে)।

## ২১. Non-Functional Requirements, Security ও Compliance

### ২১.১ Performance ও Scalability

| ID | Requirement | লক্ষ্য |
| --- | --- | --- |
| NFR-01 | Dashboard পেজ লোড (cached aggregate সহ) | p95 < ৩ সেকেন্ড |
| NFR-02 | সাধারণ API response | p95 < ৫০০ ms |
| NFR-03 | Order list (১০,০০০+ সারি) filter ও search | < ২ সেকেন্ড |
| NFR-04 | Webhook প্রক্রিয়াকরণ (receive থেকে status আপডেট) | সাধারণত < ৬০ সেকেন্ড |
| NFR-05 | প্রাথমিক backfill (৯০ দিন, ১০,০০০ order) | < ১৫ মিনিট, background-এ |
| NFR-06 | সমকালীন tenant সংখ্যা | MVP-তে ৫০০ tenant, স্থাপত্য ৫,০০০-এ বাড়ানো সম্ভব এমন |
| NFR-07 | Horizontal scaling: worker আলাদাভাবে বাড়ানো যাবে | স্থাপত্যগত দাবি |

(এই সংখ্যাগুলো প্রাথমিক লক্ষ্য; Sprint 0-এ load test পরিকল্পনা ও বাস্তব পরিমাপের পর চূড়ান্ত হবে।)

### ২১.২ Reliability ও Availability

- **Uptime লক্ষ্য:** ৯৯.৫% (MVP), পরে ৯৯.৯%।
- **Backup:** দৈনিক স্বয়ংক্রিয় database backup, কমপক্ষে ৩০ দিন সংরক্ষণ; পুনরুদ্ধার (restore) নিয়মিত পরীক্ষা।
- **Disaster Recovery:** RPO ≤ ২৪ ঘণ্টা, RTO ≤ ৪ ঘণ্টা (MVP-র লক্ষ্য)।
- **Graceful degradation:** Meta বা courier API বন্ধ থাকলে dashboard পুরনো data সহ "সর্বশেষ sync" দেখিয়ে চলবে।
- **Retry ও Dead-letter:** ব্যর্থ job পুনরায় চেষ্টা, বারবার ব্যর্থ হলে অ্যাডমিন সতর্কতা।
- **Status page:** সিস্টেম অবস্থা ও ঘটনা জানাতে।

### ২১.৩ Security

| ক্ষেত্র | প্রয়োজন |
| --- | --- |
| Transport | সব ট্রাফিক HTTPS/TLS |
| Data at rest | Database ও storage এনক্রিপ্টেড |
| Credentials ও Token | Application-স্তরে আলাদা এনক্রিপশন (key management service), UI-তে মাস্ক, লগে কখনো নয় |
| Tenant Isolation | `tenant_id` + Row-Level Security; প্রতিটি কোয়েরিতে tenant বাধ্যতামূলক; স্বয়ংক্রিয় টেস্ট যা cross-tenant leak ধরে |
| Authentication | Password hashing (Argon2/bcrypt), 2FA অপশন, session/token মেয়াদ, brute-force সুরক্ষা |
| Authorization | Server-side RBAC যাচাই, প্রতিটি endpoint-এ |
| Webhook নিরাপত্তা | Signature যাচাই, replay সুরক্ষা (timestamp/nonce) |
| Input Validation | Injection, XSS, CSRF থেকে সুরক্ষা; CSV import-এ নিরাপদ পার্সিং |
| Audit Log | সংবেদনশীল কাজের অপরিবর্তনীয় লগ |
| Rate Limiting | API ও login-এ |
| Dependency ও Secret | নির্ভরতা স্ক্যান, secret ম্যানেজার, কোডে secret নয় |
| Penetration Test | লঞ্চের আগে একটি বাহ্যিক বা অভ্যন্তরীণ security review |
| Support Access | Impersonation কেবল কারণ ও অডিট লগ সহ |

### ২১.৪ Privacy ও Compliance

নিচের আইনি বিষয়গুলো আমার সাধারণ ধারণা; লঞ্চের আগে স্থানীয় আইনজীবীর পরামর্শ নেওয়া প্রয়োজন।

| বিষয় | করণীয় |
| --- | --- |
| বাংলাদেশের ডাটা সুরক্ষা সংক্রান্ত আইন ও নীতিমালা | সর্বশেষ আইন, ডাটা স্থানান্তর ও সংরক্ষণ-সংক্রান্ত বিধান যাচাই; Privacy Policy ও Terms তৈরি |
| Meta Platform Terms | Meta App Review, Business Verification, ডাটা ব্যবহারের নীতি মানা, ডাটা মুছে ফেলার অনুরোধের callback (Data Deletion URL) বাস্তবায়ন |
| আন্তর্জাতিক ব্যবহারকারী | GDPR-ধরনের অধিকার (access, delete, export) ভবিষ্যতে |
| SMS/WhatsApp | Opt-in/opt-out, WhatsApp Business নীতি, স্থানীয় টেলিকম নিয়ন্ত্রক নিয়ম |
| Customer ডাটা | ডাটা ন্যূনতমকরণ, সংরক্ষণকাল নীতি, মুছে ফেলার অনুরোধ পূরণ |
| AI | Customer PII LLM-এ পাঠানো হয় না; প্রদানকারীর data retention নীতি যাচাই |
| Payment | Card data নিজেরা সংরক্ষণ নয়, gateway-র hosted checkout ব্যবহার |

### ২১.৫ Data Retention (প্রস্তাব)

| ডাটা | সংরক্ষণকাল |
| --- | --- |
| Order, ad, shipment, P&L | সাবস্ক্রিপশন সক্রিয় থাকা পর্যন্ত + বাতিলের পর ৯০ দিন |
| Raw webhook/API payload | ৩০–৯০ দিন |
| Message log | ১২ মাস |
| Audit log | ২৪ মাস |
| Backup | ৩০ দিন |

### ২১.৬ Data Quality ও Reconciliation

এই product-এর সবচেয়ে বড় ঝুঁকি "ভুল সংখ্যা", কারণ একবার বিশ্বাস হারালে ব্যবহারকারী ফিরে আসবেন না। তাই:

- **দৈনিক Reconciliation job:** আমাদের Ad spend বনাম Meta-র মোট, আমাদের order সংখ্যা বনাম WooCommerce, আমাদের COD বনাম courier-এর রিপোর্ট; অমিল ১%-এর বেশি হলে অ্যাডমিন ও ব্যবহারকারীকে সতর্কতা।
- **ব্যবহারকারীর দৃশ্যমান Data Health পেজ:** sync অবস্থা, অ্যাট্রিবিউশন %, cost coverage %, unmapped status সংখ্যা।
- **Test fixtures:** প্রতিটি courier ও Meta response-এর নমুনা দিয়ে P&L গণনার স্বয়ংক্রিয় টেস্ট।
- **Time zone ও currency টেস্ট:** UTC+6 সীমানা, USD→BDT রূপান্তর।

### ২১.৭ Localization

- ভাষা: বাংলা ও ইংরেজি (UI ও AI আউটপুট)।
- সংখ্যা: বাংলা (১২৩) বা ইংরেজি (123) অঙ্ক; লাখ/কোটি ফরম্যাট।
- ঠিকানা: বাংলাদেশের বিভাগ, জেলা, থানা তালিকা।
- তারিখ ও সপ্তাহ: সপ্তাহের শুরু (শনিবার/রবিবার/সোমবার) সেটিংসে।
- ভবিষ্যতে: অন্য দেশের মুদ্রা ও courier।

## ২২. Roadmap, Risk, Open Questions ও Glossary

### ২২.১ Roadmap

MVP-এর আগে একটি Sprint 0 (discovery) অপরিহার্য, কারণ Meta ও courier API-এর প্রকৃত অনুমতি ও সীমাবদ্ধতা সময় ও দাম নির্ধারণ করবে।

&#91;embedded content: roadmap · 4 phases, 2 gates\]

| Phase | আনুমানিক সময় | মূল অর্জন | সফলতার মাপকাঠি |
| --- | --- | --- | --- |
| Sprint 0 | ২–৪ সপ্তাহ | Courier/Meta API যাচাই, Meta App Review শুরু, ডিজাইন ও architecture চূড়ান্ত, স্ট্যাক সিদ্ধান্ত | API অ্যাক্সেস নিশ্চিত, Requirement অনুমোদিত |
| Phase 1: MVP | ১০–১৪ সপ্তাহ (সাতটি Sprint) | অধ্যায় ৫-এর MVP তালিকা; পাইলট ব্যবহারকারীদের কাছে beta | সংখ্যার সঠিকতা ≥ ৯৯%, ১০+ pilot ব্যবসায়ী সক্রিয় |
| Phase 2 | ০৮–১২ সপ্তাহ | Google Ads, Shopify, WhatsApp, আরও courier, segmentation, alert | Paid conversion, churn লক্ষ্য |
| Phase 3 | চলমান | Auto-optimization, marketplace, predictive features | সেক্ষত্রে পরিমাপকৃত বাজার বৃদ্ধি |

সময়সীমা আমার প্রাথমিক আনুমান; টিমের আকার ও Sprint 0-এর পর নিশ্চিত করতে হবে।

### ২২.২ প্রস্তাবিত টিম (MVP)

| ভূমিকা | সংখ্যা |
| --- | --- |
| Product Manager / Owner | ১ |
| UI/UX Designer | ১ |
| Frontend Developer | ২ |
| Backend Developer | ২–৩ |
| QA Engineer | ১ |
| DevOps (আংশিক সময়) | ০.৫ |
| Data/AI Engineer (আংশিক সময়) | ০.৫–১ |

### ২২.৩ Risk Register

| # | Risk | সম্ভাবনা | প্রভাব | প্রতিকার |
| --- | --- | --- | --- | --- |
| 1 | Meta App Review/Business Verification দেরি বা প্রত্যাখ্যান | মাঝারি | খুব বেশি | Sprint 0-তেই আবেদন; অন্তবর্তীকালীন সম্পাদনায় ব্যবসায়ীর নিজস্ব Business Manager-এর মাধ্যমে পরীক্ষা; প্রয়োজনে CSV ইম্পোর্ট fallback |
| 2 | Courier API-এর অসমতা (webhook নেই, অসম্পূর্ণ ডাটা, সিস্টেম বদল) | উচ্চ | উচ্চ | Polling + CSV fallback, status mapping মডিউল, নিয়মিত রিকনসিলিয়েশন |
| 3 | Attribution অনির্ভরযোগ্য (UTM নেই, Messenger order) | উচ্চ | উচ্চ | UTM Builder, tracking plugin, ম্যানুয়াল source ড্রপডাউন, confidence লেবেল, attribution % স্বাস্থ্য সূচক |
| 4 | ভুল বা অসম্পূর্ণ P&L থেকে ব্যবহারকারীর আস্থা হারানো | মাঝারি | খুব বেশি | দৈনিক reconciliation, Data Health পেজ, স্পষ্ট "Estimated/Incomplete" লেবেল, পাইলটে হাতে মিলিয়ে দেখা |
| 5 | ব্যবহারকারী product cost ইনপুট দিতে অনিচ্ছুক | উচ্চ | উচ্চ | CSV bulk, onboarding-এ সহজ ফলো, cost coverage % দেখানো, অস্থায়ী মার্জিন অনুমান |
| 6 | Meta API পরিবর্তন বা rate limit | মাঝারি | মাঝারি | Connector বিচ্ছিন্নতা, API ভার্সন নজরদারি, caching, কম request |
| 7 | SMS/WhatsApp নিয়মাবলি লঙ্ঘন, স্পাম চিহ্ন | মাঝারি | উচ্চ | Opt-out, frequency cap, template অনুমোদন, আইনি পরামর্শ |
| 8 | AI-এর ভুল পরামর্শ বা অতিকথিত আত্মবিশ্বাস | মাঝারি | উচ্চ | Rule Engine থেকে সংখ্যা, "নিশ্চিত/সম্ভাব্য" পার্থক্য, কম data-তে বিশ্লেষণ নয়, feedback |
| 9 | Scope creep (সব কিছু MVP-তে চাওয়া) | উচ্চ | উচ্চ | Phase-ভিত্তিক সিদ্ধান্ত, P0/P1/P2 অগ্রাধিকার, change request প্রক্রিয়া |
| 10 | Customer ডাটা নিরাপত্তা/গোপনীয়তা লঙ্ঘন | কম | খুব বেশি | RLS, এনক্রিপশন, audit, security review |
| 11 | AI/SMS খরচ সীমা বাড়িয়ে যাওয়া (লাভ কমানো) | মাঝারি | মাঝারি | Plan-ভিত্তিক সীমা, cache, credit মডেল |
| 12 | বাজারে প্রতিযোগী বা অল্প গ্রহণযোগ্যতা | মাঝারি | মাঝারি | স্থানীয় courier/COD/BDT-কেন্দ্রিক বৈশিষ্ট্য, pilot ব্যবসায়ীর প্রতিপ্রাণনা |

### ২২.৪ Assumptions (আমার অনুমান)

1. প্রথম বাজার বাংলাদেশ, মুদ্রা BDT, COD-ভিত্তিক ব্যবসা।
2. Meta Ads-ই প্রধান প্রচার channel; Google Ads Phase 2-তে।
3. অধিকাংশ ব্যবহারকারীর বাহ্যিক সিস্টেমে API অ্যাক্সেস আছে (WooCommerce key, courier credential)।
4. প্রতিটি courier অন্তত পরিণত অবস্থা (status, COD) ডাটা API-তে দেয়, না পারলে CSV fallback ব্যবহার হবে।
5. ব্যবহারকারী product cost ইনপুট দেবেন (কারণ সেটি না থাকলে সঠিক profit সম্ভব নয়)।
6. LLM API ব্যবহারের খরচ plan-এর মুনাফায় সামলানো যাবে।

### ২২.৫ Open Questions (আপনার সিদ্ধান্ত লাগবে)

| # | প্রশ্ন | আমার প্রস্তাব |
| --- | --- | --- |
| 1 | প্রথম ব্যবহারকারী কে? ক্লায়েন্টের নিজের ব্যবসা, নাকি প্রথমেই বিক্রির জন্য SaaS? | নিজের ব্যবসায় প্রথম pilot, তারপর বাইরের ব্যবসায়ীদের কাছে |
| 2 | Google Ads MVP-তে লাগবে কি? | Phase 2 (প্রথমে ম্যানুয়াল খরচ ইনপুট) |
| 3 | Courier-এ booking platform থেকেই হবে, নাকি courier panel-এ বুক করে শুধু লিংক? | Platform থেকে booking |
| 4 | কোন courier গুলো প্রথমে ও ক্লায়েন্টের সেই courier-এ merchant account আছে কি? | Steadfast, Pathao, RedX; ক্লায়েন্টের বর্তমান courier অগ্রাধিকার |
| 5 | Revenue গণনার ডিফল্ট ভিত্তি: Order তারিখ নাকি Delivery তারিখ? | দুটোই দেখানো; ডিফল্ট হিসেবে Order-date (campaign বিশ্লেষণের জন্য) ও Finance পেজে Delivery-date |
| 6 | Facebook/Messenger order কীভাবে নেওয়া হয় (স্টাফ হাতে, chatbot, নাকি অন্য টুল)? | Manual order ফর্ম MVP-তে, chatbot সংযোগ পরে |
| 7 | ক্লায়েন্টের ওয়েবসাইটে tracking plugin/snippet বসানো যাবে কি? | হ্যাঁ, WooCommerce plugin হিসেবে |
| 8 | SMS gateway/WhatsApp provider কোনটি? ক্লায়েন্টের আগে থেকে কোনো সাবস্ক্রিপশন আছে কি? | Sprint 0-তে তুলনা করে বাছাই |
| 9 | Meta Business Verification ও App কার নামে হবে (কোম্পানি বা ব্যক্তি)? | কোম্পানির নামে (বেশি বিশ্বাসযোগ্য) |
| 10 | Subscription payment gateway কোনটি? | স্থানীয় gateway + পরে Stripe |
| 11 | প্রোডাক্টের নাম, ডোমেইন, ব্র্যান্ডিং | Sprint 0-এ চূড়ান্ত |
| 12 | বাজেট, টিম ও লঞ্চের লক্ষ্য তারিখ | আপনার তথ্য দিলে roadmap সমন্বয় করব |

### ২২.৬ Glossary

| শব্দ | অর্থ |
| --- | --- |
| F-commerce | Facebook/Instagram/WhatsApp-কেন্দ্রিক বিক্রি |
| COD | Cash on Delivery: পণ্য পাওয়ার সময় টাকা দেওয়া |
| RTO / Return | Return to Origin: customer নিলেন না, পণ্য ফেরত আসে |
| ROAS | Return on Ad Spend = Revenue ÷ Ad Spend |
| Actual ROAS | Delivered revenue ÷ Ad Spend |
| CPA | Cost per Acquisition/Result = Ad Spend ÷ Results |
| CTR / CPM / CPC | Click-through rate / প্রতি ১,০০০ impression-এর খরচ / প্রতি click-এর খরচ |
| COGS | Cost of Goods Sold: পণ্যের ক্রয়/উৎপাদন খরচ |
| Break-even ROAS | যে ROAS-এ বিজ্ঞাপন খরচ ঠিক মিলিয়ে যায়, লাভ-ক্ষতি শূন্য |
| UTM | URL-এর tracking parameter (source, campaign ইত্যাদি) |
| fbclid | Facebook click ID, যা URL-এ যোগ হয় |
| Pixel / CAPI | Meta-র browser-ভিত্তিক tracking / server-to-server Conversions API |
| Attribution | Orderকে তার উৎস campaign-এর সাথে যুক্ত করা |
| Cohort | একই সময়ে শুরু হওয়া গ্রুপ (যেমন একই দিনের order) |
| Tenant / Workspace | SaaS-এর একটি ব্যবসার বিচ্ছিন্ন এলাকা |
| RLS | Row-Level Security: database-স্তরে সারি-ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ |
| Webhook | ঘটনা ঘটলে বাহ্যিক সিস্টেমের নিজে থেকে পাঠানো বার্তা |
| Idempotency | একই অনুরোধ বারবার আসলেও ফলাফল একই থাকা |
| Canonical Model | সব connector-এর জন্য ব্যবহৃত নিজস্ব standard data কাঠামো |
| LTV / CAC | Customer Lifetime Value / Customer Acquisition Cost |
| RFM | Recency, Frequency, Monetary: customer segmentation পদ্ধতি |
| MRR / NPS | Monthly Recurring Revenue / Net Promoter Score |

### ২২.৭ পরবর্তী পদক্ষেপ

1. অপেন প্রশ্নগুলোর (মিনিমাম ১–৬) উত্তর দিন।
2. ক্লায়েন্টের সাথে এই PRD review করে MVP scope (P0) স্বাক্ষরিত করা।
3. Sprint 0 শুরু: Meta App/Business Verification আবেদন, courier API যাচাই, প্রথম wireframe।
4. ২–৩টি pilot ব্যবসায়ী ঠিক করা।
