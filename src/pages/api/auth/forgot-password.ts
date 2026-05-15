/**
 * POST /api/auth/forgot-password
 *
 * Generates a password reset token and (stubbed) sends it to the user's email.
 * Always returns 200 even if email not found — prevents email enumeration.
 *
 * Body: { email }
 *
 * In production: send the reset link via Resend/Postmark/SendGrid.
 * The link format: https://your-app/auth/reset-password?token=<token>
 */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { StationManager } from "@/lib/models/StationManager";
import { sendResetPassword } from "@/lib/email";
import { sendSms } from "@/lib/sms";

const RESET_TTL_MINUTES = 30;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "email is required" });

  // Always respond 200 — don't reveal if the email exists
  const ok = { ok: true, message: "If that email is registered, a reset link has been sent." };

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const exp = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

  // Check regular users first, then station managers
  const user = await User.findOne({ email: normalizedEmail });
  if (user) {
    await User.findByIdAndUpdate(user._id, { resetToken: tokenHash, resetTokenExp: exp });
    await sendResetPassword(user.email, user.name, resetUrl).catch(() => null);
    if (user.phone) {
      sendSms(user.phone, `e-Nergy: Reset your password here: ${resetUrl} (expires in ${RESET_TTL_MINUTES} mins)`).catch(() => null);
    }
    return res.status(200).json(ok);
  }

  const sm = await StationManager.findOne({ email: normalizedEmail });
  if (sm) {
    await StationManager.findByIdAndUpdate(sm._id, { resetToken: tokenHash, resetTokenExp: exp });
    await sendResetPassword(sm.email, sm.name, resetUrl).catch(() => null);
    if (sm.phone) {
      sendSms(sm.phone, `e-Nergy: Reset your password here: ${resetUrl} (expires in ${RESET_TTL_MINUTES} mins)`).catch(() => null);
    }
  }

  return res.status(200).json(ok);
}
