"use client";

import { useEffect, useState } from "react";
import { FraudCheckResult } from "@/types";
import { couriersApi } from "@/lib/couriers";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Loader2,
} from "lucide-react";

interface FraudCheckBadgeProps {
  phone?: string | null;
  compact?: boolean;
  preloaded?: FraudCheckResult | null;
}

export function FraudCheckBadge({
  phone,
  compact = false,
  preloaded = null,
}: FraudCheckBadgeProps) {
  const [data, setData] = useState<FraudCheckResult | null>(preloaded);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preloaded) {
      setData(preloaded);
      return;
    }
    if (!phone || phone.trim().length < 8) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    couriersApi
      .checkFraud(phone.trim())
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [phone, preloaded]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking delivery history...
      </span>
    );
  }

  if (!data) return null;

  const badgeStyles = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    medium:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    high: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    no_history:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  }[data.risk_level];

  const Icon =
    data.risk_level === "low"
      ? ShieldCheck
      : data.risk_level === "high"
      ? ShieldAlert
      : data.risk_level === "medium"
      ? AlertTriangle
      : UserCheck;

  const riskLabel =
    data.risk_level === "low"
      ? "Trusted Buyer"
      : data.risk_level === "high"
      ? "High Return Risk"
      : data.risk_level === "medium"
      ? "Moderate Risk"
      : "New Buyer";

  if (compact) {
    return (
      <span
        title={data.summary}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles}`}
      >
        <Icon className="w-3 h-3" />
        {riskLabel}
        {data.total_parcels > 0 && ` (${data.success_rate}%)`}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border p-3.5 text-xs ${badgeStyles}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold">
          <Icon className="w-4 h-4 shrink-0" />
          <span>Customer Reliability: {riskLabel}</span>
        </div>
        {data.total_parcels > 0 && (
          <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/50">
            {data.success_rate}% Success
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[11px] opacity-90">{data.summary}</p>

      <div className="mt-2.5 grid grid-cols-4 gap-2 text-[11px]">
        <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg px-2 py-1">
          <span className="opacity-70 block text-[10px]">Steadfast Total</span>
          <span className="font-bold">{data.total_parcels}</span>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg px-2 py-1">
          <span className="opacity-70 block text-[10px]">Delivered</span>
          <span className="font-bold">{data.total_delivered}</span>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg px-2 py-1">
          <span className="opacity-70 block text-[10px]">Cancelled</span>
          <span className="font-bold">{data.total_cancelled}</span>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg px-2 py-1">
          <span className="opacity-70 block text-[10px]">Your Store</span>
          <span className="font-bold">
            {data.internal_delivered_orders}/{data.internal_total_orders}
          </span>
        </div>
      </div>
    </div>
  );
}

