"use client";

import React from "react";
import { SourceRevenueItem } from "@/types";
import { ShoppingBag, Globe, Share2, Smartphone } from "lucide-react";

interface ChannelRevenueCardProps {
  sources: SourceRevenueItem[];
  currency?: string;
}

export function ChannelRevenueCard({
  sources,
  currency = "৳",
}: ChannelRevenueCardProps) {
  const getIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "facebook":
        return <Share2 className="w-3.5 h-3.5 text-blue-500" />;
      case "woocommerce":
        return <Globe className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-emerald-500" />
          <span>Sales Channels & Source Revenue</span>
        </h3>
        <span className="text-xs text-slate-400">
          Total Channels: {sources.length}
        </span>
      </div>

      <div className="space-y-3">
        {sources.length > 0 ? (
          sources.map((item) => (
            <div key={item.source} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {getIcon(item.source)}
                  <span>{item.source}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {currency}{Number(item.total_revenue).toLocaleString()} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block text-right">
                {item.order_count} {item.order_count === 1 ? "order" : "orders"}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No sales recorded in this period.
          </div>
        )}
      </div>
    </div>
  );
}

