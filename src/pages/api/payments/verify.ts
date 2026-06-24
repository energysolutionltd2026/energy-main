/**
 * GET /api/payments/verify?ref=BUY-xxx
 *
 * Redirect fallback — called by /customer/transaction-status when the page loads.
 * Requeries GlobalPay and applies the same DB updates as the webhook,
 * in case the webhook hasn't fired yet.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
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
    const gp = await verifyByMerchantRef(ref);

    if (gp.transactionStatus !== "Successful") {
      return res.status(200).json({ status: gp.transactionStatus });
    }

    await connectDB();

    const txn = await Transaction.findOne({ reference: ref });
    if (txn && txn.status !== "completed") {
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
