/**
 * POST /api/auth/verify-email
 *
 * Verifies a 6-digit OTP sent to the user's email after signup.
 * On success: sets emailVerified = true.
 * Locks after 5 failed attempts to prevent brute-force.
 *
 * Body: { email, code }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

const MAX_ATTEMPTS = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) {
    return res.status(400).json({ error: "email and code are required" });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Code must be 6 digits" });
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.emailVerified) {
    return res.status(200).json({ ok: true, message: "Email already verified" });
  }

  if ((user.emailVerifyAttempts ?? 0) >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts — request a new verification code" });
  }

  const isExpired = user.emailVerifyExp && new Date(user.emailVerifyExp) < new Date();
  if (isExpired) {
    return res.status(400).json({ error: "Verification code has expired" });
  }

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const isMatch = user.emailVerifyCode && user.emailVerifyCode === codeHash;

  if (!isMatch) {
    await User.findByIdAndUpdate(user._id, { $inc: { emailVerifyAttempts: 1 } });
    return res.status(400).json({ error: "Invalid code" });
  }

  await User.findByIdAndUpdate(user._id, {
    emailVerified: true,
    $unset: { emailVerifyCode: 1, emailVerifyExp: 1, emailVerifyAttempts: 1 },
  });

  return res.status(200).json({ ok: true, message: "Email verified successfully" });
}
