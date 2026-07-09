"use client";
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import {
  LayoutDashboard, Users, Truck, Fuel, Building2, Receipt, MapPin,
  Package, ClipboardList, LogOut, RefreshCw,
  AlertTriangle, ArrowRight, Banknote, Gauge, ShieldCheck,
} from "lucide-react";
import { toLabel } from "@/utils/toLabel";

/* Silent read-only fetch — returns null on any error (401, network, non-JSON)
   so the page falls back to demo data without surfacing dev error overlays. */
async function tryGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Restricted Financer Overview Dashboard
   - Identity-gated: only the platform session emails on OVERVIEW_ALLOWED_EMAILS
     (the super admin + one other user) can reach this page. Everyone else gets
     a genuine 404 — the page's existence is not disclosed.
   - View-only (no write actions anywhere). Live data comes from a dedicated,
     allow-list-guarded endpoint; mock data is used only as a visual fallback.
──────────────────────────────────────────────────────────────────────────── */

import type { GetServerSidePropsContext } from "next";
import { isOverviewAllowed } from "@/lib/overviewAccess";

/* Server-side gate. We verify the platform `token` cookie (the same JWT the rest
   of the app issues) and confirm the viewer is authorized to see the overview.
   Authorization is granted EITHER by the OVERVIEW_ALLOWED_EMAILS env allowlist
   (the super-admin bootstrap) OR by a super-admin-granted `financerAccess` flag
   on the user record. Unauthorized visitors — logged-in non-allowlisted users
   and anonymous visitors alike — receive a 404 so the route stays
   undiscoverable. The dashboard markup is never served unless authorized. */
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const token = ctx.req.cookies?.token;
  if (!token || !process.env.JWT_SECRET) {
    return { notFound: true };
  }
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const email = typeof payload?.email === "string" ? payload.email : null;
    const userId = typeof payload?.userId === "string" ? payload.userId : null;
    const role = typeof payload?.role === "string" ? payload.role : null;

    // Path 1 (primary): a financer session. This is either a dedicated Financer
    // account OR a normal user converted to financer-only via the admin toggle.
    // Either way the backing record must still authorize access (Financer not
    // suspended, or User still carrying the financerAccess flag).
    if (role === "financer" && userId) {
      const { connectDB } = await import("@/lib/db");
      await connectDB();
      const { Financer } = await import("@/lib/models/Financer");
      const fin = await Financer.findById(userId).select("status").lean();
      if (fin) {
        if ((fin as { status?: string }).status !== "suspended") {
          return { props: {} };
        }
        return { notFound: true };
      }
      // Not a dedicated account — check for a toggle-converted user.
      const { User } = await import("@/lib/models/User");
      const grantee = await User.findById(userId).select("financerAccess").lean();
      if ((grantee as { financerAccess?: boolean } | null)?.financerAccess) {
        return { props: {} };
      }
      return { notFound: true };
    }

    // Path 2 (legacy/back-compat): the env allowlist, or a super-admin-granted
    // `financerAccess` flag on a normal user account.
    let allowed = isOverviewAllowed(email);
    if (!allowed && userId) {
      const { connectDB } = await import("@/lib/db");
      const { User } = await import("@/lib/models/User");
      await connectDB();
      const grantee = await User.findById(userId).select("financerAccess").lean();
      allowed = Boolean(
        (grantee as { financerAccess?: boolean } | null)?.financerAccess
      );
    }
    if (!allowed) {
      return { notFound: true };
    }
  } catch {
    return { notFound: true };
  }
  return { props: {} };
}

