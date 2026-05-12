"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";
import { startTracking } from "@/utils/onlineTracker";


const QUICK_ACTIONS = [
  { label: "Re-order Fuel",     href: "/buynow",                      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",                                                                                                color: "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20" },
  { label: "Request Supply",    href: "/customer/request-supply",      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",                                                                                                                                             color: "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"   },
  { label: "Rent a Truck",      href: "/customer/rent-truck",          icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h6l2-1zM13 6l3 5h3l1 2v3h-2",                                                                    color: "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20" },
  { label: "Pay Union Dues",    href: "/paydues",                      icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",                                                       color: "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" },
  { label: "Station Manager",   href: "/customer/station-manager",     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",                                                               color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" },
  { label: "Update Sales",      href: "/customer/update-sales",        icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",                                                                                    color: "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"   },
  { label: "Transaction Status",href: "/customer/transaction-status",  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                                                                                                               color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20" },
  { label: "My Profile",        href: "/customer/profile",             icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                                                                                        color: "bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(current: number, capacity: number) {
  return capacity > 0 ? Math.round((current / capacity) * 100) : 0;
}

function barColor(p: number) {
  return p > 50 ? "bg-green-500" : p > 20 ? "bg-yellow-500" : "bg-red-500";
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Available: "bg-green-500/20 text-green-400 border-green-500/40",
    Limited:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Empty:     "bg-red-500/20 text-red-400 border-red-500/40",
    Pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Completed: "bg-green-500/20 text-green-400 border-green-500/40",
    Processing:"bg-orange-500/20 text-orange-400 border-orange-500/40",
    Cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
  };
  return (map[s] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40") +
    " px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap";
}

function prodColor(p: string) {
  return p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-green-400";
}

function txnTypeLabel(type: string) {
  if (!type) return "Fuel";
  if (type.toLowerCase().includes("truck") || type.toLowerCase().includes("rent")) return "Truck";
  if (type.toLowerCase().includes("due") || type.toLowerCase().includes("union")) return "Dues";
  return "Fuel";
}

function txnTypeColor(type: string) {
  const t = txnTypeLabel(type);
  return t === "Truck" ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
       : t === "Dues"  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
       :                 "bg-orange-500/20 text-orange-400 border-orange-500/40";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser]             = useState<any>(null);
  const [transactions, setTxns]     = useState<any[]>([]);
  const [supplyRequests, setSupply] = useState<any[]>([]);
  const [stationStock, setStationStock] = useState<any[]>([]);
  const [greeting, setGreeting]     = useState("Good day");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);

        const h = new Date().getHours();
        setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

        import("@/lib/db-client").then(({ api }) => {
          api.transactions.list({ limit: 5 }).then(result => {
            if (result?.data?.length) setTxns(result.data);
          });
          api.supplyRequests.list({ requestedBy: u.email, limit: 4 }).then(result => {
            if (result?.data?.length) setSupply(result.data);
          });
          api.stationManagers.list({ userEmail: u.email, limit: 10 } as any).then((result: any) => {
            if (result?.data?.length) {
              setStationStock(result.data.map((sm: any) => ({
                id: sm._id,
                name: sm.name || sm.depot || "Station",
                stock: [
                  { product: "PMS", current: sm.pmsCurrent ?? 0, capacity: sm.pmsCapacity ?? 0, status: sm.pmsStatus || "Empty" },
                  { product: "AGO", current: sm.agoCurrent ?? 0, capacity: sm.agoCapacity ?? 0, status: sm.agoStatus || "Empty" },
                  { product: "ATK", current: sm.atkCurrent ?? 0, capacity: sm.atkCapacity ?? 0, status: sm.atkStatus || "Empty" },
                ],
              })));
            }
          }).catch(() => null);
        });

        const stopTracking = startTracking({ id: u.email, name: u.name, email: u.email, role: u.role, lastSeen: Date.now() });
        return stopTracking;
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Derived stats
  const totalTxns      = transactions.length;
  const pendingSupply  = supplyRequests.filter((r: any) => r.status === "Pending").length;
  const allStock       = stationStock.flatMap((s) => s.stock);
  const criticalStock  = allStock.filter((s) => s.status === "Empty" || s.status === "Limited").length;
  const activeStations = stationStock.length;

  const STATS = [
    {
      label: "Total Transactions",
      value: totalTxns || "—",
      sub: "all time",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      border: "border-orange-800/50", text: "text-orange-400", bg: "bg-orange-500/10",
    },
    {
      label: "Pending Supply Requests",
      value: pendingSupply || 0,
      sub: "awaiting processing",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      border: "border-blue-800/50", text: "text-blue-400", bg: "bg-blue-500/10",
    },
    {
      label: "Active Stations",
      value: activeStations,
      sub: "under management",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      border: "border-green-800/50", text: "text-green-400", bg: "bg-green-500/10",
    },
    {
      label: "Stock Alerts",
      value: criticalStock,
      sub: "low or empty products",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      border: criticalStock > 0 ? "border-red-800/50" : "border-gray-800",
      text: criticalStock > 0 ? "text-red-400" : "text-gray-400",
      bg: criticalStock > 0 ? "bg-red-500/10" : "bg-gray-800/20",
    },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Customer Dashboard | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6">

          {/* ── Welcome banner ── */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-extrabold shrink-0 shadow-lg shadow-orange-500/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">{greeting},</p>
              <h1 className="text-2xl font-extrabold text-white truncate">{user.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{today}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-500/20 text-orange-400 border-orange-500/40">
                {user.role}
              </span>
              {user.memberId && (
                <span className="px-3 py-1 rounded-full text-xs font-mono border bg-gray-800/60 text-gray-400 border-gray-700">
                  ID: {user.memberId}
                </span>
              )}
              {user.companyName && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-800/60 text-gray-300 border-gray-700 max-w-[200px] truncate">
                  {user.companyName}
                </span>
              )}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STATS.map((s) => (
              <div key={s.label} className={`bg-black/40 backdrop-blur-md border ${s.border} rounded-xl p-4 flex gap-3 items-start`}>
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <svg className={`w-5 h-5 ${s.text}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
                  <p className="text-xs font-semibold text-white leading-tight mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Recent Transactions</p>
                <Link href="/customer/TransactionHistory"
                  className="text-xs text-gray-400 hover:text-orange-400 font-semibold transition">
                  View all →
                </Link>
              </div>
              {transactions.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm text-gray-500">No transactions yet.</p>
                  <Link href="/buynow" className="mt-3 inline-block text-xs text-orange-400 hover:underline font-semibold">
                    Make your first order →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/60">
                  {transactions.map((txn: any, i: number) => (
                    <div key={txn.id ?? i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold border ${txnTypeColor(txn.type)}`}>
                        {txnTypeLabel(txn.type).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{txn.product || txn.description || "—"}</p>
                        <p className="text-xs text-gray-500 truncate">{txn.depot || txn.date || "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-400">{txn.amount || txn.total || "—"}</p>
                        <span className={statusBadge(txn.status || "Pending")}>{txn.status || "Pending"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Quick Actions</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <Link key={a.href} href={a.href}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition ${a.color}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                    </svg>
                    <span className="text-xs font-semibold leading-tight">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Station Stock Overview */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Station Stock Overview</p>
                <Link href="/customer/station-manager"
                  className="text-xs text-gray-400 hover:text-orange-400 font-semibold transition">
                  Manage →
                </Link>
              </div>
              {stationStock.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm text-gray-500">No stations under management.</p>
                  <Link href="/customer/station-manager" className="mt-3 inline-block text-xs text-orange-400 hover:underline font-semibold">
                    Set up a station →
                  </Link>
                </div>
              ) : (
              <div className="p-4 space-y-4">
                {stationStock.map((station) => (
                  <div key={station.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{station.name}</p>
                      <span className="text-xs text-gray-500 font-mono">{station.id}</span>
                    </div>
                    <div className="space-y-1.5">
                      {station.stock.map((s: any) => {
                        const p = pct(s.current, s.capacity);
                        return (
                          <div key={s.product} className="flex items-center gap-3">
                            <span className={`text-xs font-extrabold w-8 shrink-0 ${prodColor(s.product)}`}>{s.product}</span>
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor(p)} rounded-full transition-all`} style={{ width: `${p}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right shrink-0">{p}%</span>
                            <span className={`${statusBadge(s.status)} shrink-0`}>{s.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Pending Supply Requests */}
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Supply Requests</p>
                <Link href="/customer/request-supply"
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition">
                  + New Request
                </Link>
              </div>
              {supplyRequests.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm text-gray-500">No supply requests yet.</p>
                  <Link href="/customer/request-supply" className="mt-3 inline-block text-xs text-orange-400 hover:underline font-semibold">
                    Request fuel supply →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/60">
                  {supplyRequests.map((req: any, i: number) => (
                    <div key={req.id ?? i} className="flex items-start gap-3 px-5 py-3 hover:bg-white/5 transition">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{req.product} — {req.quantity}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{req.depot} → {req.stationName || req.stationId}</p>
                        <p className="text-xs text-gray-600 font-mono mt-0.5">{req.id}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={statusBadge(req.status)}>{req.status}</span>
                        <span className={`text-xs font-semibold ${
                          req.priority === "emergency" ? "text-red-400" :
                          req.priority === "urgent"    ? "text-yellow-400" : "text-gray-500"
                        }`}>{req.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
