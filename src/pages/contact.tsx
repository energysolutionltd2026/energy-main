import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import tower from "@/../public/tower.jpg";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactForm {
  fullName: string;
  companyName: string;
  email: string;
  telephone: string;
  subject: string;
  message: string;
}

// ─── Shared Styles (mirrors buynow.tsx) ───────────────────────────────────────

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder-gray-400 bg-white";

const selectClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition bg-white";

const Field = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
      {label}
    </label>
    {children}
  </div>
);

// ─── Contact Info Icon components ────────────────────────────────────────────

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5s1 2 5 5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const AddressIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Subject Options ──────────────────────────────────────────────────────────

const SUBJECTS = [
  "Product Enquiry",
  "Depot Availability",
  "Pricing & Quotation",
  "Delivery & Logistics",
  "Partnership / Business",
  "Complaint / Feedback",
  "Other",
];

// ─── Main Contact Page ────────────────────────────────────────────────────────

export default function Contact() {
  const [formData, setFormData] = useState<ContactForm>({
    fullName: "",
    companyName: "",
    email: "",
    telephone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    phone: "(+234) 08087550875",
    email: "info@pipesandbarrels.com",
    address: "124, Marwa Road, Depot Bus-Stop, Ijegun Waterside, Lagos.",
  });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setIsLoggedIn(true); })
      .catch(() => null);
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setContactInfo({
        phone: s.supportPhone || "(+234) 08087550875",
        email: s.supportEmail || "info@pipesandbarrels.com",
        address: s.businessAddress || "124, Marwa Road, Depot Bus-Stop, Ijegun Waterside, Lagos.",
      });
    }).catch(() => null);
  }, []);

  const update = (d: Partial<ContactForm>) =>
    setFormData((f) => ({ ...f, ...d }));

  const handleSubmit = async () => {
    const { api } = await import("@/lib/db-client");
    await api.notifications.create({
      recipientEmail: contactInfo.email,
      recipientRole: "admin",
      title: `Contact: ${formData.subject || "General Enquiry"} — ${formData.fullName}`,
      message: `From: ${formData.fullName}${formData.companyName ? ` (${formData.companyName})` : ""}\nEmail: ${formData.email}\nPhone: ${formData.telephone}\n\n${formData.message}`,
      reference: formData.email,
    });
    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Contact Us | e-Nergy</title></Head>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24 pb-12">
        {submitted ? (
          /* ── Success Card ── */
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 p-10 max-w-md w-full text-center space-y-4">
            <div className="text-6xl">📬</div>
            <h2 className="text-2xl font-bold text-gray-800">Message Sent!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Thank you for reaching out to{" "}
              <span className="font-semibold text-orange-500">Pipes &amp; Barrels</span>. A member of
              our team will respond to your enquiry within <span className="font-semibold">24–48 hours</span>.
            </p>
            <button
              onClick={() => { setSubmitted(false); setFormData({ fullName: "", companyName: "", email: "", telephone: "", subject: "", message: "" }); }}
              className="mt-4 px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          /* ── Main Card ── */
          <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">

            {/* ── Left Sidebar ── */}
            <div className="hidden md:flex flex-col justify-between px-8 py-8 min-w-[240px] max-w-[260px] bg-gradient-to-b from-orange-800 to-orange-500">
              {/* Branding */}
              <div>
                {isLoggedIn && (
                  <Link href="/customer/TransactionHistory" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-semibold px-3 py-2 rounded-full transition mb-4">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                  </Link>
                )}
                <h1 className="text-white text-xl font-extrabold uppercase leading-snug mb-3">
                  Get In<br />Touch With<br />Us Today
                </h1>
                <p className="text-orange-100 text-xs italic leading-relaxed">
                  Have a question about depot availability, pricing, or delivery logistics?
                  We&apos;re here to help.
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-5 mt-8">
                {[
                  { label: "Phone", icon: <PhoneIcon />, value: contactInfo.phone },
                  { label: "Email", icon: <EmailIcon />, value: contactInfo.email },
                  { label: "Head Office", icon: <AddressIcon />, value: contactInfo.address },
                  { label: "Business Hours", icon: <ClockIcon />, value: "Mon – Fri: 8:00 AM – 6:00 PM (WAT)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-orange-200 mt-0.5 shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-orange-200 text-[10px] font-semibold uppercase tracking-widest">
                        {item.label}
                      </p>
                      <p className="text-white text-xs leading-snug mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom note */}
              <p className="text-orange-200 text-[10px] italic mt-8 leading-relaxed">
                Purchases within 48 hours of order placement require prior authorization.
              </p>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px bg-gray-200 my-6" />

            {/* ── Right: Form ── */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
                <p className="text-sm italic text-gray-500 mt-1">
                  Fill in the form below and our team will get back to you as soon as possible.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input
                      className={inputClass}
                      placeholder="e.g. Adebayo Okafor"
                      value={formData.fullName}
                      onChange={(e) => update({ fullName: e.target.value })}
                    />
                  </Field>
                  <Field label="Company Name">
                    <input
                      className={inputClass}
                      placeholder="e.g. Chipet Oil Ltd"
                      value={formData.companyName}
                      onChange={(e) => update({ companyName: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email Address">
                    <input
                      className={inputClass}
                      type="email"
                      placeholder="info@yourcompany.com"
                      value={formData.email}
                      onChange={(e) => update({ email: e.target.value })}
                    />
                  </Field>
                  <Field label="Telephone">
                    <input
                      className={inputClass}
                      placeholder="(+234) 080 0000 0000"
                      value={formData.telephone}
                      onChange={(e) => update({ telephone: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Subject */}
                <Field label="Subject">
                  <select
                    className={selectClass}
                    value={formData.subject}
                    onChange={(e) => update({ subject: e.target.value })}
                  >
                    <option value="">select a subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                {/* Message */}
                <Field label="Message">
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={5}
                    placeholder="Write your message here..."
                    value={formData.message}
                    onChange={(e) => update({ message: e.target.value })}
                  />
                </Field>

                {/* Notice */}
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Response Time</p>
                  All enquiries are responded to within 24–48 business hours. For urgent matters
                  regarding active orders, please call us directly on{" "}
                  <span className="font-semibold text-orange-600">{contactInfo.phone}</span>.
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all"
                >
                  Send Message →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
