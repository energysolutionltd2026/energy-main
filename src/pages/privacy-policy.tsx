import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import tower from "@/../public/tower.jpg";

// ─── Policy Sections ──────────────────────────────────────────────────────────

const makeSections = (platformName: string, supportEmail: string, supportPhone: string) => [
  {
    id: "information",
    title: "Information We Collect",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Personal & Business Information",
        text: "When you register or place an order through our platform, we collect your full name, company name, CAC and DPR registration numbers, email address, telephone number, head office address, and station delivery address. This information is required to process and verify your purchase orders.",
      },
      {
        subtitle: "Transaction & Payment Data",
        text: "We collect payment-related data including your bank name, account name, and transaction reference numbers. For Paystack-facilitated payments, your card or bank details are processed exclusively by Paystack and are never stored on our servers.",
      },
      {
        subtitle: "Driver & Logistics Information",
        text: "To facilitate safe and verified product delivery, we collect driver names, official ID types and numbers, truck registration details, vehicle types, and tank capacities associated with each order.",
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect certain technical data when you use our platform, including your IP address, browser type, device information, pages visited, and time spent on site. This helps us improve our services and ensure platform security.",
      },
    ],
  },
  {
    id: "use",
    title: "How We Use Your Information",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Order Processing & Fulfillment",
        text: "Your data is primarily used to process, verify, and fulfill your petroleum product purchase orders. This includes communicating order status, coordinating depot pickup or delivery logistics, and issuing receipts.",
      },
      {
        subtitle: "Identity & Compliance Verification",
        text: "As a regulated petroleum distribution business operating under DPR guidelines, we are required to verify the identity of all buyers and logistics operators. Your ID information is used solely for this compliance purpose.",
      },
      {
        subtitle: "Platform Improvement",
        text: "Aggregated and anonymized usage data helps us understand how customers interact with our platform, enabling us to improve the booking experience and product availability features.",
      },
      {
        subtitle: "Communications",
        text: "We may use your contact information to send order confirmations, delivery updates, and important notices related to your account or purchases. We do not send unsolicited marketing emails without your explicit consent.",
      },
    ],
  },
  {
    id: "sharing",
    title: "Data Sharing & Disclosure",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "We Do Not Sell Your Data",
        text: `${platformName} does not sell, rent, or trade your personal or business data to any third party for marketing or commercial purposes, under any circumstances.`,
      },
      {
        subtitle: "Service Providers",
        text: "We share limited data with trusted service providers who assist in operating our platform — including Paystack for payment processing and hosting providers for platform infrastructure. These parties are contractually bound to protect your data.",
      },
      {
        subtitle: "Regulatory & Legal Obligations",
        text: "We may disclose your information to regulatory bodies such as the DPR (Department of Petroleum Resources), EFCC, or law enforcement when required by Nigerian law or valid legal process.",
      },
      {
        subtitle: "Depot Partners",
        text: "Order-specific logistics information (driver details, truck information, product quantities) is shared with the relevant depot facility to facilitate safe and accurate product loading.",
      },
    ],
  },
  {
    id: "security",
    title: "Data Security",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Technical Safeguards",
        text: "All data transmitted through our platform is encrypted using industry-standard SSL/TLS protocols. Payment transactions are further secured through Paystack's PCI DSS-compliant infrastructure.",
      },
      {
        subtitle: "Access Controls",
        text: `Access to customer data is strictly limited to authorized ${platformName} personnel on a need-to-know basis. All staff with data access are bound by confidentiality obligations.`,
      },
      {
        subtitle: "Data Retention",
        text: "We retain your order and account data for a period of 7 years in accordance with Nigerian tax and commercial record-keeping requirements. Usage data is retained for no longer than 12 months.",
      },
    ],
  },
  {
    id: "rights",
    title: "Your Rights",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Access & Correction",
        text: `You have the right to request a copy of the personal data we hold about you, and to request corrections to any inaccurate information. Submit requests to ${supportEmail}.`,
      },
      {
        subtitle: "Deletion",
        text: "You may request deletion of your personal data where it is no longer necessary for the purposes it was collected, subject to our legal retention obligations.",
      },
      {
        subtitle: "Objection & Restriction",
        text: "You have the right to object to or request restriction of certain processing activities. Note that some restrictions may affect our ability to process your orders.",
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
        <circle cx="9.5" cy="15" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
    content: [
      {
        subtitle: "Essential Cookies",
        text: "We use essential cookies to maintain your session, remember your selected depot and product preferences, and ensure the platform functions correctly. These cannot be disabled.",
      },
      {
        subtitle: "Analytics Cookies",
        text: "With your consent, we use analytics cookies to understand how visitors use our platform. You may decline these via your browser settings without affecting core functionality.",
      },
    ],
  },
  {
    id: "updates",
    title: "Policy Updates & Contact",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Policy Changes",
        text: "We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. The effective date at the top of this page will always reflect the most recent revision. Continued use of our platform after changes constitutes acceptance.",
      },
      {
        subtitle: "Contact Our Data Team",
        text: `For any privacy-related queries, data access requests, or concerns, please contact us at ${supportEmail} or call ${supportPhone} during business hours (Mon–Fri, 8AM–6PM WAT).`,
      },
    ],
  },
];

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

