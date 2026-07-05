import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import tower from "@/../public/tower.jpg";

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "11+", label: "Depot Locations" },
  { value: "3", label: "Product Types" },
  { value: "₦B+", label: "Transactions Facilitated" },
  { value: "24h", label: "Order Response Time" },
];

// ─── Core Values ──────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Integrity",
    text: "We operate with full transparency in pricing, depot availability, and regulatory compliance — no hidden charges, no compromises.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Efficiency",
    text: "Our digital booking platform cuts out unnecessary delays, enabling businesses to purchase and schedule fuel delivery faster than ever before.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Partnership",
    text: "We view every client as a long-term partner. From small filling stations to large fleet operators, we provide tailored solutions for every scale.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Reach",
    text: "With depots spanning Lagos, Abuja, Port Harcourt, Kano, Warri, and more, we maintain a national distribution network that keeps Nigeria moving.",
  },
];

// ─── Team ─────────────────────────────────────────────────────────────────────

const TEAM = [
  {
    initials: "MD",
    name: "Ezeokwuosa Ugochukwu ",
    role: "Chief Executive Officer",
    bio: "20+ years in petroleum distribution and downstream oil & gas operations across West Africa.",
    color: "bg-orange-500",
  },
  {
    initials: "GM",
    name: "Akinrimisi Israel",
    role: "UI Designer",
    bio: "Managing director with over 20 years of experience in the Nigerian petroleum distribution industry, overseeing operations, strategy, and growth across multiple depot locations.",
    color: "bg-orange-700",
  },
  {
    initials: "CTO",
    name: "Agbakosi Adeoluwa",
    role: "Chief Technology Officer",
    bio: "Chief Technology Officer with over 10 years of experience in building scalable web and mobile applications.",
    color: "bg-orange-400",
  },
  {
    initials: "Developer 1",
    name: "Oke Oluwajomiloju",
    role: "Front-end Developer",
    bio: "Dedicated to building lasting and beautiful web applications.",
    color: "bg-orange-600",
  },
  {
    initials: "Developer 2",
    name: "James Doe Shehu",
    role: "Full-Stack Developer",
    bio: "Dedicated to building lasting and beautiful web applications and database management systems.",
    color: "bg-orange-600",
  },
  {
    initials: "Admin",
    name: "Chinedu Ngozi Veronica",
    role: "Admin assistant",
    bio: "Dedicated to maintaining seamless operations and client satisfaction across all our depot locations.",
    color: "bg-orange-600",
  },
];

// ─── Milestones ───────────────────────────────────────────────────────────────

const MILESTONES = [
  { year: "2011", event: "e-Nergy Solutions Limited founded in Lagos with a single depot partnership." },
  { year: "2014", event: "Expanded operations to Port Harcourt and Warri, covering the Niger Delta region." },
  { year: "2017", event: "Achieved DPR full licensing for AGO, PMS, and ATK distribution." },
  { year: "2019", event: "Launched nationwide depot network with 8 active distribution hubs." },
  { year: "2022", event: "Introduced digital booking platform, reducing order turnaround by 60%." },
  { year: "2024", event: "Reached 11 active depot locations, spanning all major geopolitical zones of Nigeria." },
];

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "story" | "values" | "team" | "milestones";

const TABS: { id: Tab; label: string }[] = [
  { id: "story", label: "Our Story" },
  { id: "values", label: "Core Values" },
  { id: "team", label: "Our Team" },
  { id: "milestones", label: "Milestones" },
];

