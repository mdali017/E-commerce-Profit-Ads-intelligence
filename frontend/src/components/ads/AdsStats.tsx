"use client";

import { AdsKPIStats } from "@/types";
import {
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  MousePointerClick,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface AdsStatsProps {
  stats: AdsKPIStats | null;
}

export function AdsStats({ stats }: AdsStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const isInflated = stats.meta_claimed_roas > stats.actual_delivered_roas && stats.actual_delivered_roas > 0;
  const inflationGap = isInflated
    ? (((stats.meta_claimed_roas - stats.actual_delivered_roas) / stats.actual_delivered_roas) * 100).toFixed(0)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Ad Spend */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Ad Spend
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.total_spend)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({stats.total_clicks.toLocaleString()} clicks)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
          <span>Avg CPC: ৳{Number(stats.average_cpc).toFixed(2)}</span>
          <span>CTR: {stats.average_ctr}%</span>
        </div>
      </div>

      {/* 2. Meta Claimed vs Actual Delivered ROAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            ROAS Intelligence
            {isInflated && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                +{inflationGap}% Gap
              </span>
            )}
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-xs text-slate-400">Actual Delivered:</div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.actual_delivered_roas}x
            </span>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Meta Claimed:</div>
            <span className="text-base font-bold text-slate-400 line-through">
              {stats.meta_claimed_roas}x
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Real cash ROAS based on courier deliveries
        </div>
      </div>

      {/* 3. Blended POAS (Profit On Ad Spend) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Blended POAS
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.blended_poas}x
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
            {stats.blended_poas >= 1.0 ? "Profitable" : "Losing Money"}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Gross Profit ÷ Ad Spend (Real cash margin)
        </div>
      </div>

      {/* 4. Real Delivered Revenue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Delivered Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.actual_delivered_revenue)}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {stats.delivered_orders} orders
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Delivery rate: {stats.delivery_rate_percent}% ({stats.returned_orders} returned)
        </div>
      </div>
    </div>
  );
}

