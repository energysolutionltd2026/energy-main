"use client";
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import {
  LayoutDashboard, Users, Truck, Fuel, Building2, Receipt, MapPin,
  Package, ClipboardList, LogOut, RefreshCw,
  AlertTriangle, ArrowRight, Banknote, Gauge, ShieldCheck,
  Clock, Scale, Filter, Activity, Search, ChevronDown, Download,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { toLabel } from "@/utils/toLabel";
import ThemeToggle from "@/components/ThemeToggle";

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
      _id: "d1", financerId: "b1", name: "Chidi Okonkwo", companyName: "BrightFlow Petroleum Ltd",
      email: "chidi@brightflow.ng", phone: "0803 111 2233", role: "bulk_dealer",
      status: "active", dealerCode: "BD-CH1P3T", rcNumber: "RC-482910", dprLicence: "DPR-PMS-0291",
      state: "Lagos", lga: "Amuwo-Odofin", headOfficeAddress: "14 Trans-Amadi Road, Apapa, Lagos",
      pmsTankMaxML: 8, agoTankMaxML: 5, atkTankMaxML: 3,
      prices: { PMS: 905, AGO: 1215, ATK: 1100 }, joinedAt: "2026-01-12",
    },
    {
      _id: "d2", financerId: "b2", name: "Amina Bello", companyName: "Sahel Energy Distribution",
      email: "amina@sahelenergy.ng", phone: "0805 444 5566", role: "bulk_dealer",
      status: "active", dealerCode: "BD-AM7K9Z", rcNumber: "RC-661204", dprLicence: "DPR-AGO-1145",
      state: "Kano", lga: "Nassarawa", headOfficeAddress: "Zaria Road Industrial Layout, Kano",
      pmsTankMaxML: 6, agoTankMaxML: 7, atkTankMaxML: 2,
      prices: { PMS: 899, AGO: 1205, ATK: 1098 }, joinedAt: "2026-02-03",
    },
    {
      _id: "d3", financerId: "b1", name: "Emeka Nwosu", companyName: "Delta Prime Oil & Gas",
      email: "emeka@deltaprime.ng", phone: "0807 777 8899", role: "bulk_dealer",
      status: "active", dealerCode: "BD-EM4R2Q", rcNumber: "RC-330876", dprLicence: "DPR-PMS-0774",
      state: "Delta", lga: "Warri South", headOfficeAddress: "Refinery Road, Effurun, Warri",
      pmsTankMaxML: 10, agoTankMaxML: 9, atkTankMaxML: 4,
      prices: { PMS: 910, AGO: 1220, ATK: 1105 }, joinedAt: "2025-11-28",
    },
    {
      _id: "d4", financerId: "b2", name: "Fatima Yusuf", companyName: "Northgate Fuels Nigeria",
      email: "fatima@northgatefuels.ng", phone: "0809 222 3344", role: "bulk_dealer",
      status: "suspended", dealerCode: "BD-FA8T1L", rcNumber: "RC-559013", dprLicence: "DPR-ATK-0410",
      state: "Kaduna", lga: "Kaduna North", headOfficeAddress: "Ahmadu Bello Way, Kaduna",
      pmsTankMaxML: 4, agoTankMaxML: 4, atkTankMaxML: 6,
      prices: { PMS: 915, AGO: 1225, ATK: 1090 }, joinedAt: "2026-03-19",
    },
    {
      _id: "d5", financerId: "b1", name: "Tunde Adeyemi", companyName: "Coastline Bulk Supplies",
      email: "tunde@coastlinebulk.ng", phone: "0802 555 6677", role: "bulk_dealer",
      status: "active", dealerCode: "BD-TU3N6V", rcNumber: "RC-771265", dprLicence: "DPR-PMS-1330",
      state: "Rivers", lga: "Port Harcourt", headOfficeAddress: "Aba Road, GRA Phase 2, Port Harcourt",
      pmsTankMaxML: 7, agoTankMaxML: 6, atkTankMaxML: 3,
      prices: { PMS: 902, AGO: 1210, ATK: 1102 }, joinedAt: "2026-01-30",
    },
    {
      _id: "d6", financerId: "b2", name: "Ngozi Eze", companyName: "Enugu Valley Petroleum",
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
    { _id: "p1", orderId: "BUY-771201", companyName: "BrightFlow Petroleum Ltd", dealer: "chidi@brightflow.ng", productType: "PMS", productQuantity: 45000, loadingDepot: "Lagos Main Depot", status: "delivered", totalAmount: 40725000, createdAt: "2026-07-10" },
    { _id: "p2", orderId: "BUY-771202", companyName: "Delta Prime Oil & Gas", dealer: "emeka@deltaprime.ng", productType: "PMS", productQuantity: 60000, loadingDepot: "Warri Storage Facility", status: "in_transit", totalAmount: 54600000, createdAt: "2026-07-08" },
    { _id: "p3", orderId: "BUY-771203", companyName: "Sahel Energy Distribution", dealer: "amina@sahelenergy.ng", productType: "AGO", productQuantity: 40000, loadingDepot: "Kano Distribution Hub", status: "processing", totalAmount: 48200000, createdAt: "2026-05-25" },
    { _id: "p4", orderId: "BUY-771204", companyName: "Coastline Bulk Supplies", dealer: "tunde@coastlinebulk.ng", productType: "PMS", productQuantity: 30000, loadingDepot: "Port Harcourt Terminal", status: "delivered", totalAmount: 27060000, createdAt: "2026-04-15" },
  ],
  loadingRecords: [
    { _id: "l1", loadId: "LOAD-551201", orderId: "BUY-771201", product: "PMS", depot: "Lagos Main Depot", truckRegNumber: "LAG-482-XA", companyName: "BrightFlow Petroleum Ltd", loadingDate: "2026-07-11", totalLitresLoaded: 45000, status: "completed" },
    { _id: "l2", loadId: "LOAD-551202", orderId: "BUY-771202", product: "PMS", depot: "Warri Storage Facility", truckRegNumber: "DEL-771-QP", companyName: "Delta Prime Oil & Gas", loadingDate: "2026-07-09", totalLitresLoaded: 60000, status: "completed" },
    { _id: "l4", loadId: "LOAD-551204", orderId: "BUY-771204", product: "PMS", depot: "Port Harcourt Terminal", truckRegNumber: "RIV-330-KK", companyName: "Coastline Bulk Supplies", loadingDate: "2026-04-16", totalLitresLoaded: 30000, status: "completed" },
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
  banks: [
    { _id: "b1", name: "First Trust Bank", shortCode: "FTB" },
    { _id: "b2", name: "Guaranty Union Bank", shortCode: "GUB" },
  ],
};

const PRODUCTS = ["PMS", "AGO", "ATK"] as const;
const PRODUCT_COLORS: Record<string, string> = { PMS: "#f59e0b", AGO: "#0ea5e9", ATK: "#a855f7" };
// Cyclic palette for by-dealer slices (last entry reserved-ish for "Others").
const CHART_COLORS = ["#f59e0b", "#0ea5e9", "#a855f7", "#10b981", "#ef4444", "#eab308", "#6366f1"];
// Risk-band slice colors (borrower-segment exposure pie): green → amber → red.
const RISK_COLORS: Record<string, string> = { Low: "#10b981", Moderate: "#f59e0b", High: "#ef4444" };

// Heatmap cell color by stock level (0–100): critical red → low amber → healthy green.
function heatColor(level: number): string {
  if (level < 25) return "#ef4444";
  if (level < 50) return "#f59e0b";
  if (level < 75) return "#10b981";
  return "#059669";
}
// Legible text over a heatmap cell of the given level.
function heatTextColor(level: number): string {
  return level < 25 || level >= 75 ? "#ffffff" : "#0b0b0b";
}

// ─── Small UI atoms ─────────────────────────────────────────────────────────
function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    pending_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    processing: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    in_transit: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    confirmed: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    limited: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    suspended: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    failed: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    revoked: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    overdue: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    unavailable: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    exhausted: "bg-gray-600/30 text-foreground border-line",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[value] || "bg-card-2/40 text-foreground border-line"}`}>
      {toLabel(value)}
    </span>
  );
}

function Stat({ icon: Icon, label, value, sub, tone = "orange", trend, goodWhenUp = true, hint }: {
  icon: any; label: string; value: string; sub?: string; tone?: string;
  // Optional signed percentage change rendered as a coloured ▲/▼ badge.
  trend?: number | null;
  // Whether an increase is "good" (green up) or "bad" (red up, e.g. exposure).
  goodWhenUp?: boolean;
  // Basis/definition shown as a hover tooltip.
  hint?: string;
}) {
  const tones: Record<string, string> = {
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };
  const up = (trend ?? 0) >= 0;
  const trendGood = up === goodWhenUp;
  return (
    <div className="bg-card/60 border border-line rounded-xl p-4" title={hint}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {trend != null && (
          <span className={`text-[11px] font-semibold leading-none mb-0.5 ${trendGood ? "text-emerald-400" : "text-red-400"}`}>
            {up ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted mt-1.5">{sub}</p>}
    </div>
  );
}

function AlertBanner({ tone, icon: Icon, title, detail, onClick, actionLabel }: {
  tone: "red" | "amber" | "orange"; icon: any; title: string; detail: string;
  // When provided, the banner becomes a button (e.g. to open a drill-down).
  onClick?: () => void; actionLabel?: string;
}) {
  const tones: Record<string, string> = {
    red: "bg-red-500/10 border-red-500/30 text-red-300",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-300",
  };
  const clickable = onClick
    ? "w-full text-left hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-current cursor-pointer transition"
    : "";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`flex items-center gap-2.5 border rounded-xl px-4 py-2.5 ${tones[tone]} ${clickable}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-[11px] opacity-80 leading-tight mt-0.5">{detail}</p>
      </div>
      {onClick && (
        <span className="text-[11px] font-semibold shrink-0 inline-flex items-center gap-1 opacity-90">
          {actionLabel ?? "View"} <ArrowRight className="w-3.5 h-3.5" />
        </span>
      )}
    </Tag>
  );
}

