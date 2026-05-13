/**
 * Typed frontend API client for all /api/db/* and /api/auth/* routes.
 *
 * Usage:
 *   import { api } from "@/lib/db-client";
 *   const result = await api.supplyRequests.list({ status: "Pending" });
 *
 * Every method returns null on error — callers check for null and show
 * a graceful error state rather than crashing.
 *
 * Auth token is read from the `token` cookie automatically by the browser.
 * For server-side calls, pass the token explicitly via options.token.
 */

import type {
  User, StationManager, SupplyRequest, PurchaseOrder,
  Transaction, Truck, TruckRental, LoadingRecord,
  Depot, FuelStation, DailySales,
  UnionDues, CustomLevy, PlatformSettings,
  Notification, Session, AIFeedback, Allocation,
  PaginatedResponse,
} from "./db-types";

// ─── Core fetch helpers ────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(url, { ...rest, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data as T;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); }
  catch (err) { console.error("[api]", err); return null; }
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const auth = {
  signup: (body: { name: string; email: string; phone?: string; role: string; password: string }) =>
    safe(() => apiFetch<{ token: string; user: Partial<User> }>("/api/auth/signup", {
      method: "POST", body: JSON.stringify(body),
    })),

  login: (body: { email: string; password: string }) =>
    safe(() => apiFetch<{ token: string; user: Partial<User> }>("/api/auth/login", {
      method: "POST", body: JSON.stringify(body),
    })),

  logout: () =>
    safe(() => apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" })),

  me: (token?: string) =>
    safe(() => apiFetch<{ user: Partial<User> }>("/api/auth/me", { token })),

  verifyEmail: (body: { email: string; code: string }) =>
    safe(() => apiFetch<{ ok: boolean; message: string }>("/api/auth/verify-email", {
      method: "POST", body: JSON.stringify(body),
    })),

  forgotPassword: (email: string) =>
    safe(() => apiFetch<{ ok: boolean; message: string }>("/api/auth/forgot-password", {
      method: "POST", body: JSON.stringify({ email }),
    })),

  resetPassword: (body: { token: string; password: string }) =>
    safe(() => apiFetch<{ ok: boolean; message: string }>("/api/auth/reset-password", {
      method: "POST", body: JSON.stringify(body),
    })),
};

// ─── Users ────────────────────────────────────────────────────────────────────

const users = {
  list: (filters: { role?: string; status?: string; state?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<User>>(`/api/db/users${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<User>(`/api/db/users/${id}`)),

  create: (data: Partial<User>) =>
    safe(() => apiFetch<User>("/api/db/users", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<User>) =>
    safe(() => apiFetch<User>(`/api/db/users/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  delete: (id: string) =>
    safe(() => apiFetch<{ deleted: boolean }>(`/api/db/users/${id}`, { method: "DELETE" })),
};

// ─── Station Managers ─────────────────────────────────────────────────────────

const stationManagers = {
  list: (filters: { depot?: string; status?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<StationManager>>(`/api/db/station-managers${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<StationManager>(`/api/db/station-managers/${id}`)),

  create: (data: Partial<StationManager> & { password: string }) =>
    safe(() => apiFetch<StationManager>("/api/db/station-managers", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<StationManager>) =>
    safe(() => apiFetch<StationManager>(`/api/db/station-managers/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  delete: (id: string) =>
    safe(() => apiFetch<{ deleted: boolean }>(`/api/db/station-managers/${id}`, { method: "DELETE" })),
};

// ─── Supply Requests ──────────────────────────────────────────────────────────

const supplyRequests = {
  list: (filters: { status?: string; product?: string; priority?: string; requestedBy?: string; depot?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<SupplyRequest>>(`/api/db/supply-requests${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<SupplyRequest>(`/api/db/supply-requests/${id}`)),

  create: (data: Partial<SupplyRequest>) =>
    safe(() => apiFetch<SupplyRequest>("/api/db/supply-requests", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<SupplyRequest>) =>
    safe(() => apiFetch<SupplyRequest>(`/api/db/supply-requests/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  routeWithAI: (requestId: string) =>
    safe(() => apiFetch<{ assignedDepot: string; reasoning: string }>("/api/ai/supply-routing", {
      method: "POST", body: JSON.stringify({ requestId }),
    })),
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────

const purchaseOrders = {
  list: (filters: { status?: string; depot?: string; dealer?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<PurchaseOrder>>(`/api/db/purchase-orders${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<PurchaseOrder>(`/api/db/purchase-orders/${id}`)),

  create: (data: Partial<PurchaseOrder>) =>
    safe(() => apiFetch<PurchaseOrder>("/api/db/purchase-orders", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<PurchaseOrder>) =>
    safe(() => apiFetch<PurchaseOrder>(`/api/db/purchase-orders/${id}`, { method: "PUT", body: JSON.stringify(data) })),
};

// ─── Loading Records ──────────────────────────────────────────────────────────

const loadingRecords = {
  list: (filters: { orderId?: string; depot?: string; status?: string; truckRegNumber?: string; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<LoadingRecord>>(`/api/db/loading-records${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<LoadingRecord>(`/api/db/loading-records/${id}`)),

  create: (data: Partial<LoadingRecord>) =>
    safe(() => apiFetch<LoadingRecord>("/api/db/loading-records", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<LoadingRecord>) =>
    safe(() => apiFetch<LoadingRecord>(`/api/db/loading-records/${id}`, { method: "PUT", body: JSON.stringify(data) })),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

const transactions = {
  list: (filters: { status?: string; type?: string; userRole?: string; depot?: string; aiFlagged?: boolean; paymentMethod?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<Transaction>>(`/api/db/transactions${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<Transaction>(`/api/db/transactions/${id}`)),

  create: (data: Partial<Transaction>) =>
    safe(() => apiFetch<Transaction>("/api/db/transactions", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<Transaction>) =>
    safe(() => apiFetch<Transaction>(`/api/db/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  detectAnomalies: (options: { limit?: number; status?: string } = {}) =>
    safe(() => apiFetch<{ flagged: { txnId: string; severity: string; description: string }[]; summary: string }>("/api/ai/anomaly-detection", {
      method: "POST", body: JSON.stringify(options),
    })),
};

// ─── Trucks ───────────────────────────────────────────────────────────────────

const trucks = {
  list: (filters: { status?: string; ownerEmail?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<Truck>>(`/api/db/trucks${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<Truck>(`/api/db/trucks/${id}`)),

  create: (data: Partial<Truck>) =>
    safe(() => apiFetch<Truck>("/api/db/trucks", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<Truck>) =>
    safe(() => apiFetch<Truck>(`/api/db/trucks/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  review: (truckId: string) =>
    safe(() => apiFetch<{ score: number; recommendation: string; summary: string; confidenceGate: string }>("/api/ai/truck-review", {
      method: "POST", body: JSON.stringify({ truckId }),
    })),
};

// ─── Truck Rentals ────────────────────────────────────────────────────────────

const truckRentals = {
  list: (filters: { rentedBy?: string; truckOwnerEmail?: string; status?: string; paymentStatus?: string; pickupDepot?: string; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<TruckRental>>(`/api/db/truck-rentals${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<TruckRental>(`/api/db/truck-rentals/${id}`)),

  create: (data: Partial<TruckRental>) =>
    safe(() => apiFetch<TruckRental>("/api/db/truck-rentals", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<TruckRental>) =>
    safe(() => apiFetch<TruckRental>(`/api/db/truck-rentals/${id}`, { method: "PUT", body: JSON.stringify(data) })),
};

// ─── Depots ───────────────────────────────────────────────────────────────────

const depots = {
  list: (filters: { state?: string } = {}) =>
    safe(() => apiFetch<PaginatedResponse<Depot>>(`/api/db/depots${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<Depot>(`/api/db/depots/${id}`)),

  create: (data: Partial<Depot>) =>
    safe(() => apiFetch<Depot>("/api/db/depots", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<Depot>) =>
    safe(() => apiFetch<Depot>(`/api/db/depots/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  seed: (seedSecret: string) =>
    safe(() => apiFetch<{ message: string; depots: string[] }>("/api/db/depots/seed", {
      method: "POST",
      headers: { "x-seed-secret": seedSecret },
    })),
};

// ─── Fuel Stations ────────────────────────────────────────────────────────────

const fuelStations = {
  list: (filters: { ownerEmail?: string; state?: string; status?: string; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<FuelStation>>(`/api/db/fuel-stations${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<FuelStation>(`/api/db/fuel-stations/${id}`)),

  create: (data: Partial<FuelStation>) =>
    safe(() => apiFetch<FuelStation>("/api/db/fuel-stations", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<FuelStation>) =>
    safe(() => apiFetch<FuelStation>(`/api/db/fuel-stations/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  delete: (id: string) =>
    safe(() => apiFetch<{ deleted: boolean }>(`/api/db/fuel-stations/${id}`, { method: "DELETE" })),
};

// ─── Daily Sales ──────────────────────────────────────────────────────────────

const dailySales = {
  list: (filters: { stationId?: string; recordedBy?: string; isVerified?: boolean; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<DailySales>>(`/api/db/daily-sales${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<DailySales>(`/api/db/daily-sales/${id}`)),

  create: (data: Partial<DailySales>) =>
    safe(() => apiFetch<DailySales>("/api/db/daily-sales", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<DailySales>) =>
    safe(() => apiFetch<DailySales>(`/api/db/daily-sales/${id}`, { method: "PUT", body: JSON.stringify(data) })),
};

// ─── Union Dues ───────────────────────────────────────────────────────────────

const unionDues = {
  list: (filters: { userEmail?: string; userRole?: string; status?: string; duesPeriod?: string; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<UnionDues>>(`/api/db/union-dues${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<UnionDues>(`/api/db/union-dues/${id}`)),

  create: (data: Partial<UnionDues>) =>
    safe(() => apiFetch<UnionDues>("/api/db/union-dues", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<UnionDues>) =>
    safe(() => apiFetch<UnionDues>(`/api/db/union-dues/${id}`, { method: "PUT", body: JSON.stringify(data) })),
};

// ─── Custom Levies ────────────────────────────────────────────────────────────

const customLevies = {
  list: (filters: { isActive?: boolean; frequency?: string } = {}) =>
    safe(() => apiFetch<PaginatedResponse<CustomLevy>>(`/api/db/custom-levies${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<CustomLevy>(`/api/db/custom-levies/${id}`)),

  create: (data: Partial<CustomLevy>) =>
    safe(() => apiFetch<CustomLevy>("/api/db/custom-levies", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<CustomLevy>) =>
    safe(() => apiFetch<CustomLevy>(`/api/db/custom-levies/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  delete: (id: string) =>
    safe(() => apiFetch<{ deleted: boolean }>(`/api/db/custom-levies/${id}`, { method: "DELETE" })),
};

// ─── Platform Settings ────────────────────────────────────────────────────────

const platformSettings = {
  get: () =>
    safe(() => apiFetch<PlatformSettings>("/api/db/platform-settings")),

  update: (data: Partial<PlatformSettings>) =>
    safe(() => apiFetch<PlatformSettings>("/api/db/platform-settings", { method: "PUT", body: JSON.stringify(data) })),
};

// ─── Notifications ────────────────────────────────────────────────────────────

const notifications = {
  list: (filters: { recipientEmail?: string; recipientRole?: string; read?: boolean; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<Notification>>(`/api/db/notifications${qs(filters)}`)),

  create: (data: Partial<Notification>) =>
    safe(() => apiFetch<Notification>("/api/db/notifications", { method: "POST", body: JSON.stringify(data) })),

  markRead: (id: string) =>
    safe(() => apiFetch<Notification>(`/api/db/notifications/${id}`, { method: "PUT", body: JSON.stringify({ read: true }) })),

  markAllRead: async (recipientEmail: string): Promise<boolean> => {
    const result = await notifications.list({ recipientEmail, read: false, page: 1, limit: 200 } as Parameters<typeof notifications.list>[0] & { limit: number });
    if (!result) return false;
    await Promise.all(result.data.map((n) => notifications.markRead(n._id)));
    return true;
  },

  delete: (id: string) =>
    safe(() => apiFetch<{ deleted: boolean }>(`/api/db/notifications/${id}`, { method: "DELETE" })),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

const sessionsMod = {
  list: (filters: { userEmail?: string; isValid?: boolean; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<Session>>(`/api/db/sessions${qs(filters)}`)),

  revoke: (id: string) =>
    safe(() => apiFetch<Session>(`/api/db/sessions/${id}`, { method: "PUT", body: JSON.stringify({ isValid: false }) })),
};

// ─── AI Feedback ──────────────────────────────────────────────────────────────

const aiFeedback = {
  list: (filters: { route?: string; adminOverrode?: boolean; page?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<AIFeedback>>(`/api/db/ai-feedback${qs(filters)}`)),

  log: (data: Partial<AIFeedback>) =>
    safe(() => apiFetch<AIFeedback>("/api/db/ai-feedback", { method: "POST", body: JSON.stringify(data) })),
};

// ─── AI standalone routes ─────────────────────────────────────────────────────

const ai = {
  overviewBriefing: () =>
    safe(() => apiFetch<{ summary: string; insights: string[]; alerts: string[] }>("/api/ai/overview-briefing")),

  reportInsights: (body: { reportType: string; dateRange: { from: string; to: string } }) =>
    safe(() => apiFetch<{ insights: string[]; trends: string[]; recommendations: string[] }>("/api/ai/report-insights", {
      method: "POST", body: JSON.stringify(body),
    })),

  userRisk: (userId: string) =>
    safe(() => apiFetch<{ riskScore: number; riskFactors: string[]; recommendation: string }>("/api/ai/user-risk", {
      method: "POST", body: JSON.stringify({ userId }),
    })),

  supplyFulfillment: (supplyRequestId: string) =>
    safe(() => apiFetch<{ depot: string; eta: string; trackingUpdates: string[] }>("/api/ai/supply-fulfillment", {
      method: "POST", body: JSON.stringify({ supplyRequestId }),
    })),
};

// ─── Allocations ──────────────────────────────────────────────────────────────

const allocations = {
  list: (filters: { dealerEmail?: string; product?: string; depot?: string; status?: string; page?: number; limit?: number } = {}) =>
    safe(() => apiFetch<PaginatedResponse<Allocation>>(`/api/db/allocations${qs(filters)}`)),

  get: (id: string) =>
    safe(() => apiFetch<Allocation>(`/api/db/allocations/${id}`)),

  create: (data: Partial<Allocation>) =>
    safe(() => apiFetch<Allocation>("/api/db/allocations", { method: "POST", body: JSON.stringify(data) })),

  update: (id: string, data: Partial<Allocation>) =>
    safe(() => apiFetch<Allocation>(`/api/db/allocations/${id}`, { method: "PUT", body: JSON.stringify(data) })),

  delete: (id: string) =>
    safe(() => apiFetch<{ deleted: boolean }>(`/api/db/allocations/${id}`, { method: "DELETE" })),
};

// ─── Seed helpers ─────────────────────────────────────────────────────────────

const seed = {
  depots: (seedSecret: string) => depots.seed(seedSecret),

  admin: (seedSecret: string, body?: { name?: string; email?: string; password?: string }) =>
    safe(() => apiFetch<{ message: string; email: string; warning?: string }>("/api/db/users/seed-admin", {
      method: "POST",
      headers: { "x-seed-secret": seedSecret },
      body: JSON.stringify(body ?? {}),
    })),
};

// ─── Main export (namespace style) ───────────────────────────────────────────

export const api = {
  auth,
  users,
  stationManagers,
  supplyRequests,
  purchaseOrders,
  loadingRecords,
  transactions,
  trucks,
  truckRentals,
  depots,
  fuelStations,
  dailySales,
  unionDues,
  customLevies,
  platformSettings,
  notifications,
  sessions: sessionsMod,
  aiFeedback,
  allocations,
  ai,
  seed,
};

// ─── Legacy named exports (keeps any existing imports working) ────────────────

export const getUsers              = users.list;
export const getUser               = users.get;
export const createUser            = users.create;
export const updateUser            = users.update;
export const deleteUser            = users.delete;
export const getSupplyRequests     = supplyRequests.list;
export const getSupplyRequest      = supplyRequests.get;
export const createSupplyRequest   = supplyRequests.create;
export const updateSupplyRequest   = supplyRequests.update;
export const getPurchaseOrders     = purchaseOrders.list;
export const getPurchaseOrder      = purchaseOrders.get;
export const createPurchaseOrder   = purchaseOrders.create;
export const updatePurchaseOrder   = purchaseOrders.update;
export const getTrucks             = trucks.list;
export const getTruck              = trucks.get;
export const createTruck           = trucks.create;
export const updateTruck           = trucks.update;
export const getDepots             = depots.list;
export const getDepot              = depots.get;
export const updateDepot           = depots.update;
export const getTransactions       = transactions.list;
export const createTransaction     = transactions.create;
export const updateTransaction     = transactions.update;
export const getNotifications      = notifications.list;
export const createNotification    = notifications.create;
export const markNotificationRead  = notifications.markRead;
export const getAIFeedback         = aiFeedback.list;
export const logAIFeedback         = aiFeedback.log;
