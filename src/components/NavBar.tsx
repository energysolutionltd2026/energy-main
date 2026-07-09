"use client";
import React, { useState, useRef, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { label: "Home",      path: "/home"       },
  { label: "Buy now",   path: "/buynow"     },
  { label: "Pay Dues",  path: "/paydues"    },
  { label: "Load",      path: "/load"       },
  { label: "Book Now",  path: "/booknow"    },
  { label: "Rent Truck",path: "/RentTruck"  },
  {
    label: "Products",
    path: "/products",
    dropdown: [
      { label: "PMS", path: "/products/pms" },
      { label: "AGO", path: "/products/ago" },
      { label: "ATK", path: "/products/atk" },
    ],
  },
];

const authItems = [
  { label: "Login",   path: "/auth/login"  },
  { label: "Sign Up", path: "/auth/signup" },
];

// Minimum px the user must scroll before hide/show triggers.
// This filters out the micro-scroll jitter caused by mobile browser
// chrome (address bar) resizing the viewport.
const SCROLL_THRESHOLD = 8;

function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [navVisible, setNavVisible] = useState(true);
  const navRef = useRef<HTMLElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  const isActive = (p?: string) => (p ? pathname === p : false);

  // ── Scroll hide/show ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleScroll() {
      // If the mobile menu is open, do NOT auto-hide the navbar.
      // This lets users scroll the sidebar without it disappearing.
      if (menuOpen) return;

      // Use documentElement.scrollTop as a consistent cross-browser fallback.
      const currentScrollY =
        window.scrollY ?? document.documentElement.scrollTop ?? 0;

      const delta = currentScrollY - lastScrollY.current;

      // Ignore tiny movements — these are caused by the mobile browser
      // viewport resizing (address bar appearing/disappearing), not real scrolls.
      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      if (delta > 0 && currentScrollY > 50) {
        // Scrolling down — hide navbar
        setNavVisible(false);
        // Close mobile menu if open so it doesn't hang in mid-air
        setMenuOpen(false);
      } else if (delta < 0) {
        // Scrolling up — show navbar
        setNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // ── Outside-click closes dropdown ─────────────────────────────────────────
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      const isOutsideNav =
        navRef.current && target && !navRef.current.contains(target);
      const isOutsideMobileMenu =
        mobileMenuRef.current && target && !mobileMenuRef.current.contains(target);

      if (isOutsideNav && (mobileMenuRef.current ? isOutsideMobileMenu : true)) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className={`px-6 md:px-16 fixed top-0 left-0 w-full z-50 md:z-11 flex justify-between items-center py-0 bg-transparent text-white transition-transform duration-300 ${
          navVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Logo + Auth */}
        <div className="flex items-center gap-3">
          <div className="font-bold text-2xl z-0 md:z-0 pointer-events-none md:pointer-events-auto max-[700px]:scale-50 max-[700px]:origin-left -ml-5 md:-ml-7 mt-4">
            <Link href="/home">
              <Image
                src="/eNnergy Logo.png"
                alt="Energy Logo"
                width={120}
                height={40}
                className="z-0"
              />
            </Link>
          </div>
          <div className="hidden lg:flex items-center gap-2 mt-4">
            <Link href="/auth/login"
              className={`px-4 py-1.5 rounded font-bold text-sm border border-white/40 hover:bg-white/20 transition ${isActive("/auth/login") ? "bg-white/20" : ""}`}>
              Login
            </Link>
            <Link href="/auth/signup"
              className={`px-4 py-1.5 rounded font-bold text-sm bg-orange-500 hover:bg-orange-600 transition ${isActive("/auth/signup") ? "opacity-90" : ""}`}>
              Sign Up
            </Link>
            <ThemeToggle className="ml-1" />
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex space-x-2 xl:space-x-6 items-center relative z-0">
          {navItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="relative">
                <button
                  onClick={() =>
                    setDropdownOpen((prev) =>
                      prev === item.label ? null : item.label
                    )
                  }
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen === item.label}
                  className={`px-2 xl:px-4 py-2 rounded font-bold text-sm xl:text-base flex items-center gap-1 transition ${
                    isActive(item.path) ? "bg-primary" : "hover:bg-white/20"
                  }`}
                >
                  {item.label}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {dropdownOpen === item.label && (
                  <div className="absolute left-0 mt-2 w-44 bg-card border border-line rounded shadow-lg z-50">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className={`block w-full text-left px-4 py-2 text-foreground hover:bg-primary hover:text-white transition ${
                          isActive(sub.path) ? "bg-primary text-white" : ""
                        }`}
                        onClick={() => setDropdownOpen(null)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.path}
                className={`px-2 xl:px-4 py-2 rounded font-bold text-sm xl:text-base transition ${
                  isActive(item.path) ? "bg-primary" : "hover:bg-white/20"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Mobile Burger */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            {menuOpen ? <HiX size={28} /> : <HiMenu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed top-0 right-0 w-2/3 h-full max-h-screen overflow-y-auto bg-card text-foreground shadow-lg flex flex-col p-6 z-[60] lg:hidden"
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="self-end mb-4 p-2 rounded-full bg-card-2 hover:bg-line text-foreground transition-colors"
            aria-label="Close menu"
          >
            <HiX size={24} />
          </button>

          <div className="flex gap-2 mb-4">
            {authItems.map((item) => (
              <Link key={item.label} href={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex-1 text-center px-4 py-2.5 rounded font-bold text-sm transition ${
                  item.label === "Sign Up"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "border border-line text-foreground hover:bg-card-2"
                }`}>
                {item.label}
              </Link>
            ))}
          </div>

          {navItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="w-full">
                <button
                  onClick={() =>
                    setDropdownOpen((prev) =>
                      prev === item.label ? null : item.label
                    )
                  }
                  className="w-full text-left px-4 py-3 rounded mb-2 text-foreground font-medium flex items-center justify-between"
                >
                  {item.label}
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {dropdownOpen === item.label && (
                  <div className="ml-4 mb-2 w-full flex flex-col gap-1">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className="block w-full text-left px-4 py-2 text-foreground hover:bg-primary hover:text-white rounded transition"
                        onClick={() => {
                          setDropdownOpen(null);
                          setMenuOpen(false);
                        }}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.path}
                className={`w-full text-left px-4 py-3 rounded mb-2 text-foreground font-medium ${
                  isActive(item.path) ? "bg-primary text-white" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}

          {/* Legal links */}
          <div className="mt-auto pt-4 border-t border-line">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-4 mb-2">Legal</p>
            {[
              { label: "Contact",             path: "/contact"              },
              { label: "About Us",            path: "/about"                },
              { label: "Terms & Conditions", path: "/terms-and-conditions" },
              { label: "Refund Policy",       path: "/refund-policy"        },
              { label: "Privacy Policy",      path: "/privacy-policy"       },
            ].map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="w-full text-left px-4 py-2.5 rounded mb-1 text-muted text-sm hover:text-orange-500 hover:bg-orange-500/10 transition flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default NavBar;
