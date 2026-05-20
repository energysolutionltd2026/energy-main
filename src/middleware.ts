import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET = new TextEncoder().encode(JWT_SECRET ?? "");

// Role → home dashboard after login
const ROLE_HOME: Record<string, string> = {
  admin:           "/admin/dashboard",
  customer:        "/customer/dashboard",
  bulk_dealer:     "/bulk-dealer/dashboard",
  truck_owner:     "/truck-owner/dashboard",
  station_manager: "/station-manager/dashboard",
};

// Route prefixes and which roles are allowed
const PROTECTED: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin",           roles: ["admin"] },
  { prefix: "/customer",        roles: ["customer"] },
  { prefix: "/bulk-dealer",     roles: ["bulk_dealer"] },
  { prefix: "/truck-owner",     roles: ["truck_owner"] },
  { prefix: "/station-manager", roles: ["station_manager"] },
];

// Public paths that are always accessible
const PUBLIC_PREFIXES = ["/auth/", "/api/", "/_next/", "/favicon"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow root landing page
  if (pathname === "/") return NextResponse.next();

  // Decode token from cookie
  const token = req.cookies.get("token")?.value ?? null;
  let payload: { role?: string } | null = null;

  if (token && JWT_SECRET) {
    try {
      const { payload: p } = await jwtVerify(token, SECRET);
      payload = p as { role?: string };
    } catch {
      payload = null;
    }
  }

  // ── Auth pages (/auth/login, /auth/signup, etc.) ──────────────────────────
  // If already logged in, redirect to their dashboard
  if (pathname.startsWith("/auth")) {
    if (payload?.role) {
      const home = ROLE_HOME[payload.role] ?? "/";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  }

  // ── Protected routes ──────────────────────────────────────────────────────
  const matched = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (matched) {
    // Not logged in → login page
    if (!payload?.role) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Wrong role → their own dashboard
    if (!matched.roles.includes(payload.role)) {
      const home = ROLE_HOME[payload.role] ?? "/";
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
