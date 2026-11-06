"use client";

import { CostCoverageStats } from "@/types";
import { AlertTriangle, CheckCircle2, Package, Percent } from "lucide-react";

interface ProductStatsProps {
  stats: CostCoverageStats | null;
  onFilterMissingCost: () => void;
  selectedFilter: string;
}

export function ProductStats({
  stats,
  onFilterMissingCost,
  selectedFilter,
}: ProductStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    );
  }

  const isHealthyCoverage = stats.cost_coverage_percentage >= 90;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Products */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Products
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total_products}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({stats.total_variants} variants)
          </span>
        </div>
      </div>

      {/* 2. Cost Coverage Rate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cost Coverage
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isHealthyCoverage
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
            }`}
          >
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.cost_coverage_percentage}%
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {stats.products_with_cost}/{stats.total_products}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isHealthyCoverage ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(stats.cost_coverage_percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Products with Cost Configured */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cost Set (COGS Ready)
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.products_with_cost}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            accurate P&L
          </span>
        </div>
      </div>

      {/* 4. Missing Cost Warning (Interactive Filter) */}
      <div
        onClick={onFilterMissingCost}
        className={`border rounded-2xl p-5 shadow-xs cursor-pointer transition-all ${
          selectedFilter === "missing"
            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Missing Cost
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              stats.products_missing_cost > 0
                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {stats.products_missing_cost > 0 ? "Action needed" : "Clean"}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.products_missing_cost}
          </span>
          <span className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 underline">
            {selectedFilter === "missing" ? "Showing missing" : "Filter these"}
          </span>
        </div>
      </div>
    </div>
  );
}

