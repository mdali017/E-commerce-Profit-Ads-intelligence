"use client";

import { CampaignPerformanceItem } from "@/types";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Percent,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface CampaignTableProps {
  campaigns: CampaignPerformanceItem[];
  loading: boolean;
}

export function CampaignTable({ campaigns, loading }: CampaignTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Campaigns Synced
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Connect your Meta Ad Account above and click "Sync Meta Insights" to see real campaign performance and True ROAS.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Campaign Name</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-right">Ad Spend</th>
              <th className="px-4 py-3.5 text-right">Clicks (CPC)</th>
              <th className="px-4 py-3.5 text-right">Meta Claimed ROAS</th>
              <th className="px-4 py-3.5 text-right">Actual Delivered ROAS</th>
              <th className="px-4 py-3.5 text-right">Blended POAS</th>
              <th className="px-5 py-3.5 text-center">Ground Truth Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {campaigns.map((c) => {
              const isProfitable = c.blended_poas >= 1.0;
              const hasInflation = c.roas_inflation_percent > 20;

              return (
                <tr
                  key={c.campaign_id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Campaign Name */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">
                      {c.campaign_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ID: {c.campaign_id}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  {/* Ad Spend */}
                  <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                    ৳{Number(c.spend).toFixed(0)}
                  </td>

                  {/* Clicks & CPC */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.clicks.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ৳{Number(c.cpc).toFixed(2)} CPC ({c.ctr}%)
                    </div>
                  </td>

                  {/* Meta Claimed ROAS */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="font-bold text-purple-700 dark:text-purple-400">
                      {c.meta_claimed_roas}x
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Claimed: ৳{Number(c.meta_reported_conversion_value).toFixed(0)}
                    </div>
                  </td>

                  {/* Actual Delivered ROAS */}
                  <td className="px-4 py-3.5 text-right">
                    <div
                      className={`font-black text-sm ${
                        c.actual_delivered_roas >= 2.0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : c.actual_delivered_roas >= 1.0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {c.actual_delivered_roas}x
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Cash: ৳{Number(c.actual_delivered_revenue).toFixed(0)} ({c.delivered_orders_count} orders)
                    </div>
                  </td>

                  {/* Blended POAS */}
                  <td className="px-4 py-3.5 text-right">
                    <div
                      className={`font-black text-sm flex items-center justify-end gap-1 ${
                        isProfitable
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      {c.blended_poas}x
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Profit: ৳{Number(c.actual_gross_profit).toFixed(0)}
                    </div>
                  </td>

                  {/* Ground-Truth Gap Badge */}
                  <td className="px-5 py-3.5 text-center">
                    {hasInflation ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        +{c.roas_inflation_percent}% Meta Gap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Accurate
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

