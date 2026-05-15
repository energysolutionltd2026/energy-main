/**
 * POST /api/auth/login
 *
 * Authenticates a user (all roles including station managers).
 * Returns a JWT in both the response body and an HTTP-only cookie.
 *
 * Body: { email, password }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { StationManager } from "@/lib/models/StationManager";
import { Session } from "@/lib/models/Session";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();

  // ── 1. Check regular users ─────────────────────────────────────────────────
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (!user.passwordHash) {
      // Demo/mock user with no hash — reject with helpful message
      return res.status(401).json({ error: "This account uses demo credentials and cannot log in via API" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    if (user.status === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended. Contact support." });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      userEmail: user.email,
      userId: user._id,
      token: "pending",
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

    await Promise.all([
      Session.findByIdAndUpdate(session._id, { token }),
      User.findByIdAndUpdate(user._id, { lastLogin: new Date() }),
    ]);

    setTokenCookie(res, token);

    return res.status(200).json({
      token,
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        companyName: user.companyName,
        dealerCode: user.dealerCode,
      },
    });
  }

  // ── 2. Check station managers ──────────────────────────────────────────────
  const sm = await StationManager.findOne({ email: normalizedEmail });

  if (sm) {
    const valid = await bcrypt.compare(password, sm.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    if (sm.status === "Blocked") {
      return res.status(403).json({ error: "Your account has been blocked. Contact your administrator." });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      userEmail: sm.email,
      userId: sm._id,
      token: "pending",
      role: "station_manager" as any,
      ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      expiresAt,
      isValid: true,
    });

    const token = signToken({
      userId: String(sm._id),
      email: sm.email,
      role: "station_manager" as any,
      sessionId: String(session._id),
    });

    await Promise.all([
      Session.findByIdAndUpdate(session._id, { token }),
      StationManager.findByIdAndUpdate(sm._id, { lastLogin: new Date() }),
    ]);

    setTokenCookie(res, token);

    return res.status(200).json({
      token,
      user: {
        _id: String(sm._id),
        name: sm.name,
        email: sm.email,
        role: "station_manager",
        depot: sm.depot,
        status: sm.status,
      },
    });
  }

  return res.status(401).json({ error: "Invalid email or password" });
}
