"use client";
import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";

// ─── Data ─────────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  { name: "users",             route: "/api/db/users",              desc: "All platform users — customers, bulk dealers, admins. Stores credentials, business info, tank volumes, bank details, status.", ops: ["LIST","GET","POST","PUT"] },
  { name: "station_managers",  route: "/api/db/station-managers",   desc: "Station managers linked to customer accounts. Separate collection from users with block/unblock status.", ops: ["LIST","GET","POST","PUT"] },
  { name: "supply_requests",   route: "/api/db/supply-requests",    desc: "Fuel supply requests submitted by customers. Tracks product, quantity, depot, delivery date, priority, and status lifecycle.", ops: ["LIST","GET","POST","PUT"] },
  { name: "purchase_orders",   route: "/api/db/purchase-orders",    desc: "Bulk dealer fuel allocations from depots. Tracks product, quantity (litres), amount, depot, and delivery status.", ops: ["LIST","GET","POST","PUT"] },
  { name: "loading_records",   route: "/api/db/loading-records",    desc: "Records of truck loading operations at depots, linked to purchase orders.", ops: ["LIST","GET","POST","PUT"] },
  { name: "transactions",      route: "/api/db/transactions",       desc: "All financial transactions across the platform. Includes payment method, product, amount, AI anomaly flags.", ops: ["LIST","GET","POST","PUT"] },
  { name: "trucks",            route: "/api/db/trucks",             desc: "Registered fuel trucks submitted by owners for review. Stores full vehicle, driver, and compliance data.", ops: ["LIST","GET","POST","PUT"] },
  { name: "truck_rentals",     route: "/api/db/truck-rentals",      desc: "Truck rental bookings between customers and truck owners.", ops: ["LIST","GET","POST","PUT"] },
  { name: "depots",            route: "/api/db/depots",             desc: "Fuel depot inventory — PMS, AGO, ATK stock levels, pricing, capacity, and availability status.", ops: ["LIST","GET","PUT","SEED"] },
  { name: "fuel_stations",     route: "/api/db/fuel-stations",      desc: "Retail fuel stations managed by customers. Stores location, station manager assignment, opening stock.", ops: ["LIST","GET","POST","PUT"] },
  { name: "daily_sales",       route: "/api/db/daily-sales",        desc: "Daily sales records submitted by station managers — per-product opening/closing stock, litres sold, revenue.", ops: ["LIST","GET","POST","PUT"] },
  { name: "union_dues",        route: "/api/db/union-dues",         desc: "Union due payment records for platform members.", ops: ["LIST","GET","POST","PUT"] },
  { name: "custom_levies",     route: "/api/db/custom-levies",      desc: "Admin-configurable levies applied to transactions. Name, percentage rate, category, active/inactive toggle.", ops: ["LIST","GET","POST","PUT"] },
  { name: "platform_settings", route: "/api/db/platform-settings",  desc: "Single-document global settings: registration open/closed, platform fees, yearly bulk dealer fee.", ops: ["GET","PUT"] },
  { name: "notifications",     route: "/api/db/notifications",      desc: "In-app notifications per user. Mark-read, create, delete supported. Filtered by recipientEmail and role.", ops: ["LIST","GET","POST","PUT","DELETE"] },
  { name: "sessions",          route: "/api/db/sessions",           desc: "JWT session tracking — isValid flag for revocation support.", ops: ["LIST","GET","PUT"] },
  { name: "ai_feedback",       route: "/api/db/ai-feedback",        desc: "User feedback on AI assistant responses — thumbs up/down, comments, model used, token usage.", ops: ["LIST","GET","POST"] },
];

