"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import BottomNavbar from "@/components/ButtomNavbar";
import ThemeToggle from "@/components/ThemeToggle";
import tower from "@/../public/tower.jpg";
import { HoneypotField, useHoneypot } from "@/lib/security/honeypot";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeString } from "@/lib/security/sanitize";
import { api } from "@/lib/db-client";


// Maps DB role values to the display/routing role strings used throughout the app
const ROLE_DISPLAY: Record<string, string> = {
  customer: "Customer",
  bulk_dealer: "Bulk Dealer",
  admin: "Admin",
  truck_owner: "Truck Owner",
  station_manager: "Station Manager",
  financer: "Financer",
};

function roleToRoute(role: string): string {
  const r = role.toLowerCase().replace(" ", "_");
  if (r === "bulk_dealer" || r === "bulk dealer") return "/bulk-dealer/dashboard";
  if (r === "admin") return "/admin/dashboard";
  if (r === "station_manager" || r === "station manager") return "/station-manager/dashboard";
  if (r === "financer") return "/financer-overview-e-nergy";
  return "/customer";
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { isBot } = useHoneypot(formRef);
  const rateLimit = useRateLimit({ maxAttempts: 5, windowMs: 60_000 });

  // Show "email verified" banner if redirected from verify-email
  const verified = router.query.verified === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isBot()) return;
    if (!rateLimit.attempt()) {
      const secs = Math.ceil(rateLimit.remainingMs / 1000);
      setError(`Too many attempts. Please wait ${secs}s before trying again.`);
      return;
    }
    setIsLoading(true);

    const safeEmail = sanitizeString(email).toLowerCase().trim();

    // ── 1. Try real API ────────────────────────────────────────────────────────
    const result = await api.auth.login({ email: safeEmail, password });

    if (result) {
      const { user, token } = result;
      const displayRole = ROLE_DISPLAY[user.role ?? ""] ?? user.role ?? "";

      router.push(roleToRoute(user.role ?? ""));
      return;
    }

    setError("Invalid email or password");
    setIsLoading(false);
  };

  return (
    <>
      <Head><title>Sign In | e-Nergy</title></Head>
      <NavBar />
      <div
        className="h-screen flex justify-center items-center bg-cover bg-center bg-no-repeat overflow-hidden relative"
        style={{ backgroundImage: `url(${tower.src})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Theme toggle (NavBar is hidden on /auth routes) */}
        <div className="absolute top-4 right-4 z-20 text-white">
          <ThemeToggle />
        </div>

      {/* Login Container */}
      <div className="relative flex w-[90%] max-w-6xl h-[70vh] bg-card/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden border-4 border-orange-500 z-10 mt-10">

        {/* Left Image Section */}
        <div className="relative w-1/2 hidden md:flex flex-col">
          <Image src={tower} alt="tower" fill className="object-cover" priority />
          {/* Overlay so text is readable */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Demo credentials + greeting stacked centrally */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 gap-4">
            {/* Welcome text */}
            <div className="text-white bg-black/80 backdrop-blur-sm px-6 py-4 text-center text-2xl md:text-3xl font-bold drop-shadow-lg rounded-lg border-2 border-orange-500">
              Welcome to e-Nergy
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-10 md:p-16">
          <h2 className="text-4xl font-bold mb-4 text-center text-foreground">
            Sign In
          </h2>
          <p className="text-sm text-muted mb-8 text-center">
            Access your e-Nergy account
          </p>

          <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
            <HoneypotField />

            {verified && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
                Email verified! You can now sign in.
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <input
              type="email"
              placeholder="Enter email"
              className="w-full rounded-full bg-gray-200 dark:bg-gray-800 text-foreground placeholder:text-muted py-3 px-5 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter password"
              className="w-full rounded-full bg-gray-200 dark:bg-gray-800 text-foreground placeholder:text-muted py-3 px-5 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Primary login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-orange-500 text-white py-3 font-semibold hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-orange-500 hover:underline">
              sign up
            </Link>
            <br />
            <Link
              href="/auth/forgot-password"
              className="text-sm text-orange-500 hover:underline mt-2 block text-center"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
    <BottomNavbar />
    </>
  );
}
