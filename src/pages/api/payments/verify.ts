/**
 * GET /api/payments/verify?ref=BUY-xxx
 *
 * Redirect fallback — called by /customer/transaction-status when the page loads.
 * Requeries GlobalPay and applies the same DB updates as the webhook,
 * in case the webhook hasn't fired yet.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { verifyByMerchantRef } from "@/lib/globalpay";
import { Transaction } from "@/lib/models/Transaction";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { UnionDues } from "@/lib/models/UnionDues";
import { TruckRental } from "@/lib/models/TruckRental";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const ref = req.query.ref as string;
  if (!ref) return res.status(400).json({ error: "Missing ref" });

  try {
    await connectDB();

    // Require a valid session, and only allow the payer (or an admin) to verify
    // a reference — prevents anonymous enumeration of payment state by ref.
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const txn = await Transaction.findOne({ reference: ref });
    if (!txn) return res.status(404).json({ error: "Unknown reference" });
    if (user.role !== "admin" && txn.userEmail !== user.email) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const gp = await verifyByMerchantRef(ref);

    // Only treat as paid when GlobalPay confirms success AND the paid amount
    // covers what was requested.
    if (gp.transactionStatus !== "Successful" || !(Number(gp.amountPaid) >= Number(gp.amountFromMerchant))) {
      return res.status(200).json({ status: gp.transactionStatus });
    }

    if (txn.status !== "completed") {
      await Transaction.findByIdAndUpdate(txn._id, { status: "completed", totalAmount: gp.amountPaid });

      if (ref.startsWith("BUY-")) {
        await PurchaseOrder.findOneAndUpdate({ orderId: ref }, { status: "Processing" });
      } else if (ref.startsWith("DUES-")) {
        await UnionDues.findOneAndUpdate({ paymentId: ref }, { status: "paid", amountPaid: gp.amountPaid });
      } else if (ref.startsWith("RENTAL-")) {
        await TruckRental.findOneAndUpdate({ rentalId: ref }, { status: "Confirmed", paymentStatus: "paid" });
      }
    }

    return res.status(200).json({ status: "Successful", amount: gp.amountPaid });
  } catch (err) {
    console.error("[payments/verify]", err);
    return res.status(500).json({ error: "Verification failed" });
  }
}