const NavItem = ({
  section,
  active,
  onClick,
}: {
  section: { id: string; title: string; icon: React.ReactNode; content: { subtitle: string; text: string }[] };
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
      active
        ? "bg-orange-500 text-white font-semibold shadow-md"
        : "text-orange-100 hover:bg-white/10 hover:text-white"
    }`}
  >
    <span className={active ? "text-white" : "text-orange-300"}>{section.icon}</span>
    <span className="leading-tight">{section.title}</span>
  </button>
);

// ─── Main Privacy Policy Page ─────────────────────────────────────────────────

export default function PrivacyPolicy() {
  const [platformInfo, setPlatformInfo] = useState({ platformName: "e-Nergy Solutions Limited", supportEmail: "info@e-nergy.com.ng", supportPhone: "(+234) 08087550875" });

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setPlatformInfo({ platformName: s.platformName || "e-Nergy Solutions Limited", supportEmail: s.supportEmail || "info@e-nergy.com.ng", supportPhone: s.supportPhone || "(+234) 08087550875" });
    }).catch(() => null);
  }, []);

  const SECTIONS = makeSections(platformInfo.platformName, platformInfo.supportEmail, platformInfo.supportPhone);
  const [activeSection, setActiveSection] = useState("information");

  const current = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Privacy Policy | e-Nergy</title></Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24 pb-12">
        <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">

          {/* ── Left Sidebar ── */}
          <div className="hidden md:flex flex-col px-5 py-8 min-w-[240px] max-w-[260px] bg-gradient-to-b from-orange-800 to-orange-500">
            <div className="mb-6">
              <h1 className="text-white text-xl font-extrabold uppercase leading-snug">
                Privacy<br />Policy
              </h1>
              <p className="text-orange-200 text-[10px] mt-2 leading-relaxed">
                Effective Date: January 1, 2025
              </p>
              <div className="mt-2 h-0.5 bg-orange-500 w-12 rounded" />
            </div>

            <nav className="space-y-1 flex-1">
              {SECTIONS.map((s) => (
                <NavItem
                  key={s.id}
                  section={s}
                  active={activeSection === s.id}
                  onClick={() => setActiveSection(s.id)}
                />
              ))}
            </nav>

            <p className="text-orange-300 text-[10px] italic mt-6 leading-relaxed">
              {platformInfo.platformName} is committed to protecting the privacy and
              security of your personal and business data.
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200 my-6" />

          {/* ── Right: Content ── */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>

            {/* Mobile section picker */}
            <div className="md:hidden mb-6">
              <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                Jump to Section
              </label>
              <select
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
              >
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                {current.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{current.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Section {SECTIONS.findIndex((s) => s.id === activeSection) + 1} of {SECTIONS.length}
                </p>
              </div>
            </div>

            {/* Section Content */}
            <div className="space-y-6">
              {current.content.map((block) => (
                <div key={block.subtitle}>
                  <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-1.5">
                    {block.subtitle}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{block.text}</p>
                </div>
              ))}
            </div>

            {/* Navigation between sections */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
              {SECTIONS.findIndex((s) => s.id === activeSection) > 0 ? (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                    setActiveSection(SECTIONS[idx - 1].id);
                  }}
                  className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition"
                >
                  ‹ Previous
                </button>
              ) : <div />}

              {SECTIONS.findIndex((s) => s.id === activeSection) < SECTIONS.length - 1 ? (
                <button
                  onClick={() => {
                    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                    setActiveSection(SECTIONS[idx + 1].id);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all"
                >
                  Next ›
                </button>
              ) : (
                <div className="px-6 py-2 bg-green-500 text-white text-sm font-bold rounded">
                  ✓ End of Policy
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
          <Footer />
    </div>
  );
}
