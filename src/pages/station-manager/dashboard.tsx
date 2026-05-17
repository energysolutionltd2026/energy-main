"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import tower from "@/../public/tower.jpg";
import { startTracking } from "@/utils/onlineTracker";

export interface StationManager {
  id: string;
  name: string;
  email: string;
  password?: string;
  depot: string;
  status: "active" | "blocked";
  createdAt?: string;
}

type ProductKey = "PMS" | "AGO" | "ATK" | string;

interface StockEntry { level: number; price: string; status: "Available" | "Limited" | "Unavailable" }
type DepotStock = Record<string, StockEntry>;

const DEFAULT_STOCK: DepotStock = {
  PMS: { level: 60, price: "₦1,300/L", status: "Available" },
  AGO: { level: 60, price: "₦1,900/L", status: "Available" },
  ATK: { level: 60, price: "₦1,300/L", status: "Available" },
};

// Dealer code → email lookup
const DEALER_CODE_MAP: Record<string, string> = {};
const DEALER_INFO: Record<string, { name: string; company: string }> = {};
const DEALER_STOCK_DEFAULTS: Record<string, Record<string, { level: number; max: number }>> = {};

// Capacity per product per depot in liters
const DEPOT_CAPACITY_LITERS = 5_000_000;

const AVAILABLE_PRODUCTS = ["PMS", "AGO", "ATK"];

const inputCls = "w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition";

function logActivity(_managerId: string, _action: string, _depot: string) {
  // Activities are tracked server-side via heartbeat; local log removed
}

const pColor = (p: ProductKey) => p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-orange-400";
const levelBar = (n: number) => n < 20 ? "bg-red-500" : n < 40 ? "bg-yellow-500" : "bg-green-500";

