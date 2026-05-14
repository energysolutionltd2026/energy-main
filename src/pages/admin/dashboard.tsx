"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import tower from "@/../public/tower.jpg";
import { getOnlineUsers, type OnlineUser } from "@/utils/onlineTracker";

// ─── Notification Helper ──────────────────────────────────────────────────────

function pushNotification(_storageKey: string, notif: { type: string; title: string; message: string; href: string }) {
  import("@/lib/db-client").then(({ api }) => {
    (api.notifications as any)?.create?.({ ...notif, timestamp: new Date().toISOString(), read: false }).catch(() => null);
  }).catch(() => null);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: "Customer" | "Bulk Dealer" | "Truck Owner";
  status: "Active" | "Suspended";
  joinedAt: string;
  lastLogin: string;
  companyName?: string;
  phone?: string;
  state?: string;
  pmsTankMaxML?: number;
  agoTankMaxML?: number;
  atkTankMaxML?: number;
}

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

interface PurchaseOrder {
  id: string;
  date: string;
  product: "PMS" | "AGO" | "ATK";
  qty: string;
  depot: string;
  amount: string;
  status: "Delivered" | "In Transit" | "Processing" | "Pending";
  dealer?: string;
}

interface TruckRecord {
  id: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  vehicleType: string;
  tankCapacity: string;
  compartments?: string;
  truckRegNumber: string;
  tractorColor?: string;
  tankColor?: string;
  chassisNumber?: string;
  engineNumber?: string;
  yearOfManufacture?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  dprCertNumber?: string;
  dprCertExpiry?: string;
  roadWorthinessExpiry?: string;
  productTypes: string[];
  dailyRate: string;
  driverName: string;
  driverPhone?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  motorBoyName?: string;
  motorBoyPhone?: string;
  motorBoyIdType?: string;
  motorBoyIdNumber?: string;
  status: "Pending Review" | "Approved" | "Rejected";
  submittedAt: string;
  reviewNote: string;
  zoneRates?: Record<string, number>;
  approvedZoneRates?: Record<string, number>;
  destinationState?: string;
  destinationTown?: string;
  tractorImageUrl?: string;
  tankImageUrl?: string;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  user: string;
  depot?: string;
  product?: string;
  quantity?: string;
  totalAmount: string;
  status: "Completed" | "Pending" | "Failed";
  paymentMethod?: string;
}

interface DepotProduct {
  level: number;
  price: string;
  status: "Available" | "Limited" | "Unavailable";
  capacityLitres: number;
  currentLitres: number;
}

interface Depot {
  name: string;
  location: string;
  logo?: string;
  PMS: DepotProduct;
  AGO: DepotProduct;
  ATK: DepotProduct;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const BASE_USERS: AdminUser[] = [];

const BASE_SUPPLY_REQUESTS: SupplyRequest[] = [];

const BASE_PURCHASE_ORDERS: PurchaseOrder[] = [];

const BASE_TRUCKS: TruckRecord[] = [];

const BASE_TRANSACTIONS: Transaction[] = [];

const DEPOTS: Depot[] = [];

// ─── Shared Components ────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    green: "bg-green-500/20 text-green-400 border-green-500/40",
    red: "bg-red-500/20 text-red-400 border-red-500/40",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    gray: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${map[color] || map.gray}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-white"}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function FilterBar({ options, active, counts, onChange }: { options: string[]; active: string; counts?: Record<string, number>; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${active === o ? "bg-purple-600 border-purple-500 text-white" : "bg-black/40 border-gray-700 text-gray-300 hover:border-purple-500"}`}>
          {o}{counts ? ` (${counts[o] ?? 0})` : ""}
        </button>
      ))}
    </div>
  );
}

