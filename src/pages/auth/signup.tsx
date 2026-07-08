"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import BottomNavbar from "@/components/ButtomNavbar";
import tower from "@/../public/tower.jpg";
import { HoneypotField, useHoneypot } from "@/lib/security/honeypot";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeString } from "@/lib/security/sanitize";
import { api } from "@/lib/db-client";

export default function SignUp() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { isBot } = useHoneypot(formRef);
  const rateLimit = useRateLimit({ maxAttempts: 3, windowMs: 120_000 });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    agreeTerms: false,
    agreeRefund: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    // Check real API first, fall back to localStorage
    api.platformSettings.get().then((settings) => {
      if (settings && settings.allowNewRegistrations === false) {
        setRegistrationsOpen(false);
      }
    }).catch(() => null);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setFormData((prev) => ({ ...prev, [target.name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!registrationsOpen) {
      setError("New registrations are currently closed. Please contact support.");
      return;
    }
    if (isBot()) return;
    if (!rateLimit.attempt()) {
      const secs = Math.ceil(rateLimit.remainingMs / 1000);
      setError(`Too many sign-up attempts. Please wait ${secs}s.`);
      return;
    }

    if (!formData.agreeTerms || !formData.agreeRefund) {
      setError("You must agree to the Terms and Conditions and Refund Policy.");
      return;
    }

    const safe = {
      ...formData,
      name: sanitizeString(formData.name),
      email: sanitizeString(formData.email).toLowerCase().trim(),
      phone: sanitizeString(formData.phone),
    };

    if (safe.password !== safe.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Map display role to DB role value
    const roleMap: Record<string, string> = {
      "Customer": "customer",
      "Bulk Dealer": "bulk_dealer",
    };
    const dbRole = roleMap[safe.role] ?? safe.role;

    setIsLoading(true);

    // ── 1. Try real API ────────────────────────────────────────────────────────
    const result = await api.auth.signup({
      name: safe.name,
      email: safe.email,
      phone: safe.phone || undefined,
      role: dbRole,
      password: safe.password,
    });

    if (result) {
      setRegisteredEmail(safe.email);
      setVerificationSent(true);
      setIsLoading(false);
      return;
    }

    setError("Sign up failed. Please try again.");
    setIsLoading(false);
  };

  // ── Email verification pending screen ────────────────────────────────────────
  if (verificationSent) {
    return (
      <>
        <Head><title>Verify Your Email | e-Nergy</title></Head>
        <NavBar />
        <div
          className="h-screen flex justify-center items-center bg-cover bg-center bg-no-repeat overflow-hidden relative"
          style={{ backgroundImage: `url(${tower.src})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border-4 border-orange-500 p-10 max-w-md w-[90%] text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your inbox</h2>
            <p className="text-gray-600 text-sm mb-1">
              We sent a verification code to
            </p>
            <p className="font-semibold text-orange-500 text-sm mb-5 break-all">{registeredEmail}</p>
            <p className="text-gray-500 text-xs mb-6">
              Enter the 6-digit code to activate your account.
            </p>
            <button
              onClick={() => router.push(`/auth/verify-email?email=${encodeURIComponent(registeredEmail)}`)}
              className="w-full rounded-full bg-orange-500 text-white py-3 font-semibold hover:bg-orange-600 transition mb-3"
            >
              Enter verification code
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="text-sm text-orange-500 hover:underline"
            >
              Back to login
            </button>
          </div>
        </div>
        <BottomNavbar />
      </>
    );
  }

  // ── Main signup form ──────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Create Account | e-Nergy</title></Head>
      <NavBar />
      <div
        className="h-screen flex justify-center items-center bg-cover bg-center bg-no-repeat overflow-hidden relative"
        style={{ backgroundImage: `url(${tower.src})` }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative flex w-[90%] max-w-6xl h-[75vh] bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden border-4 border-orange-500 z-10 mt-10">
          {/* Left Image Section */}
          <div className="relative w-1/2 hidden md:block">
            <Image src={tower} alt="tower" fill className="object-cover" priority />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white bg-black/80 backdrop-blur-sm p-6 text-center text-2xl md:text-3xl font-bold drop-shadow-lg rounded-lg border-2 border-orange-500">
                Join e-Nergy Today
              </div>
            </div>
          </div>

          {/* Right Form Section */}
          <div className="w-full md:w-1/2 flex flex-col justify-start items-center p-10 md:p-16 overflow-y-auto">
            <h2 className="text-4xl font-bold mb-4 text-center text-gray-800">Create Account</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">Register to access e-Nergy platform</p>

            {!registrationsOpen && (
              <div className="w-full max-w-sm mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 text-center">
                <p className="font-semibold mb-1">Registrations are currently closed</p>
                <p className="text-xs">New account sign-ups have been paused by the platform administrator. Please check back later or contact support.</p>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
              <HoneypotField />
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                className="w-full rounded-full bg-gray-200 py-3 px-5 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.name}
                onChange={handleChange}
                disabled={!registrationsOpen}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Enter email"
                className="w-full rounded-full bg-gray-200 py-3 px-5 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.email}
                onChange={handleChange}
                disabled={!registrationsOpen}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                className="w-full rounded-full bg-gray-200 py-3 px-5 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.phone}
                onChange={handleChange}
                disabled={!registrationsOpen}
                required
              />

              <select
                name="role"
                className="w-full rounded-full bg-gray-200 py-3 px-5 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                value={formData.role}
                onChange={handleChange}
                disabled={!registrationsOpen}
                required
              >
                <option value="">-Register as-</option>
                <option value="Customer">Register as Customer</option>
                <option value="Bulk Dealer">Register as Bulk Dealer</option>
              </select>

              {/* Password with visibility toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  className="w-full rounded-full bg-gray-200 py-3 pl-5 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={!registrationsOpen}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm password with visibility toggle */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  className="w-full rounded-full bg-gray-200 py-3 pl-5 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={!registrationsOpen}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    disabled={!registrationsOpen}
                    className="h-4 w-4 ml-[10px]"
                    required
                  />
                  <span>
                    I agree to the {""}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      className="text-orange-500 underline"
                    >
                      Terms and Conditions
                    </Link>
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="agreeRefund"
                    checked={formData.agreeRefund}
                    onChange={handleChange}
                    disabled={!registrationsOpen}
                    className="h-4 w-4 ml-[10px]"
                    required
                  />
                  <span>
                    I agree to the {""}
                    <Link
                      href="/refund-policy"
                      target="_blank"
                      className="text-orange-500 underline"
                    >
                      Refund Policy
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !registrationsOpen ||
                  !formData.agreeTerms ||
                  !formData.agreeRefund
                }
                className="w-full rounded-full bg-orange-500 text-white py-3 font-semibold hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  "Sign up"
                )}
              </button>
            </form>

            <p className="mt-6 text-sm text-center text-gray-700">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-orange-500 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      <BottomNavbar />
    </>
  );
}
