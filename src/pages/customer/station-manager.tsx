"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";
import { useDepot, ProductKey } from "../../context/DepotContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductStock {
  product: "PMS" | "AGO" | "ATK";
  capacity: number;
  current: number;
  price: string;
  lastSupplied: string;
  status: "Available" | "Limited" | "Critical" | "Empty";
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  shift: "Morning" | "Afternoon" | "Night";
  status: "Active" | "Off Duty" | "On Leave";
}

interface SupplyRecord {
  id: string;
  date: string;
  product: "PMS" | "AGO" | "ATK";
  quantity: string;
  depot: string;
  status: "Completed" | "Processing" | "Pending" | "Cancelled";
  truckReg: string;
}

interface Station {
  _dbId?: string;
  id: string;
  name: string;
  address: string;
  state: string;
  licenseNo: string;
  dprNo: string;
  phone: string;
  email: string;
  openingHours: string;
  status: "Active" | "Inactive" | "Suspended";
  manager: string;
  managerPhone: string;
  stock: ProductStock[];
  staff: StaffMember[];
  supplies: SupplyRecord[];
}

// ─── FuelStation → Station adapter ───────────────────────────────────────────

function adaptStation(fs: any, supplies: SupplyRecord[]): Station & { _dbId: string } {
  const stockStatus = (cur: number, cap: number): ProductStock["status"] => {
    if (cap === 0 || cur === 0) return "Empty";
    const pct = cur / cap;
    if (pct < 0.15) return "Critical";
    if (pct < 0.4)  return "Limited";
    return "Available";
  };
  return {
    _dbId:        fs._id,
    id:           fs._id,
    name:         fs.stationName,
    address:      fs.address ?? "",
    state:        fs.state ?? "",
    licenseNo:    fs.dprLicenseNo ?? "",
    dprNo:        fs.rcNumber ?? "",
    phone:        fs.managerPhone ?? "",
    email:        "",
    openingHours: "6:00 AM – 10:00 PM",
    status:       (fs.status ? fs.status.charAt(0).toUpperCase() + fs.status.slice(1) : "Active") as Station["status"],
    manager:      fs.managerName ?? "",
    managerPhone: fs.managerPhone ?? "",
    stock: (fs.tanks ?? []).map((t: any) => ({
      product:      t.product as "PMS" | "AGO" | "ATK",
      capacity:     t.capacityLitres ?? 0,
      current:      t.currentLitres  ?? 0,
      price:        "—",
      lastSupplied: t.lastRestocked ? t.lastRestocked.slice(0, 10) : "—",
      status:       stockStatus(t.currentLitres ?? 0, t.capacityLitres ?? 0),
    })),
    staff:    [],
    supplies,
  };
}

// ─── Daily report from DB sales ───────────────────────────────────────────────

