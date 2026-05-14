/**
 * GET  /api/db/platform-settings  — returns the single global settings document
 * PUT  /api/db/platform-settings  — updates (merges) the global settings document
 *
 * This is NOT a standard collectionHandler because platform settings
 * is a single document keyed by { settingsKey: "global" }.
 *
 * Sensitive fields (apiKey, depotCodeSecret, paystackPublicKey) are
 * stripped from GET responses via the model's toJSON transform.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { getSessionUser } from "@/lib/auth";

const IMMUTABLE = ["_id", "__v", "settingsKey", "createdAt", "apiKey", "depotCodeSecret"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    const settings = await PlatformSettings.findOne({ settingsKey: "global" }).lean();
    if (!settings) {
      // Auto-create with defaults on first access
      const created = await PlatformSettings.create({ settingsKey: "global" });
      return res.status(200).json(created);
    }
    return res.status(200).json(settings);
  }

  if (req.method === "PUT") {
    const user = await getSessionUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const updates = { ...req.body };
    for (const field of IMMUTABLE) delete updates[field];

    const settings = await PlatformSettings.findOneAndUpdate(
      { settingsKey: "global" },
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    );
    return res.status(200).json(settings);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
