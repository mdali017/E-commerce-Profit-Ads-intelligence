"use client";

import { useState, useEffect } from "react";
import { Product, ProductCreateInput } from "@/types";
import { X, Calculator, AlertCircle, CheckCircle2 } from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductCreateInput) => Promise<void>;
  editProduct?: Product | null;
}

export function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  editProduct,
}: AddProductModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [regularPrice, setRegularPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [packagingCost, setPackagingCost] = useState<string>("0");
  const [handlingCost, setHandlingCost] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name || "");
      setSku(editProduct.sku || "");
      setCategory(editProduct.category || "");
      setDescription(editProduct.description || "");
      setRegularPrice(String(editProduct.regular_price || ""));
      setCostPrice(editProduct.cost_price !== null && editProduct.cost_price !== undefined ? String(editProduct.cost_price) : "");
      setPackagingCost(String(editProduct.packaging_cost ?? "0"));
      setHandlingCost(String(editProduct.handling_cost ?? "0"));
      setIsActive(editProduct.is_active ?? true);
    } else {
      setName("");
      setSku("");
      setCategory("");
      setDescription("");
      setRegularPrice("");
      setCostPrice("");
      setPackagingCost("0");
      setHandlingCost("0");
      setIsActive(true);
    }
    setError(null);
  }, [editProduct, isOpen]);

  if (!isOpen) return null;

  // Live Gross Margin Calculator
  const numSelling = parseFloat(regularPrice) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const numPackaging = parseFloat(packagingCost) || 0;
  const numHandling = parseFloat(handlingCost) || 0;
  const hasCostInput = costPrice.trim() !== "" && !isNaN(numCost);

  const totalUnitCost = numCost + numPackaging + numHandling;
  const unitProfit = numSelling - totalUnitCost;
  const marginPct = numSelling > 0 ? (unitProfit / numSelling) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (numSelling <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        regular_price: numSelling,
        cost_price: hasCostInput ? numCost : null,
        packaging_cost: numPackaging,
        handling_cost: numHandling,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure product details, selling price, and unit costs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Cotton Polo Shirt"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. POLO-BLK-01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Apparel, Electronics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pricing & Cost Structure */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Unit Economics & Pricing (BDT)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Selling Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-medium">Tk</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    placeholder="990.00"
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Cost (COGS)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-medium">Tk</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="450.00"
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Packaging
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-medium">Tk</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                    placeholder="30.00"
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Handling
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-medium">Tk</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={handlingCost}
                    onChange={(e) => setHandlingCost(e.target.value)}
                    placeholder="10.00"
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Gross Profit / Margin Preview Calculator */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                <Calculator className="w-3.5 h-3.5 text-blue-500" />
                Live Margin Preview
              </div>

              {hasCostInput && numSelling > 0 ? (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Unit Gross Profit</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      ৳{unitProfit.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Unit Cost</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      ৳{totalUnitCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Gross Margin %</span>
                    <span
                      className={`text-base font-bold px-2 py-0.5 rounded-lg inline-block ${
                        marginPct >= 40
                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50"
                          : marginPct >= 20
                          ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50"
                          : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50"
                      }`}
                    >
                      {marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Enter Selling Price and Cost Price to preview live unit profit & margin.</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product summary or notes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {loading ? "Saving..." : editProduct ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

