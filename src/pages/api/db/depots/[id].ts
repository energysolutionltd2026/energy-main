import type { NextApiRequest, NextApiResponse } from "next";
import { Depot } from "@/lib/models/Depot";
import { documentHandler } from "@/lib/crud";
import { invalidateDepotsCache } from "@/lib/cached-queries";

// Small wrapper around documentHandler so we can invalidate cache on writes
const baseHandler = documentHandler(Depot, {
  immutableFields: ["_id", "__v", "name", "coordinates"],
  allowedRoles: ["admin", "station_manager"],
  // Station managers may adjust stock levels, but only an admin may change a
  // tank's max capacity. These are the exact (dotted) keys the homepage admin
  // editor sends; they're stripped from any non-admin PUT so a crafted request
  // can't resize a tank.
  adminOnlyFields: [
    "capacityLitres",
    "PMS.capacityLitres",
    "AGO.capacityLitres",
    "ATK.capacityLitres",
  ],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Call the generic handler first
  const originalJson = res.json.bind(res);

  // Intercept response to know if operation succeeded on mutating methods
  (res as any).json = (body: any) => {
    if (req.method === "PUT" || req.method === "DELETE") {
      // Invalidate depots cache so subsequent GET /api/db/depots is fresh
      invalidateDepotsCache();
    }
    return originalJson(body);
  };

  return baseHandler(req, res);
}