// ─── Formatting helpers ─────────────────────────────────────────────────────
const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;
const num = (n: number) => (n || 0).toLocaleString();
const perL = (n: number) => `₦${(n || 0).toLocaleString()}/L`;
function timeAgo(d?: string | Date) {
  if (!d) return "—";
  const t = new Date(d).getTime();
  if (isNaN(t)) return "—";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Mock data (fallback for testing) ───────────────────────────────────────
const MOCK = {
  settings: {
    platformName: "e-Nergy",
    pmsPricePerLitre: 897,
    agoPricePerLitre: 1200,
    atkPricePerLitre: 1095,
    bulkDealerYearlyFee: 150000,
    annualMembershipFee: 50000,
  },
  dealers: [
    {
      _id: "d1", name: "Chidi Okonkwo", companyName: "BrightFlow Petroleum Ltd",
      email: "chidi@brightflow.ng", phone: "0803 111 2233", role: "bulk_dealer",
      status: "active", dealerCode: "BD-CH1P3T", rcNumber: "RC-482910", dprLicence: "DPR-PMS-0291",
      state: "Lagos", lga: "Amuwo-Odofin", headOfficeAddress: "14 Trans-Amadi Road, Apapa, Lagos",
      pmsTankMaxML: 8, agoTankMaxML: 5, atkTankMaxML: 3,
      prices: { PMS: 905, AGO: 1215, ATK: 1100 }, joinedAt: "2026-01-12",
    },
    {
      _id: "d2", name: "Amina Bello", companyName: "Sahel Energy Distribution",
      email: "amina@sahelenergy.ng", phone: "0805 444 5566", role: "bulk_dealer",
      status: "active", dealerCode: "BD-AM7K9Z", rcNumber: "RC-661204", dprLicence: "DPR-AGO-1145",
      state: "Kano", lga: "Nassarawa", headOfficeAddress: "Zaria Road Industrial Layout, Kano",
      pmsTankMaxML: 6, agoTankMaxML: 7, atkTankMaxML: 2,
      prices: { PMS: 899, AGO: 1205, ATK: 1098 }, joinedAt: "2026-02-03",
    },
    {
      _id: "d3", name: "Emeka Nwosu", companyName: "Delta Prime Oil & Gas",
      email: "emeka@deltaprime.ng", phone: "0807 777 8899", role: "bulk_dealer",
      status: "active", dealerCode: "BD-EM4R2Q", rcNumber: "RC-330876", dprLicence: "DPR-PMS-0774",
      state: "Delta", lga: "Warri South", headOfficeAddress: "Refinery Road, Effurun, Warri",
      pmsTankMaxML: 10, agoTankMaxML: 9, atkTankMaxML: 4,
      prices: { PMS: 910, AGO: 1220, ATK: 1105 }, joinedAt: "2025-11-28",
    },
    {
      _id: "d4", name: "Fatima Yusuf", companyName: "Northgate Fuels Nigeria",
      email: "fatima@northgatefuels.ng", phone: "0809 222 3344", role: "bulk_dealer",
      status: "suspended", dealerCode: "BD-FA8T1L", rcNumber: "RC-559013", dprLicence: "DPR-ATK-0410",
      state: "Kaduna", lga: "Kaduna North", headOfficeAddress: "Ahmadu Bello Way, Kaduna",
      pmsTankMaxML: 4, agoTankMaxML: 4, atkTankMaxML: 6,
      prices: { PMS: 915, AGO: 1225, ATK: 1090 }, joinedAt: "2026-03-19",
    },
    {
      _id: "d5", name: "Tunde Adeyemi", companyName: "Coastline Bulk Supplies",
      email: "tunde@coastlinebulk.ng", phone: "0802 555 6677", role: "bulk_dealer",
      status: "active", dealerCode: "BD-TU3N6V", rcNumber: "RC-771265", dprLicence: "DPR-PMS-1330",
      state: "Rivers", lga: "Port Harcourt", headOfficeAddress: "Aba Road, GRA Phase 2, Port Harcourt",
      pmsTankMaxML: 7, agoTankMaxML: 6, atkTankMaxML: 3,
      prices: { PMS: 902, AGO: 1210, ATK: 1102 }, joinedAt: "2026-01-30",
    },
    {
      _id: "d6", name: "Ngozi Eze", companyName: "Enugu Valley Petroleum",
      email: "ngozi@enuguvalley.ng", phone: "0806 999 0011", role: "bulk_dealer",
      status: "pending", dealerCode: "BD-NG2W5X", rcNumber: "RC-908431", dprLicence: "DPR-AGO-2201",
      state: "Enugu", lga: "Enugu East", headOfficeAddress: "Abakaliki Road, Emene, Enugu",
      pmsTankMaxML: 5, agoTankMaxML: 5, atkTankMaxML: 2,
      prices: { PMS: 900, AGO: 1208, ATK: 1099 }, joinedAt: "2026-06-22",
    },
  ],
  allocations: [
    { _id: "a1", dealerEmail: "chidi@brightflow.ng", dealerName: "BrightFlow Petroleum Ltd", product: "PMS", volumeLitres: 450000, usedLitres: 320000, depot: "Lagos Main Depot", status: "active", validTo: "2026-09-30" },
    { _id: "a2", dealerEmail: "chidi@brightflow.ng", dealerName: "BrightFlow Petroleum Ltd", product: "AGO", volumeLitres: 260000, usedLitres: 260000, depot: "Lagos Main Depot", status: "exhausted", validTo: "2026-08-15" },
    { _id: "a3", dealerEmail: "amina@sahelenergy.ng", dealerName: "Sahel Energy Distribution", product: "AGO", volumeLitres: 380000, usedLitres: 140000, depot: "Kano Distribution Hub", status: "active", validTo: "2026-10-12" },
    { _id: "a4", dealerEmail: "emeka@deltaprime.ng", dealerName: "Delta Prime Oil & Gas", product: "PMS", volumeLitres: 620000, usedLitres: 410000, depot: "Warri Storage Facility", status: "active", validTo: "2026-11-01" },
    { _id: "a5", dealerEmail: "emeka@deltaprime.ng", dealerName: "Delta Prime Oil & Gas", product: "ATK", volumeLitres: 180000, usedLitres: 55000, depot: "Warri Storage Facility", status: "active", validTo: "2026-12-05" },
    { _id: "a6", dealerEmail: "tunde@coastlinebulk.ng", dealerName: "Coastline Bulk Supplies", product: "PMS", volumeLitres: 300000, usedLitres: 90000, depot: "Port Harcourt Terminal", status: "active", validTo: "2026-09-18" },
    { _id: "a7", dealerEmail: "fatima@northgatefuels.ng", dealerName: "Northgate Fuels Nigeria", product: "ATK", volumeLitres: 210000, usedLitres: 210000, depot: "Kaduna Distribution Center", status: "revoked", validTo: "2026-07-01" },
  ],
  transactions: [
    { _id: "t1", txnId: "TXN-90211", type: "purchase_order", user: "BrightFlow Petroleum Ltd", userEmail: "chidi@brightflow.ng", userRole: "bulk_dealer", product: "PMS", quantity: "45000", totalAmount: 40725000, status: "completed", paymentMethod: "globalpay", depot: "Lagos Main Depot", timestamp: "2026-07-06" },
    { _id: "t2", txnId: "TXN-90210", type: "purchase_order", user: "Delta Prime Oil & Gas", userEmail: "emeka@deltaprime.ng", userRole: "bulk_dealer", product: "PMS", quantity: "60000", totalAmount: 54600000, status: "completed", paymentMethod: "globalpay", depot: "Warri Storage Facility", timestamp: "2026-07-05" },
    { _id: "t3", txnId: "TXN-90209", type: "purchase_order", user: "Sahel Energy Distribution", userEmail: "amina@sahelenergy.ng", userRole: "bulk_dealer", product: "AGO", quantity: "40000", totalAmount: 48200000, status: "pending", paymentMethod: "globalpay", depot: "Kano Distribution Hub", timestamp: "2026-07-05" },
    { _id: "t4", txnId: "TXN-90208", type: "union_dues", user: "Coastline Bulk Supplies", userEmail: "tunde@coastlinebulk.ng", userRole: "bulk_dealer", product: "", quantity: "", totalAmount: 150000, status: "completed", paymentMethod: "globalpay", depot: "Port Harcourt Terminal", timestamp: "2026-07-04" },
    { _id: "t5", txnId: "TXN-90207", type: "truck_rental", user: "BrightFlow Petroleum Ltd", userEmail: "chidi@brightflow.ng", userRole: "bulk_dealer", product: "AGO", quantity: "33000", totalAmount: 890000, status: "completed", paymentMethod: "globalpay", depot: "Lagos Main Depot", timestamp: "2026-07-03", aiFlagged: true, aiAnomalySeverity: "low" },
    { _id: "t6", txnId: "TXN-90206", type: "purchase_order", user: "Coastline Bulk Supplies", userEmail: "tunde@coastlinebulk.ng", userRole: "bulk_dealer", product: "PMS", quantity: "30000", totalAmount: 27060000, status: "completed", paymentMethod: "globalpay", depot: "Port Harcourt Terminal", timestamp: "2026-07-02" },
    { _id: "t7", txnId: "TXN-90205", type: "supply_request", user: "Zenith Retail Station", userEmail: "ops@zenithretail.ng", userRole: "customer", product: "PMS", quantity: "20000", totalAmount: 17940000, status: "completed", paymentMethod: "globalpay", depot: "Abuja Central Terminal", timestamp: "2026-07-02" },
    { _id: "t8", txnId: "TXN-90204", type: "purchase_order", user: "Sahel Energy Distribution", userEmail: "amina@sahelenergy.ng", userRole: "bulk_dealer", product: "AGO", quantity: "35000", totalAmount: 42175000, status: "failed", paymentMethod: "globalpay", depot: "Kano Distribution Hub", timestamp: "2026-07-01" },
  ],
  supplyRequests: [
    { _id: "s1", requestId: "SUP-REQ-3391", stationName: "Zenith Retail Station", product: "PMS", quantity: 20000, depot: "Abuja Central Terminal", priority: "urgent", status: "delivered", requestedBy: "ops@zenithretail.ng" },
    { _id: "s2", requestId: "SUP-REQ-3392", stationName: "Peak Fuels Ikeja", product: "AGO", quantity: 15000, depot: "Lagos Main Depot", priority: "normal", status: "in_transit", requestedBy: "info@peakfuels.ng" },
    { _id: "s3", requestId: "SUP-REQ-3393", stationName: "Unity Filling Station", product: "PMS", quantity: 30000, depot: "Kano Distribution Hub", priority: "emergency", status: "processing", requestedBy: "unity@fills.ng" },
    { _id: "s4", requestId: "SUP-REQ-3394", stationName: "Coastal Energy Retail", product: "ATK", quantity: 12000, depot: "Port Harcourt Terminal", priority: "normal", status: "pending", requestedBy: "coastal@retail.ng" },
  ],
  purchaseOrders: [
    { _id: "p1", orderId: "BUY-771201", companyName: "BrightFlow Petroleum Ltd", dealer: "chidi@brightflow.ng", productType: "PMS", productQuantity: 45000, loadingDepot: "Lagos Main Depot", status: "delivered", totalAmount: 40725000 },
    { _id: "p2", orderId: "BUY-771202", companyName: "Delta Prime Oil & Gas", dealer: "emeka@deltaprime.ng", productType: "PMS", productQuantity: 60000, loadingDepot: "Warri Storage Facility", status: "in_transit", totalAmount: 54600000 },
    { _id: "p3", orderId: "BUY-771203", companyName: "Sahel Energy Distribution", dealer: "amina@sahelenergy.ng", productType: "AGO", productQuantity: 40000, loadingDepot: "Kano Distribution Hub", status: "processing", totalAmount: 48200000 },
    { _id: "p4", orderId: "BUY-771204", companyName: "Coastline Bulk Supplies", dealer: "tunde@coastlinebulk.ng", productType: "PMS", productQuantity: 30000, loadingDepot: "Port Harcourt Terminal", status: "delivered", totalAmount: 27060000 },
  ],
  trucks: [
    { _id: "k1", status: "approved" }, { _id: "k2", status: "approved" },
    { _id: "k3", status: "pending_review" }, { _id: "k4", status: "rejected" },
  ],
  truckRentals: [
    { _id: "r1", status: "active", paymentStatus: "paid", totalAmount: 890000 },
    { _id: "r2", status: "confirmed", paymentStatus: "unpaid", totalAmount: 1200000 },
    { _id: "r3", status: "completed", paymentStatus: "paid", totalAmount: 650000 },
  ],
  depots: [
    { name: "Lagos Main Depot", state: "Lagos", PMS: { level: 72, price: 897, status: "available" }, AGO: { level: 61, price: 1200, status: "available" }, ATK: { level: 40, price: 1095, status: "limited" } },
    { name: "Port Harcourt Terminal", state: "Rivers", PMS: { level: 55, price: 902, status: "available" }, AGO: { level: 33, price: 1210, status: "limited" }, ATK: { level: 18, price: 1102, status: "limited" } },
    { name: "Warri Storage Facility", state: "Delta", PMS: { level: 80, price: 910, status: "available" }, AGO: { level: 74, price: 1220, status: "available" }, ATK: { level: 52, price: 1105, status: "available" } },
    { name: "Kano Distribution Hub", state: "Kano", PMS: { level: 44, price: 899, status: "available" }, AGO: { level: 66, price: 1205, status: "available" }, ATK: { level: 9, price: 1098, status: "unavailable" } },
    { name: "Kaduna Distribution Center", state: "Kaduna", PMS: { level: 30, price: 915, status: "limited" }, AGO: { level: 25, price: 1225, status: "limited" }, ATK: { level: 60, price: 1090, status: "available" } },
    { name: "Abuja Central Terminal", state: "FCT", PMS: { level: 68, price: 897, status: "available" }, AGO: { level: 58, price: 1200, status: "available" }, ATK: { level: 47, price: 1095, status: "limited" } },
  ],
  unionDues: [
    { _id: "u1", status: "paid" }, { _id: "u2", status: "paid" },
    { _id: "u3", status: "pending" }, { _id: "u4", status: "overdue" },
  ],
};

const PRODUCTS = ["PMS", "AGO", "ATK"] as const;

// ─── Small UI atoms ─────────────────────────────────────────────────────────
function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    pending_review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    processing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    in_transit: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    confirmed: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    limited: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    suspended: "bg-red-500/15 text-red-300 border-red-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
    revoked: "bg-red-500/15 text-red-300 border-red-500/30",
    overdue: "bg-red-500/15 text-red-300 border-red-500/30",
    unavailable: "bg-red-500/15 text-red-300 border-red-500/30",
    exhausted: "bg-gray-600/30 text-foreground border-line",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[value] || "bg-card-2/40 text-foreground border-line"}`}>
      {toLabel(value)}
    </span>
  );
}

function Stat({ icon: Icon, label, value, sub, tone = "orange" }: {
  icon: any; label: string; value: string; sub?: string; tone?: string;
}) {
  const tones: Record<string, string> = {
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className="bg-card/60 border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      {sub && <p className="text-xs text-muted mt-1.5">{sub}</p>}
    </div>
  );
}

function LevelBar({ level }: { level: number }) {
  const color = level < 20 ? "bg-red-500" : level < 40 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-full h-1.5 rounded-full bg-card-2 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, level)}%` }} />
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="bg-card/40 border border-dashed border-line rounded-xl py-12 flex flex-col items-center justify-center text-center">
      <Icon className="w-6 h-6 text-muted mb-2" />
      <p className="text-sm text-muted">{label}</p>
      <p className="text-[11px] text-muted mt-0.5">Records will appear here once data is available.</p>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
