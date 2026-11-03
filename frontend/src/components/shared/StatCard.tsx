import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  const toneClasses = {
    default: "text-slate-900 dark:text-white",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
        <span>{title}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>

      <div className={cn("text-2xl font-bold tracking-tight mt-2.5", toneClasses[tone])}>
        {value}
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded text-[11px]",
              change.isPositive
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
            )}
          >
            {change.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {change.value}
          </span>
        )}
        {subtitle && (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

