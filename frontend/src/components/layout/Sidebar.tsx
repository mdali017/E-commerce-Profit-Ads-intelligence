"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { ShieldAlert, Sparkles } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight block">
            ProfitPulse
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase block">
            Ads Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Core Modules
        </div>
        {MAIN_NAVIGATION.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                )}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Single Source of Truth
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Net profit tied to actual delivered COD cash.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

