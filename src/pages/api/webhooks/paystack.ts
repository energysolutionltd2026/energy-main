/**
 * POST /api/webhooks/paystack
 *
 * Verifies the Paystack HMAC-SHA512 signature, then handles:
 *   charge.success → marks transaction Completed, sends payment confirmation email
 *
 * Set PAYSTACK_SECRET_KEY in environment (same key used for the API).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { UnionDues } from "@/lib/models/UnionDues";
import { User } from "@/lib/models/User";
import { sendPaymentConfirmed } from "@/lib/email";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[paystack-webhook] PAYSTACK_SECRET_KEY not set — rejecting request");
    return false;
  }
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-paystack-signature"] as string;

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (payload.event !== "charge.success") {
    return res.status(200).json({ received: true });
  }

  const data = payload.data;
  const reference: string = data?.reference ?? "";
  const amountKobo: number = data?.amount ?? 0;
  const amountNaira = amountKobo / 100;
  const customerEmail: string = data?.customer?.email ?? "";
  const meta: Record<string, string> = data?.metadata ?? {};
  const paymentType: string = meta.type ?? "Payment";

  await connectDB();

  const [txn, user] = await Promise.all([
    Transaction.findOne({ reference }),
    User.findOne({ email: customerEmail }).lean(),
  ]);

  if (txn) {
    await Transaction.findByIdAndUpdate(txn._id, { status: "completed", totalAmount: amountNaira });
  } else {
    // Payment succeeded but no pre-created transaction — create one now
    await Transaction.create({
      txnId:         `TXN-PS-${reference.slice(-8).toUpperCase()}`,
      type:          meta.type === "union_dues" ? "union_dues" : "purchase_order",
      user:          customerEmail,
      userEmail:     customerEmail,
      userRole:      "customer",
      totalAmount:   amountNaira,
      status:        "completed",
      paymentMethod: "card",
      reference,
      referenceType: meta.type === "union_dues" ? "union_dues" : "purchase_order",
    });
  }

  if (meta.type === "union_dues") {
    await UnionDues.findOneAndUpdate(
      { paymentId: reference },
      { status: "paid", amountPaid: amountNaira }
    );
  }

  if (user && customerEmail) {
    sendPaymentConfirmed(customerEmail, {
      name: (user as any).name ?? customerEmail,
      amount: `₦${amountNaira.toLocaleString("en-NG")}`,
      reference,
      type: paymentType,
    }).catch(() => null);
  }

  return res.status(200).json({ received: true });
}
