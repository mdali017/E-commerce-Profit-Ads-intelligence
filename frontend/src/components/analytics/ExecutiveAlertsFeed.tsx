"use client";

import React from "react";
import { ExecutiveAlert } from "@/types";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  Sparkles,
  X,
  ArrowRight,
  ShieldAlert,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ExecutiveAlertsFeedProps {
  alerts: ExecutiveAlert[];
  onDismiss: (alertId: string) => Promise<void>;
}

export function ExecutiveAlertsFeed({ alerts, onDismiss }: ExecutiveAlertsFeedProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Executive System Alerts & Anomalies ({alerts.length})</span>
        </span>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
              alert.severity === "critical"
                ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-100"
                : alert.severity === "warning"
                ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-100"
                : "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-950 dark:text-blue-100"
            }`}
          >
            <div className="flex items-start space-x-2.5">
              {alert.severity === "critical" ? (
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : alert.severity === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold">{alert.title}</h4>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                  {alert.message}
                </p>
                {alert.action_cta && alert.action_url && (
                  <Link
                    href={alert.action_url}
                    className="inline-flex items-center text-[11px] font-semibold mt-1.5 underline underline-offset-2 hover:opacity-80"
                  >
                    <span>{alert.action_cta}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-opacity"
              title="Dismiss Alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

