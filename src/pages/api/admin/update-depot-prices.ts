import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { Depot } from "@/lib/models/Depot";
import { getSessionUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { pms, ago, atk } = req.body ?? {};
  if (!pms && !ago && !atk) return res.status(400).json({ error: "No prices provided" });

  await connectDB();

  const update: Record<string, number> = {};
  if (pms) update["PMS.price"] = Number(pms);
  if (ago) update["AGO.price"] = Number(ago);
  if (atk) update["ATK.price"] = Number(atk);

  const result = await Depot.updateMany({}, { $set: update });
  res.status(200).json({ ok: true, updated: result.modifiedCount });
}
