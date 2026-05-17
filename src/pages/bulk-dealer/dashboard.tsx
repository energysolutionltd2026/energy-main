"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import tower from "@/../public/tower.jpg";
import { logTransaction } from "@/utils/logTransaction";
import { startTracking } from "@/utils/onlineTracker";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tank { id: string; label: string; level: number; max: number; }

const PRODUCT_COLORS: Record<string, { text: string; fill: string; light: string; border: string; stripe: string }> = {
  PMS: { text: "text-red-400",    fill: "#ef4444", light: "bg-red-500/20",    border: "border-red-500/40",    stripe: "rgba(239,68,68,0.6)"   },
  ATK: { text: "text-orange-400", fill: "#f97316", light: "bg-orange-500/20", border: "border-orange-500/40", stripe: "rgba(249,115,22,0.6)"  },
  AGO: { text: "text-blue-400",   fill: "#3b82f6", light: "bg-blue-500/20",   border: "border-blue-500/40",   stripe: "rgba(59,130,246,0.6)"  },
};


const NAV_SECTIONS = [
  ["Current Stock Level", "Stock Value", "Stock Reconciliation"],
  ["Allocations", "Customer Requests", "Sales History", "View Profit Margin", "Low Stock Alert", "Buyers"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(s: string) {
  const map: Record<string, string> = {
    Delivered:       "bg-green-500/20 text-green-400 border-green-500/40",
    "In Transit":    "bg-purple-500/20 text-purple-400 border-purple-500/40",
    Processing:      "bg-orange-500/20 text-orange-400 border-orange-500/40",
    Pending:         "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Cancelled:       "bg-red-500/20 text-red-400 border-red-500/40",
    Balanced:        "bg-green-500/20 text-green-400 border-green-500/40",
    OK:              "bg-green-500/20 text-green-400 border-green-500/40",
    "Minor Variance":"bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Flagged:         "bg-red-500/20 text-red-400 border-red-500/40",
    Cleared:         "bg-green-500/20 text-green-400 border-green-500/40",
  };
  return (map[s] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40") +
    " px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap";
}

const card  = "bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4";
const label = "text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";
const gBtn  = "bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition";
const inputCls = "bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none w-full";

// ─── Tank Gauge ───────────────────────────────────────────────────────────────
function TankBar({ tank, color }: { tank: Tank; color: string }) {
  const pct = Math.min(100, (tank.level / tank.max) * 100);
  const scales = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5];
  return (
    <div className="flex items-end gap-1">
      <div className="flex flex-col justify-between h-52 text-right pr-1">
        {scales.map((m) => <span key={m} className="text-[9px] text-gray-600 leading-none">{m}M</span>)}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-10 h-52 bg-gray-900/80 border border-gray-700 rounded overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
            style={{
              height: `${pct}%`,
              background: color,
              backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(255,255,255,0.08) 5px,rgba(255,255,255,0.08) 6px)",
            }}
          />
        </div>
        <span className="text-[10px] text-gray-400">{tank.level}M</span>
        <span className="text-[9px] text-gray-600">{tank.label}</span>
      </div>
    </div>
  );
}

// ─── Mini SVG Line Chart ──────────────────────────────────────────────────────
function MiniChart({ tanks }: { tanks?: Record<string, { level: number; max: number }> }) {
  const W = 180; const H = 160; const PAD = 20;
  const t = tanks ?? getDealerTanks();
  const data = { AGO: [t.AGO.level], ATK: [t.ATK.level], PMS: [t.PMS.level] };
  const maxVal = Math.max(5, ...Object.values(t).map(x => x.max)); const minVal = 0;
  const x = (i: number) => PAD + (i / 2) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - minVal) / (maxVal - minVal)) * (H - PAD * 2);
  const path = (pts: number[]) => pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const lines = [
    { key: "AGO", color: "#3b82f6", pts: data.AGO },
    { key: "ATK", color: "#f97316", pts: data.ATK },
    { key: "PMS", color: "#ef4444", pts: data.PMS },
  ];
  const yTicks = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  return (
    <div>
      <svg width={W} height={H} className="overflow-visible">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD} y1={y(t)} x2={W - PAD} y2={y(t)} stroke="#374151" strokeWidth={0.5} />
            <text x={W - PAD + 4} y={y(t) + 3} fontSize={8} fill="#6b7280">{t}M</text>
          </g>
        ))}
        {lines.map(({ key, color, pts }) => (
          <g key={key}>
            <path d={path(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {pts.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={color} />)}
          </g>
        ))}
      </svg>
      <div className="flex gap-4 mt-2 justify-center">
        {lines.map(({ key, color }) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-gray-400">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Current Stock Level ─────────────────────────────────────────────
const CALIBRATION_LOG = [
  { tank: "PMS-T1", date: "2026-03-20", reading: "3.25M L", technician: "Emeka Okafor" },
  { tank: "PMS-T2", date: "2026-03-20", reading: "3.75M L", technician: "Emeka Okafor" },
  { tank: "PMS-T3", date: "2026-03-20", reading: "2.25M L", technician: "Emeka Okafor" },
  { tank: "ATK-T1", date: "2026-03-21", reading: "2.80M L", technician: "Fatima Bello" },
  { tank: "ATK-T2", date: "2026-03-21", reading: "1.90M L", technician: "Fatima Bello" },
  { tank: "AGO-T1", date: "2026-03-22", reading: "4.10M L", technician: "James Adeyemi" },
  { tank: "AGO-T2", date: "2026-03-22", reading: "3.20M L", technician: "James Adeyemi" },
];

const STOCK_PRICES: Record<string, number> = { PMS: 617, ATK: 650, AGO: 1050 };

const DEALER_STOCK_DEFAULTS: Record<string, Record<string, { level: number; max: number }>> = {};

const NEW_DEALER_DEFAULT = { PMS: { level: 0, max: 5 }, AGO: { level: 0, max: 5 }, ATK: { level: 0, max: 5 } };

// Module-level dealer state — set by main component after API auth, read by section sub-components
let _dealerEmail = "";
let _dealerName = "";
let _dealerTanks: Record<string, { level: number; max: number }> = { ...NEW_DEALER_DEFAULT };
let _platformPrices: Record<string, number> = { PMS: 617, ATK: 650, AGO: 1050 };

function getDealerTanks(): Record<string, { level: number; max: number }> {
  return _dealerTanks;
}

function updateDealerStock(product: string, deltaLiters: number) {
  const tank = _dealerTanks[product];
  if (tank) {
    const deltaML = deltaLiters / 1_000_000;
    _dealerTanks = {
      ..._dealerTanks,
      [product]: { ...tank, level: Math.round(Math.max(0, Math.min(tank.max, tank.level + deltaML)) * 100) / 100 },
    };
    window.dispatchEvent(new CustomEvent("dealer-stock-updated"));
  }
}

function parseLiters(qty: string): number {
  return parseInt(qty.replace(/[^0-9]/g, "")) || 0;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function computeStockValue() {
  return (["PMS", "AGO", "ATK"] as const).reduce((acc, p) => {
    const litres = _dealerTanks[p].level * 1_000_000;
    return acc + litres * (_platformPrices[p] ?? 0);
  }, 0);
}

// ─── Account Maintenance Fee Bar ─────────────────────────────────────────────
function AccountFeeBar() {
  const [yearlyFee, setYearlyFee] = useState<number | null>(null);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.platformSettings.get().then((result) => {
        if (result?.bulkDealerYearlyFee != null) {
          setYearlyFee(result.bulkDealerYearlyFee as number);
          return;
        }
        setYearlyFee(150000);
      });
    });
  }, []);

  if (yearlyFee === null) return null;

  return (
    <div className="mx-6 md:mx-10 mb-4 flex flex-wrap items-center gap-3 bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3 text-sm">
      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span className="text-gray-300">
        <span className="text-white font-semibold">Yearly Account Maintenance Fee:</span>{" "}
        <span className="text-green-400 font-bold">&#8358;{yearlyFee.toLocaleString()}</span>
        <span className="text-gray-500"> &middot; Due annually in December</span>
      </span>
      <span className="ml-auto text-xs text-gray-500 italic">Contact admin to renew</span>
    </div>
  );
}