// Compact inline metric for the secondary "Platform Activity" strip — a lighter
// alternative to a full Stat card when a figure is context, not a headline.
function InlineMetric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-lg border border-line bg-card flex items-center justify-center shrink-0 text-muted">
        <Icon className="w-4 h-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
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

// Per-dealer risk band (Low/Moderate/High): a suspended dealer is High; otherwise
// the dealer's own AI-flagged + failed transaction rate sets the band. Mirrors the
// portfolio-level risk blend used by the exposure widget.
function dealerRiskBand(
  status: string | undefined,
  dealerTx: { aiFlagged?: boolean; status?: string }[]
): "Low" | "Moderate" | "High" {
  if (status === "suspended") return "High";
  const n = dealerTx.length || 1;
  const bad = dealerTx.filter((x) => x.aiFlagged || x.status === "failed").length;
  const rate = bad / n;
  return rate >= 0.34 ? "High" : rate > 0 ? "Moderate" : "Low";
}

function RiskPill({ band }: { band: "Low" | "Moderate" | "High" }) {
  const c = RISK_COLORS[band] ?? "#64748b";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
      style={{ color: c, borderColor: `${c}55`, background: `${c}1a` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {band}
    </span>
  );
}

// Compact monthly trade-volume trend (completed transaction value, last 6 months).
function TradeTrend({ txns }: { txns: { totalAmount?: number; status?: string; timestamp?: string }[] }) {
  const now = new Date();
  const keys: string[] = [];
  const buckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = dt.toLocaleString("en", { month: "short" });
    keys.push(key);
    buckets.set(key, 0);
  }
  for (const t of txns) {
    if (t.status !== "completed" || !t.timestamp) continue;
    const dt = new Date(t.timestamp);
    if (Number.isNaN(dt.getTime())) continue;
    const monthsAgo = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
    if (monthsAgo < 0 || monthsAgo > 5) continue;
    const key = dt.toLocaleString("en", { month: "short" });
    buckets.set(key, (buckets.get(key) || 0) + (t.totalAmount || 0));
  }
  const vals = keys.map((k) => buckets.get(k) || 0);
  const max = Math.max(1, ...vals);
  if (vals.reduce((s, v) => s + v, 0) === 0) {
    return <p className="text-xs text-muted py-4">No completed trades in the last 6 months.</p>;
  }
  return (
    <div className="flex items-end gap-2 h-24">
      {keys.map((k, i) => (
        <div key={k} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
          <div className="w-full rounded-t bg-orange-500/70" style={{ height: `${(vals[i] / max) * 100}%` }}
            title={`${k}: ${naira(vals[i])}`} />
          <span className="text-[10px] text-muted">{k}</span>
        </div>
      ))}
    </div>
  );
}

