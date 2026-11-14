"use client";

import { useState, useEffect } from "react";
import {
  CourierProvider,
  CourierCredentialCreateInput,
  CourierCredential,
  PathaoStore,
} from "@/types";
import { couriersApi } from "@/lib/couriers";
import {
  X,
  Check,
  Copy,
  Truck,
  RefreshCw,
  PlugZap,
  ShieldCheck,
  AlertCircle,
  Info,
  Store,
} from "lucide-react";

interface ConfigureCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialProvider?: CourierProvider;
}

export function ConfigureCourierModal({
  isOpen,
  onClose,
  onSaved,
  initialProvider = "steadfast",
}: ConfigureCourierModalProps) {
  const [activeTab, setActiveTab] = useState<CourierProvider>(initialProvider);
  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Common Form State
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [storeId, setStoreId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isSandbox, setIsSandbox] = useState(false);
  const [isDefault, setIsDefault] = useState(true);

  // eCourier specific
  const [userId, setUserId] = useState("");

  // Pathao specific
  const [clientId, setClientId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pathaoStores, setPathaoStores] = useState<PathaoStore[]>([]);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialProvider);
    }
  }, [isOpen, initialProvider]);

  const populateForm = (creds: CourierCredential[], tab: CourierProvider) => {
    const current = creds.find((c) => c.provider === tab);
    setStatusMessage(null);
    setPathaoStores([]);
    if (current) {
      setApiKey(current.api_key || "");
      setSecretKey(current.secret_key || "");
      setStoreId(current.store_id || "");
      setWebhookSecret(current.webhook_secret || "");
      setUserId(current.user_id || "");
      setClientId(current.client_id || current.api_key || "");
      setUsername(current.username || "");
      setPassword(current.has_password ? "••••••••••••" : "");
      setIsSandbox(Boolean(current.is_sandbox));
      setIsDefault(current.is_default);
    } else {
      setApiKey("");
      setSecretKey("");
      setStoreId("");
      setWebhookSecret("");
      setUserId("");
      setClientId("");
      setUsername("");
      setPassword("");
      setIsSandbox(false);
      setIsDefault(creds.length === 0);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    couriersApi
      .getCredentials()
      .then((creds) => {
        setCredentials(creds);
        populateForm(creds, activeTab);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
  ).replace(/\/+$/, "");
  const webhookUrl = `${apiBase}/couriers/webhook/${activeTab}`;

  const currentCred = credentials.find((c) => c.provider === activeTab);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await couriersApi.testConnection({
        provider: activeTab,
        api_key: activeTab === "pathao" ? clientId.trim() || apiKey.trim() : apiKey.trim(),
        secret_key: secretKey.trim() || undefined,
        store_id: storeId.trim() || undefined,
        user_id: userId.trim() || undefined,
        client_id: clientId.trim() || apiKey.trim() || undefined,
        client_secret: secretKey.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        is_sandbox: isSandbox,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `[${res.mode.toUpperCase()}] ${res.message}`,
        });
        if (activeTab === "pathao" && Array.isArray(res.details?.stores)) {
          setPathaoStores(res.details.stores);
        }
      } else {
        setStatusMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const effectiveKey =
        activeTab === "pathao" ? clientId.trim() || apiKey.trim() : apiKey.trim();

      const payload: CourierCredentialCreateInput = {
        provider: activeTab,
        api_key: effectiveKey,
        secret_key: secretKey.trim() || undefined,
        store_id: storeId.trim() || undefined,
        webhook_secret: webhookSecret.trim() || undefined,
        user_id: activeTab === "ecourier" ? userId.trim() || undefined : undefined,
        client_id: activeTab === "pathao" ? clientId.trim() || effectiveKey : undefined,
        client_secret: activeTab === "pathao" ? secretKey.trim() || undefined : undefined,
        username: activeTab === "pathao" ? username.trim() || undefined : undefined,
        password: activeTab === "pathao" ? password.trim() || undefined : undefined,
        is_sandbox: isSandbox,
        is_active: true,
        is_default: isDefault,
      };

      await couriersApi.saveCredential(payload);
      setStatusMessage({
        type: "success",
        text: `${activeTab.toUpperCase()} Courier API saved and activated!`,
      });
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save credentials.",
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: CourierProvider; label: string; color: string }[] = [
    { id: "steadfast", label: "Steadfast", color: "indigo" },
    { id: "pathao", label: "Pathao (OAuth)", color: "rose" },
    { id: "ecourier", label: "eCourier", color: "amber" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Courier API Connector Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect Steadfast, Pathao, or eCourier for automated booking, tracking & COD reconciliation
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

        {/* Provider Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 bg-slate-50/50 dark:bg-slate-900/40 gap-2">
          {tabs.map((tab) => {
            const isConnected = credentials.some((c) => c.provider === tab.id && c.is_active);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                  active
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading saved credentials...
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                  : statusMessage.type === "error"
                  ? "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                  : "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Webhook Callback Box */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {activeTab.toUpperCase()} Webhook Callback URL
              </span>
              {activeTab === "pathao" && currentCred?.has_valid_token && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  OAuth Token Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {activeTab === "ecourier"
                ? "eCourier does not offer self-serve webhooks — send this URL to eCourier Technical Support to whitelist, AND our system automatically polls eCourier every 30 minutes."
                : "Paste this URL into your courier merchant dashboard to receive instant delivery and return notifications:"}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold flex items-center gap-1 shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Provider-Specific Credentials */}
          {activeTab === "steadfast" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Steadfast Api-Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. stdf_key_... (or mock_test for sandbox)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Steadfast Secret-Key *
                  </label>
                  <input
                    type="password"
                    required={!currentCred?.has_secret}
                    placeholder={currentCred?.has_secret ? "Leave masked to keep existing" : "Enter Secret-Key"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Webhook Bearer / Verification Secret (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Optional token configured in Steadfast webhook settings"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === "pathao" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pathao Client ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7N1aMJQbWm (or mock_pathao)"
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setApiKey(e.target.value);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pathao Client Secret *
                  </label>
                  <input
                    type="password"
                    required={!currentCred?.has_secret}
                    placeholder={currentCred?.has_secret ? "Leave masked to keep existing" : "Client Secret"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant Email (Username)
                  </label>
                  <input
                    type="email"
                    placeholder="merchant@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant Password
                  </label>
                  <input
                    type="password"
                    placeholder={currentCred?.has_password ? "Leave masked to keep existing" : "Pathao merchant password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pathao Store / Hub ID
                  </label>
                  {pathaoStores.length > 0 ? (
                    <select
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="">Select Pathao Store...</option>
                      {pathaoStores.map((st) => (
                        <option key={st.store_id} value={String(st.store_id)}>
                          #{st.store_id} — {st.store_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. 12345 (click Test Connection to fetch)"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Webhook Secret (X-PATHAO-Signature)
                  </label>
                  <input
                    type="password"
                    placeholder="Secret from Pathao Developer Portal"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pathaoSandbox"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="pathaoSandbox" className="text-xs text-slate-600 dark:text-slate-400">
                  Use Pathao Sandbox API (<code className="text-[11px]">courier-api-sandbox.pathao.com</code>)
                </label>
              </div>
            </div>
          )}

          {activeTab === "ecourier" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API-KEY *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ecr_key_... (or mock_ecourier)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API-SECRET *
                  </label>
                  <input
                    type="password"
                    required={!currentCred?.has_secret}
                    placeholder={currentCred?.has_secret ? "Leave masked to keep existing" : "Enter API-SECRET"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    USER-ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M10293"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ecourierSandbox"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="ecourierSandbox" className="text-xs text-slate-600 dark:text-slate-400">
                  Use eCourier Staging Environment (<code className="text-[11px]">staging.ecourier.com.bd</code>)
                </label>
              </div>
            </div>
          )}

          {/* Default toggle */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-600 dark:text-slate-400">
              Make <span className="font-bold">{activeTab.toUpperCase()}</span> the primary default courier for 1-click dispatch
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5"
            >
              <PlugZap className={`w-3.5 h-3.5 ${testing ? "animate-pulse" : ""}`} />
              {testing ? "Testing..." : "Test Connection"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
                {saving ? "Saving..." : "Save & Activate Connector"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
