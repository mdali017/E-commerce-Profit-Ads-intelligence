"use client";

import { OrderKPIStats } from "@/types";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

interface OrderStatsProps {
  stats: OrderKPIStats | null;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export function OrderStats({
  stats,
  selectedStatus,
  onSelectStatus,
}: OrderStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const marginPercent =
    stats.total_revenue > 0
      ? ((stats.total_gross_profit / stats.total_revenue) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Orders & Volume */}
      <div
        onClick={() => onSelectStatus("all")}
        className={`cursor-pointer transition-all bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:border-blue-500/50 ${
          selectedStatus === "all"
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Orders
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total_orders}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (AOV: {formatCurrency(stats.average_order_value)})
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Click to view all orders
        </div>
      </div>

      {/* 2. Pending Phone Confirmation */}
      <div
        onClick={() => onSelectStatus("pending")}
        className={`cursor-pointer transition-all bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:border-amber-500/50 ${
          selectedStatus === "pending"
            ? "border-amber-500 ring-2 ring-amber-500/20"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            Pending Confirmation
            {stats.pending_orders > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pending_orders}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            need call verification
          </span>
        </div>
        <div className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
          {stats.pending_orders > 0 ? "⚡ Action required by operator" : "All orders confirmed"}
        </div>
      </div>

      {/* 3. In Courier & Delivery Rate */}
      <div
        onClick={() => onSelectStatus("in_courier")}
        className={`cursor-pointer transition-all bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:border-indigo-500/50 ${
          selectedStatus === "in_courier"
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            In Courier / Transit
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.in_courier_orders}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({stats.delivered_orders} delivered)
            </span>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.delivery_rate_percent}% rate
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Return rate: {stats.return_rate_percent}% ({stats.returned_orders} returned)
        </div>
      </div>

      {/* 4. Locked Gross Profit & Revenue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gross Profit (Locked)
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.total_gross_profit)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
            {marginPercent}% margin
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
          <span>Revenue: {formatCurrency(stats.total_revenue)}</span>
          <span>COGS: {formatCurrency(stats.total_cogs)}</span>
        </div>
      </div>
    </div>
  );
}

