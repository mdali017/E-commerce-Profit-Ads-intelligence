"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { couriersApi } from "@/lib/couriers";
import { CourierCredential, CourierProvider, SteadfastBalance } from "@/types";
import { ConfigureCourierModal } from "@/components/couriers/ConfigureCourierModal";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  PlugZap,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";

interface ProviderMeta {
  provider: CourierProvider;
  title: string;
  subtitle: string;
  accentClass: string;
  badgeClass: string;
  syncMethod: string;
  features: string[];
}

const PROVIDERS: ProviderMeta[] = [
  {
    provider: "steadfast",
    title: "Steadfast Courier",
    subtitle: "Fast nationwide COD delivery with bulk consignment & fraud check API.",
    accentClass: "border-emerald-200 dark:border-emerald-500/30",
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    syncMethod: "Instant Webhook + Balance & Fraud API",
    features: ["Bulk Dispatch (<=500)", "Fraud Check", "Balance Check", "Real-Time Webhooks"],
  },
  {
    provider: "pathao",
    title: "Pathao Courier",
    subtitle: "OAuth 2.0 Merchant API with City -> Zone -> Area pricing & hub tracking.",
    accentClass: "border-rose-200 dark:border-rose-500/30",
    badgeClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
    syncMethod: "OAuth 2.0 + X-PATHAO-Signature Webhook",
    features: ["Auto Token Refresh", "Zone/Area Pricing", "Store Sync", "HMAC Verified Webhooks"],
  },
  {
    provider: "ecourier",
    title: "eCourier",
    subtitle: "City/Thana/Postcode structured booking with automated 30-min polling sync.",
    accentClass: "border-violet-200 dark:border-violet-500/30",
    badgeClass: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
    syncMethod: "30-Min Background Polling + Callback",
    features: ["30m Auto Polling", "Thana/Postcode Tree", "Payment Tracking", "Pre-Pickup Cancel"],
  },
];

