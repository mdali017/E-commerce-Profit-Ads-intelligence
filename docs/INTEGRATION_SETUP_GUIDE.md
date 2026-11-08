# 🔌 E-commerce Integrations & Data Sync Guide
## লাভ-ক্ষতি ও বিজ্ঞাপন ট্র্যাকিং সিস্টেম কানেকশন নির্দেশিকা

ProfitPulse আপনার ই-কমার্সের ৪টি মূল স্তম্ভকে এক ছাতার নিচে নিয়ে আসে:
1. **Website / Store** ➔ রিয়েল-টাইম কাস্টমার অর্ডার ও রেভিনিউ।
2. **Meta Ads (Facebook)** ➔ দৈনিক বিজ্ঞাপনের খরচ (Ad Spend) ও ক্যাম্পেইন ROAS।
3. **Courier (Steadfast & Pathao)** ➔ পার্সেল ট্র্যাকিং, ডেলিভারি সাকসেস রেট ও বকেয়া ক্যাশ (Unsettled COD Cash)।
4. **Product Catalog & COGS** ➔ পণ্যের পাইকারি ক্রয়মূল্য ও প্রকৃত নেট প্রফিট (Real Net Profit)।

এই গাইডে বিস্তারিতভাবে আলোচনা করা হয়েছে কীভাবে প্রতিটি সার্ভিস খুব সহজে যুক্ত করবেন এবং আপনার কোনো ওয়েবসাইট বা রিয়েল মেটা অ্যাকাউন্ট না থাকলেও কীভাবে সম্পূর্ণ সিস্টেমটি পরীক্ষা (Test) করতে পারবেন।

---