function SectionCurrentStock() {
  const [showCalibrationLog, setShowCalibrationLog] = useState(false);
  const [MERGED_TANKS, setMergedTanks] = useState<Record<string, { level: number; max: number }>>(() => getDealerTanks());
  const dealerProducts: ("PMS" | "ATK" | "AGO")[] = ["PMS", "AGO", "ATK"];

  useEffect(() => {
    const refresh = () => setMergedTanks(getDealerTanks());
    window.addEventListener("dealer-stock-updated", refresh);
    window.addEventListener("storage", refresh);

    // Sync admin-assigned tank volumes from DB on mount
    import("@/lib/db-client").then(({ api }) => {
      api.auth.me().then((result) => {
        if (!result) return;
        const u = result.user as any;
        if (!u.pmsTankMaxML && !u.agoTankMaxML && !u.atkTankMaxML) return;
        _dealerTanks = {
          PMS: { ..._dealerTanks.PMS, max: u.pmsTankMaxML || _dealerTanks.PMS.max },
          AGO: { ..._dealerTanks.AGO, max: u.agoTankMaxML || _dealerTanks.AGO.max },
          ATK: { ..._dealerTanks.ATK, max: u.atkTankMaxML || _dealerTanks.ATK.max },
        };
        refresh();
      });
    });

    return () => {
      window.removeEventListener("dealer-stock-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4 italic">Real-time data on fuel in tanks / barrels / storage</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="space-y-4">
          <div className={card}>
            <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg mb-3">Total Volume Remaining</span>
            <div className="flex gap-2 mb-3">
              {dealerProducts.map((p) => (
                <span key={p} className={`text-xs font-bold px-2 py-1 rounded ${PRODUCT_COLORS[p].light} ${PRODUCT_COLORS[p].text} border ${PRODUCT_COLORS[p].border}`}>{p}</span>
              ))}
            </div>
            <div className="flex gap-4 text-sm text-white font-semibold">
              {dealerProducts.map(p => <span key={p}>{MERGED_TANKS[p].level}M L</span>)}
            </div>
          </div>
          <div className={card}>
            <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg mb-3">Recalibration Log</span>
            <p className="text-xs text-gray-500 italic">No calibration records on file. Contact your depot manager to log tank readings.</p>
          </div>
        </div>

        {/* Center + Right — 3D tanks */}
        <div className="lg:col-span-2 overflow-x-auto pb-4 pt-2 -mx-1 px-1">
          <div className="flex items-end justify-start lg:justify-center gap-6 sm:gap-10 w-max lg:w-full mx-auto">
          {dealerProducts.map((product) => {
            const { level, max } = MERGED_TANKS[product];
            const pct = Math.min(100, (level / max) * 100);
            const valueNaira = level * 1_000_000 * (_platformPrices[product] ?? 0);
            const fillColor = PRODUCT_COLORS[product].fill;
            const tankH = 200;
            const scales = Array.from({ length: 6 }, (_, i) => parseFloat(((max / 6) * (6 - i)).toFixed(1)));
            return (
              <div key={product} className="flex flex-col items-center gap-3 flex-shrink-0">
                <span className={`text-sm font-bold tracking-widest ${PRODUCT_COLORS[product].text}`}>{product}</span>
                <div className="flex items-end gap-2">
                  {/* Scale */}
                  <div className="flex flex-col justify-between text-right pr-1" style={{ height: tankH }}>
                    {scales.map((m) => <span key={m} className="text-[9px] text-gray-600 leading-none">{m}M</span>)}
                  </div>

                  {/* 3D Tank */}
                  <div className="relative" style={{ width: 72 }}>
                    {/* Top ellipse cap */}
                    <div
                      className="relative z-20"
                      style={{
                        height: 16,
                        borderRadius: "50%",
                        background: "linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.08)",
                        marginBottom: -2,
                      }}
                    />

                    {/* Tank body */}
                    <div
                      className="relative overflow-hidden z-10"
                      style={{
                        height: tankH,
                        borderRadius: "0 0 12px 12px",
                        background: "linear-gradient(to right, #0a0a0a 0%, #1c1c2e 12%, #141420 50%, #1c1c2e 88%, #0a0a0a 100%)",
                        boxShadow: "4px 0 16px rgba(0,0,0,0.6), -4px 0 16px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* Liquid fill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
                        style={{
                          height: `${pct}%`,
                          background: `linear-gradient(to right, ${fillColor}99 0%, ${fillColor}dd 40%, ${fillColor}ff 55%, ${fillColor}dd 70%, ${fillColor}88 100%)`,
                        }}
                      >
                        {/* Liquid surface shimmer */}
                        <div
                          className="absolute top-0 left-0 right-0"
                          style={{
                            height: 6,
                            background: `linear-gradient(to right, transparent, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.15) 70%, transparent)`,
                            borderRadius: "50% 50% 0 0 / 6px 6px 0 0",
                          }}
                        />
                        {/* Stripe lines on fill */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(255,255,255,0.04) 8px,rgba(255,255,255,0.04) 9px)",
                          }}
                        />
                      </div>

                      {/* Left edge shadow */}
                      <div
                        className="absolute inset-y-0 left-0 pointer-events-none z-10"
                        style={{ width: 16, background: "linear-gradient(to right, rgba(0,0,0,0.75), transparent)" }}
                      />
                      {/* Right edge shadow */}
                      <div
                        className="absolute inset-y-0 right-0 pointer-events-none z-10"
                        style={{ width: 16, background: "linear-gradient(to left, rgba(0,0,0,0.7), transparent)" }}
                      />
                      {/* Left highlight stripe */}
                      <div
                        className="absolute inset-y-0 pointer-events-none z-10"
                        style={{ left: 12, width: 5, background: "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 60%, transparent)" }}
                      />

                      {/* Percentage label */}
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <span className="text-white text-xs font-bold drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </div>

                    {/* Bottom ellipse */}
                    <div
                      className="relative z-20"
                      style={{
                        height: 12,
                        borderRadius: "50%",
                        background: "linear-gradient(180deg, #111 0%, #222 100%)",
                        marginTop: -2,
                        boxShadow: "0 6px 16px rgba(0,0,0,0.8)",
                      }}
                    />
                  </div>
                </div>

                <span className="text-base font-bold text-white">{level}M L</span>
                <span className={`text-xs font-semibold ${PRODUCT_COLORS[product].text}`}>
                  ₦{(valueNaira / 1_000_000_000).toFixed(2)}B
                </span>
              </div>
            );
          })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Section: Stock Value ──────────────────────────────────────────────────────
function SectionStockValue() {
  const [salesModal, setSalesModal] = useState<"high" | "low" | null>(null);
  const [allTimeHigh, setAllTimeHigh] = useState<any[]>([]);
  const [allTimeLow, setAllTimeLow]   = useState<any[]>([]);
  const [tanks, setTanks] = useState(() => getDealerTanks());

  useEffect(() => {
    const refresh = () => setTanks(getDealerTanks());
    window.addEventListener("dealer-stock-updated", refresh);
    window.addEventListener("dealer-prices-updated", refresh);
    return () => {
      window.removeEventListener("dealer-stock-updated", refresh);
      window.removeEventListener("dealer-prices-updated", refresh);
    };
  }, []);

  useEffect(() => {
    if (!_dealerEmail) return;
    import("@/lib/db-client").then(({ api }) => {
      api.transactions.list({ userRole: "Bulk Dealer", limit: 500 } as any).then((result) => {
        if (!result?.data?.length) return;
        const txns = result.data
          .filter((t: any) => t.user === _dealerName || t.userEmail === _dealerEmail)
          .map((t: any) => ({
            date:    (t.date || t.createdAt || "").split("T")[0],
            product: t.product || "",
            qty:     t.quantity || "",
            buyer:   t.notes || t.reference || "",
            amount:  t.totalAmount || "",
          }));
        const sorted = [...txns].sort((a, b) => {
          const aNum = parseFloat(String(a.amount).replace(/[₦,]/g, "") || "0");
          const bNum = parseFloat(String(b.amount).replace(/[₦,]/g, "") || "0");
          return bNum - aNum;
        });
        setAllTimeHigh(sorted.slice(0, 3));
        setAllTimeLow([...sorted].reverse().slice(0, 3));
      }).catch(() => null);
    });
  }, []);

  const totalValue = computeStockValue();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left */}
      <div className="space-y-4">
        <div className={card}>
          <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg mb-3">Worth of current stock in NAIRA</span>
          <p className="text-3xl font-bold text-white mb-4">₦{totalValue.toLocaleString()}</p>
          <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg mb-3">Product Valuation</span>
          <div className="grid grid-cols-3 gap-px bg-gray-700 rounded-lg overflow-hidden text-center">
            {(["ATK","AGO","PMS"] as const).map((p) => {
              const val = tanks[p].level * 1_000_000 * (_platformPrices[p] ?? 0);
              return (
                <div key={p} className={`${PRODUCT_COLORS[p].light} py-2`}>
                  <p className={`text-xs font-bold ${PRODUCT_COLORS[p].text}`}>{p}</p>
                  <p className="text-xs text-white font-semibold mt-1">₦{val.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className={card}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price Update Log</p>
          <p className="text-xs text-gray-500 italic">No price update history on file.</p>
        </div>
      </div>

      {/* Right */}
      <div className="space-y-4">
        <div className={card}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <button onClick={() => setSalesModal("high")} className={`${gBtn} w-full mb-2 text-xs`}>All time high sales</button>
              {allTimeHigh.length > 0 ? (
                <>
                  <p className="text-white font-bold text-center">{allTimeHigh[0].amount}</p>
                  <p className="text-[10px] text-gray-500 text-center">{allTimeHigh[0].product}</p>
                </>
              ) : <p className="text-xs text-gray-500 text-center">No data</p>}
            </div>
            <div>
              <button onClick={() => setSalesModal("low")} className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition w-full mb-2">All time low sales</button>
              {allTimeLow.length > 0 ? (
                <>
                  <p className="text-white font-bold text-center">{allTimeLow[0].amount}</p>
                  <p className="text-[10px] text-gray-500 text-center">{allTimeLow[0].product}</p>
                </>
              ) : <p className="text-xs text-gray-500 text-center">No data</p>}
            </div>
          </div>
        </div>
        <div className={`${card} flex flex-col items-center`}>
          <MiniChart tanks={tanks} />
        </div>
      </div>

      {/* Sales modal */}
      {salesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSalesModal(null)} />
          <div className="relative z-10 bg-gray-950 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <p className="text-sm font-bold text-white">
                {salesModal === "high" ? "All Time High Sales" : "All Time Low Sales"}
              </p>
              <button onClick={() => setSalesModal(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {(salesModal === "high" ? allTimeHigh : allTimeLow).length === 0
                ? <p className="text-gray-500 text-sm text-center py-4">No transaction records found.</p>
                : (salesModal === "high" ? allTimeHigh : allTimeLow).map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-500">{s.date}</p>
                      <p className="text-sm text-white font-semibold">{s.buyer}</p>
                      <p className="text-xs text-gray-400">{s.qty} · <span className={PRODUCT_COLORS[s.product]?.text}>{s.product}</span></p>
                    </div>
                    <p className={`text-base font-bold ${salesModal === "high" ? "text-green-400" : "text-red-400"}`}>{s.amount}</p>
                  </div>
                ))
              }
            </div>
            <div className="px-6 py-3 border-t border-gray-800">
              <button onClick={() => setSalesModal(null)} className={`${gBtn} w-full`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Daily Dispense/Usage ────────────────────────────────────────────
function SectionDailyDispense() {
  const [subTab, setSubTab] = useState("Dispense Record");
  const subTabs = ["Dispense Record", "Daily Usage Summary"];
  const [dispenseRecords, setDispenseRecords] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!_dealerEmail) return;
    import("@/lib/db-client").then(({ api }) => {
      api.transactions.list({ type: "Supply Fulfillment", userRole: "Bulk Dealer", limit: 200 } as any).then((result) => {
        if (!result?.data) return;
        const todayTxns = result.data.filter((t: any) =>
          (t.user === _dealerName || t.userEmail === _dealerEmail) &&
          (t.date || t.createdAt || "").startsWith(today)
        );
        setDispenseRecords(todayTxns);
      }).catch(() => null);
    });
  }, [today]);

  const summary = (["PMS","AGO","ATK"] as const).map((p) => {
    const recs = dispenseRecords.filter((r) => r.product === p);
    const vol = recs.reduce((acc, r) => acc + parseLiters(r.quantity || ""), 0);
    const rev = recs.reduce((acc, r) => acc + parseFloat(String(r.totalAmount || "0").replace(/[₦,]/g, "")), 0);
    return { product: p, vol, rev };
  });
  const totalRev = summary.reduce((acc, s) => acc + s.rev, 0);

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {subTabs.map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${subTab === t ? "bg-green-600 text-white" : "bg-gray-800/60 text-gray-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {subTab === "Dispense Record" && (
        <div className={card}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800">
                {["Date","Reference","Product","Qty Dispensed","Amount","Status"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-800/50">
                {dispenseRecords.length === 0
                  ? <tr><td colSpan={6} className="text-center text-gray-500 py-8 text-sm">No dispense records for today.</td></tr>
                  : dispenseRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-white/5 transition">
                      <td className="px-3 py-2.5 text-gray-300 text-xs">{(r.date || r.createdAt || "").split("T")[0]}</td>
                      <td className="px-3 py-2.5 text-green-400 font-mono text-xs">{r.reference || r._id}</td>
                      <td className="px-3 py-2.5"><span className={`text-xs font-bold ${PRODUCT_COLORS[r.product]?.text}`}>{r.product}</span></td>
                      <td className="px-3 py-2.5 text-gray-300">{r.quantity}</td>
                      <td className="px-3 py-2.5 text-white font-semibold">{r.totalAmount}</td>
                      <td className="px-3 py-2.5"><span className={statusBadge(r.status || "Pending")}>{r.status || "Pending"}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "Daily Usage Summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.map(({ product: p, vol, rev }) => (
              <div key={p} className={`${card} text-center`}>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg mb-3 ${PRODUCT_COLORS[p].light} ${PRODUCT_COLORS[p].text} border ${PRODUCT_COLORS[p].border}`}>{p}</span>
                <p className="text-2xl font-bold text-white">{vol.toLocaleString()} L</p>
                <p className="text-xs text-gray-500 mt-1">Volume Dispensed Today</p>
                <p className="text-green-400 font-semibold mt-2">₦{rev.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            ))}
          </div>
          <div className={`${card} text-center`}>
            <p className="text-gray-400 text-sm">Total Daily Revenue</p>
            <p className="text-3xl font-bold text-white mt-1">₦{totalRev.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Stock Reconciliation ────────────────────────────────────────────
const DAILY_STOCK_UPDATE_KEY = "bulk_dealer_last_stock_update";
const DAILY_REMINDER_KEY = "bulk_dealer_daily_reminder_dismissed";

function SectionReconciliation() {
  const [running, setRunning]   = useState(false);
  const [toast, setToast]       = useState("");
  const [history, setHistory]   = useState<any[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [soldForm, setSoldForm] = useState({ pms: "", ago: "", atk: "" });
  const [lastUpdateDate, setLastUpdateDate] = useState<string>("");
  const [reminderDismissed, setReminderDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DAILY_STOCK_UPDATE_KEY);
    if (stored) setLastUpdateDate(stored);
    const dismissed = localStorage.getItem(DAILY_REMINDER_KEY);
    if (dismissed === "true") setReminderDismissed(true);
  }, []);

  const runRecon = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      const today = new Date().toISOString().slice(0, 10);
      const dealer = _dealerName || "Dealer";
      setHistory([
        { date: today, product: "PMS", variance: "−200,000 L", by: dealer, status: "Flagged"  },
        { date: today, product: "ATK", variance: "+20,000 L",  by: dealer, status: "Cleared"  },
        { date: today, product: "AGO", variance: "0 L",        by: dealer, status: "Cleared"  },
        ...history,
      ]);
      setToast("Reconciliation complete — results updated");
      setTimeout(() => setToast(""), 3000);
    }, 1800);
  };

  const handleUpdateSoldStock = () => {
    const pms = parseFloat(soldForm.pms) || 0;
    const ago = parseFloat(soldForm.ago) || 0;
    const atk = parseFloat(soldForm.atk) || 0;

    updateDealerStock("PMS", -pms);
    updateDealerStock("AGO", -ago);
    updateDealerStock("ATK", -atk);

    const today = new Date().toISOString().slice(0, 10);
    setLastUpdateDate(today);
    setReminderDismissed(true);
    localStorage.setItem(DAILY_STOCK_UPDATE_KEY, today);
    localStorage.setItem(DAILY_REMINDER_KEY, "true");

    // Persist each non-zero sale as a transaction record
    [{ key: "PMS", amount: pms }, { key: "AGO", amount: ago }, { key: "ATK", amount: atk }]
      .filter(p => p.amount > 0)
      .forEach(p => {
        logTransaction({
          type: "Daily Sales",
          user: _dealerName || "Bulk Dealer",
          userRole: "Bulk Dealer",
          product: p.key,
          quantity: `${p.amount.toLocaleString()} L`,
          totalAmount: `₦${(p.amount * (_platformPrices[p.key] ?? 0)).toLocaleString()}`,
          status: "Completed",
          depot: "",
          reference: `DAILY-${today}-${p.key}-${Date.now()}`,
        });
      });

    setSoldForm({ pms: "", ago: "", atk: "" });
    setShowUpdateForm(false);
    setToast("Daily sales stock updated successfully!");
    setTimeout(() => setToast(""), 3000);
  };

  const today = new Date().toISOString().slice(0, 10);
  const hasUpdatedToday = lastUpdateDate === today;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 px-4 py-3 rounded-lg text-sm font-semibold shadow-lg text-center sm:text-left ${toast.includes("successfully") ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast}
        </div>
      )}

      {/* Update Sold Stock — bottom sheet on mobile, centered modal on desktop */}
      {showUpdateForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateForm(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
            {/* drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>
            <div className="px-6 pt-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-bold text-base">Update Sold Stock</p>
                <button onClick={() => setShowUpdateForm(false)} className="text-gray-500 hover:text-white transition p-1 -mr-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-400 text-xs mb-5">Enter the volume sold today for each product (in litres).</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(["pms", "ago", "atk"] as const).map((p) => (
                  <div key={p}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{p}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      value={soldForm[p]}
                      onChange={(e) => setSoldForm((f) => ({ ...f, [p]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                    />
                    <span className="text-gray-600 text-xs mt-1 block">litres</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowUpdateForm(false)} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSoldStock}
                  disabled={!soldForm.pms && !soldForm.ago && !soldForm.atk}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition"
                >
                  Save Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reminder Banner */}
      {!hasUpdatedToday && !reminderDismissed && (
        <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-orange-400 font-semibold text-sm">Daily Stock Update Required</p>
              <p className="text-orange-300 text-xs mt-0.5">You haven&apos;t updated your sold stock for today. Please record your daily sales before reconciling.</p>
            </div>
            {/* Desktop button inline */}
            <button onClick={() => setShowUpdateForm(true)} className="hidden sm:block flex-shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded transition">
              Update Now
            </button>
          </div>
          {/* Mobile button full-width below */}
          <button onClick={() => setShowUpdateForm(true)} className="sm:hidden mt-3 w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-lg transition">
            Update Now
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-400">
          Reconciliation as of{" "}
          <span className="text-white font-semibold">
            {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpdateForm(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Update Sold Stock</span>
          </button>
          <button
            onClick={runRecon}
            disabled={running}
            className={`flex-1 sm:flex-none ${gBtn} flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {running && (
              <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {running ? "Running…" : "Run Reconciliation"}
          </button>
        </div>
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([] as any[]).map((r: any) => (
          <div key={r.product} className={card}>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg mb-3 ${PRODUCT_COLORS[r.product].light} ${PRODUCT_COLORS[r.product].text} border ${PRODUCT_COLORS[r.product].border}`}>
              {r.product}
            </span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Expected</span><span className="text-white">{r.expected}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Actual</span><span className="text-white">{r.actual}</span></div>
              <div className="flex justify-between border-t border-gray-800 pt-2">
                <span className="text-gray-500">Variance</span>
                <span className={`font-bold ${r.variance.startsWith("−") ? "text-red-400" : r.variance === "0 L" ? "text-gray-500" : "text-green-400"}`}>{r.variance}</span>
              </div>
              <div className="pt-1"><span className={statusBadge(r.status)}>{r.status}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Reconciliation History */}
      <div className={card}>
        <p className="text-sm font-semibold text-white mb-3">Reconciliation History</p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase">Date</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase">Product</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase">Variance</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase hidden sm:table-cell">Reconciled By</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {history.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-bold ${PRODUCT_COLORS[r.product].text}`}>{r.product}</span>
                  </td>
                  <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${r.variance.startsWith("−") ? "text-red-400" : r.variance === "0 L" ? "text-gray-500" : "text-green-400"}`}>
                    {r.variance}
                  </td>
                  <td className="px-3 py-2.5 text-gray-300 hidden sm:table-cell">{r.by}</td>
                  <td className="px-3 py-2.5"><span className={statusBadge(r.status)}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Allocations ────────────────────────────────────────────────────────

function SectionAllocations() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [filter, setFilter]           = useState("All");
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState("");
  const [orderModal, setOrderModal]   = useState<any | null>(null);
  const [orderQty, setOrderQty]       = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const statuses = ["All", "Active", "Exhausted", "Expired", "Revoked"];
  const counts: Record<string, number> = { All: allocations.length };
  statuses.slice(1).forEach((s) => { counts[s] = allocations.filter((a) => a.status === s).length; });
  const filtered = filter === "All" ? allocations : allocations.filter((a) => a.status === filter);

  useEffect(() => {
    if (!_dealerEmail) return;
    import("@/lib/db-client").then(({ api }) => {
      api.allocations.list({ dealerEmail: _dealerEmail, limit: 200 }).then((result: any) => {
        setAllocations(result?.data ?? []);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openOrderModal = (alloc: any) => {
    setOrderModal(alloc);
    setOrderQty("");
  };

  const submitOrder = async () => {
    if (!orderModal) return;
    const qty = parseInt(orderQty);
    const remaining = orderModal.volumeLitres - orderModal.usedLitres;
    if (!qty || qty < 1) { showToast("Enter a valid quantity"); return; }
    if (qty > remaining) { showToast(`Cannot exceed remaining allocation (${remaining.toLocaleString()} L)`); return; }
    setSubmitting(true);
    const { api } = await import("@/lib/db-client");
    const price = _platformPrices[orderModal.product] ?? 0;
    const orderId = `ALLOC-${orderModal.allocationId}-${Date.now()}`;
    try {
      const poDoc = await api.purchaseOrders.create({
        orderId,
        dealer: _dealerEmail,
        companyName: _dealerName,
        loadingDepot: orderModal.depot,
        productType: orderModal.product,
        productQuantity: qty,
        pricePerLitre: price,
        totalAmount: qty * price,
        paymentMethod: "bank_transfer",
        transactionRef: orderId,
        haulageTruck: "Owned Truck",
        ownerName: _dealerName,
        ownerEmail: _dealerEmail,
        ownerTelephone: "",
        ownerAddress: "",
        ownerIdType: "nin",
        ownerIdNumber: "",
        companyAddress: "",
        companyTelephone: "",
        companyEmail: _dealerEmail,
        dprRegNo: "",
        cacRegNo: "",
        stationAddress: "",
      } as any);

      // Create Transaction and cross-link with PurchaseOrder
      const txnDoc = await api.transactions.create({
        txnId:         `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        type:          "Purchase Order",
        user:          _dealerName || "Bulk Dealer",
        userEmail:     _dealerEmail,
        userRole:      "Bulk Dealer",
        product:       orderModal.product,
        quantity:      String(qty),
        totalAmount:   qty * price,
        status:        "Pending",
        paymentMethod: "bank_transfer",
        depot:         orderModal.depot,
        reference:     orderId,
        referenceType: "purchase_order",
        ...(poDoc?._id ? { referenceId: poDoc._id } : {}),
      } as any).catch(() => null);

      if (txnDoc?._id && poDoc?._id) {
        api.purchaseOrders.update(String(poDoc._id), { transactionId: txnDoc._id } as any).catch(() => null);
      }

      showToast("Order submitted successfully!");
      setOrderModal(null);
    } catch {
      showToast("Failed to submit order");
    }
    setSubmitting(false);
  };

  const allocationStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      Active:    "bg-green-900/50 text-green-400 border border-green-800",
      Exhausted: "bg-orange-900/50 text-orange-400 border border-orange-800",
      Expired:   "bg-gray-800/60 text-gray-400 border border-gray-700",
      Revoked:   "bg-red-900/50 text-red-400 border border-red-800",
    };
    return `inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[s] ?? map.Expired}`;
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-semibold shadow-lg ${toast.includes("success") ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast}
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <p className="text-white font-semibold text-base mb-1">Request Order</p>
            <p className="text-xs text-gray-400 mb-4">Allocation: <span className="font-mono text-green-400">{orderModal.allocationId}</span></p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div><p className={label}>Product</p><p className={`font-bold ${PRODUCT_COLORS[orderModal.product]?.text}`}>{orderModal.product}</p></div>
              <div><p className={label}>Depot</p><p className="text-gray-300">{orderModal.depot}</p></div>
              <div><p className={label}>Allocated</p><p className="text-white">{Number(orderModal.volumeLitres).toLocaleString()} L</p></div>
              <div><p className={label}>Remaining</p><p className="text-green-400 font-semibold">{Number(orderModal.volumeLitres - orderModal.usedLitres).toLocaleString()} L</p></div>
            </div>
            <div className="mb-4">
              <p className={label}>Order Quantity (Litres)</p>
              <input
                type="number"
                min={1}
                max={orderModal.volumeLitres - orderModal.usedLitres}
                placeholder={`Max ${(orderModal.volumeLitres - orderModal.usedLitres).toLocaleString()} L`}
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                className={inputCls}
              />
              {orderQty && !isNaN(parseInt(orderQty)) && (
                <p className="text-xs text-gray-400 mt-1">
                  Est. amount: <span className="text-white font-semibold">₦{(parseInt(orderQty) * (_platformPrices[orderModal.product] ?? 0)).toLocaleString()}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={submitOrder} disabled={submitting} className={`${gBtn} flex-1 disabled:opacity-50`}>
                {submitting ? "Submitting…" : "Submit Order"}
              </button>
              <button onClick={() => setOrderModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${filter === s ? "bg-green-600 text-white" : "bg-gray-800/60 text-gray-400 hover:text-white"}`}>
            {s} <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === s ? "bg-white/20" : "bg-gray-700"}`}>{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm text-center py-8">Loading allocations…</p>}

      {!loading && filtered.length === 0 && (
        <div className={`${card} text-center py-10`}>
          <p className="text-gray-500 text-sm">No allocations found.</p>
          <p className="text-gray-600 text-xs mt-1">Contact admin to request a fuel allocation.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const used      = Number(a.usedLitres ?? 0);
            const total     = Number(a.volumeLitres ?? 0);
            const remaining = total - used;
            const pct       = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            const isActive  = a.status === "Active" && remaining > 0;
            const col       = PRODUCT_COLORS[a.product] ?? PRODUCT_COLORS["PMS"];
            return (
              <div key={a._id} className={`${card} flex flex-col gap-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-green-400">{a.allocationId}</p>
                    <p className={`text-xs font-bold mt-0.5 ${col.text}`}>{a.product} — {a.depot}</p>
                  </div>
                  <span className={allocationStatusBadge(a.status)}>{a.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800/60 rounded-lg px-2 py-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Allocated</p>
                    <p className="text-sm font-semibold text-white">{total.toLocaleString()} L</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg px-2 py-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Used</p>
                    <p className="text-sm font-semibold text-orange-400">{used.toLocaleString()} L</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg px-2 py-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Remaining</p>
                    <p className={`text-sm font-semibold ${remaining > 0 ? "text-green-400" : "text-gray-500"}`}>{remaining.toLocaleString()} L</p>
                  </div>
                </div>

                {/* Usage bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>{pct}% used</span>
                    <span>Valid {a.validFrom ? new Date(a.validFrom).toLocaleDateString() : "—"} – {a.validTo ? new Date(a.validTo).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-orange-500" : "bg-green-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {isActive && (
                  <button onClick={() => openOrderModal(a)} className={`${gBtn} w-full text-center`}>
                    Request Order
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section: Sales History ────────────────────────────────────────────────────
function SectionSalesHistory() {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("All");
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    if (!_dealerEmail) return;
    import("@/lib/db-client").then(({ api }) => {
      api.transactions.list({ userRole: "Bulk Dealer", limit: 200 } as any).then((result) => {
        if (!result?.data?.length) return;
        const dealerTxns = result.data.filter((t: any) => t.user === _dealerName || t.userEmail === _dealerEmail);
        setSales(dealerTxns.map((t: any) => ({
          date:    t.date || t.createdAt?.split("T")[0] || "",
          product: t.product || "",
          qty:     t.quantity || "",
          buyer:   t.notes || t.reference || "",
          amount:  t.totalAmount || "",
          margin:  "—",
        })));
      }).catch(() => null);
    });
  }, []);

  const filtered = sales.filter((s) => {
    if (productFilter !== "All" && s.product !== productFilter) return false;
    if (search && ![s.buyer, s.product, s.date].some((v) => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  const totalRev = sales.length
    ? "₦" + sales.reduce((acc, s) => acc + parseFloat(String(s.amount).replace(/[₦,]/g, "") || "0"), 0).toLocaleString()
    : "₦0";
  const totalVol = `${sales.length} records`;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Revenue", value: totalRev, color: "text-green-400" },
          { label: "Total Volume", value: totalVol, color: "text-blue-400" },
          { label: "Avg Margin", value: "12.8%", color: "text-orange-400" },
        ].map((s) => (
          <div key={s.label} className={`${card} text-center`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search buyer, product…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} max-w-xs`} />
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={`${inputCls} w-auto`}>
          <option>All</option><option>PMS</option><option>ATK</option><option>AGO</option>
        </select>
      </div>
      <div className={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">
              {["Date","Product","Qty","Buyer","Amount","Margin","Margin %"].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map((s, i) => {
                const amtNum = parseFloat(s.amount.replace(/[₦,]/g, ""));
                const marNum = parseFloat(s.margin.replace(/[₦,]/g, ""));
                const pct = amtNum > 0 ? ((marNum / amtNum) * 100).toFixed(1) : "0";
                const pctNum = parseFloat(pct);
                return (
                  <tr key={i} className="hover:bg-white/5 transition">
                    <td className="px-3 py-2.5 text-gray-300">{s.date}</td>
                    <td className="px-3 py-2.5"><span className={`text-xs font-bold ${PRODUCT_COLORS[s.product].text}`}>{s.product}</span></td>
                    <td className="px-3 py-2.5 text-gray-300">{s.qty}</td>
                    <td className="px-3 py-2.5 text-white">{s.buyer}</td>
                    <td className="px-3 py-2.5 text-white font-semibold">{s.amount}</td>
                    <td className="px-3 py-2.5 text-green-400">{s.margin}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pctNum >= 10 ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section: View Profit Margin ──────────────────────────────────────────────
function SectionProfitMargin() {
  const [tanks, setTanks] = useState(() => getDealerTanks());
  const [prices, setPrices] = useState({ ..._platformPrices });

  useEffect(() => {
    const refresh = () => { setTanks(getDealerTanks()); setPrices({ ..._platformPrices }); };
    window.addEventListener("dealer-stock-updated", refresh);
    window.addEventListener("dealer-prices-updated", refresh);
    return () => {
      window.removeEventListener("dealer-stock-updated", refresh);
      window.removeEventListener("dealer-prices-updated", refresh);
    };
  }, []);

  const totalValue = (["PMS","AGO","ATK"] as const).reduce((acc, p) => acc + tanks[p].level * 1_000_000 * (prices[p] ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["PMS","ATK","AGO"] as const).map((p) => {
          const buyPrice = prices[p] ?? 0;
          return (
            <div key={p} className={card}>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg mb-4 ${PRODUCT_COLORS[p].light} ${PRODUCT_COLORS[p].text} border ${PRODUCT_COLORS[p].border}`}>{p}</span>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Platform Price / L</span><span className="text-white">₦{buyPrice.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Current Stock</span><span className="text-white">{tanks[p].level}M L</span></div>
                <div className="flex justify-between border-t border-gray-800 pt-2">
                  <span className="text-gray-500">Stock Value</span>
                  <span className="text-green-400 font-bold">₦{(tanks[p].level * 1_000_000 * buyPrice).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[{ label: "Total Portfolio Value", value: `₦${totalValue.toLocaleString()}`, color: "text-white" },
          { label: "Platform Prices Source", value: "Live from admin settings", color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className={`${card} text-center`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className={card}>
        <p className="text-sm font-semibold text-white mb-2">Margin History by Week</p>
        <p className="text-xs text-gray-500 italic">Weekly margin history is not yet available. Data will appear here once transaction history builds up.</p>
      </div>
    </div>
  );
}

// ─── Section: Low Stock Alert ──────────────────────────────────────────────────
function SectionLowStockAlert() {
  const [thresh, setThresh] = useState<Record<string, number>>({ PMS: 1.5, ATK: 1.0, AGO: 1.5 });
  const [tanks, setTanks] = useState(() => getDealerTanks());
  const [toast, setToast] = useState("");

  useEffect(() => {
    const refresh = () => setTanks(getDealerTanks());
    window.addEventListener("dealer-stock-updated", refresh);
    return () => window.removeEventListener("dealer-stock-updated", refresh);
  }, []);

  const saveThreshold = (p: string) => {
    setToast(`${p} threshold saved — ${thresh[p]}M L`);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold shadow-lg">{toast}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["PMS","ATK","AGO"] as const).map((p) => {
          const level = tanks[p].level;
          const t = thresh[p];
          const status = level < t ? "Critical" : level < t * 1.5 ? "Warning" : "OK";
          const statusColor = status === "Critical" ? "text-red-400" : status === "Warning" ? "text-yellow-400" : "text-green-400";
          const dotColor = status === "Critical" ? "bg-red-500" : status === "Warning" ? "bg-yellow-500" : "bg-green-500";
          return (
            <div key={p} className={card}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-lg ${PRODUCT_COLORS[p].light} ${PRODUCT_COLORS[p].text} border ${PRODUCT_COLORS[p].border}`}>{p}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Current Level</span><span className="text-white font-semibold">{level}M L</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Alert Threshold</span><span className={statusColor}>{t}M L</span></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Set Threshold (M L)</p>
                <div className="flex gap-2">
                  <input type="number" step="0.1" value={thresh[p]}
                    onChange={(e) => setThresh({ ...thresh, [p]: parseFloat(e.target.value) || 0 })}
                    className={`${inputCls} flex-1`} />
                  <button onClick={() => saveThreshold(p)} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition">Save</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={card}>
        <p className="text-sm font-semibold text-white mb-1">Current Status</p>
        {(["PMS","ATK","AGO"] as const).some(p => tanks[p].level < thresh[p]) ? (
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <p className="text-red-400 text-sm font-semibold">
              {(["PMS","ATK","AGO"] as const).filter(p => tanks[p].level < thresh[p]).join(", ")} below threshold — restock needed
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <p className="text-green-400 text-sm font-semibold">No active alerts — all stock levels are healthy</p>
          </div>
        )}
      </div>
      <div className={card}>
        <p className="text-sm font-semibold text-white mb-2">Alert History</p>
        <p className="text-xs text-gray-500 italic">No historical alert records on file.</p>
      </div>
    </div>
  );
}

// ─── Section: Buyers ──────────────────────────────────────────────────────────

function SectionBuyers() {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [stateFilter, setStateFilter] = useState("All States");
  const [buyers, setBuyers] = useState<any[]>([]);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.users.list({ role: "customer", limit: 200 } as any).then((result) => {
        if (!result?.data?.length) return;
        setBuyers(result.data.map((u: any) => ({
          id:          u._id || u.id,
          name:        u.name || u.email,
          state:       u.state || u.location || "—",
          contact:     u.email,
          phone:       u.phone || "—",
          products:    ["PMS"],
          orders:      0,
          total:       "₦0",
          outstanding: "₦0",
          status:      u.status === "suspended" ? "Inactive" : "Active",
        })));
      }).catch(() => null);
    });
  }, []);

  const states = ["All States", ...Array.from(new Set(buyers.map((b) => b.state))).filter((s) => s !== "—")];

  const filtered = buyers.filter((b) => {
    if (stateFilter !== "All States" && b.state !== stateFilter) return false;
    if (search && ![b.name, b.contact, b.id].some((v) => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const totalRevenue = buyers.reduce((s, b) => s + parseFloat(b.total.replace(/[₦,]/g, "")), 0);
  const totalOutstanding = buyers.reduce((s, b) => s + parseFloat(b.outstanding.replace(/[₦,]/g, "")), 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Buyers",      value: buyers.length.toString(),                              color: "text-green-400"  },
          { label: "Active",            value: buyers.filter((b) => b.status === "Active").length.toString(), color: "text-green-400" },
          { label: "Total Revenue",     value: "₦" + (totalRevenue / 1e9).toFixed(2) + "B",               color: "text-white"      },
          { label: "Outstanding",       value: "₦" + (totalOutstanding / 1e6).toFixed(1) + "M",           color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className={`${card} text-center`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="Search buyer, contact, ID…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} max-w-xs`} />
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={`${inputCls} w-auto`}>
          {states.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={card}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">
              {["ID","Buyer","State","Contact","Products","Orders","Total Revenue","Outstanding","Status",""].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-2.5 font-mono text-xs text-green-400">{b.id}</td>
                  <td className="px-3 py-2.5 text-white font-semibold whitespace-nowrap">{b.name}</td>
                  <td className="px-3 py-2.5 text-gray-400">{b.state}</td>
                  <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{b.contact}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {b.products.map((p: string) => <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRODUCT_COLORS[p]?.light} ${PRODUCT_COLORS[p]?.text} border ${PRODUCT_COLORS[p]?.border}`}>{p}</span>)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300 text-center">{b.orders}</td>
                  <td className="px-3 py-2.5 text-white font-semibold whitespace-nowrap">{b.total}</td>
                  <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${b.outstanding === "₦0" ? "text-gray-500" : "text-yellow-400"}`}>{b.outstanding}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${b.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-gray-500/20 text-gray-400 border-gray-500/40"}`}>{b.status}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => setSelected(b)} className="text-xs text-green-400 hover:text-green-300 font-semibold transition">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buyer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 bg-gray-950 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <p className="text-sm font-bold text-white">{selected.name}</p>
                <p className="text-xs text-gray-500 font-mono">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "State",       value: selected.state    },
                  { label: "Contact",     value: selected.contact  },
                  { label: "Phone",       value: selected.phone    },
                  { label: "Total Orders",value: selected.orders.toString() },
                  { label: "Total Revenue",value: selected.total   },
                  { label: "Outstanding", value: selected.outstanding },
                ].map((r) => (
                  <div key={r.label} className="bg-gray-900/50 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">{r.label}</p>
                    <p className={`text-sm font-semibold ${r.label === "Outstanding" && r.value !== "₦0" ? "text-yellow-400" : "text-white"}`}>{r.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900/50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-gray-500 mb-2">Products Purchased</p>
                <div className="flex gap-2">
                  {selected.products.map((p: string) => <span key={p} className={`text-xs font-bold px-3 py-1 rounded-lg ${PRODUCT_COLORS[p]?.light} ${PRODUCT_COLORS[p]?.text} border ${PRODUCT_COLORS[p]?.border}`}>{p}</span>)}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-gray-500 mb-1">Account Status</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${selected.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-gray-500/20 text-gray-400 border-gray-500/40"}`}>{selected.status}</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => {
                  setSelected(null);
                  window.dispatchEvent(new CustomEvent("bulk-nav", { detail: { section: "Allocations" } }));
                }}
                className={`${gBtn} flex-1`}
              >
                Create Order for Buyer
              </button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Customer Requests ───────────────────────────────────────────────

interface SupplyRequest {
  id: string;
  stationName: string;
  product: "PMS" | "AGO" | "ATK";
  depot: string;
  quantity: string;
  priority: "normal" | "urgent" | "emergency";
  deliveryDate: string;
  notes: string;
  requestedBy: string;
  requestedAt: string;
  status: "Pending" | "Processing" | "Delivered" | "Cancelled";
}

function pushCustomerNotification(notif: { type: string; title: string; message: string; href: string }) {
  import("@/lib/db-client").then(({ api }) => {
    (api.notifications as any)?.create?.({ ...notif, timestamp: new Date().toISOString(), read: false }).catch(() => null);
  }).catch(() => null);
}

function SectionCustomerRequests() {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<SupplyRequest | null>(null);
  const [toast, setToastMsg] = useState("");

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.supplyRequests.list({ limit: 200 } as any).then((result) => {
        if (result?.data?.length) { setRequests(result.data as any); return; }
        setRequests([
        { id: "SUP-REQ-001", stationName: "Sunrise Filling Station - Lagos", product: "PMS", depot: "Lagos Main Depot", quantity: "33,000 L", priority: "urgent", deliveryDate: "2026-03-30", notes: "Running low urgently", requestedBy: "Jane Customer", requestedAt: "2026-03-27T09:00:00Z", status: "Processing" },
        { id: "SUP-REQ-002", stationName: "Sunrise Filling Station - Lekki", product: "AGO", depot: "Port Harcourt Terminal", quantity: "25,000 L", priority: "normal", deliveryDate: "2026-04-02", notes: "", requestedBy: "Jane Customer", requestedAt: "2026-03-26T14:30:00Z", status: "Pending" },
        { id: "SUP-REQ-003", stationName: "Okafor Energy - Onitsha", product: "PMS", depot: "Enugu Fuel Depot", quantity: "45,000 L", priority: "emergency", deliveryDate: "2026-03-29", notes: "Critical - station down to 5%", requestedBy: "Emeka Okafor", requestedAt: "2026-03-28T07:00:00Z", status: "Pending" },
        { id: "SUP-REQ-004", stationName: "Bello Filling Station - Abuja", product: "ATK", depot: "Abuja Central Terminal", quantity: "15,000 L", priority: "normal", deliveryDate: "2026-04-05", notes: "", requestedBy: "Fatima Bello", requestedAt: "2026-03-25T11:00:00Z", status: "Delivered" },
        // Walk-in / phone orders not on platform
        { id: "SUP-REQ-EXT-001", stationName: "Ogunleye Filling Station - Ibadan", product: "PMS", depot: "Ibadan Storage Terminal", quantity: "20,000 L", priority: "normal", deliveryDate: "2026-04-06", notes: "Walk-in order, not a platform user", requestedBy: "Tunde Ogunleye (External)", requestedAt: "2026-03-28T10:00:00Z", status: "Pending" },
        { id: "SUP-REQ-EXT-002", stationName: "Eze Brothers Gas - Enugu", product: "AGO", depot: "Enugu Fuel Depot", quantity: "18,000 L", priority: "urgent", deliveryDate: "2026-03-31", notes: "Phone order — pay on delivery", requestedBy: "Chukwu Eze (External)", requestedAt: "2026-03-27T14:00:00Z", status: "Pending" },
        ]);
      }).catch(() => null);
    });
  }, []);

  const setToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const update = (id: string, status: SupplyRequest["status"]) => {
    const req = requests.find(r => r.id === id);
    const next = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(next);
    if (/^[a-f\d]{24}$/i.test(id)) {
      import("@/lib/db-client").then(({ api }) => {
        api.supplyRequests.update(id, { status } as any).catch(() => null);
      });
    }
    // Notify customer if they are a platform user (non-external)
    if (req && !req.requestedBy.includes("External")) {
      if (status === "Processing") pushCustomerNotification({ type: "supply", title: "Supply Request Processing", message: `Your request (${id}) for ${req.quantity} of ${req.product} is now being processed by your bulk dealer.`, href: "/customer" });
      if (status === "Delivered") pushCustomerNotification({ type: "supply", title: "Supply Delivered", message: `Your supply of ${req.quantity} ${req.product} to ${req.stationName} has been delivered.`, href: "/customer" });
      if (status === "Cancelled") pushCustomerNotification({ type: "supply", title: "Supply Request Cancelled", message: `Your supply request (${id}) for ${req.quantity} of ${req.product} has been cancelled.`, href: "/customer" });
    }
    // Deduct from dealer stock and log fulfillment
    if (req && status === "Delivered") {
      updateDealerStock(req.product, -parseLiters(req.quantity));
      logTransaction({ type: "Supply Fulfillment", user: _dealerName || "Bulk Dealer", userRole: "Bulk Dealer", product: req.product, quantity: req.quantity, totalAmount: "0", status: "Completed", depot: req.depot, reference: req.id });
    }
    setToast(`Request ${id} → ${status}`);
    if (selected?.id === id) setSelected(p => p ? { ...p, status } : null);
  };

  const pc = (p: string) => p === "emergency" ? "bg-red-500/20 text-red-400 border-red-500/40" : p === "urgent" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" : "bg-gray-500/20 text-gray-400 border-gray-500/40";
  const sc = (s: string) => s === "Delivered" ? "bg-green-500/20 text-green-400 border-green-500/40" : s === "Processing" ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : s === "Pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" : "bg-red-500/20 text-red-400 border-red-500/40";
  const prc = (p: string) => p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-orange-400";

  const counts: Record<string, number> = { All: requests.length };
  ["Pending", "Processing", "Delivered", "Cancelled"].forEach(s => { counts[s] = requests.filter(r => r.status === s).length; });
  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[["Total", requests.length, "text-white"], ["Pending", counts.Pending, "text-yellow-400"], ["Processing", counts.Processing, "text-blue-400"], ["Delivered", counts.Delivered, "text-green-400"]].map(([l, v, c]) => (
          <div key={String(l)} className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{l}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", "Pending", "Processing", "Delivered", "Cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${filter === f ? "bg-green-600 border-green-500 text-white" : "bg-black/40 border-gray-700 text-gray-300 hover:border-green-500"}`}>
            {f} ({f === "All" ? requests.length : counts[f] ?? 0})
          </button>
        ))}
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
          <span className="col-span-2">ID</span>
          <span className="col-span-2">Station</span>
          <span className="col-span-1">Product</span>
          <span className="col-span-2">Requested By</span>
          <span className="col-span-1">Qty</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Priority</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No requests</p>}
        {filtered.map(req => (
          <div key={req.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 items-center">
            <div className="col-span-2">
              <span className="text-green-400 font-mono text-xs">{req.id}</span>
              {req.requestedBy.includes("External") && <span className="block text-orange-400 text-[10px]">External</span>}
            </div>
            <div className="col-span-2">
              <p className="text-white text-xs truncate">{req.stationName.split(" - ")[0]}</p>
              <p className="text-gray-500 text-xs truncate">{req.stationName.split(" - ")[1] || ""}</p>
            </div>
            <span className={`col-span-1 text-xs font-medium ${prc(req.product)}`}>{req.product}</span>
            <span className="col-span-2 text-gray-300 text-xs truncate">{req.requestedBy}</span>
            <span className="col-span-1 text-gray-300 text-xs">{req.quantity}</span>
            <span className="col-span-1"><span className={`inline-flex px-2 py-0.5 rounded text-xs border ${sc(req.status)}`}>{req.status}</span></span>
            <span className="col-span-1"><span className={`inline-flex px-2 py-0.5 rounded text-xs border ${pc(req.priority)}`}>{req.priority}</span></span>
            <div className="col-span-2 flex justify-end gap-1 flex-wrap">
              <button onClick={() => setSelected(req)} className="text-xs text-green-400 border border-green-500/40 px-2 py-1 rounded hover:text-green-300">View</button>
              {req.status === "Pending" && <button onClick={() => update(req.id, "Processing")} className="text-xs text-blue-400 border border-blue-500/40 px-2 py-1 rounded hover:text-blue-300">Accept</button>}
              {/* Fulfill button hidden */}
              {(req.status === "Pending" || req.status === "Processing") && <button onClick={() => update(req.id, "Cancelled")} className="text-xs text-red-400 border border-red-500/40 px-2 py-1 rounded hover:text-red-300">Decline</button>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-white font-bold">{selected.id}</h3>
                {selected.requestedBy.includes("External") && <span className="text-xs text-orange-400">External / Walk-in Order</span>}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm mb-5">
              {[["Station", selected.stationName], ["Requested By", selected.requestedBy], ["Depot", selected.depot], ["Quantity", selected.quantity], ["Delivery Date", selected.deliveryDate]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="text-white text-right">{v}</span></div>
              ))}
              <div className="flex justify-between"><span className="text-gray-400">Product</span><span className={`font-medium ${prc(selected.product)}`}>{selected.product}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Priority</span><span className={`inline-flex px-2 py-0.5 rounded text-xs border ${pc(selected.priority)}`}>{selected.priority}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={`inline-flex px-2 py-0.5 rounded text-xs border ${sc(selected.status)}`}>{selected.status}</span></div>
              {selected.notes && <div><span className="text-gray-400 block mb-1">Notes</span><p className="text-white bg-black/30 rounded p-2 text-xs">{selected.notes}</p></div>}
            </div>
            {(selected.status === "Pending" || selected.status === "Processing") && (
              <div className="flex justify-end gap-2">
                {selected.status === "Pending" && <button onClick={() => update(selected.id, "Processing")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">Accept Order</button>}
                {/* Mark Fulfilled button hidden */}
                <button onClick={() => update(selected.id, "Cancelled")} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">Decline</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm">{toast}</div>}
    </div>
  );
}

// ─── Section Map ──────────────────────────────────────────────────────────────
const SECTION_COMPONENTS: Record<string, React.FC> = {
  "Current Stock Level":  SectionCurrentStock,
  "Stock Value":          SectionStockValue,
  "Stock Reconciliation": SectionReconciliation,
  "Allocations":          SectionAllocations,
  "Customer Requests":    SectionCustomerRequests,
  "Sales History":        SectionSalesHistory,
  "View Profit Margin":   SectionProfitMargin,
  "Low Stock Alert":      SectionLowStockAlert,
  "Buyers":               SectionBuyers,
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BulkDealerDashboard() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [active, setActive]       = useState("Current Stock Level");
  const [unreadCount, setUnread]  = useState(0);

  useEffect(() => {
    let stopTracking: (() => void) | undefined;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "bulk_dealer") { router.push("/auth/login"); return; }
        setUser(u);
        _dealerEmail = u.email || "";
        _dealerName = u.name || "";
        stopTracking = startTracking({ id: u.email, name: u.name, email: u.email, role: u.role, lastSeen: Date.now() });

        // Load platform prices + notifications
        import("@/lib/db-client").then(({ api }) => {
          api.platformSettings.get().then((s: any) => {
            if (!s) return;
            _platformPrices = {
              PMS: s.pmsPricePerLitre ?? 617,
              AGO: s.agoPricePerLitre ?? 1050,
              ATK: s.atkPricePerLitre ?? 650,
            };
            window.dispatchEvent(new CustomEvent("dealer-prices-updated"));
          }).catch(() => null);
          (api.notifications as any)?.list?.({ limit: 50 }).then((result: any) => {
            if (result?.data) setUnread(result.data.filter((n: any) => !n.read).length);
          }).catch(() => null);
        }).catch(() => null);
      })
      .catch(() => router.push("/auth/login"));

    const handler = (e: Event) => {
      const section = (e as CustomEvent).detail?.section;
      if (section) setActive(section);
    };
    window.addEventListener("bulk-nav", handler);
    return () => {
      window.removeEventListener("bulk-nav", handler);
      stopTracking?.();
    };
  }, [router]);

  if (!user) return null;

  const ActiveSection = SECTION_COMPONENTS[active];

  return (
    <div
      className="min-h-screen text-white relative"
      style={{ backgroundImage: `url(${tower.src})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}
    >
      <Head><title>Bulk Dealer Portal | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5">
          <Image src="/eNnergy Logo.png" alt="e-Nergy" width={70} height={46} priority
            className="object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link href="/bulk-dealer/notifications" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            {/* Profile link */}
            <Link href="/bulk-dealer/profile"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-300 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 hover:border-green-500/40 px-3 py-1.5 rounded-full transition">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>Hi, <span className="font-semibold text-white">{user.name}</span></span>
            </Link>
            {user.dealerCode && (
              <div className="hidden sm:flex items-center gap-1.5 bg-gray-800/60 border border-gray-700 px-3 py-1.5 rounded-full">
                <span className="text-gray-400 text-xs">Code:</span>
                <span className="text-green-400 text-xs font-bold font-mono tracking-wider">{user.dealerCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(user.dealerCode!).then(() => {
                    const el = document.getElementById("copy-dealer-code-tip");
                    if (el) { el.style.opacity = "1"; setTimeout(() => { el.style.opacity = "0"; }, 1500); }
                  })}
                  className="relative ml-0.5 text-gray-500 hover:text-green-400 transition"
                  title="Copy dealer code"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span
                    id="copy-dealer-code-tip"
                    className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 transition-opacity duration-300"
                  >
                    Copied!
                  </span>
                </button>
              </div>
            )}
            <button
              onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"))}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        {/* ── Nav Buttons ── */}
        <div className="px-6 md:px-10 pb-4 space-y-2">
          {NAV_SECTIONS.map((row, ri) => (
            <div key={ri} className="flex flex-wrap gap-2">
              {row.map((section) => (
                <button
                  key={section}
                  onClick={() => setActive(section)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    active === section
                      ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20"
                      : "bg-gray-900/60 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800/80 hover:border-gray-600"
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ── Account Maintenance Fee Bar ── */}
        <AccountFeeBar />

        {/* ── Content Panel ── */}
        <div className="flex-1 px-6 md:px-10 pb-6">
          <div className="bg-black/30 backdrop-blur-md border border-gray-700/60 rounded-2xl p-6">
            <p className="text-lg font-bold text-white mb-5">{active}</p>
            <ActiveSection />
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="px-6 py-4 border-t border-gray-800/60 flex items-center justify-center gap-6 text-xs text-gray-500">
          <Link href="/contact"        className="hover:text-gray-300 transition">Contact</Link>
          <span className="text-gray-700">|</span>
          <Link href="/privacy-policy" className="hover:text-gray-300 transition">Privacy Policy</Link>
          <span className="text-gray-700">|</span>
          <Link href="/about"          className="hover:text-gray-300 transition">About Us</Link>
        </footer>
      </div>
    </div>
  );
}
