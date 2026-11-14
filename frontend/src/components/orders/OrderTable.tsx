"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/types";
import {
  Phone,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  ExternalLink,
  Clock,
  Truck,
  TrendingUp,
} from "lucide-react";

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (order: Order) => void;
  onQuickConfirm: (orderId: string) => Promise<void>;
  onQuickCancel: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onDispatchOrder?: (orderId: string) => Promise<void> | void;
  selectedOrderIds?: string[];
  onToggleSelectOrder?: (orderId: string) => void;
  onToggleSelectAll?: () => void;
}

export function OrderTable({
  orders,
  loading,
  onViewOrder,
  onQuickConfirm,
  onQuickCancel,
  onDeleteOrder,
  onDispatchOrder,
  selectedOrderIds = [],
  onToggleSelectOrder,
  onToggleSelectAll,
}: OrderTableProps) {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const selectableOrders = orders.filter((o) => o.status === "confirmed");
  const allConfirmedSelected =
    selectableOrders.length > 0 &&
    selectableOrders.every((o) => selectedOrderIds.includes(o.id));


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

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "facebook":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50";
      case "messenger":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200/50";
      case "woocommerce":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/50";
      case "whatsapp":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/50";
      case "phone_call":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/50";
      default:
        return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const handleConfirm = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setActionLoadingId(orderId);
    try {
      await onQuickConfirm(orderId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setActionLoadingId(orderId);
    try {
      await onQuickCancel(orderId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this order record? This cannot be undone.")) {
      return;
    }
    setActionLoadingId(orderId);
    try {
      await onDeleteOrder(orderId);
    } finally {
      setActionLoadingId(null);
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

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Filter className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Orders Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No orders match the selected filters or search keyword. Try clearing filters or create a new manual order.
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
              {onToggleSelectOrder && (
                <th className="pl-4 pr-2 py-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={allConfirmedSelected}
                    disabled={selectableOrders.length === 0}
                    onChange={() => onToggleSelectAll?.()}
                    title="Select all confirmed orders for bulk courier dispatch"
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                  />
                </th>
              )}
              <th className="px-5 py-3.5">Order No & Source</th>
              <th className="px-4 py-3.5">Customer & City</th>
              <th className="px-4 py-3.5 text-center">Items</th>
              <th className="px-4 py-3.5 text-right">Payable</th>
              <th className="px-4 py-3.5 text-right">Gross Profit</th>
              <th className="px-4 py-3.5 text-center">Payment</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {orders.map((order) => {
              const isActioning = actionLoadingId === order.id;
              const isChecked = selectedOrderIds.includes(order.id);

              return (
                <tr
                  key={order.id}
                  onClick={() => onViewOrder(order)}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    isChecked ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  {onToggleSelectOrder && (
                    <td
                      className="pl-4 pr-2 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.status === "confirmed" ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSelectOrder(order.id)}
                          title="Select for bulk courier dispatch"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      ) : (
                        <span className="inline-block w-3.5 h-3.5" />
                      )}
                    </td>
                  )}
                  {/* Order Number & Source */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {order.order_number}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getSourceBadge(
                          order.source
                        )}`}
                      >
                        {order.source.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>

                  {/* Customer Details */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                      {order.customer_name}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${order.customer_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                      >
                        {order.customer_phone}
                      </a>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {order.shipping_city || "Dhaka"}
                    </div>
                  </td>

                  {/* Items Count */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {order.item_count || 1}
                    </span>
                  </td>

                  {/* Total Payable */}
                  <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                    ৳{Number(order.total_amount).toFixed(0)}
                  </td>

                  {/* Gross Profit */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ৳{Number(order.gross_profit).toFixed(0)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      COGS: ৳{Number(order.total_cogs).toFixed(0)}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="uppercase font-semibold text-[10px] text-slate-600 dark:text-slate-300">
                      {order.payment_method}
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        order.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold border inline-block ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* One-click Confirm for Pending orders */}
                      {order.status === "pending" && (
                        <button
                          disabled={isActioning}
                          onClick={(e) => handleConfirm(e, order.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="Verify and confirm order"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Confirm
                        </button>
                      )}

                      {/* One-click Send to Courier for Confirmed orders */}
                      {order.status === "confirmed" && onDispatchOrder && (
                        <button
                          disabled={isActioning}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setActionLoadingId(order.id);
                            try {
                              await onDispatchOrder(order.id);
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="Dispatch to Courier (Steadfast / Pathao / eCourier)"
                        >
                          <Truck className="w-3 h-3" />
                          Send Courier
                        </button>
                      )}


                      {/* Cancel for Pending/Confirmed */}
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <button
                          disabled={isActioning}
                          onClick={(e) => handleCancel(e, order.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                          title="Cancel order"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* View Details */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewOrder(order);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        disabled={isActioning}
                        onClick={(e) => handleDelete(e, order.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                        title="Delete order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

