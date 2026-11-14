"use client";

import { useState, useEffect, useRef } from "react";
import {
  Order,
  CourierProvider,
  CourierCredential,
  PathaoCity,
  PathaoZone,
  PathaoArea,
  PathaoPriceEstimate,
  ECourierLocationItem,
  ECourierPackage,
  BulkDispatchResponse,
} from "@/types";
import { couriersApi } from "@/lib/couriers";
import { FraudCheckBadge } from "@/components/couriers/FraudCheckBadge";
import {
  X,
  Truck,
  Send,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react";

interface DispatchOrderModalProps {
  isOpen: boolean;
  orders: Order[];
  onClose: () => void;
  onDispatched: () => void;
}

export function DispatchOrderModal({
  isOpen,
  orders,
  onClose,
  onDispatched,
}: DispatchOrderModalProps) {
  const isBulk = orders.length > 1;
  const primaryOrder = orders[0] || null;

  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [provider, setProvider] = useState<CourierProvider>("steadfast");
  const userPickedProviderRef = useRef(false);
  const [codAmount, setCodAmount] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [weight, setWeight] = useState<string>("0.5");
  const [deliveryType, setDeliveryType] = useState<number>(48);

  // Pathao Locations & Price
  const [pathaoCities, setPathaoCities] = useState<PathaoCity[]>([]);
  const [pathaoZones, setPathaoZones] = useState<PathaoZone[]>([]);
  const [pathaoAreas, setPathaoAreas] = useState<PathaoArea[]>([]);
  const [cityId, setCityId] = useState<number | "">("");
  const [zoneId, setZoneId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [priceEstimate, setPriceEstimate] = useState<PathaoPriceEstimate | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // eCourier Locations & Packages
  const [ecCities, setEcCities] = useState<ECourierLocationItem[]>([]);
  const [ecThanas, setEcThanas] = useState<ECourierLocationItem[]>([]);
  const [ecPostcodes, setEcPostcodes] = useState<ECourierLocationItem[]>([]);
  const [ecAreas, setEcAreas] = useState<ECourierLocationItem[]>([]);
  const [ecPackages, setEcPackages] = useState<ECourierPackage[]>([]);
  const [ecCity, setEcCity] = useState<string>("Dhaka");
  const [ecThana, setEcThana] = useState<string>("");
  const [ecPostcode, setEcPostcode] = useState<string>("");
  const [ecArea, setEcArea] = useState<string>("");
  const [ecPackageCode, setEcPackageCode] = useState<string>("PKG-DHAKA-REG");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkDispatchResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    userPickedProviderRef.current = false;
    setError(null);
    setBulkResult(null);
    setPriceEstimate(null);
    if (primaryOrder) {
      setCodAmount(String(primaryOrder.total_amount || 0));
      setNotes(primaryOrder.internal_notes || primaryOrder.customer_notes || "");
    }
    couriersApi
      .getCredentials()
      .then((creds) => {
        if (!active) return;
        setCredentials(creds);
        const def = creds.find((c) => c.is_default && c.is_active);
        if (
          !userPickedProviderRef.current &&
          def &&
          (def.provider === "steadfast" || def.provider === "pathao" || def.provider === "ecourier")
        ) {
          setProvider(def.provider);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, primaryOrder?.id]);

  // Load Pathao cities when Pathao selected
  useEffect(() => {
    if (!isOpen || provider !== "pathao" || isBulk) return;
    couriersApi
      .getPathaoCities()
      .then((cities) => {
        setPathaoCities(cities);
        if (cities.length > 0 && !cityId) {
          const matched = cities.find(
            (c) => primaryOrder?.shipping_city && c.city_name.toLowerCase().includes(primaryOrder.shipping_city.toLowerCase())
          );
          setCityId((matched || cities[0]).city_id);
        }
      })
      .catch(() => {});
  }, [isOpen, provider, isBulk]);

  useEffect(() => {
    if (!isOpen || provider !== "pathao" || !cityId || isBulk) return;
    setZoneId("");
    setAreaId("");
    setPathaoAreas([]);
    couriersApi
      .getPathaoZones(Number(cityId))
      .then((zones) => {
        setPathaoZones(zones);
        if (zones.length > 0) setZoneId(zones[0].zone_id);
      })
      .catch(() => {});
  }, [cityId, provider, isOpen, isBulk]);

  useEffect(() => {
    if (!isOpen || provider !== "pathao" || !zoneId || isBulk) return;
    setAreaId("");
    couriersApi
      .getPathaoAreas(Number(zoneId))
      .then((areas) => {
        setPathaoAreas(areas);
        if (areas.length > 0) setAreaId(areas[0].area_id);
      })
      .catch(() => {});
  }, [zoneId, provider, isOpen, isBulk]);

  // Auto-calculate Pathao Price when city & zone selected
  useEffect(() => {
    if (!isOpen || provider !== "pathao" || !cityId || !zoneId || isBulk) return;
    setLoadingPrice(true);
    couriersApi
      .calculatePathaoPrice({
        recipient_city: Number(cityId),
        recipient_zone: Number(zoneId),
        delivery_type: deliveryType,
        item_weight: Number(weight) || 0.5,
      })
      .then(setPriceEstimate)
      .catch(() => setPriceEstimate(null))
      .finally(() => setLoadingPrice(false));
  }, [cityId, zoneId, deliveryType, weight, provider, isOpen, isBulk]);

  // Load eCourier cities & packages
  useEffect(() => {
    if (!isOpen || provider !== "ecourier" || isBulk) return;
    Promise.all([couriersApi.getECourierCities(), couriersApi.getECourierPackages()])
      .then(([cities, pkgs]) => {
        setEcCities(cities);
        setEcPackages(pkgs);
        if (pkgs.length > 0) setEcPackageCode(pkgs[0].package_code);
        if (cities.length > 0) {
          const matched = cities.find(
            (c) => primaryOrder?.shipping_city && c.name.toLowerCase().includes(primaryOrder.shipping_city.toLowerCase())
          );
          setEcCity((matched || cities[0]).name);
        }
      })
      .catch(() => {});
  }, [isOpen, provider, isBulk]);

  useEffect(() => {
    if (!isOpen || provider !== "ecourier" || !ecCity || isBulk) return;
    couriersApi
      .getECourierThanas(ecCity)
      .then((thanas) => {
        setEcThanas(thanas);
        if (thanas.length > 0) setEcThana(thanas[0].name);
      })
      .catch(() => {});
  }, [ecCity, provider, isOpen, isBulk]);

  useEffect(() => {
    if (!isOpen || provider !== "ecourier" || !ecCity || !ecThana || isBulk) return;
    couriersApi
      .getECourierPostcodes(ecCity, ecThana)
      .then((pcs) => {
        setEcPostcodes(pcs);
        if (pcs.length > 0) setEcPostcode(pcs[0].name);
      })
      .catch(() => {});
  }, [ecCity, ecThana, provider, isOpen, isBulk]);

  useEffect(() => {
    if (!isOpen || provider !== "ecourier" || !ecPostcode || isBulk) return;
    couriersApi
      .getECourierAreas(ecPostcode, ecCity, ecThana)
      .then((areas) => {
        setEcAreas(areas);
        if (areas.length > 0) setEcArea(areas[0].name);
      })
      .catch(() => {});
  }, [ecPostcode, provider, isOpen, isBulk]);

  if (!isOpen || orders.length === 0) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isBulk) {
        const res = await couriersApi.bulkDispatchOrders({
          order_ids: orders.map((o) => o.id),
          provider,
          notes: notes.trim() || undefined,
          delivery_type: deliveryType,
          item_weight: Number(weight) || 0.5,
        });
        setBulkResult(res);
        onDispatched();
      } else if (primaryOrder) {
        const selectedCityName =
          provider === "pathao"
            ? pathaoCities.find((c) => c.city_id === Number(cityId))?.city_name
            : provider === "ecourier"
            ? ecCity
            : primaryOrder.shipping_city || "Dhaka";

        const selectedZoneName =
          provider === "pathao"
            ? pathaoZones.find((z) => z.zone_id === Number(zoneId))?.zone_name
            : provider === "ecourier"
            ? ecThana
            : undefined;

        const selectedAreaName =
          provider === "pathao"
            ? pathaoAreas.find((a) => a.area_id === Number(areaId))?.area_name
            : provider === "ecourier"
            ? ecArea
            : undefined;

        await couriersApi.dispatchOrder({
          order_id: primaryOrder.id,
          provider,
          custom_cod_amount: Number(codAmount),
          notes: notes.trim() || undefined,
          recipient_city: selectedCityName || undefined,
          recipient_zone: selectedZoneName,
          recipient_area: selectedAreaName,
          recipient_postcode: provider === "ecourier" ? ecPostcode : undefined,
          city_id: provider === "pathao" && cityId ? Number(cityId) : undefined,
          zone_id: provider === "pathao" && zoneId ? Number(zoneId) : undefined,
          area_id: provider === "pathao" && areaId ? Number(areaId) : undefined,
          item_weight: Number(weight) || 0.5,
          delivery_type: deliveryType,
          package_code: provider === "ecourier" ? ecPackageCode : undefined,
          payment_method: primaryOrder.payment_method === "cod" ? "COD" : "MPAY",
        });
        onDispatched();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch parcel to courier.");
    } finally {
      setSubmitting(false);
    }
  };

  const providersList: { id: CourierProvider; name: string; desc: string }[] = [
    { id: "steadfast", name: "Steadfast", desc: "Fast nationwide COD • Fraud Check" },
    { id: "pathao", name: "Pathao", desc: "City/Zone pricing • OAuth Live" },
    { id: "ecourier", name: "eCourier", desc: "Thana/Postcode routing • Auto-Poll" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isBulk
                  ? `Bulk Dispatch (${orders.length} Orders)`
                  : `Dispatch Order #${primaryOrder?.order_number}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBulk
                  ? "Send multiple confirmed orders in a single courier batch"
                  : `${primaryOrder?.customer_name} • ${primaryOrder?.customer_phone}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDispatch} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bulk Result View */}
          {bulkResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Bulk Dispatch Complete: {bulkResult.succeeded_count} / {bulkResult.total_requested} Succeeded
                </div>
                {bulkResult.failed_count > 0 && (
                  <p className="text-rose-600 mt-1">{bulkResult.failed_count} order(s) could not be dispatched.</p>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {bulkResult.results.map((r) => (
                  <div key={r.order_id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.order_number || r.order_id}
                      </span>
                      {r.error && <p className="text-[11px] text-rose-500">{r.error}</p>}
                    </div>
                    {r.success ? (
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {r.consignment_id}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-500">FAILED</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Fraud Check Banner (single order) */}
              {!isBulk && primaryOrder && (
                <FraudCheckBadge phone={primaryOrder.customer_phone} />
              )}

              {/* Courier Provider Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Courier Partner
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {providersList.map((p) => {
                    const cred = credentials.find((c) => c.provider === p.id && c.is_active);
                    const selected = provider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          userPickedProviderRef.current = true;
                          setProvider(p.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selected
                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              cred
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            }`}
                          >
                            {cred ? (cred.is_sandbox ? "SANDBOX" : "READY") : "DEMO"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pathao Cascading Locations & Price Preview */}
              {!isBulk && provider === "pathao" && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Pathao Delivery Location & Pricing
                    </span>
                    {loadingPrice ? (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Estimating...
                      </span>
                    ) : (
                      priceEstimate && (
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                          Est. Fee: ৳{Number(priceEstimate.final_price).toFixed(0)}
                        </span>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">City *</label>
                      <select
                        value={cityId}
                        onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="">Select City...</option>
                        {pathaoCities.map((c) => (
                          <option key={c.city_id} value={c.city_id}>
                            {c.city_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Zone *</label>
                      <select
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="">Select Zone...</option>
                        {pathaoZones.map((z) => (
                          <option key={z.zone_id} value={z.zone_id}>
                            {z.zone_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Area</label>
                      <select
                        value={areaId}
                        onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="">Select Area...</option>
                        {pathaoAreas.map((a) => (
                          <option key={a.area_id} value={a.area_id}>
                            {a.area_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Delivery Type</label>
                      <select
                        value={deliveryType}
                        onChange={(e) => setDeliveryType(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value={48}>Normal Delivery (48 hrs)</option>
                        <option value={12}>On-Demand Express (12 hrs)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Parcel Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* eCourier Cascading Locations */}
              {!isBulk && provider === "ecourier" && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    eCourier Structured Routing (City → Thana → Postcode → Area)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">City</label>
                      <select
                        value={ecCity}
                        onChange={(e) => setEcCity(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {ecCities.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Thana</label>
                      <select
                        value={ecThana}
                        onChange={(e) => setEcThana(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {ecThanas.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Postcode</label>
                      <select
                        value={ecPostcode}
                        onChange={(e) => setEcPostcode(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {ecPostcodes.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Area</label>
                      <select
                        value={ecArea}
                        onChange={(e) => setEcArea(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {ecAreas.map((a) => (
                          <option key={a.name} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Delivery Package</label>
                    <select
                      value={ecPackageCode}
                      onChange={(e) => setEcPackageCode(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      {ecPackages.map((pkg) => (
                        <option key={pkg.package_code} value={pkg.package_code}>
                          {pkg.package_name} — ৳{pkg.shipping_charge}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* COD Amount & Delivery Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!isBulk && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      COD Cash to Collect (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={codAmount}
                      onChange={(e) => setCodAmount(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                )}
                <div className={isBulk ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Courier Special Note / Instruction
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call customer before delivery, fragile item"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Address Preview */}
              {!isBulk && primaryOrder && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Shipping Address:</span>{" "}
                  {primaryOrder.shipping_address}{" "}
                  {primaryOrder.shipping_city ? `(${primaryOrder.shipping_city})` : ""}
                </div>
              )}

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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {submitting
                    ? "Booking Parcel..."
                    : isBulk
                    ? `Dispatch ${orders.length} Orders via ${provider.toUpperCase()}`
                    : `Confirm & Book via ${provider.toUpperCase()}`}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

