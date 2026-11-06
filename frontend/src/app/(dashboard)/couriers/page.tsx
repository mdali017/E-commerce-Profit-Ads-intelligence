"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CourierShipment,
  CourierKPIStats,
  ShipmentStatus,
} from "@/types";
import { couriersApi } from "@/lib/couriers";
import { CourierStats } from "@/components/couriers/CourierStats";
import { ShipmentTable } from "@/components/couriers/ShipmentTable";
import { ConfigureCourierModal } from "@/components/couriers/ConfigureCourierModal";
import { ShipmentDetailDrawer } from "@/components/couriers/ShipmentDetailDrawer";
import {
  Truck,
  RefreshCw,
  Search,
  Filter,
  Key,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

const STATUS_TABS = [
  { id: "all", label: "All Parcels" },
  { id: "in_transit", label: "In Transit / Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
  { id: "booked", label: "Booked", icon: Clock },
  { id: "returned", label: "Returned", icon: RotateCcw },
];

export default function CouriersPage() {
  const [shipments, setShipments] = useState<CourierShipment[]>([]);
  const [kpis, setKpis] = useState<CourierKPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<CourierShipment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipmentsData, kpisData] = await Promise.all([
        couriersApi.getShipments({
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          provider: providerFilter !== "all" ? providerFilter : undefined,
          search: search.trim() || undefined,
        }),
        couriersApi.getCourierKPIs(),
      ]);

      setShipments(shipmentsData);
      setKpis(kpisData);
    } catch (err: any) {
      console.error("Failed to load courier shipments:", err);
      setError(
        err?.message ||
          "Failed to load courier data. Ensure backend is running and workspace is active."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, providerFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewShipment = (shipment: CourierShipment) => {
    setSelectedShipment(shipment);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Courier Tracking & COD Settlement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated delivery tracking, parcel dispatch, and cash reconciliation with Steadfast & Pathao.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Deliveries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <Key className="w-4 h-4" />
            Connect Courier API (Steadfast / Pathao)
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <CourierStats
        stats={kpis}
        selectedStatus={selectedStatus}
        onSelectStatus={(st) => setSelectedStatus(st)}
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.id;
          let count = 0;
          if (kpis) {
            if (tab.id === "all") count = kpis.total_shipments;
            if (tab.id === "in_transit") count = kpis.in_transit_count;
            if (tab.id === "delivered") count = kpis.delivered_count;
            if (tab.id === "booked") count = kpis.booked_count;
            if (tab.id === "returned") count = kpis.returned_count;
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
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Provider Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Consignment, Tracking, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Couriers (Steadfast & Pathao)</option>
            <option value="steadfast">Steadfast Courier</option>
            <option value="pathao">Pathao Courier</option>
          </select>
        </div>
      </div>

      {/* Shipment Table */}
      <ShipmentTable
        shipments={shipments}
        loading={loading}
        onViewShipment={handleViewShipment}
      />

      {/* Configure Courier API Modal */}
      <ConfigureCourierModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={loadData}
      />

      {/* Shipment Detail & Tracking Timeline Drawer */}
      <ShipmentDetailDrawer
        shipment={selectedShipment}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedShipment(null);
        }}
      />
    </div>
  );
}
