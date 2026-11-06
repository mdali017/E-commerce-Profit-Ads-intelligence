"use client";

import React from "react";
import { ProductPnLItem } from "@/types";
import { Package, TrendingUp } from "lucide-react";

interface ProductPnLTableProps {
  products: ProductPnLItem[];
  currency?: string;
}

export function ProductPnLTable({
  products,
  currency = "BDT",
}: ProductPnLTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No delivered product data in this period
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Delivered orders with locked COGS will automatically populate product margin rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            Product-Wise Profitability Rankings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by total delivered customer cash revenue and gross profit contribution.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Product Name & SKU</th>
              <th className="py-3 px-4 text-center">Units Delivered</th>
              <th className="py-3 px-4 text-right">Delivered Revenue</th>
              <th className="py-3 px-4 text-right">COGS Cost</th>
              <th className="py-3 px-4 text-right">Gross Profit</th>
              <th className="py-3 px-4 text-right">Gross Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((item) => (
              <tr
                key={item.product_id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {item.product_name}
                  </span>
                  {item.sku && (
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      {item.sku}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                  {item.units_sold}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                  {currency} {Number(item.delivered_revenue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400">
                  {currency} {Number(item.cogs).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {currency} {Number(item.gross_profit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <TrendingUp className="w-3 h-3" />
                    {item.gross_margin_percent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

