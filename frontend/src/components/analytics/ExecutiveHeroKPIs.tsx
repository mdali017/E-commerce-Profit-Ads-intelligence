"use client";

import React from "react";
import { ExecutiveKPIs } from "@/types";
import {
  TrendingUp,
  DollarSign,
  Truck,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
} from "lucide-react";

interface ExecutiveHeroKPIsProps {
  kpis: ExecutiveKPIs;
  currency?: string;
}

export function ExecutiveHeroKPIs({ kpis, currency = "৳" }: ExecutiveHeroKPIsProps) {
  const isProfitable = Number(kpis.net_profit) >= 0;
  const isHealthyDelivery = kpis.delivery_success_rate >= 75;
  const isModerateDelivery = kpis.delivery_success_rate >= 60 && kpis.delivery_success_rate < 75;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Net Profit & Margin */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Net Profit (নিট লাভ)
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isProfitable
                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
            }`}
          >
            {kpis.net_margin_percent}% Margin
          </span>
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {currency}{Number(kpis.net_profit).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 truncate">
          Delivered Rev: {currency}{Number(kpis.delivered_revenue).toLocaleString()}
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            isProfitable ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
      </div>

      {/* 2. Real Delivered ROAS vs Claimed */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Real Delivered ROAS
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
            POAS {kpis.true_poas}x
          </span>
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {kpis.real_delivered_roas}x
          </span>
          <span className="text-xs text-slate-400 ml-1">
            vs Meta {kpis.meta_claimed_roas}x
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 truncate">
          Break-even: {kpis.break_even_roas}x threshold
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
      </div>

      {/* 3. Total Ad Spend */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Ad Spend
          </span>
          <Zap className="w-4 h-4 text-purple-500" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {currency}{Number(kpis.total_ad_spend).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 truncate">
          OPEX Prorated: {currency}{Number(kpis.total_opex).toLocaleString()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
      </div>

      {/* 4. Courier Delivery Success % */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Delivery Success Rate
          </span>
          <Truck className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span
            className={`text-2xl font-black tracking-tight ${
              isHealthyDelivery
                ? "text-emerald-600 dark:text-emerald-400"
                : isModerateDelivery
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {kpis.delivery_success_rate}%
          </span>
          <span className="text-xs text-slate-400 ml-1">
            ({kpis.return_rate}% return)
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 truncate">
          {kpis.delivered_orders} delivered • {kpis.returned_orders} returned
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            isHealthyDelivery ? "bg-emerald-500" : isModerateDelivery ? "bg-amber-500" : "bg-rose-500"
          }`}
        />
      </div>

      {/* 5. Unsettled Courier Cash */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Unsettled Courier Cash
          </span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline space-x-1">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {currency}{Number(kpis.unsettled_courier_balance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 truncate">
          Pending Steadfast/Pathao payout
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>
    </div>
  );
}

