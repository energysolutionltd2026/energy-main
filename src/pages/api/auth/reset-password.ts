/**
 * POST /api/auth/reset-password
 *
 * Consumes a reset token and sets a new password.
 * Token is single-use — cleared after successful reset.
 *
 * Body: { token, password }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { StationManager } from "@/lib/models/StationManager";
import { Session } from "@/lib/models/Session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    return res.status(400).json({ error: "token and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  await connectDB();

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenFilter = { resetToken: tokenHash, resetTokenExp: { $gt: new Date() } };

  const user = await User.findOne(tokenFilter);
  const sm = !user ? await StationManager.findOne(tokenFilter) : null;

  if (!user && !sm) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const unset = { $unset: { resetToken: 1, resetTokenExp: 1 } };

  if (user) {
    await Promise.all([
      User.findByIdAndUpdate(user._id, { passwordHash, ...unset }),
      Session.updateMany({ userEmail: user.email }, { isValid: false }),
    ]);
  } else if (sm) {
    await Promise.all([
      StationManager.findByIdAndUpdate(sm._id, { passwordHash, ...unset }),
      Session.updateMany({ userEmail: sm.email }, { isValid: false }),
    ]);
  }

  return res.status(200).json({ ok: true, message: "Password reset successfully. Please log in." });
}