export default function StationManagerDashboard() {
  const router = useRouter();
  const [manager, setManager] = useState<StationManager | null>(null);
  const [stock, setStock] = useState<DepotStock>(DEFAULT_STOCK);
  const [editing, setEditing] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [salesInput, setSalesInput] = useState<Record<string, string>>({ PMS: "", AGO: "", ATK: "" });
  const [stockInput, setStockInput] = useState<Record<string, string>>({ PMS: "", AGO: "", ATK: "" });
  const [dealerCodeInput, setDealerCodeInput] = useState("");
  const [dealerCodeError, setDealerCodeError] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [depotDbId, setDepotDbId] = useState<string | null>(null);

  useEffect(() => {
    let stopTracking: (() => void) | undefined;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "station_manager") { router.replace("/auth/login"); return; }
        const sm: StationManager = { id: u._id || u.id || u.email, name: u.name || "", email: u.email || "", depot: (u as any).depot || "", status: ((u as any).status || "active") as "active" | "blocked" };
        setManager(sm);
        stopTracking = startTracking({ id: sm.email, name: sm.name, email: sm.email, role: "Station Manager", depot: sm.depot, lastSeen: Date.now() });

        import("@/lib/db-client").then(({ api }) => {
          api.depots.list().then((result) => {
            if (!result) return;
            const depot: any = result.data.find((d: any) => d.name === sm.depot);
            if (!depot) return;
            setDepotDbId(depot._id);
            const pmsLvl = depot.PMS?.level ?? 60;
            const agoLvl = depot.AGO?.level ?? 60;
            const atkLvl = depot.ATK?.level ?? 60;
            setStock({
              PMS: { level: pmsLvl, price: depot.PMS?.price ? `₦${Number(depot.PMS.price).toLocaleString()}/L` : "₦1,300/L", status: pmsLvl < 20 ? "Unavailable" : pmsLvl < 40 ? "Limited" : "Available" },
              AGO: { level: agoLvl, price: depot.AGO?.price ? `₦${Number(depot.AGO.price).toLocaleString()}/L` : "₦1,900/L", status: agoLvl < 20 ? "Unavailable" : agoLvl < 40 ? "Limited" : "Available" },
              ATK: { level: atkLvl, price: depot.ATK?.price ? `₦${Number(depot.ATK.price).toLocaleString()}/L` : "₦1,300/L", status: atkLvl < 20 ? "Unavailable" : atkLvl < 40 ? "Limited" : "Available" },
            });
          });
        });
      })
      .catch(() => router.replace("/auth/login"));
    return () => stopTracking?.();
  }, [router]);

  if (!manager) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const saveStock = () => {
    const dealerCode = dealerCodeInput.trim().toUpperCase();
    const dealerEmail = DEALER_CODE_MAP[dealerCode];
    if (!dealerCode) { setDealerCodeError("Dealer code is required"); return; }
    if (!dealerEmail) { setDealerCodeError("Invalid dealer code"); return; }
    setDealerCodeError("");

    const hasSales = Object.values(salesInput).some(v => parseFloat(v) > 0);
    if (!hasSales) { setDealerCodeError("Enter at least one product's liters sold"); return; }

    const salesLines: string[] = [];
    const newStock = { ...stock };

    for (const product of ["PMS", "AGO", "ATK"] as const) {
      const liters = parseFloat(salesInput[product]) || 0;
      if (liters <= 0) continue;
      const deltaPercent = (liters / DEPOT_CAPACITY_LITERS) * 100;
      const oldLevel = stock[product]?.level ?? 0;
      const newLevel = Math.max(0, Math.round((oldLevel - deltaPercent) * 10) / 10);
      newStock[product] = { ...stock[product], level: newLevel };
      salesLines.push(`${product}: ${liters.toLocaleString()} L sold (depot: ${oldLevel}% → ${newLevel}%)`);
    }

    setStock(newStock);
    setSalesInput({ PMS: "", AGO: "", ATK: "" });
    setDealerCodeInput("");
    setEditing(false);

    // Persist updated depot levels to DB
    if (depotDbId) {
      import("@/lib/db-client").then(({ api }) => {
        api.depots.update(depotDbId, {
          "PMS.level": newStock.PMS?.level,
          "AGO.level": newStock.AGO?.level,
          "ATK.level": newStock.ATK?.level,
        } as any).catch(() => null);
      });
    }
  };

  const saveRestock = () => {
    const dealerCode = dealerCodeInput.trim().toUpperCase();
    const dealerEmail = DEALER_CODE_MAP[dealerCode];
    if (!dealerCode) { setDealerCodeError("Dealer code is required"); return; }
    if (!dealerEmail) { setDealerCodeError("Invalid dealer code"); return; }
    setDealerCodeError("");

    const hasStock = Object.values(stockInput).some(v => parseFloat(v) > 0);
    if (!hasStock) { setDealerCodeError("Enter at least one product's liters received"); return; }

    const restockLines: string[] = [];
    const newStock = { ...stock };

    for (const product of ["PMS", "AGO", "ATK"] as const) {
      const liters = parseFloat(stockInput[product]) || 0;
      if (liters <= 0) continue;
      const deltaPercent = (liters / DEPOT_CAPACITY_LITERS) * 100;
      const oldLevel = stock[product]?.level ?? 0;
      const newLevel = Math.min(100, Math.round((oldLevel + deltaPercent) * 10) / 10);
      newStock[product] = { ...stock[product], level: newLevel };
      restockLines.push(`${product}: ${liters.toLocaleString()} L received (${oldLevel}% → ${newLevel}%)`);
    }

    setStock(newStock);
    setStockInput({ PMS: "", AGO: "", ATK: "" });
    setDealerCodeInput("");
    setRestocking(false);

    // Persist updated depot levels to DB
    if (depotDbId) {
      import("@/lib/db-client").then(({ api }) => {
        api.depots.update(depotDbId, {
          "PMS.level": newStock.PMS?.level,
          "AGO.level": newStock.AGO?.level,
          "ATK.level": newStock.ATK?.level,
        } as any).catch(() => null);
      });
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"));
  };

  return (
    <div className="min-h-screen relative text-white" style={{ backgroundImage: `url(${tower.src})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <Head><title>Station Manager | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 flex h-screen">
        <aside className="w-56 shrink-0 flex flex-col bg-black/50 backdrop-blur-md border-r border-gray-800">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="text-gray-500 text-xs">Station Manager</p>
            <Image src="/eNnergy Logo.png" alt="e-Nergy" width={70} height={24} className="object-contain" />
          </div>
          <div className="flex-1 px-4 py-6 space-y-2">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Assigned Depot</p>
              <p className="text-white font-semibold text-sm">{manager.depot}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 text-xs rounded-full">Active</span>
            </div>
          </div>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {manager.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{manager.name}</p>
                <p className="text-gray-500 text-xs">Station Manager</p>
              </div>
            </div>
            <button onClick={logout} className="w-full text-xs text-red-400 border border-red-500/40 rounded-lg py-2 hover:bg-red-500/10 transition">
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {manager.name.split(" ")[0]}</h1>
              <p className="text-gray-400 text-sm mt-0.5">Managing: {manager.depot}</p>
            </div>
            <span className="text-gray-400 text-sm">
              {new Date().toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Depot Stock — {manager.depot}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStockInput({ PMS: "", AGO: "", ATK: "" }); setDealerCodeInput(""); setDealerCodeError(""); setRestocking(true); }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Update Stock
                </button>
                <button
                  onClick={() => { setSalesInput({ PMS: "", AGO: "", ATK: "" }); setDealerCodeInput(""); setDealerCodeError(""); setEditing(true); }}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Update Sales
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {AVAILABLE_PRODUCTS.map(p => (
                <div key={p} className="bg-black/30 border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-bold ${pColor(p)}`}>{p}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${stock[p]?.status === "Available" ? "bg-green-500/10 text-green-400 border-green-500/30" : stock[p]?.status === "Limited" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                      {stock[p]?.status || "Unavailable"}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white mb-1">{stock[p]?.level ?? 0}%</p>
                  <div className="h-2 bg-gray-700 rounded-full mb-2">
                    <div className={`h-2 rounded-full ${levelBar(stock[p]?.level ?? 0)}`} style={{ width: `${stock[p]?.level ?? 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400">{stock[p]?.price || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">My Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No activity yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-700 text-left">
                      <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                      <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Dealer</th>
                      <th className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Products Sold</th>
                      <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Depot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a, i) => {
                      const parts = a.action.split(" | ");
                      // "Sales recorded at Lagos" → depot name
                      const depotMatch = parts[0]?.match(/at (.+)$/);
                      const depotName = depotMatch?.[1] ?? a.depot ?? "—";
                      // "Dealer: BD-CH1P3T" → code
                      const codeMatch = parts[1]?.match(/Dealer:\s*(.+)/);
                      const code = codeMatch?.[1]?.trim() ?? "—";
                      const info = DEALER_INFO[code];
                      // remaining parts = product lines
                      const productLines = parts.slice(2).join(" | ").split(" · ").filter(Boolean);

                      return (
                        <tr key={i} className="border-b border-gray-800/60 last:border-0 hover:bg-white/5 transition">
                          <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap align-top">
                            {new Date(a.timestamp).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3 pr-4 align-top">
                            <p className="text-white text-xs font-semibold">{info?.name ?? code}</p>
                            <p className="text-orange-400 text-[10px] font-mono">{code}</p>
                          </td>
                          <td className="py-3 pr-4 align-top">
                            <div className="flex flex-wrap gap-1">
                              {productLines.map((line: string, j: number) => (
                                <span key={j} className="inline-block bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full whitespace-nowrap">
                                  {line}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-gray-300 text-xs whitespace-nowrap align-top">{depotName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] -mt-[5vh]">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-white font-bold">Update Sales</h2>
                <p className="text-gray-400 text-xs mt-0.5">{manager.depot}</p>
              </div>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white transition">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Dealer Code */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <label className="text-orange-400 text-xs font-semibold block mb-2">Dealer Code <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. BD-CH1P3T"
                  value={dealerCodeInput}
                  onChange={e => { setDealerCodeInput(e.target.value.toUpperCase()); setDealerCodeError(""); }}
                  className={`${inputCls} font-mono tracking-widest uppercase`}
                />
                {dealerCodeError && <p className="text-red-400 text-xs mt-1">{dealerCodeError}</p>}
                {(() => {
                  const info = DEALER_INFO[dealerCodeInput.trim().toUpperCase()];
                  return info ? (
                    <div className="mt-2 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {info.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-green-400 text-xs font-semibold">{info.name}</p>
                        <p className="text-gray-400 text-[10px]">{info.company}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                <p className="text-gray-500 text-xs mt-1">Enter the bulk dealer code whose products are being sold at this depot.</p>
              </div>

              {(() => {
                // Read dealer's current stock for the entered code
                const dealerEmail = DEALER_CODE_MAP[dealerCodeInput.trim().toUpperCase()];
                const dealerTanks: Record<string, { level: number; max: number }> | null = dealerEmail ? (DEALER_STOCK_DEFAULTS[dealerEmail] ?? null) : null;
                const dealerStatus = (p: string) => {
                  if (!dealerTanks) return null;
                  const tank = dealerTanks[p];
                  if (!tank) return null;
                  const pct = tank.max > 0 ? (tank.level / tank.max) * 100 : 0;
                  if (pct >= 50) return { label: "Available", cls: "bg-green-500/10 text-green-400 border-green-500/30" };
                  if (pct >= 20) return { label: "Limited",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" };
                  return { label: "Low", cls: "bg-red-500/10 text-red-400 border-red-500/30" };
                };
                const dealerPct = (p: string) => {
                  if (!dealerTanks?.[p]) return null;
                  const { level, max } = dealerTanks[p];
                  return max > 0 ? Math.round((level / max) * 100) : 0;
                };

                return AVAILABLE_PRODUCTS.map(p => {
                  const status = dealerStatus(p);
                  const pct = dealerPct(p);
                  const tank = dealerTanks?.[p];
                  return (
                    <div key={p} className="bg-black/30 rounded-lg p-4 border border-gray-700">
                      {/* Current dealer stock header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-bold ${pColor(p)}`}>{p}</span>
                        {status ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                        ) : (
                          <span className="text-xs text-gray-600 italic">enter dealer code</span>
                        )}
                      </div>
                      {tank && pct !== null && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Dealer stock</span>
                            <span className="text-white font-semibold">{pct}% &nbsp;·&nbsp; {tank.level.toFixed(2)} ML / {tank.max} ML</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full">
                            <div
                              className={`h-1.5 rounded-full ${pct >= 50 ? "bg-green-500" : pct >= 20 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <label className="text-gray-400 text-xs block mb-1">Liters sold</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 500000"
                        value={salesInput[p] ?? ""}
                        onChange={e => setSalesInput(prev => ({ ...prev, [p]: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  );
                });
              })()}
            </div>
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3 shrink-0">
              <button onClick={() => { setEditing(false); setDealerCodeInput(""); setDealerCodeError(""); }} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button onClick={saveStock} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold">Record Sales</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== UPDATE STOCK MODAL ===== */}
      {restocking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] -mt-[5vh]">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-white font-bold">Update Stock</h2>
                <p className="text-gray-400 text-xs mt-0.5">{manager.depot} — record incoming stock</p>
              </div>
              <button onClick={() => { setRestocking(false); setDealerCodeInput(""); setDealerCodeError(""); }} className="text-gray-400 hover:text-white transition">✕</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Dealer Code */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <label className="text-blue-400 text-xs font-semibold block mb-2">Dealer Code <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. BD-CH1P3T"
                  value={dealerCodeInput}
                  onChange={e => { setDealerCodeInput(e.target.value.toUpperCase()); setDealerCodeError(""); }}
                  className={`${inputCls} font-mono tracking-widest uppercase`}
                />
                {dealerCodeError && <p className="text-red-400 text-xs mt-1">{dealerCodeError}</p>}
                {(() => {
                  const info = DEALER_INFO[dealerCodeInput.trim().toUpperCase()];
                  return info ? (
                    <div className="mt-2 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {info.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-green-400 text-xs font-semibold">{info.name}</p>
                        <p className="text-gray-400 text-[10px]">{info.company}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                <p className="text-gray-500 text-xs mt-1">Enter the bulk dealer code receiving the stock.</p>
              </div>

              {/* Product inputs */}
              {(() => {
                const dealerEmail = DEALER_CODE_MAP[dealerCodeInput.trim().toUpperCase()];
                const dealerTanks: Record<string, { level: number; max: number }> | null = dealerEmail ? (DEALER_STOCK_DEFAULTS[dealerEmail] ?? null) : null;

                return AVAILABLE_PRODUCTS.map(p => {
                  const tank = dealerTanks?.[p];
                  const pct = tank && tank.max > 0 ? Math.round((tank.level / tank.max) * 100) : null;
                  const spaceML = tank ? Math.max(0, tank.max - tank.level) : null;

                  return (
                    <div key={p} className="bg-black/30 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-bold ${pColor(p)}`}>{p}</span>
                        {pct !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${pct >= 50 ? "bg-green-500/10 text-green-400 border-green-500/30" : pct >= 20 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                            {pct >= 50 ? "Available" : pct >= 20 ? "Limited" : "Low"}
                          </span>
                        )}
                      </div>
                      {tank && pct !== null && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Current stock</span>
                            <span className="text-white font-semibold">{pct}% · {tank.level.toFixed(2)} ML / {tank.max} ML</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full mb-1">
                            <div className={`h-1.5 rounded-full ${pct >= 50 ? "bg-green-500" : pct >= 20 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          {spaceML !== null && (
                            <p className="text-[10px] text-gray-500">Capacity remaining: {spaceML.toFixed(2)} ML ({((spaceML / tank.max) * 100).toFixed(0)}%)</p>
                          )}
                        </div>
                      )}
                      <label className="text-gray-400 text-xs block mb-1">Liters received</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 1000000"
                        value={stockInput[p] ?? ""}
                        onChange={e => setStockInput(prev => ({ ...prev, [p]: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  );
                });
              })()}
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3 shrink-0">
              <button onClick={() => { setRestocking(false); setDealerCodeInput(""); setDealerCodeError(""); }} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button onClick={saveRestock} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Confirm Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}