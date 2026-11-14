"use client";

import { CourierSettlement } from "@/types";
import { Banknote, CheckCircle2, Clock, AlertTriangle, Eye } from "lucide-react";

interface SettlementTableProps {
  settlements: CourierSettlement[];
  loading: boolean;
  onViewSettlement?: (settlement: CourierSettlement) => void;
}

export function SettlementTable({
  settlements,
  loading,
  onViewSettlement,
}: SettlementTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        ))}
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
        <Banknote className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Settlements Recorded Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select unsettled delivered shipments above to record a courier bank payout statement.
        </p>
      </div>
    );
  }

  const getStatusBadge = (st: string) => {
    const u = st.toUpperCase();
    if (u === "PAID") {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200";
    }
    if (u === "DISPUTED") {
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200";
    }
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200";
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Settlement # & Courier</th>
              <th className="px-4 py-3.5">Payout Date</th>
              <th className="px-4 py-3.5 text-center">Parcels</th>
              <th className="px-4 py-3.5 text-right">COD Collected</th>
              <th className="px-4 py-3.5 text-right">Del. & COD Fees</th>
              <th className="px-4 py-3.5 text-right">Net Payout</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              {onViewSettlement && <th className="px-5 py-3.5 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {settlements.map((st) => {
              const totalFees = Number(st.total_delivery_fees) + Number(st.total_cod_fees);
              return (
                <tr
                  key={st.id}
                  onClick={() => onViewSettlement?.(st)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white font-mono">
                      {st.settlement_number}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {st.provider}
                      </span>
                      {st.bank_account && (
                        <span className="text-[10px] text-slate-400">{st.bank_account}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {new Date(st.payout_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {st.shipment_count}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-800 dark:text-slate-200">
                    ৳{Number(st.total_collected_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-400">
                    -৳{totalFees.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    ৳{Number(st.net_payout_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                        st.status
                      )}`}
                    >
                      {st.status}
                    </span>
                  </td>
                  {onViewSettlement && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewSettlement(st);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

