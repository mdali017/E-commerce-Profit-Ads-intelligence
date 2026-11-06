"use client";

import React from "react";
import { PnLTimeSeriesPoint } from "@/types";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface PnLTrendChartProps {
  points: PnLTimeSeriesPoint[];
  currency?: string;
}

export function PnLTrendChart({ points, currency = "BDT" }: PnLTrendChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        No daily trend data available for this range.
      </div>
    );
  }

  // Calculate highest absolute net profit for chart bar scaling
  const maxAbsProfit = Math.max(
    ...points.map((p) => Math.abs(Number(p.net_profit))),
    1000
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Daily Profitability Trajectory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Green bars indicate profitable days; red bars expose loss-making days after subtracting ad spend & prorated overheads.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {points.map((pt, idx) => {
          const isProfitable = pt.is_profitable;
          const absVal = Math.abs(Number(pt.net_profit));
          const barWidthPercent = Math.min(Math.round((absVal / maxAbsProfit) * 100), 100);

          return (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-2"
            >
              {/* Date & Orders count */}
              <div className="w-40 shrink-0">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                  {pt.report_date}
                </span>
                <span className="text-xs text-slate-400">
                  {pt.delivered_orders} delivered • Spend: {currency} {Number(pt.ad_spend).toLocaleString()}
                </span>
              </div>

              {/* Progress bar visual representation */}
              <div className="flex-1 mx-2 sm:mx-6">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isProfitable ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(barWidthPercent, 5)}%` }}
                  />
                </div>
              </div>

              {/* Net Profit amount */}
              <div className="text-right w-36 shrink-0">
                <span
                  className={`text-sm font-bold block ${
                    isProfitable
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isProfitable ? "+" : ""}
                  {currency} {Number(pt.net_profit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400">
                  Rev: {currency} {Number(pt.delivered_revenue).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

