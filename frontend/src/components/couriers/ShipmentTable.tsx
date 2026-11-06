"use client";

import { CourierShipment, ShipmentStatus } from "@/types";
import {
  Phone,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  DollarSign,
  Filter,
} from "lucide-react";

interface ShipmentTableProps {
  shipments: CourierShipment[];
  loading: boolean;
  onViewShipment: (shipment: CourierShipment) => void;
}

export function ShipmentTable({
  shipments,
  loading,
  onViewShipment,
}: ShipmentTableProps) {
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

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "steadfast":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/60";
      case "pathao":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/60";
      default:
        return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
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
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Courier Shipments Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No parcels have been dispatched yet. Go to Orders page and click "Send to Courier" to book parcels in 1 click.
        </p>
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
              <th className="px-4 py-3.5">Recipient Details</th>
              <th className="px-4 py-3.5 text-right">COD Amount</th>
              <th className="px-4 py-3.5 text-right">Collected</th>
              <th className="px-4 py-3.5 text-right">Delivery Fee</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
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
                  <div className="font-bold text-slate-900 dark:text-white font-mono">
                    {s.consignment_id}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${getProviderBadge(
                        s.provider
                      )}`}
                    >
                      {s.provider}
                    </span>
                    {s.tracking_code && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.tracking_code}
                      </span>
                    )}
                  </div>
                </td>

                {/* Order Invoice */}
                <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                  {s.invoice_number || "N/A"}
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
                  <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                    {s.recipient_city || s.recipient_address}
                  </div>
                </td>

                {/* COD Amount */}
                <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                  ৳{Number(s.cod_amount).toFixed(0)}
                </td>

                {/* Collected Amount */}
                <td className="px-4 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                  ৳{Number(s.collected_amount).toFixed(0)}
                </td>

                {/* Delivery Fee */}
                <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-300">
                  ৳{Number(s.delivery_fee).toFixed(0)}
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border inline-block ${getStatusBadge(
                      s.status
                    )}`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                </td>

                {/* Action */}
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewShipment(s);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

