import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { UnionDues } from "@/lib/models/UnionDues";
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
    if (session.role !== "admin") return res.status(403).json({ error: "Forbidden — insufficient role" });
    try {
      const filterFields = ["userEmail", "userRole", "status", "duesPeriod"];
      const filter: Record<string, unknown> = {};
      for (const field of filterFields) {
        if (req.query[field]) filter[field] = req.query[field];
      }
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100,  parseInt(req.query.limit as string) || 100);
      const skip  = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        UnionDues.find(filter).sort({ periodStart: -1 }).skip(skip).limit(limit).lean(),
        UnionDues.countDocuments(filter),
      ]);
      return res.status(200).json({ data: docs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch records" });
    }
  }

  // POST: create + SMS confirmation
  if (req.method === "POST") {
    try {
      const doc = await UnionDues.create(req.body);

      // Send SMS to payer
      const userEmail = req.body.userEmail as string | undefined;
      if (userEmail) {
        const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).lean();
        if (user?.phone) {
          const amount = req.body.amountPaid ?? req.body.amountDue ?? 0;
          const paymentId = doc.paymentId ?? String(doc._id).slice(-6).toUpperCase();
          sendSms(
            user.phone,
            `e-Nergy: Union dues payment received! Amount: ₦${Number(amount).toLocaleString()}. Payment ID: ${paymentId}. Thank you.`
          ).catch(() => null);
        }
      }

      // Create pending Transaction
      const ref = doc.paymentId ?? `DUES-${Date.now()}`;
      await Transaction.create({
        txnId:         `TXN-${ref}`,
        type:          "union_dues",
        user:          req.body.fullName ?? session.email,
        userEmail:     session.email,
        userRole:      "customer",
        totalAmount:   req.body.amountDue ?? 0,
        status:        "pending",
        paymentMethod: "card",
        reference:     ref,
        referenceType: "union_dues",
        referenceId:   doc._id,
      });

      // Initiate GlobalPay checkout
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const gp = await initiatePayment({
        amount:                      req.body.amountDue ?? 0,
        merchantTransactionReference: ref,
        redirectUrl:                 `${appUrl}/customer/transaction-status?ref=${ref}`,
        customer: {
          name:  req.body.fullName ?? session.email,
          email: req.body.userEmail ?? session.email,
          phone: req.body.telephone,
        },
      });

      return res.status(201).json({ ...doc.toObject(), checkoutUrl: gp.checkoutUrl });
    } catch (err: unknown) {
      console.error("[UnionDues] POST error:", err);
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "Duplicate record — a unique field already exists" });
      }
      return res.status(400).json({ error: (err as Error).message ?? "Validation error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
