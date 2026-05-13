import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { Depot } from "@/lib/models/Depot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();

  const result = await Depot.updateMany({}, {
    $set: {
      "PMS.capacityLitres": 2000000,
      "PMS.currentLitres":  2000000,
      "PMS.level":          100,
      "AGO.capacityLitres": 2000000,
      "AGO.currentLitres":  2000000,
      "AGO.level":          100,
      "ATK.capacityLitres": 2000000,
      "ATK.currentLitres":  2000000,
      "ATK.level":          100,
    },
  });

  res.status(200).json({ ok: true, depots_updated: result.modifiedCount });
}
