"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
}

interface TruckRecord {
  _id: string;
  truckRegNumber: string;
  vehicleType: string;
  tankCapacity: number;
  productTypes: string[];
  dailyRate: number;
  driverName: string;
  status: "Pending Review" | "Approved" | "Rejected";
  submittedAt: string;
}

interface RentalRecord {
  _id: string;
  rentalId: string;
  truckRegNumber: string;
  rentedBy: string;
  pickupDepot: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalDays: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Approved:      "bg-green-500/20 text-green-400 border-green-500/40",
    "Pending Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    Rejected:      "bg-red-500/20 text-red-400 border-red-500/40",
    Completed:     "bg-green-500/20 text-green-400 border-green-500/40",
    Active:        "bg-blue-500/20 text-blue-400 border-blue-500/40",
    Requested:     "bg-purple-500/20 text-purple-400 border-purple-500/40",
    Confirmed:     "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    Cancelled:     "bg-red-500/20 text-red-400 border-red-500/40",
  };
  return (map[s] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40") +
    " px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap";
}

function formatNaira(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TruckOwnerDashboard() {
  const router = useRouter();
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [trucks, setTrucks]   = useState<TruckRecord[]>([]);
  const [rentals, setRentals] = useState<RentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"trucks" | "rentals">("trucks");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user || data.user.role !== "truck_owner") { router.replace("/login"); return; }
        setUser({ name: data.user.name, email: data.user.email, phone: data.user.phone });
        const email = data.user.email;
        import("@/lib/db-client").then(({ api }) => {
          Promise.all([
            api.trucks.list({ ownerEmail: email } as any),
            api.truckRentals.list({ truckOwnerEmail: email } as any),
          ]).then(([tRes, rRes]) => {
            if (tRes?.data) setTrucks(tRes.data as any);
            if (rRes?.data) setRentals(rRes.data as any);
          }).catch(() => null).finally(() => setLoading(false));
        }).catch(() => setLoading(false));
      })
      .catch(() => { router.replace("/login"); });
  }, [router]);

  const approvedTrucks  = trucks.filter(t => t.status === "Approved").length;
  const activeRentals   = rentals.filter(r => r.status === "Active" || r.status === "Confirmed" || r.status === "Requested").length;
  const totalEarnings   = rentals.filter(r => r.status === "Completed").reduce((s, r) => s + (r.totalAmount || 0), 0);
  const pendingRentals  = rentals.filter(r => r.status === "Requested").length;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: "url('/tower.jpg')" }}
    >
      <Head><title>Truck Owner Dashboard | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/70 z-0" />

      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-md border-b border-white/10 z-30 flex items-center px-4 sm:px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-black text-white text-sm">e</div>
          <span className="text-white font-bold text-sm hidden sm:block">e-Nergy</span>
        </Link>
        <div className="flex-1" />
        <span className="text-gray-300 text-sm hidden sm:block">{user?.name}</span>
        <button
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.replace("/login"))}
          className="text-xs text-gray-400 hover:text-red-400 border border-white/10 px-3 py-1.5 rounded-lg transition"
        >
          Log out
        </button>
      </header>

      {/* Content */}
      <div className="relative z-10 pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

          {/* Welcome */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage your fleet and track rental earnings.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Trucks"    value={trucks.length}    sub={`${approvedTrucks} approved`} />
            <StatCard label="Active Rentals"  value={activeRentals}    color="text-blue-400" />
            <StatCard label="Pending Requests" value={pendingRentals}  color="text-yellow-400" />
            <StatCard label="Total Earnings"  value={formatNaira(totalEarnings)} sub="completed rentals" color="text-green-400" />
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 border-b border-white/10 pb-px">
            {(["trucks", "rentals"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize rounded-t-lg border-b-2 transition ${
                  tab === t ? "border-orange-500 text-orange-400" : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {t === "trucks" ? `My Trucks (${trucks.length})` : `Rental History (${rentals.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500 text-sm">Loading…</div>
          ) : tab === "trucks" ? (
            <TrucksTable trucks={trucks} />
          ) : (
            <RentalsTable rentals={rentals} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trucks Table ─────────────────────────────────────────────────────────────

function TrucksTable({ trucks }: { trucks: TruckRecord[] }) {
  if (!trucks.length) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <p className="text-gray-400">No trucks registered yet.</p>
        <Link href="/RentTruck" className="mt-4 inline-block text-sm text-orange-400 hover:text-orange-300 underline">
          Register a truck
        </Link>
      </div>
    );
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Reg No.</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Capacity</th>
              <th className="px-4 py-3 text-left">Products</th>
              <th className="px-4 py-3 text-left">Daily Rate</th>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {trucks.map(t => (
              <tr key={t._id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-mono font-bold text-white">{t.truckRegNumber}</td>
                <td className="px-4 py-3 text-gray-300">{t.vehicleType}</td>
                <td className="px-4 py-3 text-gray-300">{Number(t.tankCapacity || 0).toLocaleString()}L</td>
                <td className="px-4 py-3 text-gray-300">{(t.productTypes || []).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-green-400 font-semibold">₦{Number(t.dailyRate || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300">{t.driverName || "—"}</td>
                <td className="px-4 py-3"><span className={statusBadge(t.status)}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Rentals Table ────────────────────────────────────────────────────────────

function RentalsTable({ rentals }: { rentals: RentalRecord[] }) {
  if (!rentals.length) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <p className="text-gray-400">No rental history yet. Earnings will appear here once your trucks are rented.</p>
      </div>
    );
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Rental ID</th>
              <th className="px-4 py-3 text-left">Truck</th>
              <th className="px-4 py-3 text-left">Rented By</th>
              <th className="px-4 py-3 text-left">Depot</th>
              <th className="px-4 py-3 text-left">Days</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rentals.map(r => (
              <tr key={r._id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.rentalId || r._id?.slice(-8)}</td>
                <td className="px-4 py-3 font-bold text-white">{r.truckRegNumber || "—"}</td>
                <td className="px-4 py-3 text-gray-300 max-w-[120px] truncate">{r.rentedBy || "—"}</td>
                <td className="px-4 py-3 text-gray-300">{r.pickupDepot || "—"}</td>
                <td className="px-4 py-3 text-gray-300">{r.totalDays ?? "—"}</td>
                <td className="px-4 py-3 text-green-400 font-semibold">{formatNaira(r.totalAmount)}</td>
                <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                <td className="px-4 py-3">
                  <span className={statusBadge(r.paymentStatus === "Paid" ? "Completed" : r.paymentStatus === "Pending" ? "Pending Review" : r.paymentStatus)}>
                    {r.paymentStatus || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
