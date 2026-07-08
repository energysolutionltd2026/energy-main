/**
 * Auth helpers — JWT signing/verification and session management.
 *
 * Tokens are sent as:
 *   - HTTP-only cookie: `token` (for browser clients)
 *   - Authorization: Bearer <token> header (for API clients / Sliplane)
 *
 * Set JWT_SECRET in .env.local (dev) and Sliplane dashboard (prod).
 */
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "./db";
import { Session } from "./models/Session";
import type { UserRole } from "./db-types";

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_TTL_DAYS = 7;

if (!JWT_SECRET) {
  // Warn at startup — don't throw so the build still works without env vars
  console.warn("[auth] JWT_SECRET is not set. Auth routes will fail at runtime.");
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

// ── Token creation ────────────────────────────────────────────────────────────

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: `${TOKEN_TTL_DAYS}d` });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    // Pin the algorithm so a token forged with a different alg (e.g. "none")
    // can never be accepted.
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Token extraction from request ─────────────────────────────────────────────

export function extractToken(req: NextApiRequest): string | null {
  // 1. Authorization header
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  // 2. Cookie
  const cookie = req.cookies?.token;
  if (cookie) return cookie;
  return null;
}

// ── Session validation ────────────────────────────────────────────────────────

export async function getSessionUser(
  req: NextApiRequest
): Promise<JwtPayload | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await connectDB();
  const session = await Session.findById(payload.sessionId).lean();
  if (!session || !session.isValid || new Date(session.expiresAt) < new Date()) {
    return null;
  }

  // Refresh lastActiveAt without blocking the response
  Session.findByIdAndUpdate(payload.sessionId, { lastActiveAt: new Date() }).exec();

  return payload;
}

// ── Route guard helper ────────────────────────────────────────────────────────

export function requireAuth(
  allowedRoles: UserRole[] = []
) {
  return async function guard(
    req: NextApiRequest,
    res: NextApiResponse,
    next: (user: JwtPayload) => Promise<void>
  ) {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized — please log in" });
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden — insufficient role" });
    }
    return next(user);
  };
}

// ── Cookie helper ─────────────────────────────────────────────────────────────

export function setTokenCookie(res: NextApiResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=${TOKEN_TTL_DAYS * 86400}; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );
}

export function clearTokenCookie(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );
}
