import type { NextApiRequest, NextApiResponse } from "next";
import { Depot } from "@/lib/models/Depot";
import { documentHandler } from "@/lib/crud";
import { invalidateDepotsCache } from "@/lib/cached-queries";

// Small wrapper around documentHandler so we can invalidate cache on writes
const baseHandler = documentHandler(Depot, {
  immutableFields: ["_id", "__v", "name", "coordinates"],
  allowedRoles: ["admin", "station_manager"],
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
