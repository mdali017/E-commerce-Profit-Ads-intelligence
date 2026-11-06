"use client";

import { CourierShipment, ShipmentStatus } from "@/types";
import {
  X,
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  History,
  ShieldCheck,
} from "lucide-react";

interface ShipmentDetailDrawerProps {
  shipment: CourierShipment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShipmentDetailDrawer({
  shipment,
  isOpen,
  onClose,
}: ShipmentDetailDrawerProps) {
  if (!isOpen || !shipment) return null;

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Consignment: {shipment.consignment_id}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                  shipment.status
                )}`}
              >
                {shipment.status.toUpperCase()}
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
          {/* Tracking Code Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 block">
                Courier Tracking Code
              </span>
              <span className="text-lg font-black text-indigo-900 dark:text-indigo-200 font-mono">
                {shipment.tracking_code || shipment.consignment_id}
              </span>
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
              Recipient Information
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
                  {shipment.recipient_address}{" "}
                  {shipment.recipient_city ? `(${shipment.recipient_city})` : ""}
                </span>
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

          {/* Tracking Timeline Events */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              Live Parcel Tracking Timeline
            </h3>

            {shipment.tracking_events && shipment.tracking_events.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {shipment.tracking_events.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative text-xs">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {evt.event_status}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      {evt.message}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No tracking updates logged yet. Parcel is newly dispatched.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
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

