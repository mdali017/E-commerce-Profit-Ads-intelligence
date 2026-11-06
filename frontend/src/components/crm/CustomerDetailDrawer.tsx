"use client";

import { useState } from "react";
import { CustomerDetail } from "@/types";
import {
  X,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  FileText,
  DollarSign,
} from "lucide-react";

interface CustomerDetailDrawerProps {
  customer: CustomerDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTags?: (customerId: string, tags: string[], notes: string) => Promise<void>;
}

export function CustomerDetailDrawer({
  customer,
  isOpen,
  onClose,
  onUpdateTags,
}: CustomerDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "sms" | "notes">("orders");
  const [notes, setNotes] = useState(customer?.notes || "");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(customer?.tags || []);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !customer) return null;

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveNotes = async () => {
    if (!onUpdateTags) return;
    setIsSaving(true);
    try {
      await onUpdateTags(customer.id, tags, notes);
    } catch (err: any) {
      alert(err.message || "Failed to update customer");
    } finally {
      setIsSaving(false);
    }
  };

  const isHighRisk = customer.return_risk_score >= 30;
  const isModerateRisk = customer.return_risk_score >= 15 && customer.return_risk_score < 30;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-lg flex items-center justify-center">
              {customer.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {customer.name}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                    customer.segment === "vip"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : customer.segment === "repeat"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : customer.segment === "at_risk"
                      ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {customer.segment}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {customer.phone}
                </span>
                {customer.city && (
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {customer.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Risk Alert Banner */}
          {isHighRisk && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  High Return Risk Customer ({customer.return_risk_score}%)
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                  This customer has returned {customer.returned_orders} out of {customer.total_orders} orders. We advise collecting partial advance or delivery charge before dispatching.
                </p>
              </div>
            </div>
          )}

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Lifetime Value (LTV)
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ৳{Number(customer.total_spent).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Delivered / Total
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {customer.delivered_orders} / {customer.total_orders}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Return Risk Score
              </span>
              <p
                className={`text-lg font-bold mt-1 ${
                  isHighRisk
                    ? "text-rose-600 dark:text-rose-400"
                    : isModerateRisk
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {customer.return_risk_score}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Avg Order Value
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ৳
                {customer.delivered_orders > 0
                  ? Math.round(Number(customer.total_spent) / customer.delivered_orders).toLocaleString()
                  : 0}
              </p>
            </div>
          </div>

          {/* Tags Manager */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tags & Intelligence Labels
            </span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="+ Add custom tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {newTag && (
                  <button
                    onClick={handleAddTag}
                    className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === "orders"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Purchase History ({customer.recent_orders?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("sms")}
              className={`pb-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === "sms"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>SMS Dispatches ({customer.message_history?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
                activeTab === "notes"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Customer Notes</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {customer.recent_orders && customer.recent_orders.length > 0 ? (
                customer.recent_orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          #{ord.order_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            ord.status === "delivered"
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                              : ord.status === "returned"
                              ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-3">
                        <span>{new Date(ord.order_date || ord.created_at || "").toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{ord.payment_method || "COD"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        ৳{Number(ord.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No orders recorded yet.
                </div>
              )}
            </div>
          )}

          {activeTab === "sms" && (
            <div className="space-y-3">
              {customer.message_history && customer.message_history.length > 0 ? (
                customer.message_history.map((sms) => (
                  <div
                    key={sms.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          {(sms.trigger_event || "manual").replace("_", " ")}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full uppercase font-bold ${
                            sms.status === "delivered"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : sms.status === "sent"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {sms.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(sms.sent_at || sms.created_at || "").toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                      {sms.message_body || sms.message}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Gateway: {sms.provider.toUpperCase()}</span>
                      <span>Parts: {sms.sms_count} • Cost: ৳{sms.cost ?? sms.cost_bdt ?? 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No SMS dispatches recorded for this customer.
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Staff Internal Notes
                </label>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record customer preferences, delivery remarks, or special instructions..."
                  className="w-full mt-1.5 p-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving Notes & Tags..." : "Save Notes & Tags"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
