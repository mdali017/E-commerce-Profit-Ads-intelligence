"use client";

import { useState } from "react";
import { SMSProvider, ConfigureSMSGatewayPayload, SMSGateway } from "@/types";
import { X, Server, Key, Send, ShieldCheck, CheckCircle2 } from "lucide-react";

interface SMSGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateway: SMSGateway | null;
  onSave: (payload: ConfigureSMSGatewayPayload) => Promise<void>;
}

export function SMSGatewayModal({
  isOpen,
  onClose,
  gateway,
  onSave,
}: SMSGatewayModalProps) {
  const [provider, setProvider] = useState<SMSProvider>(
    (gateway?.provider as SMSProvider) || "simulated"
  );
  const [apiKey, setApiKey] = useState(gateway?.api_key || "");
  const [senderId, setSenderId] = useState(gateway?.sender_id || "");
  const [baseUrl, setBaseUrl] = useState(gateway?.base_url || "");
  const [isActive, setIsActive] = useState(gateway?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await onSave({
        provider,
        api_key: apiKey,
        sender_id: senderId || "PROFITPULSE",
        base_url: baseUrl || undefined,
        is_active: isActive,
      });
      setSuccessMsg("SMS Gateway credentials configured successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Failed to configure SMS gateway");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bangladeshi SMS Gateway Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect Elitbuzz, Greenweb, SSL Wireless or Sandbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gateway Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as SMSProvider)}
              className="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="simulated">Simulated BD Gateway (Free Testing & Sandbox)</option>
              <option value="elitbuzz">Elitbuzz Technologies (BD Masking / Non-Masking)</option>
              <option value="greenweb">Greenweb SMS Gateway</option>
              <option value="ssl_wireless">SSL Wireless SMS Engine</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              API Key / Auth Token
            </label>
            <div className="relative mt-1.5">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required={provider !== "simulated"}
                placeholder={provider === "simulated" ? "Optional for simulation" : "Enter SMS gateway API Key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Approved Sender ID (Masking)
            </label>
            <input
              type="text"
              placeholder="e.g. 8809612..., BRANDNAME"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Custom Gateway API Endpoint (Optional)
            </label>
            <input
              type="url"
              placeholder="https://api.elitbuzz-bd.com/smsapi"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="is_active" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Enable this gateway for automated and manual dispatches
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Connecting..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