const AUTH_ROUTES = [
  { method: "POST", path: "/api/auth/signup",         desc: "Register new user. Hashes password with bcrypt. Sends email verification code." },
  { method: "POST", path: "/api/auth/login",          desc: "Authenticate with email + password. Returns JWT in HTTP-only cookie." },
  { method: "GET",  path: "/api/auth/me",             desc: "Get current user from JWT cookie." },
  { method: "POST", path: "/api/auth/logout",         desc: "Clear JWT cookie." },
  { method: "POST", path: "/api/auth/verify-email",   desc: "Verify email with 6-digit code. Activates account." },
  { method: "POST", path: "/api/auth/forgot-password",desc: "Send password reset link with signed JWT token." },
  { method: "POST", path: "/api/auth/reset-password", desc: "Verify reset token and set new hashed password." },
];

const AI_ROUTES = [
  { path: "/api/ai/anomaly-detection",    desc: "Scan recent transactions with Claude Opus 4.6, return flagged anomalies with severity scores." },
  { path: "/api/ai/demand-forecast",      desc: "Predict fuel demand by depot/product using historical transaction data." },
  { path: "/api/ai/supply-optimization",  desc: "Recommend optimal supply allocations based on depot stock and demand patterns." },
  { path: "/api/ai/risk-assessment",      desc: "Assess user/transaction risk profiles from historical behaviour." },
  { path: "/api/ai/price-intelligence",   desc: "Analyse pricing trends and suggest competitive price adjustments." },
  { path: "/api/ai/chat",                 desc: "Conversational AI assistant for admin, customer, and bulk dealer interfaces." },
  { path: "/api/ai/feedback",             desc: "Store user thumbs-up/thumbs-down feedback on AI responses." },
];

const MIGRATION_TIERS = [
  {
    tier: "Tier 1",
    label: "Core Data",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    items: [
      "supply_requests → api.supplyRequests (admin dashboard + customer request-supply)",
      "customer_transactions → api.transactions.list() (customer home page)",
      "station_managers → api.stationManagers (admin dashboard CRUD)",
      "admin_suspended_users → api.users.update() (admin dashboard toggle)",
    ],
  },
  {
    tier: "Tier 2",
    label: "Settings & Sales",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    items: [
      "admin_settings → api.platformSettings (admin settings panel, bulk dealer fee bar)",
      "admin_custom_levies → api.customLevies (admin levies manager)",
      "station_daily_sales → api.dailySales.create() (customer update-sales submit)",
      "bulk dealer yearly fee → api.platformSettings.get() (AccountFeeBar component)",
    ],
  },
  {
    tier: "Tier 3",
    label: "Profiles, Notifications, Trucks, Transactions & Depots",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    items: [
      "bulk_dealer_notifications → api.notifications (load, mark-read, delete)",
      "customer_notifications → api.notifications (load, mark-read, delete)",
      "bulk_dealer_profile → api.auth.me() + api.users.update() (profile page)",
      "customer_profile → api.auth.me() + api.users.update() (profile page)",
      "owner_submitted_trucks → api.trucks.create() (RentTruck registration)",
      "bulk_purchase_orders → api.purchaseOrders (load + create + receive)",
      "customer_transactions (read) → api.transactions.list() (transaction-status page)",
      "platform_transactions (read) → api.transactions.list() (admin transactions + reports + overview)",
      "union dues submit → api.unionDues.create() + api.transactions.create() (paydues)",
      "admin truck decisions → api.trucks.list() + api.trucks.update() (admin trucks section)",
      "admin depot overrides → api.depots.list() + api.depots.update() (admin depots section)",
      "sm_depot_stock → api.depots.list() + api.depots.update() (station-manager dashboard)",
    ],
  },
];

