"use client";

import React, { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Settings2,
  Plus,
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
  const [isExpanded, setIsExpanded] = useState(false);

  const storeConnected = integrations?.store_connected ?? false;
  const metaConnected = integrations?.meta_ads_connected ?? false;
  const courierConnected = integrations?.courier_connected ?? false;
  const productsConfigured = integrations?.products_configured ?? false;
  const connectedCouriers = integrations?.connected_couriers ?? [];

  const totalConnected = [
    storeConnected,
    metaConnected,
    courierConnected,
    productsConfigured,
  ].filter(Boolean).length;

  const progressPercent = Math.round((totalConnected / 4) * 100);
  const allConnected = totalConnected === 4;

  // Courier display label
  const getCourierLabel = () => {
    if (!courierConnected) return "Courier";
    if (connectedCouriers.length > 1) {
      const names = connectedCouriers.map(
        (c) => c.charAt(0).toUpperCase() + c.slice(1)
      );
      return `Courier: ${names.join(" & ")}`;
    }
    if (connectedCouriers.length === 1) {
      const name = connectedCouriers[0].charAt(0).toUpperCase() + connectedCouriers[0].slice(1);
      return `Courier: ${name}`;
    }
    return "Courier (Steadfast/Pathao)";
  };

  // 1. ALL CONNECTED (100% COMPLETE) SLIM STATE
  if (allConnected && !isExpanded) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900/60 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                All 4 Systems Connected & Live Syncing
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                100% Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live orders, ad spend, and courier reconciliation are actively computing your Net Profit in real-time.
            </p>
          </div>
        </div>

        {/* Compact Badges Row */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onConnectStore}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Manage Store Webhooks"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Store</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={onConnectMetaAds}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Manage Meta Ad Account"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Meta Ads</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={onConnectCourier}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Manage Steadfast & Pathao Courier Integrations"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{connectedCouriers.length > 1 ? "Couriers (Multi)" : "Courier"}</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={onAddProductCost}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Manage Product Catalog COGS"
          >
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span>COGS</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Manage</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // Count how many cards are pending
  const pendingCount = 4 - totalConnected;

  // Responsive grid layout based on pending count
  const gridColsClass =
    pendingCount === 3
      ? "grid-cols-1 md:grid-cols-3"
      : pendingCount === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : pendingCount === 1
      ? "grid-cols-1 md:max-w-md"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 shadow-md shadow-emerald-500/5 p-6 space-y-6 relative overflow-hidden transition-all">
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
                {allConnected ? "Configured" : "Getting Started"}
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

      {/* 1. Connected Services Badges Bar (Shown when at least 1 service is connected) */}
      {totalConnected > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-950/50 border border-emerald-500/20 backdrop-blur-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Active Integrations:
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {storeConnected && (
              <button
                onClick={onConnectStore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500 transition-colors cursor-pointer group"
                title="Manage Store Webhook & Ingestion"
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Store Webhook</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 group-hover:underline ml-0.5">
                  Manage
                </span>
              </button>
            )}

            {metaConnected && (
              <button
                onClick={onConnectMetaAds}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500 transition-colors cursor-pointer group"
                title="Manage Meta Ad Account"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Meta Ad Account</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 group-hover:underline ml-0.5">
                  Manage
                </span>
              </button>
            )}

            {courierConnected && (
              <button
                onClick={onConnectCourier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500 transition-colors cursor-pointer group"
                title="Manage Steadfast & Pathao Courier Integrations"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{getCourierLabel()}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 group-hover:underline ml-0.5">
                  Manage / +Add
                </span>
              </button>
            )}

            {productsConfigured && (
              <button
                onClick={onAddProductCost}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500 transition-colors cursor-pointer group"
                title="Manage Catalog COGS & Margins"
              >
                <Package className="w-3.5 h-3.5 text-amber-500" />
                <span>Product COGS</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 group-hover:underline ml-0.5">
                  Manage
                </span>
              </button>
            )}

            {allConnected && (
              <button
                onClick={() => setIsExpanded(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-auto"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Action Required Cards (Show ONLY unconnected cards) */}
      {pendingCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>Action Required to Complete Setup:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {pendingCount} remaining
              </span>
            </span>
          </div>

          <div className={`grid ${gridColsClass} gap-4`}>
            {/* Card 1: Website / WooCommerce */}
            {!storeConnected && (
              <div className="rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Website / Store
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Connect WooCommerce, Shopify, or Custom Code (PHP/Next.js/React) to ingest real-time orders, attribution & revenue.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onConnectStore}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20"
                >
                  <span>Connect Website Store</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Card 2: Meta Ads (Facebook) */}
            {!metaConnected && (
              <div className="rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
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
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-500/20"
                >
                  <span>Connect Meta Ads</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Card 3: Courier Tracking (Steadfast / Pathao) */}
            {!courierConnected && (
              <div className="rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        3. Courier (Steadfast/Pathao)
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Multi-Courier
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Connect Steadfast and/or Pathao APIs to track parcel delivery success %, return risk & unsettled COD cash.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onConnectCourier}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20"
                >
                  <span>Connect Courier API</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Card 4: Product COGS & Margin */}
            {!productsConfigured && (
              <div className="rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
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
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-500/20"
                >
                  <span>Add Product Cost</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
