"use client";
import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import NotificationBell from "../../components/NotificationBell";

interface CustomerNavigationProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const navigationLinks = [
  {
    href: "/customer",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/customer/TransactionHistory",
    label: "Transaction History",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/buynow",
    label: "Re-order",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    href: "/customer/rent-truck",
    label: "Rent a Truck",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h6l2-1zM13 6l3 5h3l1 2v3h-2" />
      </svg>
    ),
  },
  {
    href: "/paydues",
    label: "Pay Union Dues",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/customer/station-manager",
    label: "Station Manager",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "/customer/transaction-status",
    label: "Transaction Status",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function CustomerNavigation({ user }: CustomerNavigationProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"));
  };

  return (
    <>
      {/* ── Top Navbar ──
          Mobile : left-0 → right-0 (full width)
          Desktop: left-64 → right-0 (content area only, sidebar owns the left 256 px) */}
      <header className="fixed top-0 left-0 md:left-64 right-0 z-30 h-16 flex items-center px-4 md:px-6 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">

        {/* Hamburger – mobile only */}
        <button
          className="md:hidden p-2 mr-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo – mobile only (desktop logo lives inside the sidebar header) */}
        <Link href="/" className="flex items-center md:hidden">
          <Image
            src="/eNnergy Logo.png"
            alt="e-Nergy"
            width={60}
            height={40}
            priority
            className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
          />
        </Link>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />

          <Link
            href="/customer/profile"
            className="hidden sm:flex items-center gap-2 text-sm text-gray-300 bg-gray-800/60 hover:bg-gray-700/80 hover:border-orange-500/40 border border-transparent px-3 py-1.5 rounded-full transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span>Hi, <span className="font-semibold text-white">{user.name}</span></span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──
          Mobile : slides in over content, starts below header (top-16)
          Desktop: always visible, starts from very top (top-0), owns the full left column */}
      <aside
        className={`
          fixed top-16 md:top-0 left-0 bottom-0 z-40 w-64
          bg-gray-950/95 backdrop-blur-md border-r border-gray-800
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo header – desktop only, same h-16 as the topbar so they align */}
        <div className="hidden md:flex items-center px-4 h-16 border-b border-gray-800 shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/eNnergy Logo.png"
              alt="e-Nergy"
              width={60}
              height={40}
              priority
              className="object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
            />
          </Link>
        </div>

        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 md:hidden">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User card */}
        <Link
          href="/customer/profile"
          onClick={() => setSidebarOpen(false)}
          className="px-4 py-4 border-b border-gray-800 flex items-center gap-3 hover:bg-gray-800/50 transition group"
        >
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:ring-2 group-hover:ring-orange-500/40 transition">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</p>
          {navigationLinks.map((link) => {
            const isActive = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/70"
                  }
                `}
              >
                {link.icon}
                {link.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          {[
            { href: "/contact",              label: "Contact"            },
            { href: "/terms-and-conditions", label: "Terms & Conditions" },
            { href: "/refund-policy",        label: "Refund Policy"      },
            { href: "/privacy-policy",       label: "Privacy Policy"     },
            { href: "/about",                label: "About Us"           },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
