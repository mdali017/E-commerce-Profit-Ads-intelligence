"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Product, CostCoverageStats, ProductCreateInput, BulkCostItem, BulkCostUploadResult } from "@/types";
import { productsApi } from "@/lib/products";
import { ProductStats } from "@/components/products/ProductStats";
import { ProductTable } from "@/components/products/ProductTable";
import { AddProductModal } from "@/components/products/AddProductModal";
import { CostAuditModal } from "@/components/products/CostAuditModal";
import { BulkUploadModal } from "@/components/products/BulkUploadModal";
import { Plus, UploadCloud, RefreshCw, AlertCircle } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<CostCoverageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [costFilter, setCostFilter] = useState("all"); // 'all' | 'has_cost' | 'missing'

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [auditProduct, setAuditProduct] = useState<Product | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let hasCostParam: boolean | undefined = undefined;
      if (costFilter === "has_cost") hasCostParam = true;
      if (costFilter === "missing") hasCostParam = false;

      const [prodsData, statsData] = await Promise.all([
        productsApi.getProducts({
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
          has_cost: hasCostParam,
        }),
        productsApi.getCostCoverageStats(),
      ]);

      setProducts(prodsData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Failed to load products data:", err);
      setError(err?.message || "Failed to load products. Make sure backend is running and workspace is selected.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, costFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Handlers
  const handleCreateOrUpdateProduct = async (data: ProductCreateInput) => {
    if (editingProduct) {
      await productsApi.updateProduct(editingProduct.id, data);
    } else {
      await productsApi.createProduct(data);
    }
    await loadData();
  };

  const handleUpdateCost = async (productId: string, newCost: number, reason: string) => {
    await productsApi.updateCostPrice(productId, {
      new_cost_price: newCost,
      reason,
    });
    await loadData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }
    try {
      await productsApi.deleteProduct(productId);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete product.");
    }
  };

  const handleBulkUpload = async (items: BulkCostItem[]): Promise<BulkCostUploadResult> => {
    return await productsApi.bulkUploadCosts(items);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Product Catalog & Cost (COGS) Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track unit cost prices, packaging overheads, profit margins, and audit cost history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            title="Refresh Catalog"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-blue-500" />
            Bulk CSV Upload
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 font-semibold text-[11px] hover:bg-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Cost Coverage & Health KPI Cards */}
      <ProductStats
        stats={stats}
        selectedFilter={costFilter}
        onFilterMissingCost={() => {
          setCostFilter(costFilter === "missing" ? "all" : "missing");
        }}
      />

      {/* 2. Responsive Product Table */}
      <ProductTable
        products={products}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        costFilter={costFilter}
        onCostFilterChange={setCostFilter}
        categories={categories}
        onOpenAuditModal={(prod) => setAuditProduct(prod)}
        onOpenEditModal={(prod) => {
          setEditingProduct(prod);
          setIsAddModalOpen(true);
        }}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrUpdateProduct}
        editProduct={editingProduct}
      />

      {/* Cost Audit & History Modal */}
      <CostAuditModal
        isOpen={!!auditProduct}
        onClose={() => setAuditProduct(null)}
        product={auditProduct}
        onUpdateCost={handleUpdateCost}
      />

      {/* Bulk CSV Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onUpload={handleBulkUpload}
        onSuccessRefresh={() => loadData()}
      />
    </div>
  );
}
