"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";
import { useDepot, ProductKey } from "../../context/DepotContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductSale {
  product:      "PMS" | "AGO" | "ATK";
  label:        string;
  color:        string;
  openingStock: number;
  quantitySold: string;
  unitPrice:    string;
  cashSales:    string;
  posSales:     string;
  transactions: string;
  pumpsUsed:    string;
  notes:        string;
}

interface SalesForm {
  stationId:    string;
  stationName:  string;
  date:         string;
  shift:        string;
  staffOnDuty:  string;
  pumpsActive:  string;
  incidents:    string;
  products:     ProductSale[];
}

function makeProducts(tanks: { product: string; currentLitres: number }[], prices: Record<string, number>): ProductSale[] {
  const stock = (p: string) => tanks.find((t) => t.product === p)?.currentLitres ?? 0;
  return [
    { product: "PMS", label: "Premium Motor Spirit",      color: "text-red-400",   openingStock: stock("PMS"), quantitySold: "", unitPrice: String(prices.PMS ?? 0), cashSales: "", posSales: "", transactions: "", pumpsUsed: "", notes: "" },
    { product: "AGO", label: "Automotive Gas Oil",        color: "text-blue-400",  openingStock: stock("AGO"), quantitySold: "", unitPrice: String(prices.AGO ?? 0), cashSales: "", posSales: "", transactions: "", pumpsUsed: "", notes: "" },
    { product: "ATK", label: "Aviation Turbine Kerosene", color: "text-green-400", openingStock: stock("ATK"), quantitySold: "", unitPrice: String(prices.ATK ?? 0), cashSales: "", posSales: "", transactions: "", pumpsUsed: "", notes: "" },
  ];
}

