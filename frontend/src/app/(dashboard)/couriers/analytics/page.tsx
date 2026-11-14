"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  DeliveryPerformanceAnalytics,
  CostAnalysisResponse,
  CityPerformanceItem,
  CourierShipment,
} from "@/types";
import { couriersApi } from "@/lib/couriers";
import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  MapPin,
  DollarSign,
  Clock,
  Truck,
} from "lucide-react";

export default function CourierAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [perf, setPerf] = useState<DeliveryPerformanceAnalytics | null>(null);
  const [cost, setCost] = useState<CostAnalysisResponse | null>(null);
  const [cities, setCities] = useState<CityPerformanceItem[]>([]);
  const [stale, setStale] = useState<CourierShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [perfData, costData, cityData, staleData] = await Promise.all([
        couriersApi.getDeliveryPerformance(days),
        couriersApi.getCostAnalysis(days),
        couriersApi.getCityPerformance(days),
        couriersApi.getStaleShipments(48),
      ]);
      setPerf(perfData);
      setCost(costData);
      setCities(cityData);
      setStale(staleData);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleSyncStale = async (id: string) => {
    setSyncingId(id);
    try {
      await couriersApi.syncShipmentStatus(id);
      await loadAnalytics();
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/couriers"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courier Tracking
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Courier Performance & Cost Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare Steadfast vs Pathao vs eCourier delivery rates, speed, fees, and regional performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Executive Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Delivery Rate
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {perf?.overall_delivery_rate ?? 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Completed shipments delivered</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Return Rate
          </span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {perf?.overall_return_rate ?? 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">RTM / failed deliveries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Avg Delivery Time
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-indigo-500" />
            {perf?.avg_delivery_hours !== null && perf?.avg_delivery_hours !== undefined
              ? `${perf.avg_delivery_hours} hrs`
              : "N/A"}
          </div>
          <p className="text-xs text-slate-400 mt-1">Booked → Delivered latency</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Courier Costs
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ৳{Number(cost?.total_courier_cost || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Del: ৳{Number(cost?.total_delivery_fees || 0).toLocaleString()} • COD: ৳
            {Number(cost?.total_cod_fees || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Provider Side-by-Side Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500" />
              Courier Partner Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Success rate, return leakage, and cost efficiency across connected couriers
            </p>
          </div>
        </div>

        {!perf || perf.providers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No shipment data found in the selected {days}-day window.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {perf.providers.map((p) => {
              const cItem = cost?.by_provider.find((x) => x.provider === p.provider);
              return (
                <div
                  key={p.provider}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold uppercase text-slate-900 dark:text-white">
                      {p.provider}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {p.total_shipments} parcels
                    </span>
                  </div>

                  {/* Delivery vs Return bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-emerald-600">Delivered {p.delivery_rate}%</span>
                      <span className="text-purple-600">Returned {p.return_rate}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${p.delivery_rate}%` }}
                      />
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: `${p.return_rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">COD Collected</span>
                      <span className="font-bold">৳{Number(p.total_collected).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Avg Cost / Parcel</span>
                      <span className="font-bold">
                        ৳{Number(cItem?.avg_cost_per_shipment || p.avg_delivery_fee).toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Delivered / Ret</span>
                      <span className="font-bold">
                        {p.delivered_count} / {p.returned_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Avg Speed</span>
                      <span className="font-bold">
                        {p.avg_delivery_hours !== null && p.avg_delivery_hours !== undefined
                          ? `${p.avg_delivery_hours}h`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Trend & City Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Daily Dispatch & Delivery Trend
          </h2>

          {!perf || perf.daily_trend.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No daily trend points yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {perf.daily_trend.map((pt) => {
                const maxVal = Math.max(...perf.daily_trend.map((x) => x.booked), 1);
                const pct = Math.round((pt.booked / maxVal) * 100);
                return (
                  <div key={pt.date} className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {pt.date}
                      </span>
                      <span className="text-slate-500">
                        {pt.booked} booked •{" "}
                        <span className="text-emerald-600 font-bold">{pt.delivered} del</span> •{" "}
                        <span className="text-purple-600">{pt.returned} ret</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* City Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            Regional Delivery Success by City
          </h2>

          {cities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No city distribution data yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2">City</th>
                    <th className="py-2 text-center">Parcels</th>
                    <th className="py-2 text-right">Delivery %</th>
                    <th className="py-2 text-right">Return %</th>
                    <th className="py-2 text-right">Avg Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cities.map((c) => (
                    <tr key={c.city}>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{c.city}</td>
                      <td className="py-2.5 text-center">{c.total_shipments}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {c.delivery_rate}%
                      </td>
                      <td className="py-2.5 text-right text-purple-600">{c.return_rate}%</td>
                      <td className="py-2.5 text-right">৳{Number(c.avg_delivery_fee).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stale Shipments Watchlist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stale Shipments (&gt; 48 Hours Without Status Update)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active parcels that may be stuck at a courier hub and need follow-up
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {stale.length} Flagged
          </span>
        </div>

        {stale.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No stale shipments detected! All active parcels have updated within 48 hours.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stale.map((sh) => (
              <div key={sh.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {sh.consignment_id}
                  </span>{" "}
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 ml-1">
                    {sh.provider}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {sh.recipient_name} ({sh.recipient_phone}) • Last updated{" "}
                    {new Date(sh.updated_at).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={syncingId === sh.id}
                  onClick={() => handleSyncStale(sh.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingId === sh.id ? "animate-spin" : ""}`} />
                  Sync Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

