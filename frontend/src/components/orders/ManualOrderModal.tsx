"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Product,
  OrderCreateInput,
  OrderItemCreateInput,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
  AttributionConfidence,
} from "@/types";
import { productsApi } from "@/lib/products";
import {
  X,
  Plus,
  Trash2,
  Phone,
  User,
  MapPin,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderCreateInput) => Promise<void>;
}

interface ItemRow {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCostPrice: number | null;
  unitPackagingCost: number;
  unitHandlingCost: number;
}

const DELIVERY_ZONES = [
  { label: "Inside Dhaka (৳60)", city: "Dhaka", fee: 60 },
  { label: "Outside Dhaka (৳120)", city: "Outside Dhaka", fee: 120 },
  { label: "Sub-Dhaka / Express (৳100)", city: "Gazipur/Narayanganj", fee: 100 },
  { label: "Free Delivery (৳0)", city: "Dhaka", fee: 0 },
];

export function ManualOrderModal({
  isOpen,
  onClose,
  onSubmit,
}: ManualOrderModalProps) {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("Dhaka");
  const [shippingFee, setShippingFee] = useState<number>(60);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [source, setSource] = useState<OrderSource>("facebook");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Line Items
  const [items, setItems] = useState<ItemRow[]>([
    {
      productId: "",
      variantId: "",
      productName: "",
      variantName: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
      unitCostPrice: null,
      unitPackagingCost: 0,
      unitHandlingCost: 0,
    },
  ]);

  // Collapsible Marketing Attribution
  const [showAttribution, setShowAttribution] = useState(false);
  const [utmSource, setUtmSource] = useState("facebook");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [fbclid, setFbclid] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load catalog products for quick dropdown selection
  useEffect(() => {
    if (isOpen) {
      setLoadingCatalog(true);
      productsApi
        .getProducts({ is_active: true, limit: 100 })
        .then((prods) => {
          setCatalogProducts(prods);
        })
        .catch((err) => {
          console.error("Failed to load products for manual order:", err);
        })
        .finally(() => setLoadingCatalog(false));
    }
  }, [isOpen]);

  // BD Phone validation: 11 digits starting with 01[3-9]
  const isValidPhone = useMemo(() => {
    const clean = customerPhone.replace(/\D/g, "");
    return /^01[3-9]\d{8}$/.test(clean);
  }, [customerPhone]);

  // Handle product selection in item row
  const handleProductSelect = (index: number, productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: prod.id,
        variantId: "",
        productName: prod.name,
        variantName: "",
        sku: prod.sku || "",
        unitPrice: Number(prod.regular_price),
        unitCostPrice: prod.cost_price !== null ? Number(prod.cost_price) : null,
        unitPackagingCost: Number(prod.packaging_cost || 0),
        unitHandlingCost: Number(prod.handling_cost || 0),
      };
      return next;
    });
  };

  // Handle variant selection
  const handleVariantSelect = (index: number, variantId: string) => {
    const item = items[index];
    const prod = catalogProducts.find((p) => p.id === item.productId);
    if (!prod || !prod.variants) return;

    const variant = prod.variants.find((v) => v.id === variantId);
    if (!variant) return;

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku || next[index].sku,
        unitPrice: variant.price !== null ? Number(variant.price) : next[index].unitPrice,
        unitCostPrice:
          variant.cost_price !== null
            ? Number(variant.cost_price)
            : next[index].unitCostPrice,
      };
      return next;
    });
  };

  const handleItemChange = (index: number, field: keyof ItemRow, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        variantId: "",
        productName: "",
        variantName: "",
        sku: "",
        quantity: 1,
        unitPrice: 0,
        unitCostPrice: null,
        unitPackagingCost: 0,
        unitHandlingCost: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Live Financial Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.unitPrice || 0) * (it.quantity || 1), 0);
  }, [items]);

  const totalPayable = useMemo(() => {
    const total = subtotal + (Number(shippingFee) || 0) - (Number(discountAmount) || 0);
    return Math.max(0, total);
  }, [subtotal, shippingFee, discountAmount]);

  const totalCOGS = useMemo(() => {
    return items.reduce((acc, it) => {
      const cogs = it.unitCostPrice !== null ? Number(it.unitCostPrice) : 0;
      const packaging = Number(it.unitPackagingCost) || 0;
      const handling = Number(it.unitHandlingCost) || 0;
      return acc + (cogs + packaging + handling) * (it.quantity || 1);
    }, 0);
  }, [items]);

  const estimatedGrossProfit = useMemo(() => {
    return totalPayable - totalCOGS;
  }, [totalPayable, totalCOGS]);

  const hasMissingCOGS = useMemo(() => {
    return items.some((it) => it.unitCostPrice === null);
  }, [items]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Customer phone number is required.");
      return;
    }
    if (!shippingAddress.trim()) {
      setError("Delivery address is required.");
      return;
    }

    const validItems = items.filter((it) => it.productName.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      setError("Please add at least one product with name and quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const orderItems: OrderItemCreateInput[] = validItems.map((it) => ({
        product_id: it.productId || null,
        variant_id: it.variantId || null,
        product_name: it.productName,
        variant_name: it.variantName || null,
        sku: it.sku || null,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        unit_cost_price: it.unitCostPrice,
        unit_packaging_cost: it.unitPackagingCost,
        unit_handling_cost: it.unitHandlingCost,
      }));

      const payload: OrderCreateInput = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        shipping_fee: Number(shippingFee) || 0,
        discount_amount: Number(discountAmount) || 0,
        source,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "pending" : "paid",
        customer_notes: customerNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        items: orderItems,
        attribution:
          showAttribution && (utmSource || utmCampaign || fbclid)
            ? {
                utm_source: utmSource || null,
                utm_campaign: utmCampaign || null,
                fbclid: fbclid || null,
                attribution_confidence: "fcommerce_manual" as AttributionConfidence,
              }
            : null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error("Order creation failed:", err);
      setError(err?.message || "Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                F-Commerce Quick Order Entry
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                  Manual Ingestion
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log Facebook page, Messenger, WhatsApp, or phone call orders in &lt; 15 seconds.
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer & Delivery Info */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Customer & Delivery Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Phone with BD Auto-Validation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full text-sm px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden transition-all ${
                      customerPhone && !isValidPhone
                        ? "border-amber-400 focus:border-amber-500"
                        : "border-slate-300 dark:border-slate-700 focus:border-blue-500"
                    }`}
                  />
                  {customerPhone && (
                    <span
                      className={`absolute right-2.5 top-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isValidPhone
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {isValidPhone ? "Valid BD" : "11 Digits"}
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Delivery Zone Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Zone & Fee
                </label>
                <select
                  onChange={(e) => {
                    const zone = DELIVERY_ZONES[Number(e.target.value)];
                    if (zone) {
                      setShippingFee(zone.fee);
                      setShippingCity(zone.city);
                    }
                  }}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                >
                  {DELIVERY_ZONES.map((zone, idx) => (
                    <option key={idx} value={idx}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Delivery Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="House #, Road #, Area, Thana / District"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Order Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as OrderSource)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="facebook">Facebook Page</option>
                  <option value="messenger">Messenger</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="manual">Manual Walk-in</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Order Items (Products from Catalog) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((row, idx) => {
                const selectedProd = catalogProducts.find((p) => p.id === row.productId);
                const variants = selectedProd?.variants || [];

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2.5 items-center"
                  >
                    {/* Catalog Product Select */}
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Product
                      </label>
                      <select
                        value={row.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                      >
                        <option value="">Select from catalog...</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (৳{p.regular_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant (if exists) */}
                    {variants.length > 0 ? (
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          Variant
                        </label>
                        <select
                          value={row.variantId}
                          onChange={(e) => handleVariantSelect(idx, e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                        >
                          <option value="">Choose variant...</option>
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          SKU / Item Name
                        </label>
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={row.productName}
                          onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden text-center font-bold"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Unit Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={row.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden font-bold"
                      />
                    </div>

                    {/* Remove Action */}
                    <div className="col-span-12 sm:col-span-1 flex justify-end sm:pt-4">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Financial Summary & Live Profit Preview */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Fees & Adjustments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-white">৳{subtotal.toFixed(0)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Shipping / Delivery Fee:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                      className="w-20 text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-right font-bold focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Special Discount:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-20 text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-right font-bold focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-200">Total Customer Payable:</span>
                  <span className="text-xl font-extrabold text-blue-400">
                    ৳{totalPayable.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Right Column: Live Gross Profit Engine */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      Live Profit Locking Engine
                    </span>
                    {hasMissingCOGS && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                        COGS missing in catalog
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Estimated net cash margin after catalog product procurement, packaging, and handling costs.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Estimated Gross Profit:</span>
                    <div className="text-2xl font-black text-emerald-400">
                      ৳{estimatedGrossProfit.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Total COGS:</span>
                    <div className="text-sm font-bold text-slate-300">
                      ৳{totalCOGS.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Marketing Attribution & Notes (Collapsible) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAttribution(!showAttribution)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>Optional: Marketing Attribution & Order Notes</span>
              {showAttribution ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAttribution && (
              <div className="p-4 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      UTM Source
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. facebook / instagram"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Campaign Name / ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Eid_Special_Offer"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      FB Click ID (fbclid)
                    </label>
                    <input
                      type="text"
                      placeholder="Optional fbclid"
                      value={fbclid}
                      onChange={(e) => setFbclid(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Customer Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Call before delivery, delivery after 3 PM"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Internal Call-Center Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Customer verified via phone call, agreed to COD"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? "Creating Order..." : "Confirm & Save Order (৳" + totalPayable.toFixed(0) + ")"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

