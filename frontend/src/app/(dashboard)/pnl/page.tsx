"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  PnLSummary,
  PnLTimeSeriesPoint,
  BreakEvenAnalysis,
  OperatingExpense,
  ProductPnLItem,
} from "@/types";
import { financeApi, ExpenseCategoryItem } from "@/lib/finance";
import { getSessionCache, setSessionCache } from "@/lib/swr";
import { PnLSummaryHero } from "@/components/pnl/PnLSummaryHero";
import { PnLWaterfall } from "@/components/pnl/PnLWaterfall";
import { PnLTrendChart } from "@/components/pnl/PnLTrendChart";
import { ExpenseModal } from "@/components/pnl/ExpenseModal";
import { ExpenseTable } from "@/components/pnl/ExpenseTable";
import { ProductPnLTable } from "@/components/pnl/ProductPnLTable";
import {
  TrendingUp,
  Download,
  Plus,
  Calendar,
  Layers,
  Package,
  Receipt,
  RefreshCw,
} from "lucide-react";

interface PnLCacheData {
  summary: PnLSummary | null;
  trends: PnLTimeSeriesPoint[];
  breakeven: BreakEvenAnalysis | null;
  expenses: OperatingExpense[];
  categories: ExpenseCategoryItem[];
  productPnl: ProductPnLItem[];
}

export default function PnLPage() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "month" | "today">("7d");
  const [dateBasis, setDateBasis] = useState<"delivery_date" | "order_date">("delivery_date");
  const [activeTab, setActiveTab] = useState<"waterfall" | "products" | "expenses">("waterfall");

  const [summary, setSummary] = useState<PnLSummary | null>(null);
  const [trends, setTrends] = useState<PnLTimeSeriesPoint[]>([]);
  const [breakeven, setBreakeven] = useState<BreakEvenAnalysis | null>(null);
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [productPnl, setProductPnl] = useState<ProductPnLItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Calculate start & end date strings based on preset
  const getDateBounds = useCallback(() => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    let start = end;

    if (dateRange === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      start = d.toISOString().split("T")[0];
    } else if (dateRange === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      start = d.toISOString().split("T")[0];
    } else if (dateRange === "month") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = d.toISOString().split("T")[0];
    }

    return { start, end };
  }, [dateRange]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent && !summary) setLoading(true);
    const { start, end } = getDateBounds();
    const cacheKey = `profitpulse_pnl_${dateRange}_${dateBasis}`;

    try {
      const [sumRes, trendRes, beRes, expRes, catRes, prodRes] = await Promise.all([
        financeApi.getPnLSummary(start, end, dateBasis),
        financeApi.getPnLTimeseries(start, end),
        financeApi.getBreakEvenAnalysis(start, end),
        financeApi.getExpenses(start, end),
        financeApi.getExpenseCategories(),
        financeApi.getProductPnL(start, end),
      ]);

      setSummary(sumRes);
      setTrends(trendRes);
      setBreakeven(beRes);
      setExpenses(expRes);
      setCategories(catRes);
      setProductPnl(prodRes);

      setSessionCache<PnLCacheData>(cacheKey, {
        summary: sumRes,
        trends: trendRes,
        breakeven: beRes,
        expenses: expRes,
        categories: catRes,
        productPnl: prodRes,
      });
    } catch (err) {
      console.error("Failed to load P&L financial data:", err);
    } finally {
      setLoading(false);
    }
  }, [dateBasis, dateRange, getDateBounds, summary]);

  useEffect(() => {
    // 1. Immediately hydrate from client session cache for 0ms instant render
    const cacheKey = `profitpulse_pnl_${dateRange}_${dateBasis}`;
    const cached = getSessionCache<PnLCacheData>(cacheKey);
    if (cached) {
      setSummary(cached.summary);
      setTrends(cached.trends);
      setBreakeven(cached.breakeven);
      setExpenses(cached.expenses);
      setCategories(cached.categories);
      setProductPnl(cached.productPnl);
      setLoading(false);
    }
    // 2. Silently revalidate fresh metrics in background
    loadData(!!cached);
  }, [dateRange, dateBasis]);

  async function handleDeleteExpense(id: string) {
    if (!confirm("Are you sure you want to delete this operating expense?")) return;
    try {
      await financeApi.deleteExpense(id);
      loadData();
    } catch (err) {
      alert("Failed to delete expense");
    }
  }

  function handleExportCsv() {
    const { start, end } = getDateBounds();
    const url = financeApi.getExportCsvUrl(start, end, dateBasis);
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Page Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Profit &amp; Loss (P&amp;L) Financial Engine
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real cash-basis financial intelligence matching courier delivery collections, COGS, and ad spend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Basis Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setDateBasis("delivery_date")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateBasis === "delivery_date"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Delivery Date (Cash)
            </button>
            <button
              onClick={() => setDateBasis("order_date")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateBasis === "order_date"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Order Date (Cohort)
            </button>
          </div>

          {/* Date Range Presets */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            {(["today", "7d", "30d", "month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  dateRange === r
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {r === "today"
                  ? "Today"
                  : r === "7d"
                  ? "7 Days"
                  : r === "30d"
                  ? "30 Days"
                  : "This Month"}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => loadData(false)}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh financial data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Hero Summary & Benchmarks */}
      <PnLSummaryHero
        summary={summary}
        breakeven={breakeven}
        currency={summary?.currency || "BDT"}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("waterfall")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "waterfall"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          Waterfall &amp; Daily Trajectory
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "products"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Package className="w-4 h-4" />
          Product Profitability ({productPnl.length})
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "expenses"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Operating Expenses ({expenses.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "waterfall" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <PnLWaterfall
              items={summary?.waterfall || []}
              currency={summary?.currency || "BDT"}
            />
          </div>
          <div className="lg:col-span-5">
            <PnLTrendChart
              points={trends}
              currency={summary?.currency || "BDT"}
            />
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <ProductPnLTable
          products={productPnl}
          currency={summary?.currency || "BDT"}
        />
      )}

      {activeTab === "expenses" && (
        <ExpenseTable
          expenses={expenses}
          onDelete={handleDeleteExpense}
          currency={summary?.currency || "BDT"}
        />
      )}

      {/* Add Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={loadData}
        categories={categories}
        currency={summary?.currency || "BDT"}
      />
    </div>
  );
}
