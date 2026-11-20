"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from "lucide-react";
import { BackgroundJob } from "@/lib/jobs";

interface BackgroundJobToastProps {
  job: BackgroundJob | null;
  onDismiss: () => void;
  title?: string;
}

export function BackgroundJobToast({ job, onDismiss, title }: BackgroundJobToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (job) {
      setVisible(true);
      if (job.status === "completed") {
        const timer = setTimeout(() => {
          setVisible(false);
          onDismiss();
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [job, onDismiss]);

  if (!visible || !job) return null;

  const isRunning = job.status === "running" || job.status === "queued";
  const isSuccess = job.status === "completed";
  const isFailed = job.status === "failed";

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isRunning && (
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {isSuccess && (
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {isFailed && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {title || (job.type.replace(/_/g, " ").toUpperCase())}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRunning && (job.status === "queued" ? "Queued in Redis..." : `Processing (${job.progress}%)...`)}
                {isSuccess && "Task completed successfully!"}
                {isFailed && (job.error || "Execution failed.")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(job.progress, 15)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
