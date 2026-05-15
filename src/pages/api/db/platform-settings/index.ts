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
import { PriceHistory } from "@/lib/models/PriceHistory";
import { getSessionUser } from "@/lib/auth";

const PRICE_FIELDS = ["pmsPricePerLitre", "atkPricePerLitre", "agoPricePerLitre", "lgpPricePerLitre"] as const;

async function savePriceSnapshot(settings: any) {
  const now = new Date();
  const month = now.toLocaleString("en-NG", { month: "long", year: "numeric" });
  const monthShort = now.toLocaleString("en-NG", { month: "short" });
  await PriceHistory.findOneAndUpdate(
    { month },
    {
      month,
      monthShort,
      pms: settings.pmsPricePerLitre ?? 0,
      atk: settings.atkPricePerLitre ?? 0,
      ago: settings.agoPricePerLitre ?? 0,
      lgp: settings.lgpPricePerLitre ?? 0,
      recordedAt: now,
    },
    { upsert: true }
  );
}

const IMMUTABLE = ["_id", "__v", "settingsKey", "createdAt", "apiKey", "depotCodeSecret"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === "GET") {
    const settings = await PlatformSettings.findOne({ settingsKey: "global" }).lean() as any;
    if (!settings) {
      const created = await PlatformSettings.create({ settingsKey: "global" });
      const safe = created.toObject();
      delete safe.apiKey;
      delete safe.depotCodeSecret;
      delete safe.paystackSecretKey;
      return res.status(200).json(safe);
    }
    delete settings.apiKey;
    delete settings.depotCodeSecret;
    delete settings.paystackSecretKey;
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
    const safe = settings?.toObject() as any;
    if (safe) {
      delete safe.apiKey;
      delete safe.depotCodeSecret;
      delete safe.paystackSecretKey;
    }

    const hasPriceUpdate = PRICE_FIELDS.some(f => updates[f] !== undefined);
    if (hasPriceUpdate && safe) {
      savePriceSnapshot(safe).catch(() => null);
    }

    return res.status(200).json(safe ?? {});
  }

  return res.status(405).json({ error: "Method not allowed" });
}
