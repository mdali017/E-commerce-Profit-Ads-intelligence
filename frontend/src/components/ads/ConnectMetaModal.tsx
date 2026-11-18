"use client";

import { useState, useEffect } from "react";
import { ConnectAdAccountInput, MetaAdAccount } from "@/types";
import { adsApi } from "@/lib/ads";
import { X, Key, Shield, RefreshCw, CheckCircle2, AlertCircle, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ConnectMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export function ConnectMetaModal({
  isOpen,
  onClose,
  onConnected,
}: ConnectMetaModalProps) {
  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAccounts, setExistingAccounts] = useState<MetaAdAccount[]>([]);
  const [syncingInsights, setSyncingInsights] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      const accs = await adsApi.getAdAccounts();
      setExistingAccounts(accs);
    } catch {
      // ignore
    }
  };

  const handleSyncInsights = async () => {
    setSyncingInsights(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await adsApi.syncDailyInsights();
      setSyncMessage(res.message || "Meta Insights successfully synchronized!");
      onConnected();
    } catch (err: any) {
      setError(err?.message || "Failed to sync Meta insights.");
    } finally {
      setSyncingInsights(false);
    }
  };

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    try {
      const payload: ConnectAdAccountInput = {
        account_id: accountId.trim(),
        name: name.trim() || `Meta Ad Account (${accountId.trim()})`,
        access_token: accessToken.trim(),
        currency,
        timezone_name: "Asia/Dhaka",
        is_primary: true,
      };

      await adsApi.connectAdAccount(payload);
      onConnected();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to connect Meta Ad Account.");
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectDemo = async () => {
    setConnecting(true);
    setError(null);
    try {
      const payload: ConnectAdAccountInput = {
        account_id: "act_test123",
        name: "Demo Eid Campaign (Test Ad Account)",
        access_token: "test_token",
        currency: "BDT",
        timezone_name: "Asia/Dhaka",
        is_primary: true,
      };
      await adsApi.connectAdAccount(payload);
      onConnected();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to connect Meta Ad Account.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Connect Meta (Facebook) Ads Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automate daily ad spend sync, campaign tracking, and ground-truth ROAS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Connected Account Card */}
        {existingAccounts.length > 0 && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                সংযুক্ত মেটা অ্যাড একাউন্ট ({existingAccounts.length})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                Active
              </span>
            </div>
            {existingAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-slate-800"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {acc.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {acc.account_id} • {acc.currency}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={syncingInsights}
                    onClick={handleSyncInsights}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingInsights ? "animate-spin" : ""}`} />
                    <span>{syncingInsights ? "Syncing..." : "Sync Insights"}</span>
                  </button>
                  <Link
                    href="/ads"
                    onClick={onClose}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="View Ads Dashboard"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
            {syncMessage && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                {syncMessage}
              </div>
            )}
          </div>
        )}

        {/* Quick Demo 1-Click Ingestion */}
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              কোনো মেটা টোকেন নেই? সরাসরি ১-ক্লিকে টেস্ট করুন
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              ডেমো ক্যাম্পেইন ও লাইভ স্পেন্ড সিঙ্ক করে ড্যাশবোর্ড এখনই সচল করুন।
            </p>
          </div>
          <button
            type="button"
            disabled={connecting}
            onClick={handleConnectDemo}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>{connecting ? "কানেক্ট হচ্ছে..." : "১-ক্লিকে টেস্ট কানেক্ট"}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConnect} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meta Ad Account ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. act_1029384756 or 1029384756"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Found in Meta Ads Manager URL: `act_xxxxxxxxxxxx`
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Label / Name
            </label>
            <input
              type="text"
              placeholder="e.g. Primary Brand Ad Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meta Access Token (System User / Graph API) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Paste your long-lived Meta access token with ads_read permission..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
                <option value="USD">USD ($ - US Dollar)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                disabled
                value="Asia/Dhaka (GMT+6)"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connecting ? "animate-spin" : ""}`} />
              {connecting ? "Connecting & Syncing..." : "Connect Ad Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

