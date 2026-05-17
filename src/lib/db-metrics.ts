/**
 * Server-side helpers that aggregate live MongoDB data into the
 * snapshot shapes expected by report-insights and overview-briefing.
 * Import only in API routes — uses Mongoose models directly.
 */
import { connectDB } from "./db";
import { User } from "./models/User";
import { SupplyRequest } from "./models/SupplyRequest";
import { PurchaseOrder } from "./models/PurchaseOrder";
import { Truck } from "./models/Truck";
import { Depot } from "./models/Depot";
import { Transaction } from "./models/Transaction";

// ─── Platform metrics snapshot (for report-insights) ─────────────────────────

export async function buildMetricsSnapshot() {
  await connectDB();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersByRole,
    suspendedUsers,
    pendingTrucks,
    supplyByStatus,
    urgentSupply,
    recentTransactions,
    failedTransactions,
    flaggedTransactions,
    depots,
    totalRevenue,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ status: "suspended" }),
    Truck.countDocuments({ status: "pending_review" }),
    SupplyRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    SupplyRequest.countDocuments({ priority: { $in: ["urgent", "emergency"] }, status: { $ne: "delivered" } }),
    Transaction.find({ timestamp: { $gte: weekAgo } }).lean().limit(500),
    Transaction.countDocuments({ status: "failed", timestamp: { $gte: weekAgo } }),
    Transaction.countDocuments({ aiFlagged: true }),
    Depot.find().lean(),
    Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const depotAlerts = (depots as Array<Record<string, unknown>>).filter((d: Record<string, unknown>) => {
    const pms = d.PMS as { level: number } | undefined;
    const ago = d.AGO as { level: number } | undefined;
    const atk = d.ATK as { level: number } | undefined;
    return (pms?.level ?? 100) < 20 || (ago?.level ?? 100) < 20 || (atk?.level ?? 100) < 20;
  }).map((d: Record<string, unknown>) => ({
    name: d.name,
    PMS: (d.PMS as { level: number })?.level,
    AGO: (d.AGO as { level: number })?.level,
    ATK: (d.ATK as { level: number })?.level,
  }));

  const supplyStatusMap = Object.fromEntries(
    (supplyByStatus as Array<{ _id: string; count: number }>).map((s) => [s._id, s.count])
  );

  const roleMap = Object.fromEntries(
    (usersByRole as Array<{ _id: string; count: number }>).map((r) => [r._id, r.count])
  );

  return {
    generatedAt: now.toISOString(),
    users: {
      total: totalUsers,
      byRole: roleMap,
      suspended: suspendedUsers,
    },
    trucks: {
      pendingReview: pendingTrucks,
    },
    supplyRequests: {
      byStatus: supplyStatusMap,
      urgentOrEmergency: urgentSupply,
    },
    transactions: {
      last7Days: recentTransactions.length,
      failedLast7Days: failedTransactions,
      totalFlagged: flaggedTransactions,
      totalRevenue: (totalRevenue as Array<{ total: number }>)[0]?.total ?? 0,
    },
    depots: {
      total: depots.length,
      criticalStockAlerts: depotAlerts,
      snapshot: (depots as Array<Record<string, unknown>>).map((d) => ({
        name: d.name,
        state: d.state,
        PMS: d.PMS,
        AGO: d.AGO,
        ATK: d.ATK,
      })),
    },
  };
}

// ─── Full platform snapshot (for overview-briefing) ──────────────────────────

export async function buildPlatformSnapshot() {
  await connectDB();

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [metrics, pendingActions, recentActivity] = await Promise.all([
    buildMetricsSnapshot(),

    // Things that need admin attention right now
    Promise.all([
      Truck.find({ status: "pending_review" }).select("ownerName truckRegNumber submittedAt").lean().limit(10),
      SupplyRequest.find({ status: "pending" }).select("stationName product quantity priority createdAt").lean().limit(10),
      User.find({ status: "pending" }).select("name email role joinedAt").lean().limit(10),
    ]),

    // What happened in the last 24 hours
    Promise.all([
      Transaction.countDocuments({ timestamp: { $gte: dayAgo } }),
      SupplyRequest.countDocuments({ createdAt: { $gte: dayAgo } }),
      Transaction.countDocuments({ status: "failed", timestamp: { $gte: dayAgo } }),
    ]),
  ]);

  const [pendingTrucks, pendingSupply, pendingUsers] = pendingActions;
  const [txnToday, requestsToday, failedToday] = recentActivity;

  return {
    ...metrics,
    pendingActions: {
      trucks: pendingTrucks,
      supplyRequests: pendingSupply,
      users: pendingUsers,
    },
    last24Hours: {
      transactions: txnToday,
      newSupplyRequests: requestsToday,
      failedTransactions: failedToday,
    },
  };
}
