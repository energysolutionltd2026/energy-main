/**
 * GET  /api/financer/accounts   — list financer accounts (admin only)
 * POST /api/financer/accounts   — create a financer account (admin only)
 *
 * Financer logins are a dedicated account type, managed exclusively by an admin
 * and hard-capped at MAX_FINANCER_ACCOUNTS.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Financer } from "@/lib/models/Financer";

export const MAX_FINANCER_ACCOUNTS = 2;

const SAFE_PROJECTION = "-passwordHash";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

  await connectDB();

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized — please log in" });
  if (user.role !== "admin") return res.status(403).json({ error: "Forbidden — admin only" });

  // ── List ──
  if (req.method === "GET") {
    const docs = await Financer.find({}).select(SAFE_PROJECTION).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: docs, total: docs.length, max: MAX_FINANCER_ACCOUNTS });
  }

  // ── Create ──
  if (req.method === "POST") {
    const { name, email, password } = (req.body ?? {}) as {
      name?: string; email?: string; password?: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce the hard cap.
    const count = await Financer.countDocuments({});
    if (count >= MAX_FINANCER_ACCOUNTS) {
      return res.status(409).json({
        error: `Financer accounts are limited to ${MAX_FINANCER_ACCOUNTS}. Delete an existing account first.`,
      });
    }

    // Reject duplicates (also guarded by the unique index).
    const existing = await Financer.findOne({ email: normalizedEmail }).select("_id").lean();
    if (existing) {
      return res.status(409).json({ error: "A financer account with that email already exists" });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const doc = await Financer.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        status: "active",
        createdBy: user.email,
      });
      const { passwordHash: _omit, ...safe } = doc.toObject();
      return res.status(201).json(safe);
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "A financer account with that email already exists" });
      }
      return res.status(400).json({ error: (err as Error).message ?? "Failed to create account" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
