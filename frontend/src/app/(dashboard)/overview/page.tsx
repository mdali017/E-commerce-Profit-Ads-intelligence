"use client";

import { useState, useEffect } from "react";
import { analyticsApi } from "@/lib/analytics";
import { productsApi } from "@/lib/products";
import { ExecutiveOverviewResponse, AIBriefing } from "@/types";
import { ExecutiveHeroKPIs } from "@/components/analytics/ExecutiveHeroKPIs";
import { AIBusinessAnalystCard } from "@/components/analytics/AIBusinessAnalystCard";
import { BleedingCampaignsBanner } from "@/components/analytics/BleedingCampaignsBanner";
import { ExecutiveAlertsFeed } from "@/components/analytics/ExecutiveAlertsFeed";
import { ChannelRevenueCard } from "@/components/analytics/ChannelRevenueCard";
import { PnLTrendChart } from "@/components/pnl/PnLTrendChart";
import { StoreSetupOnboardingCard } from "@/components/analytics/StoreSetupOnboardingCard";
import { ConnectMetaModal } from "@/components/ads/ConnectMetaModal";
import { ConfigureCourierModal } from "@/components/couriers/ConfigureCourierModal";
import { WooCommerceSettingsModal } from "@/components/orders/WooCommerceSettingsModal";
import { AddProductModal } from "@/components/products/AddProductModal";
import {
  Sparkles,
  Calendar,
  RefreshCw,
  Plus,
  Send,
  Zap,
  Truck,
  TrendingUp,
  Share2,
} from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  const [dateRange, setDateRange] = useState("last_7_days");
  const [data, setData] = useState<ExecutiveOverviewResponse | null>(null);
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Quick Integration Modals State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const loadData = async (range: string = dateRange, silent = false) => {
    if (!silent && !data) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const [overviewRes, latestBriefing] = await Promise.all([
        analyticsApi.getOverview(range),
        analyticsApi.getLatestAIBriefing(),
      ]);
      setData(overviewRes);
      if (latestBriefing) {
        setBriefing(latestBriefing);
      } else {
        // Auto-generate initial briefing if none exists
        generateBriefing(range);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateBriefing = async (range: string = dateRange) => {
    setIsGeneratingBriefing(true);
    try {
      const res = await analyticsApi.generateAIBriefing(range);
      setBriefing(res);
    } catch (err: any) {
      console.warn("Could not auto-generate AI briefing at this time:", err?.message || err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    if (!data) return;
    try {
      await analyticsApi.dismissAlert(alertId);
      setData({
        ...data,
        alerts: data.alerts.filter((a) => a.id !== alertId),
      });
    } catch (err: any) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  useEffect(() => {
    const isSilent = !!data;
    loadData(dateRange, isSilent);

    const handleTenantChanged = () => {
      loadData(dateRange, false);
    };

    window.addEventListener("tenantChanged", handleTenantChanged);
    return () => {
      window.removeEventListener("tenantChanged", handleTenantChanged);
    };
  }, [dateRange]);

  // Realtime Polling for Overview: Sync every 15 seconds silently
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(dateRange, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const dateRangeOptions = [
    { label: "Today (আজকে)", value: "today" },
    { label: "Yesterday (গতকাল)", value: "yesterday" },
    { label: "Last 7 Days (৭ দিন)", value: "last_7_days" },
    { label: "Last 30 Days (৩০ দিন)", value: "last_30_days" },
    { label: "This Month (চলতি মাস)", value: "this_month" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Range Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Command Center
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Unified Intelligence
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ground-truth reconciliation of Meta Ad Spend, Steadfast/Pathao Courier Cash, and Real Net Profit.
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            {dateRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dateRange === opt.value
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(dateRange, false)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-amber-800 dark:text-amber-200 text-sm">
          <div className="flex items-center space-x-3">
            <span className="font-semibold">⚠️ Server Notice:</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(dateRange)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
          <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
        </div>
      ) : data ? (
        <>
          {/* Store Setup & Instant Live Data Sync Hub */}
          <StoreSetupOnboardingCard
            integrations={data.integrations}
            onConnectStore={() => setIsStoreModalOpen(true)}
            onConnectMetaAds={() => setIsMetaModalOpen(true)}
            onConnectCourier={() => setIsCourierModalOpen(true)}
            onAddProductCost={() => setIsProductModalOpen(true)}
          />

          {/* 1. Executive Hero KPIs */}
          <ExecutiveHeroKPIs kpis={data.kpis} />

          {/* 2. Bleeding Ad Campaigns Alert Banner */}
          {data.bleeding_campaigns.length > 0 && (
            <BleedingCampaignsBanner campaigns={data.bleeding_campaigns} />
          )}

          {/* 3. System Alerts & Anomalies Feed */}
          {data.alerts.length > 0 && (
            <ExecutiveAlertsFeed alerts={data.alerts} onDismiss={handleDismissAlert} />
          )}

          {/* 4. AI Business Analyst Diagnostic Briefing Card */}
          <AIBusinessAnalystCard
            briefing={briefing}
            isGenerating={isGeneratingBriefing}
            onRegenerate={() => generateBriefing(dateRange)}
          />

          {/* 5. Charts & Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Net Profit Trend Timeseries */}
            <div className="lg:col-span-2">
              <PnLTrendChart points={data.daily_trends as any} />
            </div>

            {/* Sales Channel Breakdown & Shortcuts */}
            <div className="space-y-6">
              <ChannelRevenueCard sources={data.revenue_by_source} />

              {/* Quick Operation Shortcuts */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick Management Shortcuts
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/orders"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-colors flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>New Order</span>
                  </Link>
                  <Link
                    href="/couriers"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-colors flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Courier Dispatch</span>
                  </Link>
                  <Link
                    href="/ads"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-colors flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-500" />
                    <span>Sync Meta Ads</span>
                  </Link>
                  <Link
                    href="/crm"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-colors flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-500" />
                    <span>Send SMS</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Store & Integration Setup Modals */}
      <WooCommerceSettingsModal
        isOpen={isStoreModalOpen}
        onClose={() => {
          setIsStoreModalOpen(false);
          loadData(dateRange);
        }}
      />

      <ConnectMetaModal
        isOpen={isMetaModalOpen}
        onClose={() => setIsMetaModalOpen(false)}
        onConnected={() => {
          setIsMetaModalOpen(false);
          loadData(dateRange);
        }}
      />

      <ConfigureCourierModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        onSaved={() => {
          setIsCourierModalOpen(false);
          loadData(dateRange);
        }}
      />

      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={async (productData) => {
          await productsApi.createProduct(productData);
          setIsProductModalOpen(false);
          loadData(dateRange);
        }}
      />
    </div>
  );
}
