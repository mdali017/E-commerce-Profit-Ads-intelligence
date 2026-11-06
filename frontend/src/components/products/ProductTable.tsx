"use client";

import { useState } from "react";
import { Product } from "@/types";
import {
  Search,
  Filter,
  AlertTriangle,
  History,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUpDown,
  Layers,
} from "lucide-react";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  costFilter: string;
  onCostFilterChange: (val: string) => void;
  categories: string[];
  onOpenAuditModal: (product: Product) => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export function ProductTable({
  products,
  loading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  costFilter,
  onCostFilterChange,
  categories,
  onOpenAuditModal,
  onOpenEditModal,
  onDeleteProduct,
}: ProductTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Cost status tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => onCostFilterChange("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                costFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onCostFilterChange("has_cost")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                costFilter === "has_cost"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              With Cost
            </button>
            <button
              onClick={() => onCostFilterChange("missing")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                costFilter === "missing"
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs"
                  : "text-rose-600 dark:text-rose-400 hover:text-rose-700"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Missing Cost
            </button>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-hidden"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Product</th>
              <th className="px-4 py-3.5">SKU</th>
              <th className="px-4 py-3.5">Selling Price</th>
              <th className="px-4 py-3.5">Cost Price (COGS)</th>
              <th className="px-4 py-3.5">Unit Profit</th>
              <th className="px-4 py-3.5">Gross Margin</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading products & COGS data...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  <p className="font-medium text-slate-600 dark:text-slate-300">
                    No products found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting search or click "+ Add Product" to create one.
                  </p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const hasCost = product.cost_price !== null && product.cost_price !== undefined;
                const costVal = hasCost ? Number(product.cost_price) : 0;
                const margin = product.margin_percentage !== null && product.margin_percentage !== undefined ? Number(product.margin_percentage) : null;
                const profit = product.unit_gross_profit !== null && product.unit_gross_profit !== undefined ? Number(product.unit_gross_profit) : null;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Product Name & Category */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0">
                          {product.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                            {product.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {product.category || "Uncategorized"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {product.sku ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {product.sku}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No SKU</span>
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                      ৳{Number(product.regular_price).toFixed(2)}
                    </td>

                    {/* Cost Price / Missing Warning */}
                    <td className="px-4 py-3.5">
                      {hasCost ? (
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            ৳{costVal.toFixed(2)}
                          </span>
                          {(Number(product.packaging_cost) > 0 || Number(product.handling_cost) > 0) && (
                            <span className="text-[10px] text-slate-400 block">
                              +৳{(Number(product.packaging_cost) + Number(product.handling_cost)).toFixed(2)} pkg
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenAuditModal(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-[11px] hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          Set Cost
                        </button>
                      )}
                    </td>

                    {/* Unit Profit */}
                    <td className="px-4 py-3.5">
                      {profit !== null ? (
                        <span
                          className={`font-semibold ${
                            profit >= 0
                              ? "text-slate-900 dark:text-white"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          ৳{profit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Gross Margin % */}
                    <td className="px-4 py-3.5">
                      {margin !== null ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            margin >= 40
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                              : margin >= 20
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                          }`}
                        >
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Needs cost</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAuditModal(product)}
                          title="Cost Audit & History"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenEditModal(product)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

