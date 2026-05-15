import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { SupplyRequest } from "@/lib/models/SupplyRequest";
import { sendSms } from "@/lib/sms";
import { User } from "@/lib/models/User";
import { notifyAdmins } from "@/lib/notifyAdmins";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Unauthorized — please log in" });

  // GET: list with filters
  if (req.method === "GET") {
    try {
      const filterFields = ["status", "product", "priority", "requestedBy", "depot"];
      const filter: Record<string, unknown> = {};
      for (const field of filterFields) {
        if (req.query[field]) filter[field] = req.query[field];
      }
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100,  parseInt(req.query.limit as string) || 100);
      const skip  = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        SupplyRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SupplyRequest.countDocuments(filter),
      ]);
      return res.status(200).json({ data: docs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch records" });
    }
  }

  // POST: create + SMS confirmation
  if (req.method === "POST") {
    try {
      const doc = await SupplyRequest.create(req.body);

      // SMS to requester
      const requestedBy = req.body.requestedBy as string | undefined;
      if (requestedBy) {
        const user = await User.findOne({ email: requestedBy.toLowerCase().trim() }).lean();
        if (user?.phone) {
          const requestId = doc.requestId ?? String(doc._id).slice(-6).toUpperCase();
          const product   = req.body.product ?? "N/A";
          const quantity  = req.body.quantity ?? "N/A";
          const priority  = req.body.priority ?? "normal";
          sendSms(
            user.phone,
            `e-Nergy: Supply request submitted! Request ID: ${requestId}. ${product} - ${quantity}L (${priority} priority). We will notify you of updates.`
          ).catch(() => null);
        }
      }

      const requestId = doc.requestId ?? String(doc._id).slice(-6).toUpperCase();
      const product   = req.body.product ?? "N/A";
      const quantity  = req.body.quantity ?? "N/A";
      const priority  = req.body.priority ?? "normal";
      const station   = req.body.stationName ?? req.body.requestedBy ?? "Unknown";
      notifyAdmins(
        "New Supply Request",
        `${station} requested ${quantity}L of ${product} (${priority} priority). Request ID: ${requestId}.`,
        String(doc._id)
      ).catch(() => null);

      return res.status(201).json(doc);
    } catch (err: unknown) {
      console.error("[SupplyRequest] POST error:", err);
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "Duplicate record — a unique field already exists" });
      }
      return res.status(400).json({ error: (err as Error).message ?? "Validation error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