function buildDailyReport(station: Station & { _dbId?: string }, todaySales: any[]) {
  const stSales = todaySales.filter((s: any) => s.stationName === station.name);
  const totalRevenue = stSales.reduce((a: number, s: any) => a + (s.totalRevenue ?? 0), 0);
  const rows = (["PMS", "AGO", "ATK"] as const).map((p) => {
    const prodSales = stSales.flatMap((s: any) => (s.sales ?? []).filter((x: any) => x.product === p));
    const sold = prodSales.reduce((a: number, x: any) => a + (x.litresSold ?? 0), 0);
    const rev  = prodSales.reduce((a: number, x: any) => a + (x.revenue    ?? 0), 0);
    const st   = station.stock.find((x) => x.product === p);
    return { product: p, sold, remaining: st?.current ?? 0, capacity: st?.capacity ?? 0, txns: prodSales.length, revenue: rev, price: st?.price ?? "—" };
  });
  return {
    date: new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    rows,
    totalRevenue,
    cash: 0,
    pos:  totalRevenue,
    totalTxns: stSales.length,
    activeStaff: station.staff.filter((x) => x.status === "Active").length,
    openingStock: { pms: 0, ago: 0, atk: 0 },
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockGauge({ stock }: { stock: ProductStock }) {
  const pct = stock.capacity > 0 ? Math.round((stock.current / stock.capacity) * 100) : 0;
  const barColor  = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";
  const pctColor  = pct > 50 ? "text-green-400" : pct > 20 ? "text-yellow-400" : "text-red-400";
  const prodColor = stock.product === "PMS" ? "text-red-400" : stock.product === "AGO" ? "text-blue-400" : "text-green-400";
  const statusColors: Record<string, string> = {
    Available: "bg-green-500/20 text-green-400 border-green-500/40",
    Limited:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Critical:  "bg-orange-500/20 text-orange-400 border-orange-500/40",
    Empty:     "bg-red-500/20 text-red-400 border-red-500/40",
  };
  const productLabel: Record<string, string> = {
    PMS: "Premium Motor Spirit",
    AGO: "Automotive Gas Oil",
    ATK: "Aviation Turbine Kerosene",
  };
  return (
    <div className="bg-black/30 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <span className={`text-xl font-extrabold ${prodColor}`}>{stock.product}</span>
          <p className="text-xs text-gray-500 mt-0.5">{productLabel[stock.product]}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[stock.status]}`}>
          {stock.status}
        </span>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{stock.current.toLocaleString()} L</span>
          <span className={`font-bold ${pctColor}`}>{pct}%</span>
          <span>{stock.capacity.toLocaleString()} L</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Price: <span className="text-white font-semibold">{stock.price}/L</span></span>
        <span>Restocked: <span className="text-gray-300">
          {new Date(stock.lastSupplied).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </span></span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "inventory" | "staff" | "supplies";

const inputCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";
const selectCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";

export default function StationManager() {
  const router = useRouter();
  const { depots, depotProducts } = useDepot();
  const [user, setUser]           = useState<any>(null);
  const [stations, setStations]   = useState<Station[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab]             = useState<Tab>("overview");
  const [todaySales, setTodaySales] = useState<any[]>([]);

  // Edit station modal
  const [editOpen, setEditOpen]   = useState(false);
  const [editDraft, setEditDraft] = useState<Station | null>(null);

  // Daily report modal
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);

        import("@/lib/db-client").then(({ api }) => {
          const today = new Date().toISOString().slice(0, 10);
          Promise.allSettled([
            api.fuelStations.list({ ownerEmail: u.email }),
            api.supplyRequests.list({ requestedBy: u.email, limit: 100 } as any),
            api.dailySales.list({ recordedBy: u.email, limit: 50 } as any),
          ]).then(([stRes, supRes, salesRes]) => {
            const fuelStations = (stRes.status === "fulfilled" ? stRes.value?.data : null) ?? [];
            const supplyReqs   = (supRes.status === "fulfilled" ? supRes.value?.data : null) ?? [];
            const sales        = (salesRes.status === "fulfilled" ? salesRes.value?.data : null) ?? [];

            setTodaySales(sales.filter((s: any) => (s.saleDate || s.createdAt || "").startsWith(today)));

            const mapped: Station[] = fuelStations.map((fs: any) => {
              const supplies: SupplyRecord[] = supplyReqs
                .filter((r: any) => r.stationName === fs.stationName || r.stationId === fs._id)
                .map((r: any) => ({
                  id:       r.requestId || r._id,
                  date:     (r.createdAt || r.deliveryDate || "").slice(0, 10),
                  product:  r.product as "PMS" | "AGO" | "ATK",
                  quantity: `${Number(r.quantity ?? 0).toLocaleString()} L`,
                  depot:    r.depot || r.aiAssignedDepot || "—",
                  status:   (r.status === "Fulfilled" ? "Completed" : r.status === "In Transit" ? "Processing" : r.status) as SupplyRecord["status"],
                  truckReg: "—",
                }));
              return adaptStation(fs, supplies);
            });
            setStations(mapped);
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

  if (stations.length === 0) return (
    <div className="min-h-screen bg-cover bg-center text-white" style={{ backgroundImage: `url(${tower.src})` }}>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />
      <div className="relative z-10 pt-16 md:pl-64 flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-400 p-8">
          <p className="text-lg font-semibold text-white mb-2">No stations registered</p>
          <p className="text-sm">Contact admin to register your fuel station on the platform.</p>
        </div>
      </div>
    </div>
  );

  const station = stations[activeIdx] ?? stations[0];
  const totalCurrent  = station.stock.reduce((a, s) => a + s.current, 0);
  const totalCapacity = station.stock.reduce((a, s) => a + s.capacity, 0);
  const fillPct       = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;
  const activeStaff   = station.staff.filter((s) => s.status === "Active").length;
  const pendingCount  = station.supplies.filter((s) => s.status === "Pending" || s.status === "Processing").length;
  const availProds    = station.stock.filter((s) => s.status !== "Empty").length;

  const badge = (s: string) => {
    const map: Record<string, string> = {
      Active:      "bg-green-500/20 text-green-400 border-green-500/40",
      Inactive:    "bg-gray-500/20 text-gray-400 border-gray-500/40",
      Suspended:   "bg-red-500/20 text-red-400 border-red-500/40",
      "Off Duty":  "bg-gray-500/20 text-gray-400 border-gray-500/40",
      "On Leave":  "bg-blue-500/20 text-blue-400 border-blue-500/40",
      Completed:   "bg-green-500/20 text-green-400 border-green-500/40",
      Pending:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
      Processing:  "bg-orange-500/20 text-orange-400 border-orange-500/40",
      Cancelled:   "bg-red-500/20 text-red-400 border-red-500/40",
      Available:   "bg-green-500/20 text-green-400 border-green-500/40",
      Limited:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    };
    return (map[s] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40") + " px-2 py-0.5 rounded-full text-xs font-bold border";
  };

  const prodColor = (p: string) =>
    p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-green-400";

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",  label: "Overview"       },
    { id: "inventory", label: "Inventory"      },
    { id: "staff",     label: "Staff Roster"   },
    { id: "supplies",  label: "Supply History" },
  ];

  // ── Edit station handlers ─────────────────────────────────────────────────
  const openEdit = () => {
    setEditDraft({ ...station });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editDraft) return;
    setStations((prev) => prev.map((s, i) => (i === activeIdx ? editDraft : s)));
    setEditOpen(false);
    if (editDraft._dbId) {
      import("@/lib/db-client").then(({ api }) => {
        api.fuelStations.update(editDraft._dbId!, {
          stationName:  editDraft.name,
          address:      editDraft.address,
          state:        editDraft.state,
          managerName:  editDraft.manager,
          managerPhone: editDraft.managerPhone,
          dprLicenseNo: editDraft.licenseNo,
          status:       editDraft.status.toLowerCase() as any,
        }).catch(() => null);
      });
    }
  };

  const setEditField = (key: keyof Station, val: string) =>
    setEditDraft((d) => d ? { ...d, [key]: val } : d);

  // ── Daily report data ─────────────────────────────────────────────────────
  const report = buildDailyReport(station as Station & { _dbId?: string }, todaySales);

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Station Manager | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      {/* ── Edit Station Modal ── */}
      {editOpen && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative z-10 w-full max-w-xl bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-orange-500/5">
              <p className="text-sm font-bold text-orange-400 uppercase tracking-wider">Edit Station — {station.id}</p>
              <button onClick={() => setEditOpen(false)} className="text-gray-500 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Station Name",    key: "name"         },
                  { label: "Address",         key: "address"      },
                  { label: "State",           key: "state"        },
                  { label: "Phone",           key: "phone"        },
                  { label: "Email",           key: "email"        },
                  { label: "Licence No.",     key: "licenseNo"    },
                  { label: "DPR No.",         key: "dprNo"        },
                  { label: "Opening Hours",   key: "openingHours" },
                  { label: "Station Manager", key: "manager"      },
                  { label: "Manager Phone",   key: "managerPhone" },
                ].map(({ label, key }) => (
                  <div key={key} className={key === "name" || key === "address" || key === "email" ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      className={inputCls}
                      value={(editDraft as any)[key]}
                      onChange={(e) => setEditField(key as keyof Station, e.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Station Status</label>
                  <select className={selectCls} value={editDraft.status}
                    onChange={(e) => setEditField("status", e.target.value as Station["status"])}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setEditOpen(false)}
                className="px-4 py-2 border border-gray-700 text-gray-400 hover:text-white text-sm font-semibold rounded-lg transition">
                Cancel
              </button>
              <button onClick={saveEdit}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-orange-500/20">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily Report Modal ── */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReportOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-orange-500/5">
              <div>
                <p className="text-sm font-bold text-orange-400 uppercase tracking-wider">Daily Station Report</p>
                <p className="text-xs text-gray-500 mt-0.5">{station.name} · {report.date}</p>
              </div>
              <button onClick={() => setReportOpen(false)} className="text-gray-500 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Revenue",     value: `₦${report.totalRevenue.toLocaleString()}`, color: "text-orange-400" },
                  { label: "Transactions",      value: report.totalTxns,                            color: "text-blue-400"   },
                  { label: "Cash",              value: `₦${report.cash.toLocaleString()}`,          color: "text-green-400"  },
                  { label: "POS / Transfer",    value: `₦${report.pos.toLocaleString()}`,           color: "text-purple-400" },
                ].map((c) => (
                  <div key={c.label} className="bg-black/40 border border-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
                    <p className={`text-lg font-extrabold ${c.color}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Product breakdown table */}
              <div className="bg-black/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-800 bg-orange-500/5">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Product Sales Breakdown</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {["Product", "Opening Stock", "Qty Sold", "Remaining", "Fill %", "Transactions", "Revenue"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {report.rows.map((r) => {
                        const pct = r.capacity > 0 ? Math.round((r.remaining / r.capacity) * 100) : 0;
                        const bar = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";
                        return (
                          <tr key={r.product} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`font-extrabold text-sm ${prodColor(r.product)}`}>{r.product}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{(r.remaining + r.sold).toLocaleString()} L</td>
                            <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">{r.sold.toLocaleString()} L</td>
                            <td className="px-4 py-3 text-xs text-gray-300 whitespace-nowrap">{r.remaining.toLocaleString()} L</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-400">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{r.txns}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-400 whitespace-nowrap">
                              ₦{r.revenue.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Staff & operational info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 border border-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operations</p>
                  {[
                    { label: "Active Staff on Duty", value: `${report.activeStaff} personnel` },
                    { label: "Total Staff",           value: `${station.staff.length} personnel` },
                    { label: "Pumps Operational",     value: station.id === "STN-001" ? "6 / 6" : "8 / 8" },
                    { label: "Opening Hours",         value: station.openingHours },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs border-b border-gray-800/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-black/30 border border-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Channels</p>
                  {[
                    { label: "Cash Sales",        value: `₦${report.cash.toLocaleString()}`,  pct: 44 },
                    { label: "POS / Transfer",    value: `₦${report.pos.toLocaleString()}`,   pct: 56 },
                  ].map(({ label, value, pct }) => (
                    <div key={label} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex justify-between items-center">
              <p className="text-xs text-gray-500">Generated: {new Date().toLocaleTimeString("en-NG")}</p>
              <button
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (!w) return;
                  w.document.write(`<html><head><title>Daily Report — ${station.name}</title>
                    <style>body{font-family:sans-serif;padding:24px;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}h2{margin-bottom:4px}p{color:#555;margin:0 0 16px}</style></head><body>
                    <h2>Daily Station Report — ${station.name}</h2><p>${report.date}</p>
                    <table><tr><th>Product</th><th>Opening Stock</th><th>Sold</th><th>Remaining</th><th>Transactions</th><th>Revenue</th></tr>
                    ${report.rows.map((r) => `<tr><td>${r.product}</td><td>${(r.remaining + r.sold).toLocaleString()} L</td><td>${r.sold.toLocaleString()} L</td><td>${r.remaining.toLocaleString()} L</td><td>${r.txns}</td><td>₦${r.revenue.toLocaleString()}</td></tr>`).join("")}
                    </table><br/>
                    <table><tr><th>Total Revenue</th><th>Cash</th><th>POS/Transfer</th><th>Total Transactions</th><th>Active Staff</th></tr>
                    <tr><td>₦${report.totalRevenue.toLocaleString()}</td><td>₦${report.cash.toLocaleString()}</td><td>₦${report.pos.toLocaleString()}</td><td>${report.totalTxns}</td><td>${report.activeStaff}</td></tr>
                    </table></body></html>`);
                  w.document.close();
                  setTimeout(() => w.print(), 400);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Station Manager</h1>
            <p className="text-gray-400 text-sm">Manage your fuel stations, inventory, and personnel</p>
          </div>

          {/* Station switcher */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {stations.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setActiveIdx(i); setTab("overview"); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
                  i === activeIdx
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-black/40 backdrop-blur-md border-gray-700 text-gray-300 hover:border-orange-500/50 hover:text-orange-400"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.status === "Active" ? "bg-green-400" : "bg-gray-500"}`} />
                {s.name}
              </button>
            ))}
          </div>

          {/* Station banner */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white">{station.name}</h2>
                <span className={badge(station.status)}>{station.status}</span>
              </div>
              <p className="text-sm text-gray-400 truncate">{station.address}, {station.state} · {station.openingHours}</p>
              <p className="text-xs text-gray-500 mt-0.5">Licence: {station.licenseNo} · DPR: {station.dprNo}</p>
            </div>
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => router.push(`/customer/request-supply?station=${station.id}&name=${encodeURIComponent(station.name)}`)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-orange-500/20"
              >
                Request Supply
              </button>
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-orange-400 text-xs font-semibold rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Station
              </button>
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-500/70 text-blue-400 hover:text-blue-300 text-xs font-semibold rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Daily Report
              </button>
              <button
                onClick={() => router.push(`/customer/update-sales?station=${station.id}&name=${encodeURIComponent(station.name)}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 hover:border-green-500/70 text-green-400 hover:text-green-300 text-xs font-semibold rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Sales
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Overall Stock",      value: `${fillPct}%`, sub: `${totalCurrent.toLocaleString()} / ${totalCapacity.toLocaleString()} L`, border: "border-orange-800/50", text: "text-orange-400" },
              { label: "Active Staff",       value: activeStaff,   sub: `of ${station.staff.length} total`,                                       border: "border-green-800/50",  text: "text-green-400"  },
              { label: "Pending Deliveries", value: pendingCount,  sub: "in progress or queued",                                                  border: "border-yellow-800/50", text: "text-yellow-400" },
              { label: "Products Available", value: availProds,    sub: "fuel types in stock",                                                    border: "border-blue-800/50",   text: "text-blue-400"   },
            ].map((c) => (
              <div key={c.label} className={`bg-black/40 backdrop-blur-md border ${c.border} rounded-lg p-4`}>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-1 w-fit overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  tab === t.id
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inventory Snapshot</p>
                {station.stock.map((s) => <StockGauge key={s.product} stock={s} />)}
              </div>
              <div className="space-y-4">
                <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Station Details</p>
                  {[
                    { label: "Station Manager", value: station.manager },
                    { label: "Manager Phone",   value: station.managerPhone },
                    { label: "Station Email",   value: station.email },
                    { label: "Station Phone",   value: station.phone },
                    { label: "Operating Hours", value: station.openingHours },
                    { label: "Total Staff",     value: `${station.staff.length} personnel` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center border-b border-gray-800/60 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm text-white font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Latest Supply Activity</p>
                  <div className="space-y-3">
                    {station.supplies.slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-1 border-b border-gray-800/50 last:border-0">
                        <div>
                          <p className="text-xs font-mono text-orange-400">{s.id}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className={`font-bold ${prodColor(s.product)}`}>{s.product}</span>
                            {" · "}{s.quantity}{" · "}
                            {new Date(s.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className={badge(s.status)}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INVENTORY ── */}
          {tab === "inventory" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {station.stock.map((s) => <StockGauge key={s.product} stock={s} />)}
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detailed Inventory</p>
                  <button
                    onClick={() => router.push(`/customer/request-supply?station=${station.id}&name=${encodeURIComponent(station.name)}`)}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition"
                  >
                    Request Restock
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-500/10 border-b border-gray-800">
                        {["Product", "Current Stock", "Capacity", "Fill Level", "Price / L", "Last Supplied", "Status"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {station.stock.map((s) => {
                        const pct = s.capacity > 0 ? Math.round((s.current / s.capacity) * 100) : 0;
                        const bar = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";
                        return (
                          <tr key={s.product} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3"><span className={`font-bold text-sm ${prodColor(s.product)}`}>{s.product}</span></td>
                            <td className="px-4 py-3 text-sm text-gray-300">{s.current.toLocaleString()} L</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{s.capacity.toLocaleString()} L</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 w-8">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-white font-semibold">{s.price}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {new Date(s.lastSupplied).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3"><span className={badge(s.status)}>{s.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STAFF ── */}
          {tab === "staff" && (
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Staff Roster — {station.staff.length} personnel
                </p>
                <button className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition">
                  + Add Staff
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-500/10 border-b border-gray-800">
                      {["Name", "Role", "Shift", "Phone", "Email", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {station.staff.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-white whitespace-nowrap">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{s.role}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{s.shift}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{s.phone}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{s.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className={badge(s.status)}>{s.status}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUPPLIES ── */}
          {tab === "supplies" && (
            <div className="space-y-5">

            {/* Live depot availability from DepotContext */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-orange-500/5 flex items-center justify-between">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Live Depot Availability</p>
                <span className="text-xs text-gray-500">{depots.length} depots</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/30">
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Depot</th>
                      {(["PMS", "AGO", "ATK"] as ProductKey[]).map((pk) => (
                        <th key={pk} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{pk}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {depots.map((depot) => (
                      <tr key={depot} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">{depot}</td>
                        {(["PMS", "AGO", "ATK"] as ProductKey[]).map((pk) => {
                          const d = depotProducts[depot]?.[pk];
                          if (!d) return <td key={pk} className="px-4 py-3 text-xs text-gray-600">—</td>;
                          const barColor = d.level > 50 ? "bg-green-500" : d.level > 20 ? "bg-yellow-500" : "bg-red-500";
                          const statusColor =
                            d.status === "Available"   ? "text-green-400" :
                            d.status === "Limited"     ? "text-yellow-400" : "text-red-400";
                          return (
                            <td key={pk} className="px-4 py-3">
                              <div className="flex items-center gap-2 min-w-[110px]">
                                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden shrink-0">
                                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${d.level}%` }} />
                                </div>
                                <span className={`text-xs font-semibold ${statusColor}`}>{d.level}%</span>
                              </div>
                              <p className={`text-xs mt-0.5 ${statusColor}`}>{d.status}</p>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Supply History</p>
                <button
                  onClick={() => router.push(`/customer/request-supply?station=${station.id}&name=${encodeURIComponent(station.name)}`)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition"
                >
                  + Request Supply
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-500/10 border-b border-gray-800">
                      {["Request ID", "Date", "Product", "Quantity", "Source Depot", "Truck Reg", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {station.supplies.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-orange-400">{s.id}</td>
                        <td className="px-4 py-3 text-xs text-gray-300 whitespace-nowrap">
                          {new Date(s.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3"><span className={`font-bold text-xs ${prodColor(s.product)}`}>{s.product}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-300">{s.quantity}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{s.depot}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{s.truckReg}</td>
                        <td className="px-4 py-3"><span className={badge(s.status)}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            </div>
          )}

          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
