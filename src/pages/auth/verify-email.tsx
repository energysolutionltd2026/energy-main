"use client";
import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import BottomNavbar from "@/components/ButtomNavbar";
import tower from "@/../public/tower.jpg";
import { api } from "@/lib/db-client";

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = router.query;

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setIsVerifying(true);

    const emailStr = typeof email === "string" ? email : "";

    // ── 1. Try real API ──────────────────────────────────────────────────────
    const result = await api.auth.verifyEmail({ email: emailStr, code });

    if (result?.ok) {
      router.push("/auth/login?verified=1");
      return;
    }

    setError("Invalid code. Please try again.");
    setIsVerifying(false);
  };

  const handleResend = async () => {
    setResent(false);
    await new Promise((r) => setTimeout(r, 600));
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <>
      <Head><title>Verify Email | e-Nergy</title></Head>
      <NavBar />
      <div
        className="h-screen flex justify-center items-center bg-cover bg-center bg-no-repeat overflow-hidden relative"
        style={{ backgroundImage: `url(${tower.src})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border-4 border-orange-500 p-10 max-w-md w-[90%] text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify your email</h2>
          <p className="text-gray-500 text-sm mb-1">Enter the 6-digit code sent to</p>
          {email && (
            <p className="font-semibold text-orange-500 text-sm mb-6 break-all">{email}</p>
          )}

          {/* Code inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold rounded-lg border-2 border-gray-300 bg-gray-50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          {resent && (
            <p className="text-green-600 text-sm mb-4">Code resent! Check your inbox.</p>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full rounded-full bg-orange-500 text-white py-3 font-semibold hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </button>

          <p className="text-sm text-gray-500">
            Didn&apos;t receive it?{" "}
            <button onClick={handleResend} className="text-orange-500 font-semibold hover:underline">
              Resend code
            </button>
          </p>
        </div>
      </div>
      <BottomNavbar />
    </>
  );
}
