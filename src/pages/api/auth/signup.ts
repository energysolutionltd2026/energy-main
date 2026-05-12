/**
 * POST /api/auth/signup
 *
 * Creates a new user account.
 * - Hashes password with bcryptjs
 * - Creates a Session and returns a JWT
 * - emailVerified starts as false; user must call /api/auth/verify-email
 *
 * Body: { name, email, phone, role, password }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { PlatformSettings } from "@/lib/models/PlatformSettings";
import { signToken, setTokenCookie } from "@/lib/auth";
import { sendVerifyEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, phone, role, password } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    password?: string;
  };

  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: "name, email, role, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (!["customer", "bulk_dealer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role — must be customer or bulk_dealer" });
  }

  await connectDB();

  // Check if registrations are open
  const settings = await PlatformSettings.findOne({ settingsKey: "global" }).lean();
  if (settings && settings.allowNewRegistrations === false) {
    return res.status(403).json({ error: "New registrations are currently closed" });
  }

  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const otpExp = new Date(Date.now() + 30 * 60 * 1000);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim(),
    role,
    passwordHash,
    emailVerified: false,
    emailVerifyCode: otpCode,
    emailVerifyExp: otpExp,
    status: "active",
  });

  // Create session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await Session.create({
    userEmail: user.email,
    userId: user._id,
    token: "pending",           // placeholder — updated after signing
    role: user.role,
    ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
    expiresAt,
    isValid: true,
  });

  const token = signToken({
    userId: String(user._id),
    email: user.email,
    role: user.role as any,
    sessionId: String(session._id),
  });

  await Session.findByIdAndUpdate(session._id, { token });
  setTokenCookie(res, token);

  await sendVerifyEmail(user.email, user.name, otpCode).catch((err) => console.error("[signup] email error:", err));

  return res.status(201).json({
    token,
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      status: user.status,
    },
  });
}
