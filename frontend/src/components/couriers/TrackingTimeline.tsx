"use client";

import { CourierTrackingEvent, ShipmentStatus } from "@/types";
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  RotateCcw,
  XCircle,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface TrackingTimelineProps {
  status: ShipmentStatus;
  events?: CourierTrackingEvent[];
  compact?: boolean;
  onSync?: () => void;
  syncing?: boolean;
}

const MILESTONES = [
  { key: "booked", label: "Booked", icon: PackageCheck },
  { key: "picked", label: "Picked / Hub", icon: Clock },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export function TrackingTimeline({
  status,
  events = [],
  compact = false,
  onSync,
  syncing = false,
}: TrackingTimelineProps) {
  const isReturned = status === "returned";
  const isCancelled = status === "cancelled" || status === "lost";

  const activeStep = (() => {
    if (status === "delivered" || status === "partially_delivered") return 3;
    if (status === "in_transit") return 2;
    if (status === "booked" || status === "pending") return 0;
    return 1;
  })();

  const displayedEvents = compact ? events.slice(0, 3) : events;

  const getSourceTag = (source?: string) => {
    switch (source) {
      case "webhook":
        return "Webhook";
      case "polling":
        return "Auto-Sync";
      case "dispatch":
        return "Dispatch";
      default:
        return "Update";
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Stepper */}
      {!compact && (
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Delivery Progress
            </span>
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Live Status"}
              </button>
            )}
          </div>

          {isReturned || isCancelled ? (
            <div
              className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
                isReturned
                  ? "bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
              }`}
            >
              {isReturned ? <RotateCcw className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>
                {isReturned
                  ? "Parcel Returned to Merchant (RTM)"
                  : "Shipment Cancelled"}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 relative">
              {MILESTONES.map((step, idx) => {
                const done = idx <= activeStep;
                const current = idx === activeStep && status !== "delivered";
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        done
                          ? current
                            ? "bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-500/20"
                            : "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-bold ${
                        done
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Event History Timeline */}
      {displayedEvents.length > 0 ? (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {displayedEvents.map((evt, idx) => {
            const isFirst = idx === 0;
            const dotClass =
              evt.event_status === "DELIVERED"
                ? "bg-emerald-500"
                : evt.event_status === "RETURNED"
                ? "bg-purple-500"
                : evt.event_status === "CANCELLED"
                ? "bg-rose-500"
                : isFirst
                ? "bg-indigo-600"
                : "bg-slate-400";

            return (
              <div key={evt.id || idx} className="relative text-xs">
                <span
                  className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ${dotClass} ring-4 ring-white dark:ring-slate-900`}
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {evt.event_status}
                    </span>
                    {evt.raw_status && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {evt.raw_status}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                    {getSourceTag(evt.source)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  {evt.message}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                  <span>{new Date(evt.timestamp).toLocaleString()}</span>
                  {evt.location && (
                    <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-2.5 h-2.5" />
                      {evt.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          No tracking updates logged yet. Parcel is newly dispatched.
        </div>
      )}
    </div>
  );
}

