"use client";

import React from "react";
import { PnLSummary, BreakEvenAnalysis } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  Megaphone,
  ShieldCheck,
  AlertTriangle,
  Scale,
} from "lucide-react";

interface PnLSummaryHeroProps {
  summary: PnLSummary | null;
  breakeven: BreakEvenAnalysis | null;
  currency?: string;
}

export function PnLSummaryHero({
  summary,
  breakeven,
  currency = "BDT",
}: PnLSummaryHeroProps) {
  if (!summary) {
    return (
      <div className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 h-64" />
    );
  }

  const isNetProfit = summary.net_profit >= 0;
  const isBreakevenProfitable = breakeven?.status === "profitable";

  return (
    <div className="space-y-4">
      {/* Primary Net Profit Hero Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 transition-all ${
          isNetProfit
            ? "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30"
            : "bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent border-rose-500/30"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                True Bottom-Line Reality
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isNetProfit
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                }`}
              >
                {isNetProfit ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {summary.net_margin_percent}% Net Margin
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span
                className={`text-3xl md:text-5xl font-black tracking-tight ${
                  isNetProfit
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {currency} {Number(summary.net_profit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                Net Profit / Loss
              </span>
            </div>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Calculated on delivered revenue after subtracting product purchase COGS, courier delivery & return charges, packaging, ad spend, and prorated operating expenses.
            </p>
          </div>

          {/* Break-even ROAS Benchmark Widget */}
          {breakeven && (
            <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-500" />
                  Break-even Benchmark
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isBreakevenProfitable
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {breakeven.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center py-2 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Target Break-even</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {breakeven.breakeven_roas}x
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Actual Delivered</div>
                  <div
                    className={`text-lg font-bold ${
                      breakeven.actual_delivered_roas >= breakeven.breakeven_roas
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {breakeven.actual_delivered_roas}x
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-tight">
                {breakeven.recommended_action}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            Delivered Revenue
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currency} {Number(summary.delivered_revenue).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary.delivered_orders_count} orders ({summary.delivery_rate_percent}%)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Package className="w-3.5 h-3.5 text-blue-500" />
            Product COGS
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currency} {Number(summary.total_cogs).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Cost of goods sold
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Gross Profit
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {currency} {Number(summary.gross_profit).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {summary.gross_margin_percent}% margin
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            Courier & Pack
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currency}{" "}
            {(
              Number(summary.courier_charges) +
              Number(summary.packaging_handling_fees)
            ).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Delivery + COD + Return
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Megaphone className="w-3.5 h-3.5 text-purple-500" />
            Total Ad Spend
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currency} {Number(summary.ad_spend).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Meta & Marketing
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            Operating OPEX
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currency} {Number(summary.operating_expenses).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Rent, salary, utilities
          </div>
        </div>
      </div>
    </div>
  );
}