// ─── Main About Us Page ───────────────────────────────────────────────────────

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState<Tab>("story");
  const [platformInfo, setPlatformInfo] = useState({
    platformName: "e-Nergy Solutions Limited",
    tagline: "Nigeria's trusted downstream petroleum distribution partner since 2011.",
    businessAddress: "Ijegun Waterside, Lagos",
    rcNumber: "RC 123456",
    supportEmail: "info@e-nergy.com.ng",
    supportPhone: "(+234) 08087550875",
  });

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setPlatformInfo({
        platformName: s.platformName || "e-Nergy Solutions Limited",
        tagline: s.tagline || "Nigeria's trusted downstream petroleum distribution partner since 2011.",
        businessAddress: s.businessAddress || "Ijegun Waterside, Lagos",
        rcNumber: s.rcNumber || "RC 123456",
        supportEmail: s.supportEmail || "info@e-nergy.com.ng",
        supportPhone: s.supportPhone || "(+234) 08087550875",
      });
    }).catch(() => null);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>About Us | e-Nergy</title></Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24 pb-12">
        <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">

          {/* ── Left Sidebar ── */}
          <div className="hidden md:flex flex-col px-6 py-8 min-w-[240px] max-w-[260px] bg-gradient-to-b from-orange-800 to-orange-500">
            <div className="mb-8">
              <h1 className="text-white text-xl font-extrabold uppercase leading-snug">
                About<br />{platformInfo.platformName}
              </h1>
              <div className="mt-3 h-0.5 bg-orange-400 w-12 rounded" />
              <p className="text-orange-200 text-xs mt-3 leading-relaxed italic">
                {platformInfo.tagline}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-white text-xl font-extrabold leading-none">{stat.value}</p>
                  <p className="text-orange-200 text-[10px] mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Contact Snippet */}
            <div className="mt-auto space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-300 text-base">✉</span>
                <span className="text-orange-100 text-xs">{platformInfo.supportEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-300 text-base">📞</span>
                <span className="text-orange-100 text-xs">{platformInfo.supportPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-300 text-base">📍</span>
                <span className="text-orange-100 text-xs">{platformInfo.businessAddress}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200 my-6" />

          {/* ── Right: Tabbed Content ── */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>

            {/* Tab Bar */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-orange-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Story Tab ── */}
            {activeTab === "story" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Our Story</h2>
                  <p className="text-sm italic text-gray-500 mt-1">
                    Built on the foundation of reliable energy supply for a growing nation.
                  </p>
                </div>

                <div className="rounded-lg bg-gradient-to-r from-orange-700 via-orange-500 to-orange-300 p-5 text-white">
                  <p className="text-base font-bold leading-snug">
                    &ldquo;We believe that access to reliable, competitively priced petroleum products should not be a privilege — it should be a given for every Nigerian business.&rdquo;
                  </p>
                  <p className="text-orange-100 text-xs mt-2 font-semibold">— Adekunle Okafor, CEO</p>
                </div>

                <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                  <p>
                    e-Nergy Solutions Limited was founded in 2011 with a simple mission: to make the purchase and delivery of petroleum products in Nigeria faster, fairer, and more transparent. What began as a single depot partnership in Lagos has grown into a nationwide platform serving filling station operators, industrial buyers, aviation clients, and fleet managers across all six geopolitical zones.
                  </p>
                  <p>
                    Nigeria&apos;s downstream petroleum sector has long been characterised by opacity — unpredictable pricing, unreliable depot availability, and manual, paper-heavy booking processes that cost businesses valuable time and money. We set out to change that. By building direct relationships with terminal operators and investing in digital infrastructure, we created a platform where buyers can see real-time product availability, transparent pricing, and book deliveries in minutes.
                  </p>
                  <p>
                    Today, we operate across 11 depot locations including Lagos Main Depot, Abuja Central Terminal, Port Harcourt Terminal, Kano Distribution Hub, Warri Storage Facility, and others — covering AGO (diesel), PMS (petrol), and ATK (aviation turbine kerosene). Our fully licensed operations are DPR-compliant, and our digital booking system has reduced average order turnaround time by over 60% compared to traditional methods.
                  </p>
                  <p>
                    We are more than a commodity distributor. We are an infrastructure partner for Nigerian businesses that depend on consistent fuel supply to operate, grow, and serve their own customers.
                  </p>
                </div>
              </div>
            )}

            {/* ── Values Tab ── */}
            {activeTab === "values" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Core Values</h2>
                  <p className="text-sm italic text-gray-500 mt-1">
                    The principles that guide every decision we make.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VALUES.map((v) => (
                    <div
                      key={v.title}
                      className="rounded-lg border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-500 group-hover:bg-orange-600 flex items-center justify-center text-white mb-3 transition-colors">
                        {v.icon}
                      </div>
                      <h3 className="font-bold text-gray-800 text-base mb-1">{v.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{v.text}</p>
                    </div>
                  ))}
                </div>

                {/* Notice-style mission statement */}
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Our Mission</p>
                  To power Nigeria&apos;s businesses with reliable, competitively priced petroleum products through a transparent, fully digital distribution platform — reducing friction, ensuring compliance, and building lasting energy partnerships.
                </div>
              </div>
            )}

            {/* ── Team Tab ── */}
            {activeTab === "team" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Our Team</h2>
                  <p className="text-sm italic text-gray-500 mt-1">
                    Experienced professionals committed to keeping Nigeria&apos;s energy supply chain moving.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TEAM.map((member) => (
                    <div
                      key={member.name}
                      className="rounded-lg border border-gray-200 p-5 flex gap-4 hover:border-orange-300 hover:shadow-md transition-all"
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full ${member.color} flex items-center justify-center text-white font-extrabold text-sm shrink-0`}>
                        {member.initials}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{member.name}</p>
                        <p className="text-xs text-orange-500 font-semibold tracking-wide uppercase mb-1.5">
                          {member.role}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Join Our Team</p>
                  We&apos;re always looking for talented professionals passionate about Nigeria&apos;s energy sector.
                  Send your CV to{" "}
                  <span className="font-semibold text-orange-600">careers@energy.ng</span>
                </div>
              </div>
            )}

            {/* ── Milestones Tab ── */}
            {activeTab === "milestones" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Our Milestones</h2>
                  <p className="text-sm italic text-gray-500 mt-1">
                    Over a decade of growth, expansion, and innovation.
                  </p>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-orange-200" />

                  <div className="space-y-4">
                    {MILESTONES.map((m, i) => (
                      <div key={m.year} className="flex gap-4 items-start relative">
                        {/* Year badge */}
                        <div className={`shrink-0 w-20 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-sm z-10 ${
                          i === MILESTONES.length - 1
                            ? "bg-orange-500 text-white"
                            : "bg-white border-2 border-orange-400 text-orange-600"
                        }`}>
                          {m.year}
                        </div>
                        {/* Event */}
                        <div className={`flex-1 rounded-lg p-3 border text-sm leading-relaxed text-gray-600 ${
                          i === MILESTONES.length - 1
                            ? "border-orange-300 bg-orange-50 font-medium"
                            : "border-gray-200 bg-white"
                        }`}>
                          {m.event}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Looking Ahead</p>
                  Our roadmap includes expanding into LPG distribution, real-time depot telemetry for customers,
                  and international partnerships with West African terminal operators by 2026.
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-xs text-gray-400 italic">
                {platformInfo.platformName} · {platformInfo.rcNumber} · DPR Licensed
              </p>
              <Link
                href="/contact"
                className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all text-center"
              >
                Contact Us →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
