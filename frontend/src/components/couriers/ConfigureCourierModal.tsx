"use client";

import { useState, useEffect } from "react";
import { CourierProvider, CourierCredentialCreateInput, CourierCredential } from "@/types";
import { couriersApi } from "@/lib/couriers";
import { X, Check, Copy, Shield, Key, Truck, RefreshCw } from "lucide-react";

interface ConfigureCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ConfigureCourierModal({
  isOpen,
  onClose,
  onSaved,
}: ConfigureCourierModalProps) {
  const [activeTab, setActiveTab] = useState<CourierProvider>("steadfast");
  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Form State
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [storeId, setStoreId] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      couriersApi
        .getCredentials()
        .then((creds) => {
          setCredentials(creds);
          const current = creds.find((c) => c.provider === activeTab);
          if (current) {
            setApiKey(current.api_key);
            setSecretKey(current.secret_key || "");
            setStoreId(current.store_id || "");
            setIsDefault(current.is_default);
          } else {
            setApiKey("");
            setSecretKey("");
            setStoreId("");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000";
  const webhookUrl = `${baseUrl}/api/v1/couriers/webhook/${activeTab}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(webhookUrl);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload: CourierCredentialCreateInput = {
        provider: activeTab,
        api_key: apiKey.trim(),
        secret_key: secretKey.trim() || undefined,
        store_id: storeId.trim() || undefined,
        is_active: true,
        is_default: isDefault,
      };

      await couriersApi.saveCredential(payload);
      setStatusMessage(`${activeTab.toUpperCase()} Courier API connected successfully!`);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch (err: any) {
      setStatusMessage(err?.message || "Failed to save credentials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                Connect Steadfast or Pathao to automate 1-click parcel booking and tracking
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
          <button
            type="button"
            onClick={() => setActiveTab("steadfast")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === "steadfast"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Steadfast Courier
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pathao")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === "pathao"
                ? "border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Pathao Courier
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.includes("success")
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
              }`}
            >
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Webhook notification card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {activeTab === "steadfast" ? "Steadfast" : "Pathao"} Realtime Webhook Callback URL
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Paste this URL in your courier merchant portal to receive instant delivery and return notifications:
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

          {/* API Credentials Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {activeTab === "steadfast" ? "Steadfast Api-Key" : "Pathao Client ID / API Key"} *
              </label>
              <input
                type="text"
                required
                placeholder={activeTab === "steadfast" ? "e.g. stdf_api_xxxxxxx" : "e.g. pth_client_xxxxxxx"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {activeTab === "steadfast" ? "Steadfast Secret-Key" : "Pathao Client Secret"} *
              </label>
              <input
                type="password"
                required
                placeholder="Enter secret key..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {activeTab === "pathao" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pathao Store / Warehouse ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="isDefault" className="text-xs text-slate-600 dark:text-slate-400">
                Make {activeTab.toUpperCase()} the primary default courier for 1-click dispatch
              </label>
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
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving Credentials..." : "Save & Activate Connector"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

