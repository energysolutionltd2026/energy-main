import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { Depot } from "@/lib/models/Depot";
import { getSessionUser } from "@/lib/auth";

// GET is public (home page needs depots without auth)
// POST requires auth
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    try {
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const docs = await Depot.find({}).sort({ name: 1 }).limit(limit).lean();
      return res.status(200).json({ data: docs, total: docs.length, page: 1, pages: 1 });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? "Server error" });
    }
  }

  // All write operations still require auth
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized — please log in" });

  if (req.method === "POST") {
    try {
      const { name, location, logo, PMS, AGO, ATK } = req.body ?? {};
      if (!name?.trim() || !location?.trim()) {
        return res.status(400).json({ error: "name and location are required" });
      }
      const parsePrice = (p: any): number => {
        if (typeof p === "number") return p;
        const n = parseInt(String(p ?? "0").replace(/[^0-9]/g, ""));
        return isNaN(n) ? 0 : n;
      };
      const buildProduct = (p: any, defaultPrice: number) => {
        const lvl = Number(p?.level ?? 0);
        return {
          level: lvl,
          price: parsePrice(p?.price ?? defaultPrice),
          status: (p?.status as string) || (lvl < 20 ? "Unavailable" : lvl < 40 ? "Limited" : "Available"),
        };
      };
      const doc = await Depot.create({
        name: name.trim(),
        location: location.trim(),
        state: location.trim(),
        ...(logo ? { logo } : {}),
        PMS: buildProduct(PMS, 1300),
        AGO: buildProduct(AGO, 1900),
        ATK: buildProduct(ATK, 1300),
      });
      return res.status(201).json(doc);
    } catch (err: any) {
      if (err?.code === 11000) return res.status(409).json({ error: "A depot with this name already exists" });
      return res.status(400).json({ error: err?.message ?? "Failed to create depot" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
