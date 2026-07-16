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
import { Financer } from "@/lib/models/Financer";
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

    // Gate 2: access requires ONE of:
    //   - a dedicated financer account session (role "financer"), still active;
    //   - the env allowlist (super-admin bootstrap);
    //   - a super-admin-granted `financerAccess` flag on the user record.
    // Fail closed for everyone else.
    let allowed = false;
    // When set, the viewer is ONE specific bank and every dataset below is
    // scoped to the bulk dealers assigned to it. When null, the viewer is a
    // platform-wide super-viewer (env allowlist or a financerAccess grantee)
    // and sees the whole platform.
    let scopedFinancerId: string | null = null;
    if (user.role === "financer") {
      // Dedicated Financer account, or a normal user converted to financer-only
      // via the admin toggle (backed by the financerAccess flag).
      const fin = await Financer.findById(user.userId).select("status").lean();
      if (fin) {
        allowed = (fin as { status?: string }).status !== "suspended";
        // A real bank account only ever sees the dealers assigned to it.
        scopedFinancerId = user.userId;
      } else {
        const grantee = await User.findById(user.userId).select("financerAccess").lean();
        allowed = Boolean((grantee as { financerAccess?: boolean } | null)?.financerAccess);
      }
    } else {
      allowed = isOverviewAllowed(user.email);
      if (!allowed) {
        const grantee = await User.findById(user.userId).select("financerAccess").lean();
        allowed = Boolean((grantee as { financerAccess?: boolean } | null)?.financerAccess);
      }
    }
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Fetch the (possibly scoped) dealer set first: the transaction-flow datasets
    // below are narrowed to just these dealers' emails when a single bank is
    // viewing, so we need their emails before querying.
    const dealers = await User.find(
      scopedFinancerId
        ? { role: "bulk_dealer", financerId: scopedFinancerId }
        : { role: "bulk_dealer" }
    )
      .select(
        "name companyName email phone role status dealerCode rcNumber dprLicence state lga headOfficeAddress pmsTankMaxML agoTankMaxML atkTankMaxML financerId createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // For a scoped bank view, restrict every dealer-keyed dataset to these
    // dealers' emails. `scope(field)` returns an empty-safe filter: a bank with
    // no assigned dealers gets `{ $in: [] }` and correctly sees nothing, while a
    // super-viewer (scopedFinancerId === null) gets the unfiltered `{}`.
    const dealerEmails = dealers
      .map((d) => (d as { email?: string }).email)
      .filter((e): e is string => Boolean(e));
    const scope = (field: string): Record<string, unknown> =>
      scopedFinancerId ? { [field]: { $in: dealerEmails } } : {};

    const [
      settings,
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
      Allocation.find(scope("dealerEmail"))
        .select(
          "dealerEmail dealerName product volumeLitres usedLitres depot status validTo"
        )
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      Transaction.find(scope("userEmail"))
        .select(
          "txnId type user userEmail userRole product quantity totalAmount status paymentMethod depot timestamp aiFlagged aiAnomalySeverity"
        )
        .sort({ timestamp: -1 })
        .limit(300)
        .lean(),
      SupplyRequest.find(scope("requestedBy"))
        .select(
          "requestId stationName product quantity depot priority status requestedBy"
        )
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      PurchaseOrder.find(scope("dealer"))
        .select(
          "orderId companyName dealer productType productQuantity loadingDepot status totalAmount createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      // Fleet / depot / union stats are shared platform infrastructure, not
      // dealer-owned, so they stay global even in a scoped bank view. (Per-dealer
      // truck-rental and union-dues *money flow* is already captured, scoped, in
      // the `transactions` dataset above.)
      Truck.find({}).select("status").limit(500).lean(),
      TruckRental.find({})
        .select("status paymentStatus totalAmount")
        .limit(500)
        .lean(),
      Depot.find({}).select("name state PMS AGO ATK").limit(100).lean(),
      UnionDues.find({}).select("status").limit(500).lean(),
    ]);

    // Banks available for the "by bank" filter: just this bank when scoped, or
    // every bank for a platform-wide super-viewer.
    const banks = await Financer.find(scopedFinancerId ? { _id: scopedFinancerId } : {})
      .select("name shortCode logoUrl")
      .sort({ name: 1 })
      .lean();

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
      banks,
    });
  } catch (err) {
    console.error("[overview/data] query failed:", err);
    return res.status(500).json({ error: "Failed to load overview data" });
  }
}
