"use client";

import React from "react";
import { BleedingCampaignSummary } from "@/types";
import { AlertTriangle, AlertOctagon, ArrowUpRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface BleedingCampaignsBannerProps {
  campaigns: BleedingCampaignSummary[];
  currency?: string;
}

export function BleedingCampaignsBanner({
  campaigns,
  currency = "৳",
}: BleedingCampaignsBannerProps) {
  if (campaigns.length === 0) return null;

  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center space-x-2">
              <span>Bleeding Ad Campaigns Detected ({campaigns.length})</span>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                Budget Drain
              </span>
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
              These campaigns have high ad spend with zero deliveries or high return rates, causing net loss.
            </p>
          </div>
        </div>

        <Link
          href="/ads"
          className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 flex items-center space-x-1"
        >
          <span>Manage in Ads Manager</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {campaigns.map((camp) => (
          <div
            key={camp.campaign_id}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xs space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                  {camp.campaign_name}
                </h4>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-3">
                  <span>Spend: {currency}{Number(camp.ad_spend).toLocaleString()}</span>
                  <span>•</span>
                  <span>Delivered: {camp.delivered_orders}</span>
                  <span>•</span>
                  <span>Returns: {camp.return_rate}%</span>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  camp.severity === "critical"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {camp.severity}
              </span>
            </div>

            <p className="text-xs text-rose-800 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/30 p-2 rounded-lg font-medium leading-relaxed">
              {camp.diagnostic_issue}
            </p>

            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Action: {camp.recommendation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

