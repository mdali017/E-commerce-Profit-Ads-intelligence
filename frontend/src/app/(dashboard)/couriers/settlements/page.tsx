"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CourierShipment,
  CourierSettlement,
  CourierProvider,
} from "@/types";
import { couriersApi } from "@/lib/couriers";
import { SettlementTable } from "@/components/couriers/SettlementTable";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";

export default function CourierSettlementsPage() {
  const [unsettled, setUnsettled] = useState<CourierShipment[]>([]);
  const [settlements, setSettlements] = useState<CourierSettlement[]>([]);
  const [providerFilter, setProviderFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Settlement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settlementNumber, setSettlementNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Detail Modal
  const [detail, setDetail] = useState<CourierSettlement | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prov = providerFilter !== "all" ? providerFilter : undefined;
      const [unsettledData, historyData] = await Promise.all([
        couriersApi.getUnsettledShipments(prov),
        couriersApi.getSettlements(prov),
      ]);
      setUnsettled(unsettledData);
      setSettlements(historyData);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err?.message || "Failed to load settlement data.");
    } finally {
      setLoading(false);
    }
  }, [providerFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === unsettled.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unsettled.map((s) => s.id));
    }
  };

  const selectedShipments = useMemo(
    () => unsettled.filter((s) => selectedIds.includes(s.id)),
    [unsettled, selectedIds]
  );

  const previewTotals = useMemo(() => {
    const collected = selectedShipments.reduce(
      (acc, s) => acc + Number(s.collected_amount || 0),
      0
    );
    const delFees = selectedShipments.reduce(
      (acc, s) => acc + Number(s.delivery_fee || 0),
      0
    );
    const codFees = selectedShipments.reduce(
      (acc, s) => acc + Number(s.cod_fee || 0),
      0
    );
    return {
      collected,
      delFees,
      codFees,
      net: collected - delFees - codFees,
    };
  }, [selectedShipments]);

  const totalUnsettledCash = useMemo(
    () => unsettled.reduce((acc, s) => acc + Number(s.collected_amount || 0), 0),
    [unsettled]
  );

  const totalSettledNet = useMemo(
    () => settlements.reduce((acc, s) => acc + Number(s.net_payout_amount || 0), 0),
    [settlements]
  );

  const openCreateModal = () => {
    const prov = selectedShipments[0]?.provider || "steadfast";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setSettlementNumber(`SET-${prov.toUpperCase()}-${dateStr}`);
    setReferenceNumber("");
    setBankAccount("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShipments.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      const prov: CourierProvider = selectedShipments[0].provider;
      await couriersApi.createSettlement({
        provider: prov,
        settlement_number: settlementNumber.trim(),
        shipment_ids: selectedIds,
        status: "PAID",
        reference_number: referenceNumber.trim() || undefined,
        bank_account: bankAccount.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to create settlement.");
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetail = async (s: CourierSettlement) => {
    try {
      const full = await couriersApi.getSettlementDetail(s.id);
      setDetail(full);
    } catch {
      setDetail(s);
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
            <Banknote className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            COD Settlement & Cash Reconciliation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Match delivered parcels to courier bank payouts and verify deductions (delivery + COD fees).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <option value="all">All Couriers</option>
            <option value="steadfast">Steadfast</option>
            <option value="pathao">Pathao</option>
            <option value="ecourier">eCourier</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Unsettled Delivered Cash
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            ৳{totalUnsettledCash.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {unsettled.length} delivered parcel(s) awaiting remittance
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Net Remitted
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ৳{totalSettledNet.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {settlements.length} recorded settlement statement(s)
          </p>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Selected for Payout
            </span>
            <div className="text-2xl font-bold text-white mt-2">
              ৳{previewTotals.net.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={openCreateModal}
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Settlement ({selectedIds.length} parcels)
          </button>
        </div>
      </div>

      {/* Unsettled Shipments Selection Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Delivered Shipments Pending Settlement ({unsettled.length})
          </h2>
          {unsettled.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {selectedIds.length === unsettled.length ? "Clear Selection" : "Select All"}
            </button>
          )}
        </div>

        {unsettled.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            All delivered shipments have been settled!
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === unsettled.length && unsettled.length > 0}
                        onChange={toggleAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3">Consignment & Invoice</th>
                    <th className="px-4 py-3">Courier</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3 text-right">Collected</th>
                    <th className="px-4 py-3 text-right">Del + COD Fee</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {unsettled.map((s) => {
                    const fees = Number(s.delivery_fee || 0) + Number(s.cod_fee || 0);
                    const net = Number(s.collected_amount || 0) - fees;
                    const checked = selectedIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => toggleSelect(s.id)}
                        className={`cursor-pointer transition-colors ${
                          checked
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(s.id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold font-mono text-slate-900 dark:text-white">
                            {s.consignment_id}
                          </div>
                          <div className="text-[11px] text-slate-400">{s.invoice_number}</div>
                        </td>
                        <td className="px-4 py-3 uppercase font-bold text-[11px] text-slate-600 dark:text-slate-300">
                          {s.provider}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.recipient_name}
                          </div>
                          <div className="text-[11px] text-slate-400">{s.recipient_phone}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                          ৳{Number(s.collected_amount).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-500">
                          -৳{fees.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          ৳{net.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Settlement History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Recorded Settlement History
        </h2>
        <SettlementTable
          settlements={settlements}
          loading={loading}
          onViewSettlement={handleViewDetail}
        />
      </div>

      {/* Create Settlement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Courier COD Settlement
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSettlement} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-900 text-white rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">COD Collected</span>
                  <span className="text-sm font-bold">৳{previewTotals.collected.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Fees</span>
                  <span className="text-sm font-bold text-rose-300">
                    -৳{(previewTotals.delFees + previewTotals.codFees).toFixed(0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Net Bank Payout</span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    ৳{previewTotals.net.toFixed(0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Settlement / Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={settlementNumber}
                  onChange={(e) => setSettlementNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Bank / Mobile Wallet Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-992184"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Receiving Account</label>
                  <input
                    type="text"
                    placeholder="e.g. City Bank / bKash Merchant"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {creating ? "Saving..." : "Confirm & Mark Settled"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settlement Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {detail.settlement_number}
                </h3>
                <p className="text-xs text-slate-500">
                  {detail.provider.toUpperCase()} • {detail.shipment_count} parcels • {detail.status}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                <div>
                  <span className="text-slate-400 block">Collected</span>
                  <span className="font-bold text-sm">৳{Number(detail.total_collected_amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Del + COD Fees</span>
                  <span className="font-bold text-sm text-rose-500">
                    -৳{(Number(detail.total_delivery_fees) + Number(detail.total_cod_fees)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Net Payout</span>
                  <span className="font-extrabold text-sm text-emerald-600">
                    ৳{Number(detail.net_payout_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {detail.shipments && detail.shipments.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-2">
                    Included Shipments ({detail.shipments.length})
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    {detail.shipments.map((sh) => (
                      <div key={sh.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold">{sh.consignment_id}</div>
                          <div className="text-[11px] text-slate-400">
                            {sh.invoice_number} • {sh.recipient_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">
                            ৳{Number(sh.collected_amount).toFixed(0)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Fee: ৳{Number(sh.delivery_fee).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

