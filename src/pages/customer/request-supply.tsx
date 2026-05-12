"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";
import { useDepot, ProductKey } from "../../context/DepotContext";
import { logTransaction } from "@/utils/logTransaction";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplyForm {
  stationId:    string;
  stationName:  string;
  product:      string;
  depot:        string;
  quantity:     string;
  priority:     string;
  deliveryDate: string;
  notes:        string;
}

const STATIONS_LIST = [
  { id: "STN-001", name: "Ikeja Central Fuel Station"  },
  { id: "STN-002", name: "Lekki Junction Station"       },
];

const PRODUCTS = [
  { value: "PMS", label: "PMS — Premium Motor Spirit (Petrol)", color: "text-red-400"  },
  { value: "AGO", label: "AGO — Automotive Gas Oil (Diesel)",   color: "text-blue-400" },
  { value: "ATK", label: "ATK — Aviation Turbine Kerosene",     color: "text-green-400"},
];

const PRIORITIES = [
  { value: "normal",    label: "Normal",    desc: "Standard 3–5 day lead time",    color: "text-gray-300"   },
  { value: "urgent",    label: "Urgent",    desc: "48-hour turnaround requested",  color: "text-yellow-400" },
  { value: "emergency", label: "Emergency", desc: "Same-day / critical shortage",  color: "text-red-400"    },
];

