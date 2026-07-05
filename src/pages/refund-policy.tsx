import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import tower from "@/../public/tower.jpg";

// ─── Policy Sections ──────────────────────────────────────────────────────────

const makeSections = (platformName: string, supportEmail: string, supportPhone: string) => [
  {
    id: "introduction",
    title: "Introduction",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Overview",
        text: `${platformName} is committed to fair and transparent financial dealings with all customers and partners. This Refund Policy outlines the conditions under which refunds may be requested, processed, and disbursed for transactions conducted through our platform.`,
      },
      {
        subtitle: "Purchase Orders",
        text: "Refunds for petroleum product purchase orders are governed by the stage of order fulfilment at the time of the request. Orders that have not yet reached the loading stage are eligible for a full refund, subject to verification.",
      },
      {
        subtitle: "Truck Rentals",
        text: "Truck rental bookings are subject to a tiered cancellation and refund schedule based on how far in advance the cancellation is made relative to the confirmed pickup or delivery time.",
      },
      {
        subtitle: "Union Dues",
        text: "Payments made toward Union Dues are treated as non-refundable contributions in most circumstances, except in cases of verified duplicate or erroneous payments, which will be reviewed and refunded in full.",
      },
    ],
  },
  {
    id: "eligibility",
    title: "Refund Eligibility",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Purchase Orders",
        text: "A full refund is available for purchase orders that have been confirmed and paid for, but where loading has not yet commenced at the depot. Once a product has been loaded onto a truck, the transaction is considered fulfilled and is no longer eligible for a refund.",
      },
      {
        subtitle: "Truck Rentals",
        text: "Truck rental cancellations made more than 48 hours before the scheduled pickup are eligible for a 100% refund. Cancellations made between 24 and 48 hours in advance qualify for a 50% refund. Cancellations made less than 24 hours before the scheduled time are non-refundable.",
      },
      {
        subtitle: "Union Dues",
        text: "Union Dues payments are non-refundable. The only exception is where a customer provides evidence of a duplicate payment or a payment processed in error, in which case the duplicate amount will be refunded in full after verification.",
      },
      {
        subtitle: "Bookings (Depot & Loading Slots)",
        text: "Booking deposits may be refunded in full if a cancellation is submitted with at least 24 hours' notice before the scheduled loading or booking time. Deposits forfeited due to late cancellations or no-shows are non-refundable.",
      },
    ],
  },
  {
    id: "non-refundable",
    title: "Non-Refundable Items",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Completed Deliveries",
        text: "Payments for deliveries that have been fully completed — where the product has been loaded, dispatched, and received at the destination — are not eligible for a refund under any standard circumstances.",
      },
      {
        subtitle: "Loaded Products",
        text: "Once petroleum products have been loaded onto a truck at the depot and a delivery waybill has been issued, the transaction is considered complete and no refund will be processed.",
      },
      {
        subtitle: "Processed Union Dues",
        text: "Union Dues that have been successfully processed and allocated are non-refundable. Members should ensure accuracy of payment details before submission.",
      },
      {
        subtitle: "Administrative & Processing Fees",
        text: "Platform service charges, administrative fees, and third-party payment processing fees (including those charged by Paystack, GlobalPay, or OPay) are non-refundable in all circumstances.",
      },
      {
        subtitle: "Late Refund Claims",
        text: "Refund requests submitted more than 30 days after the transaction date will not be entertained. Customers are advised to review all transactions promptly and raise disputes or refund requests within this window.",
      },
    ],
  },
  {
    id: "process",
    title: "Refund Request Process",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "How to Submit a Refund Request",
        text: `Refund requests may be submitted directly through the ${platformName} platform via the Orders or Transactions section, or by sending an email to ${supportEmail}. Requests submitted by email must use the subject line format: Refund Request – [Order ID].`,
      },
      {
        subtitle: "Required Documentation",
        text: "To process your request, you must provide: (1) your Order ID or Transaction Reference, (2) proof of payment (screenshot or receipt), and (3) a clear written reason for the refund request. Incomplete submissions may delay processing.",
      },
      {
        subtitle: "Verification & Review",
        text: `Our finance team will review your submission and may contact you for additional information. All refund requests are subject to internal verification against platform transaction records before approval is granted. You can also reach us at ${supportPhone} during business hours (Mon–Fri, 8AM–6PM WAT).`,
      },
    ],
  },
  {
    id: "timelines",
    title: "Refund Timelines",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Review Period",
        text: "Once a refund request is submitted with all required documentation, our team will complete the initial review within 5–7 business days. You will receive an email notification of approval or rejection during this period.",
      },
      {
        subtitle: "Processing Period",
        text: "Approved refunds will be processed within 7–14 business days from the date of approval, subject to the payment method used for the original transaction.",
      },
      {
        subtitle: "Refund Timeline by Payment Method",
        text: "The following timelines apply once a refund has been approved and initiated:",
        table: [
          { method: "GlobalPay / Paystack (Card)", timeline: "7–14 business days" },
          { method: "Bank Transfer", timeline: "5–10 business days" },
          { method: "OPay", timeline: "3–7 business days" },
        ],
      },
    ],
  },
  {
    id: "partial",
    title: "Partial Refunds",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Quantity Shortfalls",
        text: "Where a delivery is confirmed to have been short-loaded — meaning fewer litres were loaded and delivered than were ordered and paid for — a partial refund will be calculated based on the unit price multiplied by the number of undelivered litres. Evidence of the shortfall must be provided in the refund request.",
      },
      {
        subtitle: "Service Downgrades",
        text: "If a booked service level (such as a specific truck capacity or a premium loading slot) is unavailable at the time of fulfilment and a lower-tier service is substituted without prior customer consent, a partial refund representing the price difference between the booked and delivered service will be issued.",
      },
    ],
  },
  {
    id: "disputes",
    title: "Chargebacks & Disputes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Contact Us Before Initiating a Chargeback",
        text: `${platformName} strongly encourages customers to contact our support team at ${supportEmail} or ${supportPhone} before filing a chargeback with their bank or payment provider. Most disputes can be resolved faster through direct communication than through the formal chargeback process.`,
      },
      {
        subtitle: "Acknowledgement Timeline",
        text: "Upon receipt of a formal dispute or chargeback notification, our team will acknowledge the claim within 2 business days and begin gathering the relevant transaction records for review.",
      },
      {
        subtitle: "Resolution Timeline",
        text: "We are committed to resolving all chargebacks and payment disputes within 10 business days of acknowledgement. Where additional documentation is required from the customer, the resolution clock will pause until the requested information is received.",
      },
    ],
  },
  {
    id: "exceptions",
    title: "Exceptions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Force Majeure",
        text: `${platformName} shall not be held liable for delays or non-fulfilment of refunds caused by events beyond our reasonable control, including but not limited to natural disasters, civil unrest, nationwide grid or telecommunications failures, or acts of God. In such cases, refund timelines will be extended accordingly and customers will be notified.`,
      },
      {
        subtitle: "Government & Regulatory Changes",
        text: "Sudden changes in government policy, petroleum sector regulations, or pricing directives issued by the NNPCL, DPR, or other regulatory authorities may affect transaction terms. Where such changes render a transaction unfulfillable, affected customers will be offered a full refund or an alternative order at the revised pricing.",
      },
      {
        subtitle: "Product Quality Issues",
        text: `If a customer receives petroleum products that are demonstrably below the contracted quality specification, the issue must be reported to ${supportEmail} within 48 hours of delivery, along with supporting evidence such as a lab test result or third-party inspection report. Quality dispute refunds will be assessed on a case-by-case basis.`,
      },
    ],
  },
  {
    id: "updates",
    title: "Policy Updates",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Notice of Changes",
        text: `${platformName} reserves the right to update or amend this Refund Policy at any time. Where material changes are made, we will provide at least 14 days' notice by posting the updated policy on our platform and, where applicable, notifying registered users by email.`,
      },
      {
        subtitle: "Acceptance Through Continued Use",
        text: "Continued use of the platform after the effective date of any policy update constitutes your acceptance of the revised Refund Policy. Customers who do not accept the updated terms should discontinue use of the platform and contact our support team to settle any outstanding transactions.",
      },
    ],
  },
];

