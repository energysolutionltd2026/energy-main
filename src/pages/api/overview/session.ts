/**
 * Read-only Overview dashboard gate.
 *
 * POST   { password }  → verifies against OVERVIEW_PASSWORD, sets a signed
 *                        HTTP-only cookie (`overview_session`, scope=overview).
 * DELETE               → clears the cookie (logout).
 *
 * The password never reaches the client bundle. The cookie is HTTP-only so it
 * is not readable by JS (XSS-safe) and is signed with JWT_SECRET so it cannot
 * be forged. A small in-memory rate limiter slows brute-force attempts.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const OVERVIEW_PASSWORD = process.env.OVERVIEW_PASSWORD || "energy2026"; // demo default
const COOKIE = "overview_session";
const TTL_HOURS = 8;
const PROD = process.env.NODE_ENV === "production";

// Per-IP rate limit (resets on redeploy — fine for a demo gate)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; ts: number }>();

function ipOf(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const ip = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return (ip || req.socket.remoteAddress || "unknown").trim();
}

function cookie(value: string, maxAge: number): string {
  return `${COOKIE}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${PROD ? "; Secure" : ""}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", cookie("", 0));
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Server not configured (JWT_SECRET missing)" });
  }

  const ip = ipOf(req);
  const now = Date.now();
  const rec = attempts.get(ip);
  const windowed = rec && now - rec.ts < WINDOW_MS ? rec : null;
  if (windowed && windowed.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts — try again later." });
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!timingSafeEqual(password, OVERVIEW_PASSWORD)) {
    attempts.set(ip, { count: (windowed?.count ?? 0) + 1, ts: now });
    return res.status(401).json({ error: "Invalid password" });
  }

  attempts.delete(ip);
  const token = jwt.sign({ scope: "overview" }, JWT_SECRET, { expiresIn: `${TTL_HOURS}h` });
  res.setHeader("Set-Cookie", cookie(token, TTL_HOURS * 3600));
  return res.status(200).json({ ok: true });
}