type Data = {
  settings: any; dealers: any[]; allocations: any[]; transactions: any[];
  supplyRequests: any[]; purchaseOrders: any[]; trucks: any[];
  truckRentals: any[]; depots: any[]; unionDues: any[];
};

/* Mock data is a DEVELOPMENT-ONLY convenience so the dashboard renders populated
   before the database is seeded. In production we never fabricate figures on a
   financial oversight page — an empty database shows clean empty states instead.
   `process.env.NODE_ENV` is inlined by Next at build time, so every mock fallback
   below collapses to an empty array in the production build. */
const DEV = process.env.NODE_ENV !== "production";

const EMPTY: Data = {
  settings: null, dealers: [], allocations: [], transactions: [],
  supplyRequests: [], purchaseOrders: [], trucks: [],
  truckRentals: [], depots: [], unionDues: [],
};

const INITIAL: Data = DEV
  ? {
      settings: MOCK.settings, dealers: MOCK.dealers, allocations: MOCK.allocations,
      transactions: MOCK.transactions, supplyRequests: MOCK.supplyRequests,
      purchaseOrders: MOCK.purchaseOrders, trucks: MOCK.trucks,
      truckRentals: MOCK.truckRentals, depots: MOCK.depots, unionDues: MOCK.unionDues,
    }
  : EMPTY;

