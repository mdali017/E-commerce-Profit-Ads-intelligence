"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  KeyRound,
  Layers,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workspace Settings & Integrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage courier integrations (Steadfast, Pathao, eCourier), COD payout controls, and
          workspace channels.
        </p>
      </div>

      {/* Integration Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/settings/couriers"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Truck className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Active Integration
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Courier APIs & Webhooks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Configure Steadfast, Pathao OAuth 2.0, and eCourier credentials, test connections,
              copy webhook URLs, and trigger polling sync.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Manage Courier Connections</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/couriers/settlements"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Reconciliation
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              COD Settlements & Payouts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Match delivered COD parcels against bank deposits, courier fees, and net cash
              payouts across all couriers.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Open Settlement Ledger</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        <Link
          href="/couriers/analytics"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Intelligence
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              Courier Delivery & Cost Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Compare Steadfast vs Pathao vs eCourier delivery success rate, return ratios, and
              city-level SLA speed.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400">
            <span>View Performance Reports</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Existing Workspace Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Multi-Tenancy & RBAC
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Workspace role permissions and tenant isolation configured in Unit 1.
          </p>
        </div>

        <Link
          href="/ads"
          className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Layers className="w-4 h-4 text-blue-500" />
            Meta Ads Attribution
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage Meta ad accounts, daily spend sync, and UTM order matching.
          </p>
        </Link>

        <Link
          href="/orders"
          className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <KeyRound className="w-4 h-4 text-amber-500" />
            Order Dispatch Pipeline
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect fraud risk scores and dispatch confirmed orders individually or in bulk.
          </p>
        </Link>
      </div>
    </div>
  );
}