// Current lifecycle stage of a trade (purchase order), combining its delivery
// status with any loading record. "Live" = current DB state on refresh, not push.
function tradeStage(poStatus?: string, loadStatus?: string): string {
  if (poStatus === "cancelled") return "Cancelled";
  if (poStatus === "delivered") return "Delivered";
  if (poStatus === "in_transit") return "In transit";
  if (loadStatus === "completed" || loadStatus === "in_progress") return "Loaded";
  if (poStatus === "processing") return "Reserved";
  return "Placed";
}
const STAGE_COLORS: Record<string, string> = {
  Placed: "#64748b", Reserved: "#f59e0b", Loaded: "#0ea5e9",
  "In transit": "#6366f1", Delivered: "#10b981", Cancelled: "#ef4444",
};
function StageBadge({ stage }: { stage: string }) {
  const c = STAGE_COLORS[stage] ?? "#64748b";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap"
      style={{ color: c, borderColor: `${c}55`, background: `${c}1a` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {stage}
    </span>
  );
}

// Horizontal lifecycle stepper: placed → paid → loaded → delivered.
function TradeLifecycle({ steps }: { steps: { label: string; at?: string; done: boolean; note?: string }[] }) {
  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className="flex flex-col items-center text-center min-w-[76px]">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.done ? "bg-emerald-500 text-white" : "bg-card-2 text-muted border border-line"}`}>{s.done ? "✓" : i + 1}</span>
            <p className={`text-xs font-semibold mt-1 ${s.done ? "text-foreground" : "text-muted"}`}>{s.label}</p>
            <p className="text-[11px] text-muted">{s.at ? new Date(s.at).toLocaleDateString() : (s.note || "Pending")}</p>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mt-3.5 min-w-[16px] ${s.done ? "bg-emerald-500/60" : "bg-line"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// Client-side CSV download — no dependency. Values are RFC-4180 escaped.
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  supplyRequests: any[]; purchaseOrders: any[]; loadingRecords: any[]; trucks: any[];
  truckRentals: any[]; depots: any[]; unionDues: any[]; banks: any[];
  // True when the viewer is a single bank (data scoped to its dealers). Used to
  // hide widgets that can't be scoped to a bank, like supply requests.
  scoped: boolean;
};

/* Mock data is a DEVELOPMENT-ONLY convenience so the dashboard renders populated
   before the database is seeded. In production we never fabricate figures on a
   financial oversight page — an empty database shows clean empty states instead.
   `process.env.NODE_ENV` is inlined by Next at build time, so every mock fallback
   below collapses to an empty array in the production build. */
const DEV = process.env.NODE_ENV !== "production";

/* Presentations sometimes need the populated demo data on the live/production
   deployment (where DEV is false and the DB may be empty). To keep the safe
   default intact (production shows clean empty states, never fabricated
   figures) demo data in production is OPT-IN only, enabled either by:
     • visiting the page with `?demo=1` in the URL, or
     • building with NEXT_PUBLIC_DEMO_MODE=true.
   This is read at runtime so it never affects the default production behaviour. */
const ENV_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
function demoRequested(): boolean {
  if (DEV || ENV_DEMO) return true;
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  }
  return false;
}

const EMPTY: Data = {
  settings: null, dealers: [], allocations: [], transactions: [],
  supplyRequests: [], purchaseOrders: [], loadingRecords: [], trucks: [],
  truckRentals: [], depots: [], unionDues: [], banks: [], scoped: false,
};

const INITIAL: Data = DEV
  ? {
      settings: MOCK.settings, dealers: MOCK.dealers, allocations: MOCK.allocations,
      transactions: MOCK.transactions, supplyRequests: MOCK.supplyRequests,
      purchaseOrders: MOCK.purchaseOrders, loadingRecords: MOCK.loadingRecords, trucks: MOCK.trucks,
      truckRentals: MOCK.truckRentals, depots: MOCK.depots, unionDues: MOCK.unionDues,
      banks: MOCK.banks, scoped: false,
    }
  : EMPTY;

export default function FinancerOverview() {
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(DEV || ENV_DEMO); // true while showing mock data
  const [data, setData] = useState<Data>(INITIAL);
  const [openDealer, setOpenDealer] = useState<string | null>(null);
  const [dealerSearch, setDealerSearch] = useState("");
  // Trade Monitoring tab filters.
  const [openTrade, setOpenTrade] = useState<string | null>(null);
  const [tmSearch, setTmSearch] = useState("");
  const [tmProduct, setTmProduct] = useState("All");
  const [tmStatus, setTmStatus] = useState("All");
  const [tmDepot, setTmDepot] = useState("All");
  const [tmPeriod, setTmPeriod] = useState("All");
  const [tmRiskOnly, setTmRiskOnly] = useState(false);
  const [tmSort, setTmSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "placed", dir: "desc" });

  // ── Overview filters (bank · region · product · time period) ──
  const [fBank, setFBank] = useState("All");
  const [fRegion, setFRegion] = useState("All");
  const [fProduct, setFProduct] = useState("All");
  const [fPeriod, setFPeriod] = useState("All");
  const [pieMode, setPieMode] = useState<"product" | "dealer" | "risk">("product");
  // Flagged-transactions drill-down panel.
  const [showFlagged, setShowFlagged] = useState(false);

  const regionOptions = useMemo(
    () => Array.from(new Set((data.dealers as any[]).map((d) => d.state).filter(Boolean))).sort() as string[],
    [data.dealers]
  );

  // Apply the filters, producing a scoped copy of each dealer-keyed dataset. The
  // KPIs, widgets, and operational stats on the Overview all read from this.
  const f = useMemo(() => {
    const now = Date.now();
    const DAY = 86_400_000;
    const periodDays = fPeriod === "7d" ? 7 : fPeriod === "30d" ? 30 : fPeriod === "90d" ? 90 : 0;
    const inPeriod = (t?: string) => {
      if (!periodDays) return true;
      if (!t) return false;
      const ts = new Date(t).getTime();
      return !Number.isNaN(ts) && now - ts <= periodDays * DAY;
    };
    const matchProduct = (p?: string) => fProduct === "All" || p === fProduct;

    // Dealers narrow by bank and region.
    let dealers = data.dealers as any[];
    if (fBank !== "All") dealers = dealers.filter((d) => String(d.financerId ?? "") === fBank);
    if (fRegion !== "All") dealers = dealers.filter((d) => d.state === fRegion);

    // When bank/region narrows the dealer set, cascade to their records by email.
    const narrowed = fBank !== "All" || fRegion !== "All";
    const emailSet = new Set(dealers.map((d) => d.email));
    const keepEmail = (e?: string) => !narrowed || (e != null && emailSet.has(e));

    return {
      dealers,
      transactions: (data.transactions as any[]).filter(
        (x) => keepEmail(x.userEmail) && matchProduct(x.product) && inPeriod(x.timestamp)
      ),
      allocations: (data.allocations as any[]).filter(
        (x) => keepEmail(x.dealerEmail) && matchProduct(x.product)
      ),
      purchaseOrders: (data.purchaseOrders as any[]).filter(
        (x) => keepEmail(x.dealer) && matchProduct(x.productType) && inPeriod(x.createdAt)
      ),
      supplyRequests: (data.supplyRequests as any[]).filter(
        (x) => keepEmail(x.requestedBy) && matchProduct(x.product)
      ),
    };
  }, [data, fBank, fRegion, fProduct, fPeriod]);

  const filtersActive = fBank !== "All" || fRegion !== "All" || fProduct !== "All" || fPeriod !== "All";

  async function load() {
    setLoading(true);
    // Demo fallback is on in dev, or opt-in via ?demo=1 / NEXT_PUBLIC_DEMO_MODE.
    const useMock = demoRequested();
    // Single allow-list-guarded endpoint. It returns already-projected, safe
    // fields for every dataset (no admin-only /api/db/* calls needed).
    const res = await tryGet<Partial<Data>>("/api/overview/data");

    // Without demo mode the fallback is empty (no fabricated data); otherwise MOCK.
    const pick = <T,>(rows: any, fallback: T[]): { rows: T[]; live: boolean } =>
      Array.isArray(rows) && rows.length
        ? { rows, live: true }
        : { rows: useMock ? fallback : [], live: false };

    const d = pick(res?.dealers, MOCK.dealers);
    const a = pick(res?.allocations, MOCK.allocations);
    const t = pick(res?.transactions, MOCK.transactions);
    const s = pick(res?.supplyRequests, MOCK.supplyRequests);
    const p = pick(res?.purchaseOrders, MOCK.purchaseOrders);
    const lr = pick(res?.loadingRecords, MOCK.loadingRecords);
    const k = pick(res?.trucks, MOCK.trucks);
    const r = pick(res?.truckRentals, MOCK.truckRentals);
    const dp = pick(res?.depots, MOCK.depots);
    const u = pick(res?.unionDues, MOCK.unionDues);
    const b = pick(res?.banks, MOCK.banks);

    // Base "live" on real operational datasets only — platform settings (prices)
    // almost always exist even on an otherwise-empty DB, so they must not by
    // themselves flip the badge to "Live" while every table is showing mock rows.
    const hadLive = [d, a, t, s, p, k, r, dp, u].some((x) => x.live);
    // "Demo" applies whenever we fell back to mock data (dev, or opt-in demo mode).
    setDemo(useMock && !hadLive);
    setData({
      settings: res?.settings || (useMock ? MOCK.settings : null),
      dealers: d.rows, allocations: a.rows, transactions: t.rows,
      supplyRequests: s.rows, purchaseOrders: p.rows, loadingRecords: lr.rows, trucks: k.rows,
      truckRentals: r.rows, depots: dp.rows, unionDues: u.rows, banks: b.rows,
      // Only live scoped responses set this; demo/mock never scopes, so the tile stays.
      scoped: Boolean(res?.scoped),
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ── Derived metrics ──
  const m = useMemo(() => {
    const tx = f.transactions;
    const dealerTx = tx.filter((x) => x.userRole === "bulk_dealer");
    const completed = tx.filter((x) => x.status === "completed");
    const totalValue = completed.reduce((s, x) => s + (x.totalAmount || 0), 0);
    const dealerValue = completed.filter((x) => x.userRole === "bulk_dealer").reduce((s, x) => s + (x.totalAmount || 0), 0);
    const flagged = tx.filter((x) => x.aiFlagged).length;
    const failed = tx.filter((x) => x.status === "failed").length;
    const activeDealers = f.dealers.filter((x) => x.status === "active").length;
    const suspendedDealers = f.dealers.filter((x) => x.status === "suspended").length;
    const pendingSupply = f.supplyRequests.filter((x) => ["pending", "processing"].includes(x.status)).length;
    const inTransit = f.supplyRequests.filter((x) => x.status === "in_transit").length;
    const approvedTrucks = data.trucks.filter((x) => x.status === "approved").length;
    const allocVol = f.allocations.reduce((s, x) => s + (x.volumeLitres || 0), 0);
    const allocUsed = f.allocations.reduce((s, x) => s + (x.usedLitres || 0), 0);

    // Per-litre price from live platform settings (with sensible fallbacks).
    const price = (p: string) =>
      p === "PMS" ? (data.settings?.pmsPricePerLitre ?? 897)
      : p === "AGO" ? (data.settings?.agoPricePerLitre ?? 1200)
      : p === "ATK" ? (data.settings?.atkPricePerLitre ?? 1095)
      : 0;

    // ── Financing KPIs — the bank's credit view over its dealers' activity ──
    // NOTE: the platform models fuel *transactions*, not a formal loan ledger,
    // so these are transparent proxies derived from that activity. A dedicated
    // credit ledger (disbursement / repayment / due dates) would make them exact.

    // Outstanding credit exposure: value of dealer purchase orders financed but
    // not yet settled — any PO whose status is not "delivered" is capital still
    // at risk.
    const openPOs = f.purchaseOrders.filter((x) => x.status !== "delivered");
    const outstandingExposure = openPOs.reduce((s, x) => s + (x.totalAmount || 0), 0);

    // % change proxy: dealer financing throughput in the trailing 30 days vs the
    // prior 30 days (null when there is no prior-period baseline yet).
    const now = Date.now();
    const DAY = 86_400_000;
    const inWindow = (t: string | undefined, loDays: number, hiDays: number) => {
      if (!t) return false;
      const ts = new Date(t).getTime();
      if (Number.isNaN(ts)) return false;
      const age = now - ts;
      return age >= loDays * DAY && age < hiDays * DAY;
    };
    const last30 = dealerTx.filter((x) => inWindow(x.timestamp, 0, 30)).reduce((s, x) => s + (x.totalAmount || 0), 0);
    const prev30 = dealerTx.filter((x) => inWindow(x.timestamp, 30, 60)).reduce((s, x) => s + (x.totalAmount || 0), 0);
    const exposurePct = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : null;

    // Total financed volume (litres): fuel bought through financed purchase orders.
    const financedVolume = f.purchaseOrders.reduce((s, x) => s + (x.productQuantity || 0), 0);

    // Average trade cycle time (days): mean age of still-open dealer trades
    // (pending transactions). Proxy for capital-deployment duration until a
    // formal settlement timestamp is tracked.
    const openTrades = dealerTx.filter((x) => x.status === "pending" && x.timestamp);
    const avgCycleDays = openTrades.length
      ? openTrades.reduce((s, x) => s + Math.max(0, (now - new Date(x.timestamp as string).getTime()) / DAY), 0) / openTrades.length
      : null;

    // Collateral value: dealers' remaining (unlifted) fuel allocations priced at
    // platform rates — stock the bank can claim against.
    const collateralValue = f.allocations.reduce((s, x) => {
      const remaining = Math.max(0, (x.volumeLitres || 0) - (x.usedLitres || 0));
      return s + remaining * price(x.product as string);
    }, 0);
    // Collateral coverage ratio: collateral value ÷ outstanding exposure.
    // > 1 means loans are over-collateralised (healthy).
    const coverageRatio = outstandingExposure > 0 ? collateralValue / outstandingExposure : null;

    // Composite risk score (0–100, higher = riskier): weighted blend of AI-flag
    // rate, failed-transaction rate, suspended-dealer share, and any collateral
    // shortfall.
    const txN = tx.length || 1;
    const dealerN = f.dealers.length || 1;
    const coverageShortfall = coverageRatio != null && coverageRatio < 1 ? (1 - Math.min(1, coverageRatio)) : 0;
    const riskScore = Math.round(Math.max(0, Math.min(100,
      (flagged / txN) * 30 + (failed / txN) * 30 + (suspendedDealers / dealerN) * 20 + coverageShortfall * 20
    )));
    const riskBand = riskScore < 30 ? "Low" : riskScore < 60 ? "Moderate" : "High";

    // ── Widget datasets ──
    // Exposure split by product (pie chart).
    const exposureByProduct = PRODUCTS.map((p) => ({
      name: p,
      value: openPOs.filter((x) => x.productType === p).reduce((s, x) => s + (x.totalAmount || 0), 0),
    })).filter((d) => d.value > 0);

    // Exposure concentration by dealer (top slices + an "Others" bucket) — the
    // bank's single-name concentration risk.
    const byDealer = new Map<string, number>();
    for (const x of openPOs) {
      const key = (x.companyName || x.dealer || "Unknown") as string;
      byDealer.set(key, (byDealer.get(key) || 0) + (x.totalAmount || 0));
    }
    const dealerRows = Array.from(byDealer, ([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
    const TOP_DEALERS = 6;
    const exposureByDealer = dealerRows.length > TOP_DEALERS
      ? [...dealerRows.slice(0, TOP_DEALERS), { name: "Others", value: dealerRows.slice(TOP_DEALERS).reduce((s, d) => s + d.value, 0) }]
      : dealerRows;

    // Exposure by borrower risk band: classify each dealer, then bucket their
    // open-PO exposure into Low / Moderate / High. The per-dealer band mirrors
    // the portfolio risk blend — a suspended dealer is High; otherwise the
    // dealer's own AI-flagged + failed transaction rate sets the band. POs whose
    // dealer can't be matched fall back to Moderate so exposure is never dropped.
    const dealerBandByEmail = new Map<string, "Low" | "Moderate" | "High">();
    for (const d of f.dealers) {
      const email = (d as { email?: string }).email;
      if (!email) continue;
      if (d.status === "suspended") { dealerBandByEmail.set(email, "High"); continue; }
      const dtx = tx.filter((x) => x.userEmail === email);
      const n = dtx.length || 1;
      const bad = dtx.filter((x) => (x as { aiFlagged?: boolean }).aiFlagged || x.status === "failed").length;
      const rate = bad / n;
      dealerBandByEmail.set(email, rate >= 0.34 ? "High" : rate > 0 ? "Moderate" : "Low");
    }
    const exposureByRisk = (["Low", "Moderate", "High"] as const).map((band) => ({
      name: band,
      value: openPOs
        .filter((x) => (dealerBandByEmail.get((x.dealer as string) ?? "") ?? "Moderate") === band)
        .reduce((s, x) => s + (x.totalAmount || 0), 0),
    })).filter((d) => d.value > 0);

    // Inventory (collateral stock) by product: allocated vs remaining litres.
    const inventoryByProduct = PRODUCTS.map((p) => {
      const rows = f.allocations.filter((x) => x.product === p);
      const allocated = rows.reduce((s, x) => s + (x.volumeLitres || 0), 0);
      const used = rows.reduce((s, x) => s + (x.usedLitres || 0), 0);
      const remaining = Math.max(0, allocated - used);
      return { product: p, allocated, remaining, value: remaining * price(p) };
    });

    // Alert signals.
    // Overdue: financed orders still open (not delivered) beyond 30 days.
    const OVERDUE_DAYS = 30;
    const overdueList = openPOs.filter((x) => {
      if (!x.createdAt) return false;
      const ts = new Date(x.createdAt).getTime();
      return !Number.isNaN(ts) && now - ts > OVERDUE_DAYS * DAY;
    });
    const overdueValue = overdueList.reduce((s, x) => s + (x.totalAmount || 0), 0);
    const lowCollateral = coverageRatio != null && coverageRatio < 1.2;

    return {
      totalValue, dealerValue, flagged, failed, activeDealers, suspendedDealers,
      pendingSupply, inTransit, approvedTrucks, allocVol, allocUsed,
      poCount: f.purchaseOrders.length,
      poVolume: f.purchaseOrders.reduce((s, x) => s + (x.productQuantity || 0), 0),
      // Financing KPIs
      outstandingExposure, exposurePct, financedVolume, avgCycleDays,
      collateralValue, coverageRatio, riskScore, riskBand,
      // Widgets
      exposureByProduct, exposureByDealer, exposureByRisk, inventoryByProduct,
      overdueCount: overdueList.length, overdueValue, lowCollateral,
    };
  }, [f, data.settings, data.trucks]);

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
    { id: "Trade Monitoring", icon: Activity },
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
          <ThemeToggle className="!w-8 !h-8 !rounded-lg border-line text-muted hover:text-foreground hover:bg-card-2" />
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
            {/* Filters: bank · region · product · time period */}
            <div className="bg-card/60 border border-line rounded-xl p-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted mr-1">
                <Filter className="w-3.5 h-3.5" /> Filters
              </span>
              {data.banks.length > 1 && (
                <select value={fBank} onChange={(e) => setFBank(e.target.value)}
                  className="bg-card border border-line rounded-lg px-2.5 py-1.5 text-foreground text-xs focus:outline-none focus:border-orange-500">
                  <option value="All">All banks</option>
                  {(data.banks as any[]).map((b) => (
                    <option key={b._id} value={b._id}>{b.shortCode ? `${b.shortCode} — ${b.name}` : b.name}</option>
                  ))}
                </select>
              )}
              <select value={fRegion} onChange={(e) => setFRegion(e.target.value)}
                className="bg-card border border-line rounded-lg px-2.5 py-1.5 text-foreground text-xs focus:outline-none focus:border-orange-500">
                <option value="All">All regions</option>
                {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={fProduct} onChange={(e) => setFProduct(e.target.value)}
                className="bg-card border border-line rounded-lg px-2.5 py-1.5 text-foreground text-xs focus:outline-none focus:border-orange-500">
                <option value="All">All products</option>
                {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={fPeriod} onChange={(e) => setFPeriod(e.target.value)}
                className="bg-card border border-line rounded-lg px-2.5 py-1.5 text-foreground text-xs focus:outline-none focus:border-orange-500">
                {["All", "7d", "30d", "90d"].map((p) => <option key={p} value={p}>{p === "All" ? "All time" : `Last ${p}`}</option>)}
              </select>
              {filtersActive && (
                <button onClick={() => { setFBank("All"); setFRegion("All"); setFProduct("All"); setFPeriod("All"); }}
                  className="text-xs text-muted hover:text-foreground border border-line rounded-lg px-2.5 py-1.5">Clear</button>
              )}
              <span className="ml-auto text-[11px] text-muted">{num(f.dealers.length)} dealers · {num(f.transactions.length)} txns</span>
            </div>

            {/* Alert banners */}
            {(m.overdueCount > 0 || m.lowCollateral || m.flagged > 0) && (
              <div className="space-y-2">
                {m.overdueCount > 0 && (
                  <AlertBanner tone="red" icon={AlertTriangle}
                    title={`${m.overdueCount} overdue repayment${m.overdueCount > 1 ? "s" : ""}`}
                    detail={`${naira(m.overdueValue)} in financed orders still open beyond 30 days`} />
                )}
                {m.lowCollateral && (
                  <AlertBanner tone="amber" icon={Scale}
                    title="Low collateral coverage"
                    detail={`Coverage ${m.coverageRatio != null ? m.coverageRatio.toFixed(2) : "—"}× is below the 1.20× safety threshold`} />
                )}
                {m.flagged > 0 && (
                  <AlertBanner tone="orange" icon={Activity}
                    title={`${m.flagged} unusual ${m.flagged > 1 ? "activities" : "activity"} flagged`}
                    detail="AI anomaly detection flagged these transactions for review"
                    onClick={() => setShowFlagged(true)} actionLabel="See reasons" />
                )}
              </div>
            )}

            {/* Credit portfolio KPIs */}
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">Credit Portfolio</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Stat
                  icon={Banknote} tone="orange"
                  label="Outstanding Credit Exposure"
                  value={naira(m.outstandingExposure)}
                  trend={m.exposurePct} goodWhenUp={false}
                  sub={m.exposurePct != null ? "open financed orders · vs prev 30d" : "open financed orders · no prior 30d baseline"}
                  hint="Value of dealer purchase orders that are financed but not yet delivered/settled. % change = dealer financing throughput, last 30 days vs the prior 30 days."
                />
                <Stat
                  icon={Fuel} tone="sky"
                  label="Total Financed Volume"
                  value={`${num(m.financedVolume)} L`}
                  sub={`across ${num(m.poCount)} financed order${m.poCount === 1 ? "" : "s"}`}
                  hint="Total litres purchased through financed purchase orders."
                />
                <Stat
                  icon={Building2} tone="emerald"
                  label="Active Dealers"
                  value={num(m.activeDealers)}
                  sub={`${num(f.dealers.length)} total${m.suspendedDealers ? ` · ${m.suspendedDealers} suspended` : ""}`}
                  hint="Dealers assigned to this bank with an active account status."
                />
                <Stat
                  icon={Clock} tone="purple"
                  label="Avg Trade Cycle Time"
                  value={m.avgCycleDays != null ? `${m.avgCycleDays.toFixed(1)} days` : "—"}
                  sub={m.avgCycleDays != null ? "avg age of open trades" : "no open trades"}
                  hint="Mean age of still-open (pending) dealer trades — a proxy for how long capital stays deployed, until formal settlement timestamps are tracked."
                />
                <Stat
                  icon={AlertTriangle}
                  tone={m.riskBand === "High" ? "red" : m.riskBand === "Moderate" ? "amber" : "emerald"}
                  label="Portfolio Risk Score"
                  value={`${m.riskScore}/100`}
                  sub={`${m.riskBand} risk`}
                  hint="Composite 0–100 (higher = riskier): weighted blend of AI-flagged rate, failed-transaction rate, suspended-dealer share, and collateral shortfall."
                />
                <Stat
                  icon={Scale}
                  tone={m.coverageRatio == null ? "orange" : m.coverageRatio >= 1 ? "emerald" : m.coverageRatio >= 0.7 ? "amber" : "red"}
                  label="Collateral Coverage Ratio"
                  value={m.coverageRatio != null ? `${m.coverageRatio.toFixed(2)}×` : "—"}
                  sub={`${naira(m.collateralValue)} stock vs ${naira(m.outstandingExposure)} owed`}
                  hint="Value of dealers' remaining (unlifted) fuel allocations ÷ outstanding credit exposure. Above 1.0× means loans are over-collateralised."
                />
              </div>
            </div>

            {/* Platform activity — secondary figures, shown as a slim strip rather
                than a wall of cards so the Credit Portfolio above stays the focus.
                (Bulk-dealer count, allocated volume and approved trucks were
                dropped here: the first two duplicate the KPIs / inventory panel,
                and trucks are platform infrastructure, not a bank concern. Supply
                requests can't be scoped to a bank, so they're omitted too.) */}
            <div className="bg-card/60 border border-line rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <InlineMetric icon={Banknote} label="Completed value" value={naira(m.totalValue)} />
              <InlineMetric icon={Receipt} label="Transactions" value={num(f.transactions.length)} />
              <InlineMetric icon={Package} label="Purchase orders" value={`${num(m.poCount)} · ${num(m.poVolume)} L`} />
              <InlineMetric icon={Fuel} label="Depots" value={num(data.depots.length)} />
              {m.flagged > 0 && (
                <button onClick={() => setShowFlagged(true)}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/20 transition">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {num(m.flagged)} AI-flagged
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Portfolio exposure + inventory levels */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Exposure pie — switchable by product / by dealer concentration */}
              {(() => {
                const pieData = pieMode === "product" ? m.exposureByProduct
                  : pieMode === "dealer" ? m.exposureByDealer
                  : m.exposureByRisk;
                const sliceColor = (name: string, i: number) =>
                  pieMode === "product"
                    ? (PRODUCT_COLORS[name] ?? "#f59e0b")
                    : pieMode === "risk"
                    ? (RISK_COLORS[name] ?? "#64748b")
                    : (name === "Others" ? "#64748b" : CHART_COLORS[i % CHART_COLORS.length]);
                return (
              <div className="bg-card/60 border border-line rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Portfolio Exposure by {pieMode === "product" ? "Product" : pieMode === "dealer" ? "Dealer" : "Risk Band"}
                  </p>
                  <div className="flex bg-card border border-line rounded-lg p-0.5 text-xs">
                    {(["product", "dealer", "risk"] as const).map((mode) => (
                      <button key={mode} onClick={() => setPieMode(mode)}
                        className={`px-2.5 py-1 rounded-md font-semibold capitalize transition ${pieMode === mode ? "bg-orange-500 text-white" : "text-muted hover:text-foreground"}`}>
                        {mode === "product" ? "Product" : mode === "dealer" ? "Dealer" : "Risk"}
                      </button>
                    ))}
                  </div>
                </div>
                {pieData.length ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div style={{ width: 180, height: 180 }} className="shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2} stroke="none">
                            {pieData.map((d, i) => <Cell key={d.name} fill={sliceColor(d.name, i)} />)}
                          </Pie>
                          <RTooltip formatter={(v) => naira(Number(v) || 0)} contentStyle={{ background: "var(--card, #1a1a1a)", border: "1px solid var(--line, #333)", borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 flex-1 min-w-[140px]">
                      {pieData.map((d, i) => {
                        const pct = m.outstandingExposure > 0 ? (d.value / m.outstandingExposure) * 100 : 0;
                        return (
                          <div key={d.name} className="flex items-center gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: sliceColor(d.name, i) }} />
                            <span className={`text-foreground font-medium truncate ${pieMode === "dealer" ? "flex-1 max-w-[10rem]" : "w-20"}`} title={d.name}>{d.name}</span>
                            <span className="text-muted flex-1 text-right">{naira(d.value)}</span>
                            <span className="text-muted text-xs w-9 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted py-8 text-center">No outstanding exposure in the current view.</p>
                )}
              </div>
                );
              })()}

              {/* Inventory levels (collateral stock) */}
              <div className="bg-card/60 border border-line rounded-xl p-5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Inventory Levels (Collateral Stock)</p>
                <div className="space-y-4">
                  {m.inventoryByProduct.map((inv) => {
                    const util = inv.allocated > 0 ? Math.round((inv.remaining / inv.allocated) * 100) : 0;
                    return (
                      <div key={inv.product}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-foreground font-medium">{inv.product}</span>
                          <span className="text-muted text-xs">{num(inv.remaining)} L left · {naira(inv.value)}</span>
                        </div>
                        <LevelBar level={util} />
                        <p className="text-[11px] text-muted mt-1">{num(inv.remaining)} of {num(inv.allocated)} L allocated remaining ({util}%)</p>
                      </div>
                    );
                  })}
                  {!m.inventoryByProduct.some((i) => i.allocated > 0) && (
                    <p className="text-xs text-muted py-4 text-center">No allocation inventory in the current view.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Depot inventory heatmap — collateral stock levels across depots */}
            {data.depots.length > 0 && (
              <div className="bg-card/60 border border-line rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Depot Inventory Levels</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: heatColor(10) }} />Critical</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: heatColor(35) }} />Low</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: heatColor(80) }} />Healthy</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th className="text-left text-[11px] font-medium text-muted px-2 py-1">Depot</th>
                        {PRODUCTS.map((p) => (
                          <th key={p} className="text-center text-[11px] font-medium text-muted px-2 py-1 w-20">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.depots.map((dp: any) => (
                        <tr key={dp.name}>
                          <td className="text-foreground text-xs px-2 py-1 whitespace-nowrap">
                            {dp.name}
                            {dp.state && <span className="text-muted ml-1">· {dp.state}</span>}
                          </td>
                          {PRODUCTS.map((p) => {
                            const lvl = Number(dp[p]?.level ?? 0);
                            return (
                              <td key={p} className="px-1 py-1">
                                <div className="rounded-md text-center text-xs font-semibold py-2"
                                  style={{ background: heatColor(lvl), color: heatTextColor(lvl) }}
                                  title={`${dp.name} · ${p}: ${lvl}%`}>
                                  {lvl}%
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent transactions feed */}
            <div className="bg-card/60 border border-line rounded-xl p-5">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Recent Transactions</p>
              <div className="divide-y divide-line">
                {f.transactions.slice(0, 15).map((t: any) => (
                  <div key={t._id ?? t.txnId} className="flex items-center gap-3 py-2.5">
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${t.aiFlagged ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20"}`}>
                      {t.aiFlagged ? <AlertTriangle className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground font-medium truncate">
                        {t.user}
                        <span className="text-muted font-normal"> · {toLabel(t.type)}</span>
                      </p>
                      <p className="text-[11px] text-muted truncate">{t.txnId}{t.product ? ` · ${t.product}` : ""} · {timeAgo(t.timestamp)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{naira(t.totalAmount)}</p>
                      <p className="text-[11px]"><StatusPill value={t.status} /></p>
                    </div>
                  </div>
                ))}
                {!f.transactions.length && <p className="text-xs text-muted py-6 text-center">No transactions in the current view.</p>}
              </div>
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
                {!f.dealers.length && <p className="text-xs text-muted">No dealer activity to rank yet.</p>}
                {[...f.dealers]
                  .map((d) => ({
                    d,
                    val: f.transactions
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted">
                {data.dealers.length} registered bulk dealers — click a row to expand full profile, KYC, credit facility and trade history.
              </p>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={dealerSearch}
                  onChange={(e) => setDealerSearch(e.target.value)}
                  placeholder="Search dealers…"
                  className="bg-card border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-orange-500/50 w-56"
                />
              </div>
            </div>
            {!data.dealers.length && <EmptyState icon={Building2} label="No bulk dealers registered yet." />}
            {!!data.dealers.length && (() => {
              const q = dealerSearch.trim().toLowerCase();
              const rows = data.dealers.map((d) => {
                const dealerTx = data.transactions.filter((t) => t.userEmail === d.email);
                const dealerAlloc = data.allocations.filter((a) => a.dealerEmail === d.email);
                const dealerPOs = data.purchaseOrders.filter((p) => p.dealer === d.email);
                const allocated = dealerAlloc.reduce((s, a) => s + (a.volumeLitres || 0), 0);
                const lifted = dealerAlloc.reduce((s, a) => s + (a.usedLitres || 0), 0);
                const remaining = Math.max(0, allocated - lifted);
                const outstanding = dealerPOs.filter((p) => p.status !== "delivered").reduce((s, p) => s + (p.totalAmount || 0), 0);
                const allocUtil = allocated > 0 ? Math.round((lifted / allocated) * 100) : 0;
                const completedValue = dealerTx.filter((t) => t.status === "completed").reduce((s, t) => s + (t.totalAmount || 0), 0);
                const collateral = dealerAlloc.reduce((s, a) => s + Math.max(0, (a.volumeLitres || 0) - (a.usedLitres || 0)) * (productPrice[a.product as string] || 0), 0);
                const financedVol = dealerPOs.reduce((s, p) => s + (p.productQuantity || 0), 0);
                const lastTradeTs = dealerTx.reduce((mx, t) => {
                  const ts = t.timestamp ? new Date(t.timestamp).getTime() : 0;
                  return ts > mx ? ts : mx;
                }, 0);
                const band = dealerRiskBand(d.status, dealerTx);
                return { d, dealerTx, dealerAlloc, dealerPOs, allocated, lifted, remaining, outstanding, allocUtil, completedValue, collateral, financedVol, lastTradeTs, band };
              }).filter((r) => !q || [r.d.companyName, r.d.name, r.d.email, r.d.dealerCode, r.d.state].some((v: string) => (v || "").toLowerCase().includes(q)));

              if (!rows.length) return <p className="text-xs text-muted py-6 text-center">No dealers match “{dealerSearch}”.</p>;

              return (
                <div className="bg-card/60 border border-line rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted text-left bg-card/80 text-xs">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">Company</th>
                          <th className="py-2.5 px-3 font-medium">Account Manager</th>
                          <th className="py-2.5 px-3 font-medium whitespace-nowrap">Outstanding <span className="text-[10px] opacity-60">(proxy)</span></th>
                          <th className="py-2.5 px-3 font-medium whitespace-nowrap">Alloc. Util.</th>
                          <th className="py-2.5 px-3 font-medium whitespace-nowrap">Last Trade</th>
                          <th className="py-2.5 px-3 font-medium">Risk</th>
                          <th className="py-2.5 px-3 font-medium">Status</th>
                          <th className="py-2.5 px-3 font-medium w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const d = r.d;
                          const open = openDealer === d._id;
                          return (
                            <React.Fragment key={d._id}>
                              <tr onClick={() => setOpenDealer(open ? null : d._id)}
                                className={`border-t border-line cursor-pointer transition-all ${open ? "bg-orange-500/10" : openDealer ? "opacity-40 hover:opacity-100 hover:bg-card" : "hover:bg-card"}`}>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{d.companyName || d.name}</span>
                                    {d.dealerCode && <code className="text-[10px] text-orange-600 dark:text-orange-300 bg-orange-500/10 px-1 py-0.5 rounded hidden md:inline">{d.dealerCode}</code>}
                                  </div>
                                  <span className="text-[11px] text-muted inline-flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{d.state || "—"}</span>
                                </td>
                                <td className="py-2.5 px-3 text-muted italic">Unassigned</td>
                                <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">{naira(r.outstanding)}</td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-14 hidden sm:block"><LevelBar level={r.allocUtil} /></span>
                                    <span className="text-muted">{r.allocUtil}%</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-muted whitespace-nowrap">{r.lastTradeTs ? new Date(r.lastTradeTs).toLocaleDateString() : "—"}</td>
                                <td className="py-2.5 px-3"><RiskPill band={r.band} /></td>
                                <td className="py-2.5 px-3"><StatusPill value={d.status} /></td>
                                <td className="py-2.5 px-3 text-muted"><ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} /></td>
                              </tr>
                              {open && (
                                <tr>
                                  <td colSpan={8} className="p-0 pb-2">
                                    <div className="animate-dealer-open mx-1 mb-1 rounded-xl border border-orange-500/30 bg-background/80 p-5 shadow-2xl ring-1 ring-orange-500/10 space-y-5">
                                      {/* Focus header */}
                                      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-line pb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-bold text-foreground">{d.companyName || d.name}</span>
                                          {d.dealerCode && <code className="text-[10px] text-orange-600 dark:text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded">{d.dealerCode}</code>}
                                          <RiskPill band={r.band} />
                                          <StatusPill value={d.status} />
                                        </div>
                                        <button onClick={() => setOpenDealer(null)} className="text-[11px] text-muted hover:text-foreground inline-flex items-center gap-1 shrink-0">
                                          Close <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                        </button>
                                      </div>
                                      {/* Company details + KYC */}
                                      <div>
                                        <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-3">Company Details &amp; KYC</p>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                          <Field label="Registered Name" value={d.companyName || d.name} sub={d.dealerCode ? `Code: ${d.dealerCode}` : undefined} />
                                          <Field label="Contact" value={d.name} sub={d.phone} />
                                          <Field label="Email" value={d.email} />
                                          <Field label="Location" value={`${d.state || "—"}${d.lga ? ", " + d.lga : ""}`} sub={d.headOfficeAddress || undefined} />
                                          <Field label="RC Number" value={d.rcNumber || "—"} sub={d.cacRegNo ? `CAC: ${d.cacRegNo}` : undefined} />
                                          <Field label="DPR Licence" value={d.dprLicence || "—"} sub={d.dprRegNo ? `Reg: ${d.dprRegNo}` : undefined} />
                                          <Field label="Tax ID (TIN)" value={d.tinNumber || "—"} />
                                          <Field label="Onboarded" value={d.joinedAt ? new Date(d.joinedAt).toLocaleDateString() : "—"} />
                                        </div>
                                      </div>

                                      {/* Credit facility (proxy) */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Credit Facility Summary</p>
                                          <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">Proxy — from platform activity, not a loan ledger</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                          <div className="bg-card/60 border border-line rounded-lg p-3"><p className="text-xs text-muted">Outstanding exposure</p><p className="text-base font-bold text-foreground">{naira(r.outstanding)}</p><p className="text-[11px] text-muted">open financed orders</p></div>
                                          <div className="bg-card/60 border border-line rounded-lg p-3"><p className="text-xs text-muted">Collateral value</p><p className="text-base font-bold text-foreground">{naira(r.collateral)}</p><p className="text-[11px] text-muted">unlifted allocation stock</p></div>
                                          <div className="bg-card/60 border border-line rounded-lg p-3"><p className="text-xs text-muted">Financed volume</p><p className="text-base font-bold text-foreground">{num(r.financedVol)} L</p><p className="text-[11px] text-muted">across {r.dealerPOs.length} orders</p></div>
                                          <div className="bg-card/60 border border-line rounded-lg p-3"><p className="text-xs text-muted">Completed value</p><p className="text-base font-bold text-emerald-400">{naira(r.completedValue)}</p><p className="text-[11px] text-muted">{r.dealerTx.length} transactions</p></div>
                                        </div>
                                        <p className="text-[10px] text-muted mt-2">Credit limit, drawdown schedule and repayment history require a formal credit ledger (not yet modelled on the platform).</p>
                                      </div>

                                      {/* Storage + inventory positions */}
                                      <div className="grid lg:grid-cols-3 gap-4">
                                        <div className="bg-card/60 border border-line rounded-lg p-4">
                                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-3">Tank Storage (ML)</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center"><p className="text-xs text-muted">PMS</p><p className="text-base font-bold text-foreground">{d.pmsTankMaxML ?? "—"}</p></div>
                                            <div className="text-center"><p className="text-xs text-muted">AGO</p><p className="text-base font-bold text-foreground">{d.agoTankMaxML ?? "—"}</p></div>
                                            <div className="text-center"><p className="text-xs text-muted">ATK</p><p className="text-base font-bold text-foreground">{d.atkTankMaxML ?? "—"}</p></div>
                                          </div>
                                          <p className="text-[10px] text-muted mt-3">{num(r.remaining)} L unlifted of {num(r.allocated)} L allocated</p>
                                        </div>
                                        <div className="lg:col-span-2">
                                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2">Inventory Positions (Depot Allocations)</p>
                                          {r.dealerAlloc.length ? (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-sm">
                                                <thead className="text-muted text-left text-xs">
                                                  <tr><th className="py-1.5 pr-3 font-medium">Product</th><th className="py-1.5 pr-3 font-medium">Depot</th><th className="py-1.5 pr-3 font-medium">Volume</th><th className="py-1.5 pr-3 font-medium">Used</th><th className="py-1.5 pr-3 font-medium">Valid To</th><th className="py-1.5 font-medium">Status</th></tr>
                                                </thead>
                                                <tbody className="text-foreground">
                                                  {r.dealerAlloc.map((a) => (
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
                                      </div>

                                      {/* Trade history + volume trend */}
                                      <div className="grid lg:grid-cols-3 gap-4">
                                        <div className="lg:col-span-2">
                                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2">Trade History</p>
                                          {r.dealerTx.length ? (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-sm">
                                                <thead className="text-muted text-left text-xs">
                                                  <tr><th className="py-1.5 pr-3 font-medium">Ref</th><th className="py-1.5 pr-3 font-medium">Type</th><th className="py-1.5 pr-3 font-medium">Amount</th><th className="py-1.5 pr-3 font-medium">Method</th><th className="py-1.5 font-medium">Status</th></tr>
                                                </thead>
                                                <tbody className="text-foreground">
                                                  {r.dealerTx.slice(0, 8).map((t) => (
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
                                        <div>
                                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2">Trade Volume Trend</p>
                                          <TradeTrend txns={r.dealerTx} />
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
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

        {/* ── TRADE MONITORING ── */}
        {tab === "Trade Monitoring" && (() => {
          // Join each trade (purchase order) with its payment (transaction) and
          // loading record to reconstruct the order → payment → loading → delivery
          // lifecycle. "Live status" reflects current DB state on refresh.
          const txById = new Map((data.transactions as any[]).map((t) => [String(t._id), t]));
          const loadByOrder = new Map<string, any>();
          for (const l of data.loadingRecords as any[]) {
            if (l.orderId && !loadByOrder.has(l.orderId)) loadByOrder.set(l.orderId, l);
          }
          const AGING_DAYS = 21;
          const nowMs = Date.now();
          const trades = (data.purchaseOrders as any[]).map((po) => {
            const txn = po.transactionId ? txById.get(String(po.transactionId)) : undefined;
            const load = loadByOrder.get(po.orderId);
            const volume = po.productQuantity || 0;
            const totalValue = po.totalAmount || 0;
            const unitPrice = volume > 0 ? totalValue / volume : 0;
            const paymentStatus = txn?.status
              ? txn.status
              : (po.status === "delivered" || po.status === "in_transit") ? "completed"
              : po.status === "cancelled" ? "failed"
              : "pending";
            const stage = tradeStage(po.status, load?.status);
            const ageDays = po.createdAt
              ? Math.max(0, Math.floor((nowMs - new Date(po.createdAt).getTime()) / 86_400_000))
              : 0;
            // Risk = fuel released without settlement (delivered but unpaid) OR an
            // AI-flagged payment. Aging = still open well beyond the settlement window.
            const riskReasons: string[] = [];
            if (stage === "Delivered" && paymentStatus !== "completed") riskReasons.push("Delivered but unpaid");
            if (txn?.aiFlagged) riskReasons.push("AI-flagged payment");
            const aging = stage !== "Delivered" && stage !== "Cancelled" && ageDays > AGING_DAYS;
            return { po, txn, load, volume, totalValue, unitPrice, paymentStatus, stage, ageDays, riskReasons, risk: riskReasons.length > 0, aging };
          });

          const depotOptions = Array.from(new Set(trades.map((r) => r.po.loadingDepot).filter(Boolean)));
          const q = tmSearch.trim().toLowerCase();
          const periodDays = tmPeriod === "7d" ? 7 : tmPeriod === "30d" ? 30 : tmPeriod === "90d" ? 90 : 0;
          const STAGE_ORDER = ["Placed", "Reserved", "Loaded", "In transit", "Delivered", "Cancelled"];
          const filtered = trades.filter((r) =>
            (tmProduct === "All" || r.po.productType === tmProduct) &&
            (tmStatus === "All" || r.po.status === tmStatus) &&
            (tmDepot === "All" || r.po.loadingDepot === tmDepot) &&
            (!tmRiskOnly || r.risk) &&
            (periodDays === 0 || r.ageDays <= periodDays) &&
            (!q || [r.po.orderId, r.po.companyName, r.po.dealer].some((v: string) => (v || "").toLowerCase().includes(q)))
          );

          const sortVal = (r: typeof trades[number]): number | string => {
            switch (tmSort.key) {
              case "buyer": return (r.po.companyName || r.po.dealer || "").toLowerCase();
              case "volume": return r.volume;
              case "unitPrice": return r.unitPrice;
              case "totalValue": return r.totalValue;
              case "payment": return r.paymentStatus;
              case "stage": return STAGE_ORDER.indexOf(r.stage);
              default: return r.po.createdAt ? new Date(r.po.createdAt).getTime() : 0; // placed
            }
          };
          filtered.sort((a, b) => {
            const va = sortVal(a), vb = sortVal(b);
            const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
            return tmSort.dir === "asc" ? cmp : -cmp;
          });
          const sortBy = (key: string) =>
            setTmSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

          const sum = (f: (r: typeof trades[number]) => number) => filtered.reduce((s, r) => s + f(r), 0);
          const delivered = filtered.filter((r) => r.stage === "Delivered").length;
          const inTransit = filtered.filter((r) => r.stage === "In transit").length;
          const unpaid = filtered.filter((r) => r.paymentStatus !== "completed").length;
          const atRisk = filtered.filter((r) => r.risk).length;
          const agingCount = filtered.filter((r) => r.aging).length;
          const stageCounts = STAGE_ORDER.map((st) => ({ stage: st, count: filtered.filter((r) => r.stage === st).length })).filter((s) => s.count > 0);

          const exportCsv = () =>
            downloadCsv(
              `trade-monitoring-${new Date().toISOString().slice(0, 10)}.csv`,
              ["Trade ID", "Buyer", "Seller (Depot)", "Product", "Volume (L)", "Unit Price", "Total Value", "Payment", "Live Status", "Placed", "Age (days)", "Risk"],
              filtered.map((r) => [
                r.po.orderId || "", r.po.companyName || r.po.dealer || "", r.po.loadingDepot || "",
                r.po.productType || "", r.volume, Math.round(r.unitPrice), r.totalValue,
                r.paymentStatus, r.stage, r.po.createdAt ? new Date(r.po.createdAt).toLocaleDateString() : "",
                r.ageDays, r.riskReasons.join("; "),
              ])
            );

          const selCls = "bg-card border border-line rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-orange-500/50";

          return (
            <div className="space-y-4">
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">Trades</p><p className="text-base font-bold text-foreground">{num(filtered.length)}</p></div>
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">Total value</p><p className="text-base font-bold text-foreground">{naira(sum((r) => r.totalValue))}</p></div>
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">Total volume</p><p className="text-base font-bold text-foreground">{num(sum((r) => r.volume))} L</p></div>
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">Delivered</p><p className="text-base font-bold text-emerald-400">{num(delivered)}</p></div>
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">In transit</p><p className="text-base font-bold text-indigo-300">{num(inTransit)}</p></div>
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">Unpaid</p><p className="text-base font-bold text-amber-300">{num(unpaid)}</p></div>
                <button onClick={() => setTmRiskOnly((v) => !v)} title="Toggle risk-only filter"
                  className={`text-left bg-card/60 border rounded-xl p-3 transition ${atRisk ? "border-red-500/40" : "border-line"} ${tmRiskOnly ? "ring-1 ring-red-500/50" : "hover:border-red-500/40"}`}>
                  <p className="text-xs text-muted">At risk</p><p className={`text-base font-bold ${atRisk ? "text-red-400" : "text-foreground"}`}>{num(atRisk)}</p>
                </button>
                <div className="bg-card/60 border border-line rounded-xl p-3"><p className="text-xs text-muted">Aging</p><p className={`text-base font-bold ${agingCount ? "text-amber-300" : "text-foreground"}`}>{num(agingCount)}</p></div>
              </div>

              {/* Stage pipeline bar */}
              {filtered.length > 0 && (
                <div className="bg-card/60 border border-line rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Lifecycle Pipeline</p>
                    <span className="text-[11px] text-muted">{num(filtered.length)} trades</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-card-2">
                    {stageCounts.map((s) => (
                      <div key={s.stage} style={{ width: `${(s.count / filtered.length) * 100}%`, background: STAGE_COLORS[s.stage] }}
                        title={`${s.stage}: ${s.count}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {stageCounts.map((s) => (
                      <span key={s.stage} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                        <span className="w-2 h-2 rounded-sm" style={{ background: STAGE_COLORS[s.stage] }} />
                        {s.stage} <span className="text-foreground font-semibold">{s.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input value={tmSearch} onChange={(e) => setTmSearch(e.target.value)} placeholder="Search trade ID or buyer…"
                    className="bg-card border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-orange-500/50 w-56" />
                </div>
                <select value={tmProduct} onChange={(e) => setTmProduct(e.target.value)} className={selCls}>
                  <option value="All">All products</option>{PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={tmStatus} onChange={(e) => setTmStatus(e.target.value)} className={selCls}>
                  {["All", "pending", "processing", "in_transit", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s === "All" ? "All delivery status" : toLabel(s)}</option>)}
                </select>
                <select value={tmDepot} onChange={(e) => setTmDepot(e.target.value)} className={selCls}>
                  <option value="All">All depots</option>{depotOptions.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
                </select>
                <select value={tmPeriod} onChange={(e) => setTmPeriod(e.target.value)} className={selCls}>
                  {["All", "7d", "30d", "90d"].map((p) => <option key={p} value={p}>{p === "All" ? "All time" : `Last ${p}`}</option>)}
                </select>
                {tmRiskOnly && (
                  <button onClick={() => setTmRiskOnly(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
                    Risk only ✕
                  </button>
                )}
                <button onClick={exportCsv} disabled={!filtered.length}
                  className="ml-auto inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              {/* Trades table */}
              {!filtered.length ? (
                <EmptyState icon={Activity} label="No trades match the current filters." />
              ) : (
                <div className="bg-card/60 border border-line rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted text-left bg-card/80 text-xs">
                        <tr>
                          {(() => {
                            const caret = (key: string) => tmSort.key === key ? (tmSort.dir === "asc" ? " ▲" : " ▼") : "";
                            const SortTh = ({ k, label, extra = "" }: { k: string; label: string; extra?: string }) => (
                              <th className={`py-2.5 px-3 font-medium cursor-pointer select-none hover:text-foreground ${extra}`} onClick={() => sortBy(k)}>{label}{caret(k)}</th>
                            );
                            return (
                              <>
                                <th className="py-2.5 px-3 font-medium">Trade ID</th>
                                <SortTh k="buyer" label="Buyer" />
                                <th className="py-2.5 px-3 font-medium">Seller</th>
                                <th className="py-2.5 px-3 font-medium">Product</th>
                                <SortTh k="volume" label="Volume" extra="whitespace-nowrap" />
                                <SortTh k="unitPrice" label="Unit Price" extra="whitespace-nowrap" />
                                <SortTh k="totalValue" label="Total Value" extra="whitespace-nowrap" />
                                <SortTh k="payment" label="Payment" />
                                <SortTh k="stage" label="Live Status" />
                                <th className="py-2.5 px-3 font-medium w-8"></th>
                              </>
                            );
                          })()}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((r) => {
                          const po = r.po;
                          const rowId = po._id || po.orderId;
                          const open = openTrade === rowId;
                          const steps = [
                            { label: "Placed", at: po.createdAt, done: true },
                            { label: "Paid", at: r.txn?.timestamp, done: r.paymentStatus === "completed", note: r.paymentStatus === "completed" ? undefined : "Awaiting payment" },
                            { label: "Loaded", at: r.load?.loadingDate, done: !!r.load && r.load.status !== "cancelled", note: r.load ? undefined : "Not loaded" },
                            { label: "Delivered", at: undefined, done: po.status === "delivered", note: po.status === "delivered" ? "Confirmed" : "In progress" },
                          ];
                          return (
                            <React.Fragment key={rowId}>
                              <tr onClick={() => setOpenTrade(open ? null : rowId)}
                                className={`border-t border-line cursor-pointer transition-all ${open ? "bg-orange-500/10" : openTrade ? "opacity-40 hover:opacity-100 hover:bg-card" : "hover:bg-card"}`}>
                                <td className="py-2.5 px-3 font-mono text-orange-600 dark:text-orange-300 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5">
                                    {po.orderId}
                                    {r.risk && <span title={r.riskReasons.join(" · ")}><AlertTriangle className="w-3.5 h-3.5 text-red-400" /></span>}
                                    {r.aging && <span title={`Open ${r.ageDays} days`}><Clock className="w-3.5 h-3.5 text-amber-400" /></span>}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3"><span className="text-foreground font-medium">{po.companyName || po.dealer || "—"}</span></td>
                                <td className="py-2.5 px-3 text-muted whitespace-nowrap">{po.loadingDepot || "—"}</td>
                                <td className="py-2.5 px-3">{po.productType || "—"}</td>
                                <td className="py-2.5 px-3 whitespace-nowrap">{num(r.volume)} L</td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-muted">{r.unitPrice ? perL(r.unitPrice) : "—"}</td>
                                <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">{naira(r.totalValue)}</td>
                                <td className="py-2.5 px-3"><StatusPill value={r.paymentStatus} /></td>
                                <td className="py-2.5 px-3"><StageBadge stage={r.stage} /></td>
                                <td className="py-2.5 px-3 text-muted"><ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} /></td>
                              </tr>
                              {open && (
                                <tr>
                                  <td colSpan={10} className="p-0 pb-2">
                                    <div className="animate-dealer-open mx-1 mb-1 rounded-xl border border-orange-500/30 bg-background/80 p-5 shadow-2xl ring-1 ring-orange-500/10 space-y-5">
                                      {r.risk && (
                                        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                          <p className="text-xs text-red-200"><span className="font-semibold">Risk:</span> {r.riskReasons.join(" · ")}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">Trade Lifecycle</p>
                                        <TradeLifecycle steps={steps} />
                                      </div>
                                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-line pt-4">
                                        <Field label="Buyer" value={po.companyName || po.dealer || "—"} sub={po.dealer || undefined} />
                                        <Field label="Seller / Depot" value={po.loadingDepot || "—"} />
                                        <Field label="Product / Volume" value={`${po.productType || "—"} · ${num(r.volume)} L`} />
                                        <Field label="Total Value" value={naira(r.totalValue)} sub={r.unitPrice ? `${perL(r.unitPrice)} unit` : undefined} />
                                        <Field label="Payment" value={toLabel(r.paymentStatus)} sub={po.paymentMethod ? toLabel(po.paymentMethod) : undefined} />
                                        <Field label="Loading" value={r.load ? `${num(r.load.totalLitresLoaded || 0)} L loaded` : "Not loaded"} sub={r.load?.truckRegNumber || undefined} />
                                        <Field label="Delivery Status" value={toLabel(po.status)} />
                                        <Field label="Order Placed" value={po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "—"} sub={`${r.ageDays} day${r.ageDays === 1 ? "" : "s"} ago${r.aging ? " · aging" : ""}`} />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted">Live status reflects current records on refresh (order → payment → loading → delivery); it is not a real-time push feed.</p>
            </div>
          );
        })()}

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
          <span>{demo ? "Showing demo data" : "Connected to live data"}</span>
        </div>
      </div>

      {/* Flagged-transactions drill-down: why each transaction was flagged. */}
      {showFlagged && (() => {
        const flaggedTxns = (f.transactions as any[]).filter((t) => t.aiFlagged);
        const sevTone: Record<string, string> = {
          high: "bg-red-500/15 text-red-400",
          medium: "bg-amber-500/15 text-amber-400",
          low: "bg-sky-500/15 text-sky-400",
        };
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
            onClick={() => setShowFlagged(false)}>
            <div className="bg-card border border-line rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Flagged transactions</p>
                    <p className="text-[11px] text-muted">{num(flaggedTxns.length)} flagged by AI anomaly detection · why each was flagged</p>
                  </div>
                </div>
                <button onClick={() => setShowFlagged(false)}
                  className="text-xs text-muted hover:text-foreground border border-line rounded-lg px-3 py-1.5 shrink-0">Close</button>
              </div>
              <div className="overflow-y-auto divide-y divide-line px-5">
                {flaggedTxns.length === 0 && (
                  <p className="text-xs text-muted py-8 text-center">No flagged transactions in the current view.</p>
                )}
                {flaggedTxns.map((t) => {
                  const sev = (t.aiAnomalySeverity as string) || "medium";
                  return (
                    <div key={t._id ?? t.txnId} className="py-3.5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-sm text-foreground font-medium truncate">
                          {t.user}
                          <span className="text-muted font-normal"> · {t.product || toLabel(t.type)}</span>
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${sevTone[sev] ?? sevTone.medium}`}>{sev}</span>
                          <span className="text-sm font-bold text-foreground">{naira(t.totalAmount)}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">{t.txnId} · {timeAgo(t.timestamp)}</p>
                      <p className="text-xs text-foreground/90 mt-1.5 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                        {t.aiAnomalyDesc || "Flagged by anomaly detection; no detailed reason was recorded for this transaction."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-base text-foreground break-words">{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}
