/**
 * Read-only data feed for the restricted financer overview dashboard.
 *
 * Access is gated twice, fail-closed:
 *   1. A valid platform session (getSessionUser — verifies JWT + DB Session).
 *   2. The session email must be on OVERVIEW_ALLOWED_EMAILS (isOverviewAllowed).
 *
 * This exists as a dedicated endpoint (rather than reusing the admin-only
 * /api/db/* routes) so the second allow-listed viewer — who is NOT necessarily
 * an admin — can still receive accurate live data without being granted broad
 * admin access to the rest of the platform.
 *
 * Every dataset is read with an explicit field projection: no passwordHash,
 * OTP/reset tokens, bank details, secrets or other sensitive columns ever
 * leave the server. The endpoint is strictly GET and never mutates data.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "@/lib/auth";
import { isOverviewAllowed } from "@/lib/overviewAccess";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Allocation } from "@/lib/models/Allocation";
import { Transaction } from "@/lib/models/Transaction";
import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { Truck } from "@/lib/models/Truck";
import { TruckRental } from "@/lib/models/TruckRental";
import { Depot } from "@/lib/models/Depot";
import { UnionDues } from "@/lib/models/UnionDues";
import { PlatformSettings } from "@/lib/models/PlatformSettings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Never cache a per-identity, sensitive payload at any hop.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Gate 1: valid platform session.
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectDB();

    // Gate 2: access requires EITHER the env allowlist (super-admin bootstrap)
    // OR a super-admin-granted `financerAccess` flag on the user record. Fail
    // closed for everyone else.
    let allowed = isOverviewAllowed(user.email);
    if (!allowed) {
      const grantee = await User.findById(user.userId).select("financerAccess").lean();
      allowed = Boolean((grantee as { financerAccess?: boolean } | null)?.financerAccess);
    }
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [
      settings,
      dealers,
      allocations,
      transactions,
      supplyRequests,
      purchaseOrders,
      trucks,
      truckRentals,
      depots,
      unionDues,
    ] = await Promise.all([
      PlatformSettings.findOne({ settingsKey: "global" })
        .select(
          "platformName pmsPricePerLitre agoPricePerLitre atkPricePerLitre bulkDealerYearlyFee annualMembershipFee"
        )
        .lean(),
      User.find({ role: "bulk_dealer" })
        .select(
          "name companyName email phone role status dealerCode rcNumber dprLicence state lga headOfficeAddress pmsTankMaxML agoTankMaxML atkTankMaxML createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Allocation.find({})
        .select(
          "dealerEmail dealerName product volumeLitres usedLitres depot status validTo"
        )
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      Transaction.find({})
        .select(
          "txnId type user userEmail userRole product quantity totalAmount status paymentMethod depot timestamp aiFlagged aiAnomalySeverity"
        )
        .sort({ timestamp: -1 })
        .limit(300)
        .lean(),
      SupplyRequest.find({})
        .select(
          "requestId stationName product quantity depot priority status requestedBy"
        )
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      PurchaseOrder.find({})
        .select(
          "orderId companyName dealer productType productQuantity loadingDepot status totalAmount"
        )
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      Truck.find({}).select("status").limit(500).lean(),
      TruckRental.find({})
        .select("status paymentStatus totalAmount")
        .limit(500)
        .lean(),
      Depot.find({}).select("name state PMS AGO ATK").limit(100).lean(),
      UnionDues.find({}).select("status").limit(500).lean(),
    ]);

    return res.status(200).json({
      settings: settings || null,
      dealers,
      allocations,
      transactions,
      supplyRequests,
      purchaseOrders,
      trucks,
      truckRentals,
      depots,
      unionDues,
    });
  } catch (err) {
    console.error("[overview/data] query failed:", err);
    return res.status(500).json({ error: "Failed to load overview data" });
  }
}
