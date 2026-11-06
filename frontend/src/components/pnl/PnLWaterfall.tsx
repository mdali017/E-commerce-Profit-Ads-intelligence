"use client";

import React from "react";
import { PnLWaterfallItem } from "@/types";
import { ArrowDown, ArrowUp, Equal, Minus, Plus } from "lucide-react";

interface PnLWaterfallProps {
  items: PnLWaterfallItem[];
  currency?: string;
}

export function PnLWaterfall({ items, currency = "BDT" }: PnLWaterfallProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        No waterfall data available for this period.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            11-Step Financial Waterfall Statement
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent breakdown tracking every taka from gross customer checkouts down to net profit in bank.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Revenue / Subtotal
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Cost Deduction
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((line, idx) => {
          const isDeduction = line.type === "deduction";
          const isSubtotal = line.type === "subtotal";
          const isNetProfit = line.line_name.includes("Net Profit");
          const isDeliveredRevenue = line.line_name.includes("Delivered Revenue");

          let rowBg = "hover:bg-slate-50/60 dark:hover:bg-slate-800/40";
          let badgeBg = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
          let amountColor = "text-slate-800 dark:text-slate-200";

          if (isNetProfit) {
            const positive = line.amount >= 0;
            rowBg = positive
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-rose-500/10 border border-rose-500/30";
            badgeBg = positive ? "bg-emerald-600 text-white" : "bg-rose-600 text-white";
            amountColor = positive
              ? "text-emerald-600 dark:text-emerald-400 font-black text-lg"
              : "text-rose-600 dark:text-rose-400 font-black text-lg";
          } else if (isDeliveredRevenue) {
            rowBg = "bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40";
            badgeBg = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200";
            amountColor = "text-emerald-700 dark:text-emerald-300 font-bold";
          } else if (isSubtotal) {
            rowBg = "bg-slate-50 dark:bg-slate-800/50 font-semibold";
            badgeBg = "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
            amountColor = line.amount >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600 dark:text-rose-400";
          } else if (isDeduction) {
            amountColor = "text-rose-600 dark:text-rose-400 font-medium";
          }

          return (
            <div
              key={idx}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${rowBg}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isDeduction
                      ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                      : isSubtotal
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {isDeduction ? (
                    <Minus className="w-3.5 h-3.5" />
                  ) : isSubtotal ? (
                    <Equal className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <span className={`text-sm ${isSubtotal ? "font-bold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                    {line.line_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 hidden sm:inline-block w-20 text-right">
                  {line.percentage_of_revenue}% rev
                </span>
                <span className={`text-sm tracking-tight text-right min-w-[130px] ${amountColor}`}>
                  {line.amount < 0 ? "-" : ""}
                  {currency} {Math.abs(Number(line.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

