"use client";

import React from "react";
import { OperatingExpense } from "@/types";
import { Trash2, Repeat, Calendar, Tag } from "lucide-react";

interface ExpenseTableProps {
  expenses: OperatingExpense[];
  onDelete: (id: string) => void;
  currency?: string;
}

export function ExpenseTable({
  expenses,
  onDelete,
  currency = "BDT",
}: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No operating expenses recorded yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Click &quot;Add Expense&quot; above to log rent, salaries, utilities, and software subscriptions.
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
              <th className="py-3 px-4">Title & Details</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Cycle</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {exp.title}
                  </span>
                  {exp.notes && (
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {exp.notes}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {exp.category.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {exp.expense_date}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {exp.is_recurring ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Repeat className="w-3.5 h-3.5" />
                      {exp.recurrence_period}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">One-time</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                  {currency} {Number(exp.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => onDelete(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

