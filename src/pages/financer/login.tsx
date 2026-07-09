"use client";
import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Gauge, Loader2, ShieldCheck } from "lucide-react";

/**
 * Dedicated financer login page.
 *
 * Separate from /auth/login — authenticates against the Financer accounts
 * collection and, on success, sends the viewer straight to the read-only
 * financer overview dashboard.
 */
export default function FinancerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/financer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      // Cookie is set by the server; go to the dashboard.
      router.replace("/financer-overview-e-nergy");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <Head><title>Financer Login · e-Nergy</title></Head>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-3">
            <Gauge className="w-6 h-6 text-orange-400" />
          </div>
          <h1 className="text-lg font-bold">Financer Overview</h1>
          <p className="text-[12px] text-gray-500 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Restricted access
          </p>
        </div>

        <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="text-[13px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              placeholder="financer@example.com"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-600 mt-4">
          Financer accounts are provisioned by the administrator.
        </p>
      </div>
    </div>
  );
}