function Modal({ onClose, title, subtitle, children, wide }: { onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className={`bg-gray-900 border border-gray-700 rounded-xl p-6 w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-white font-bold text-base">{title}</h3>
            {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none ml-4">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Section: Overview ────────────────────────────────────────────────────────

function SectionOverview({ users, setActive }: { users: AdminUser[]; setActive: (s: string) => void }) {
  const pendingSupply = BASE_SUPPLY_REQUESTS.filter(s => s.status === "Pending").length;
  const pendingTrucks = BASE_TRUCKS.filter(t => t.status === "Pending Review").length;
  const pendingPOs = BASE_PURCHASE_ORDERS.filter(p => p.status === "Pending").length;
  const suspended = users.filter(u => u.status === "Suspended").length;

  const [overviewDepots, setOverviewDepots] = useState<Depot[]>([]);
  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.depots.list({ limit: 50 } as any).then((result: any) => {
        if (!result?.data?.length) return;
        setOverviewDepots(result.data.map((d: any) => ({
          name: d.name, location: d.location || "",
          PMS: { level: d.PMS?.level ?? d.pmsLevel ?? 60, price: String(d.PMS?.price ?? d.pmsPrice ?? 1300), status: "Available" },
          AGO: { level: d.AGO?.level ?? d.agoLevel ?? 60, price: String(d.AGO?.price ?? d.agoPrice ?? 1900), status: "Available" },
          ATK: { level: d.ATK?.level ?? d.atkLevel ?? 60, price: String(d.ATK?.price ?? d.atkPrice ?? 1300), status: "Available" },
        })));
      });
    });
  }, []);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  useEffect(() => {
    setOnlineUsers(getOnlineUsers());
    const id = setInterval(() => setOnlineUsers(getOnlineUsers()), 15_000);
    return () => clearInterval(id);
  }, []);

  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() =>
    [...BASE_TRANSACTIONS].sort((a, b) => b.date.localeCompare(a.date))
  );

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.transactions.list({ limit: 10 } as any).then((result) => {
        if (!result || result.data.length === 0) return;
        const apiTxns: Transaction[] = result.data.map((t: any) => ({
          id:          t.reference || t._id,
          date:        t.createdAt ? t.createdAt.slice(0, 10) : "",
          type:        t.type === "union_dues" ? "Union Dues" : t.type === "truck_rental" ? "Truck Rental" : "Fuel Purchase",
          depot:       t.depot,
          product:     t.product,
          quantity:    t.quantity ? `${Number(t.quantity).toLocaleString()} L` : undefined,
          totalAmount: `₦${Number(t.totalAmount || 0).toLocaleString()}`,
          status:      t.status === "completed" ? "Completed" : t.status === "failed" ? "Failed" : "Pending",
          paymentMethod: t.paymentMethod,
          user:        t.userEmail || "—",
        }));
        setAllTransactions((prev) => {
          const seen = new Set<string>();
          return [...apiTxns, ...prev].filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; }).sort((a, b) => b.date.localeCompare(a.date));
        });
      });
    });
  }, []);

  const txnDotColor = (type: string, status: string) => {
    if (status === "Failed") return "bg-red-500";
    if (status === "Pending") return "bg-yellow-500";
    if (type === "Fuel Purchase") return "bg-orange-500";
    if (type === "Truck Rental") return "bg-blue-500";
    if (type === "Union Dues") return "bg-purple-500";
    return "bg-green-500";
  };

  const txnDetail = (t: Transaction) => {
    const parts: string[] = [t.user];
    if (t.product) parts.push(`${t.product}${t.quantity ? ` — ${t.quantity}` : ""}`);
    if (t.depot) parts.push(t.depot);
    parts.push(t.totalAmount);
    return parts.join(" · ");
  };

  const depotAlerts = overviewDepots.filter(d => d.PMS.level < 20 || d.AGO.level < 20 || d.ATK.level < 20);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setActive("Users")} className="text-left">
          <StatCard label="Total Users" value={users.length} sub={`${users.filter(u => u.status === "Active").length} active — click to manage`} color="text-purple-400" />
        </button>
        <button onClick={() => setActive("Supply Requests")} className="text-left">
          <StatCard label="Pending Actions" value={pendingSupply + pendingTrucks + pendingPOs} sub="Click to view supply requests" color="text-yellow-400" />
        </button>
        <button onClick={() => setActive("Trucks")} className="text-left">
          <StatCard label="Truck Reviews" value={pendingTrucks} sub="Click to review trucks" color="text-blue-400" />
        </button>
        <button onClick={() => setActive("Users")} className="text-left">
          <StatCard label="Suspended" value={suspended} sub="Click to manage users" color="text-red-400" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setActive("Supply Requests")} className="text-left">
          <StatCard label="Supply Requests" value={BASE_SUPPLY_REQUESTS.length} sub={`${pendingSupply} pending — click to view`} />
        </button>
        <button onClick={() => setActive("Purchase Orders")} className="text-left">
          <StatCard label="Purchase Orders" value={BASE_PURCHASE_ORDERS.length} sub={`${pendingPOs} pending — click to view`} />
        </button>
        <button onClick={() => setActive("Transactions")} className="text-left">
          <StatCard label="Transactions" value={allTransactions.length} sub={`${allTransactions.filter(t => t.status === "Completed").length} completed — click to view`} />
        </button>
      </div>

      {/* Online Users */}
      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="text-white font-semibold">Online Now</h3>
          </div>
          <span className="text-xs text-gray-400">{onlineUsers.length} user{onlineUsers.length !== 1 ? "s" : ""} active</span>
        </div>
        {onlineUsers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No users currently online</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map(u => {
              const roleColor = u.role === "Customer" ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                : u.role === "Bulk Dealer" ? "bg-green-500/10 border-green-500/30 text-green-300"
                : u.role === "Station Manager" ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                : "bg-purple-500/10 border-purple-500/30 text-purple-300";
              return (
                <div key={u.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${roleColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  <span className="font-medium">{u.name}</span>
                  <span className="opacity-60">·</span>
                  <span className="opacity-70">{u.role}</span>
                  {u.depot && <><span className="opacity-60">·</span><span className="opacity-70">{u.depot.split(" ")[0]}</span></>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Transactions</h3>
            <button onClick={() => setActive("Transactions")} className="text-xs text-purple-400 hover:text-purple-300">View all →</button>
          </div>
          <div className="space-y-2">
            {allTransactions.slice(0, 8).map((t) => (
              <button key={t.id} onClick={() => setActive("Transactions")}
                className="w-full flex items-start gap-3 text-left hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors group">
                <span className="text-gray-500 text-xs mt-1 w-24 shrink-0 font-mono">{t.date}</span>
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${txnDotColor(t.type, t.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm group-hover:text-purple-300 transition-colors truncate">{t.type}</p>
                  <p className="text-gray-400 text-xs truncate">{txnDetail(t)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-green-400 text-xs font-medium">{t.totalAmount}</p>
                  <p className={`text-xs ${t.status === "Completed" ? "text-green-500" : t.status === "Failed" ? "text-red-400" : "text-yellow-400"}`}>{t.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Users by Role</h3>
          {(["Customer", "Bulk Dealer", "Truck Owner"] as const).map(role => {
            const count = users.filter(u => u.role === role).length;
            const pct = Math.round((count / users.length) * 100);
            const bar = role === "Customer" ? "bg-orange-500" : role === "Bulk Dealer" ? "bg-green-500" : "bg-blue-500";
            return (
              <div key={role} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{role}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className={`h-2 ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          {depotAlerts.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Depot Stock Alerts</p>
                <button onClick={() => setActive("Depots")} className="text-xs text-purple-400 hover:text-purple-300">View all →</button>
              </div>
              {depotAlerts.map(d => (
                <button key={d.name} onClick={() => setActive("Depots")}
                  className="w-full flex justify-between text-xs mb-2 items-center hover:bg-white/5 rounded px-1 py-0.5 transition-colors">
                  <span className="text-gray-300 truncate mr-2">{d.name.split(" ")[0]}</span>
                  <div className="flex gap-1 shrink-0">
                    {d.PMS.level < 20 && <Badge label={`PMS ${d.PMS.level}%`} color="red" />}
                    {d.AGO.level < 20 && <Badge label={`AGO ${d.AGO.level}%`} color="red" />}
                    {d.ATK.level < 20 && <Badge label={`ATK ${d.ATK.level}%`} color="red" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Users ───────────────────────────────────────────────────────────

function SectionUsers({ users, setUsers, setToast }: {
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  setToast: (m: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);
  const [onlineEmails, setOnlineEmails] = useState<Set<string>>(new Set());
  const [tankEdit, setTankEdit] = useState<{ PMS: string; AGO: string; ATK: string } | null>(null);
  const [tankSaving, setTankSaving] = useState(false);

  useEffect(() => {
    const refresh = () => setOnlineEmails(new Set(getOnlineUsers().map(u => u.email)));
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (roleFilter === "All" || u.role === roleFilter) &&
      (statusFilter === "All" || u.status === statusFilter)
    );
  });

  const toggleSuspend = (user: AdminUser) => {
    const next = user.status === "Active" ? "Suspended" : "Active";
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: next } : u));

    // Persist to DB if we have a real _id
    if (user._id) {
      import("@/lib/db-client").then(({ api }) => {
        api.users.update(user._id!, { status: next === "Suspended" ? "suspended" : "active" });
      });
    }

    const notifKey = user.role === "Bulk Dealer" ? "bulk_dealer_notifications" : "customer_notifications";
    if (next === "Suspended") {
      pushNotification(notifKey, { type: "system", title: "Account Suspended", message: "Your account has been suspended by the platform administrator. Please contact support for assistance.", href: "/auth/login" });
    } else {
      pushNotification(notifKey, { type: "system", title: "Account Reactivated", message: "Your account has been reactivated. You can now log in and access all platform features.", href: "/auth/login" });
    }
    setToast(`${user.name} ${next === "Suspended" ? "suspended" : "reactivated"} successfully`);
    setConfirm(null);
    setSelected(null);
  };

  const openUser = (user: AdminUser) => {
    setSelected(user);
    if (user.role === "Bulk Dealer") {
      setTankEdit({
        PMS: String(user.pmsTankMaxML ?? 5),
        AGO: String(user.agoTankMaxML ?? 5),
        ATK: String(user.atkTankMaxML ?? 5),
      });
    } else {
      setTankEdit(null);
    }
  };

  const saveTankVolumes = async () => {
    if (!selected || !tankEdit) return;
    setTankSaving(true);
    const pms = Math.max(0, parseFloat(tankEdit.PMS) || 5);
    const ago = Math.max(0, parseFloat(tankEdit.AGO) || 5);
    const atk = Math.max(0, parseFloat(tankEdit.ATK) || 5);
    try {
      if ((selected as any)._id) {
        const { api } = await import("@/lib/db-client");
        await api.users.update((selected as any)._id, { pmsTankMaxML: pms, agoTankMaxML: ago, atkTankMaxML: atk });
        setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, pmsTankMaxML: pms, agoTankMaxML: ago, atkTankMaxML: atk } : u));
        setSelected(prev => prev ? { ...prev, pmsTankMaxML: pms, agoTankMaxML: ago, atkTankMaxML: atk } : null);
      }
      setToast(`Tank volumes updated for ${selected.name}`);
    } catch { /**/ }
    setTankSaving(false);
  };

  const rc = (role: string) => role === "Customer" ? "orange" : role === "Bulk Dealer" ? "green" : "blue";
  const sc = (s: string) => s === "Active" ? "green" : "red";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
          className="flex-1 min-w-48 bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
          {["All", "Customer", "Bulk Dealer", "Truck Owner"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
          {["All", "Active", "Suspended"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Online count summary */}
      {onlineEmails.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
          <span><span className="text-blue-400 font-semibold">{onlineEmails.size}</span> user{onlineEmails.size !== 1 ? "s" : ""} online right now</span>
        </div>
      )}

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
          <span className="col-span-3">Name</span>
          <span className="col-span-3">Email</span>
          <span className="col-span-2">Role</span>
          <span className="col-span-1">State</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No users match your filters</p>}
        {filtered.map(user => {
          const isOnline = onlineEmails.has(user.email);
          return (
            <div key={user.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 items-center">
              <div className="col-span-3 flex items-start gap-2">
                <div className="relative mt-0.5 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-gray-900" title="Online now" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium leading-tight">{user.name}</p>
                  {user.companyName && <p className="text-gray-500 text-xs truncate">{user.companyName}</p>}
                  {isOnline && <p className="text-blue-400 text-[10px] font-semibold">● Online</p>}
                </div>
              </div>
              <span className="col-span-3 text-gray-300 text-sm truncate">{user.email}</span>
              <span className="col-span-2"><Badge label={user.role} color={rc(user.role)} /></span>
              <span className="col-span-1 text-gray-400 text-sm">{user.state || "—"}</span>
              <span className="col-span-1"><Badge label={user.status} color={sc(user.status)} /></span>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => openUser(user)} className="text-xs text-purple-400 border border-purple-500/40 px-2 py-1 rounded hover:text-purple-300">View</button>
                <button onClick={() => setConfirm(user)}
                  className={`text-xs px-2 py-1 rounded border ${user.status === "Active" ? "text-red-400 border-red-500/40 hover:text-red-300" : "text-green-400 border-green-500/40 hover:text-green-300"}`}>
                  {user.status === "Active" ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.name} subtitle={selected.id}>
          <div className="space-y-3 text-sm mb-5">
            {[
              ["Email", selected.email],
              ["Phone", selected.phone || "—"],
              ["Company", selected.companyName || "—"],
              ["State", selected.state || "—"],
              ["Joined", selected.joinedAt],
              ["Last Login", selected.lastLogin],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="text-white text-right">{v}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <Badge label={selected.role} color={rc(selected.role)} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <Badge label={selected.status} color={sc(selected.status)} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Online</span>
              {onlineEmails.has(selected.email) ? (
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Online now
                </span>
              ) : (
                <span className="text-gray-500 text-xs">Offline</span>
              )}
            </div>
          </div>

          {/* ── Tank Storage Volumes — Bulk Dealer only ────────────────────── */}
          {selected.role === "Bulk Dealer" && tankEdit && (
            <div className="mt-5 border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
                Tank Storage Volumes
                <span className="ml-2 text-gray-600 normal-case font-normal">(mega-litres · default 5 ML)</span>
              </p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {(["PMS", "AGO", "ATK"] as const).map(p => (
                  <div key={p}>
                    <label className="block text-[10px] text-gray-500 mb-1">{p} Max (ML)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={tankEdit[p]}
                      onChange={e => setTankEdit(prev => prev ? { ...prev, [p]: e.target.value } : prev)}
                      className="w-full bg-black/50 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mb-3">
                5 ML = 5,000,000 litres &nbsp;·&nbsp; Only super admins can increase tank volume.
              </p>
              <button
                onClick={saveTankVolumes}
                disabled={tankSaving}
                className="w-full py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {tankSaving ? "Saving…" : "Save Tank Volumes"}
              </button>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button onClick={() => toggleSuspend(selected)}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${selected.status === "Active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
              {selected.status === "Active" ? "Suspend Account" : "Reactivate Account"}
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal onClose={() => setConfirm(null)} title={confirm.status === "Active" ? "Suspend Account?" : "Reactivate Account?"}>
          <p className="text-gray-400 text-sm mb-6">
            {confirm.status === "Active"
              ? `Suspending ${confirm.name} will immediately block their access to the platform.`
              : `Reactivating ${confirm.name} will restore their full access to the platform.`}
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm hover:bg-gray-800">Cancel</button>
            <button onClick={() => toggleSuspend(confirm)}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${confirm.status === "Active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Supply Requests ─────────────────────────────────────────────────

function SectionSupplyRequests({ setToast }: { setToast: (m: string) => void }) {
  const [requests, setRequests] = useState<SupplyRequest[]>(BASE_SUPPLY_REQUESTS);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<SupplyRequest | null>(null);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.supplyRequests.list({ limit: 200 }).then(result => {
        if (result?.data?.length) {
          const apiReqs: SupplyRequest[] = result.data.map((r: any) => ({
            id: r._id,
            stationId: r.stationId || "",
            stationName: r.stationName || r.requestedBy || "",
            product: r.product,
            depot: r.depot || r.aiAssignedDepot || "",
            quantity: r.quantity ? `${Number(r.quantity).toLocaleString()} L` : "",
            priority: r.priority || "normal",
            deliveryDate: r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString("en-NG") : "",
            notes: r.notes || "",
            requestedBy: r.requestedBy || "",
            requestedAt: r.createdAt || "",
            status: r.status,
          }));
          setRequests([...BASE_SUPPLY_REQUESTS, ...apiReqs]);
        }
      });
    });
  }, []);

  const update = async (id: string, status: SupplyRequest["status"]) => {
    const req = requests.find(r => r.id === id);
    const next = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(next);
    // Persist to DB
    const { api } = await import("@/lib/db-client");
    await api.supplyRequests.update(id, { status });
    if (req) {
      const msgs: Record<string, { title: string; message: string }> = {
        Processing: { title: "Supply Request Processing", message: `Your supply request (${id}) for ${req.quantity} of ${req.product} from ${req.depot} is now being processed.` },
        Delivered: { title: "Supply Delivered", message: `Your supply request (${id}) for ${req.quantity} of ${req.product} has been delivered to ${req.stationName}.` },
        Cancelled: { title: "Supply Request Cancelled", message: `Your supply request (${id}) for ${req.quantity} of ${req.product} has been cancelled by the administrator.` },
      };
      if (msgs[status]) pushNotification("customer_notifications", { type: "supply", href: "/customer", ...msgs[status] });
    }
    setToast(`Request ${id} → ${status}`);
    if (selected?.id === id) setSelected(p => p ? { ...p, status } : null);
  };

  const counts: Record<string, number> = { All: requests.length };
  ["Pending", "Processing", "Delivered", "Cancelled"].forEach(s => { counts[s] = requests.filter(r => r.status === s).length; });
  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

  const pc = (p: string) => p === "emergency" ? "red" : p === "urgent" ? "yellow" : "gray";
  const sc = (s: string) => s === "Delivered" ? "green" : s === "Processing" ? "blue" : s === "Pending" ? "yellow" : "red";
  const prc = (p: string) => p === "PMS" ? "red" : p === "AGO" ? "blue" : "orange";

  return (
    <div className="space-y-4">
      <FilterBar options={["All", "Pending", "Processing", "Delivered", "Cancelled"]} active={filter} counts={counts} onChange={setFilter} />

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
          <span className="col-span-2">ID</span>
          <span className="col-span-2">Company</span>
          <span className="col-span-1">Product</span>
          <span className="col-span-2">Depot</span>
          <span className="col-span-1">Qty</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Priority</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No requests found</p>}
        {filtered.map(req => (
          <div key={req.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 items-center">
            <span className="col-span-2 text-purple-400 font-mono text-xs">{req.id}</span>
            <div className="col-span-2">
              <p className="text-white text-xs truncate">{req.stationName.split(" - ")[0]}</p>
              <p className="text-gray-500 text-xs">{req.requestedBy}</p>
            </div>
            <span className="col-span-1"><Badge label={req.product} color={prc(req.product)} /></span>
            <span className="col-span-2 text-gray-400 text-xs truncate">{req.depot}</span>
            <span className="col-span-1 text-gray-300 text-xs">{req.quantity}</span>
            <span className="col-span-1"><Badge label={req.status} color={sc(req.status)} /></span>
            <span className="col-span-1"><Badge label={req.priority} color={pc(req.priority)} /></span>
            <div className="col-span-2 flex justify-end gap-1 flex-wrap">
              <button onClick={() => setSelected(req)} className="text-xs text-purple-400 border border-purple-500/40 px-2 py-1 rounded hover:text-purple-300">View</button>
              {req.status === "Pending" && <button onClick={() => update(req.id, "Processing")} className="text-xs text-blue-400 border border-blue-500/40 px-2 py-1 rounded hover:text-blue-300">Process</button>}
              {req.status === "Processing" && <button onClick={() => update(req.id, "Delivered")} className="text-xs text-green-400 border border-green-500/40 px-2 py-1 rounded hover:text-green-300">Deliver</button>}
              {(req.status === "Pending" || req.status === "Processing") && <button onClick={() => update(req.id, "Cancelled")} className="text-xs text-red-400 border border-red-500/40 px-2 py-1 rounded hover:text-red-300">Cancel</button>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.id} subtitle={`Requested by ${selected.requestedBy}`}>
          <div className="space-y-3 text-sm mb-5">
            {[
              ["Company", selected.stationName],
              ["Depot", selected.depot],
              ["Quantity", selected.quantity],
              ["Delivery Date", selected.deliveryDate],
              ["Requested At", new Date(selected.requestedAt).toLocaleString("en-NG")],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="text-white text-right">{v}</span></div>
            ))}
            <div className="flex justify-between"><span className="text-gray-400">Product</span><Badge label={selected.product} color={prc(selected.product)} /></div>
            <div className="flex justify-between"><span className="text-gray-400">Priority</span><Badge label={selected.priority} color={pc(selected.priority)} /></div>
            <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge label={selected.status} color={sc(selected.status)} /></div>
            {selected.notes && <div><span className="text-gray-400 block mb-1">Notes</span><p className="text-white bg-black/30 rounded p-2 text-xs">{selected.notes}</p></div>}
          </div>
          {selected.status !== "Delivered" && selected.status !== "Cancelled" && (
            <div className="flex justify-end gap-2">
              {selected.status === "Pending" && <button onClick={() => update(selected.id, "Processing")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">Mark Processing</button>}
              {selected.status === "Processing" && <button onClick={() => update(selected.id, "Delivered")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">Mark Delivered</button>}
              <button onClick={() => update(selected.id, "Cancelled")} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">Cancel Request</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Products (Global Stock & Management) ──────────────────────────

const AVAILABLE_PRODUCTS = ["PMS", "AGO", "ATK"];

function SectionProducts({ setToast }: { setToast: (m: string) => void }) {
  const [customProducts, setCustomProducts] = useState<string[]>([]);
  const [globalStock, setGlobalStock] = useState<Record<string, { level: number; price: string; status: "Available" | "Limited" | "Unavailable" }>>({
    PMS: { level: 60, price: "₦1,300/L", status: "Available" },
    AGO: { level: 60, price: "₦1,900/L", status: "Available" },
    ATK: { level: 60, price: "₦1,300/L", status: "Available" },
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<typeof globalStock>({});
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const allProducts = [...AVAILABLE_PRODUCTS, ...customProducts];

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      (api.platformSettings as any).get?.().then((s: any) => {
        if (s?.productCatalog) setGlobalStock(s.productCatalog);
      }).catch(() => null);
    });
  }, []);

  const saveGlobalStock = () => {
    const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, "")) || 0;
    setGlobalStock(draft);
    setEditing(false);
    setToast("Prices saved and propagating to all depots…");
    import("@/lib/db-client").then(async ({ api }) => {
      await api.platformSettings.update({ productCatalog: draft } as any).catch(() => null);
      // Propagate prices (only) to every depot
      const result = await api.depots.list({ limit: 100 } as any).catch(() => null);
      if (result?.data?.length) {
        await Promise.all(result.data.map((d: any) =>
          api.depots.update(d._id, {
            "PMS.price": parsePrice(draft.PMS?.price ?? "0"),
            "AGO.price": parsePrice(draft.AGO?.price ?? "0"),
            "ATK.price": parsePrice(draft.ATK?.price ?? "0"),
          } as any).catch(() => null)
        ));
        setToast(`Prices updated across ${result.data.length} depots`);
      }
    });
  };

  const applyToAllDepots = () => {
    const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, "")) || 0;
    import("@/lib/db-client").then(async ({ api }) => {
      const result = await api.depots.list({ limit: 100 } as any);
      if (!result?.data?.length) { setToast("No depots found"); return; }
      await Promise.all(result.data.map((d: any) =>
        api.depots.update(d._id, {
          "PMS.level": draft.PMS?.level ?? 60, "PMS.price": parsePrice(draft.PMS?.price ?? "0"), "PMS.status": draft.PMS?.status ?? "Available",
          "AGO.level": draft.AGO?.level ?? 60, "AGO.price": parsePrice(draft.AGO?.price ?? "0"), "AGO.status": draft.AGO?.status ?? "Available",
          "ATK.level": draft.ATK?.level ?? 60, "ATK.price": parsePrice(draft.ATK?.price ?? "0"), "ATK.status": draft.ATK?.status ?? "Available",
        } as any).catch(() => null)
      ));
      setGlobalStock(draft);
      setEditing(false);
      setToast(`Applied to ${result.data.length} depots`);
    });
  };

  const addNewProduct = () => {
    if (!newProductName.trim() || !newProductPrice.trim()) return;
    const upperName = newProductName.toUpperCase();
    if (allProducts.includes(upperName)) return;
    setCustomProducts([...customProducts, upperName]);
    setGlobalStock({ ...globalStock, [upperName]: { level: 0, price: newProductPrice, status: "Available" as const } });
    setToast(`Product ${upperName} added`);
    setNewProductName("");
    setNewProductPrice("");
    setAddProductOpen(false);
  };

  const pColor = (p: string) => p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : p === "ATK" ? "text-orange-400" : "text-green-400";
  const statusColor = (s: string) => s === "Available" ? "bg-green-500/10 text-green-400 border-green-500/30" : s === "Limited" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : "bg-red-500/10 text-red-400 border-red-500/30";
  const levelBar = (n: number) => n < 20 ? "bg-red-500" : n < 40 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Product Catalog</h2>
          <p className="text-gray-400 text-sm mt-1">Manage products and global stock levels</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setDraft(JSON.parse(JSON.stringify(globalStock))); setEditing(true); }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition">
            Edit Global Stock
          </button>
          <button onClick={() => setAddProductOpen(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition">
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {allProducts.map(p => (
          <div key={p} className="bg-black/40 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-bold ${pColor(p)}`}>{p}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(globalStock[p]?.status || "Unavailable")}`}>
                {globalStock[p]?.status || "Unavailable"}
              </span>
            </div>
            <p className="text-2xl font-black text-white mb-1">{globalStock[p]?.level ?? 0}%</p>
            <div className="h-2 bg-gray-700 rounded-full mb-2">
              <div className={`h-2 rounded-full ${levelBar(globalStock[p]?.level ?? 0)}`} style={{ width: `${globalStock[p]?.level ?? 0}%` }} />
            </div>
            <p className="text-xs text-gray-400">{globalStock[p]?.price || "N/A"}</p>
          </div>
        ))}
      </div>

      {allProducts.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>No products configured</p>
          <button onClick={() => setAddProductOpen(true)} className="mt-2 text-purple-400 hover:text-purple-300">Add your first product</button>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(false)} title="Edit Global Stock" subtitle="Affects all depots when applied">
          <div className="space-y-4 mb-5">
            {allProducts.map(p => (
              <div key={p} className="bg-black/30 rounded-lg p-4 border border-gray-700">
                <p className={`text-sm font-bold mb-3 ${pColor(p)}`}>{p}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Stock Level (%)</label>
                    <input type="number" min={0} max={100}
                      value={draft[p]?.level ?? 0}
                      onChange={e => setDraft(prev => ({ ...prev, [p]: { ...prev[p], level: Math.min(100, Math.max(0, Number(e.target.value))) } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Price</label>
                    <input type="text"
                      value={draft[p]?.price || ""}
                      onChange={e => setDraft(prev => ({ ...prev, [p]: { ...prev[p], price: e.target.value } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs block mb-1">Status</label>
                    <select value={draft[p]?.status || "Available"}
                      onChange={e => setDraft(prev => ({ ...prev, [p]: { ...prev[p], status: e.target.value as "Available" | "Limited" | "Unavailable" } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500">
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={applyToAllDepots}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition">
              Save & Apply to All Depots
            </button>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button onClick={saveGlobalStock} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium">Save</button>
            </div>
          </div>
        </Modal>
      )}

      {addProductOpen && (
        <Modal onClose={() => setAddProductOpen(false)} title="Add New Product" subtitle="Create a new product for the platform">
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Product Name</label>
              <input type="text"
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                placeholder="e.g., LNG, CNG, Biofuel"
                className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Price</label>
              <input type="text"
                value={newProductPrice}
                onChange={e => setNewProductPrice(e.target.value)}
                placeholder="e.g., ₦500/L"
                className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAddProductOpen(false)} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
            <button onClick={addNewProduct}
              disabled={!newProductName.trim() || !newProductPrice.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg font-medium">
              Add Product
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Purchase Orders ─────────────────────────────────────────────────

function SectionPurchaseOrders({ setToast }: { setToast: (m: string) => void }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(BASE_PURCHASE_ORDERS);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.purchaseOrders.list({ limit: 200 } as any).then((result) => {
        if (!result?.data?.length) return;
        const mapped: PurchaseOrder[] = result.data.map((o: any) => ({
          id: o.orderId || o._id,
          _id: o._id,
          dealer: o.companyName || o.dealer || "—",
          product: ((o.productType as string)?.toUpperCase() as "PMS" | "AGO" | "ATK") || "PMS",
          depot: o.loadingDepot || "—",
          qty: o.productQuantity ? `${Number(o.productQuantity).toLocaleString()} L` : "—",
          amount: o.totalAmount ? `₦${Number(o.totalAmount).toLocaleString()}` : "—",
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-NG") : "—",
          status: (o.status as PurchaseOrder["status"]) || "Pending",
        }));
        setOrders(mapped);
      }).catch(() => null);
    });
  }, []);

  const update = (id: string, status: PurchaseOrder["status"]) => {
    const po = orders.find(o => o.id === id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(p => p ? { ...p, status } : null);
    if (po && (po as any)._id) {
      import("@/lib/db-client").then(({ api }) => {
        api.purchaseOrders.update((po as any)._id, { status } as any).catch(() => null);
      });
    }
    if (po) {
      const msgs: Record<string, { title: string; message: string }> = {
        Processing: { title: "Purchase Order Processing", message: `Your purchase order ${id} for ${po.qty} of ${po.product} is now being processed at ${po.depot}.` },
        "In Transit": { title: "Order In Transit", message: `Your purchase order ${id} for ${po.qty} of ${po.product} is now in transit from ${po.depot}.` },
        Delivered: { title: "Order Delivered", message: `Your purchase order ${id} for ${po.qty} of ${po.product} (${po.amount}) has been delivered.` },
      };
      if (msgs[status]) pushNotification("bulk_dealer_notifications", { type: "order", href: "/bulk-dealer/dashboard", ...msgs[status] });
    }
    setToast(`${id} → ${status}`);
  };

  const counts: Record<string, number> = { All: orders.length };
  ["Pending", "Processing", "In Transit", "Delivered"].forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });
  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);

  const sc = (s: string) => s === "Delivered" ? "green" : s === "In Transit" ? "blue" : s === "Processing" ? "yellow" : "gray";
  const prc = (p: string) => p === "PMS" ? "red" : p === "AGO" ? "blue" : "orange";

  return (
    <div className="space-y-4">
      <FilterBar options={["All", "Pending", "Processing", "In Transit", "Delivered"]} active={filter} counts={counts} onChange={setFilter} />

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
          <span className="col-span-2">PO ID</span>
          <span className="col-span-2">Dealer</span>
          <span className="col-span-1">Product</span>
          <span className="col-span-2">Depot</span>
          <span className="col-span-1">Qty</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">View</span>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No orders found</p>}
        {filtered.map(po => (
          <div key={po.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 items-center">
            <span className="col-span-2 text-purple-400 font-mono text-xs">{po.id}</span>
            <span className="col-span-2 text-gray-300 text-xs truncate">{po.dealer || "—"}</span>
            <span className="col-span-1"><Badge label={po.product} color={prc(po.product)} /></span>
            <span className="col-span-2 text-gray-400 text-xs truncate">{po.depot}</span>
            <span className="col-span-1 text-gray-300 text-xs">{po.qty}</span>
            <span className="col-span-2 text-green-400 text-xs font-medium">{po.amount}</span>
            <span className="col-span-1"><Badge label={po.status} color={sc(po.status)} /></span>
            <div className="col-span-1 flex justify-end">
              <button onClick={() => setSelected(po)} className="text-xs text-purple-400 border border-purple-500/40 px-2 py-1 rounded hover:text-purple-300">View</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.id} subtitle={selected.dealer}>
          <div className="space-y-3 text-sm mb-5">
            {[["Date", selected.date], ["Depot", selected.depot], ["Quantity", selected.qty]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="text-white">{v}</span></div>
            ))}
            <div className="flex justify-between"><span className="text-gray-400">Product</span><Badge label={selected.product} color={prc(selected.product)} /></div>
            <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-green-400 font-medium">{selected.amount}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge label={selected.status} color={sc(selected.status)} /></div>
          </div>
          <div className="flex justify-end gap-2">
            {selected.status === "Pending" && <button onClick={() => update(selected.id, "Processing")} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg">Mark Processing</button>}
            {selected.status === "Processing" && <button onClick={() => update(selected.id, "In Transit")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">Mark In Transit</button>}
            {selected.status === "In Transit" && <button onClick={() => update(selected.id, "Delivered")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">Mark Delivered</button>}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Depots ──────────────────────────────────────────────────────────

const EMPTY_DEPOT_PRODUCTS = { level: 0, price: "₦0/L", status: "Available" as DepotProduct["status"], capacityLitres: 0, currentLitres: 0 };
const DEPOT_CODE_TTL = 3 * 60 * 60 * 1000;
const DEPOT_CODE_WINDOW = 6 * 60 * 60 * 1000;

function getCodeExpiryLabel() {
  const nextWindow = (Math.floor(Date.now() / DEPOT_CODE_WINDOW) + 1) * DEPOT_CODE_WINDOW;
  const ms = nextWindow - Date.now();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function useDepotAccess() {
  const [unlockExpiry, setUnlockExpiry] = useState<number | null>(null);

  const isUnlocked = unlockExpiry !== null && unlockExpiry > Date.now();

  const unlock = () => {
    const expiry = Date.now() + DEPOT_CODE_TTL;
    setUnlockExpiry(expiry);
  };

  const remainingLabel = () => {
    if (!unlockExpiry) return "";
    const ms = unlockExpiry - Date.now();
    if (ms <= 0) return "";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
  };

  return { isUnlocked, unlock, remainingLabel };
}

function SectionDepots({ setToast }: { setToast: (m: string) => void }) {
  const { isUnlocked, unlock, remainingLabel } = useDepotAccess();
  const [currentCode, setCurrentCode] = useState("••••••••");

  useEffect(() => {
    fetch("/api/admin/depot-code")
      .then(r => r.json())
      .then(d => { if (d.code) setCurrentCode(d.code); })
      .catch(() => {});
  }, []);

  const [depots, setDepots] = useState<Depot[]>([]);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.depots.list().then((result) => {
        if (!result || result.data.length === 0) return;
        const fmtP = (n: number) => `₦${n.toLocaleString()}/L`;
        const deriveLevel = (p: any, defaultCap: number) => {
          const cap = p?.capacityLitres ?? defaultCap;
          const cur = p?.currentLitres ?? Math.round((p?.level ?? 0) / 100 * cap);
          return { level: cap > 0 ? Math.round(cur / cap * 100) : (p?.level ?? 0), capacityLitres: cap, currentLitres: cur };
        };
        const apiDepots = result.data.map((d: any) => ({
          name:     d.name,
          location: d.location || "",
          logo:     d.logo,
          PMS: { ...deriveLevel(d.PMS, 220000), price: d.PMS?.price ? fmtP(d.PMS.price) : "₦1,300/L", status: (d.PMS?.status as any) || "Available" },
          AGO: { ...deriveLevel(d.AGO, 260000), price: d.AGO?.price ? fmtP(d.AGO.price) : "₦1,900/L", status: (d.AGO?.status as any) || "Available" },
          ATK: { ...deriveLevel(d.ATK, 120000), price: d.ATK?.price ? fmtP(d.ATK.price) : "₦1,300/L", status: (d.ATK?.status as any) || "Available" },
          _id: d._id,
        })) as Depot[];
        setDepots((prev) => {
          const apiNames = new Set(apiDepots.map(d => d.name));
          const localOnly = prev.filter(d => !apiNames.has(d.name));
          return [...apiDepots, ...localOnly];
        });
      });
    });
  }, []);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Depot | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDepotLogo, setNewDepotLogo] = useState<string>("");
  const [draftLogo, setDraftLogo] = useState<string>("");
  const [newDepot, setNewDepot] = useState<Depot>({
    name: "", location: "",
    PMS: { ...EMPTY_DEPOT_PRODUCTS },
    AGO: { ...EMPTY_DEPOT_PRODUCTS },
    ATK: { ...EMPTY_DEPOT_PRODUCTS },
  });

  const handleLogoFile = (file: File, setter: (v: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => setter((e.target?.result as string) || "");
    reader.readAsDataURL(file);
  };

  // Code gate state
  const [showCodeGate, setShowCodeGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | { depot: Depot } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const requestAccess = (action: "add" | { depot: Depot }) => {
    if (isUnlocked) {
      executeAction(action);
    } else {
      setPendingAction(action);
      setCodeInput("");
      setCodeError("");
      setShowCodeGate(true);
    }
  };

  const submitCode = async () => {
    try {
      const res = await fetch("/api/admin/depot-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCodeError("Invalid code. Please contact the super admin.");
        return;
      }
    } catch {
      setCodeError("Could not validate code. Try again.");
      return;
    }
    unlock();
    setShowCodeGate(false);
    if (pendingAction) executeAction(pendingAction);
    setPendingAction(null);
    setCodeInput("");
    setCodeError("");
    setToast("Depot access granted for 3 hours");
  };

  const executeAction = (action: "add" | { depot: Depot }) => {
    if (action === "add") {
      setShowAdd(true);
    } else {
      setEditing(action.depot.name);
      setDraft(JSON.parse(JSON.stringify(action.depot)));
      setDraftLogo(action.depot.logo || "");
    }
  };

  const saveNewDepot = () => {
    if (!newDepot.name.trim() || !newDepot.location.trim()) return;
    const depotWithLogo = { ...newDepot, logo: newDepotLogo || undefined };
    const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, "")) || 0;
    const derivedLevel = (p: DepotProduct) => p.capacityLitres > 0 ? Math.round(p.currentLitres / p.capacityLitres * 100) : p.level;
    fetch("/api/db/depots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newDepot.name.trim(),
        location: newDepot.location.trim(),
        ...(newDepotLogo ? { logo: newDepotLogo } : {}),
        PMS: { level: derivedLevel(newDepot.PMS), price: parsePrice(newDepot.PMS.price), status: newDepot.PMS.status, capacityLitres: newDepot.PMS.capacityLitres, currentLitres: newDepot.PMS.currentLitres },
        AGO: { level: derivedLevel(newDepot.AGO), price: parsePrice(newDepot.AGO.price), status: newDepot.AGO.status, capacityLitres: newDepot.AGO.capacityLitres, currentLitres: newDepot.AGO.currentLitres },
        ATK: { level: derivedLevel(newDepot.ATK), price: parsePrice(newDepot.ATK.price), status: newDepot.ATK.status, capacityLitres: newDepot.ATK.capacityLitres, currentLitres: newDepot.ATK.currentLitres },
      }),
    })
      .then(r => r.json())
      .then(d => setDepots(prev => [...prev, { ...depotWithLogo, _id: d._id ?? undefined } as any]))
      .catch(() => setDepots(prev => [...prev, depotWithLogo]));
    setToast(`${newDepot.name} added`);
    setShowAdd(false);
    setNewDepotLogo("");
    setNewDepot({ name: "", location: "", PMS: { ...EMPTY_DEPOT_PRODUCTS }, AGO: { ...EMPTY_DEPOT_PRODUCTS }, ATK: { ...EMPTY_DEPOT_PRODUCTS } });
  };

  const startEdit = (depot: Depot) => {
    requestAccess({ depot });
  };

  const saveEdit = () => {
    if (!draft) return;
    const updatedDraft = { ...draft, logo: draftLogo || undefined };
    setDepots(depots.map(d => d.name === draft.name ? updatedDraft : d));
    // Persist to DB for depots with a real MongoDB _id
    if ((draft as any)._id) {
      import("@/lib/db-client").then(({ api }) => {
        const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, "")) || 0;
        const derivedLevel = (p: DepotProduct) => p.capacityLitres > 0 ? Math.round(p.currentLitres / p.capacityLitres * 100) : p.level;
        api.depots.update((draft as any)._id, {
          "PMS.level": derivedLevel(draft.PMS), "PMS.price": parsePrice(draft.PMS.price), "PMS.status": draft.PMS.status, "PMS.capacityLitres": draft.PMS.capacityLitres, "PMS.currentLitres": draft.PMS.currentLitres,
          "AGO.level": derivedLevel(draft.AGO), "AGO.price": parsePrice(draft.AGO.price), "AGO.status": draft.AGO.status, "AGO.capacityLitres": draft.AGO.capacityLitres, "AGO.currentLitres": draft.AGO.currentLitres,
          "ATK.level": derivedLevel(draft.ATK), "ATK.price": parsePrice(draft.ATK.price), "ATK.status": draft.ATK.status, "ATK.capacityLitres": draft.ATK.capacityLitres, "ATK.currentLitres": draft.ATK.currentLitres,
          ...(draftLogo ? { logo: draftLogo } : {}),
        } as any).catch(() => null);
      });
    }
    setToast(`${draft.name} updated`);
    setEditing(null);
    setDraft(null);
    setDraftLogo("");
  };

  const levelBar = (level: number) => level < 20 ? "bg-red-500" : level < 40 ? "bg-yellow-500" : "bg-green-500";
  const pText = (p: string) => p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-orange-400";
  const critical = depots.filter(d => d.PMS.level < 20 || d.AGO.level < 20 || d.ATK.level < 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {isUnlocked ? (
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
              Depot access active — {remainingLabel()}
            </span>
          ) : (
            <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
              Depot changes require a super admin code
            </span>
          )}
          {/* Super admin: current rotating code */}
          <div className="flex items-center gap-2 bg-black/40 border border-gray-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500">Control Code:</span>
            <span className="text-xs font-mono font-bold text-purple-300 tracking-widest">{currentCode}</span>
            <span className="text-xs text-gray-600">· rotates in {getCodeExpiryLabel()}</span>
          </div>
        </div>
        <button
          onClick={() => requestAccess("add")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
        >
          + Add New Depot
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Depots" value={depots.length} sub="Nationwide" color="text-purple-400" />
        <StatCard label="Stock Alerts" value={critical.length} sub="Depots with critical stock" color="text-red-400" />
        <StatCard label="Fully Stocked" value={depots.filter(d => d.PMS.level >= 60 && d.AGO.level >= 60 && d.ATK.level >= 60).length} sub="All products ≥ 60%" color="text-green-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {depots.map(depot => (
          <div key={depot.name} className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold text-sm">{depot.name}</h3>
                <p className="text-gray-500 text-xs">{depot.location}</p>
              </div>
              <div className="flex items-center gap-2">
                {(depot.PMS.level < 20 || depot.AGO.level < 20 || depot.ATK.level < 20) &&
                  <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded">Alert</span>}
                <button onClick={() => startEdit(depot)} className="text-xs text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded hover:text-purple-300">Edit</button>
              </div>
            </div>
            {(["PMS", "AGO", "ATK"] as const).map(p => (
              <div key={p} className="mb-2.5">
                <div className="flex justify-between text-xs mb-1">
                  <span className={pText(p)}>{p}</span>
                  <div className="flex gap-3 text-gray-400">
                    <span>{depot[p].price}</span>
                    <span className={depot[p].level < 20 ? "text-red-400 font-medium" : "text-white"}>{depot[p].level}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full">
                  <div className={`h-1.5 rounded-full transition-all ${levelBar(depot[p].level)}`} style={{ width: `${depot[p].level}%` }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showCodeGate && (
        <Modal onClose={() => { setShowCodeGate(false); setPendingAction(null); }} title="Depot Control Access" subtitle="Enter the super admin code to proceed">
          <div className="space-y-4 mb-5">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
              This action is protected. Request a Depot Control Code from your super admin. The code grants access for 3 hours.
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Depot Control Code</label>
              <input
                type="password"
                placeholder="Enter code"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value); setCodeError(""); }}
                onKeyDown={e => e.key === "Enter" && submitCode()}
                autoFocus
                className="w-full bg-black/40 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
              {codeError && <p className="text-red-400 text-xs mt-1">{codeError}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowCodeGate(false); setPendingAction(null); }} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
            <button onClick={submitCode} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Verify Code</button>
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Add New Depot" subtitle="Fill in depot details and initial stock">
          <div className="space-y-4 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Depot Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sokoto Fuel Terminal"
                  value={newDepot.name}
                  onChange={e => setNewDepot(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Location (State)</label>
                <input
                  type="text"
                  placeholder="e.g. Sokoto"
                  value={newDepot.location}
                  onChange={e => setNewDepot(p => ({ ...p, location: e.target.value }))}
                  className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Depot Logo</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-black/40 border border-dashed border-gray-600 hover:border-purple-500 rounded px-3 py-2 text-center transition">
                  <span className="text-gray-400 text-xs">{newDepotLogo ? "Logo selected — click to change" : "Click to upload logo (PNG, JPG, SVG)"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f, setNewDepotLogo); }} />
                </label>
                {newDepotLogo && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-500/50 bg-black/30 shrink-0">
                    <img src={newDepotLogo} alt="Logo preview" className="w-full h-full object-contain"/>
                    <button onClick={() => setNewDepotLogo("")} className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-bl">×</button>
                  </div>
                )}
              </div>
            </div>
            {(["PMS", "AGO", "ATK"] as const).map(p => (
              <div key={p} className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <p className={`text-sm font-medium mb-3 ${p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-orange-400"}`}>{p}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Tank Capacity (L)</label>
                    <input type="number" min={0}
                      value={newDepot[p].capacityLitres || ""}
                      placeholder="e.g. 500000"
                      onChange={e => setNewDepot(prev => ({ ...prev, [p]: { ...prev[p], capacityLitres: Math.max(0, Number(e.target.value)) } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Current Volume (L)</label>
                    <input type="number" min={0}
                      value={newDepot[p].currentLitres || ""}
                      placeholder="e.g. 300000"
                      onChange={e => setNewDepot(prev => ({ ...prev, [p]: { ...prev[p], currentLitres: Math.max(0, Number(e.target.value)) } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Price (e.g. ₦1,300/L)</label>
                    <input type="text"
                      value={newDepot[p].price}
                      onChange={e => setNewDepot(prev => ({ ...prev, [p]: { ...prev[p], price: e.target.value } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Status</label>
                    <select
                      value={newDepot[p].status}
                      onChange={e => setNewDepot(prev => ({ ...prev, [p]: { ...prev[p], status: e.target.value as DepotProduct["status"] } }))}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500">
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
            <button
              onClick={saveNewDepot}
              disabled={!newDepot.name.trim() || !newDepot.location.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
            >
              Add Depot
            </button>
          </div>
        </Modal>
      )}

      {editing && draft && (
        <Modal onClose={() => { setEditing(null); setDraft(null); setDraftLogo(""); }} title={`Edit — ${draft.name}`} subtitle={draft.location}>
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Depot Logo</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-black/40 border border-dashed border-gray-600 hover:border-purple-500 rounded px-3 py-2 text-center transition">
                  <span className="text-gray-400 text-xs">{draftLogo ? "Logo set — click to change" : "Click to upload logo (PNG, JPG, SVG)"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f, setDraftLogo); }} />
                </label>
                {draftLogo && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-500/50 bg-black/30 shrink-0">
                    <img src={draftLogo} alt="Logo preview" className="w-full h-full object-contain"/>
                    <button onClick={() => setDraftLogo("")} className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-bl">×</button>
                  </div>
                )}
              </div>
            </div>
            {(["PMS", "AGO", "ATK"] as const).map(p => (
              <div key={p} className="bg-black/30 rounded-lg p-3 border border-gray-700">
                <p className={`text-sm font-medium mb-3 ${pText(p)}`}>{p}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Tank Capacity (L)</label>
                    <input type="number" min={0}
                      value={draft[p].capacityLitres || ""}
                      placeholder="e.g. 500000"
                      onChange={e => setDraft(prev => prev ? { ...prev, [p]: { ...prev[p], capacityLitres: Math.max(0, Number(e.target.value)) } } : prev)}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Current Volume (L)</label>
                    <input type="number" min={0}
                      value={draft[p].currentLitres || ""}
                      placeholder="e.g. 300000"
                      onChange={e => setDraft(prev => prev ? { ...prev, [p]: { ...prev[p], currentLitres: Math.max(0, Number(e.target.value)) } } : prev)}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Price (e.g. ₦1,300/L)</label>
                    <input type="text"
                      value={draft[p].price}
                      onChange={e => setDraft(prev => prev ? { ...prev, [p]: { ...prev[p], price: e.target.value } } : prev)}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Status</label>
                    <select
                      value={draft[p].status}
                      onChange={e => setDraft(prev => prev ? { ...prev, [p]: { ...prev[p], status: e.target.value as DepotProduct["status"] } } : prev)}
                      className="w-full bg-black/40 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500">
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setEditing(null); setDraft(null); }} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
            <button onClick={saveEdit} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Trucks ──────────────────────────────────────────────────────────

function SectionTrucks({ setToast }: { setToast: (m: string) => void }) {
  const [activeView, setActiveView] = useState<"review" | "rent">("review");

  // ── Review state ──
  const [trucks, setTrucks] = useState<TruckRecord[]>(BASE_TRUCKS);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.trucks.list({ limit: 200 } as any).then((result) => {
        if (!result || result.data.length === 0) return;
        const apiTrucks: TruckRecord[] = result.data.map((t: any) => ({
          id:              t._id,
          ownerName:       t.ownerName  || "—",
          ownerEmail:      t.ownerEmail || "",
          ownerPhone:      t.ownerPhone || "",
          vehicleType:     t.vehicleType || "Tanker",
          tankCapacity:    t.tankCapacity ? `${t.tankCapacity}` : "",
          compartments:    t.compartments || 0,
          truckRegNumber:  t.truckRegNumber || "—",
          tractorColor:    t.tractorColor || "",
          tankColor:       t.tankColor || "",
          chassisNumber:   t.chassisNumber || "",
          engineNumber:    t.engineNumber || "",
          yearOfManufacture: t.yearOfManufacture || "",
          insuranceProvider: t.insuranceProvider || "",
          insurancePolicyNumber: t.insurancePolicyNumber || "",
          insuranceExpiry: t.insuranceExpiry || "",
          dprCertNumber:   t.dprCertNumber || "",
          dprCertExpiry:   t.dprCertExpiry || "",
          roadWorthinessExpiry: t.roadWorthinessExpiry || "",
          productTypes:    t.productTypes || [],
          zoneRates:       t.zoneRates || {},
          driverName:      t.driverName || "",
          driverPhone:     t.driverPhone || "",
          driverLicenseNumber: t.driverLicenseNumber || "",
          driverLicenseExpiry: t.driverLicenseExpiry || "",
          motorBoyName:    t.motorBoyName || "",
          motorBoyPhone:   t.motorBoyPhone || "",
          status:          t.status === "approved" ? "Approved" : t.status === "rejected" ? "Rejected" : "Pending Review",
          reviewNote:      t.reviewNote || "",
          submittedAt:     t.createdAt ? t.createdAt.slice(0, 10) : "",
          destinationState: t.destinationState || "",
          destinationTown:  t.destinationTown || "",
          dailyRate:       t.dailyRate || "₦0",
        }));
        setTrucks((prev) => {
          const apiIds = new Set(apiTrucks.map(t => t.id));
          const localOnly = prev.filter(t => !apiIds.has(t.id));
          return [...apiTrucks, ...localOnly];
        });
      });
    });
  }, []);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<TruckRecord | null>(null);
  const [note, setNote] = useState("");
  const [rateEdits, setRateEdits] = useState<Record<string, number>>({});

  // ── Rent state ──
  const [rentFilter, setRentFilter] = useState({ vehicleType: "", capacity: "", productType: "" });
  const [showRentResults, setShowRentResults] = useState(false);
  const [selectedRentTruck, setSelectedRentTruck] = useState<TruckRecord | null>(null);
  const [showRequesterForm, setShowRequesterForm] = useState(false);
  const [requester, setRequester] = useState({ fullName: "", phone: "", email: "", company: "", rentalDays: "1", pickupDate: "", notes: "" });
  const [showRentConfirmation, setShowRentConfirmation] = useState(false);

  const approvedTrucks = trucks.filter(t => t.status === "Approved");
  const filteredRentTrucks = approvedTrucks.filter(t => {
    if (rentFilter.vehicleType && t.vehicleType !== rentFilter.vehicleType) return false;
    if (rentFilter.capacity && t.tankCapacity !== rentFilter.capacity) return false;
    if (rentFilter.productType && !t.productTypes.includes(rentFilter.productType)) return false;
    return true;
  });

  const parsedDailyRate = (rate: string) => Number(rate.replace(/[₦,]/g, "")) || 0;

  const decide = (truck: TruckRecord, status: "Approved" | "Rejected") => {
    const approvedZoneRates = status === "Approved" ? { ...truck.zoneRates, ...rateEdits } : undefined;
    const next = trucks.map(t => t.id === truck.id ? { ...t, status, reviewNote: note, approvedZoneRates } : t);
    setTrucks(next);
    // Persist to DB for real IDs
    if (/^[a-f\d]{24}$/i.test(truck.id)) {
      import("@/lib/db-client").then(({ api }) => {
        api.trucks.update(truck.id, {
          status: status.toLowerCase() as any,
          reviewNote: note,
          ...(approvedZoneRates ? { approvedZoneRates } : {}),
        }).catch(() => null);
      });
    }
    if (status === "Approved") {
      pushNotification("truck_owner_notifications", { type: "system", title: "Truck Approved", message: `Your truck ${truck.truckRegNumber} has been approved and is now listed on the platform.${note ? ` Note: ${note}` : ""}`, href: "/truck-owner/dashboard" });
      // Create account + send credentials via email & SMS
      fetch("/api/notify/truck-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName:      truck.ownerName,
          ownerEmail:     truck.ownerEmail,
          ownerPhone:     truck.ownerPhone,
          truckRegNumber: truck.truckRegNumber,
          reviewNote:     note || undefined,
        }),
      }).catch(() => null);
    } else {
      pushNotification("truck_owner_notifications", { type: "system", title: "Truck Rejected", message: `Your truck ${truck.truckRegNumber} was not approved.${note ? ` Reason: ${note}` : " Please review your documentation and resubmit."}`, href: "/truck-owner/dashboard" });
    }
    setToast(`${truck.truckRegNumber} ${status.toLowerCase()}`);
    setSelected(null);
    setNote("");
  };

  const resetToPending = (truck: TruckRecord) => {
    const next = trucks.map(t => t.id === truck.id ? { ...t, status: "Pending Review" as const, reviewNote: "" } : t);
    setTrucks(next);
    if (/^[a-f\d]{24}$/i.test(truck.id)) {
      import("@/lib/db-client").then(({ api }) => {
        api.trucks.update(truck.id, { status: "pending" as any, reviewNote: "" } as any).catch(() => null);
      });
    }
    setToast(`${truck.truckRegNumber} reset to Pending Review`);
    setSelected(null);
    setNote("");
  };

  const counts: Record<string, number> = { All: trucks.length, "Pending Review": trucks.filter(t => t.status === "Pending Review").length, Approved: trucks.filter(t => t.status === "Approved").length, Rejected: trucks.filter(t => t.status === "Rejected").length };
  const filtered = filter === "All" ? trucks : trucks.filter(t => t.status === filter);
  const sc = (s: string) => s === "Approved" ? "green" : s === "Rejected" ? "red" : "yellow";

  const inputCls = "w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500";
  const selectCls = inputCls;

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["review", "rent"] as const).map(v => (
          <button key={v} onClick={() => setActiveView(v)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-colors ${activeView === v ? "bg-purple-600 border-purple-500 text-white" : "bg-black/40 border-gray-700 text-gray-300 hover:border-purple-500"}`}>
            {v === "review" ? "Review Submissions" : "Rent a Truck"}
          </button>
        ))}
      </div>

      {/* ── REVIEW VIEW ── */}
      {activeView === "review" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Trucks" value={trucks.length} />
            <StatCard label="Approved" value={counts.Approved} color="text-green-400" />
            <StatCard label="Pending Review" value={counts["Pending Review"]} color="text-yellow-400" />
            <StatCard label="Rejected" value={counts.Rejected} color="text-red-400" />
          </div>

          <FilterBar options={["All", "Pending Review", "Approved", "Rejected"]} active={filter} counts={counts} onChange={setFilter} />

          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Owner</span>
              <span className="col-span-2">Reg. No.</span>
              <span className="col-span-2">Type</span>
              <span className="col-span-1">Capacity</span>
              <span className="col-span-2">Products</span>
              <span className="col-span-1">Rate/Day</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-1 text-right">Action</span>
            </div>
            {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No trucks found</p>}
            {filtered.map(truck => (
              <div key={truck.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 items-center">
                <div className="col-span-2">
                  <p className="text-white text-xs">{truck.ownerName}</p>
                  <p className="text-gray-500 text-xs">{truck.ownerPhone}</p>
                </div>
                <span className="col-span-2 text-gray-300 font-mono text-xs">{truck.truckRegNumber}</span>
                <span className="col-span-2 text-gray-400 text-xs">{truck.vehicleType}</span>
                <span className="col-span-1 text-gray-300 text-xs">{truck.tankCapacity}</span>
                <div className="col-span-2 flex gap-1 flex-wrap">
                  {truck.productTypes.map(p => (
                    <span key={p} className={`text-xs ${p === "PMS" ? "text-red-400" : p === "AGO" ? "text-blue-400" : "text-orange-400"}`}>{p}</span>
                  ))}
                </div>
                <span className="col-span-1 text-gray-300 text-xs">{truck.dailyRate}</span>
                <span className="col-span-1"><Badge label={truck.status === "Pending Review" ? "Pending" : truck.status} color={sc(truck.status)} /></span>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => { setSelected(truck); setNote(truck.reviewNote || ""); setRateEdits(truck.approvedZoneRates ?? truck.zoneRates ?? {}); }}
                    className="text-xs text-purple-400 border border-purple-500/40 px-2 py-1 rounded hover:text-purple-300">Review</button>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <Modal wide onClose={() => { setSelected(null); setNote(""); }} title={`Truck Review — ${selected.truckRegNumber}`} subtitle={`Submitted ${selected.submittedAt}`}>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Owner Information</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[["Owner", selected.ownerName], ["Email", selected.ownerEmail], ["Phone", selected.ownerPhone]].map(([k, v]) => (
                      <div key={k}><span className="text-gray-500 text-xs block">{k}</span><span className="text-white text-sm">{v || "—"}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Vehicle Details</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["Type", selected.vehicleType], ["Capacity", selected.tankCapacity], ["Compartments", selected.compartments],
                      ["Reg. Number", selected.truckRegNumber], ["Tractor Color", selected.tractorColor], ["Tank Color", selected.tankColor],
                      ["Chassis No.", selected.chassisNumber], ["Engine No.", selected.engineNumber], ["Year of Manufacture", selected.yearOfManufacture],
                      ["Destination State", selected.destinationState], ["Destination Town", selected.destinationTown], ["Daily Rate", selected.dailyRate],
                    ].map(([k, v]) => (
                      <div key={k}><span className="text-gray-500 text-xs block">{k}</span><span className="text-white text-sm font-mono">{v || "—"}</span></div>
                    ))}
                    <div className="col-span-3">
                      <span className="text-gray-500 text-xs block">Product Types</span>
                      <div className="flex gap-2 mt-1">
                        {selected.productTypes.map(p => (
                          <span key={p} className={`text-xs font-bold px-2 py-0.5 rounded ${p === "PMS" ? "bg-red-900/50 text-red-300" : p === "AGO" ? "bg-blue-900/50 text-blue-300" : "bg-orange-900/50 text-orange-300"}`}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {(selected.tractorImageUrl || selected.tankImageUrl) && (
                  <div>
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Truck Photos</p>
                    <div className="grid grid-cols-2 gap-4">
                      {selected.tractorImageUrl && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Tractor / Head Unit</p>
                          <img src={selected.tractorImageUrl} alt="Tractor" className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                        </div>
                      )}
                      {selected.tankImageUrl && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Tank / Body</p>
                          <img src={selected.tankImageUrl} alt="Tank" className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Certifications & Insurance</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["Insurance Provider", selected.insuranceProvider], ["Policy Number", selected.insurancePolicyNumber], ["Insurance Expiry", selected.insuranceExpiry],
                      ["DPR Cert. Number", selected.dprCertNumber], ["DPR Cert. Expiry", selected.dprCertExpiry], ["Road Worthiness Expiry", selected.roadWorthinessExpiry],
                    ].map(([k, v]) => (
                      <div key={k}><span className="text-gray-500 text-xs block">{k}</span><span className="text-white text-sm font-mono">{v || "—"}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Driver Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Driver Name", selected.driverName], ["Driver Phone", selected.driverPhone], ["License Number", selected.driverLicenseNumber], ["License Expiry", selected.driverLicenseExpiry]].map(([k, v]) => (
                      <div key={k}><span className="text-gray-500 text-xs block">{k}</span><span className="text-white text-sm">{v || "—"}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Motor Boy Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Motor Boy Name", selected.motorBoyName], ["Motor Boy Phone", selected.motorBoyPhone], ["ID Type", selected.motorBoyIdType], ["ID Number", selected.motorBoyIdNumber]].map(([k, v]) => (
                      <div key={k}><span className="text-gray-500 text-xs block">{k}</span><span className="text-white text-sm">{v || "—"}</span></div>
                    ))}
                  </div>
                </div>
                {/* Zone Rates */}
                {selected.zoneRates && Object.keys(selected.zoneRates).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-700">Proposed Zone Rates</p>
                    <p className="text-gray-400 text-xs mb-3">Owner's proposed rates per zone. You can adjust before approving — adjusted values become the approved rates.</p>
                    <div className="space-y-2">
                      {Object.entries(selected.zoneRates).map(([zone, proposed]) => (
                        <div key={zone} className="flex items-center gap-3 bg-black/20 border border-gray-700 rounded-lg px-3 py-2">
                          <div className="flex-1">
                            <p className="text-white text-xs font-semibold">{zone}</p>
                            <p className="text-gray-500 text-[10px]">Proposed: ₦{proposed.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">Approved rate (₦)</span>
                            <input
                              type="number"
                              min={0}
                              value={rateEdits[zone] ?? proposed}
                              onChange={e => setRateEdits(prev => ({ ...prev, [zone]: Number(e.target.value) }))}
                              className="w-28 bg-black/40 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          {rateEdits[zone] !== undefined && rateEdits[zone] !== proposed && (
                            <span className="text-yellow-400 text-[10px] font-semibold whitespace-nowrap">Modified</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.reviewNote && (
                  <div className="p-3 bg-black/30 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs mb-1">Previous Review Note</p>
                    <p className="text-gray-200 text-sm">{selected.reviewNote}</p>
                  </div>
                )}
                <div>
                  <label className="text-gray-400 text-xs block mb-1">Review Note {selected.status === "Pending Review" ? "(sent to truck owner)" : ""}</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Describe your decision..."
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div className="flex justify-between items-center">
                  <Badge label={selected.status === "Pending Review" ? "Awaiting Review" : selected.status} color={sc(selected.status)} />
                  <div className="flex gap-2">
                    {selected.status === "Pending Review" && (
                      <>
                        <button onClick={() => decide(selected, "Rejected")} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg">Reject</button>
                        <button onClick={() => decide(selected, "Approved")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">Approve</button>
                      </>
                    )}
                    {selected.status !== "Pending Review" && (
                      <button onClick={() => resetToPending(selected)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Reset to Pending Review</button>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* ── RENT VIEW ── */}
      {activeView === "rent" && (
        <div className="space-y-5">
          {showRequesterForm && selectedRentTruck ? (
            /* ── Step 2: Requester Details ── */
            <div className="space-y-4">
              {/* Selected truck summary */}
              <div className="bg-black/40 border border-gray-700 rounded-xl p-4 flex gap-4 items-start">
                {selectedRentTruck.tractorImageUrl && (
                  <img src={selectedRentTruck.tractorImageUrl} alt="Truck" className="w-24 h-16 object-cover rounded-lg border border-gray-700 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">{selectedRentTruck.truckRegNumber}</p>
                      <p className="text-gray-400 text-xs">{selectedRentTruck.vehicleType} · {selectedRentTruck.tankCapacity}</p>
                    </div>
                    <button onClick={() => { setShowRequesterForm(false); setShowRentResults(true); }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline">Change truck</button>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {selectedRentTruck.productTypes.map(p => (
                      <span key={p} className={`text-xs font-bold px-2 py-0.5 rounded ${p === "PMS" ? "bg-red-900/50 text-red-300" : p === "AGO" ? "bg-blue-900/50 text-blue-300" : "bg-orange-900/50 text-orange-300"}`}>{p}</span>
                    ))}
                    <span className="ml-auto text-orange-400 font-bold text-sm">{selectedRentTruck.dailyRate} / day</span>
                  </div>
                </div>
              </div>

              <form onSubmit={e => { e.preventDefault(); setShowRequesterForm(false); setShowRentConfirmation(true); }} className="space-y-5">
                {/* Requester details */}
                <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 pb-1 border-b border-gray-700">Requester Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Full Name</label>
                      <input className={inputCls} placeholder="Enter full name" value={requester.fullName} onChange={e => setRequester(p => ({ ...p, fullName: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Phone Number</label>
                      <input className={inputCls} placeholder="+234 xxx xxx xxxx" value={requester.phone} onChange={e => setRequester(p => ({ ...p, phone: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Email Address</label>
                      <input className={inputCls} type="email" placeholder="email@example.com" value={requester.email} onChange={e => setRequester(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Company / Organisation (optional)</label>
                      <input className={inputCls} placeholder="e.g. Sunrise Filling Station" value={requester.company} onChange={e => setRequester(p => ({ ...p, company: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Rental details */}
                <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 pb-1 border-b border-gray-700">Rental Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Pickup Date</label>
                      <input className={inputCls} type="date" min={new Date().toISOString().split("T")[0]} value={requester.pickupDate} onChange={e => setRequester(p => ({ ...p, pickupDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Number of Rental Days</label>
                      <input className={inputCls} type="number" min="1" max="90" placeholder="e.g. 3" value={requester.rentalDays} onChange={e => setRequester(p => ({ ...p, rentalDays: e.target.value }))} required />
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-400 text-xs block mb-1">Additional Notes (optional)</label>
                      <textarea className={inputCls + " resize-none"} rows={3} placeholder="Any special requirements..." value={requester.notes} onChange={e => setRequester(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>

                  {/* Cost summary */}
                  {requester.rentalDays && Number(requester.rentalDays) > 0 && (
                    <div className="mt-4 p-3 bg-white/5 border border-gray-700 rounded-lg flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{selectedRentTruck.dailyRate} × {requester.rentalDays} day{Number(requester.rentalDays) !== 1 ? "s" : ""}</span>
                      <span className="text-orange-400 font-bold text-base">
                        ₦{(parsedDailyRate(selectedRentTruck.dailyRate) * Number(requester.rentalDays)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
                  Proceed to Payment →
                </button>
              </form>
            </div>
          ) : (
            /* ── Step 1: Filter + Truck Grid ── */
            <>
              <div className="bg-black/40 border border-gray-700 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Find an Available Truck</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Vehicle Type</label>
                    <select className={selectCls} value={rentFilter.vehicleType} onChange={e => setRentFilter(p => ({ ...p, vehicleType: e.target.value }))}>
                      <option value="">Any Type</option>
                      <option value="Articulated Tanker">Articulated Tanker</option>
                      <option value="Medium Tanker">Medium Tanker</option>
                      <option value="Rigid Tanker">Rigid Tanker</option>
                      <option value="Mini Tanker">Mini Tanker</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Tank Capacity</label>
                    <select className={selectCls} value={rentFilter.capacity} onChange={e => setRentFilter(p => ({ ...p, capacity: e.target.value }))}>
                      <option value="">Any Capacity</option>
                      <option value="10,000 L">10,000 L</option>
                      <option value="20,000 L">20,000 L</option>
                      <option value="33,000 L">33,000 L</option>
                      <option value="45,000 L">45,000 L</option>
                      <option value="60,000 L">60,000 L</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Product Type</label>
                    <select className={selectCls} value={rentFilter.productType} onChange={e => setRentFilter(p => ({ ...p, productType: e.target.value }))}>
                      <option value="">Any Product</option>
                      <option value="PMS">PMS (Petrol)</option>
                      <option value="AGO">AGO (Diesel)</option>
                      <option value="ATK">ATK (Jet Fuel)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={showRentResults ? () => setShowRentResults(false) : () => setShowRentResults(true)}
                  className="mt-4 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
                  {showRentResults ? "← Modify Filters" : "Search Available Trucks →"}
                </button>
              </div>

              {showRentResults && (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">{filteredRentTrucks.length} approved truck{filteredRentTrucks.length !== 1 ? "s" : ""} available</p>
                  {filteredRentTrucks.length === 0 ? (
                    <div className="bg-black/40 border border-gray-700 rounded-xl p-10 text-center">
                      <p className="text-gray-500 text-sm">No approved trucks match your filters</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRentTrucks.map(truck => (
                        <div key={truck.id} className="bg-black/40 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors">
                          {truck.tractorImageUrl && (
                            <img src={truck.tractorImageUrl} alt={truck.truckRegNumber} className="w-full h-36 object-cover" />
                          )}
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-bold font-mono">{truck.truckRegNumber}</p>
                                <p className="text-gray-400 text-xs">{truck.vehicleType} · {truck.tankCapacity}</p>
                              </div>
                              <p className="text-orange-400 font-bold text-sm">{truck.dailyRate}<span className="text-gray-500 font-normal text-xs">/day</span></p>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {truck.productTypes.map(p => (
                                <span key={p} className={`text-xs font-bold px-2 py-0.5 rounded ${p === "PMS" ? "bg-red-900/50 text-red-300" : p === "AGO" ? "bg-blue-900/50 text-blue-300" : "bg-orange-900/50 text-orange-300"}`}>{p}</span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500">Owner: {truck.ownerName} · Driver: {truck.driverName}</div>
                            <button
                              onClick={() => { setSelectedRentTruck(truck); setShowRentResults(false); setShowRequesterForm(true); }}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors">
                              Select Truck
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Rent Confirmation Modal */}
          {showRentConfirmation && selectedRentTruck && (
            <Modal onClose={() => { setShowRentConfirmation(false); setSelectedRentTruck(null); setRequester({ fullName: "", phone: "", email: "", company: "", rentalDays: "1", pickupDate: "", notes: "" }); }} title="Rental Request Submitted">
              <div className="space-y-4 text-sm">
                <div className="w-12 h-12 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <p className="text-center text-gray-300">Rental request confirmed for</p>
                <p className="text-center text-white font-bold text-base">{requester.fullName}</p>
                <div className="bg-black/30 border border-gray-700 rounded-lg p-4 space-y-2">
                  {[["Truck", selectedRentTruck.truckRegNumber], ["Type", selectedRentTruck.vehicleType], ["Pickup", requester.pickupDate], ["Duration", `${requester.rentalDays} day${Number(requester.rentalDays) !== 1 ? "s" : ""}`], ["Total", `₦${(parsedDailyRate(selectedRentTruck.dailyRate) * Number(requester.rentalDays)).toLocaleString()}`], ["Email", requester.email], ["Phone", requester.phone]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="text-white font-medium">{v}</span></div>
                  ))}
                </div>
                <p className="text-gray-500 text-xs text-center">A payment link will be sent to the requester's email and phone within 10–20 minutes.</p>
                <button onClick={() => { setShowRentConfirmation(false); setSelectedRentTruck(null); setRequester({ fullName: "", phone: "", email: "", company: "", rentalDays: "1", pickupDate: "", notes: "" }); }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">Done</button>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section: Transactions ────────────────────────────────────────────────────

function SectionTransactions() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(
    [...BASE_TRANSACTIONS].sort((a, b) => b.date.localeCompare(a.date))
  );

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.transactions.list({ limit: 500 } as any).then((result) => {
        if (!result || result.data.length === 0) return;
        const apiTxns: Transaction[] = result.data.map((t: any) => ({
          id:            t.reference || t._id,
          date:          t.createdAt ? t.createdAt.slice(0, 10) : "",
          type:          t.type === "union_dues" ? "Union Dues" : t.type === "truck_rental" ? "Truck Rental" : t.type === "supply_request" ? "Supply Request" : t.type === "purchase_order" ? "Purchase Order" : "Fuel Purchase",
          depot:         t.depot,
          product:       t.product,
          quantity:      t.quantity ? `${Number(t.quantity).toLocaleString()} L` : undefined,
          totalAmount:   `₦${Number(t.totalAmount || 0).toLocaleString()}`,
          status:        t.status === "completed" ? "Completed" : t.status === "failed" ? "Failed" : "Pending",
          paymentMethod: t.paymentMethod,
          user:          t.userEmail || "—",
        }));
        const seen = new Set<string>();
        const merged = [...apiTxns, ...BASE_TRANSACTIONS].filter((t) => {
          if (seen.has(t.id)) return false; seen.add(t.id); return true;
        }).sort((a, b) => b.date.localeCompare(a.date));
        setTransactions(merged);
      });
    });
  }, []);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    return (
      (t.user.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) &&
      (filter === "All" || t.type === filter || t.status === filter)
    );
  });

  const sc = (s: string) => s === "Completed" ? "green" : s === "Pending" ? "yellow" : "red";
  const tc = (t: string) => t === "Fuel Purchase" ? "blue" : t === "Truck Rental" ? "orange" : "purple";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Transactions" value={transactions.length} />
        <StatCard label="Completed" value={transactions.filter(t => t.status === "Completed").length} color="text-green-400" />
        <StatCard label="Failed / Pending" value={transactions.filter(t => t.status !== "Completed").length} color="text-red-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or transaction ID..."
          className="flex-1 min-w-48 bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
        <FilterBar
          options={["All", "Supply Request", "Purchase Order", "Supply Fulfillment", "Truck Rental", "Union Dues", "Fuel Purchase", "Completed", "Pending", "Failed"]}
          active={filter} onChange={setFilter} />
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
          <span className="col-span-2">ID</span>
          <span className="col-span-2">User</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-1">Date</span>
          <span className="col-span-2">Product / Depot</span>
          <span className="col-span-1">Amount</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">View</span>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No transactions found</p>}
        {filtered.map(txn => (
          <div key={txn.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 items-center">
            <span className="col-span-2 text-purple-400 font-mono text-xs">{txn.id}</span>
            <span className="col-span-2 text-gray-300 text-xs">{txn.user}</span>
            <span className="col-span-2"><Badge label={txn.type} color={tc(txn.type)} /></span>
            <span className="col-span-1 text-gray-400 text-xs">{txn.date}</span>
            <div className="col-span-2">
              {txn.product && <p className="text-xs text-gray-300">{txn.product} — {txn.quantity}</p>}
              {txn.depot && <p className="text-xs text-gray-500 truncate">{txn.depot}</p>}
              {!txn.product && !txn.depot && <span className="text-gray-600 text-xs">—</span>}
            </div>
            <span className="col-span-1 text-green-400 text-xs font-medium">{txn.totalAmount}</span>
            <span className="col-span-1"><Badge label={txn.status} color={sc(txn.status)} /></span>
            <div className="col-span-1 flex justify-end">
              <button onClick={() => setSelected(txn)} className="text-xs text-purple-400 border border-purple-500/40 px-2 py-1 rounded hover:text-purple-300">View</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.id} subtitle={`${selected.type} — ${selected.date}`}>
          <div className="space-y-3 text-sm mb-4">
            {[
              ["User", selected.user],
              ["Payment Method", selected.paymentMethod ?? "—"],
              ["Date", selected.date],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="text-white">{v}</span></div>
            ))}
            {selected.depot && <div className="flex justify-between"><span className="text-gray-400">Depot</span><span className="text-white">{selected.depot}</span></div>}
            {selected.product && <div className="flex justify-between"><span className="text-gray-400">Product</span><span className="text-white">{selected.product}</span></div>}
            {selected.quantity && <div className="flex justify-between"><span className="text-gray-400">Quantity</span><span className="text-white">{selected.quantity}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">Type</span><Badge label={selected.type} color={tc(selected.type)} /></div>
            <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-green-400 font-bold text-base">{selected.totalAmount}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge label={selected.status} color={sc(selected.status)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Reports ─────────────────────────────────────────────────────────

function SectionReports({ users }: { users: AdminUser[] }) {
  const roleRows = ["Customer", "Bulk Dealer", "Truck Owner"].map(role => ({
    role, total: users.filter(u => u.role === role).length,
    active: users.filter(u => u.role === role && u.status === "Active").length,
    suspended: users.filter(u => u.role === role && u.status === "Suspended").length,
  }));

  const [reportDepots, setReportDepots] = useState<Depot[]>([]);
  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.depots.list({ limit: 50 } as any).then((result: any) => {
        if (!result?.data?.length) return;
        setReportDepots(result.data.map((d: any) => ({
          name: d.name, location: d.location || "",
          PMS: { level: d.PMS?.level ?? d.pmsLevel ?? 60, price: String(d.PMS?.price ?? d.pmsPrice ?? 1300), status: "Available" },
          AGO: { level: d.AGO?.level ?? d.agoLevel ?? 60, price: String(d.AGO?.price ?? d.agoPrice ?? 1900), status: "Available" },
          ATK: { level: d.ATK?.level ?? d.atkLevel ?? 60, price: String(d.ATK?.price ?? d.atkPrice ?? 1300), status: "Available" },
        })));
      });
    });
  }, []);

  const [allTxns, setAllTxns] = useState<Transaction[]>(BASE_TRANSACTIONS);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.transactions.list({ limit: 500 } as any).then((result) => {
        if (!result || result.data.length === 0) return;
        const apiTxns: Transaction[] = result.data.map((t: any) => ({
          id: t.reference || t._id, date: t.createdAt?.slice(0, 10) || "",
          type: t.type === "union_dues" ? "Union Dues" : t.type === "truck_rental" ? "Truck Rental" : "Fuel Purchase",
          depot: t.depot, product: t.product,
          totalAmount: `₦${Number(t.totalAmount || 0).toLocaleString()}`,
          status: t.status === "completed" ? "Completed" : t.status === "failed" ? "Failed" : "Pending",
          user: t.userEmail || "—",
        }));
        setAllTxns((prev) => {
          const seen = new Set<string>();
          return [...apiTxns, ...prev].filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
        });
      });
    });
  }, []);
  const txnTypes = ["Supply Request", "Purchase Order", "Supply Fulfillment", "Truck Rental", "Union Dues", "Fuel Purchase"];
  const txnRows = txnTypes.filter(type => allTxns.some(t => t.type === type)).map(type => ({
    type, total: allTxns.filter(t => t.type === type).length,
    completed: allTxns.filter(t => t.type === type && t.status === "Completed").length,
    failed: allTxns.filter(t => t.type === type && t.status === "Failed").length,
  }));

  const depotAlerts = reportDepots.flatMap(d => {
    const out: { depot: string; product: string; level: number }[] = [];
    if (d.PMS.level < 20) out.push({ depot: d.name, product: "PMS", level: d.PMS.level });
    if (d.AGO.level < 20) out.push({ depot: d.name, product: "AGO", level: d.AGO.level });
    if (d.ATK.level < 20) out.push({ depot: d.name, product: "ATK", level: d.ATK.level });
    return out;
  });

  const supplyStats = {
    total: BASE_SUPPLY_REQUESTS.length,
    pending: BASE_SUPPLY_REQUESTS.filter(s => s.status === "Pending").length,
    delivered: BASE_SUPPLY_REQUESTS.filter(s => s.status === "Delivered").length,
    cancelled: BASE_SUPPLY_REQUESTS.filter(s => s.status === "Cancelled").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">User Breakdown</h3>
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 uppercase">
              <span>Role</span><span className="text-center">Total</span><span className="text-center">Active</span><span className="text-center">Suspended</span>
            </div>
            {roleRows.map(r => (
              <div key={r.role} className="grid grid-cols-4 px-4 py-3 border-b border-gray-800/50 text-sm">
                <span className="text-gray-300 text-xs">{r.role}</span>
                <span className="text-white text-center">{r.total}</span>
                <span className="text-green-400 text-center">{r.active}</span>
                <span className="text-red-400 text-center">{r.suspended}</span>
              </div>
            ))}
            <div className="grid grid-cols-4 px-4 py-3 text-sm font-bold border-t border-gray-700">
              <span className="text-white">Total</span>
              <span className="text-white text-center">{users.length}</span>
              <span className="text-green-400 text-center">{users.filter(u => u.status === "Active").length}</span>
              <span className="text-red-400 text-center">{users.filter(u => u.status === "Suspended").length}</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Transactions by Type</h3>
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 uppercase">
              <span className="col-span-2">Type</span><span className="text-center">Total</span><span className="text-center">Completed</span>
            </div>
            {txnRows.map(t => (
              <div key={t.type} className="grid grid-cols-4 px-4 py-3 border-b border-gray-800/50 text-sm">
                <span className="text-gray-300 text-xs col-span-2">{t.type}</span>
                <span className="text-white text-center">{t.total}</span>
                <span className="text-green-400 text-center">{t.completed}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Supply Request Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={supplyStats.total} />
          <StatCard label="Pending" value={supplyStats.pending} color="text-yellow-400" />
          <StatCard label="Delivered" value={supplyStats.delivered} color="text-green-400" />
          <StatCard label="Cancelled" value={supplyStats.cancelled} color="text-red-400" />
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Critical Depot Stock</h3>
        {depotAlerts.length === 0 ? (
          <p className="text-green-400 text-sm">All depots are adequately stocked.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {depotAlerts.map((a, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 font-medium text-sm">{a.depot}</p>
                <p className="text-gray-400 text-xs">{a.product} — {a.level}% remaining</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Truck Fleet Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Trucks" value={BASE_TRUCKS.length} />
          <StatCard label="Approved" value={BASE_TRUCKS.filter(t => t.status === "Approved").length} color="text-green-400" />
          <StatCard label="Pending Review" value={BASE_TRUCKS.filter(t => t.status === "Pending Review").length} color="text-yellow-400" />
          <StatCard label="Rejected" value={BASE_TRUCKS.filter(t => t.status === "Rejected").length} color="text-red-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Section: Station Managers ────────────────────────────────────────────────

interface StationManager {
  id: string;
  name: string;
  email: string;
  password: string;
  depot: string;
  status: "Active" | "Blocked";
  createdAt: string;
}

const BASE_STATION_MANAGERS: StationManager[] = [];

function SectionStationManagers({ setToast }: { setToast: (m: string) => void }) {
  const [managers, setManagers] = useState<StationManager[]>(BASE_STATION_MANAGERS);
  const [showCreate, setShowCreate] = useState(false);
  const [viewActivities, setViewActivities] = useState<StationManager | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", depot: "" });
  const [formError, setFormError] = useState("");
  const [allDepotNames, setAllDepotNames] = useState<string[]>([]);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.depots.list({ limit: 50 } as any).then((result: any) => {
        if (result?.data?.length) setAllDepotNames(result.data.map((d: any) => d.name));
      });
    });
  }, []);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.stationManagers.list({ limit: 200 }).then(result => {
        if (result?.data?.length) {
          const apiSMs: StationManager[] = result.data.map((m: any) => ({
            id: m._id,
            name: m.name,
            email: m.email,
            password: "",
            depot: m.depot,
            status: m.status === "blocked" ? "Blocked" : "Active",
            createdAt: m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : "",
          }));
          setManagers([...BASE_STATION_MANAGERS, ...apiSMs.filter(m => !BASE_STATION_MANAGERS.find((b: any) => b.email === m.email))]);
        }
      });
    });
  }, []);

  const saveManagers = (next: StationManager[]) => {
    setManagers(next);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.depot) {
      setFormError("All fields are required."); return;
    }
    if (managers.some(m => m.email === form.email.trim())) {
      setFormError("Email already in use."); return;
    }

    // Create in DB
    const { api } = await import("@/lib/db-client");
    const result = await api.stationManagers.create({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      passwordHash: form.password.trim(),
      depot: form.depot,
      status: "Active",
      assignedBy: "",
    } as any);

    const sm: StationManager = {
      id: (result as any)?._id ?? `SM-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      depot: form.depot,
      status: "Active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveManagers([...managers, sm]);
    setToast(`${sm.name} created for ${sm.depot}`);
    setForm({ name: "", email: "", password: "", depot: "" });
    setFormError("");
    setShowCreate(false);
  };

  const toggleBlock = async (sm: StationManager) => {
    const newStatus = sm.status === "Active" ? "Blocked" as const : "Active" as const;
    const next = managers.map(m => m.id === sm.id ? { ...m, status: newStatus } : m);
    saveManagers(next);
    // Persist to DB if real _id
    if (sm.id && !sm.id.startsWith("SM-")) {
      const { api } = await import("@/lib/db-client");
      api.stationManagers.update(sm.id, { status: newStatus === "Blocked" ? "Blocked" : "Active" } as any);
    }
    setToast(`${sm.name} ${sm.status === "Active" ? "blocked" : "unblocked"}`);
  };

  const openActivities = (sm: StationManager) => {
    setActivities([]);
    setViewActivities(sm);
  };

  // Group depots by assigned manager
  const depotManagerMap: Record<string, StationManager | null> = {};
  allDepotNames.forEach(d => { depotManagerMap[d] = managers.find(m => m.depot === d) || null; });

  const inputCls = "w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <StatCard label="Total Managers" value={managers.length} sub="Created" color="text-purple-400" />
          <StatCard label="Active" value={managers.filter(m => m.status === "Active").length} sub="Currently active" color="text-green-400" />
          <StatCard label="Blocked" value={managers.filter(m => m.status === "Blocked").length} sub="Restricted" color="text-red-400" />
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition">
          + Create Station Manager
        </button>
      </div>

      {/* Depot–Manager Map */}
      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Depots & Assigned Managers</h2>
        <div className="grid grid-cols-2 gap-3">
          {allDepotNames.map(depot => {
            const sm = depotManagerMap[depot];
            return (
              <div key={depot} className="flex items-center justify-between bg-black/30 border border-gray-700 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{depot}</p>
                  {sm ? (
                    <p className={`text-xs mt-0.5 ${sm.status === "Active" ? "text-green-400" : "text-red-400"}`}>
                      {sm.name} · {sm.status}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">No manager assigned</p>
                  )}
                </div>
                {sm && (
                  <button onClick={() => openActivities(sm)} className="text-xs text-purple-400 border border-purple-500/30 px-2 py-1 rounded hover:text-purple-300 transition">
                    View
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Managers List */}
      {managers.length > 0 && (
        <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">All Station Managers</h2>
          <div className="space-y-3">
            {managers.map(sm => (
              <div key={sm.id} className="flex items-center justify-between bg-black/30 border border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-600/40 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0">
                    {sm.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{sm.name}</p>
                    <p className="text-gray-400 text-xs">{sm.email} · {sm.depot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${sm.status === "Active" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                    {sm.status}
                  </span>
                  <button onClick={() => openActivities(sm)} className="text-xs text-purple-400 border border-purple-500/30 px-2 py-1.5 rounded hover:text-purple-300 transition">
                    Activity
                  </button>
                  <button
                    onClick={() => toggleBlock(sm)}
                    className={`text-xs px-2 py-1.5 rounded border transition ${sm.status === "Active" ? "text-red-400 border-red-500/30 hover:bg-red-500/10" : "text-green-400 border-green-500/30 hover:bg-green-500/10"}`}
                  >
                    {sm.status === "Active" ? "Block" : "Unblock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal onClose={() => { setShowCreate(false); setFormError(""); }} title="Create Station Manager" subtitle="Assign a manager to a depot">
          <div className="space-y-4 mb-5">
            {formError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{formError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Full Name</label>
                <input className={inputCls} placeholder="e.g. Emeka Nwosu" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Email</label>
                <input type="email" className={inputCls} placeholder="manager@energy.ng" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Password</label>
                <input type="text" className={inputCls} placeholder="Set login password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Assign Depot</label>
                <select className={inputCls} value={form.depot} onChange={e => setForm(f => ({ ...f, depot: e.target.value }))}>
                  <option value="">— Select Depot —</option>
                  {allDepotNames.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowCreate(false); setFormError(""); }} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Create Manager</button>
          </div>
        </Modal>
      )}

      {/* Activity Modal */}
      {viewActivities && (
        <Modal onClose={() => setViewActivities(null)} title={`Activity — ${viewActivities.name}`} subtitle={viewActivities.depot}>
          <div className="max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No activity recorded yet</p>
            ) : (
              <div className="space-y-2">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <p className="text-sm text-gray-300">{a.action}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-4">
                      {new Date(a.timestamp).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => setViewActivities(null)} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Section: Activity Log ────────────────────────────────────────────────────

interface ActivityEntry {
  id: string;
  managerId: string;
  action: string;
  depot: string;
  timestamp: string;
}

const DEALER_INFO_MAP: Record<string, { name: string; company: string }> = {
  "BD-CH1P3T": { name: "John Dealer",     company: "Chipet Oil & Gas Ltd"      },
  "BD-E4STF2": { name: "Emeka Nwachukwu", company: "EastFuel Nigeria Ltd"       },
  "BD-SW0L3T": { name: "Tunde Adeyemi",   company: "Southwest Oil Distributors" },
  "BD-0B1EN4": { name: "Adaeze Obi",      company: "Obi Energy Supplies"        },
  "BD-D3LT45": { name: "Chukwudi Eze",    company: "Delta Petroleum Ltd"        },
  "BD-SH3L06": { name: "Yakubu Musa",     company: "Sahel Energy Distributors"  },
};

function SectionActivityLog({ setToast }: { setToast: (m: string) => void }) {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [managers, setManagers] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "sales" | "stock">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, string> = {
      "SM-001": "Adebayo Okafor",
      "SM-002": "Chidi Amaechi",
      "SM-003": "Fatima Bello",
    };
    setManagers(map);
    import("@/lib/db-client").then(({ api }) => {
      (api.stationManagers as any)?.list?.()?.then?.((result: any) => {
        if (!result?.data?.length) return;
        result.data.forEach((m: any) => { map[m._id] = m.name; });
        setManagers({ ...map });
      });
    }).catch(() => null);
  }, []);

  const filtered = logs.filter(l => {
    if (filter === "sales") return l.action.startsWith("Sales recorded");
    if (filter === "stock") return l.action.startsWith("Stock received");
    return true;
  });

  const confirmDelete = (id: string) => setDeleteId(id);
  const doDelete = () => {
    if (!deleteId) return;
    setLogs(logs.filter(l => l.id !== deleteId));
    setDeleteId(null);
    setToast("Activity entry deleted");
  };

  const parseAction = (action: string) => {
    const parts = action.split(" | ");
    const isRestock = action.startsWith("Stock received");
    const depotMatch = parts[0]?.match(/at (.+)$/);
    const depotName = depotMatch?.[1] ?? "—";
    const codeMatch = parts[1]?.match(/Dealer:\s*(.+)/);
    const code = codeMatch?.[1]?.trim() ?? "—";
    const productLines = parts.slice(2).join(" | ").split(" · ").filter(Boolean);
    return { isRestock, depotName, code, productLines };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Station Manager Activity Log</h2>
          <p className="text-gray-400 text-xs mt-0.5">All stock movements recorded by station managers. Only you can delete entries.</p>
        </div>
        <div className="flex gap-2">
          {(["all", "sales", "stock"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {f === "all" ? "All" : f === "sales" ? "Sales" : "Restocks"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No activity records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-700 bg-black/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Dealer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Depot</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const { isRestock, depotName, code, productLines } = parseAction(a.action);
                  const managerName = managers[a.managerId] ?? a.managerId;
                  const dealerInfo = DEALER_INFO_MAP[code];
                  return (
                    <tr key={a.id ?? i} className="border-b border-gray-800/60 last:border-0 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap align-top">
                        {new Date(a.timestamp).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-white text-xs font-semibold">{managerName}</p>
                        <p className="text-gray-500 text-[10px] font-mono">{a.managerId}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-white text-xs font-semibold">{dealerInfo?.name ?? code}</p>
                        <p className="text-orange-400 text-[10px] font-mono">{code}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${isRestock ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-orange-500/10 text-orange-400 border-orange-500/30"}`}>
                          {isRestock ? "Restock" : "Sale"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {productLines.map((line: string, j: number) => (
                            <span key={j} className="inline-block bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{line}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap align-top">{depotName}</td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          onClick={() => confirmDelete(a.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 text-xs transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-2">Delete this entry?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone. The activity record will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button onClick={doDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const GEO_ZONES_SETTINGS: { name: string; states: string[] }[] = [
  { name: "North West",    states: ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"] },
  { name: "North East",    states: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"] },
  { name: "North Central", states: ["Benue", "FCT", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau"] },
  { name: "South West",    states: ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"] },
  { name: "South East",    states: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"] },
  { name: "South South",   states: ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"] },
];

const DEFAULT_STATE_PRICES: Record<string, number> = {
  Jigawa: 200000, Kaduna: 185000, Kano: 190000, Katsina: 195000,
  Kebbi: 210000, Sokoto: 215000, Zamfara: 205000,
  Adamawa: 230000, Bauchi: 220000, Borno: 250000, Gombe: 225000,
  Taraba: 240000, Yobe: 245000,
  Benue: 180000, FCT: 150000, Kogi: 160000, Kwara: 155000,
  Nasarawa: 165000, Niger: 175000, Plateau: 185000,
  Ekiti: 100000, Lagos: 85000, Ogun: 90000, Ondo: 105000,
  Osun: 95000, Oyo: 95000,
  Abia: 120000, Anambra: 115000, Ebonyi: 130000, Enugu: 125000, Imo: 120000,
  "Akwa Ibom": 140000, Bayelsa: 145000, "Cross River": 135000,
  Delta: 120000, Edo: 115000, Rivers: 125000,
};

const DEFAULT_ADMIN_SETTINGS = {
  // ── Platform Identity ──────────────────────────────────────────────────────
  platformName: "e-Nergy",
  tagline: "Nigeria's Digital Fuel Distribution Platform",
  businessAddress: "Plot 12, Trans-Amadi Industrial Layout, Port Harcourt, Rivers State",
  rcNumber: "",
  vatNumber: "",

  // ── Contact & Support ──────────────────────────────────────────────────────
  supportEmail: "support@pipesandbarrels.com",
  supportPhone: "08087550875",
  whatsappNumber: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",

  // ── Fuel Prices ────────────────────────────────────────────────────────────
  pmsPricePerLitre: 897,
  agoPricePerLitre: 1200,
  atkPricePerLitre: 1095,
  lgpPricePerLitre: 620,
  depotCapacityLitres: 5000000,
  lowStockThreshold: 20,

  // ── Operations ─────────────────────────────────────────────────────────────
  urgentDeliveryFee: 50000,
  emergencyDeliveryFee: 50000,
  platformCommissionPct: 0,
  minOrderLitres: 33000,
  maxOrderLitres: 1000000,
  standardLeadTimeHours: 72,
  urgentLeadTimeHours: 24,
  annualMembershipFee: 50000,
  monthlyLevy: 5000,
  loadingSurcharge: 2500,
  bulkDealerYearlyFee: 150000,

  // ── Payment Methods ────────────────────────────────────────────────────────
  paystackPublicKey: "",
  bankName: "First Bank of Nigeria",
  bankAccountName: "PNB Energy Ltd",
  bankAccountNumber: "",
  enablePaystack: true,
  enableBankTransfer: true,
  enableCash: true,
  enableWallet: true,
  enableOpay: true,

  // ── API / Backend ──────────────────────────────────────────────────────────
  backendUrl: "",
  apiKey: "",
  mongoDbConnected: false,

  // ── Notifications ──────────────────────────────────────────────────────────
  notifyNewSupplyRequests: true,
  notifyNewPurchaseOrders: true,
  notifyLowStock: true,
  notifyTruckRegistrations: true,

  // ── Access ─────────────────────────────────────────────────────────────────
  allowNewRegistrations: true,
  depotCodeTtlHours: 3,
  depotCodeSecret: "PNB-DEPOT-CONTROL-SA-2024",
};

// ─── Custom Levies Manager ────────────────────────────────────────────────────
interface CustomLevy { id: string; name: string; amount: number; frequency: string; }

function CustomLeviesManager({ inputCls, labelCls }: { inputCls: string; labelCls: string }) {
  const [levies, setLevies] = useState<CustomLevy[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", amount: "", frequency: "One-time" });
  const [editId, setEditId] = useState<string | null>(null);

  // Load from DB on mount
  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.customLevies.list({ isActive: true }).then(result => {
        if (!result?.data?.length) return;
        setLevies(result.data.map((l: any) => ({
          id: l._id,
          name: l.name,
          amount: l.amount,
          frequency: l.frequency,
        })));
      });
    });
  }, []);

  const persist = (next: CustomLevy[]) => {
    setLevies(next);
  };

  const handleAdd = async () => {
    if (!draft.name.trim() || !draft.amount) return;
    const { api } = await import("@/lib/db-client");
    const result = await api.customLevies.create({
      name: draft.name.trim(),
      amount: parseInt(draft.amount) || 0,
      frequency: draft.frequency as any,
      isActive: true,
      createdBy: "",
    });
    const entry: CustomLevy = {
      id: (result as any)?._id ?? `levy-${Date.now()}`,
      name: draft.name.trim(),
      amount: parseInt(draft.amount) || 0,
      frequency: draft.frequency,
    };
    persist([...levies, entry]);
    setDraft({ name: "", amount: "", frequency: "One-time" });
    setAdding(false);
  };

  const handleEdit = async (id: string, patch: Partial<CustomLevy>) => {
    persist(levies.map(l => l.id === id ? { ...l, ...patch } : l));
    if (!id.startsWith("levy-")) {
      const { api } = await import("@/lib/db-client");
      api.customLevies.update(id, patch as any);
    }
  };

  const handleDelete = async (id: string) => {
    persist(levies.filter(l => l.id !== id));
    if (editId === id) setEditId(null);
    if (!id.startsWith("levy-")) {
      const { api } = await import("@/lib/db-client");
      api.customLevies.delete(id);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Custom Dues & Levies</p>
        <button
          onClick={() => { setAdding(true); setEditId(null); }}
          className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Due / Levy
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-gray-900/60 border border-purple-500/40 rounded-lg p-4 space-y-3">
          <p className="text-white text-xs font-semibold">New Due or Levy</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Name / Label</label>
              <input className={inputCls} placeholder="e.g. Emergency Relief Fund"
                value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                <input className={`${inputCls} pl-6`} type="number" min={0} placeholder="0"
                  value={draft.amount} onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Frequency</label>
              <select className={inputCls} value={draft.frequency} onChange={e => setDraft(p => ({ ...p, frequency: e.target.value }))}>
                {["One-time", "Annual", "Monthly", "Quarterly", "Weekly"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition">Cancel</button>
            <button onClick={handleAdd} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg transition font-semibold">Save</button>
          </div>
        </div>
      )}

      {/* List */}
      {levies.length === 0 && !adding && (
        <p className="text-gray-600 text-xs italic">No custom levies added yet.</p>
      )}
      {levies.map(levy => (
        <div key={levy.id} className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
          {editId === levy.id ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <input className={inputCls} value={levy.name}
                    onChange={e => handleEdit(levy.id, { name: e.target.value })} />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                  <input className={`${inputCls} pl-6`} type="number" min={0} value={levy.amount}
                    onChange={e => handleEdit(levy.id, { amount: parseInt(e.target.value) || 0 })} />
                </div>
                <select className={inputCls} value={levy.frequency}
                  onChange={e => handleEdit(levy.id, { frequency: e.target.value })}>
                  {["One-time", "Annual", "Monthly", "Quarterly", "Weekly"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition">Done</button>
                <button onClick={() => handleDelete(levy.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-500/40 px-3 py-1.5 rounded-lg transition">Delete</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{levy.name}</p>
                <p className="text-gray-400 text-xs">₦{levy.amount.toLocaleString()} &middot; {levy.frequency}</p>
              </div>
              <button onClick={() => setEditId(levy.id)} className="text-xs text-purple-400 border border-purple-500/40 px-2 py-1 rounded hover:text-purple-300 transition">Edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionSettings({ setToast, adminName, setAdminName }: {
  setToast: (m: string) => void;
  adminName: string;
  setAdminName: (n: string) => void;
}) {
  const [tab, setTab] = useState<"profile" | "platform" | "pricing" | "truck_rates" | "operations" | "payments" | "api" | "security" | "maintenance">("profile");

  const [cfg, setCfg] = useState<typeof DEFAULT_ADMIN_SETTINGS>({ ...DEFAULT_ADMIN_SETTINGS });

  // Sync from DB on mount
  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.platformSettings.get().then(result => {
        if (!result) return;
        setCfg({ ...DEFAULT_ADMIN_SETTINGS, ...result } as typeof DEFAULT_ADMIN_SETTINGS);
      });
    });
  }, []);

  const [statePrices, setStatePrices] = useState<Record<string, number>>({ ...DEFAULT_STATE_PRICES });
  const [statePriceDrafts, setStatePriceDrafts] = useState<Record<string, string>>(() => {
    const drafts: Record<string, string> = {};
    Object.entries(DEFAULT_STATE_PRICES).forEach(([k, v]) => { drafts[k] = String(v); });
    return drafts;
  });

  // ── Profile tab state ──
  const [profileDraft, setProfileDraft] = useState({ name: adminName, email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassFields, setShowPassFields] = useState(false);

  // ── Maintenance confirm ──
  const [maintConfirm, setMaintConfirm] = useState<string | null>(null);

  const saveSettings = (patch: Partial<typeof DEFAULT_ADMIN_SETTINGS>) => {
    setCfg({ ...cfg, ...patch });
    import("@/lib/db-client").then(({ api }) => { api.platformSettings.update(patch as any); });
    setToast("Settings saved");
  };

  const savePrices = async () => {
    const patch = {
      pmsPricePerLitre: cfg.pmsPricePerLitre,
      agoPricePerLitre: cfg.agoPricePerLitre,
      atkPricePerLitre: cfg.atkPricePerLitre,
      lgpPricePerLitre: cfg.lgpPricePerLitre,
    };
    setCfg(prev => ({ ...prev, ...patch }));
    setToast("Propagating prices to all depots…");
    const { api } = await import("@/lib/db-client");
    await api.platformSettings.update(patch as any);
    const res = await fetch("/api/admin/update-depot-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pms: cfg.pmsPricePerLitre,
        ago: cfg.agoPricePerLitre,
        atk: cfg.atkPricePerLitre,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      setToast("Failed to update depot prices — are you logged in as admin?");
    } else {
      setToast(`Prices updated across ${data.updated} depots`);
    }
  };

  const saveStatePrices = () => {
    const parsed: Record<string, number> = {};
    Object.entries(statePriceDrafts).forEach(([k, v]) => {
      const n = parseInt(v.replace(/,/g, ""));
      if (!isNaN(n) && n > 0) parsed[k] = n;
    });
    setStatePrices(parsed);
    setToast("Truck rental rates updated");
  };

  const saveProfile = async () => {
    if (!profileDraft.name.trim()) { setToast("Name cannot be empty"); return; }
    if (showPassFields) {
      if (profileDraft.newPassword.length < 6) { setToast("Password must be at least 6 characters"); return; }
      if (profileDraft.newPassword !== profileDraft.confirmPassword) { setToast("Passwords do not match"); return; }
    }
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = meRes.ok ? await meRes.json() : null;
      const userId = meData?.user?._id;
      if (userId) {
        const { api } = await import("@/lib/db-client");
        await api.users.update(userId, { name: profileDraft.name, ...(profileDraft.email ? { email: profileDraft.email } : {}) } as any);
      }
      if (showPassFields && profileDraft.newPassword) {
        await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: profileDraft.newPassword }),
        });
      }
    } catch { /**/ }
    setAdminName(profileDraft.name);
    setToast("Profile updated");
    setShowPassFields(false);
    setProfileDraft(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
  };

  const runMaintenance = (action: string) => {
    if (action === "clear_activity") {
      setToast("Activity log cleared");
    } else if (action === "clear_transactions") {
      setToast("Transaction history cleared");
    } else if (action === "clear_notifications") {
      setToast("All notifications cleared");
    } else if (action === "reset_stock") {
      setToast("Stock data reset to defaults");
    }
    setMaintConfirm(null);
  };

  const TABS = [
    { id: "profile",     label: "Admin Profile",    icon: "👤" },
    { id: "platform",    label: "Platform",         icon: "🌐" },
    { id: "pricing",     label: "Fuel Prices",      icon: "🛢️" },
    { id: "truck_rates", label: "Truck Rates",      icon: "🚛" },
    { id: "operations",  label: "Operations",       icon: "⚙️" },
    { id: "payments",    label: "Payments",         icon: "💳" },
    { id: "api",         label: "API & Backend",    icon: "🔌" },
    { id: "security",    label: "Security & Access", icon: "🔐" },
    { id: "maintenance", label: "Maintenance",      icon: "🔧" },
  ] as const;

  const inputCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition";
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";
  const cardCls = "bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5 space-y-4";
  const saveBtnCls = "px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-sm transition";

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border
              ${tab === t.id ? "bg-purple-600/20 border-purple-500 text-purple-300" : "border-gray-700 text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Account Information</h3>
            <div>
              <label className={labelCls}>Display Name</label>
              <input className={inputCls} value={profileDraft.name} onChange={e => setProfileDraft(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label className={labelCls}>Admin Email</label>
              <input className={inputCls} type="email" value={profileDraft.email} onChange={e => setProfileDraft(p => ({ ...p, email: e.target.value }))} placeholder="admin@energy.ng" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <button onClick={() => setShowPassFields(v => !v)} className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2">
                {showPassFields ? "Hide password fields" : "Change password"}
              </button>
            </div>
            {showPassFields && (
              <div className="space-y-3 border-t border-gray-800 pt-3">
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input className={inputCls} type="password" value={profileDraft.currentPassword} onChange={e => setProfileDraft(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input className={inputCls} type="password" value={profileDraft.newPassword} onChange={e => setProfileDraft(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input className={inputCls} type="password" value={profileDraft.confirmPassword} onChange={e => setProfileDraft(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
            )}
            <div className="pt-1">
              <button onClick={saveProfile} className={saveBtnCls}>Save Profile</button>
            </div>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <span className="text-gray-400 text-sm">Role</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold">Super Admin</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <span className="text-gray-400 text-sm">Current Name</span>
                <span className="text-white text-sm font-semibold">{adminName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <span className="text-gray-400 text-sm">Platform Access</span>
                <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Full Access
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">Session</span>
                <span className="text-gray-300 text-xs">Active · JWT Cookie</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PLATFORM ── */}
      {tab === "platform" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Platform Identity</h3>
            <div>
              <label className={labelCls}>Platform Name</label>
              <input className={inputCls} value={cfg.platformName} onChange={e => setCfg(p => ({ ...p, platformName: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input className={inputCls} value={cfg.tagline} onChange={e => setCfg(p => ({ ...p, tagline: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Business Address</label>
              <textarea className={inputCls} rows={2} value={cfg.businessAddress} onChange={e => setCfg(p => ({ ...p, businessAddress: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>RC Number</label>
                <input className={inputCls} placeholder="e.g. RC1234567" value={cfg.rcNumber} onChange={e => setCfg(p => ({ ...p, rcNumber: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>VAT / TIN</label>
                <input className={inputCls} placeholder="e.g. 12345678-0001" value={cfg.vatNumber} onChange={e => setCfg(p => ({ ...p, vatNumber: e.target.value }))} />
              </div>
            </div>
            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Identity</button>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Contact & Support</h3>
            <div>
              <label className={labelCls}>Support Email</label>
              <input className={inputCls} type="email" value={cfg.supportEmail} onChange={e => setCfg(p => ({ ...p, supportEmail: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Support Phone</label>
                <input className={inputCls} type="tel" value={cfg.supportPhone} onChange={e => setCfg(p => ({ ...p, supportPhone: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>WhatsApp Number</label>
                <input className={inputCls} type="tel" placeholder="+2348012345678" value={cfg.whatsappNumber} onChange={e => setCfg(p => ({ ...p, whatsappNumber: e.target.value }))} />
              </div>
            </div>

            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3 pt-2">Social Media</h3>
            <div>
              <label className={labelCls}>Facebook URL</label>
              <input className={inputCls} placeholder="https://facebook.com/..." value={cfg.facebookUrl} onChange={e => setCfg(p => ({ ...p, facebookUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Instagram URL</label>
                <input className={inputCls} placeholder="https://instagram.com/..." value={cfg.instagramUrl} onChange={e => setCfg(p => ({ ...p, instagramUrl: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Twitter / X URL</label>
                <input className={inputCls} placeholder="https://x.com/..." value={cfg.twitterUrl} onChange={e => setCfg(p => ({ ...p, twitterUrl: e.target.value }))} />
              </div>
            </div>

            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3 pt-2">Notifications</h3>
            {([
              ["notifyNewSupplyRequests", "New Supply Requests"],
              ["notifyNewPurchaseOrders", "New Purchase Orders"],
              ["notifyLowStock",          "Low Stock Alerts"],
              ["notifyTruckRegistrations","Truck Registrations"],
            ] as [keyof typeof DEFAULT_ADMIN_SETTINGS, string][]).map(([key, label]) => (
              <div key={String(key)} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{label}</span>
                <button onClick={() => saveSettings({ [key]: !cfg[key] } as Partial<typeof DEFAULT_ADMIN_SETTINGS>)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${cfg[key] ? "bg-purple-600" : "bg-gray-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg[key] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-gray-800 pt-3">
              <div>
                <span className="text-gray-300 text-sm">Allow New Registrations</span>
                <p className="text-gray-500 text-xs">Users can sign up on the platform</p>
              </div>
              <button onClick={() => saveSettings({ allowNewRegistrations: !cfg.allowNewRegistrations })}
                className={`relative w-10 h-5 rounded-full transition-colors ${cfg.allowNewRegistrations ? "bg-green-600" : "bg-gray-700"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg.allowNewRegistrations ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Contact & Notifications</button>
          </div>
        </div>
      )}

      {/* ── FUEL PRICES ── */}
      {tab === "pricing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Base Fuel Prices (per Litre)</h3>
            <p className="text-gray-500 text-xs -mt-2">These are the platform-wide reference prices used in supply orders and depot pricing.</p>
            {([
              ["pmsPricePerLitre",  "PMS (Petrol)",  "text-red-400"],
              ["agoPricePerLitre",  "AGO (Diesel)",  "text-blue-400"],
              ["atkPricePerLitre",  "ATK (Jet Fuel)", "text-orange-400"],
              ["lgpPricePerLitre",  "LPG (Gas)",      "text-green-400"],
            ] as [keyof typeof DEFAULT_ADMIN_SETTINGS, string, string][]).map(([key, label, color]) => (
              <div key={String(key)} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₦</span>
                    <input className={`${inputCls} pl-7`} type="number" min={0}
                      value={cfg[key] as number}
                      onChange={e => setCfg(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <span className={`text-xs font-black mt-5 ${color}`}>₦{(cfg[key] as number).toLocaleString()}/L</span>
              </div>
            ))}
            <button onClick={savePrices} className={saveBtnCls}>Update Prices</button>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Depot & Inventory Limits</h3>
            <div>
              <label className={labelCls}>Depot Capacity per Product (Litres)</label>
              <input className={inputCls} type="number" min={0} value={cfg.depotCapacityLitres}
                onChange={e => setCfg(p => ({ ...p, depotCapacityLitres: parseInt(e.target.value) || 0 }))} />
              <p className="text-gray-500 text-xs mt-1">Maximum litres each depot can hold per product type.</p>
            </div>
            <div>
              <label className={labelCls}>Low Stock Alert Threshold (%)</label>
              <div className="relative">
                <input className={`${inputCls} pr-8`} type="number" min={1} max={100} value={cfg.lowStockThreshold}
                  onChange={e => setCfg(p => ({ ...p, lowStockThreshold: parseInt(e.target.value) || 0 }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">Alert triggers when depot stock falls below this percentage.</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Current Reference Prices</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">PMS</span><span className="text-red-400 font-bold">₦{cfg.pmsPricePerLitre.toLocaleString()}/L</span></div>
                <div className="flex justify-between"><span className="text-gray-400">AGO</span><span className="text-blue-400 font-bold">₦{cfg.agoPricePerLitre.toLocaleString()}/L</span></div>
                <div className="flex justify-between"><span className="text-gray-400">ATK</span><span className="text-orange-400 font-bold">₦{cfg.atkPricePerLitre.toLocaleString()}/L</span></div>
                <div className="flex justify-between"><span className="text-gray-400">LPG</span><span className="text-green-400 font-bold">₦{cfg.lgpPricePerLitre.toLocaleString()}/L</span></div>
              </div>
            </div>
            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Limits</button>
          </div>
        </div>
      )}

      {/* ── TRUCK RATES ── */}
      {tab === "truck_rates" && (
        <div className={`${cardCls} space-y-5`}>
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-white font-semibold text-sm">Truck Rental Rates by State</h3>
              <p className="text-gray-500 text-xs mt-0.5">Set the base trip price per state. These are shown to customers when booking a truck.</p>
            </div>
            <button onClick={saveStatePrices} className={saveBtnCls}>Save All Rates</button>
          </div>
          <div className="space-y-6">
            {GEO_ZONES_SETTINGS.map(zone => (
              <div key={zone.name}>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">{zone.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {zone.states.map(state => (
                    <div key={state}>
                      <label className="block text-xs text-gray-400 mb-1 font-medium">{state}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                        <input
                          className="w-full bg-gray-900/60 border border-gray-700 rounded-lg pl-6 pr-2 py-2 text-white text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                          type="number" min={0}
                          value={statePriceDrafts[state] ?? String(statePrices[state] ?? 0)}
                          onChange={e => setStatePriceDrafts(p => ({ ...p, [state]: e.target.value }))}
                        />
                      </div>
                      <p className="text-[10px] text-orange-500 mt-0.5 font-bold">
                        ₦{((parseInt(statePriceDrafts[state] || "0") || statePrices[state] || 0) / 1000).toFixed(0)}k
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-gray-800 pt-4">
            <button onClick={saveStatePrices} className={saveBtnCls}>Save All Rates</button>
          </div>
        </div>
      )}

      {/* ── OPERATIONS ── */}
      {tab === "operations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Delivery Fees</h3>
            <p className="text-gray-500 text-xs -mt-2">Flat fees charged on top of the order when a customer selects a priority tier.</p>
            <div>
              <label className={labelCls}>Urgent Delivery Fee (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₦</span>
                <input className={`${inputCls} pl-7`} type="number" min={0}
                  value={cfg.urgentDeliveryFee}
                  onChange={e => setCfg(p => ({ ...p, urgentDeliveryFee: parseInt(e.target.value) || 0 }))} />
              </div>
              <p className="text-gray-500 text-xs mt-1">Applied to "Urgent" priority supply requests.</p>
            </div>
            <div>
              <label className={labelCls}>Emergency Delivery Fee (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₦</span>
                <input className={`${inputCls} pl-7`} type="number" min={0}
                  value={cfg.emergencyDeliveryFee}
                  onChange={e => setCfg(p => ({ ...p, emergencyDeliveryFee: parseInt(e.target.value) || 0 }))} />
              </div>
              <p className="text-gray-500 text-xs mt-1">Applied to "Emergency" priority supply requests.</p>
            </div>
            <div>
              <label className={labelCls}>Platform Commission (%)</label>
              <div className="relative">
                <input className={`${inputCls} pr-8`} type="number" min={0} max={100} step={0.1}
                  value={cfg.platformCommissionPct}
                  onChange={e => setCfg(p => ({ ...p, platformCommissionPct: parseFloat(e.target.value) || 0 }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">Percentage taken from each order value. 0 = disabled.</p>
            </div>
            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Delivery Fees</button>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Order Limits & Lead Times</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min Order (Litres)</label>
                <input className={inputCls} type="number" min={0}
                  value={cfg.minOrderLitres}
                  onChange={e => setCfg(p => ({ ...p, minOrderLitres: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className={labelCls}>Max Order (Litres)</label>
                <input className={inputCls} type="number" min={0}
                  value={cfg.maxOrderLitres}
                  onChange={e => setCfg(p => ({ ...p, maxOrderLitres: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Standard Lead Time (hrs)</label>
                <input className={inputCls} type="number" min={1}
                  value={cfg.standardLeadTimeHours}
                  onChange={e => setCfg(p => ({ ...p, standardLeadTimeHours: parseInt(e.target.value) || 72 }))} />
                <p className="text-gray-500 text-xs mt-1">Shown to customers as expected delivery window.</p>
              </div>
              <div>
                <label className={labelCls}>Urgent Lead Time (hrs)</label>
                <input className={inputCls} type="number" min={1}
                  value={cfg.urgentLeadTimeHours}
                  onChange={e => setCfg(p => ({ ...p, urgentLeadTimeHours: parseInt(e.target.value) || 24 }))} />
              </div>
            </div>

            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3 pt-2">Union Dues & Levies</h3>
            <p className="text-gray-500 text-xs -mt-2">These amounts are charged when members pay dues through the Pay Dues flow.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Annual Membership Fee (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                  <input className={`${inputCls} pl-6`} type="number" min={0}
                    value={cfg.annualMembershipFee}
                    onChange={e => setCfg(p => ({ ...p, annualMembershipFee: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Monthly Levy (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                  <input className={`${inputCls} pl-6`} type="number" min={0}
                    value={cfg.monthlyLevy}
                    onChange={e => setCfg(p => ({ ...p, monthlyLevy: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Loading Surcharge (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                <input className={`${inputCls} pl-6`} type="number" min={0}
                  value={cfg.loadingSurcharge}
                  onChange={e => setCfg(p => ({ ...p, loadingSurcharge: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <CustomLeviesManager inputCls={inputCls} labelCls={labelCls} />

            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3 pt-2">Bulk Dealer Fees</h3>
            <p className="text-gray-500 text-xs -mt-2">Fees charged to bulk dealers for platform access and account maintenance.</p>
            <div>
              <label className={labelCls}>Yearly Account Maintenance Fee (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₦</span>
                <input className={`${inputCls} pl-6`} type="number" min={0}
                  value={cfg.bulkDealerYearlyFee}
                  onChange={e => setCfg(p => ({ ...p, bulkDealerYearlyFee: parseInt(e.target.value) || 0 }))} />
              </div>
              <p className="text-gray-500 text-xs mt-1">Charged annually to maintain bulk dealer account access. Displayed on bulk dealer dashboard.</p>
            </div>

            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Operations</button>
          </div>
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Payment Methods</h3>
            <p className="text-gray-500 text-xs -mt-2">Toggle which methods customers can use at checkout.</p>
            {([
              ["enablePaystack",     "Paystack (Card / Online)", "Customers pay via Paystack checkout"],
              ["enableBankTransfer", "Bank Transfer",             "Manual bank transfer with reference upload"],
              ["enableCash",        "Cash on Delivery",           "Pay at depot on collection"],
              ["enableWallet",      "e-Nergy Wallet",             "Deduct from customer platform wallet"],
              ["enableOpay",        "OPay",                       "Pay via OPay mobile money"],
            ] as [keyof typeof DEFAULT_ADMIN_SETTINGS, string, string][]).map(([key, label, desc]) => (
              <div key={String(key)} className="flex items-start justify-between py-3 border-b border-gray-800/50 gap-4">
                <div>
                  <p className="text-gray-200 text-sm font-semibold">{label}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
                <button onClick={() => saveSettings({ [key]: !cfg[key] } as Partial<typeof DEFAULT_ADMIN_SETTINGS>)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${cfg[key] ? "bg-green-600" : "bg-gray-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg[key] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Paystack Configuration</h3>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400">
              ⚠ Your Paystack public key is safe to store here. Never paste your Secret Key into this field — the secret key belongs only on your Sliplane backend.
            </div>
            <div>
              <label className={labelCls}>Paystack Public Key</label>
              <input className={inputCls} placeholder="pk_live_..." value={cfg.paystackPublicKey}
                onChange={e => setCfg(p => ({ ...p, paystackPublicKey: e.target.value }))} />
              <p className="text-gray-500 text-xs mt-1">Starts with <span className="font-mono text-purple-400">pk_test_</span> or <span className="font-mono text-purple-400">pk_live_</span></p>
            </div>
            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Paystack Key</button>

            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3 pt-2">Bank Transfer Details</h3>
            <p className="text-gray-500 text-xs -mt-2">Shown to customers who choose manual bank transfer at checkout.</p>
            <div>
              <label className={labelCls}>Bank Name</label>
              <input className={inputCls} placeholder="e.g. First Bank of Nigeria" value={cfg.bankName}
                onChange={e => setCfg(p => ({ ...p, bankName: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Account Name</label>
              <input className={inputCls} placeholder="e.g. PNB Energy Ltd" value={cfg.bankAccountName}
                onChange={e => setCfg(p => ({ ...p, bankAccountName: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Account Number</label>
              <input className={inputCls} placeholder="0123456789" maxLength={10} value={cfg.bankAccountNumber}
                onChange={e => setCfg(p => ({ ...p, bankAccountNumber: e.target.value }))} />
            </div>
            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Bank Details</button>
          </div>
        </div>
      )}

      {/* ── API & BACKEND ── */}
      {tab === "api" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="lg:col-span-2">
            <Link href="/admin/backend-summary"
              className="flex items-center gap-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl px-5 py-3.5 transition group">
              <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-orange-400 font-bold text-sm group-hover:text-orange-300 transition">View Full Backend Documentation →</p>
                <p className="text-gray-500 text-xs">17 collections · 7 auth routes · 7 AI routes · migration guide · environment vars</p>
              </div>
            </Link>
          </div>
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Sliplane Backend</h3>
            <p className="text-gray-500 text-xs -mt-2">Configure the connection to your Node.js backend hosted on Sliplane.</p>
            <div>
              <label className={labelCls}>Backend Base URL</label>
              <input className={inputCls} placeholder="https://your-app.sliplane.app" value={cfg.backendUrl}
                onChange={e => setCfg(p => ({ ...p, backendUrl: e.target.value.trim() }))} />
              <p className="text-gray-500 text-xs mt-1">All API calls will be prefixed with this URL.</p>
            </div>
            <div>
              <label className={labelCls}>API Key</label>
              <input className={inputCls} type="password" placeholder="sk_..." value={cfg.apiKey}
                onChange={e => setCfg(p => ({ ...p, apiKey: e.target.value }))} />
              <p className="text-gray-500 text-xs mt-1">Sent as <span className="font-mono text-purple-400">Authorization: Bearer</span> header on every API request.</p>
            </div>

            <div className={`flex items-center gap-3 rounded-xl p-3 border ${cfg.backendUrl ? "bg-green-500/10 border-green-500/30" : "bg-gray-800/40 border-gray-700"}`}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.backendUrl ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              <div>
                <p className={`text-xs font-semibold ${cfg.backendUrl ? "text-green-300" : "text-gray-500"}`}>
                  {cfg.backendUrl ? "Backend URL configured" : "Not configured"}
                </p>
                <p className="text-gray-600 text-xs">{cfg.backendUrl || "Enter a URL above to connect"}</p>
              </div>
            </div>

            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Backend Config</button>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">MongoDB Atlas</h3>
            <p className="text-gray-500 text-xs -mt-2">Your MongoDB connection string lives on the Sliplane server as an environment variable — never on the frontend. Use this panel to verify the connection status once your backend is live.</p>

            <div className={`rounded-xl p-4 border ${cfg.mongoDbConnected ? "bg-green-500/10 border-green-500/30" : "bg-gray-800/40 border-gray-700"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.mongoDbConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                <p className={`text-sm font-semibold ${cfg.mongoDbConnected ? "text-green-300" : "text-gray-400"}`}>
                  {cfg.mongoDbConnected ? "Connected to MongoDB Atlas" : "Not connected"}
                </p>
              </div>
              <p className="text-gray-500 text-xs">Status is reported by your backend at <span className="font-mono text-purple-400">{cfg.backendUrl || "<backend-url>"}/api/health</span></p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Setup Checklist</p>
              {[
                [!!cfg.backendUrl,         "Backend URL configured"],
                [!!cfg.apiKey,             "API key set"],
                [!!cfg.paystackPublicKey,  "Paystack key configured"],
                [cfg.mongoDbConnected,     "MongoDB Atlas connected"],
              ].map(([done, label], i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0 ${done ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-500"}`}>
                    {done ? "✓" : "○"}
                  </span>
                  <span className={done ? "text-gray-300" : "text-gray-500"}>{label as string}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <p className="text-xs text-blue-400 font-semibold mb-1">Backend Environment Variables needed on Sliplane:</p>
              <div className="space-y-1 font-mono text-[11px] text-blue-300/70">
                <p>MONGODB_URI=mongodb+srv://...</p>
                <p>PAYSTACK_SECRET_KEY=sk_live_...</p>
                <p>JWT_SECRET=your-secret-here</p>
                <p>FRONTEND_URL={cfg.platformName ? `https://${cfg.platformName.toLowerCase().replace(/\s/g,"")}.ng` : "https://your-app.ng"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Depot Access Control</h3>
            <div>
              <label className={labelCls}>Depot Code TTL (hours)</label>
              <input className={inputCls} type="number" min={1} max={24} value={cfg.depotCodeTtlHours}
                onChange={e => setCfg(p => ({ ...p, depotCodeTtlHours: parseInt(e.target.value) || 3 }))} />
              <p className="text-gray-500 text-xs mt-1">How long a generated depot access code stays valid.</p>
            </div>
            <div>
              <label className={labelCls}>Depot Code Secret Key</label>
              <input className={inputCls} type="text" value={cfg.depotCodeSecret}
                onChange={e => setCfg(p => ({ ...p, depotCodeSecret: e.target.value }))} />
              <p className="text-gray-500 text-xs mt-1">Secret seed used to generate time-based depot codes. Changing this invalidates all active codes.</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-semibold">⚠ Changing the secret key will immediately invalidate all active depot access codes. Station managers will need new codes.</p>
            </div>
            <button onClick={() => saveSettings(cfg)} className={saveBtnCls}>Save Access Settings</button>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Platform Access</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                <div>
                  <p className="text-gray-300 text-sm">New User Registrations</p>
                  <p className="text-gray-500 text-xs">Allow the public to sign up</p>
                </div>
                <button onClick={() => saveSettings({ allowNewRegistrations: !cfg.allowNewRegistrations })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${cfg.allowNewRegistrations ? "bg-green-600" : "bg-gray-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg.allowNewRegistrations ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500 uppercase font-semibold bg-gray-900/30">Data Storage</div>
                <div className="px-4 py-3 text-xs text-green-400 bg-green-500/5">
                  All platform data is stored in MongoDB Atlas. No client-side localStorage is used for operational data.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAINTENANCE ── */}
      {tab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Data Management</h3>
            <p className="text-gray-500 text-xs -mt-2">These actions clear data stored in the browser. Use with caution — most are irreversible.</p>
            <div className="space-y-3">
              {([
                ["clear_activity",      "Clear Activity Log",         "Removes all station manager activity records from sm_activity_log.",          "bg-yellow-600 hover:bg-yellow-700"],
                ["clear_transactions",  "Clear Transaction History",  "Wipes platform_transactions and customer_transactions from storage.",          "bg-orange-600 hover:bg-orange-700"],
                ["clear_notifications", "Clear All Notifications",    "Removes bulk dealer and customer notification queues.",                        "bg-blue-600 hover:bg-blue-700"],
                ["reset_stock",         "Reset Stock Data",           "Clears dealer_stock, sm_depot_stock, sm_global_stock back to system defaults.","bg-red-600 hover:bg-red-700"],
              ] as [string, string, string, string][]).map(([action, label, desc, btnCls]) => (
                <div key={action} className="flex items-start justify-between gap-4 py-3 border-b border-gray-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm font-semibold">{label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => setMaintConfirm(action)}
                    className={`shrink-0 px-4 py-1.5 ${btnCls} text-white text-xs font-semibold rounded-lg transition`}>
                    Run
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={cardCls}>
            <h3 className="text-white font-semibold text-sm border-b border-gray-800 pb-3">Storage Overview</h3>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-xs text-green-400 font-semibold mb-1">Database Storage Active</p>
              <p className="text-xs text-gray-400">All platform data (transactions, users, supply requests, trucks, depots, notifications) is stored in MongoDB Atlas. No localStorage is used for operational data.</p>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Confirm Modal */}
      {maintConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-white font-bold text-base">Confirm Action</h3>
            <p className="text-gray-400 text-sm">
              Are you sure you want to <span className="text-white font-semibold">
                {maintConfirm === "clear_activity" ? "clear the activity log" :
                 maintConfirm === "clear_transactions" ? "clear all transaction history" :
                 maintConfirm === "clear_notifications" ? "clear all notifications" :
                 "reset all stock data"}
              </span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setMaintConfirm(null)} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800">Cancel</button>
              <button onClick={() => runMaintenance(maintConfirm)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "Overview", icon: "⚡" },
  { id: "Users", icon: "👥" },
  { id: "Supply Requests", icon: "🚚" },
  { id: "Purchase Orders", icon: "📋" },
  { id: "Products", icon: "🛢️" },
  { id: "Depots", icon: "🏭" },
  { id: "Station Managers", icon: "🧑‍💼" },
  { id: "Trucks", icon: "🚛" },
  { id: "Transactions", icon: "💰" },
  { id: "Activity Log", icon: "📝" },
  { id: "Reports", icon: "📊" },
  { id: "Settings", icon: "⚙️" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [adminName, setAdminName] = useState("Admin");
  const [toast, setToastMsg] = useState("");
  const [users, setUsers] = useState<AdminUser[]>(BASE_USERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "admin") { router.replace("/auth/login"); return; }
        setAdminName(u.name || "Admin");

      // Load real users from DB, fall back to BASE_USERS
      import("@/lib/db-client").then(({ api }) => {
        api.users.list({ limit: 500 }).then(result => {
          if (result?.data?.length) {
            const ROLE_MAP: Record<string, AdminUser["role"]> = {
              bulk_dealer: "Bulk Dealer", customer: "Customer", truck_owner: "Truck Owner",
            };
            const apiUsers: AdminUser[] = result.data.map((u: any) => ({
              _id: u._id,
              id: u._id,
              name: u.name,
              email: u.email,
              role: ROLE_MAP[u.role] ?? "Customer",
              status: u.status === "suspended" ? "Suspended" : "Active",
              joinedAt: u.joinedAt ? new Date(u.joinedAt).toLocaleDateString("en-NG") : "—",
              lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-NG") : "Never",
              companyName: u.companyName,
              phone: u.phone,
              state: u.state,
              pmsTankMaxML: u.pmsTankMaxML,
              agoTankMaxML: u.agoTankMaxML,
              atkTankMaxML: u.atkTankMaxML,
            }));
            setUsers(apiUsers);
          } else {
            setUsers(BASE_USERS);
          }
        });
      });
    })
    .catch(() => router.replace("/auth/login"));
  }, [router]);

  const setToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundImage: `url(${tower.src})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <Head><title>Admin Dashboard | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/72" />

      <div className="relative z-10 flex h-screen">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-56 flex flex-col bg-black/80 md:bg-black/50 backdrop-blur-md border-r border-gray-800 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-purple-400 font-bold text-lg tracking-wide">e-Nergy</p>
              <p className="text-gray-500 text-xs">Admin Portal</p>
            </div>
            {/* Close button — mobile only */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${active === item.id ? "bg-purple-600/25 text-purple-300 border-r-2 border-purple-500" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.id}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{adminName}</p>
                <p className="text-gray-500 text-xs">Administrator</p>
              </div>
            </div>
            <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"))}
              className="w-full text-xs text-red-400 border border-red-500/40 rounded-lg py-2 hover:bg-red-500/10 transition-colors">
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 shrink-0 flex items-center gap-3 px-4 md:px-6 bg-black/40 backdrop-blur-md border-b border-gray-800">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-white font-semibold flex-1 truncate">{active}</h1>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:block text-gray-400 text-sm">
                {new Date().toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5 text-green-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="hidden sm:inline">System Online</span>
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {active === "Overview" && <SectionOverview users={users} setActive={setActive} />}
            {active === "Users" && <SectionUsers users={users} setUsers={setUsers} setToast={setToast} />}
            {active === "Supply Requests" && <SectionSupplyRequests setToast={setToast} />}
            {active === "Purchase Orders" && <SectionPurchaseOrders setToast={setToast} />}
            {active === "Products" && <SectionProducts setToast={setToast} />}
            {active === "Depots" && <SectionDepots setToast={setToast} />}
            {active === "Station Managers" && <SectionStationManagers setToast={setToast} />}
            {active === "Trucks" && <SectionTrucks setToast={setToast} />}
            {active === "Transactions" && <SectionTransactions />}
            {active === "Activity Log" && <SectionActivityLog setToast={setToast} />}
            {active === "Reports" && <SectionReports users={users} />}
            {active === "Settings" && <SectionSettings setToast={setToast} adminName={adminName} setAdminName={setAdminName} />}
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
