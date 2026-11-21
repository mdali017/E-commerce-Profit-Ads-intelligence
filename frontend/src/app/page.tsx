"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Truck,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Activity,
  ChevronRight,
  BarChart3,
  DollarSign,
  RefreshCw,
  Flame,
  Check,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"7d" | "30d">("7d");

  // Chart data points based on tab
  const chartPoints7d = [
    { day: "শনি", sales: 42, profit: 24, spend: 9 },
    { day: "রবি", sales: 48, profit: 29, spend: 11 },
    { day: "সোম", sales: 65, profit: 41, spend: 14 },
    { day: "মঙ্গল", sales: 58, profit: 34, spend: 12 },
    { day: "বুধ", sales: 74, profit: 48, spend: 15 },
    { day: "বৃহঃ", sales: 86, profit: 56, spend: 18 },
    { day: "শুক্র", sales: 98, profit: 65, spend: 19 },
  ];

  const chartPoints30d = [
    { day: "সপ্তাহ ১", sales: 180, profit: 110, spend: 45 },
    { day: "সপ্তাহ ২", sales: 240, profit: 155, spend: 58 },
    { day: "সপ্তাহ ৩", sales: 310, profit: 205, spend: 72 },
    { day: "সপ্তাহ ৪", sales: 395, profit: 268, spend: 85 },
  ];

  const activePoints = activeTab === "7d" ? chartPoints7d : chartPoints30d;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-emerald-500 selection:text-white flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* ── Background Subtle Ambient Lights ───────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] bg-emerald-500/12 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[25%] w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[160px]" />
      </div>

      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="relative z-30 border-b border-slate-800/70 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                ProfitPulse
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                ADS & PROFIT INTELLIGENCE
              </div>
            </div>
          </Link>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
            >
              লগইন করুন
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:opacity-95 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <span>ফ্রি অ্যাকাউন্ট খুলুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section (Left Offer + Right Animated Graph) ────── */}
      <main className="relative z-20 flex-1 flex items-center py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* ── Left Column: Offer & Persuasive Copy (7 cols on lg) ───── */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6 text-left">
              {/* Top Attention Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>বাংলাদেশের ই-কমার্স উদ্যোক্তাদের জন্য স্পেশাল অফার</span>
              </div>

              {/* High-Impact Headline */}
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.2] tracking-tight">
                বিজ্ঞাপনে কত খরচ হলো, আর{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  পকেটে আসল কত লাভ এলো
                </span>{" "}
                — দেখুন লাইভ!
              </h1>

              {/* Sub-Headline / Problem Solver */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                মেটা/ফেসবুক অ্যাডের ভুয়া আরওএএস দেখে বিভ্রান্ত হবেন না।{" "}
                <strong className="text-white font-semibold">Steadfast ও Pathao কুরিয়ারের ক্যাশ</strong>,{" "}
                <strong className="text-white font-semibold">মেটা অ্যাড খরচ</strong> এবং{" "}
                <strong className="text-white font-semibold">প্রোডাক্টের আসল কেনা দাম (COGS)</strong> মিলিয়ে স্বয়ংক্রিয়ভাবে জানুন আপনার ব্যবসার প্রকৃত নেট প্রফিট।
              </p>

              {/* Core Offer Checklist in Bangla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Steadfast ও Pathao কুরিয়ার COD ক্যাশ অটো-রিকনসাইল",
                  "কোন অ্যাড ক্যাম্পেইনে লাভ হচ্ছে তা ১-ক্লিকে নিশ্চিত হওয়া",
                  "রিটার্ন লস ও ফেক কাস্টমার প্রিভেনশন অ্যালার্ট",
                  "২ মিনিটে WooCommerce ও Shopify ইন্টিগ্রেশন",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Action Buttons Group */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:opacity-95 rounded-2xl shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all text-center"
                >
                  <span>১৪ দিনের ফ্রি ট্রায়াল শুরু করুন</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all hover:border-slate-700 text-center"
                >
                  <span>লগইন করুন</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>কোনো ক্রেডিট কার্ড লাগবে না</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>২ মিনিটে ফ্রি স্টোর সেটআপ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>১০০% ডাটা সুরক্ষিত ও প্রাইভেট</span>
                </div>
              </div>
            </div>

            {/* ── Right Column: Animated Live Chart & Real KPI Card (6 cols on lg) ── */}
            <div className="lg:col-span-6 xl:col-span-6">
              <div className="relative group">
                {/* Glowing Outer Card Border */}
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500/40 via-cyan-500/30 to-purple-500/40 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />

                <div className="relative rounded-3xl bg-[#0b1324] border border-slate-800 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="ml-2 text-xs font-semibold text-slate-300">
                        লাইভ প্রফিট ও ক্যাশফ্লো ট্র্যাকার
                      </span>
                    </div>

                    {/* Timeframe Switcher */}
                    <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab("7d")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          activeTab === "7d"
                            ? "bg-emerald-500 text-slate-950 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ৭ দিন
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("30d")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                          activeTab === "30d"
                            ? "bg-emerald-500 text-slate-950 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ৩০ দিন
                      </button>
                    </div>
                  </div>

                  {/* Top KPI Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 my-5">
                    {/* KPI 1 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 relative overflow-hidden">
                      <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                        <span>আসল নেট লাভ</span>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="mt-1.5 text-xl sm:text-2xl font-black text-emerald-400">
                        {activeTab === "7d" ? "৳১,৪২,৮৫০" : "৳৫,৩৮,৪০০"}
                      </div>
                      <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                        +২৪.৫% লাভ বৃদ্ধি
                      </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                        <span>মেটা অ্যাড খরচ</span>
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="mt-1.5 text-xl sm:text-2xl font-black text-white">
                        {activeTab === "7d" ? "৳৩৮,২০০" : "৳১,৪৫,০০০"}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                        True ROAS: ৩.৭৪x
                      </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                        <span>কুরিয়ার COD ক্যাশ</span>
                        <Truck className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="mt-1.5 text-xl sm:text-2xl font-black text-purple-300">
                        {activeTab === "7d" ? "৳২,৯৪,৫০০" : "৳১১,২০,০০০"}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                        ডেলিভারি: ৮৯.৪%
                      </div>
                    </div>
                  </div>

                  {/* ── Animated SVG Interactive Profit Chart ─────────── */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        নেট ক্যাশফ্লো ও প্রফিট কার্ভ
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                          আসল লাভ
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                          অ্যাড খরচ
                        </span>
                      </div>
                    </div>

                    {/* Interactive Chart Container */}
                    <div className="h-44 w-full relative flex items-end justify-between pt-6 pb-2 px-1">
                      {/* Ambient Grid Lines */}
                      <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/50 border-dashed" />
                      <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/50 border-dashed" />
                      <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/50 border-dashed" />

                      {/* Dynamic Bars / Graph Visualization */}
                      {activePoints.map((point, idx) => {
                        const maxVal = activeTab === "7d" ? 100 : 400;
                        const profitHeight = `${Math.min(100, (point.profit / maxVal) * 100)}%`;
                        const spendHeight = `${Math.min(100, (point.spend / maxVal) * 100)}%`;

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end h-full gap-1 group/bar relative"
                          >
                            {/* Hover Tooltip */}
                            <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-[10px] font-bold text-white px-2 py-1 rounded-md border border-slate-700 shadow-xl whitespace-nowrap z-20">
                              লাভ: ৳{(point.profit * 1000).toLocaleString("bn-BD")}
                            </div>

                            {/* Double Bars (Profit vs Ad Spend) */}
                            <div className="w-full max-w-[28px] flex items-end justify-center gap-1.5 h-full">
                              {/* Profit Bar */}
                              <div
                                style={{ height: profitHeight }}
                                className="w-3 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-125 transition-all shadow-sm shadow-emerald-500/20"
                              />
                              {/* Spend Bar */}
                              <div
                                style={{ height: spendHeight }}
                                className="w-3 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all opacity-80"
                              />
                            </div>

                            {/* Day Label */}
                            <span className="text-[11px] font-medium text-slate-400 mt-2">
                              {point.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Integration Status Indicator Bar */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-slate-300">
                        Steadfast & Pathao কুরিয়ার সিঙ্ক সক্রিয়
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        Meta API Connected
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                        WooCommerce Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer Strip ──────────────────────────────────────────────── */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-[#070b14]/90 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">ProfitPulse</span>
            <span>—</span>
            <span>বাংলাদেশের ই-কমার্স বিজনেসের সিঙ্গেল সোর্স অফ ট্রুথ।</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              লগইন
            </Link>
            <Link href="/signup" className="hover:text-emerald-400 transition-colors">
              ফ্রি অ্যাকাউন্ট
            </Link>
            <span className="text-slate-400">© {new Date().getFullYear()} ProfitPulse SaaS.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
