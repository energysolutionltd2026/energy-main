import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Truck } from "@/lib/models/Truck";
import { notifyAdmins } from "@/lib/notifyAdmins";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Unauthorized — please log in" });

  const allowedRoles = ["admin", "truck_owner"];
  if (!allowedRoles.includes(session.role)) {
    return res.status(403).json({ error: "Forbidden — insufficient role" });
  }

  // GET: list with filters
  if (req.method === "GET") {
    try {
      const filterFields = ["status", "ownerEmail"];
      const filter: Record<string, unknown> = {};
      for (const field of filterFields) {
        if (req.query[field]) filter[field] = req.query[field];
      }
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100,  parseInt(req.query.limit as string) || 100);
      const skip  = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        Truck.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
        Truck.countDocuments(filter),
      ]);
      return res.status(200).json({ data: docs, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch records" });
    }
  }

  // POST: create + admin notification
  if (req.method === "POST") {
    try {
      const doc = await Truck.create(req.body);

      const regNum = req.body.truckRegNumber ?? "N/A";
      const owner  = req.body.ownerName ?? req.body.ownerEmail ?? "Unknown";
      notifyAdmins(
        "New Truck Registration",
        `${owner} submitted truck ${regNum} for review. Pending approval.`,
        String(doc._id)
      ).catch(() => null);

      return res.status(201).json(doc);
    } catch (err: unknown) {
      console.error("[Truck] POST error:", err);
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "Duplicate record — a unique field already exists" });
      }
      return res.status(400).json({ error: (err as Error).message ?? "Validation error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
