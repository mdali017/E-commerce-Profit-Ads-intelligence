"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  CourierShipment,
  CourierKPIStats,
  CourierCredential,
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
  Key,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  BarChart3,
  Banknote,
  Settings2,
  Radio,
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
  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollNote, setPollNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [settlementFilter, setSettlementFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<CourierShipment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipmentsData, kpisData, credsData] = await Promise.all([
        couriersApi.getShipments({
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          provider: providerFilter !== "all" ? providerFilter : undefined,
          is_settled:
            settlementFilter === "settled"
              ? true
              : settlementFilter === "unsettled"
              ? false
              : undefined,
          days: daysFilter !== "all" ? Number(daysFilter) : undefined,
          search: search.trim() || undefined,
        }),
        couriersApi.getCourierKPIs(),
        couriersApi.getCredentials().catch(() => [] as CourierCredential[]),
      ]);

      setShipments(shipmentsData);
      setKpis(kpisData);
      setCredentials(credsData);
    } catch (err: any) {
      console.error("Failed to load courier shipments:", err);
      setError(
        err?.message ||
          "Failed to load courier data. Ensure backend is running and workspace is active."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, providerFilter, settlementFilter, daysFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Workspace switcher support
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener("tenantChanged", handler);
    return () => window.removeEventListener("tenantChanged", handler);
  }, [loadData]);

  const handleViewShipment = (shipment: CourierShipment) => {
    setSelectedShipment(shipment);
    setIsDrawerOpen(true);
  };

  const handleSyncShipment = async (shipmentId: string) => {
    const updated = await couriersApi.syncShipmentStatus(shipmentId);
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(updated);
    }
    await loadData();
  };

  const handlePollECourier = async () => {
    setPolling(true);
    setPollNote(null);
    try {
      const res = await couriersApi.pollActiveShipments("ecourier");
      setPollNote(
        `eCourier sync complete: checked ${res.checked} active parcel(s), updated ${res.updated}.`
      );
      await loadData();
    } catch (err: any) {
      setPollNote(err?.message || "Polling failed.");
    } finally {
      setPolling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Courier Tracking & COD Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unified Steadfast, Pathao, and eCourier tracking, automated polling, and COD cash reconciliation.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Active Connectors:
            </span>
            {credentials.length > 0 ? (
              credentials.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize">{c.provider}</span>
                  {c.is_default && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-800/70 font-bold uppercase tracking-wider">
                      Default
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                No courier connected yet
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/couriers/settlements"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
            Settlements
          </Link>

          <Link
            href="/couriers/analytics"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            Analytics
          </Link>

          <Link
            href="/settings/couriers"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            API Settings
          </Link>

          <button
            type="button"
            onClick={handlePollECourier}
            disabled={polling}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5 disabled:opacity-50"
            title="Poll eCourier API for active parcels"
          >
            <Radio className={`w-3.5 h-3.5 ${polling ? "animate-pulse" : ""}`} />
            {polling ? "Polling..." : "Sync eCourier"}
          </button>

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
            Connect Courier API
          </button>
        </div>
      </div>

      {/* Poll Notification */}
      {pollNote && (
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between">
          <span>{pollNote}</span>
          <button onClick={() => setPollNote(null)} className="text-[11px] font-bold underline">
            Dismiss
          </button>
        </div>
      )}

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

      {/* Search & Multi-Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Consignment, Tracking, Phone, Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Couriers</option>
            <option value="steadfast">Steadfast Courier</option>
            <option value="pathao">Pathao Courier</option>
            <option value="ecourier">eCourier</option>
          </select>

          <select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Settlements</option>
            <option value="unsettled">Unsettled Cash</option>
            <option value="settled">Settled</option>
          </select>

          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Shipment Table */}
      <ShipmentTable
        shipments={shipments}
        loading={loading}
        onViewShipment={handleViewShipment}
        onSyncShipment={handleSyncShipment}
        connectedProviders={credentials.map((c) => c.provider)}
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
        onUpdated={(updated) => {
          setSelectedShipment(updated);
          loadData();
        }}
      />
    </div>
  );
}
