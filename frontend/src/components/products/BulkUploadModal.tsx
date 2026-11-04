"use client";

import { useState, useRef } from "react";
import { BulkCostItem, BulkCostUploadResult } from "@/types";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (items: BulkCostItem[]) => Promise<BulkCostUploadResult>;
  onSuccessRefresh: () => void;
}

export function BulkUploadModal({
  isOpen,
  onClose,
  onUpload,
  onSuccessRefresh,
}: BulkUploadModalProps) {
  const [parsedItems, setParsedItems] = useState<BulkCostItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCostUploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      "sku,cost_price,packaging_cost,handling_cost,reason\n" +
      "POLO-BLK-M,450.00,30.00,10.00,Initial batch\n" +
      "WATCH-ULTRA,1200.00,45.00,15.00,Supplier import\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cost_price_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setError("The CSV file must contain a header row and at least one data row.");
          return;
        }

        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

        const skuIdx = headers.findIndex((h) => h === "sku" || h === "product_sku");
        const costIdx = headers.findIndex(
          (h) => h === "cost_price" || h === "cost" || h === "cogs" || h === "unit_cost"
        );
        const pkgIdx = headers.findIndex(
          (h) => h === "packaging_cost" || h === "packaging"
        );
        const hndIdx = headers.findIndex(
          (h) => h === "handling_cost" || h === "handling"
        );
        const rsnIdx = headers.findIndex((h) => h === "reason" || h === "note");

        if (skuIdx === -1 || costIdx === -1) {
          setError(
            "CSV must contain at least 'sku' and 'cost_price' columns. Download the template for the exact format."
          );
          return;
        }

        const items: BulkCostItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",").map((c) => c.trim().replace(/['"]/g, ""));
          const sku = row[skuIdx];
          const costVal = parseFloat(row[costIdx]);

          if (sku && !isNaN(costVal) && costVal > 0) {
            items.push({
              sku: sku.trim(),
              cost_price: costVal,
              packaging_cost: pkgIdx !== -1 && !isNaN(parseFloat(row[pkgIdx])) ? parseFloat(row[pkgIdx]) : undefined,
              handling_cost: hndIdx !== -1 && !isNaN(parseFloat(row[hndIdx])) ? parseFloat(row[hndIdx]) : undefined,
              reason: rsnIdx !== -1 && row[rsnIdx] ? row[rsnIdx] : "CSV bulk upload",
            });
          }
        }

        if (items.length === 0) {
          setError("No valid product cost rows found in this file.");
          return;
        }

        setParsedItems(items);
      } catch (err) {
        setError("Failed to parse CSV file. Please check format.");
      }
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async () => {
    if (parsedItems.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await onUpload(parsedItems);
      setResult(res);
      onSuccessRefresh();
    } catch (err: any) {
      setError(err?.message || "Failed to upload product costs.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParsedItems([]);
    setFileName(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Cost (COGS) CSV Upload
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update cost prices and packaging for multiple SKUs at once.
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
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results State */}
          {result && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upload Result
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Processed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {result.updated_count}
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Products/Variants Updated
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {result.failed_count}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unmatched / Failed
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-2 text-xs space-y-1">
                  <span className="font-semibold text-rose-600">Unmatched SKUs:</span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                      >
                        • {err.sku}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Upload Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Upload Area (If no results yet) */}
          {!result && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Need the right format?
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>
              </div>

              {parsedItems.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Click to select CSV file
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports .csv with columns: sku, cost_price, packaging_cost, handling_cost
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      File: {fileName} ({parsedItems.length} valid rows found)
                    </span>
                    <button
                      onClick={handleReset}
                      className="text-rose-600 hover:underline"
                    >
                      Clear & reselect
                    </button>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        <tr>
                          <th className="px-3 py-2">SKU</th>
                          <th className="px-3 py-2">Cost Price (৳)</th>
                          <th className="px-3 py-2">Packaging (৳)</th>
                          <th className="px-3 py-2">Handling (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedItems.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-3 py-1.5 font-mono text-slate-900 dark:text-white">
                              {row.sku}
                            </td>
                            <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-white">
                              ৳{row.cost_price.toFixed(2)}
                            </td>
                            <td className="px-3 py-1.5 text-slate-500">
                              {row.packaging_cost !== undefined ? `৳${row.packaging_cost.toFixed(2)}` : "-"}
                            </td>
                            <td className="px-3 py-1.5 text-slate-500">
                              {row.handling_cost !== undefined ? `৳${row.handling_cost.toFixed(2)}` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedItems.length > 10 && (
                    <p className="text-[11px] text-slate-400 italic text-right">
                      Showing first 10 of {parsedItems.length} rows...
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadSubmit}
                      disabled={loading}
                      className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {loading ? "Processing..." : `Import & Apply ${parsedItems.length} Costs`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