## সূচিপত্র
- [১. Website / Store কানেক্ট করার নিয়ম](#১-website--store-কানেক্ট-করার-নিয়ম)
  - [ক. WooCommerce / WordPress Webhook কানেকশন](#ক-woocommerce--wordpress-webhook-কানেকশন)
  - [খ. আপনার কোনো ওয়েবসাইট না থাকলে কীভাবে টেস্ট করবেন?](#খ-আপনার-কোনো-ওয়েবসাইট-না-থাকলে-কীভাবে-টেস্ট-করবেন)
- [২. Meta Ads (Facebook) কানেক্ট করার নিয়ম](#২-meta-ads-facebook-কানেক্ট-করার-নিয়ম)
  - [প্রয়োজনীয় ফিল্ডসমূহ](#প্রয়োজনীয়-ফিল্ডসমূহ)
  - [Ad Account ID ও Access Token সংগ্রহের নিয়ম](#ad-account-id-ও-access-token-সংগ্রহের-নিয়ম)
  - [মেটা অ্যাড একাউন্ট ছাড়া সরাসরি টেস্ট করার উপায়](#মেটা-অ্যাড-একাউন্ট-ছাড়া-সরাসরি-টেস্ট-করার-উপায়)
- [৩. Courier Tracking কানেক্ট করার নিয়ম](#৩-courier-tracking-কানেক্ট-করার-নিয়ম)
  - [ক. Steadfast Courier কানেকশন](#ক-steadfast-courier-কানেকশন)
  - [খ. Pathao Courier কানেকশন](#খ-pathao-courier-কানেকশন)
  - [কুরিয়ার বুকিং ও স্ট্যাটাস সিমুলেশন](#কুরিয়ার-বুকিং-ও-স্ট্যাটাস-সিমুলেশন)
- [৪. Product COGS ও মার্জিন সেটআপ](#৪-product-cogs-ও-মার্জিন-সেটআপ)
- [৫. সচরাচর জিজ্ঞাস্য (FAQ) ও ট্রাবলশুটিং](#৫-সচরাচর-জিজ্ঞাস্য-faq-ও-ট্রাবলশুটিং)

---

## ১. Website / Store কানেক্ট করার নিয়ম

### ক. WooCommerce / WordPress Webhook কানেকশন
WooCommerce-এর সাথে রিয়েল-টাইম অটোমেশন করতে কোনো প্লাগিন ইনস্টল করতে হয় না। WooCommerce-এর নিজস্ব Webhook ফিচারের মাধ্যমেই প্রতি সেকেন্ডে নতুন অর্ডার সিস্টেমে চলে আসে।

#### ধাপসমূহ:
1. **ProfitPulse থেকে Webhook URL সংগ্রহ করুন:**
   - ড্যাশবোর্ডে গিয়ে **"1. Website / Store"** কার্ডের **"Connect Website Store"** বাটনে ক্লিক করুন।
   - **Your Realtime Webhook Delivery URL** ফিল্ডে আপনার টেন্যান্টের জন্য নির্দিষ্ট লিঙ্কটি দেখতে পাবেন (যেমন: `http://127.0.0.1:8000/api/v1/orders/webhook/woocommerce?tenant_id=YOUR_TENANT_ID`)।
   - পাশে থাকা **Copy** বাটনে ক্লিক করুন।

2. **WordPress Admin প্যানেলে প্রবেশ করুন:**
   - আপনার ওয়ার্ডপ্রেস অ্যাডমিনে লগইন করুন (যেমন: `https://yourstore.com/wp-admin`)।
   - বামের মেনু থেকে যান: **WooCommerce** ➔ **Settings** (সেটিংস)।
   - উপরের ট্যাবগুলো থেকে **Advanced** ট্যাবে ক্লিক করুন।
   - সাব-মেনু থেকে **Webhooks**-এ ক্লিক করুন।
   - এরপর **"Add webhook"** বাটনে ক্লিক করুন।

3. **Webhook সেটিংস পূরণ করুন:**
   - **Name:** লিখুন `ProfitPulse Order Ingestion`
   - **Status:** ড্রপডাউন থেকে সিলেক্ট করুন `Active`
   - **Topic:** ড্রপডাউন থেকে সিলেক্ট করুন `Order created` (অথবা স্ট্যাটাস আপডেটের জন্য `Order updated`)
   - **Delivery URL:** ProfitPulse থেকে কপি করা সম্পূর্ণ URL-টি পেস্ট করুন।
   - **Secret:** লিখুন `whsec_ecom_orders_v1`
   - **API Version:** সিলেক্ট করুন `WP REST API Integration v3`
   - **"Save webhook"** বাটনে ক্লিক করুন।

> 💡 **নোট:** আপনার ওয়েবসাইট কোনো কাস্টমার অর্ডার দেওয়ার সাথে সাথে WooCommerce স্বয়ংক্রিয়ভাবে অর্ডার ডেটা (প্রোডাক্টের নাম, দাম, কাস্টমারের ঠিকানা, ফোন নম্বর ও UTM ট্র্যাকিং ট্যাগ) ProfitPulse-এ পাঠিয়ে দেবে।

---

### খ. Custom Website (Next.js, React, PHP, Laravel, HTML) কানেকশন
যেকোনো কাস্টম কোডেড ওয়েবসাইটের Checkout বা Order Confirmation হ্যান্ডলারে আমাদের Universal Webhook API-তে একটি HTTP POST রিকোয়েস্ট পাঠান।

#### Universal API Endpoint:
`POST http://127.0.0.1:8000/api/v1/orders/webhook/custom?tenant_id=YOUR_TENANT_ID`

#### Next.js / React / Node.js স্নিপেট:
```javascript
await fetch("http://127.0.0.1:8000/api/v1/orders/webhook/custom?tenant_id=YOUR_TENANT_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    order_id: "ORD-9821",
    customer_name: "Karim Hasan",
    customer_phone: "01712345678",
    customer_email: "karim@example.com",
    shipping_address: "House 24, Road 7, Dhanmondi",
    shipping_city: "Dhaka",
    shipping_fee: 80.00,
    discount_amount: 0.00,
    payment_method: "cod",
    items: [
      { product_name: "Premium Polo", sku: "POLO-BLK-M", quantity: 1, unit_price: 1200.00 }
    ],
    utm_source: "facebook",
    utm_campaign: "eid_mega_sale"
  })
});
```

---

### গ. Shopify Store কানেকশন
1. Shopify Admin প্যানেলে প্রবেশ করুন ➔ **Settings** (নিচে বামে) ➔ **Notifications** এ যান।
2. স্ক্রোল করে নিচে **Webhooks** সেকশনে গিয়ে **Create webhook** বাটনে ক্লিক করুন।
3. **Event:** নির্বাচন করুন `Order creation`, **Format:** `JSON`।
4. **URL:** পেস্ট করুন: `http://127.0.0.1:8000/api/v1/orders/webhook/shopify?tenant_id=YOUR_TENANT_ID`
5. **Save** বাটনে ক্লিক করলেই আপনার Shopify স্টোরের প্রতিটি নতুন অর্ডার সরাসরি চলে আসবে।

---

### ঘ. Wix & Landing Pages কানেকশন
1. Wix Dashboard ➔ **Automations** ➔ **New Automation** এ যান।
2. Trigger হিসেবে দিন **Wix Stores: Customer places an order**।
3. Action হিসেবে **Connect to Webhook** নির্বাচন করে আমাদের Custom Webhook URL পেস্ট করে দিন।

---

### ঙ. আপনার কোনো ওয়েবসাইট না থাকলে কীভাবে টেস্ট করবেন?

বাংলাদেশে বেশিরভাগ উদ্যোক্তা সোশ্যাল মিডিয়া (Facebook Page, WhatsApp, Phone call) এর মাধ্যমে ব্যবসা পরিচালনা করেন। এর জন্য ওয়েবসাইট থাকা বাধ্যতামূলক নয়। আপনি দুটি উপায়ে কাজ করতে পারবেন:

#### ১-ক্লিক টেস্ট সিমুলেশন (সরাসরি ড্যাশবোর্ড থেকে):
1. ড্যাশবোর্ডের অনবোর্ডিং কার্ড থেকে **"Connect Website Store"** বাটনে ক্লিক করুন।
2. মোডালের উপরে থাকা বেগুনি রঙের বক্সে দেখতে পাবেন: **"আপনার কোনো ওয়েবসাইট নেই? সরাসরি টেস্ট করুন"**।
3. সেখানে **"Send Sample Test Order (ওয়েবসাইট ছাড়া টেস্ট করুন)"** বাটনে ক্লিক করুন।
4. একটি ক্লিক করার সাথে সাথে একটি পূর্ণাঙ্গ স্যাম্পল WooCommerce অর্ডার ব্যাকএন্ডে চলে যাবে। 
5. মোডাল বন্ধ করলেই দেখতে পাবেন আপনার ড্যাশবোর্ডে **Website / Store** কার্ডটি সবুজ **"Connected"** হয়ে গেছে এবং ৳০ এর জায়গায় লাইভ অর্ডার রেভিনিউ বসে গেছে!

#### সরাসরি ম্যানুয়াল অর্ডার এন্ট্রি (F-Commerce শপের জন্য):
1. বাম পাশের মেনু থেকে **"Orders & Ingestion"** (`/orders`) পেজে যান।
2. উপরে ডানপাশে থাকা **"+ New Order"** বাটনে ক্লিক করুন।
3. কাস্টমারের নাম, ফোন নম্বর, ডেলিভারি জেলা (Inside Dhaka / Outside Dhaka), প্রোডাক্ট এবং পরিমাণ সিলেক্ট করে **Create Order** দিন।
4. অর্ডারটি সাথে সাথে সেভ হবে এবং কুরিয়ারে পাঠানোর জন্য প্রস্তুত হবে।

---

## ২. Meta Ads (Facebook) কানেক্ট করার নিয়ম

মেটা অ্যাড অ্যাকাউন্ট কানেক্ট করলে আপনার প্রতিদিনের বিজ্ঞাপনের খরচ (Daily Ad Spend), প্রতিটি ক্যাম্পেইনের ডেলিভারি ও রিয়েল আরওএএস (ROAS) স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে যাবে।

### প্রয়োজনীয় ফিল্ডসমূহ:
1. **Meta Ad Account ID:** আপনার বিজ্ঞাপন অ্যাকাউন্টের আইডি (যেমন: `act_1029384756` অথবা শুধু সংখ্যা `1029384756`)।
2. **Access Token:** মেটার মার্কেটিং গ্রাফ এপিআই অ্যাক্সেস টোকেন।
3. **Currency:** আপনার অ্যাড অ্যাকাউন্টের কারেন্সি (BDT বা USD)।
4. **Timezone:** ডিফল্ট `Asia/Dhaka`।

---

### Ad Account ID ও Access Token সংগ্রহের নিয়ম

#### ১. Ad Account ID খুঁজে বের করা:
- [Meta Ads Manager](https://adsmanager.facebook.com)-এ যান।
- উপরে বাম কোণায় আপনার অ্যাড অ্যাকাউন্টের ড্রপডাউন সিলেক্টরে ক্লিক করুন।
- নামের নিচে `Account ID: 1234567890` দেখতে পাবেন অথবা ব্রাউজারের URL লক্ষ্য করলে দেখতে পাবেন `act=1234567890`। এই সম্পূর্ণ নম্বরটি কপি করুন।

#### ২. স্থায়ী Access Token (System User Token) তৈরি করার নিয়ম:
সাধারণ পার্সোনাল টোকেন কয়েক ঘণ্টার মধ্যে এক্সপায়ার হয়ে যায়। স্থায়ী কানেকশনের জন্য Meta Business Settings থেকে System User টোকেন ব্যবহার করা সেরা পদ্ধতি:

1. [Meta Business Settings](https://business.facebook.com/settings)-এ যান।
2. বামের মেনু থেকে **Users** ➔ **System Users**-এ ক্লিক করুন।
3. **Add** বাটনে ক্লিক করে একটি নাম দিন (যেমন: `ProfitPulse Bot`) এবং Role দিন `Admin`।
4. এরপর **Add Assets** বাটনে ক্লিক করুন ➔ **Ad Accounts** সিলেক্ট করুন ➔ আপনার অ্যাড অ্যাকাউন্টটি টিক দিন ➔ **Full Control (Manage Ad Account)** অন করে **Save Changes** দিন।
5. এবার **Generate New Token** বাটনে ক্লিক করুন:
   - আপনার অ্যাপ সিলেক্ট করুন।
   - Token Expiration: `Never` বা ৬০ দিন সিলেক্ট করুন।
   - **Available Permissions** তালিকা থেকে নিচের ৩টি পারমিশনে টিক দিন:
     - `ads_read` (বিজ্ঞাপন পড়ার জন্য আবশ্যক)
     - `ads_management` (ক্যাম্পেইন ম্যানেজ করার জন্য)
     - `read_insights` (দৈনিক স্পেন্ড ও মেট্রিক্স জানার জন্য আবশ্যক)
6. **Generate Token** এ ক্লিক করে তৈরি হওয়া টোকেনটি কপি করে নিরাপদে সংরক্ষণ করুন।

#### ৩. ProfitPulse-এ কানেক্ট করা:
1. ড্যাশবোর্ডে **"2. Meta Ads & ROAS"** কার্ডে **"Connect Meta Ads"** বাটনে ক্লিক করুন।
2. **Meta Ad Account ID** ও **Access Token** পেস্ট করুন।
3. **Connect & Sync Ad Account** বাটনে ক্লিক করুন।
4. সাথে সাথে মেটা থেকে আপনার সক্রিয় ক্যাম্পেইনগুলো ফেচ হয়ে ড্যাশবোর্ডে চলে আসবে।

---

### মেটা অ্যাড একাউন্ট ছাড়া সরাসরি টেস্ট করার উপায়
আপনার যদি এই মুহূর্তে কোনো সক্রিয় মেটা অ্যাড অ্যাকাউন্ট বা টোকেন না থাকে, কোনো সমস্যা নেই!
- **Meta Ad Account ID:** দিন `act_test123`
- **Access Token:** দিন `test_token` (বা `mock_token`)
- **Connect** বাটনে ক্লিক করুন।
- ব্যাকএন্ড স্বয়ংক্রিয়ভাবে বাংলাদেশের ট্রেন্ডিং ৩টি ডেমো ক্যাম্পেইন (যেমন: `Panjabi_Eid_MegaSale_CBO`, `Silk_Polo_Conversion_Advantage`) ও লাইভ স্পেন্ড মেট্রিক্স লোড করে দেবে, যার মাধ্যমে আপনি গ্রাউন্ড-ট্রুথ আরওএএস ও প্রফিট ওয়াটারফল লাইভ পরীক্ষা করতে পারবেন।

---

## ৩. Courier Tracking কানেক্ট করার নিয়ম

ProfitPulse বাংলাদেশের শীর্ষস্থানীয় কুরিয়ার সার্ভিস **Steadfast Courier** ও **Pathao Courier**-এর সাথে সরাসরি এপিআই ইন্টিগ্রেটেড।

কানেক্ট করলে যা যা সুবিধা পাবেন:
- ১-ক্লিকে অর্ডার কুরিয়ারে বুকিং দেওয়া।
- পার্সেলের বর্তমান অবস্থান (In Transit, Delivered, Return) স্বয়ংক্রিয়ভাবে ট্র্যাকিং।
- কুরিয়ার থেকে কত টাকা ডেলিভারি হয়েছে কিন্তু এখনো আপনার ব্যাংক অ্যাকাউন্টে জমা হয়নি (**Unsettled Courier COD Cash**) তা নির্ভুলভাবে দেখা।

---

### ক. Steadfast Courier কানেকশন

#### প্রয়োজনীয় তথ্য:
- **API Key**
- **Secret Key**

#### সংগ্রহের নিয়ম:
1. [Steadfast Merchant Portal](https://portal.steadfast.com.bd)-এ লগইন করুন।
2. বাম পাশের মেনু থেকে **Settings** ➔ **Developer / API Settings**-এ যান।
3. সেখানে আপনার মার্চেন্ট অ্যাকাউন্টের **API Key** এবং **Secret Key** প্রদর্শিত হবে।
4. তথ্য দুটি কপি করে ProfitPulse-এর **Courier Settings ➔ Steadfast** ট্যাবে পেস্ট করুন এবং **Save Credentials** বাটনে ক্লিক করুন।

#### Steadfast Webhook (অটো স্ট্যাটাস আপডেটের জন্য):
- Steadfast মার্চেন্ট পোর্টালে Webhook URL চাইলে বসিয়ে দিন:  
  `http://127.0.0.1:8000/api/v1/couriers/webhook/steadfast?tenant_id=YOUR_TENANT_ID`

---

### খ. Pathao Courier কানেকশন

#### প্রয়োজনীয় তথ্য:
- **Client ID**
- **Client Secret**
- **Store ID** (আপনার পিকআপ শপের আইডি)

#### সংগ্রহের নিয়ম:
1. [Pathao Merchant Panel](https://merchant.pathao.com)-এ লগইন করুন।
2. **Settings** ➔ **Developer API**-তে যান।
3. **Create New API Client** এ ক্লিক করে একটি Client Credentials তৈরি করুন।
4. তৈরি হওয়া **Client ID** ও **Client Secret** কপি করুন।
5. পিকআপ শপের Store ID পাওয়ার জন্য **Stores** মেনুতে গিয়ে আপনার শপের আইডি নম্বরটি সংগ্রহ করুন।
6. ProfitPulse-এর **Courier Settings ➔ Pathao** ট্যাবে পেস্ট করে **Save Credentials** দিন।

---

### কুরিয়ার বুকিং ও স্ট্যাটাস সিমুলেশন
আপনার যদি এখনো কুরিয়ার মার্চেন্ট অ্যাকাউন্ট এপ্রুভ না হয়ে থাকে:
- API Key বক্সে লিখুন: `mock_api_key`
- Secret Key বক্সে লিখুন: `mock_secret_key`
- **Save Credentials** দিন।
- এরপর যেকোনো অর্ডারে গিয়ে **Dispatch Courier** দিলে সিস্টেম স্বয়ংক্রিয়ভাবে ট্র্যাকিং কোড জেনারেট করবে এবং ডেলিভারি হিসাব শুরু করবে।

---

## ৪. Product COGS ও মার্জিন সেটআপ

বিজ্ঞাপনের আরওএএস ভালো থাকলেও অনেক সময় দিনশেষে লস হয়, কারণ পণ্যের প্রকৃত ক্রয়মূল্য (COGS), প্যাকেজিং ও হ্যান্ডলিং খরচ বাদ দিয়ে হিসাব করা হয় না।

#### নতুন প্রোডাক্টের খরচ যুক্ত করার নিয়ম:
1. ড্যাশবোর্ডের **"4. Product COGS & Margin"** কার্ডে **"Add Product Cost"** বাটনে ক্লিক করুন (অথবা মেনু থেকে **Products & COGS** পেজে যান)।
2. নিচের তথ্যগুলো দিয়ে ফর্ম পূরণ করুন:
   - **Product Name:** যেমন `Premium Cotton Panjabi`
   - **SKU Code:** যেমন `PANJABI-BLK-L` (অর্ডার সিঙ্ক করার জন্য SKU ব্যবহার করা হয়)।
   - **Selling Price (বিক্রয়মূল্য):** যেমন `৳2850`
   - **Cost Price (কেনা দাম / তৈরি খরচ):** যেমন `৳1100`
   - **Packaging Cost (প্যাকেটের খরচ):** যেমন `৳40`
   - **Handling Cost (ডেলিভারি হ্যান্ডলিং):** যেমন `৳20`
3. **Save Product** বাটনে ক্লিক করুন।

> 🎯 **সুবিধা:** প্রোডাক্ট যুক্ত থাকলে কোনো অর্ডার আসা মাত্রই সিস্টেম স্বয়ংক্রিয়ভাবে লাভ হিসাব করে ফেলবে:  
> `Net Profit = বিক্রয়মূল্য - (কেনা খরচ + প্যাকেজিং খরচ + ডেলিভারি চার্জ + মেটা বিজ্ঞাপন খরচ)`

---

## ৫. সচরাচর জিজ্ঞাস্য (FAQ) ও ট্রাবলশুটিং

### প্রশ্ন ১: লোকালহোস্টে টেস্ট করার সময় WooCommerce Webhook কীভাবে কাজ করবে?
- আপনি যদি লোকাল মেশিনে (`http://localhost:3000` বা `127.0.0.1:8000`) কোড রান করেন এবং বাইরের লাইভ ওয়েবসাইট থেকে ওয়েব হুক টেস্ট করতে চান, তবে **ngrok** ব্যবহার করতে পারেন:
  ```bash
  ngrok http 8000
  ```
  এর ফলে যে `https://xxxx.ngrok-free.app` লিঙ্কটি পাবেন, সেটি আপনার Webhook Delivery URL হিসেবে বসাতে পারেন।
- আর যদি কোনো লাইভ ওয়েবসাইট ছাড়া শুধু ব্যাকএন্ড টেস্ট করতে চান, তবে সরাসরি মোডালের **"Send Sample Test Order"** বাটনটি ব্যবহার করাই সবচেয়ে সহজ ও দ্রুততম উপায়।

### প্রশ্ন ২: একাধিক বিজ্ঞাপন অ্যাকাউন্ট বা একাধিক কুরিয়ার একসাথে ব্যবহার করা যাবে?
- হ্যাঁ! আপনি চাইলে Steadfast ও Pathao দুটিই একসাথে যুক্ত রাখতে পারেন এবং অর্ডার পাঠানোর সময় ড্রপডাউন থেকে যেকোনো একটি সিলেক্ট করে পার্সেল বুক করতে পারবেন।

### প্রশ্ন ৩: মেটা অ্যাক্সেস টোকেন কি মেয়াদোত্তীর্ণ (Expire) হতে পারে?
- হ্যাঁ, পার্সোনাল গ্রাফ এপিআই টোকেন ৬০ দিন পর পর এক্সপায়ার হতে পারে। যদি কখনো ডেটা সিঙ্ক না হয়, তবে মেটা বিজনেস সেটিংস থেকে নতুন টোকেন তৈরি করে **Connect Ad Account**-এ রি-এন্টার করলেই ডেটা পুনরায় সচল হয়ে যাবে।

---

*ProfitPulse Development Documentation — Dhaka, Bangladesh*