const inputCls  = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";
const selectCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestSupply() {
  const router = useRouter();
  const { depots, depotProducts, updateProductData } = useDepot();
  const [user, setUser]       = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reqId, setReqId]     = useState("");
  const [errors, setErrors]   = useState<Partial<SupplyForm>>({});

  const [form, setForm] = useState<SupplyForm>({
    stationId:    "",
    stationName:  "",
    product:      "",
    depot:        "",
    quantity:     "",
    priority:     "normal",
    deliveryDate: "",
    notes:        "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);
      })
      .catch(() => router.push("/auth/login"));

    // Pre-fill station from query params
    const { station, name } = router.query;
    if (station) {
      setForm((f) => ({
        ...f,
        stationId:   String(station),
        stationName: name ? String(name) : "",
      }));
    }
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const set = (key: keyof SupplyForm, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const e: Partial<SupplyForm> = {};
    if (!form.stationId)    e.stationId    = "Please select a station.";
    if (!form.product)      e.product      = "Please select a product.";
    if (!form.depot)        e.depot        = "Please select a source depot.";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
                            e.quantity     = "Enter a valid quantity in litres.";
    if (!form.deliveryDate) e.deliveryDate = "Please choose a preferred delivery date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const URGENT_FEE = 50_000;
  const urgentFee = (form.priority === "urgent" || form.priority === "emergency") ? URGENT_FEE : 0;

  const handleSubmit = async () => {
    if (!validate()) return;

    const id = `SUP-REQ-${Date.now().toString().slice(-8)}`;
    const entry = {
      id,
      stationId:    form.stationId,
      stationName:  form.stationName || form.stationId,
      product:      form.product,
      depot:        form.depot,
      quantity:     `${Number(form.quantity).toLocaleString()} L`,
      priority:     form.priority,
      deliveryDate: form.deliveryDate,
      notes:        form.notes,
      urgentFee:    urgentFee > 0 ? `₦${urgentFee.toLocaleString()}` : null,
      requestedBy:  user.email || user.name,
      requestedAt:  new Date().toISOString(),
      status:       "Pending",
    };

    // Persist to DB via API
    const { api } = await import("@/lib/db-client");
    await api.supplyRequests.create({
      requestId:    id,
      stationName:  entry.stationName,
      product:      form.product as "PMS" | "AGO" | "ATK",
      depot:        form.depot,
      quantity:     Number(form.quantity),
      priority:     form.priority as "normal" | "urgent" | "emergency",
      deliveryDate: form.deliveryDate || undefined,
      notes:        form.notes || undefined,
      requestedBy:  user.email || user.name,
      status:       "Pending",
    });


    // Deduct requested quantity from the depot's live context data
    const prodKey = form.product as ProductKey;
    const depotData = depotProducts[form.depot]?.[prodKey];
    if (depotData) {
      const requestedLitres = Number(form.quantity);
      const [sold, remaining] = depotData.quantity.split("/").map((x) => parseInt(x.replace(/[^0-9]/g, ""), 10) || 0);
      const newRemaining = Math.max(0, remaining - requestedLitres);
      const newLevel     = depotData.level > 0
        ? Math.round((newRemaining / (sold + remaining)) * 100)
        : 0;
      const newStatus: "Available" | "Limited" | "Unavailable" =
        newLevel > 30 ? "Available" : newLevel > 10 ? "Limited" : "Unavailable";
      updateProductData(form.depot, prodKey, {
        quantity: `${sold.toLocaleString()} L/${newRemaining.toLocaleString()} L`,
        level:    newLevel,
        status:   newStatus,
      });
    }

    logTransaction({
      type: "Supply Request",
      user: user.name,
      userRole: "Customer",
      product: form.product,
      quantity: `${Number(form.quantity).toLocaleString()} L`,
      totalAmount: "—",
      status: "Pending",
      depot: form.depot,
      reference: id,
    });

    setReqId(id);
    setSubmitted(true);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
        style={{ backgroundImage: `url(${tower.src})` }}
      >
        <div className="fixed inset-0 bg-black/65 z-0" />
        <CustomerNavigation user={user} />
        <div className="relative z-10 pt-16 md:pl-64 min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Request Submitted!</h2>
                <p className="text-gray-400 text-sm mt-1">Your supply request has been received and is being processed.</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 space-y-2 text-left">
                {[
                  { label: "Request ID",    value: reqId                                                      },
                  { label: "Station",       value: form.stationName || form.stationId                        },
                  { label: "Product",       value: form.product                                              },
                  { label: "Quantity",      value: `${Number(form.quantity).toLocaleString()} L`             },
                  { label: "Source Depot",  value: form.depot                                                },
                  { label: "Priority",      value: form.priority.charAt(0).toUpperCase() + form.priority.slice(1) },
                  { label: "Delivery Date", value: new Date(form.deliveryDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
                  ...(urgentFee > 0 ? [{ label: "Urgent Delivery Fee", value: `₦${urgentFee.toLocaleString()}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b border-orange-500/10 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ stationId: "", stationName: "", product: "", depot: "", quantity: "", priority: "normal", deliveryDate: "", notes: "" });
                  }}
                  className="flex-1 py-2.5 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 text-sm font-semibold rounded-lg transition"
                >
                  New Request
                </button>
                <Link
                  href="/customer/station-manager"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition text-center"
                >
                  Back to Stations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const selectedProduct = PRODUCTS.find((p) => p.value === form.product);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Request Supply | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6 max-w-3xl">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/customer/station-manager"
              className="flex items-center gap-1.5 text-gray-400 hover:text-orange-400 text-sm font-semibold transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Station Manager
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Request Supply</h1>
            <p className="text-gray-400 text-sm">Submit a fuel supply request from a depot to your station</p>
          </div>

          <div className="space-y-5">

            {/* Station & Product */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Station & Product</p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Station dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Receiving Station <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={selectCls}
                    value={form.stationId}
                    onChange={(e) => {
                      const s = STATIONS_LIST.find((x) => x.id === e.target.value);
                      setForm((f) => ({ ...f, stationId: e.target.value, stationName: s?.name || "" }));
                      setErrors((er) => ({ ...er, stationId: "" }));
                    }}
                  >
                    <option value="">Select station</option>
                    {STATIONS_LIST.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                  {errors.stationId && <p className="text-xs text-red-400 mt-1">{errors.stationId}</p>}
                </div>

                {/* Product */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Product <span className="text-red-400">*</span>
                  </label>
                  <select className={selectCls} value={form.product} onChange={(e) => set("product", e.target.value)}>
                    <option value="">Select product</option>
                    {PRODUCTS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {errors.product && <p className="text-xs text-red-400 mt-1">{errors.product}</p>}
                  {selectedProduct && (
                    <p className={`text-xs mt-1.5 font-semibold ${selectedProduct.color}`}>
                      Selected: {selectedProduct.value}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Depot & Quantity */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Depot & Quantity</p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Source depot dropdown — from DepotContext */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Source Depot <span className="text-red-400">*</span>
                  </label>
                  <select className={selectCls} value={form.depot} onChange={(e) => set("depot", e.target.value)}>
                    <option value="">Select depot</option>
                    {depots.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.depot && <p className="text-xs text-red-400 mt-1">{errors.depot}</p>}
                </div>

                {/* Live depot stock info from DepotContext */}
                {form.depot && (
                  <div className="sm:col-span-2 bg-black/30 border border-gray-700/60 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-700/40 bg-orange-500/5">
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Live Stock at {form.depot}</p>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-gray-700/40">
                      {(["PMS", "AGO", "ATK"] as ProductKey[]).map((pk) => {
                        const d = depotProducts[form.depot]?.[pk];
                        if (!d) return null;
                        const statusColor =
                          d.status === "Available"   ? "text-green-400 border-green-500/40 bg-green-500/10" :
                          d.status === "Limited"     ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" :
                                                       "text-red-400 border-red-500/40 bg-red-500/10";
                        const barColor =
                          d.level > 50 ? "bg-green-500" : d.level > 20 ? "bg-yellow-500" : "bg-red-500";
                        const isSelected = form.product === pk;
                        return (
                          <div key={pk} className={`p-3 transition ${isSelected ? "bg-orange-500/5" : ""}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-sm font-extrabold ${
                                pk === "PMS" ? "text-red-400" : pk === "AGO" ? "text-blue-400" : "text-green-400"
                              }`}>{pk}</span>
                              {isSelected && <span className="text-xs text-orange-400 font-semibold">Selected</span>}
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1.5">
                              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${d.level}%` }} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">{d.level}% full</span>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${statusColor}`}>
                                {d.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{d.price}/L</p>
                          </div>
                        );
                      })}
                    </div>
                    {form.product && depotProducts[form.depot]?.[form.product as ProductKey]?.status === "Unavailable" && (
                      <div className="px-4 py-2.5 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs text-red-400 font-semibold">
                          {form.product} is currently unavailable at this depot. Consider selecting a different depot.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Quantity (Litres) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className={inputCls + " pr-8"}
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="e.g. 33000"
                      value={form.quantity}
                      onChange={(e) => set("quantity", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">L</span>
                  </div>
                  {errors.quantity
                    ? <p className="text-xs text-red-400 mt-1">{errors.quantity}</p>
                    : form.quantity && !isNaN(Number(form.quantity))
                      ? <p className="text-xs text-gray-500 mt-1">{Number(form.quantity).toLocaleString()} litres</p>
                      : null
                  }
                </div>

                {/* Preferred delivery date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Preferred Delivery Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.deliveryDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => set("deliveryDate", e.target.value)}
                  />
                  {errors.deliveryDate && <p className="text-xs text-red-400 mt-1">{errors.deliveryDate}</p>}
                </div>

              </div>
            </div>

            {/* Priority & Notes */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Priority & Notes</p>
              </div>
              <div className="p-5 space-y-4">

                {/* Priority selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Request Priority
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => set("priority", p.value)}
                        className={`rounded-xl border p-3 text-left transition ${
                          form.priority === p.value
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-gray-700 bg-gray-900/40 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            p.value === "emergency" ? "bg-red-500" :
                            p.value === "urgent"    ? "bg-yellow-500" : "bg-gray-500"
                          } ${form.priority === p.value ? "ring-2 ring-offset-1 ring-offset-gray-900 ring-orange-500" : ""}`} />
                          <span className={`text-sm font-bold ${form.priority === p.value ? p.color : "text-gray-300"}`}>
                            {p.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Additional Notes / Instructions
                  </label>
                  <textarea
                    className={inputCls + " resize-none"}
                    rows={3}
                    placeholder="e.g. Specific truck requirements, access instructions, contact person on-site..."
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* Request summary preview */}
            {form.stationId && form.product && form.depot && form.quantity && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">Request Summary</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  {[
                    { label: "Station",  value: form.stationName || form.stationId },
                    { label: "Product",  value: form.product                       },
                    { label: "Depot",    value: form.depot                         },
                    { label: "Quantity", value: `${Number(form.quantity).toLocaleString()} L` },
                    { label: "Priority", value: form.priority.charAt(0).toUpperCase() + form.priority.slice(1) },
                    { label: "Delivery", value: form.deliveryDate
                        ? new Date(form.deliveryDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                        : "—" },
                    ...(urgentFee > 0 ? [{ label: "Urgent Fee", value: `₦${urgentFee.toLocaleString()}` }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-semibold text-white truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Link
                href="/customer/station-manager"
                className="px-5 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-semibold rounded-lg transition text-center"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Supply Request
              </button>
            </div>

          </div>
          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
