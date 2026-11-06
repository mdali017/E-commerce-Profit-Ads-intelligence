"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Order,
  OrderDetail,
  OrderKPIStats,
  OrderCreateInput,
  OrderStatus,
} from "@/types";
import { ordersApi } from "@/lib/orders";
import { couriersApi } from "@/lib/couriers";
import { OrderStats } from "@/components/orders/OrderStats";

import { OrderTable } from "@/components/orders/OrderTable";
import { ManualOrderModal } from "@/components/orders/ManualOrderModal";
import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer";
import { WooCommerceSettingsModal } from "@/components/orders/WooCommerceSettingsModal";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  Globe,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending Call Verification", icon: Clock },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "in_courier", label: "In Courier", icon: Truck },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kpis, setKpis] = useState<OrderKPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Modals & Drawers state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isWooModalOpen, setIsWooModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, kpisData] = await Promise.all([
        ordersApi.getOrders({
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          search: search.trim() || undefined,
        }),
        ordersApi.getOrderKPIs(),
      ]);

      setOrders(ordersData);
      setKpis(kpisData);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(
        err?.message ||
          "Failed to load orders. Ensure backend is running and workspace is selected."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, sourceFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Manual Order Submission
  const handleCreateOrder = async (input: OrderCreateInput) => {
    await ordersApi.createOrder(input);
    await loadData();
  };

  // Quick Confirm
  const handleQuickConfirm = async (orderId: string) => {
    await ordersApi.updateOrderStatus(
      orderId,
      "confirmed",
      "One-click phone call verification passed"
    );
    await loadData();
  };

  // Quick Cancel
  const handleQuickCancel = async (orderId: string) => {
    await ordersApi.updateOrderStatus(
      orderId,
      "cancelled",
      "Cancelled by operator"
    );
    await loadData();
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    await ordersApi.deleteOrder(orderId);
    await loadData();
  };

  // View Order Full Details
  const handleViewOrder = async (order: Order) => {
    try {
      const detail = await ordersApi.getOrderDetail(order.id);
      setSelectedOrderDetail(detail);
      setIsDetailOpen(true);
    } catch (err: any) {
      alert(err?.message || "Failed to load order details");
    }
  };

  // Update Status from Drawer
  const handleUpdateStatusFromDrawer = async (
    orderId: string,
    status: OrderStatus,
    reason: string
  ) => {
    const updated = await ordersApi.updateOrderStatus(orderId, status, reason);
    setSelectedOrderDetail(updated);
    await loadData();
  };

  // Dispatch to Courier (Unit 4 integration)
  const handleDispatchOrder = async (orderId: string) => {
    try {
      await couriersApi.dispatchOrder({ order_id: orderId });
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch order to courier.");
    }
  };

  return (

    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Order Operations & Ingestion
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime multi-channel order ingestion, phone call verification checklist, and profit locking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsWooModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            WooCommerce Webhook
          </button>

          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Manual Order (F-Commerce)
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Executive KPI Cards */}
      <OrderStats
        stats={kpis}
        selectedStatus={selectedStatus}
        onSelectStatus={(status) => setSelectedStatus(status)}
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.id;
          let count = 0;
          if (kpis) {
            if (tab.id === "all") count = kpis.total_orders;
            if (tab.id === "pending") count = kpis.pending_orders;
            if (tab.id === "confirmed") count = kpis.confirmed_orders;
            if (tab.id === "in_courier") count = kpis.in_courier_orders;
            if (tab.id === "delivered") count = kpis.delivered_orders;
            if (tab.id === "cancelled") count = kpis.cancelled_orders;
          }

          // Dispatch to Courier (Unit 4 integration)
  const handleDispatchOrder = async (orderId: string) => {
    try {
      await couriersApi.dispatchOrder({ order_id: orderId });
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch order to courier.");
    }
  };

  return (

            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? "bg-slate-700 text-slate-100 dark:bg-slate-200 dark:text-slate-900"
                    : tab.id === "pending" && count > 0
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Channels / Sources</option>
            <option value="facebook">Facebook Page</option>
            <option value="messenger">Messenger</option>
            <option value="woocommerce">WooCommerce Store</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone_call">Phone Call</option>
            <option value="manual">Manual Walk-in</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        loading={loading}
        onViewOrder={handleViewOrder}
        onQuickConfirm={handleQuickConfirm}
        onQuickCancel={handleQuickCancel}
        onDeleteOrder={handleDeleteOrder}
        onDispatchOrder={handleDispatchOrder}
      />


      {/* Manual Order Modal (Day 10) */}
      <ManualOrderModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      {/* Order Detail Drawer (Day 12) */}
      <OrderDetailDrawer
        order={selectedOrderDetail}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrderDetail(null);
        }}
        onUpdateStatus={handleUpdateStatusFromDrawer}
      />

      {/* WooCommerce Webhook & Connector Modal (Day 11) */}
      <WooCommerceSettingsModal
        isOpen={isWooModalOpen}
        onClose={() => setIsWooModalOpen(false)}
      />
    </div>
  );
}
