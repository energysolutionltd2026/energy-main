/**
 * PATCH  /api/financer/accounts/[id]  — update a financer (status / password), admin only
 * DELETE /api/financer/accounts/[id]  — delete a financer account, admin only
 *
 * Revoking (delete) or suspending also invalidates the financer's active
 * sessions so access is cut immediately, not at token expiry.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Financer } from "@/lib/models/Financer";
import { Session } from "@/lib/models/Session";

async function invalidateSessions(financerId: string) {
  await Session.updateMany({ userId: financerId, role: "financer" }, { isValid: false });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

  await connectDB();

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized — please log in" });
  if (user.role !== "admin") return res.status(403).json({ error: "Forbidden — admin only" });

  const { id } = req.query as { id: string };

  // ── Update: status and/or password ──
  if (req.method === "PATCH" || req.method === "PUT") {
    const { status, password } = (req.body ?? {}) as { status?: string; password?: string };
    const updates: Record<string, unknown> = {};

    if (status !== undefined) {
      if (status !== "active" && status !== "suspended") {
        return res.status(400).json({ error: "status must be 'active' or 'suspended'" });
      }
      updates.status = status;
    }
    if (password !== undefined) {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      updates.passwordHash = await bcrypt.hash(password, 10);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const doc = await Financer.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select("-passwordHash")
      .lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    // Suspending or changing the password kills existing sessions.
    if (updates.status === "suspended" || updates.passwordHash) {
      await invalidateSessions(id);
    }
    return res.status(200).json(doc);
  }

  // ── Delete (revoke) ──
  if (req.method === "DELETE") {
    const doc = await Financer.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    await invalidateSessions(id);
    return res.status(200).json({ deleted: true });
  }

  res.setHeader("Allow", "PATCH, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
