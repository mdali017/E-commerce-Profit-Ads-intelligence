"use client";

import { useState } from "react";
import { CourierShipment, ShipmentStatus } from "@/types";
import { couriersApi } from "@/lib/couriers";
import { TrackingTimeline } from "@/components/couriers/TrackingTimeline";
import {
  X,
  DollarSign,
  History,
  Copy,
  Check,
  XCircle,
  MapPin,
} from "lucide-react";

interface ShipmentDetailDrawerProps {
  shipment: CourierShipment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updated: CourierShipment) => void;
}

export function ShipmentDetailDrawer({
  shipment,
  isOpen,
  onClose,
  onUpdated,
}: ShipmentDetailDrawerProps) {
  const [syncing, setSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copiedVal, setCopiedVal] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !shipment) return null;

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "booked":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "in_transit":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "partially_delivered":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800";
      case "returned":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "cancelled":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVal(val);
    setTimeout(() => setCopiedVal(null), 1500);
  };

  const handleSync = async () => {
    setSyncing(true);
    setActionError(null);
    try {
      const updated = await couriersApi.syncShipmentStatus(shipment.id);
      onUpdated?.(updated);
    } catch (err: any) {
      setActionError(err?.message || "Failed to sync live status.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this active courier shipment?")) return;
    setCancelling(true);
    setActionError(null);
    try {
      const updated = await couriersApi.cancelShipment(
        shipment.id,
        "Cancelled via courier drawer"
      );
      onUpdated?.(updated);
    } catch (err: any) {
      setActionError(err?.message || "Cancellation failed.");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    shipment.status === "booked" ||
    shipment.status === "pending" ||
    shipment.status === "in_transit";

  const structuredLoc = [
    shipment.recipient_area,
    shipment.recipient_zone,
    shipment.recipient_city,
    shipment.recipient_postcode,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {shipment.consignment_id}
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(shipment.consignment_id)}
                className="text-slate-400 hover:text-indigo-500"
                title="Copy Consignment ID"
              >
                {copiedVal === shipment.consignment_id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                  shipment.status
                )}`}
              >
                {shipment.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Courier: <span className="font-semibold uppercase">{shipment.provider}</span> • Order:{" "}
              <span className="font-semibold">{shipment.invoice_number || "N/A"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300">
              {actionError}
            </div>
          )}

          {/* Tracking Code Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 block">
                Courier Tracking Code
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-indigo-900 dark:text-indigo-200 font-mono">
                  {shipment.tracking_code || shipment.consignment_id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(shipment.tracking_code || shipment.consignment_id)}
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  {copiedVal === (shipment.tracking_code || shipment.consignment_id) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right text-xs text-indigo-700 dark:text-indigo-400">
              <span>Dispatched on</span>
              <div className="font-bold text-slate-900 dark:text-white">
                {new Date(shipment.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px]">
              Recipient & Routing Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {shipment.recipient_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone:</span>
                <a
                  href={`tel:${shipment.recipient_phone}`}
                  className="font-bold text-blue-600 dark:text-blue-400 underline"
                >
                  {shipment.recipient_phone}
                </a>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Delivery Address:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {shipment.recipient_address}
                </span>
                {structuredLoc && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    <MapPin className="w-3 h-3" />
                    {structuredLoc}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cash & COD Financials */}
          <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Cash on Delivery (COD) & Charges
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-slate-800/80 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px]">COD Amount to Collect:</span>
                <span className="text-lg font-bold text-white">
                  ৳{Number(shipment.cod_amount).toFixed(0)}
                </span>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-3">
                <span className="text-slate-400 block text-[11px]">Actual Collected:</span>
                <span className="text-lg font-bold text-emerald-400">
                  ৳{Number(shipment.collected_amount).toFixed(0)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>Courier Delivery Fee:</span>
              <span className="font-semibold text-white">৳{Number(shipment.delivery_fee).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Courier COD Commission (1%):</span>
              <span className="font-semibold text-white">৳{Number(shipment.cod_fee).toFixed(0)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Settlement Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  shipment.is_settled
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {shipment.is_settled ? "Remitted / Bank Deposited" : "Pending Courier Remittance"}
              </span>
            </div>
          </div>

          {/* Visual Tracking Stepper & Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              Live Parcel Tracking Timeline
            </h3>

            <TrackingTimeline
              status={shipment.status}
              events={shipment.tracking_events || []}
              onSync={handleSync}
              syncing={syncing}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          {canCancel ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              {cancelling ? "Cancelling..." : "Cancel Shipment"}
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              {shipment.last_polled_at
                ? `Last synced ${new Date(shipment.last_polled_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Terminal state"}
            </span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
