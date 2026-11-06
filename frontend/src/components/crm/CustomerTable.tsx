"use client";

import React from "react";
import { Customer } from "@/types";
import {
  Phone,
  MessageCircle,
  Eye,
  AlertTriangle,
  Award,
  Sparkles,
} from "lucide-react";

interface CustomerTableProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  currency?: string;
}

export function CustomerTable({
  customers,
  onSelectCustomer,
  currency = "BDT",
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No customer profiles found
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Customer profiles are created automatically whenever orders are placed or imported.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Segment &amp; Tags</th>
              <th className="py-3 px-4 text-center">Orders</th>
              <th className="py-3 px-4 text-right">Lifetime Spent</th>
              <th className="py-3 px-4 text-center">Return Risk</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {customers.map((c) => {
              const hasHighRisk = c.return_risk_score >= 30.0;
              const isVIP = c.segment === "vip";
              const isRepeat = c.is_repeat_customer;

              return (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {c.name}
                    </span>
                    {c.city && (
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {c.city}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 block">
                      {c.phone}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                        title="Click to call"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                      <a
                        href={`https://wa.me/88${c.phone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-teal-600 hover:underline flex items-center gap-0.5"
                        title="Open WhatsApp chat"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isVIP
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                            : isRepeat
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isVIP && <Award className="w-3 h-3" />}
                        {c.segment}
                      </span>

                      {c.tags.map((t, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            t.includes("Risk")
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {c.delivered_orders} / {c.total_orders}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Delivered
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {currency} {Number(c.total_spent).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      AOV: {currency} {Number(c.average_order_value).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        hasHighRisk
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {hasHighRisk && <AlertTriangle className="w-3 h-3" />}
                      {c.return_risk_score}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onSelectCustomer(c)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
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

