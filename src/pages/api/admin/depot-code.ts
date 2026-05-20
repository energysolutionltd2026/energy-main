import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser } from "@/lib/auth";

const DEPOT_CODE_WINDOW = 6 * 60 * 60 * 1000;
const DEPOT_CODE_TTL    = 3 * 60 * 60 * 1000;

function generateDepotCode(windowIndex: number): string {
  const secret = process.env.DEPOT_CODE_SECRET;
  if (!secret) throw new Error("DEPOT_CODE_SECRET env var is not set");
  const seed = `${secret}-${windowIndex}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h, 33) ^ seed.charCodeAt(i);
  }
  return "DC-" + (Math.abs(h) >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const now = Date.now();
  const windowIndex = Math.floor(now / DEPOT_CODE_WINDOW);

  // GET — return current code and timing
  if (req.method === "GET") {
    const code = generateDepotCode(windowIndex);
    const nextWindow = (windowIndex + 1) * DEPOT_CODE_WINDOW;
    const expiresAt = now + DEPOT_CODE_TTL;
    return res.status(200).json({ code, expiresAt, nextRefreshAt: nextWindow });
  }

  // POST — validate a submitted code
  if (req.method === "POST") {
    const { code } = req.body as { code?: string };
    if (!code) return res.status(400).json({ error: "code is required" });
    const valid = code.trim() === generateDepotCode(windowIndex);
    return res.status(200).json({ valid });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
