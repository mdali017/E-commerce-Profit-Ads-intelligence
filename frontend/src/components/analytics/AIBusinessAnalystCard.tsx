"use client";

import React, { useState } from "react";
import { AIBriefing } from "@/types";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface AIBusinessAnalystCardProps {
  briefing: AIBriefing | null;
  isGenerating: boolean;
  onRegenerate: () => Promise<void>;
}

export function AIBusinessAnalystCard({
  briefing,
  isGenerating,
  onRegenerate,
}: AIBusinessAnalystCardProps) {
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  const toggleComplete = (idx: number) => {
    if (completedItems.includes(idx)) {
      setCompletedItems(completedItems.filter((i) => i !== idx));
    } else {
      setCompletedItems([...completedItems, idx]);
    }
  };

  const healthScore = briefing?.health_score ?? 75;
  const isGoodHealth = healthScore >= 75;
  const isModerateHealth = healthScore >= 60 && healthScore < 75;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 shadow-sm overflow-hidden p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                AI Business Analyst & Decision Engine
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Live Doctor
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Correlated insights from P&L waterfall, Meta ad leakage, courier delivery rates & return risk.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Health Score Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-xs text-slate-500 font-medium">Business Health:</span>
            <span
              className={`text-sm font-black ${
                isGoodHealth
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isModerateHealth
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {healthScore}/100
            </span>
          </div>

          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Analyzing..." : "Re-Analyze"}</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Executive Summary */}
      <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30">
        <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-purple-100">
          {briefing?.executive_summary ||
            "আপনার বর্তমান ব্যবসায়িক মেট্রিক্স বিশ্লেষণ করে এআই ব্রিফিং প্রস্তুত করা হচ্ছে..."}
        </p>
      </div>

      {/* Grid: Key Findings & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Key Findings */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Key Diagnostic Findings</span>
          </span>
          <div className="space-y-2">
            {briefing?.key_findings && briefing.key_findings.length > 0 ? (
              briefing.key_findings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850/60 text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2.5"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{finding}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                কোনো নেগেটিভ ফাইন্ডিং শনাক্ত হয়নি।
              </div>
            )}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Actionable Decisions & Next Steps</span>
          </span>
          <div className="space-y-2">
            {briefing?.action_items && briefing.action_items.length > 0 ? (
              briefing.action_items.map((action, idx) => {
                const done = completedItems.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleComplete(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start space-x-2.5 ${
                      done
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-60"
                        : "bg-white dark:bg-slate-850/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleComplete(idx)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 shrink-0"
                    />
                    <p
                      className={`text-xs leading-relaxed ${
                        done
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200 font-medium"
                      }`}
                    >
                      {action}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                কোনো জরুরি অ্যাকশন আইটেম নেই।
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

