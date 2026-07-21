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
import { Financer } from "@/lib/models/Financer";
import { Session } from "@/lib/models/Session";
import { signToken, setTokenCookie } from "@/lib/auth";

// Server-side brute-force protection: max 10 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_MAX) return false;
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();

  // ── 0. Financer accounts take precedence ───────────────────────────────────
  // A financer is a "financer only" identity: once an admin creates a financer
  // account for an email, that person can ONLY log in as a financer — even if a
  // legacy customer/bulk_dealer User record with the same email still exists.
  // We therefore check (and fully resolve) the Financer collection BEFORE the
  // User collection and never fall through to the old role.
  const financer = await Financer.findOne({ email: normalizedEmail });

  if (financer) {
    if (!financer.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, financer.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    if (financer.status === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended. Contact the administrator." });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      userEmail: financer.email,
      userId: financer._id,
      token: "pending",
      role: "financer",
      ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      expiresAt,
      isValid: true,
    });

    const token = signToken({
      userId: String(financer._id),
      email: financer.email,
      role: "financer" as any,
      sessionId: String(session._id),
    });

    await Promise.all([
      Session.findByIdAndUpdate(session._id, { token }),
      Financer.findByIdAndUpdate(financer._id, { lastLogin: new Date() }),
    ]);

    setTokenCookie(res, token);

    return res.status(200).json({
      token,
      user: {
        _id: String(financer._id),
        name: financer.name,
        email: financer.email,
        role: "financer",
      },
    });
  }

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

    // A normal User an admin converted with the `financerAccess` flag is a
    // financer-only identity — mirror the dedicated /api/financer/login and the
    // overview dashboard gate by signing them in as "financer" here too, so the
    // general login routes them to the bank view rather than their legacy role.
    const effectiveRole = user.financerAccess ? "financer" : user.role;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      userEmail: user.email,
      userId: user._id,
      token: "pending",
      role: effectiveRole,
      ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      expiresAt,
      isValid: true,
    });

    const token = signToken({
      userId: String(user._id),
      email: user.email,
      role: effectiveRole as any,
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
        role: effectiveRole,
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

    if (sm.status === "blocked") {
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
