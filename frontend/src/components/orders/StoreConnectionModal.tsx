"use client";

import { useState } from "react";
import { authStorage } from "@/lib/auth";
import {
  X,
  Copy,
  Check,
  Globe,
  RefreshCw,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Code,
  Terminal,
  ShoppingBag,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export type StorePlatform = "woocommerce" | "custom" | "shopify" | "wix";

export type CodeLanguage = "javascript" | "php" | "curl" | "python";

export interface StoreConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function StoreConnectionModal({
  isOpen,
  onClose,
  onConnected,
}: StoreConnectionModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<StorePlatform>("woocommerce");
  const [codeLang, setCodeLang] = useState<CodeLanguage>("javascript");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [showTunnelInput, setShowTunnelInput] = useState(false);
  const [sendingTestOrder, setSendingTestOrder] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const tenantId = authStorage.getActiveTenantId() || "";
  const defaultBackendBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  const backendBase = tunnelUrl.trim()
    ? `${tunnelUrl.trim().replace(/\/$/, "")}/api/v1`
    : defaultBackendBase;

  // Dedicated Webhook Endpoints
  const endpoints: Record<StorePlatform, string> = {
    woocommerce: `${backendBase}/orders/webhook/woocommerce${tenantId ? `?tenant_id=${tenantId}` : ""}`,
    custom: `${backendBase}/orders/webhook/custom${tenantId ? `?tenant_id=${tenantId}` : ""}`,
    shopify: `${backendBase}/orders/webhook/shopify${tenantId ? `?tenant_id=${tenantId}` : ""}`,
    wix: `${backendBase}/orders/webhook/custom${tenantId ? `?tenant_id=${tenantId}` : ""}`,
  };

  const activeWebhookUrl = endpoints[selectedPlatform];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeWebhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleSendTestOrder = async () => {
    setSendingTestOrder(true);
    setErrorMessage(null);
    setTestOrderResult(null);

    try {
      const simulateUrl = `${backendBase}/orders/webhook/test-sample?tenant_id=${tenantId}&platform=${selectedPlatform}`;
      const res = await fetch(simulateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Request failed with HTTP status ${res.status}`);
      }

      const orderData = await res.json();
      setTestOrderResult(orderData);
      if (onConnected) {
        onConnected();
      }
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setErrorMessage("❌ ব্যাকএন্ড সার্ভার (Port 8000) অফলাইনে আছে। টার্মিনালে uvicorn (Backend) চালু আছে কি না নিশ্চিত করুন।");
      } else {
        setErrorMessage(err.message || "Failed to send test order. Please try again.");
      }
    } finally {
      setSendingTestOrder(false);
    }
  };

  // Code Snippets for Custom Code Integration
  const codeSnippets: Record<CodeLanguage, string> = {
    javascript: `// Next.js (App Router / Pages) or React / Node.js
async function sendOrderToProfitPulse(order) {
  const response = await fetch("${activeWebhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": "${tenantId}"
    },
    body: JSON.stringify({
      order_id: order.id, // e.g. "ORD-9821"
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      customer_email: order.customer.email,
      shipping_address: order.shipping.address,
      shipping_city: order.shipping.city || "Dhaka",
      shipping_fee: order.shipping_cost || 80.00,
      discount_amount: order.discount || 0.00,
      payment_method: order.payment_method || "cod", // "cod", "bkash", "nagad", "card"
      payment_status: order.is_paid ? "paid" : "pending",
      items: order.items.map(item => ({
        product_name: item.title,
        sku: item.sku, // Matches catalog for auto COGS
        quantity: item.qty,
        unit_price: item.price
      })),
      utm_source: order.utm_source || "custom_website",
      utm_campaign: order.utm_campaign,
      fbclid: order.fbclid
    })
  });
  return await response.json();
}`,
    php: `<?php
// PHP / Laravel Checkout Controller
function sendOrderToProfitPulse($order) {
    $url = "${activeWebhookUrl}";
    
    $payload = [
        "order_id" => (string)$order['id'],
        "customer_name" => $order['customer_name'],
        "customer_phone" => $order['phone'],
        "customer_email" => $order['email'] ?? null,
        "shipping_address" => $order['address'],
        "shipping_city" => $order['city'] ?? "Dhaka",
        "shipping_fee" => (float)($order['shipping_fee'] ?? 80.00),
        "discount_amount" => (float)($order['discount'] ?? 0.00),
        "payment_method" => $order['payment_method'] ?? "cod",
        "payment_status" => !empty($order['is_paid']) ? "paid" : "pending",
        "items" => array_map(function($item) {
            return [
                "product_name" => $item['name'],
                "sku" => $item['sku'] ?? null,
                "quantity" => (int)$item['qty'],
                "unit_price" => (float)$item['price']
            ];
        }, $order['items'])
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "X-Tenant-ID: ${tenantId}"
    ]);

    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}`,
    curl: `curl -X POST "${activeWebhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Tenant-ID: ${tenantId}" \\
  -d '{
    "order_id": "ORD-10921",
    "customer_name": "Karim Hasan",
    "customer_phone": "01712345678",
    "customer_email": "karim@example.com",
    "shipping_address": "House 24, Road 7, Dhanmondi",
    "shipping_city": "Dhaka",
    "shipping_fee": 80.00,
    "discount_amount": 0.00,
    "payment_method": "cod",
    "payment_status": "pending",
    "items": [
      {
        "product_name": "Men Casual Polo Shirt",
        "sku": "POLO-BLK-M",
        "quantity": 1,
        "unit_price": 1200.00
      }
    ],
    "utm_source": "facebook",
    "utm_campaign": "eid_mega_sale"
  }'`,
    python: `# Python / Django / FastAPI Backend
import requests

def send_order_to_profitpulse(order_data):
    url = "${activeWebhookUrl}"
    headers = {
        "Content-Type": "application/json",
        "X-Tenant-ID": "${tenantId}"
    }
    payload = {
        "order_id": str(order_data["id"]),
        "customer_name": order_data["customer_name"],
        "customer_phone": order_data["phone"],
        "shipping_address": order_data["address"],
        "shipping_city": order_data.get("city", "Dhaka"),
        "shipping_fee": float(order_data.get("shipping_fee", 80.0)),
        "discount_amount": float(order_data.get("discount", 0.0)),
        "payment_method": order_data.get("payment_method", "cod"),
        "payment_status": "paid" if order_data.get("is_paid") else "pending",
        "items": [
            {
                "product_name": item["name"],
                "sku": item.get("sku"),
                "quantity": int(item["qty"]),
                "unit_price": float(item["price"])
            }
            for item in order_data.get("items", [])
        ]
    }
    res = requests.post(url, json=payload, headers=headers)
    return res.json()`,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Connect Your Website / Store</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Universal Hub
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                রিয়েল-টাইম অর্ডার ইনজেশন, স্বয়ংক্রিয় COGS স্ন্যাপশট ও নেট প্রফিট ক্যালকুলেশন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="p-6 pb-0">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            ধাপ ১: আপনার ওয়েবসাইটের প্রযুক্তি (Platform / Tech) নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* WooCommerce */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform("woocommerce");
                setTestOrderResult(null);
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlatform === "woocommerce"
                  ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 shadow-xs ring-2 ring-purple-600/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                  W
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  WordPress
                </span>
              </div>
              <div>
                <p className="text-xs font-bold">WooCommerce</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">ওয়ার্ডপ্রেস শপ</p>
              </div>
            </button>

            {/* Custom Code */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform("custom");
                setTestOrderResult(null);
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlatform === "custom"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs ring-2 ring-blue-600/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  <Code className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  Universal API
                </span>
              </div>
              <div>
                <p className="text-xs font-bold">Custom Code</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Next.js / PHP / React</p>
              </div>
            </button>

            {/* Shopify */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform("shopify");
                setTestOrderResult(null);
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlatform === "shopify"
                  ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-600/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Shopify
                </span>
              </div>
              <div>
                <p className="text-xs font-bold">Shopify Store</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">অটোমেটিক ওয়েবহুক</p>
              </div>
            </button>

            {/* Wix */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform("wix");
                setTestOrderResult(null);
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlatform === "wix"
                  ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs ring-2 ring-amber-600/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  Wix / Form
                </span>
              </div>
              <div>
                <p className="text-xs font-bold">Wix & Landing</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Wix Automations</p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Content Body based on Selected Platform */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Test Order Success Result Banner */}
          {testOrderResult && (
            <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/50 space-y-2.5 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    ✅ টেস্ট অর্ডার সফলভাবে রিসিভ হয়েছে ও ডাটাবেসে সেভ হয়েছে!
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Status: Connected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-[10px] text-slate-500">Order Number</p>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{testOrderResult.order_number}</p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-[10px] text-slate-500">Customer</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{testOrderResult.customer_name}</p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-[10px] text-slate-500">Total Revenue</p>
                  <p className="font-bold text-emerald-600">৳{Number(testOrderResult.total_amount).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50">
                  <p className="text-[10px] text-slate-500">Net Profit (লকড)</p>
                  <p className="font-bold text-purple-600">৳{Number(testOrderResult.gross_profit || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Platform Step-by-Step Instructions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>ধাপ ২: কানেক্ট করার নিয়মাবলী</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 lowercase font-medium">
                ({selectedPlatform})
              </span>
            </h3>

            {/* WooCommerce Specific Steps */}
            {selectedPlatform === "woocommerce" && (
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  আপনার ওয়ার্ডপ্রেস অ্যাডমিনে প্রবেশ করুন ➔{" "}
                  <strong className="text-slate-900 dark:text-white">WooCommerce</strong> ➔{" "}
                  <strong className="text-slate-900 dark:text-white">Settings</strong> ➔{" "}
                  <strong className="text-slate-900 dark:text-white">Advanced</strong> ট্যাবে যান।
                </li>
                <li>
                  সাব-মেনু থেকে <strong className="text-slate-900 dark:text-white">Webhooks</strong> সিলেক্ট করে{" "}
                  <strong className="text-slate-900 dark:text-white">"Add webhook"</strong> বাটনে ক্লিক করুন।
                </li>
                <li>
                  <strong>Topic:</strong> ড্রপডাউন থেকে সিলেক্ট করুন{" "}
                  <span className="font-mono text-purple-600 font-semibold">Order created</span>
                </li>
                <li>
                  <strong>Delivery URL:</strong> নিচের বক্সে থাকা আপনার নির্দিষ্ট Webhook URL টি কপি করে পেস্ট করুন।
                </li>
              </ol>
            )}

            {/* Custom Code Specific Steps */}
            {selectedPlatform === "custom" && (
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  আপনার ওয়েবসাইটের Checkout / Order Confirmation ব্যাকএন্ড ফাংশনে নিচের Universal API-তে একটি HTTP POST রিকোয়েস্ট পাঠান।
                </li>
                <li>
                  যেকোনো ফ্রেমওয়ার্ক (Next.js, PHP, Laravel, Node.js, Python) থেকে সরাসরি ডেটা রিসিভ করা যাবে।
                </li>
                <li>
                  অর্ডার প্লেস হওয়ার সাথে সাথে গ্রাহকের নাম, ফোন, আইটেমের দাম ও UTM ট্র্যাকিং ট্যাগ স্বয়ংক্রিয়ভাবে ইনজেস্ট হবে।
                </li>
              </ol>
            )}

            {/* Shopify Specific Steps */}
            {selectedPlatform === "shopify" && (
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Shopify Admin প্যানেলে যান ➔ <strong className="text-slate-900 dark:text-white">Settings</strong> (নিচে বামে) ➔{" "}
                  <strong className="text-slate-900 dark:text-white">Notifications</strong> এ ক্লিক করুন।
                </li>
                <li>
                  স্ক্রোল করে নিচে <strong className="text-slate-900 dark:text-white">Webhooks</strong> সেকশনে গিয়ে{" "}
                  <strong className="text-slate-900 dark:text-white">Create webhook</strong> এ ক্লিক করুন।
                </li>
                <li>
                  <strong>Event:</strong> নির্বাচন করুন <span className="font-mono text-emerald-600 font-semibold">Order creation</span>,{" "}
                  <strong>Format:</strong> <span className="font-mono">JSON</span>।
                </li>
                <li>
                  <strong>URL:</strong> নিচের কপি করা Shopify Webhook URL টি পেস্ট করে <strong>Save</strong> দিন।
                </li>
              </ol>
            )}

            {/* Wix Specific Steps */}
            {selectedPlatform === "wix" && (
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Wix Dashboard ➔ <strong className="text-slate-900 dark:text-white">Automations</strong> ➔{" "}
                  <strong className="text-slate-900 dark:text-white">New Automation</strong> এ যান।
                </li>
                <li>
                  <strong>Trigger:</strong> সিলেক্ট করুন <span className="font-semibold text-amber-600">"Wix Stores: Customer places an order"</span>।
                </li>
                <li>
                  <strong>Action:</strong> সিলেক্ট করুন <span className="font-semibold text-amber-600">"Connect to Webhook"</span> এবং নিচের URL টি পেস্ট করুন।
                </li>
              </ol>
            )}

            {/* Dedicated Delivery URL Copy Box */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                আপনার ডেডিকেটেড Webhook Delivery URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeWebhookUrl}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy URL
                    </>
                  )}
                </button>
              </div>

              {/* Public Tunnel / Live Domain helper for testing online WordPress sites */}
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowTunnelInput(!showTunnelInput)}
                  className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>🌐 অনলাইন/রিয়েল সাইট (TasteWP / Live WordPress) দিয়ে টেস্ট করছেন? পাবলিক টানেল সেট করুন</span>
                </button>
                {showTunnelInput && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-1.5">
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      আপনার ngrok / localtunnel লিংকটি দিন (যেমন: <code className="text-purple-700 dark:text-purple-300 font-mono">https://xyz.ngrok-free.app</code> বা আপনার লাইভ ডোমেন):
                    </p>
                    <input
                      type="url"
                      placeholder="https://your-ngrok-or-domain.app"
                      value={tunnelUrl}
                      onChange={(e) => setTunnelUrl(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Code Language Snippets (Only for Custom Code) */}
          {selectedPlatform === "custom" && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-slate-100">
              {/* Language Selector Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">ইন্টিগ্রেশন কোড স্নিপেট:</span>
                </div>
                <div className="flex items-center gap-1">
                  {(["javascript", "php", "curl", "python"] as CodeLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCodeLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
                        codeLang === lang
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {lang === "javascript" ? "Next.js / JS" : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Pre Block */}
              <div className="relative p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-56">
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeSnippets[codeLang])}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </button>
                <pre>{codeSnippets[codeLang]}</pre>
              </div>
            </div>
          )}

          {/* Interactive Simulation & 1-Click Verification Card */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  ধাপ ৩: ১-ক্লিক লাইভ টেস্ট (ওয়েবসাইট ছাড়া সরাসরি ভেরিফাই করুন)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Live Verification
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              আপনার নির্বাচিত <strong className="text-slate-900 dark:text-white uppercase font-bold">{selectedPlatform}</strong> প্ল্যাটফর্মের একটি বাস্তবমুখী স্যাম্পল অর্ডার পাঠিয়ে সিস্টেমটি সরাসরি টেস্ট করুন। এতে সাথে সাথে আপনার ড্যাশবোর্ডে রিয়েল রেভিনিউ ও প্রফিট সিঙ্ক হবে।
            </p>

            <button
              type="button"
              onClick={handleSendTestOrder}
              disabled={sendingTestOrder}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center space-x-2 transition-all shadow-sm shadow-purple-500/25 disabled:opacity-50 cursor-pointer"
            >
              {sendingTestOrder ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Realtime Test Order...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Send Sample {selectedPlatform.toUpperCase()} Test Order (১-ক্লিক ভেরিফাই)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Idempotency Protected — কোনো ডুপ্লিকেট অর্ডার ঢুকবে না।</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Backwards-compatible alias for existing imports
export const WooCommerceSettingsModal = StoreConnectionModal;

