/**
 * GET  /api/financer/accounts   — list financer accounts (admin only)
 * POST /api/financer/accounts   — create a financer account (admin only)
 *
 * Financer logins are a dedicated account type, managed exclusively by an admin.
 * Capacity is MAX_FINANCER_ACCOUNTS (high default, env-configurable) so many
 * banks can be onboarded.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Financer } from "@/lib/models/Financer";
import { Session } from "@/lib/models/Session";

// Maximum number of dedicated bank (financer) accounts. Set high by default so
// many banks can be onboarded, and overridable via the MAX_FINANCER_ACCOUNTS
// env var without a code change. Creation is admin-only regardless.
export const MAX_FINANCER_ACCOUNTS = Math.max(1, Number(process.env.MAX_FINANCER_ACCOUNTS) || 100);

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
    const { name, email, password, shortCode, logoUrl, contactName, contactPhone, address } =
      (req.body ?? {}) as {
        name?: string; email?: string; password?: string;
        shortCode?: string; logoUrl?: string;
        contactName?: string; contactPhone?: string; address?: string;
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
        // Optional profile fields — only store non-empty values.
        ...(shortCode?.trim()    ? { shortCode: shortCode.trim() }       : {}),
        ...(logoUrl?.trim()      ? { logoUrl: logoUrl.trim() }           : {}),
        ...(contactName?.trim()  ? { contactName: contactName.trim() }   : {}),
        ...(contactPhone?.trim() ? { contactPhone: contactPhone.trim() } : {}),
        ...(address?.trim()      ? { address: address.trim() }           : {}),
        status: "active",
        createdBy: user.email,
      });
      // "Financer only": if this email previously belonged to a customer /
      // bulk_dealer (or any other account), that identity is superseded. Kill
      // every existing session for the email so they're logged out of their old
      // role immediately and must sign back in as a financer.
      await Session.updateMany(
        { userEmail: normalizedEmail, isValid: true },
        { isValid: false }
      );

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
