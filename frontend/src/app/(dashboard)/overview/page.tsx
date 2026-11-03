import { StatCard } from "@/components/shared/StatCard";
import { formatBDT } from "@/lib/utils";
import {
  TrendingUp,
  Megaphone,
  ShoppingBag,
  Percent,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Performance Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time reconciliation of Ad Spend, Courier Cash Collections, and True Net Profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Backend API Connected: v1.0.0
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Today's True Net Profit"
          value={formatBDT(18450)}
          subtitle="after COGS & returns"
          change={{ value: "+12.4%", isPositive: true }}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          title="Meta Ad Spend (Today)"
          value={formatBDT(6200)}
          subtitle="across 4 campaigns"
          change={{ value: "-4.1%", isPositive: true }}
          icon={Megaphone}
          tone="default"
        />
        <StatCard
          title="Actual Delivered ROAS"
          value="3.82x"
          subtitle="Meta Claims: 5.10x"
          change={{ value: "+0.45x", isPositive: true }}
          icon={Percent}
          tone="success"
        />
        <StatCard
          title="Courier Delivery Rate"
          value="87.5%"
          subtitle="Pathao & Steadfast"
          change={{ value: "+2.1%", isPositive: true }}
          icon={ShoppingBag}
          tone="default"
        />
      </div>

      {/* Single Source of Truth Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Unit 1 Foundation Ready
          </span>
          <h2 className="text-xl font-bold mt-3">
            Multi-Tenant E-commerce Profit & Ads Intelligence Core
          </h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            FastAPI backend is active with JWT authentication, PostgreSQL multi-tenancy, and modular connector interfaces. Swagger documentation is live at <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">/api/v1/docs</code>.
          </p>
        </div>
      </div>

      {/* Module Readiness Matrix */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          System Module Status Matrix
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tracking implementation milestones as scheduled in PROJECT_EXECUTION_PLAN.md
        </p>

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Unit 1: Core Foundation & Multi-Tenancy
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
              Day 1 Complete
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Unit 2: Product Catalog & Cost Engine (COGS)
              </span>
            </div>
            <span className="text-xs text-slate-400">Upcoming (Day 6)</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Unit 3: WooCommerce & F-Commerce Order Engine
              </span>
            </div>
            <span className="text-xs text-slate-400">Upcoming (Day 9)</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Unit 4: Steadfast, Pathao & RedX Courier Sync
              </span>
            </div>
            <span className="text-xs text-slate-400">Upcoming (Day 15)</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Unit 5: Meta Marketing API & Attribution Engine
              </span>
            </div>
            <span className="text-xs text-slate-400">Upcoming (Day 20)</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Unit 6: Profit & Loss (P&L) Financial Engine
              </span>
            </div>
            <span className="text-xs text-slate-400">Upcoming (Day 26)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

