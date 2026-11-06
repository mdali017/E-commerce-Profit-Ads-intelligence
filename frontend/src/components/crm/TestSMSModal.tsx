"use client";

import { useState } from "react";
import { Send, X, CheckCircle2, AlertCircle, Phone, MessageSquare } from "lucide-react";
import { TestSendSMSPayload } from "@/types";

interface TestSMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (payload: TestSendSMSPayload) => Promise<{
    success: boolean;
    status: string;
    provider_ref?: string;
    sms_count: number;
  }>;
}

export function TestSMSModal({ isOpen, onClose, onSend }: TestSMSModalProps) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [message, setMessage] = useState(
    "ধন্যবাদ! ProfitPulse টেস্ট SMS সফলভাবে সম্পন্ন হয়েছে।"
  );
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    provider_ref?: string;
    sms_count: number;
  } | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Simple Unicode vs GSM detector for BTRC standard
  const hasUnicode = message.split("").some((char) => char.charCodeAt(0) > 127);
  const charLimit = hasUnicode ? 70 : 160;
  const parts = Math.max(1, Math.ceil(message.length / (hasUnicode ? 67 : 153)));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim() || !message.trim()) return;

    setIsSending(true);
    setError("");
    setResult(null);

    try {
      const res = await onSend({
        recipient_phone: recipientPhone.trim(),
        message: message.trim(),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to send test SMS");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Test Instant SMS Dispatch
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify gateway credentials with a test message
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

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {result && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SMS Dispatched Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                Provider Ref: {result.provider_ref} | Parts: {result.sms_count}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Recipient Phone Number (BD 11-digit)
            </label>
            <div className="relative mt-1.5">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Content
              </label>
              <span className="text-[11px] text-slate-400">
                {message.length} chars ({parts} {parts === 1 ? "part" : "parts"} • {hasUnicode ? "Unicode" : "GSM"})
              </span>
            </div>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Sending..." : "Dispatch SMS"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

