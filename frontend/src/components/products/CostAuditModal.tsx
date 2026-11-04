"use client";

import { useState } from "react";
import { Product } from "@/types";
import { X, History, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

interface CostAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdateCost: (productId: string, newCost: number, reason: string) => Promise<void>;
}

export function CostAuditModal({
  isOpen,
  onClose,
  product,
  onUpdateCost,
}: CostAuditModalProps) {
  const [newCost, setNewCost] = useState<string>("");
  const [reason, setReason] = useState<string>("Supplier shipment batch update");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentCost = product.cost_price ? Number(product.cost_price) : null;
  const numNewCost = parseFloat(newCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numNewCost) || numNewCost <= 0) {
      setError("Please enter a valid cost price greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onUpdateCost(product.id, numNewCost, reason.trim() || "Cost audit update");
      setNewCost("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update cost price.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cost Price Audit & History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {product.name} {product.sku ? `(${product.sku})` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs New Cost Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                <span>Current Cost: {currentCost !== null ? `৳${currentCost.toFixed(2)}` : "Missing (Not Set)"}</span>
                <span className="text-slate-400">Regular: ৳{Number(product.regular_price).toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Cost Price (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder={currentCost ? currentCost.toFixed(2) : "450.00"}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Audit Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Supplier batch #10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Margin preview with new cost */}
              {numNewCost > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">New Unit Profit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ৳{(Number(product.regular_price) - (numNewCost + Number(product.packaging_cost) + Number(product.handling_cost))).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {loading ? "Updating..." : "Update Cost Price"}
              </button>
            </div>
          </form>

          {/* Cost Audit History Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Audit Log Timeline
            </h3>

            {product.cost_history && product.cost_history.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {product.cost_history.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 line-through">
                          {record.old_cost_price !== null ? `৳${Number(record.old_cost_price).toFixed(2)}` : "None"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          ৳{Number(record.new_cost_price).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {record.reason || "Cost price adjustment"}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(record.effective_from).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No historical cost adjustments logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
