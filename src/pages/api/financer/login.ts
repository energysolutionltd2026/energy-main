/**
 * POST /api/financer/login
 *
 * Dedicated login for financer accounts (separate from /api/auth/login).
 * Financers are their own account type — they have no customer/dealer role and
 * can only reach the read-only financer overview dashboard.
 *
 * Body: { email, password }
 * On success: issues the same platform JWT (role: "financer") as an HTTP-only
 * cookie so the existing session machinery (getSessionUser, logout) works.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Financer } from "@/lib/models/Financer";
import { User } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { signToken, setTokenCookie } from "@/lib/auth";

// Server-side brute-force protection: max 10 attempts per IP per 15 minutes.
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
  return entry.count <= RATE_MAX;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Never cache an auth response.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

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

  // Resolve the identity that is allowed to sign in here. Two account types can
  // hold financer access (mirroring the overview dashboard gate):
  //   1. A dedicated Financer account, or
  //   2. A normal User that an admin converted with the `financerAccess` flag.
  // We try the dedicated account first, then fall back to a flagged user.
  let account: {
    id: string;
    name?: string;
    email: string;
    passwordHash?: string | null;
    suspended: boolean;
  } | null = null;

  const financer = await Financer.findOne({ email: normalizedEmail });
  if (financer) {
    account = {
      id: String(financer._id),
      name: financer.name,
      email: financer.email,
      passwordHash: financer.passwordHash,
      suspended: financer.status === "suspended",
    };
  } else {
    const user = await User.findOne({ email: normalizedEmail });
    if (user && user.financerAccess) {
      account = {
        id: String(user._id),
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        suspended: user.status === "suspended",
      };
    }
  }

  // Generic message either way — never reveal whether the account exists.
  if (!account || !account.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  if (account.suspended) {
    return res.status(403).json({ error: "Your account has been suspended. Contact the administrator." });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await Session.create({
    userEmail: account.email,
    userId: account.id,
    token: "pending",
    role: "financer",
    ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
    expiresAt,
    isValid: true,
  });

  const token = signToken({
    userId: account.id,
    email: account.email,
    role: "financer",
    sessionId: String(session._id),
  });

  await Promise.all([
    Session.findByIdAndUpdate(session._id, { token }),
    financer
      ? Financer.findByIdAndUpdate(account.id, { lastLogin: new Date() })
      : User.findByIdAndUpdate(account.id, { lastLogin: new Date() }),
  ]);

  setTokenCookie(res, token);

  return res.status(200).json({
    token,
    user: {
      _id: account.id,
      name: account.name,
      email: account.email,
      role: "financer",
    },
  });
}