export default function CourierSettingsPage() {
  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider>("steadfast");
  const [copiedProvider, setCopiedProvider] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Steadfast live balance state
  const [balance, setBalance] = useState<SteadfastBalance | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // eCourier manual poll state
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<string | null>(null);

  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, "");

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couriersApi.getCredentials();
      setCredentials(data);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleOpenConfig = (provider: CourierProvider) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  const handleCopyWebhook = (provider: CourierProvider) => {
    const url = `${apiBase}/couriers/webhook/${provider}`;
    navigator.clipboard.writeText(url);
    setCopiedProvider(provider);
    setTimeout(() => setCopiedProvider(null), 2000);
  };

  const handleCheckBalance = async () => {
    setCheckingBalance(true);
    setBalanceError(null);
    try {
      const data = await couriersApi.getSteadfastBalance();
      setBalance(data);
    } catch (err: any) {
      setBalanceError(err?.message || "Could not fetch Steadfast balance.");
    } finally {
      setCheckingBalance(false);
    }
  };

  const handlePollECourier = async () => {
    setPolling(true);
    setPollResult(null);
    try {
      const res = await couriersApi.pollActiveShipments("ecourier");
      setPollResult(`Checked ${res.checked} parcel(s), updated ${res.updated}.`);
    } catch (err: any) {
      setPollResult(err?.message || "Failed to run eCourier poll.");
    } finally {
      setPolling(false);
    }
  };

  const handleDeleteCredential = async (cred: CourierCredential) => {
    if (
      !confirm(
        `Remove ${cred.provider.toUpperCase()} API credentials from this workspace? Existing shipments remain intact.`
      )
    ) {
      return;
    }
    setDeletingId(cred.id);
    try {
      await couriersApi.deleteCredential(cred.id);
      await loadCredentials();
    } catch (err: any) {
      alert(err?.message || "Failed to delete credential.");
    } finally {
      setDeletingId(null);
    }
  };

  const connectedCount = credentials.filter((c) => c.is_active).length;
  const defaultCred = credentials.find((c) => c.is_default);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Workspace Settings
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200">Courier APIs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Courier API & Webhook Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect Steadfast, Pathao, and eCourier merchant accounts to book parcels, sync live
            status, and automate COD settlement reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/couriers"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Shipments Dashboard
          </Link>
          <Link
            href="/couriers/settlements"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            COD Settlements
          </Link>
          <Link
            href="/couriers/analytics"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <PlugZap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Connected Couriers
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {loading ? "..." : `${connectedCount} of 3 Active`}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Default Dispatch Provider
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {loading ? "..." : defaultCred ? defaultCred.provider : "Not Set"}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Background Sync Engine
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              30-min eCourier Poll & Pathao OAuth Refresh
            </p>
          </div>
        </div>
      </div>

      {/* Provider Integration Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {PROVIDERS.map((meta) => {
          const cred = credentials.find((c) => c.provider === meta.provider);
          const webhookUrl = `${apiBase}/couriers/webhook/${meta.provider}`;

          return (
            <div
              key={meta.provider}
              className={`rounded-2xl bg-white dark:bg-slate-900 border ${
                cred?.is_active ? meta.accentClass : "border-slate-200 dark:border-slate-800"
              } shadow-xs flex flex-col justify-between overflow-hidden`}
            >
              <div className="p-5 space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {meta.title}
                      </h2>
                      {cred?.is_default && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                          DEFAULT
                        </span>
                      )}
                      {cred?.is_sandbox && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          SANDBOX
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {meta.subtitle}
                    </p>
                  </div>

                  {cred ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${meta.badgeClass}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                      <XCircle className="w-3.5 h-3.5" />
                      Not Configured
                    </span>
                  )}
                </div>

                {/* Sync Method & Feature Pills */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>{meta.syncMethod}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.features.map((feat) => (
                      <span
                        key={feat}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Credential Details */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2 text-xs">
                  {cred ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          {meta.provider === "pathao" ? "Client ID" : "API Key"}
                        </span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {cred.client_id || cred.api_key}
                        </span>
                      </div>

                      {meta.provider === "ecourier" && cred.user_id && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400">USER-ID</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {cred.user_id}
                          </span>
                        </div>
                      )}

                      {meta.provider === "pathao" && (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-400">OAuth Token</span>
                            <span
                              className={`font-semibold ${
                                cred.has_valid_token
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {cred.has_valid_token ? "Valid & Cached" : "Pending / Refresh Needed"}
                            </span>
                          </div>
                          {cred.store_id && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 dark:text-slate-400">Store ID</span>
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {cred.store_id}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Secret Encryption</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {cred.has_secret ? "Fernet Encrypted" : "Masked"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">
                      Add API credentials to enable automated booking and tracking sync for{" "}
                      {meta.title}.
                    </p>
                  )}
                </div>

                {/* Provider-Specific Live Controls */}
                {meta.provider === "steadfast" && cred && (
                  <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" />
                        Merchant Balance
                      </span>
                      <button
                        type="button"
                        onClick={handleCheckBalance}
                        disabled={checkingBalance}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${checkingBalance ? "animate-spin" : ""}`} />
                        {checkingBalance ? "Checking..." : "Check Balance"}
                      </button>
                    </div>
                    {balance && (
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          ৳ {Number(balance.current_balance || 0).toLocaleString()} {balance.currency}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {balance.mode} mode
                        </span>
                      </div>
                    )}
                    {balanceError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">{balanceError}</p>
                    )}
                  </div>
                )}

                {meta.provider === "ecourier" && cred && (
                  <div className="rounded-xl border border-violet-200/70 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Active Parcel Polling
                      </span>
                      <button
                        type="button"
                        onClick={handlePollECourier}
                        disabled={polling}
                        className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${polling ? "animate-spin" : ""}`} />
                        {polling ? "Polling..." : "Poll Now"}
                      </button>
                    </div>
                    {pollResult && (
                      <p className="text-[11px] font-medium text-violet-700 dark:text-violet-300">
                        {pollResult}
                      </p>
                    )}
                  </div>
                )}

                {/* Webhook Endpoint Copy Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Webhook Callback URL
                    </span>
                    {meta.provider === "pathao" && (
                      <span className="text-[10px] text-slate-400">Header: X-PATHAO-Signature</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
                    <code className="text-[11px] text-slate-700 dark:text-slate-300 truncate flex-1 font-mono">
                      {webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyWebhook(meta.provider)}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                      title="Copy Webhook URL"
                    >
                      {copiedProvider === meta.provider ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenConfig(meta.provider)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {cred ? "Edit Credentials & Test" : `Connect ${meta.title.split(" ")[0]}`}
                </button>

                {cred && (
                  <button
                    type="button"
                    disabled={deletingId === cred.id}
                    onClick={() => handleDeleteCredential(cred)}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    title="Delete Credentials"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Client Synchronization Architecture Info */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          How Automated Data Collection Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">
              1. Secure Credential Storage
            </p>
            API Secrets, Pathao OAuth tokens, and passwords are encrypted with Fernet before saving
            to PostgreSQL and masked on every API response.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">
              2. Hybrid Real-Time Tracking
            </p>
            Steadfast and Pathao push live updates via verified webhooks, while eCourier and active
            parcels sync via 30-minute background polling and one-click manual sync.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
            <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">
              3. Automatic Order & COD P&L Sync
            </p>
            Delivered, returned, and cancelled statuses automatically update order status, payment
            status, customer CRM metrics, and unsettled COD payout queues.
          </div>
        </div>
      </div>

      <ConfigureCourierModal
        isOpen={modalOpen}
        initialProvider={selectedProvider}
        onClose={() => setModalOpen(false)}
        onSaved={loadCredentials}
      />
    </div>
  );
}

