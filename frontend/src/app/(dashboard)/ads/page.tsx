"use client";

import { useEffect, useState, useCallback } from "react";
import { CampaignPerformanceItem, AdsKPIStats } from "@/types";
import { adsApi } from "@/lib/ads";
import { jobsApi, BackgroundJob } from "@/lib/jobs";
import { getSessionCache, setSessionCache } from "@/lib/swr";
import { AdsStats } from "@/components/ads/AdsStats";
import { CampaignTable } from "@/components/ads/CampaignTable";
import { ConnectMetaModal } from "@/components/ads/ConnectMetaModal";
import { BackgroundJobToast } from "@/components/shared/BackgroundJobToast";
import {
  TrendingUp,
  RefreshCw,
  Key,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const ADS_CACHE_KEY = "profitpulse_ads_cache";

interface AdsCacheData {
  campaigns: CampaignPerformanceItem[];
  kpis: AdsKPIStats | null;
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<CampaignPerformanceItem[]>([]);
  const [kpis, setKpis] = useState<AdsKPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeJob, setActiveJob] = useState<BackgroundJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent && campaigns.length === 0) setLoading(true);
    setError(null);
    try {
      const [perfData, kpisData] = await Promise.all([
        adsApi.getCampaignPerformance(),
        adsApi.getAdsKPIs(),
      ]);
      setCampaigns(perfData);
      setKpis(kpisData);
      setSessionCache<AdsCacheData>(ADS_CACHE_KEY, { campaigns: perfData, kpis: kpisData });
    } catch (err: any) {
      console.error("Failed to load ads intelligence:", err);
      setError(
        err?.message ||
          "Failed to load ads data. Ensure backend is running and workspace is active."
      );
    } finally {
      setLoading(false);
    }
  }, [campaigns.length]);

  useEffect(() => {
    // 1. Immediately hydrate from client session cache for 0ms instant render
    const cached = getSessionCache<AdsCacheData>(ADS_CACHE_KEY);
    if (cached) {
      setCampaigns(cached.campaigns);
      setKpis(cached.kpis);
      setLoading(false);
    }
    // 2. Silently revalidate fresh metrics in background
    loadData(!!cached);
  }, []);

  const handleSyncInsights = async () => {
    setSyncing(true);
    try {
      const init = await jobsApi.triggerAdsInsights();
      setActiveJob({
        job_id: init.job_id,
        type: "meta_insights_sync",
        status: "queued",
        progress: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await jobsApi.pollJobUntilDone(init.job_id, (job) => {
        setActiveJob(job);
      });
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to sync Meta insights.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Meta Ads & True ROAS Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ground-truth comparison: Meta Pixel claimed conversions vs. actual courier-delivered cash & POAS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncInsights}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing Meta..." : "Sync Meta Insights"}
          </button>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Key className="w-4 h-4" />
            Connect Ad Account
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Ground-Truth Explanation Alert */}
      <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-800/60 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">Why True ROAS Matters: </span>
          Meta Ads Manager shows purchases claimed by the Facebook Pixel—ignoring fake phone numbers, cancelled orders, and courier return packages. Our intelligence engine reconciles each campaign's spend directly with <span className="font-semibold text-emerald-600 dark:text-emerald-400">actual cash collected by Steadfast & Pathao</span> to display your real bank-account ROAS and Blended POAS (Profit On Ad Spend).
        </div>
      </div>

      {/* KPI Cards */}
      <AdsStats stats={kpis} />

      {/* Campaign Attribution & Comparison Table */}
      <CampaignTable campaigns={campaigns} loading={loading} />

      {/* Connect Meta Modal */}
      <ConnectMetaModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={loadData}
      />

      {/* Floating Background Sync Toast */}
      <BackgroundJobToast
        job={activeJob}
        onDismiss={() => setActiveJob(null)}
        title="Meta Ads Insights Sync"
      />
    </div>
  );
}
