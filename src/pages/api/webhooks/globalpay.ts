/**
 * POST /api/webhooks/globalpay
 *
 * Decrypts the AES-256-CBC payload from GlobalPay, then:
 *   - marks Transaction → completed
 *   - marks PurchaseOrder → Processing  /  UnionDues → paid  /  TruckRental → Confirmed
 *   - sends payment confirmation email
 *
 * GlobalPay retries unless it receives { ResponseCode: "00", Status: true }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { UnionDues } from "@/lib/models/UnionDues";
import { TruckRental } from "@/lib/models/TruckRental";
import { User } from "@/lib/models/User";
import { sendPaymentConfirmed } from "@/lib/email";

export const config = { api: { bodyParser: true } };

function decryptPayload(encrypted: string): Record<string, unknown> {
  const apiKey = process.env.GLOBALPAY_API_KEY!;
  // Key: first 16 bytes of API key, padded to 32 bytes for AES-256
  const key = Buffer.alloc(32);
  Buffer.from(apiKey, "utf8").slice(0, 16).copy(key);
  const cipherBuf = Buffer.from(encrypted, "base64");
  const iv   = cipherBuf.slice(0, 16);
  const data = cipherBuf.slice(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  let payload: Record<string, unknown>;
  try {
    payload = decryptPayload(req.body.Request as string);
  } catch (err) {
    console.error("[globalpay-webhook] Decrypt failed:", err);
    return res.status(200).json({ ResponseCode: "99", ResponseDescription: "Decrypt error", Status: false });
  }

  const merchantRef = payload.MerchantTransactionreference as string;
  const amount      = payload.InAmount as number;

  if (!merchantRef) {
    return res.status(200).json({ ResponseCode: "99", ResponseDescription: "Missing reference", Status: false });
  }

  try {
    await connectDB();

    const txn = await Transaction.findOne({ reference: merchantRef });
    if (txn) {
      await Transaction.findByIdAndUpdate(txn._id, { status: "completed", totalAmount: amount });
    }

    // Update source record based on reference prefix
    if (merchantRef.startsWith("BUY-")) {
      await PurchaseOrder.findOneAndUpdate({ orderId: merchantRef }, { status: "Processing" });
    } else if (merchantRef.startsWith("DUES-")) {
      await UnionDues.findOneAndUpdate({ paymentId: merchantRef }, { status: "paid", amountPaid: amount });
    } else if (merchantRef.startsWith("RENTAL-")) {
      await TruckRental.findOneAndUpdate({ rentalId: merchantRef }, { status: "Confirmed", paymentStatus: "paid" });
    }

    // Send confirmation email
    const customerEmail = payload.Customer as string;
    if (customerEmail) {
      const user = await User.findOne({ email: customerEmail.toLowerCase() }).lean();
      sendPaymentConfirmed(customerEmail, {
        name:      (user as any)?.name ?? customerEmail,
        amount:    `₦${Number(amount).toLocaleString("en-NG")}`,
        reference: merchantRef,
        type:      "Payment",
      }).catch(() => null);
    }
  } catch (err) {
    console.error("[globalpay-webhook] DB error:", err);
    return res.status(200).json({ ResponseCode: "99", ResponseDescription: "Server error", Status: false });
  }

  return res.status(200).json({
    ResponseCode: "00",
    ResponseDescription: "Request was successful",
    Status: true,
  });
}
