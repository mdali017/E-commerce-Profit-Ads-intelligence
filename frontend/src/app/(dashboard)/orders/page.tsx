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
import { getSessionCache, setSessionCache } from "@/lib/swr";
import { OrderStats } from "@/components/orders/OrderStats";

import { OrderTable } from "@/components/orders/OrderTable";
import { ManualOrderModal } from "@/components/orders/ManualOrderModal";
import { OrderDetailDrawer } from "@/components/orders/OrderDetailDrawer";
import { WooCommerceSettingsModal } from "@/components/orders/WooCommerceSettingsModal";
import { DispatchOrderModal } from "@/components/couriers/DispatchOrderModal";
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
  Send,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Modals & Drawers state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isWooModalOpen, setIsWooModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dispatchOrders, setDispatchOrders] = useState<Order[]>([]);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Debounce search input to eliminate typing lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Data with Silent Background Revalidation
  const loadData = useCallback(async (silent = false) => {
    if (!silent && orders.length === 0) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    const cacheKey = `profitpulse_orders_${selectedStatus}_${sourceFilter}`;
    try {
      const [ordersData, kpisData] = await Promise.all([
        ordersApi.getOrders({
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          search: debouncedSearch.trim() || undefined,
        }),
        ordersApi.getOrderKPIs(),
      ]);

      setOrders(ordersData);
      setKpis(kpisData);
      if (!debouncedSearch) {
        setSessionCache(cacheKey, { orders: ordersData, kpis: kpisData });
      }
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(
        err?.message ||
          "Failed to load orders. Ensure backend is running and workspace is selected."
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedStatus, sourceFilter, debouncedSearch, orders.length]);

  // Initial and reactive load with instant SWR hydration
  useEffect(() => {
    const cacheKey = `profitpulse_orders_${selectedStatus}_${sourceFilter}`;
    const cached = getSessionCache<{ orders: Order[]; kpis: OrderKPIStats }>(cacheKey);
    if (cached && !debouncedSearch) {
      setOrders(cached.orders);
      setKpis(cached.kpis);
      setLoading(false);
    }
    const isSilent = !!cached || orders.length > 0;
    loadData(isSilent);
  }, [selectedStatus, sourceFilter, debouncedSearch]);

  // Auto-Sync Polling: Check for incoming webhooks every 10 seconds silently
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Workspace Switch
  useEffect(() => {
    const handleTenantChanged = () => {
      loadData(false);
    };
    window.addEventListener("tenantChanged", handleTenantChanged);
    return () => window.removeEventListener("tenantChanged", handleTenantChanged);
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

  // Dispatch to Courier Modal handlers (Steadfast, Pathao, eCourier)
  const handleDispatchOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    setDispatchOrders([target]);
    setIsDispatchModalOpen(true);
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    const confirmedIds = orders.filter((o) => o.status === "confirmed").map((o) => o.id);
    const allSelected =
      confirmedIds.length > 0 && confirmedIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !confirmedIds.includes(id)));
    } else {
      setSelectedOrderIds(confirmedIds);
    }
  };

  const handleBulkDispatchOpen = () => {
    const chosen = orders.filter(
      (o) => selectedOrderIds.includes(o.id) && o.status === "confirmed"
    );
    if (chosen.length === 0) return;
    setDispatchOrders(chosen);
    setIsDispatchModalOpen(true);
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Realtime Live Pulse */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isRefreshing ? "bg-purple-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
            <span>{isRefreshing ? "Syncing..." : "Realtime Active"}</span>
          </div>

          {/* Store Connection Status Pill */}
          {kpis && kpis.total_orders > 0 ? (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Store Connected</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Awaiting Orders</span>
            </div>
          )}

          <button
            onClick={() => setIsWooModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            Connect Store / Webhook
          </button>

          <button
            onClick={() => loadData(false)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-purple-600" : ""}`} />
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

      {/* Bulk Dispatch Selection Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{selectedOrderIds.length} confirmed order(s) selected for courier dispatch</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDispatchOpen}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Bulk Dispatch Selected ({selectedOrderIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        loading={loading && orders.length === 0}
        onViewOrder={handleViewOrder}
        onQuickConfirm={handleQuickConfirm}
        onQuickCancel={handleQuickCancel}
        onDeleteOrder={handleDeleteOrder}
        onDispatchOrder={handleDispatchOrder}
        selectedOrderIds={selectedOrderIds}
        onToggleSelectOrder={handleToggleSelectOrder}
        onToggleSelectAll={handleToggleSelectAll}
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
        onOpenDispatch={(detail) => {
          setDispatchOrders([detail]);
          setIsDispatchModalOpen(true);
        }}
      />

      {/* Courier Single / Bulk Dispatch Modal */}
      <DispatchOrderModal
        isOpen={isDispatchModalOpen}
        orders={dispatchOrders}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setDispatchOrders([]);
        }}
        onDispatched={() => {
          setSelectedOrderIds([]);
          loadData();
        }}
      />

      {/* Store & Webhook Connector Modal */}
      <WooCommerceSettingsModal
        isOpen={isWooModalOpen}
        onClose={() => {
          setIsWooModalOpen(false);
          loadData();
        }}
        onConnected={() => loadData()}
      />
    </div>
  );
}