// ─── Table Component (for Timelines section) ─────────────────────────────────

const RefundTable = ({ rows }: { rows: { method: string; timeline: string }[] }) => (
  <div className="mt-3 overflow-hidden rounded-lg border border-orange-200">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-orange-50">
          <th className="text-left px-4 py-2.5 font-bold text-orange-700 border-b border-orange-200">
            Payment Method
          </th>
          <th className="text-left px-4 py-2.5 font-bold text-orange-700 border-b border-orange-200">
            Estimated Timeline
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-orange-50/40"}>
            <td className="px-4 py-2.5 text-gray-700">{row.method}</td>
            <td className="px-4 py-2.5 text-gray-600">{row.timeline}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

type SectionType = ReturnType<typeof makeSections>[number];

const NavItem = ({
  section,
  active,
  onClick,
}: {
  section: SectionType;
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

// ─── Main Refund Policy Page ──────────────────────────────────────────────────

export default function RefundPolicy() {
  const [platformInfo, setPlatformInfo] = useState({
    platformName: "e-Nergy Solutions Limited",
    supportEmail: "info@e-nergy.com.ng",
    supportPhone: "(+234) 08087550875",
  });

  useEffect(() => {
    import("@/lib/db-client")
      .then(({ api }) => api.platformSettings.get())
      .then((s) => {
        if (!s) return;
        setPlatformInfo({
          platformName: s.platformName || "e-Nergy Solutions Limited",
          supportEmail: s.supportEmail || "info@e-nergy.com.ng",
          supportPhone: s.supportPhone || "(+234) 08087550875",
        });
      })
      .catch(() => null);
  }, []);

  const SECTIONS = makeSections(
    platformInfo.platformName,
    platformInfo.supportEmail,
    platformInfo.supportPhone
  );

  const [activeSection, setActiveSection] = useState("introduction");

  const current = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head>
        <title>Refund Policy | e-Nergy</title>
      </Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24 pb-12">
        <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">

          {/* ── Left Sidebar ── */}
          <div className="hidden md:flex flex-col px-5 py-8 min-w-[240px] max-w-[260px] bg-gradient-to-b from-orange-800 to-orange-500">
            <div className="mb-6">
              <h1 className="text-white text-xl font-extrabold uppercase leading-snug">
                Refund<br />Policy
              </h1>
              <p className="text-orange-200 text-[10px] mt-2 leading-relaxed">
                Effective Date: January 1, 2025
              </p>
              <div className="mt-2 h-0.5 bg-orange-300 w-12 rounded" />
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
              {platformInfo.platformName} is committed to fair and transparent
              refund practices for all transactions.
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200 my-6" />

          {/* ── Right: Content ── */}
          <div
            className="flex-1 p-6 md:p-8 overflow-y-auto"
            style={{ maxHeight: "85vh" }}
          >
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
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
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
                  Section {SECTIONS.findIndex((s) => s.id === activeSection) + 1} of{" "}
                  {SECTIONS.length}
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
                  {"table" in block && block.table && (
                    <RefundTable rows={block.table} />
                  )}
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
              ) : (
                <div />
              )}

              {SECTIONS.findIndex((s) => s.id === activeSection) <
              SECTIONS.length - 1 ? (
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
    </div>
  );
}