const ENV_VARS = [
  { key: "MONGODB_URI",        desc: "MongoDB Atlas connection string. Database name: e-nergy." },
  { key: "JWT_SECRET",         desc: "Secret for signing auth and password-reset tokens." },
  { key: "SEED_SECRET",        desc: "Passphrase to protect the /api/db/seed endpoint." },
  { key: "ANTHROPIC_API_KEY",  desc: "Claude API key for all 7 AI routes." },
  { key: "PAYSTACK_SECRET_KEY",desc: "Paystack secret for payment processing." },
  { key: "PAYSTACK_PUBLIC_KEY",desc: "Paystack public key for client-side payment widget." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    LIST:   "bg-blue-500/20 text-blue-300 border-blue-500/40",
    GET:    "bg-card-2/60 text-foreground border-line",
    POST:   "bg-green-500/20 text-green-300 border-green-500/40",
    PUT:    "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    DELETE: "bg-red-500/20 text-red-300 border-red-500/40",
    SEED:   "bg-orange-500/20 text-orange-300 border-orange-500/40",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${map[label] || "bg-card-2 text-foreground border-line"}`}>
      {label}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    GET:  "bg-blue-500/20 text-blue-300",
    POST: "bg-green-500/20 text-green-300",
    PUT:  "bg-yellow-500/20 text-yellow-300",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${map[method] || "bg-card-2 text-foreground"}`}>
      {method}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BackendSummary() {
  const [tab, setTab] = useState("Overview");
  const TABS = ["Overview", "Collections", "Auth Routes", "AI Routes", "Migration", "Environment"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head><title>Backend Summary | e-Nergy</title></Head>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition">
            ← Admin
          </Link>
          <span className="text-muted">/</span>
          <h1 className="text-foreground font-bold text-base">Backend Summary</h1>
        </div>
        <span className="text-xs text-muted hidden sm:block">e-Nergy Platform · MongoDB Atlas · Next.js 15 Pages Router</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">e-Nergy Backend Documentation</h2>
              <p className="text-muted text-sm leading-relaxed max-w-2xl">
                Full-stack Nigerian fuel distribution platform. 17 MongoDB collections, 7 auth routes, 17 CRUD API routes, 7 AI routes powered by Claude Opus 4.6. All pages migrated from localStorage to real API with graceful fallback.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  { label: "17 Collections", color: "text-orange-400" },
                  { label: "7 Auth Routes",  color: "text-blue-400"   },
                  { label: "7 AI Routes",    color: "text-purple-400" },
                  { label: "3-Tier Migration", color: "text-green-400" },
                ].map((s) => (
                  <span key={s.label} className={`text-xs font-semibold ${s.color} bg-card-2 px-3 py-1 rounded-full border border-line`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-line rounded-xl p-1 mb-6 overflow-x-auto w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                tab === t ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-muted hover:text-foreground"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="bg-card/60 border border-line rounded-xl p-5">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Stack</p>
              <div className="space-y-2.5 text-sm">
                {[
                  { k: "Framework",   v: "Next.js 15, Pages Router, TypeScript" },
                  { k: "Database",    v: "MongoDB Atlas (cluster: e-nergy-cluster)" },
                  { k: "ODM",         v: "Mongoose 8.x" },
                  { k: "Auth",        v: "JWT (jsonwebtoken) + bcryptjs, HTTP-only cookies" },
                  { k: "AI",          v: "Anthropic Claude Opus 4.6 via @anthropic-ai/sdk" },
                  { k: "Styling",     v: "Tailwind CSS 4" },
                  { k: "Hosting",     v: "Sliplane (container), MongoDB Atlas" },
                  { k: "Payments",    v: "Paystack (wired in env)" },
                ].map(({ k, v }) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-muted w-28 shrink-0">{k}</span>
                    <span className="text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card/60 border border-line rounded-xl p-5">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Architecture</p>
              <div className="space-y-3 text-sm text-foreground">
                <p><span className="text-foreground font-semibold">CRUD factory pattern:</span> <code className="text-orange-300 text-xs">collectionHandler</code> and <code className="text-orange-300 text-xs">documentHandler</code> in <code className="text-xs text-muted">src/lib/crud.ts</code> — every collection gets full REST from two lines.</p>
                <p><span className="text-foreground font-semibold">API client:</span> <code className="text-orange-300 text-xs">api</code> namespace in <code className="text-xs text-muted">src/lib/db-client.ts</code> wraps every route with a <code className="text-orange-300 text-xs">safe()</code> helper that returns <code className="text-orange-300 text-xs">null</code> on error — no uncaught exceptions.</p>
                <p><span className="text-foreground font-semibold">Migration strategy:</span> API-first with localStorage fallback. All pages try the real API; on null response fall back to localStorage. Dual-write keeps both in sync during transition.</p>
                <p><span className="text-foreground font-semibold">Seeding:</span> two <code className="text-orange-300 text-xs">SEED_SECRET</code>-protected routes — <code className="text-muted text-xs">POST /api/db/users/seed-admin</code> creates the initial admin from an operator-supplied <code className="text-orange-300 text-xs">name/email/password</code> (only if none exists), and <code className="text-muted text-xs">POST /api/db/depots/seed</code> seeds depot stock. No demo dealer/customer accounts are seeded.</p>
              </div>
            </div>

            <div className="bg-card/60 border border-line rounded-xl p-5 md:col-span-2">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">User Roles</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { role: "Customer",    dbRole: "customer",    color: "text-orange-400",  pages: ["Home", "Supply Request", "Station Manager", "Update Sales", "Notifications", "Transactions", "Rent Truck"] },
                  { role: "Bulk Dealer", dbRole: "bulk_dealer", color: "text-green-400",   pages: ["Dashboard (Stock, Allocations, Sales, Buyers)", "Profile", "Notifications"] },
                  { role: "Admin",       dbRole: "admin",       color: "text-purple-400",  pages: ["Dashboard (Users, Supply Requests, Station Managers, Settings, Levies, Sales)"] },
                ].map(({ role, dbRole, color, pages }) => (
                  <div key={role} className="bg-card-2/50 rounded-xl p-4">
                    <p className={`font-bold text-sm ${color} mb-1`}>{role}</p>
                    <p className="text-xs text-muted mb-2">DB role: <code className="text-muted">{dbRole}</code></p>
                    <ul className="space-y-1">
                      {pages.map((p) => (
                        <li key={p} className="text-xs text-muted flex items-center gap-1.5">
                          <span className={`w-1 h-1 rounded-full shrink-0 ${color.replace("text-", "bg-")}`} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Collections ── */}
        {tab === "Collections" && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-4">All 17 collections in MongoDB database <code className="text-orange-300">e-nergy</code>. Every collection uses the CRUD factory — collection routes support GET+POST, document routes support GET+PUT (and DELETE where applicable).</p>
            {COLLECTIONS.map((c) => (
              <div key={c.name} className="bg-card/60 border border-line rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-orange-400 font-bold text-sm">{c.name}</code>
                      <code className="text-muted text-xs">{c.route}</code>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{c.desc}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap shrink-0">
                    {c.ops.map((op) => <Badge key={op} label={op} color="" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Auth Routes ── */}
        {tab === "Auth Routes" && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-4">JWT-based authentication. Tokens stored in HTTP-only cookies (<code className="text-orange-300">e-nergy-token</code>). Passwords hashed with bcrypt (12 rounds). Password reset uses a 1-hour expiry JWT.</p>
            {AUTH_ROUTES.map((r) => (
              <div key={r.path} className="bg-card/60 border border-line rounded-xl p-4 flex items-start gap-4">
                <MethodBadge method={r.method} />
                <div>
                  <code className="text-orange-400 text-sm font-bold">{r.path}</code>
                  <p className="text-xs text-muted mt-1">{r.desc}</p>
                </div>
              </div>
            ))}
            <div className="bg-card-2/40 border border-line rounded-xl p-4 mt-4">
              <p className="text-xs font-bold text-foreground mb-2">Initial admin (from <code className="text-orange-300">POST /api/db/users/seed-admin</code>)</p>
              <p className="text-xs text-muted">The seed route creates a single admin from the <code className="text-orange-300">name/email/password</code> you pass in the request body (min 8-char password), and only when no admin exists yet — there are no hardcoded default credentials, and no dealer/customer accounts are pre-seeded. All other users self-register via signup.</p>
            </div>
          </div>
        )}

        {/* ── AI Routes ── */}
        {tab === "AI Routes" && (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-4">All AI routes use <strong className="text-foreground">Claude Opus 4.6</strong> via the Anthropic SDK. They query the MongoDB database for real data, perform structured analysis, and return JSON results. Feedback is stored in the <code className="text-orange-300">ai_feedback</code> collection.</p>
            {AI_ROUTES.map((r) => (
              <div key={r.path} className="bg-card/60 border border-line rounded-xl p-4 flex items-start gap-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">POST</span>
                <div>
                  <code className="text-purple-400 text-sm font-bold">{r.path}</code>
                  <p className="text-xs text-muted mt-1">{r.desc}</p>
                </div>
              </div>
            ))}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 mt-2">
              <p className="text-xs text-purple-300 font-semibold mb-1">Implementation note</p>
              <p className="text-xs text-muted">AI routes are built (50/50 Tier split) but not yet wired to live DB data — they use structured prompts with context from the DB. Full wiring happens as real data accumulates in production.</p>
            </div>
          </div>
        )}

        {/* ── Migration ── */}
        {tab === "Migration" && (
          <div className="space-y-5">
            <p className="text-xs text-muted mb-2">All pages were migrated from localStorage-only storage to API-first with localStorage fallback. The strategy: try the API, use results if available, otherwise fall back to localStorage. Write operations go to both. This means the app works offline/on first load and seamlessly transitions to real data as the database fills.</p>
            {MIGRATION_TIERS.map((t) => (
              <div key={t.tier} className={`border rounded-xl p-5 ${t.bg} ${t.border}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${t.bg} ${t.color} ${t.border}`}>{t.tier}</span>
                  <p className={`font-bold text-sm ${t.color}`}>{t.label}</p>
                </div>
                <ul className="space-y-2">
                  {t.items.map((item) => (
                    <li key={item} className="text-xs text-foreground flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${t.color.replace("text-", "bg-")}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="bg-card-2/40 border border-line rounded-xl p-5">
              <p className="text-xs font-bold text-foreground mb-3">Remaining (to wire when real data exists)</p>
              <ul className="space-y-2">
                {[
                  "platform_transactions write side → api.transactions.create() (full Paystack callback wiring)",
                  "Station daily sales stationId → real FuelStation ObjectId (blocked on seeded fuel stations)",
                  "SecurityTab password update → real hash comparison via API (currently UI-only password check)",
                  "sm_global_stock → api.depots bulk update (admin SectionProducts 'Apply to all depots')",
                ].map((item) => (
                  <li key={item} className="text-xs text-muted flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Environment ── */}
        {tab === "Environment" && (
          <div className="space-y-4">
            <p className="text-xs text-muted mb-2">Configure these in your <code className="text-orange-300">.env.local</code> file (local dev) or in the Sliplane dashboard environment variables (production). Never commit secrets to git.</p>
            <div className="space-y-3">
              {ENV_VARS.map((e) => (
                <div key={e.key} className="bg-card/60 border border-line rounded-xl p-4">
                  <code className="text-orange-400 font-bold text-sm">{e.key}</code>
                  <p className="text-xs text-muted mt-1">{e.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mt-4">
              <p className="text-xs font-bold text-yellow-400 mb-2">Hosting note</p>
              <p className="text-xs text-muted">This app runs on <strong className="text-foreground">Sliplane</strong> (container-based hosting). Environment variables are set in the Sliplane dashboard — not in <code className="text-orange-300">.env.local</code> which is gitignored. The <code className="text-foreground">NEXT_PUBLIC_*</code> prefix is NOT used — all secrets stay server-side.</p>
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>e-Nergy Platform · Backend built May 2026</span>
          <Link href="/admin/dashboard" className="text-orange-400 hover:text-orange-300 transition font-semibold">
            ← Back to Admin Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
