import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { Transaction } from "@/lib/models/Transaction";
import { notifyAdmins } from "@/lib/notifyAdmins";
import { initiatePayment } from "@/lib/globalpay";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Unauthorized — please log in" });

  const allowedRoles = ["admin", "bulk_dealer"];
  if (!allowedRoles.includes(session.role)) {
    return res.status(403).json({ error: "Forbidden — insufficient role" });
  }

  // GET: list with filters
  if (req.method === "GET") {
    try {
      const filterFields = ["status", "depot", "dealer", "orderId"];
      const filter: Record<string, unknown> = {};
      for (const field of filterFields) {
        if (req.query[field]) filter[field] = req.query[field];
      }
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100,  parseInt(req.query.limit as string) || 100);
      const skip  = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        PurchaseOrder.countDocuments(filter),
      ]);
      return res.status(200).json({ data: docs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch records" });
    }
  }

  // POST: create + admin notification
  if (req.method === "POST") {
    try {
      const doc = await PurchaseOrder.create(req.body);

      const company  = req.body.companyName ?? "Unknown";
      const product  = req.body.productType ?? "N/A";
      const quantity = req.body.productQuantity ?? "N/A";
      const depot    = req.body.loadingDepot ?? "N/A";
      notifyAdmins(
        "New Purchase Order",
        `${company} placed an order for ${quantity}L of ${product} from ${depot} depot.`,
        String(doc._id)
      ).catch(() => null);

      // Create pending Transaction
      const ref = doc.orderId ?? `BUY-${Date.now()}`;
      await Transaction.create({
        txnId:         `TXN-${ref}`,
        type:          "purchase_order",
        user:          session.email,
        userEmail:     session.email,
        userRole:      session.role as "customer" | "bulk_dealer",
        product:       req.body.productType,
        quantity:      String(req.body.productQuantity ?? ""),
        totalAmount:   req.body.totalAmount ?? 0,
        status:        "pending",
        paymentMethod: "card",
        reference:     ref,
        referenceType: "purchase_order",
        referenceId:   doc._id,
      });

      // Initiate GlobalPay checkout
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const gp = await initiatePayment({
        amount:                      req.body.totalAmount ?? 0,
        merchantTransactionReference: ref,
        redirectUrl:                 `${appUrl}/customer/transaction-status?ref=${ref}`,
        customer: {
          name:  req.body.directorName ?? company,
          email: req.body.email ?? session.email,
          phone: req.body.telephone,
        },
      });

      return res.status(201).json({ ...doc.toObject(), checkoutUrl: gp.checkoutUrl });
    } catch (err: unknown) {
      console.error("[PurchaseOrder] POST error:", err);
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "Duplicate record — a unique field already exists" });
      }
      return res.status(400).json({ error: (err as Error).message ?? "Validation error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
