"use client";

import React from "react";
import { IntegrationStatus } from "@/types";
import {
  Sparkles,
  Globe,
  Share2,
  Truck,
  Package,
  CheckCircle2,
  ArrowRight,
  Zap,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface StoreSetupOnboardingCardProps {
  integrations?: IntegrationStatus;
  onConnectStore: () => void;
  onConnectMetaAds: () => void;
  onConnectCourier: () => void;
  onAddProductCost: () => void;
}

export function StoreSetupOnboardingCard({
  integrations,
  onConnectStore,
  onConnectMetaAds,
  onConnectCourier,
  onAddProductCost,
}: StoreSetupOnboardingCardProps) {
  const storeConnected = integrations?.store_connected ?? false;
  const metaConnected = integrations?.meta_ads_connected ?? false;
  const courierConnected = integrations?.courier_connected ?? false;
  const productsConfigured = integrations?.products_configured ?? false;

  const totalConnected = [
    storeConnected,
    metaConnected,
    courierConnected,
    productsConfigured,
  ].filter(Boolean).length;

  const progressPercent = Math.round((totalConnected / 4) * 100);
  const allConnected = totalConnected === 4;

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 shadow-md shadow-emerald-500/5 p-6 space-y-6 relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Store Setup & Instant Live Data Sync Hub
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Getting Started
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Connect your Store, Meta Ads, Courier, and Product Costs. Data syncs automatically in real-time to replace ৳0 with live metrics.
            </p>
          </div>
        </div>

        {/* Progress Counter & Bar */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Setup Progress:
            </span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalConnected} of 4 Connected ({progressPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-48 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Interactive Connection Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Website / WooCommerce */}
        <div
          className={`rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 ${
            storeConnected
              ? "bg-white/80 dark:bg-slate-900/80 border-emerald-500/40 shadow-xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm"
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              {storeConnected ? (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Website / Store
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect WooCommerce or Shopify to ingest real-time orders, attribution & revenue.
              </p>
            </div>
          </div>

          <button
            onClick={onConnectStore}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              storeConnected
                ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20"
            }`}
          >
            <span>{storeConnected ? "Manage Webhook / Sync" : "Connect Website Store"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Meta Ads (Facebook) */}
        <div
          className={`rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 ${
            metaConnected
              ? "bg-white/80 dark:bg-slate-900/80 border-emerald-500/40 shadow-xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:shadow-sm"
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              {metaConnected ? (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Meta Ads & ROAS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect Facebook Ad Account to sync daily ad spend, campaign ROAS & detect ad leakage.
              </p>
            </div>
          </div>

          <button
            onClick={onConnectMetaAds}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              metaConnected
                ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-500/20"
            }`}
          >
            <span>{metaConnected ? "Manage Ad Account" : "Connect Meta Ads"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Courier Tracking */}
        <div
          className={`rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 ${
            courierConnected
              ? "bg-white/80 dark:bg-slate-900/80 border-emerald-500/40 shadow-xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm"
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              {courierConnected ? (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Courier (Steadfast/Pathao)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect courier API to track parcel delivery success %, return risk & unsettled COD cash.
              </p>
            </div>
          </div>

          <button
            onClick={onConnectCourier}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              courierConnected
                ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20"
            }`}
          >
            <span>{courierConnected ? "Manage Courier API" : "Connect Courier API"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Product COGS */}
        <div
          className={`rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 ${
            productsConfigured
              ? "bg-white/80 dark:bg-slate-900/80 border-emerald-500/40 shadow-xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-sm"
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              {productsConfigured ? (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Configured
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                4. Product COGS & Margin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Add wholesale cost and packaging fee to calculate your True Net Profit accurately.
              </p>
            </div>
          </div>

          <button
            onClick={onAddProductCost}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              productsConfigured
                ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-500/20"
            }`}
          >
            <span>{productsConfigured ? "Manage Catalog Costs" : "Add Product Cost"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Instant Sync Benefit Footer Callout */}
      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-950/60 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>রিয়েল-টাইম অটো-সিঙ্ক:</strong> যেকোনো একটি কানেক্ট করার সাথে সাথেই ব্যাকএন্ডে স্বয়ংক্রিয়ভাবে ডেটা সিঙ্ক হয়ে ড্যাশবোর্ডে ৳০ মানগুলো লাইভ মেট্রিক্সে রূপান্তর হবে।
          </span>
        </div>
      </div>
    </div>
  );
}

