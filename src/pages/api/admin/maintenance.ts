import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/lib/db";
import { Depot } from "@/lib/models/Depot";
import { Notification } from "@/lib/models/Notification";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { action } = req.body ?? {};
  await connectDB();

  if (action === "clear_notifications") {
    const result = await Notification.deleteMany({});
    return res.status(200).json({ ok: true, deleted: result.deletedCount });
  }

  if (action === "clear_transactions") {
    const result = await Transaction.deleteMany({});
    return res.status(200).json({ ok: true, deleted: result.deletedCount });
  }

  if (action === "reset_stock") {
    // Set currentLitres = capacityLitres for all depots and all products
    const result = await Depot.updateMany({}, [
      {
        $set: {
          "PMS.currentLitres": "$PMS.capacityLitres",
          "AGO.currentLitres": "$AGO.capacityLitres",
          "ATK.currentLitres": "$ATK.capacityLitres",
        },
      },
    ]);
    return res.status(200).json({ ok: true, updated: result.modifiedCount });
  }

  if (action === "clear_activity") {
    // No dedicated ActivityLog collection — nothing to clear server-side
    return res.status(200).json({ ok: true, deleted: 0 });
  }

  return res.status(400).json({ error: "Unknown action" });
}
