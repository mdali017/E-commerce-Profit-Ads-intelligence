"use client";

import { Building2, ChevronDown, Bell, User as UserIcon } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Workspace Selector */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>My E-commerce Store</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
            BDT
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            EO
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              Ecom Owner
            </span>
            <span className="block text-[11px] text-slate-500 font-medium leading-tight">
              Owner
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

