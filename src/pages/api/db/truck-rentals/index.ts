import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { TruckRental } from "@/lib/models/TruckRental";
import { Transaction } from "@/lib/models/Transaction";
import { sendSms } from "@/lib/sms";
import { User } from "@/lib/models/User";
import { initiatePayment } from "@/lib/globalpay";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Unauthorized — please log in" });

  // GET: list with filters
  if (req.method === "GET") {
    const allowedRoles = ["admin", "truck_owner", "bulk_dealer", "customer"];
    if (!allowedRoles.includes(session.role)) {
      return res.status(403).json({ error: "Forbidden — insufficient role" });
    }
    try {
      const filterFields = ["rentedBy", "truckOwnerEmail", "status", "paymentStatus", "pickupDepot"];
      const filter: Record<string, unknown> = {};
      for (const field of filterFields) {
        if (req.query[field]) filter[field] = req.query[field];
      }
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100,  parseInt(req.query.limit as string) || 100);
      const skip  = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        TruckRental.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        TruckRental.countDocuments(filter),
      ]);
      return res.status(200).json({ data: docs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch records" });
    }
  }

  // POST: create + SMS confirmation
  if (req.method === "POST") {
    try {
      const doc = await TruckRental.create(req.body);

      // SMS to renter
      const rentedBy = req.body.rentedBy as string | undefined;
      if (rentedBy) {
        const user = await User.findOne({ email: rentedBy.toLowerCase().trim() }).lean();
        if (user?.phone) {
          const rentalId = doc.rentalId ?? String(doc._id).slice(-6).toUpperCase();
          const truck    = req.body.truckRegNumber ?? "N/A";
          const depot    = req.body.pickupDepot ?? "N/A";
          const start    = req.body.startDate ? new Date(req.body.startDate).toLocaleDateString("en-GB") : "N/A";
          sendSms(
            user.phone,
            `e-Nergy: Truck rental confirmed! Rental ID: ${rentalId}. Truck: ${truck}, Depot: ${depot}, Start: ${start}. Check your email for details.`
          ).catch(() => null);
        }
      }

      // Create pending Transaction
      const ref = doc.rentalId ?? `RENTAL-${Date.now()}`;
      await Transaction.create({
        txnId:         `TXN-${ref}`,
        type:          "truck_rental",
        user:          session.email,
        userEmail:     session.email,
        userRole:      "customer",
        totalAmount:   req.body.totalCost ?? 0,
        status:        "pending",
        paymentMethod: "card",
        reference:     ref,
        referenceType: "truck_rental",
        referenceId:   doc._id,
      });

      // Initiate GlobalPay checkout
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const gp = await initiatePayment({
        amount:                      req.body.totalCost ?? 0,
        merchantTransactionReference: ref,
        redirectUrl:                 `${appUrl}/customer/transaction-status?ref=${ref}`,
        customer: {
          name:  session.email,
          email: session.email,
          phone: req.body.renterPhone,
        },
      });

      return res.status(201).json({ ...doc.toObject(), checkoutUrl: gp.checkoutUrl });
    } catch (err: unknown) {
      console.error("[TruckRental] POST error:", err);
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "Duplicate record — a unique field already exists" });
      }
      return res.status(400).json({ error: (err as Error).message ?? "Validation error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
