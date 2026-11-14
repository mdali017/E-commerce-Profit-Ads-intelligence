"use client";

import Link from "next/link";
import { useState } from "react";
import { CourierShipment, ShipmentStatus } from "@/types";
import {
  Phone,
  Eye,
  Truck,
  RefreshCw,
  Copy,
  Check,
  Send,
  CheckCircle2,
} from "lucide-react";

interface ShipmentTableProps {
  shipments: CourierShipment[];
  loading: boolean;
  onViewShipment: (shipment: CourierShipment) => void;
  onSyncShipment?: (shipmentId: string) => Promise<void>;
  connectedProviders?: string[];
}

export function ShipmentTable({
  shipments,
  loading,
  onViewShipment,
  onSyncShipment,
  connectedProviders = [],
}: ShipmentTableProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "steadfast":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/60";
      case "pathao":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/60";
      case "ecourier":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60";
      default:
        return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSync = async (e: React.MouseEvent, shipmentId: string) => {
    e.stopPropagation();
    if (!onSyncShipment) return;
    setSyncingId(shipmentId);
    try {
      await onSyncShipment(shipmentId);
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        ))}
      </div>
    );
  }

  if (shipments.length === 0) {
    const hasCouriers = connectedProviders.length > 0;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
            hasCouriers
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          }`}
        >
          {hasCouriers ? <CheckCircle2 className="w-7 h-7" /> : <Truck className="w-6 h-6" />}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {hasCouriers
            ? `${connectedProviders.map((p) => p.toUpperCase()).join(" & ")} Connected & Ready`
            : "No Courier Shipments Found"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          {hasCouriers
            ? `Your ${connectedProviders
                .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                .join(", ")} courier account is successfully connected. Go to the Orders page and click "Send Courier" on any confirmed order to book and track your first live parcel.`
            : "No parcels match your current filters. Dispatch confirmed orders from the Orders page via Steadfast, Pathao, or eCourier."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/orders"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 inline-flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Go to Orders to Dispatch
          </Link>
          <Link
            href="/settings/couriers"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            Manage Courier APIs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Consignment & Courier</th>
              <th className="px-4 py-3.5">Order Invoice</th>
              <th className="px-4 py-3.5">Recipient & Location</th>
              <th className="px-4 py-3.5 text-right">COD / Collected</th>
              <th className="px-4 py-3.5 text-right">Fee</th>
              <th className="px-4 py-3.5 text-center">Settlement</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {shipments.map((s) => (
              <tr
                key={s.id}
                onClick={() => onViewShipment(s)}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                {/* Consignment ID & Courier */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {s.consignment_id}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, s.consignment_id)}
                      className="text-slate-400 hover:text-indigo-500"
                      title="Copy Consignment ID"
                    >
                      {copiedId === s.consignment_id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${getProviderBadge(
                        s.provider
                      )}`}
                    >
                      {s.provider}
                    </span>
                    {s.tracking_code && s.tracking_code !== s.consignment_id && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.tracking_code}
                      </span>
                    )}
                  </div>
                </td>

                {/* Order Invoice */}
                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    {s.invoice_number || "N/A"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </td>

                {/* Recipient Details */}
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {s.recipient_name}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${s.recipient_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      {s.recipient_phone}
                    </a>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                    {[s.recipient_area, s.recipient_zone, s.recipient_city]
                      .filter(Boolean)
                      .join(", ") || s.recipient_address}
                  </div>
                </td>

                {/* COD & Collected */}
                <td className="px-4 py-3.5 text-right">
                  <div className="font-bold text-slate-900 dark:text-white">
                    ৳{Number(s.cod_amount).toFixed(0)}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Col: ৳{Number(s.collected_amount).toFixed(0)}
                  </div>
                </td>

                {/* Delivery Fee */}
                <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                  <div>৳{Number(s.delivery_fee).toFixed(0)}</div>
                  {Number(s.cod_fee) > 0 && (
                    <div className="text-[10px] text-slate-400">
                      +৳{Number(s.cod_fee).toFixed(0)} COD
                    </div>
                  )}
                </td>

                {/* Settlement */}
                <td className="px-4 py-3.5 text-center">
                  {s.is_settled ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/70">
                      Settled
                    </span>
                  ) : Number(s.collected_amount) > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/70">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border inline-block ${getStatusBadge(
                      s.status
                    )}`}
                  >
                    {s.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onSyncShipment &&
                      s.status !== "delivered" &&
                      s.status !== "returned" &&
                      s.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={(e) => handleSync(e, s.id)}
                          disabled={syncingId === s.id}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="Sync Live Status"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              syncingId === s.id ? "animate-spin text-indigo-500" : ""
                            }`}
                          />
                        </button>
                      )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewShipment(s);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Track
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
