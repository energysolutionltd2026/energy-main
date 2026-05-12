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

  return res.status(405).json({ error: "Method not allowed" });
}
