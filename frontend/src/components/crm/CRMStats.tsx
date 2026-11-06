"use client";

import React from "react";
import { CRMKPIStats } from "@/types";
import { Users, Repeat, TrendingUp, AlertTriangle, Send } from "lucide-react";

interface CRMStatsProps {
  stats: CRMKPIStats | null;
  currency?: string;
}

export function CRMStats({ stats, currency = "BDT" }: CRMStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Total Customers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Customers
          </span>
          <Users className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
          {stats.total_customers.toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 block mt-0.5">
          Unique mobile profiles
        </span>
      </div>

      {/* Repeat Customer Rate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Repeat Buyer Rate
          </span>
          <Repeat className="w-4 h-4 text-teal-500" />
        </div>
        <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
          {stats.repeat_rate_percent}%
        </div>
        <span className="text-[11px] text-slate-400 block mt-0.5">
          {stats.repeat_customers_count} customers (2+ delivered)
        </span>
      </div>

      {/* Average LTV */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Average LTV
          </span>
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
          {currency} {Number(stats.average_ltv).toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 block mt-0.5">
          Lifetime value per customer
        </span>
      </div>

      {/* High Return Risk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            High Return Risk
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
          {stats.high_risk_customers_count}
        </div>
        <span className="text-[11px] text-rose-500/80 block mt-0.5">
          &gt;30% historical return rate
        </span>
      </div>

      {/* Automated SMS Sent */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total SMS Sent
          </span>
          <Send className="w-4 h-4 text-purple-500" />
        </div>
        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
          {stats.total_sms_sent.toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 block mt-0.5">
          Delivery triggers &amp; notifications
        </span>
      </div>
    </div>
  );
}

