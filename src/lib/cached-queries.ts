import { connectDB } from "@/lib/db";
import { Depot } from "@/lib/models/Depot";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { PriceHistory } from "@/lib/models/PriceHistory";
import { Transaction } from "@/lib/models/Transaction";
import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { Truck } from "@/lib/models/Truck";
import { Notification } from "@/lib/models/Notification";
import { DailySales } from "@/lib/models/DailySales";
import { getCache, setCache, deleteCache } from "@/lib/cache";

// Centralised cached queries for high-traffic reads.
// These helpers are safe to use from API routes and getServerSideProps.

const TTL_5_MIN = 5 * 60 * 1000;
const TTL_1_MIN = 60 * 1000;

// ─── Cache keys ───────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  depotsAll: "depots-all",
  platformSettings: "platform-settings-global", // keep in sync with platform-settings API
  priceHistoryRecent: "price-history-recent",
  dashboardTransactions: "dashboard-transactions",
  dashboardSupplyRequests: "dashboard-supply-requests",
  dashboardPurchaseOrders: "dashboard-purchase-orders",
} as const;

// ─── Depots ───────────────────────────────────────────────────────────────────

export async function getCachedDepots(limit = 50) {
  await connectDB();

  const cached = getCache<any[]>(CACHE_KEYS.depotsAll);
  if (cached) return cached.slice(0, limit);

  const docs = await Depot.find({}).sort({ name: 1 }).limit(limit).lean();
  setCache(CACHE_KEYS.depotsAll, docs, TTL_5_MIN);
  return docs;
}

export function invalidateDepotsCache() {
  deleteCache(CACHE_KEYS.depotsAll);
}

// ─── Platform settings ────────────────────────────────────────────────────────
// NOTE: GET /api/db/platform-settings already uses cache.ts directly. These
// helpers are mainly for server-side usage from pages if needed.

export async function getCachedPlatformSettings() {
  await connectDB();
  const cached = getCache<any>(CACHE_KEYS.platformSettings);
  if (cached) return cached;

  const doc = await PlatformSettings.findOne({ settingsKey: "global" }).lean() as any;
  if (!doc) return null;
  delete doc.apiKey;
  delete doc.depotCodeSecret;
  delete doc.paystackSecretKey;
  setCache(CACHE_KEYS.platformSettings, doc, TTL_5_MIN);
  return doc;
}

export function invalidatePlatformSettingsCache() {
  deleteCache(CACHE_KEYS.platformSettings);
}

// ─── Price history (recent window for charts/widgets) ────────────────────────

export async function getCachedRecentPriceHistory(months = 12) {
  await connectDB();
  const cached = getCache<any[]>(CACHE_KEYS.priceHistoryRecent);
  if (cached) return cached;

  const docs = await PriceHistory.find({})
    .sort({ recordedAt: 1 })
    .limit(months)
    .lean();

  setCache(CACHE_KEYS.priceHistoryRecent, docs, TTL_5_MIN);
  return docs;
}

export function invalidatePriceHistoryCache() {
  deleteCache(CACHE_KEYS.priceHistoryRecent);
}

// ─── Dashboard-heavy collections (admin views) ───────────────────────────────

export async function getCachedRecentTransactions(limit = 200) {
  await connectDB();
  const key = CACHE_KEYS.dashboardTransactions;
  const cached = getCache<any[]>(key);
  if (cached) return cached;

  const docs = await Transaction.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  setCache(key, docs, TTL_1_MIN);
  return docs;
}

export function invalidateTransactionsCache() {
  deleteCache(CACHE_KEYS.dashboardTransactions);
}

export async function getCachedRecentSupplyRequests(limit = 200) {
  await connectDB();
  const key = CACHE_KEYS.dashboardSupplyRequests;
  const cached = getCache<any[]>(key);
  if (cached) return cached;

  const docs = await SupplyRequest.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  setCache(key, docs, TTL_1_MIN);
  return docs;
}

export function invalidateSupplyRequestsCache() {
  deleteCache(CACHE_KEYS.dashboardSupplyRequests);
}

export async function getCachedRecentPurchaseOrders(limit = 200) {
  await connectDB();
  const key = CACHE_KEYS.dashboardPurchaseOrders;
  const cached = getCache<any[]>(key);
  if (cached) return cached;

  const docs = await PurchaseOrder.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  setCache(key, docs, TTL_1_MIN);
  return docs;
}

export function invalidatePurchaseOrdersCache() {
  deleteCache(CACHE_KEYS.dashboardPurchaseOrders);
}

// ─── Station dashboard helpers (per-depot snapshots) ─────────────────────────

export async function getCachedDepotDashboardSnapshot(depotName: string) {
  await connectDB();
  const key = `depot-snapshot:${depotName}`;
  const cached = getCache<any>(key);
  if (cached) return cached;

  const depot = await Depot.findOne({ name: depotName }).lean();
  if (!depot) return null;

  // Attach recent daily sales + notifications for that depot
  const [sales, notifs] = await Promise.all([
    DailySales.find({ depot: depotName }).sort({ date: -1 }).limit(7).lean(),
    Notification.find({ depot: depotName }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const snapshot = { depot, sales, notifications: notifs };
  setCache(key, snapshot, TTL_1_MIN);
  return snapshot;
}

export function invalidateDepotDashboardSnapshot(depotName: string) {
  deleteCache(`depot-snapshot:${depotName}`);
}