const inputCls  = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";
const selectCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UpdateSales() {
  const router  = useRouter();
  const { depotProducts, selectedDepot, setSelectedDepot, depots } = useDepot();
  const [user, setUser]         = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [entryId, setEntryId]   = useState("");
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [prices, setPrices]             = useState<Record<string, number>>({ PMS: 0, AGO: 0, ATK: 0 });

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<SalesForm>({
    stationId:   "",
    stationName: "",
    date:        todayStr,
    shift:       "full-day",
    staffOnDuty: "",
    pumpsActive: "",
    incidents:   "",
    products:    makeProducts([], {}),
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);

        import("@/lib/db-client").then(({ api }) => {
          Promise.allSettled([
            api.fuelStations.list({ ownerEmail: u.email }),
            api.platformSettings.get(),
          ]).then(([stationsRes, settingsRes]) => {
            const stations = (stationsRes.status === "fulfilled" ? stationsRes.value?.data : null) ?? [];
            setStationsList(stations);

            const s = settingsRes.status === "fulfilled" ? settingsRes.value : null;
            const p = {
              PMS: s?.pmsPricePerLitre ?? 0,
              AGO: s?.agoPricePerLitre ?? 0,
              ATK: s?.atkPricePerLitre ?? 0,
            };
            setPrices(p);

            const { station, name } = router.query;
            if (station) {
              const sid = String(station);
              const found = stations.find((x: any) => x._id === sid || x.stationName === String(name));
              setForm((f) => ({
                ...f,
                stationId:   sid,
                stationName: found?.stationName ?? (name ? String(name) : sid),
                pumpsActive: "",
                products:    makeProducts(found?.tanks ?? [], p),
              }));
            }
          });
        });
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setField = (key: keyof SalesForm, val: string) => {
    setForm((f) => {
      const next = { ...f, [key]: val } as SalesForm;
      if (key === "stationId") {
        const found = stationsList.find((x: any) => x._id === val);
        next.stationName = found?.stationName ?? val;
        next.pumpsActive = "";
        next.products    = makeProducts(found?.tanks ?? [], prices);
      }
      return next;
    });
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const setProd = (idx: number, key: keyof ProductSale, val: string) => {
    setForm((f) => {
      const products = f.products.map((p, i) => i === idx ? { ...p, [key]: val } : p);
      return { ...f, products };
    });
    setErrors((e) => { const n = { ...e }; delete n[`prod_${idx}_${key}`]; return n; });
  };

  const revenue = (p: ProductSale) => {
    const qty   = Number(p.quantitySold)  || 0;
    const price = Number(p.unitPrice)     || 0;
    return qty * price;
  };

  const closingStock = (p: ProductSale) =>
    Math.max(0, p.openingStock - (Number(p.quantitySold) || 0));

  const totalRevenue = form.products.reduce((a, p) => a + revenue(p), 0);
  const totalSold    = form.products.reduce((a, p) => a + (Number(p.quantitySold) || 0), 0);
  const totalTxns    = form.products.reduce((a, p) => a + (Number(p.transactions) || 0), 0);
  const totalCash    = form.products.reduce((a, p) => a + (Number(p.cashSales)    || 0), 0);
  const totalPOS     = form.products.reduce((a, p) => a + (Number(p.posSales)     || 0), 0);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.stationId)    e.stationId    = "Select a station.";
    if (!form.date)         e.date         = "Enter the sales date.";
    if (!form.staffOnDuty)  e.staffOnDuty  = "Enter number of staff on duty.";
    form.products.forEach((p, i) => {
      if (p.quantitySold === "" && p.transactions === "") return; // allow empty product row
      if (p.quantitySold !== "" && (isNaN(Number(p.quantitySold)) || Number(p.quantitySold) < 0))
        e[`prod_${i}_quantitySold`] = "Invalid quantity.";
      if (Number(p.quantitySold) > p.openingStock)
        e[`prod_${i}_quantitySold`] = `Cannot exceed opening stock (${p.openingStock.toLocaleString()} L).`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;

    const id = `SALE-${Date.now().toString().slice(-8)}`;
    const mappedProducts = form.products.map((p) => ({
      product:             p.product,
      openingStock:        p.openingStock,
      quantitySold:        Number(p.quantitySold) || 0,
      closingStock:        closingStock(p),
      unitPrice:           Number(p.unitPrice)    || 0,
      revenue:             revenue(p),
      cashSales:           Number(p.cashSales)    || 0,
      posSales:            Number(p.posSales)     || 0,
      transactions:        Number(p.transactions) || 0,
      pumpsUsed:           p.pumpsUsed,
      notes:               p.notes,
    }));

    const entry = {
      id,
      stationId:    form.stationId,
      stationName:  form.stationName,
      date:         form.date,
      shift:        form.shift,
      staffOnDuty:  form.staffOnDuty,
      pumpsActive:  form.pumpsActive,
      incidents:    form.incidents,
      submittedBy:  user.name,
      submittedAt:  new Date().toISOString(),
      totalRevenue,
      totalSold,
      totalTxns,
      totalCash,
      totalPOS,
      products:     mappedProducts,
    };

    try {
      const { api } = await import("@/lib/db-client");
      await api.dailySales.create({
        saleDate:     form.date,
        stationId:    form.stationId,
        stationName:  form.stationName,
        recordedBy:   user.email,
        sales: mappedProducts.map((p) => ({
          product:           p.product as "PMS" | "AGO" | "ATK",
          openingStockLtrs:  p.openingStock,
          closingStockLtrs:  p.closingStock,
          litresSold:        p.quantitySold,
          pricePerLitre:     p.unitPrice,
          revenue:           p.revenue,
        })),
        totalRevenue,
      });
    } catch (err) {
      console.error("[update-sales] create failed:", err);
      alert("Failed to save sales record. Please check your connection and try again.");
      return;
    }

    setEntryId(id);
    setSubmitted(true);
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white" style={{ backgroundImage: `url(${tower.src})` }}>
        <div className="fixed inset-0 bg-black/65 z-0" />
        <CustomerNavigation user={user} />
        <div className="relative z-10 pt-16 md:pl-64 min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Sales Updated!</h2>
                <p className="text-gray-400 text-sm mt-1">Daily sales record has been saved successfully.</p>
              </div>

              {/* Summary */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-2">
                {[
                  { label: "Entry ID",        value: entryId },
                  { label: "Station",         value: form.stationName || form.stationId },
                  { label: "Date",            value: new Date(form.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Shift",           value: form.shift === "full-day" ? "Full Day" : form.shift.charAt(0).toUpperCase() + form.shift.slice(1) },
                  { label: "Total Sold",      value: `${totalSold.toLocaleString()} L` },
                  { label: "Total Revenue",   value: `₦${totalRevenue.toLocaleString()}` },
                  { label: "Transactions",    value: totalTxns.toLocaleString() },
                  { label: "Cash / POS",      value: `₦${totalCash.toLocaleString()} / ₦${totalPOS.toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b border-green-500/10 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEntryId("");
                    setErrors({});
                    const found = stationsList.find((x: any) => x._id === form.stationId);
                    setForm({ stationId: form.stationId, stationName: form.stationName, date: todayStr, shift: "full-day", staffOnDuty: "", pumpsActive: "", incidents: "", products: makeProducts(found?.tanks ?? [], prices) });
                  }}
                  className="flex-1 py-2.5 border border-gray-700 text-gray-300 hover:text-white text-sm font-semibold rounded-lg transition"
                >
                  New Entry
                </button>
                <Link href="/customer/station-manager"
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

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white" style={{ backgroundImage: `url(${tower.src})` }}>
      <Head><title>Update Sales | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6 max-w-4xl">

          {/* Back link */}
          <div className="mb-6">
            <Link href="/customer/station-manager"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-orange-400 text-sm font-semibold transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Station Manager
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Update Daily Sales</h1>
            <p className="text-gray-400 text-sm">Record sales figures, stock movement, and transactions for the day</p>
          </div>

          <div className="space-y-5">

            {/* ── Session Info ── */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Session Information</p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Station <span className="text-red-400">*</span>
                  </label>
                  <select className={selectCls} value={form.stationId} onChange={(e) => setField("stationId", e.target.value)}>
                    <option value="">Select station</option>
                    {stationsList.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.stationName} ({s.state})</option>
                    ))}
                  </select>
                  {errors.stationId && <p className="text-xs text-red-400 mt-1">{errors.stationId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Sales Date <span className="text-red-400">*</span>
                  </label>
                  <input type="date" className={inputCls} value={form.date}
                    max={todayStr}
                    onChange={(e) => setField("date", e.target.value)} />
                  {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Shift</label>
                  <select className={selectCls} value={form.shift} onChange={(e) => setField("shift", e.target.value)}>
                    <option value="full-day">Full Day</option>
                    <option value="morning">Morning (6am – 2pm)</option>
                    <option value="afternoon">Afternoon (2pm – 10pm)</option>
                    <option value="night">Night (10pm – 6am)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Staff on Duty <span className="text-red-400">*</span>
                  </label>
                  <input type="number" min="1" className={inputCls} placeholder="e.g. 6"
                    value={form.staffOnDuty} onChange={(e) => setField("staffOnDuty", e.target.value)} />
                  {errors.staffOnDuty && <p className="text-xs text-red-400 mt-1">{errors.staffOnDuty}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Active Pumps</label>
                  <input type="number" min="0" className={inputCls} placeholder="Number of pumps operational"
                    value={form.pumpsActive} onChange={(e) => setField("pumpsActive", e.target.value)} />
                </div>

              </div>
            </div>

            {/* ── Depot Reference (from DepotContext) ── */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5 flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Depot Reference — Live Stock Levels</p>
                <select
                  className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500 transition"
                  value={selectedDepot}
                  onChange={(e) => setSelectedDepot(e.target.value)}
                >
                  {depots.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-700/40">
                {(["PMS", "AGO", "ATK"] as ProductKey[]).map((pk) => {
                  const d = depotProducts[selectedDepot]?.[pk];
                  if (!d) return <div key={pk} className="p-4 text-xs text-gray-600">—</div>;
                  const barColor = d.level > 50 ? "bg-green-500" : d.level > 20 ? "bg-yellow-500" : "bg-red-500";
                  const statusColor =
                    d.status === "available"   ? "text-green-400 border-green-500/40 bg-green-500/10" :
                    d.status === "limited"     ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" :
                                                 "text-red-400 border-red-500/40 bg-red-500/10";
                  const prodColor = pk === "PMS" ? "text-red-400" : pk === "AGO" ? "text-blue-400" : "text-green-400";
                  return (
                    <div key={pk} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-extrabold ${prodColor}`}>{pk}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${statusColor}`}>{d.status}</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${d.level}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{d.level}% available</span>
                        <span className="text-white font-semibold">{d.price}/L</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Product Sales ── */}
            {form.products.map((p, idx) => {
              const rev    = revenue(p);
              const cstock = closingStock(p);
              const pctLeft = p.openingStock > 0 ? Math.round((cstock / p.openingStock) * 100) : 0;
              const barCol  = pctLeft > 50 ? "bg-green-500" : pctLeft > 20 ? "bg-yellow-500" : "bg-red-500";

              return (
                <div key={p.product} className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-extrabold ${p.color}`}>{p.product}</span>
                      <span className="text-xs text-gray-500">{p.label}</span>
                    </div>
                    {form.stationId && (
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Opening: <span className="text-white font-semibold">{p.openingStock.toLocaleString()} L</span></span>
                        {p.quantitySold && !isNaN(Number(p.quantitySold)) && (
                          <span className="text-green-400 font-semibold">
                            → Closing: {cstock.toLocaleString()} L
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Qty Sold (L)</label>
                        <input type="number" min="0" className={inputCls} placeholder="0"
                          value={p.quantitySold} onChange={(e) => setProd(idx, "quantitySold", e.target.value)} />
                        {errors[`prod_${idx}_quantitySold`] && (
                          <p className="text-xs text-red-400 mt-1">{errors[`prod_${idx}_quantitySold`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Unit Price (₦/L)</label>
                        <input type="number" min="0" className={inputCls}
                          value={p.unitPrice} onChange={(e) => setProd(idx, "unitPrice", e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">No. of Transactions</label>
                        <input type="number" min="0" className={inputCls} placeholder="0"
                          value={p.transactions} onChange={(e) => setProd(idx, "transactions", e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Cash Sales (₦)</label>
                        <input type="number" min="0" className={inputCls} placeholder="0"
                          value={p.cashSales} onChange={(e) => setProd(idx, "cashSales", e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">POS / Transfer (₦)</label>
                        <input type="number" min="0" className={inputCls} placeholder="0"
                          value={p.posSales} onChange={(e) => setProd(idx, "posSales", e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Pumps Used</label>
                        <input type="number" min="0" className={inputCls} placeholder="e.g. 3"
                          value={p.pumpsUsed} onChange={(e) => setProd(idx, "pumpsUsed", e.target.value)} />
                      </div>

                    </div>

                    {/* Live revenue + closing stock bar */}
                    {p.quantitySold && !isNaN(Number(p.quantitySold)) && Number(p.quantitySold) > 0 && (
                      <div className="bg-black/30 border border-gray-700/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex gap-4 text-sm flex-wrap">
                          <div>
                            <p className="text-xs text-gray-500">Revenue</p>
                            <p className="font-bold text-green-400">₦{rev.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Closing Stock</p>
                            <p className="font-bold text-white">{cstock.toLocaleString()} L</p>
                          </div>
                        </div>
                        <div className="sm:ml-auto sm:w-40">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Remaining</span>
                            <span className={pctLeft > 50 ? "text-green-400" : pctLeft > 20 ? "text-yellow-400" : "text-red-400"}>{pctLeft}%</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${barCol} rounded-full transition-all`} style={{ width: `${pctLeft}%` }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Product Notes</label>
                      <input className={inputCls} placeholder="e.g. pump #2 offline, price adjustment..."
                        value={p.notes} onChange={(e) => setProd(idx, "notes", e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Incidents & Notes ── */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Incidents & General Notes</p>
              </div>
              <div className="p-5">
                <textarea className={inputCls + " resize-none"} rows={3}
                  placeholder="Report any incidents, equipment issues, supply shortages, or unusual activity during this period..."
                  value={form.incidents} onChange={(e) => setField("incidents", e.target.value)} />
              </div>
            </div>

            {/* ── Day Summary ── */}
            {totalSold > 0 && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-4">Day Summary Preview</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Sold",    value: `${totalSold.toLocaleString()} L`,  color: "text-orange-400" },
                    { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, color: "text-green-400"  },
                    { label: "Transactions",  value: totalTxns.toLocaleString(),           color: "text-blue-400"   },
                    { label: "Cash / POS",    value: `₦${totalCash.toLocaleString()} / ₦${totalPOS.toLocaleString()}`, color: "text-purple-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className={`text-lg font-extrabold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Per-product mini summary */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {form.products.map((p) => {
                    if (!p.quantitySold || Number(p.quantitySold) === 0) return null;
                    return (
                      <div key={p.product} className="bg-black/30 border border-gray-700/50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <span className={`text-sm font-extrabold ${p.color}`}>{p.product}</span>
                          <p className="text-xs text-gray-500">{Number(p.quantitySold).toLocaleString()} L sold</p>
                        </div>
                        <p className="text-sm font-bold text-green-400">₦{revenue(p).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-3">
              <Link href="/customer/station-manager"
                className="px-5 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-semibold rounded-lg transition text-center"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Sales Record
              </button>
            </div>

          </div>
          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
