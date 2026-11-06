"use client";

import { useState } from "react";
import {
  OrderDetail,
  OrderStatus,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
} from "@/types";
import {
  X,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  TrendingUp,
  Tag,
  DollarSign,
  User,
  ShieldCheck,
  History,
  MessageSquare,
} from "lucide-react";

interface OrderDetailDrawerProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, reason: string) => Promise<void>;
}

export function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}: OrderDetailDrawerProps) {
  const [updating, setUpdating] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus | "">("");

  if (!isOpen || !order) return null;

  const handleStatusChange = async (status: OrderStatus, defaultReason: string) => {
    setUpdating(true);
    try {
      await onUpdateStatus(order.id, status, actionReason || defaultReason);
      setActionReason("");
      setSelectedNewStatus("");
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "in_courier":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "cancelled":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case "returned":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {order.order_number}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                  order.status
                )}`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Source: <span className="font-semibold uppercase">{order.source}</span> • Created at{" "}
              {new Date(order.created_at).toLocaleString()}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Confirmation Action Bar for Operators */}
          {order.status === "pending" && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Order Needs Phone Confirmation
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  Call Customer:{" "}
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="font-bold underline text-blue-600 dark:text-blue-400"
                  >
                    {order.customer_phone}
                  </a>
                </span>
              </div>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mb-3">
                Verify customer address and product selection before booking delivery courier.
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange("confirmed", "Verified & confirmed via phone call")}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm Order (Phone Verified)
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange("cancelled", "Customer requested cancellation on phone call")}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-300 text-rose-600 dark:border-rose-900/60 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          )}

          {/* Customer & Shipping Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Customer Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {order.customer_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone:</span>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="font-bold text-blue-600 dark:text-blue-400 underline"
                >
                  {order.customer_phone}
                </a>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Delivery Address:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {order.shipping_address}{" "}
                  {order.shipping_city ? `(${order.shipping_city})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items & COGS Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Purchased Items ({order.items?.length || 0})
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
              {order.items?.map((item) => (
                <div key={item.id} className="p-3 bg-white dark:bg-slate-900 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.product_name}
                        {item.variant_name && (
                          <span className="ml-1 text-slate-500 text-[11px]">
                            ({item.variant_name})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        SKU: {item.sku || "N/A"} • Qty: {item.quantity} × ৳{item.unit_price}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        ৳{Number(item.total_price).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* COGS Snapshot Row */}
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Catalog Snapshot COGS:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        ৳{item.unit_cost_price !== null ? item.unit_cost_price : "0 (missing)"}
                      </span>{" "}
                      + Packaging: ৳{item.unit_packaging_cost} + Handling: ৳{item.unit_handling_cost}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Total Cost: ৳{Number(item.total_cost || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown & Locked Profit Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Subtotal:</span>
              <span>৳{Number(order.subtotal).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Delivery Fee:</span>
              <span>৳{Number(order.shipping_fee).toFixed(0)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-300">
                <span>Discount Applied:</span>
                <span>-৳{Number(order.discount_amount).toFixed(0)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-200 text-sm">Customer Payable:</span>
              <span className="text-xl font-extrabold text-blue-400">
                ৳{Number(order.total_amount).toFixed(0)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">Total Catalog COGS:</span>
                <span className="text-base font-bold text-slate-200">
                  ৳{Number(order.total_cogs).toFixed(0)}
                </span>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-3">
                <span className="text-[11px] text-emerald-400 block font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Locked Gross Profit:
                </span>
                <span className="text-base font-black text-emerald-400">
                  ৳{Number(order.gross_profit).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Marketing Attribution (UTM & Ads) */}
          {order.attribution && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                Marketing Attribution
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[11px]">UTM Source:</span>
                  <span className="block font-semibold text-slate-800 dark:text-slate-200">
                    {order.attribution.utm_source || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">UTM Campaign:</span>
                  <span className="block font-semibold text-slate-800 dark:text-slate-200">
                    {order.attribution.utm_campaign || "N/A"}
                  </span>
                </div>
                {order.attribution.fbclid && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px]">FB Click ID (fbclid):</span>
                    <span className="block font-mono text-[10px] truncate text-slate-600 dark:text-slate-400">
                      {order.attribution.fbclid}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[11px]">Attribution Confidence:</span>
                  <span className="block font-semibold text-blue-600 dark:text-blue-400">
                    {order.attribution.attribution_confidence}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Lifecycle Transition History Audit Log */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-500" />
              Audit Log & Lifecycle History
            </h3>
            <div className="space-y-2">
              {order.status_history?.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.from_status ? `${log.from_status.toUpperCase()} ➔ ` : ""}
                      <span className="text-blue-600 dark:text-blue-400">
                        {log.to_status.toUpperCase()}
                      </span>
                    </div>
                    {log.reason && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        "{log.reason}"
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Payment: <span className="font-semibold uppercase">{order.payment_method}</span> (
            {order.payment_status})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