export default function FinancerOverview() {
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(DEV); // true only while showing dev mock data
  const [data, setData] = useState<Data>(INITIAL);
  const [openDealer, setOpenDealer] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    // Single allow-list-guarded endpoint. It returns already-projected, safe
    // fields for every dataset (no admin-only /api/db/* calls needed).
    const res = await tryGet<Partial<Data>>("/api/overview/data");

    // In production the fallback is empty (no fabricated data); in dev it's MOCK.
    const pick = <T,>(rows: any, fallback: T[]): { rows: T[]; live: boolean } =>
      Array.isArray(rows) && rows.length
        ? { rows, live: true }
        : { rows: DEV ? fallback : [], live: false };

    const d = pick(res?.dealers, MOCK.dealers);
    const a = pick(res?.allocations, MOCK.allocations);
    const t = pick(res?.transactions, MOCK.transactions);
    const s = pick(res?.supplyRequests, MOCK.supplyRequests);
    const p = pick(res?.purchaseOrders, MOCK.purchaseOrders);
    const k = pick(res?.trucks, MOCK.trucks);
    const r = pick(res?.truckRentals, MOCK.truckRentals);
    const dp = pick(res?.depots, MOCK.depots);
    const u = pick(res?.unionDues, MOCK.unionDues);

    const hadLive = [d, a, t, s, p, k, r, dp, u].some((x) => x.live) || !!res?.settings;
    // "Demo" only applies in dev when we fell back to mock. Production is never demo.
    setDemo(DEV && !hadLive);
    setData({
      settings: res?.settings || (DEV ? MOCK.settings : null),
      dealers: d.rows, allocations: a.rows, transactions: t.rows,
      supplyRequests: s.rows, purchaseOrders: p.rows, trucks: k.rows,
      truckRentals: r.rows, depots: dp.rows, unionDues: u.rows,
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ── Derived metrics ──
  const m = useMemo(() => {
    const tx = data.transactions;
    const completed = tx.filter((x) => x.status === "completed");
    const totalValue = completed.reduce((s, x) => s + (x.totalAmount || 0), 0);
    const dealerValue = completed.filter((x) => x.userRole === "bulk_dealer").reduce((s, x) => s + (x.totalAmount || 0), 0);
    const flagged = tx.filter((x) => x.aiFlagged).length;
    const activeDealers = data.dealers.filter((x) => x.status === "active").length;
    const pendingSupply = data.supplyRequests.filter((x) => ["pending", "processing"].includes(x.status)).length;
    const inTransit = data.supplyRequests.filter((x) => x.status === "in_transit").length;
    const approvedTrucks = data.trucks.filter((x) => x.status === "approved").length;
    const allocVol = data.allocations.reduce((s, x) => s + (x.volumeLitres || 0), 0);
    const allocUsed = data.allocations.reduce((s, x) => s + (x.usedLitres || 0), 0);
    return {
      totalValue, dealerValue, flagged, activeDealers, pendingSupply, inTransit,
      approvedTrucks, allocVol, allocUsed,
      poCount: data.purchaseOrders.length,
      poVolume: data.purchaseOrders.reduce((s, x) => s + (x.productQuantity || 0), 0),
    };
  }, [data]);

  const settings = data.settings;
  const productPrice: Record<string, number> = {
    PMS: settings?.pmsPricePerLitre ?? 897,
    AGO: settings?.agoPricePerLitre ?? 1200,
    ATK: settings?.atkPricePerLitre ?? 1095,
  };

  const TABS = [
    { id: "Overview", icon: LayoutDashboard },
    { id: "Bulk Dealers", icon: Building2 },
    { id: "Operations Flow", icon: ClipboardList },
    { id: "Transactions", icon: Receipt },
    { id: "Depots & Pricing", icon: Fuel },
  ];

  function exit() {
    // End the session, then return to the financer login page.
    fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
      .catch(() => null)
      .finally(() => { window.location.href = "/financer/login"; });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head><title>Financer Overview · e-Nergy</title></Head>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card/85 backdrop-blur border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Gauge className="w-4.5 h-4.5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-sm leading-tight">Financer Overview</h1>
            <p className="text-[11px] text-muted leading-tight">Restricted read-only dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${demo ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${demo ? "bg-amber-400" : "bg-emerald-400"}`} />
            {demo ? "Demo data" : "Live data"}
          </span>
          <button onClick={load} title="Refresh"
            className="w-8 h-8 rounded-lg border border-line hover:border-line flex items-center justify-center text-muted hover:text-foreground transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-line hover:border-line text-foreground hover:text-foreground transition">
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* Read-only banner */}
      <div className="bg-sky-500/5 border-b border-sky-500/10 px-4 sm:px-6 py-2 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <p className="text-[11px] text-sky-300/80">View-only dashboard — no records can be edited or deleted from this page.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-line rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                tab === t.id ? "bg-orange-500 text-white" : "text-muted hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" /> {t.id}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={Building2} label="Bulk Dealers" value={num(data.dealers.length)} sub={`${m.activeDealers} active`} tone="orange" />
              <Stat icon={Banknote} label="Completed Value" value={naira(m.totalValue)} sub={`${naira(m.dealerValue)} from dealers`} tone="emerald" />
              <Stat icon={ClipboardList} label="Supply Requests" value={num(data.supplyRequests.length)} sub={`${m.pendingSupply} pending · ${m.inTransit} in transit`} tone="sky" />
              <Stat icon={Receipt} label="Transactions" value={num(data.transactions.length)} sub={`${m.flagged} AI-flagged`} tone="purple" />
              <Stat icon={Package} label="Purchase Orders" value={num(m.poCount)} sub={`${num(m.poVolume)} L ordered`} tone="orange" />
              <Stat icon={Truck} label="Approved Trucks" value={num(m.approvedTrucks)} sub={`${num(data.truckRentals.length)} rentals`} tone="sky" />
              <Stat icon={Gauge} label="Allocated Volume" value={`${num(m.allocVol)} L`} sub={`${num(m.allocUsed)} L lifted`} tone="emerald" />
              <Stat icon={Fuel} label="Depots" value={num(data.depots.length)} sub="across Nigeria" tone="purple" />
            </div>

            {/* Product prices */}
            <div className="bg-card/60 border border-line rounded-xl p-5">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Platform Fuel Prices (₦/Litre)</p>
              <div className="grid grid-cols-3 gap-4">
                {PRODUCTS.map((p) => (
                  <div key={p} className="bg-background/60 border border-line rounded-lg p-4 text-center">
                    <p className="text-xs text-muted mb-1">{p}</p>
                    <p className="text-xl font-bold text-foreground">{perL(productPrice[p])}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dealer value leaderboard */}
            <div className="bg-card/60 border border-line rounded-xl p-5">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Top Bulk Dealers by Completed Value</p>
              <div className="space-y-2.5">
                {!data.dealers.length && <p className="text-xs text-muted">No dealer activity to rank yet.</p>}
                {[...data.dealers]
                  .map((d) => ({
                    d,
                    val: data.transactions
                      .filter((t) => t.userEmail === d.email && t.status === "completed")
                      .reduce((s, t) => s + (t.totalAmount || 0), 0),
                  }))
                  .sort((a, b) => b.val - a.val)
                  .slice(0, 5)
                  .map(({ d, val }, i) => (
                    <div key={d._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-4">{i + 1}</span>
                      <span className="text-sm text-foreground font-medium flex-1 truncate">{d.companyName}</span>
                      <span className="text-xs text-muted hidden sm:block">{d.state}</span>
                      <span className="text-sm font-bold text-emerald-400">{naira(val)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BULK DEALERS ── */}
        {tab === "Bulk Dealers" && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-2">
              {data.dealers.length} registered bulk dealers — their business identity, location, storage capacity, set prices, allocations and transaction activity. Click a dealer to expand.
            </p>
            {!data.dealers.length && <EmptyState icon={Building2} label="No bulk dealers registered yet." />}
            {data.dealers.map((d) => {
              const dealerTx = data.transactions.filter((t) => t.userEmail === d.email);
              const dealerAlloc = data.allocations.filter((a) => a.dealerEmail === d.email);
              const dealerValue = dealerTx.filter((t) => t.status === "completed").reduce((s, t) => s + (t.totalAmount || 0), 0);
              const lifted = dealerAlloc.reduce((s, a) => s + (a.usedLitres || 0), 0);
              const allocated = dealerAlloc.reduce((s, a) => s + (a.volumeLitres || 0), 0);
              const open = openDealer === d._id;
              return (
                <div key={d._id} className="bg-card/60 border border-line rounded-xl overflow-hidden">
                  <button onClick={() => setOpenDealer(open ? null : d._id)}
                    className="w-full text-left p-4 hover:bg-card transition flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-foreground truncate">{d.companyName}</span>
                        <StatusPill value={d.status} />
                        {d.dealerCode && <code className="text-[11px] text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded">{d.dealerCode}</code>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{d.state}{d.lga ? `, ${d.lga}` : ""}</span>
                        <span>{d.name}</span>
                        <span className="hidden sm:inline">{d.email}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">{naira(dealerValue)}</p>
                      <p className="text-[11px] text-muted">{dealerTx.length} txns</p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-line p-4 space-y-5 bg-background/40">
                      {/* Identity + location */}
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <Field label="Contact" value={d.name} sub={d.phone} />
                        <Field label="Email" value={d.email} />
                        <Field label="RC Number" value={d.rcNumber || "—"} sub={d.dprLicence ? `DPR: ${d.dprLicence}` : undefined} />
                        <Field label="Head Office" value={d.headOfficeAddress || `${d.state}${d.lga ? ", " + d.lga : ""}`} />
                      </div>

                      {/* Set prices + storage */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-card/60 border border-line rounded-lg p-4">
                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-3">Dealer Set Prices (₦/L)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {PRODUCTS.map((p) => (
                              <div key={p} className="text-center">
                                <p className="text-[11px] text-muted">{p}</p>
                                <p className="text-sm font-bold text-foreground">{d.prices?.[p] ? perL(d.prices[p]) : "—"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-card/60 border border-line rounded-lg p-4">
                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-3">Tank Storage (Mega-Litres)</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center"><p className="text-[11px] text-muted">PMS</p><p className="text-sm font-bold text-foreground">{d.pmsTankMaxML ?? "—"} ML</p></div>
                            <div className="text-center"><p className="text-[11px] text-muted">AGO</p><p className="text-sm font-bold text-foreground">{d.agoTankMaxML ?? "—"} ML</p></div>
                            <div className="text-center"><p className="text-[11px] text-muted">ATK</p><p className="text-sm font-bold text-foreground">{d.atkTankMaxML ?? "—"} ML</p></div>
                          </div>
                        </div>
                      </div>

                      {/* Allocations */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Depot Allocations</p>
                          <p className="text-[11px] text-muted">{num(lifted)} / {num(allocated)} L lifted</p>
                        </div>
                        {dealerAlloc.length ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="text-muted text-left">
                                <tr><th className="py-1.5 pr-3 font-medium">Product</th><th className="py-1.5 pr-3 font-medium">Depot</th><th className="py-1.5 pr-3 font-medium">Volume</th><th className="py-1.5 pr-3 font-medium">Used</th><th className="py-1.5 pr-3 font-medium">Valid To</th><th className="py-1.5 font-medium">Status</th></tr>
                              </thead>
                              <tbody className="text-foreground">
                                {dealerAlloc.map((a) => (
                                  <tr key={a._id} className="border-t border-line">
                                    <td className="py-2 pr-3 font-semibold text-foreground">{a.product}</td>
                                    <td className="py-2 pr-3">{a.depot}</td>
                                    <td className="py-2 pr-3">{num(a.volumeLitres)} L</td>
                                    <td className="py-2 pr-3">{num(a.usedLitres)} L</td>
                                    <td className="py-2 pr-3">{a.validTo ? new Date(a.validTo).toLocaleDateString() : "—"}</td>
                                    <td className="py-2"><StatusPill value={a.status} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <p className="text-xs text-muted">No allocations on record.</p>}
                      </div>

                      {/* Recent transactions */}
                      <div>
                        <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2">Recent Transactions</p>
                        {dealerTx.length ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="text-muted text-left">
                                <tr><th className="py-1.5 pr-3 font-medium">Ref</th><th className="py-1.5 pr-3 font-medium">Type</th><th className="py-1.5 pr-3 font-medium">Amount</th><th className="py-1.5 pr-3 font-medium">Method</th><th className="py-1.5 font-medium">Status</th></tr>
                              </thead>
                              <tbody className="text-foreground">
                                {dealerTx.slice(0, 6).map((t) => (
                                  <tr key={t._id} className="border-t border-line">
                                    <td className="py-2 pr-3 font-mono text-muted">{t.txnId}</td>
                                    <td className="py-2 pr-3">{toLabel(t.type)}</td>
                                    <td className="py-2 pr-3 font-semibold text-foreground">{naira(t.totalAmount)}</td>
                                    <td className="py-2 pr-3">{t.paymentMethod ? toLabel(t.paymentMethod) : "—"}</td>
                                    <td className="py-2"><StatusPill value={t.status} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : <p className="text-xs text-muted">No transactions on record.</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── OPERATIONS FLOW ── */}
        {tab === "Operations Flow" && (
          <div className="space-y-6">
            <p className="text-xs text-muted">
              End-to-end platform flow — from onboarding to delivery and settlement. Counts reflect current records.
            </p>
            <div className="grid gap-3">
              {[
                { icon: Users, title: "1. Onboarding & KYC", desc: "Customers, bulk dealers and truck owners register with CAC/RC, DPR licence and official ID verification.", stat: `${data.dealers.length} bulk dealers registered` },
                { icon: Fuel, title: "2. Depot Stock & Pricing", desc: "Admin maintains fuel inventory (PMS, AGO, ATK) and per-litre prices across depots nationwide.", stat: `${data.depots.length} depots · PMS ${perL(productPrice.PMS)}` },
                { icon: ClipboardList, title: "3. Supply Requests", desc: "Retail stations request fuel; AI routing assigns the optimal depot and delivery priority.", stat: `${data.supplyRequests.length} requests · ${m.inTransit} in transit` },
                { icon: Package, title: "4. Bulk Purchase Orders", desc: "Bulk dealers place depot loading orders (BuyNow), locking product, quantity and price at order time.", stat: `${m.poCount} orders · ${num(m.poVolume)} L` },
                { icon: Truck, title: "5. Haulage & Loading", desc: "Owned or rented trucks are assigned; depot loading records track compartment ullage and dispatch.", stat: `${m.approvedTrucks} trucks approved · ${data.truckRentals.length} rentals` },
                { icon: ArrowRight, title: "6. Delivery Tracking", desc: "Orders move through processing → in transit → delivered, with status visible to all parties.", stat: `${data.supplyRequests.filter((s) => s.status === "delivered").length} delivered` },
                { icon: Banknote, title: "7. Payments & Settlement", desc: "Payments are processed through GlobalPay and flow into a unified transaction ledger.", stat: `${naira(m.totalValue)} settled` },
                { icon: ShieldCheck, title: "8. Union Dues & Compliance", desc: "Members pay annual dues and custom levies; AI anomaly detection flags irregular transactions.", stat: `${data.unionDues.length} dues records · ${m.flagged} flagged txns` },
              ].map((step, i) => (
                <div key={i} className="bg-card/60 border border-line rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 shrink-0 hidden sm:block">
                    {step.stat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {tab === "Transactions" && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-2">{data.transactions.length} transactions across all roles and payment methods.</p>
            {!data.transactions.length && <EmptyState icon={Receipt} label="No transactions recorded yet." />}
            {!!data.transactions.length && (
            <div className="bg-card/60 border border-line rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted text-left bg-card/80">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Ref</th>
                      <th className="py-2.5 px-3 font-medium">Party</th>
                      <th className="py-2.5 px-3 font-medium">Type</th>
                      <th className="py-2.5 px-3 font-medium">Product</th>
                      <th className="py-2.5 px-3 font-medium">Amount</th>
                      <th className="py-2.5 px-3 font-medium">Method</th>
                      <th className="py-2.5 px-3 font-medium">Depot</th>
                      <th className="py-2.5 px-3 font-medium">When</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {data.transactions.map((t) => (
                      <tr key={t._id || t.txnId} className="border-t border-line hover:bg-card/50">
                        <td className="py-2.5 px-3 font-mono text-muted">{t.txnId}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground truncate max-w-[160px]">{t.user}</span>
                            {t.aiFlagged && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">{toLabel(t.type)}</td>
                        <td className="py-2.5 px-3">{t.product || "—"}</td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{naira(t.totalAmount)}</td>
                        <td className="py-2.5 px-3">{t.paymentMethod ? toLabel(t.paymentMethod) : "—"}</td>
                        <td className="py-2.5 px-3 text-muted">{t.depot || "—"}</td>
                        <td className="py-2.5 px-3 text-muted">{timeAgo(t.timestamp)}</td>
                        <td className="py-2.5 px-3"><StatusPill value={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* ── DEPOTS & PRICING ── */}
        {tab === "Depots & Pricing" && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-2">{data.depots.length} depots — live stock level and per-litre price by product.</p>
            {!data.depots.length && <EmptyState icon={Fuel} label="No depots configured yet." />}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.depots.map((dp) => (
                <div key={dp.name} className="bg-card/60 border border-line rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Fuel className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{dp.name}</p>
                      {dp.state && <p className="text-[11px] text-muted inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{dp.state}</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {PRODUCTS.map((p) => {
                      const pd = dp[p] || {};
                      return (
                        <div key={p}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{p}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted">{pd.price ? perL(pd.price) : "—"}</span>
                              {pd.status && <StatusPill value={pd.status} />}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <LevelBar level={pd.level ?? 0} />
                            <span className="text-[11px] text-muted w-8 text-right">{pd.level ?? 0}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 pt-5 border-t border-line flex items-center justify-between text-[11px] text-muted">
          <span>e-Nergy · Read-only platform overview</span>
          <span>{demo ? "Showing demo data (development)" : "Connected to live data"}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted mb-0.5">{label}</p>
      <p className="text-sm text-foreground break-words">{value}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}
