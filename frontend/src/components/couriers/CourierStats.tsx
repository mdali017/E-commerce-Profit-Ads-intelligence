"use client";

import Link from "next/link";
import { CourierKPIStats } from "@/types";
import {
  Truck,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface CourierStatsProps {
  stats: CourierKPIStats | null;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export function CourierStats({
  stats,
  selectedStatus,
  onSelectStatus,
}: CourierStatsProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. In-Transit & Dispatched */}
      <div
        onClick={() => onSelectStatus("in_transit")}
        className={`cursor-pointer transition-all bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:border-indigo-500/50 ${
          selectedStatus === "in_transit"
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            In Transit / Active
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.in_transit_count}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            of {stats.total_shipments} total parcels
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
          <span>Booked: {stats.booked_count}</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            View active
          </span>
        </div>
      </div>

      {/* 2. Delivery Success Rate & Speed */}
      <div
        onClick={() => onSelectStatus("delivered")}
        className={`cursor-pointer transition-all bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:border-emerald-500/50 ${
          selectedStatus === "delivered"
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Delivery Success Rate
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.delivery_success_rate}%
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {stats.delivered_count} delivered
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>
            Return: {stats.return_rate}% ({stats.returned_count})
          </span>
          {stats.avg_delivery_hours !== null && stats.avg_delivery_hours !== undefined && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Clock className="w-3 h-3" />
              {stats.avg_delivery_hours}h avg
            </span>
          )}
        </div>
      </div>

      {/* 3. Collected Cash & Courier Charges */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Collected Cash (COD)
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.total_collected_amount)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            of {formatCurrency(stats.total_cod_amount)}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Courier Charges: {formatCurrency(stats.total_courier_charges)}
        </div>
      </div>

      {/* 4. Unsettled Payout Balance */}
      <Link
        href="/couriers/settlements"
        className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-xs transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Unsettled Courier Cash
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(stats.unsettled_balance)}
          </span>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-0.5 group-hover:underline">
            Reconcile <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Delivered COD cash awaiting settlement
        </div>
      </Link>
    </div>
  );
}
