"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import tower from "@/../public/tower.jpg";

interface DealerProfile {
  name: string; email: string; phone: string; role: string;
  companyName: string; rcNumber: string; dprLicence: string; tinNumber: string;
  headOfficeAddress: string; state: string; lga: string;
  officialIdType: string; idNumber: string; idIssueDate: string; idExpiryDate: string; idIssuingAuthority: string;
  bankName: string; accountName: string; accountNumber: string; bankBranch: string;
  password: string;
}

const EMPTY: DealerProfile = {
  name: "", email: "", phone: "", role: "Bulk Dealer",
  companyName: "", rcNumber: "", dprLicence: "", tinNumber: "",
  headOfficeAddress: "", state: "", lga: "",
  officialIdType: "", idNumber: "", idIssueDate: "", idExpiryDate: "", idIssuingAuthority: "",
  bankName: "", accountName: "", accountNumber: "", bankBranch: "",
  password: "",
};

const MOCK_IDENTITY = {
  officialIdType: "", idNumber: "",
  idIssueDate: "", idExpiryDate: "",
  idIssuingAuthority: "",
};

const ID_TYPE_LABELS: Record<string, string> = {
  "nin": "National Identity Number (NIN)", "nimc-slip": "NIMC Enrolment Slip",
  "passport": "International Passport", "drivers-license": "Driver's License (FRSC)",
  "voters-card": "Permanent Voter's Card (PVC)", "bvn": "Bank Verification Number (BVN)",
  "tin": "Tax Identification Number (TIN)", "nysc": "NYSC Discharge / Exemption Certificate",
  "birth-certificate": "Birth Certificate", "cac": "CAC Business Registration Certificate",
  "lasrra": "Lagos Resident Registration Card (LASRRA)", "lagos-id": "Lagos State ID Card",
  "government-staff-id": "Government Staff ID Card", "military-id": "Military / Police ID Card",
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","Abuja (FCT)",
];

const NIGERIAN_BANKS = [
  "Access Bank","Citibank Nigeria","Ecobank Nigeria","Fidelity Bank","First Bank of Nigeria",
  "First City Monument Bank (FCMB)","Guaranty Trust Bank (GTB)","Heritage Bank","Jaiz Bank",
  "Keystone Bank","Kuda Bank","Opay","Moniepoint","PalmPay","Polaris Bank","Premium Trust Bank",
  "Providus Bank","Stanbic IBTC Bank","Standard Chartered Bank","Sterling Bank","SunTrust Bank",
  "Titan Trust Bank","Union Bank of Nigeria","United Bank for Africa (UBA)","Unity Bank",
  "Wema Bank","Zenith Bank",
];

const inputCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition text-sm";
const selectCls = "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition text-sm";
const labelCls  = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1";
const sectionHd = "text-base font-bold text-white mb-4 pb-2 border-b border-gray-800";

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ setToast }: { setToast: (msg: string) => void }) {
  const [fields, setFields] = useState({ current: "", next: "", confirm: "" });
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setError("");
    if (!fields.current) { setError("Please enter your current password."); return; }
    if (fields.next.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (fields.next !== fields.confirm) { setError("New passwords do not match."); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: fields.current, password: fields.next }),
      });
      if (!r.ok) { setError("Current password is incorrect."); return; }
      setFields({ current: "", next: "", confirm: "" });
      setToast("Password updated successfully!");
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-5">
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
        Password changes take effect on your next login.
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {[
        { lbl: "Current Password", key: "current" as const },
        { lbl: "New Password",     key: "next"    as const },
        { lbl: "Confirm Password", key: "confirm" as const },
      ].map(({ lbl, key }) => (
        <div key={key}>
          <label className={labelCls}>{lbl}</label>
          <input
            type="password"
            value={fields[key]}
            onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            className={inputCls}
            placeholder="••••••••"
          />
        </div>
      ))}
      <button onClick={handleUpdate} disabled={saving} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
        {saving ? "Updating…" : "Update Password"}
      </button>
    </div>
  );
}

export default function BulkDealerProfile() {
  const router = useRouter();
  const [user, setUser]         = useState<any>(null);
  const [profile, setProfile]   = useState<DealerProfile>(EMPTY);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState<DealerProfile>(EMPTY);
  const [toast, setToast]       = useState("");
  const [activeTab, setActiveTab] = useState("Business");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "bulk_dealer") { router.push("/auth/login"); return; }
        setUser(u);
        const base: DealerProfile = {
          ...EMPTY, name: u.name || "", email: u.email || "", role: u.role,
          phone: u.phone || "", companyName: u.companyName || "",
          rcNumber: u.rcNumber || "", dprLicence: u.dprLicence || "",
          tinNumber: u.tinNumber || "", headOfficeAddress: u.headOfficeAddress || "",
          state: u.state || "", lga: u.lga || "",
          bankName: u.bankName || "", accountName: u.accountName || "",
          accountNumber: u.accountNumber || "", bankBranch: u.bankBranch || "",
        };
        setProfile(base);
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  const startEdit = () => { setDraft(profile); setEditing(true); };
  const cancel    = () => setEditing(false);
  const save = () => {
    setProfile(draft);
    setEditing(false);
    setToast("Profile updated successfully!");
    setTimeout(() => setToast(""), 2500);
    if (user?._id) {
      import("@/lib/db-client").then(({ api }) => {
        const { password: _pw, role: _r, ...patch } = draft;
        api.users.update(user._id, patch).catch(() => null);
      });
    }
  };

  const f = editing ? draft : profile;
  const set = (k: keyof DealerProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft({ ...draft, [k]: e.target.value });

  if (!user) return null;

  const TABS = ["Business", "Address", "Identity", "Bank Details", "Security"];

  return (
    <div className="min-h-screen text-white relative"
      style={{ backgroundImage: `url(${tower.src})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <Head><title>Dealer Profile | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link href="/bulk-dealer/dashboard">
            <Image src="/eNnergy Logo.png" alt="e-Nergy" width={70} height={46} priority
              className="object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/bulk-dealer/dashboard" className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-4 py-2 rounded-lg transition">
              ← Dashboard
            </Link>
            <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"))}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 pb-10 max-w-4xl mx-auto w-full">
          {toast && <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold shadow-lg">{toast}</div>}

          {/* Profile header card */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-white truncate">{profile.name}</p>
              <p className="text-sm text-gray-400 truncate">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">{profile.companyName} · {profile.dprLicence}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40 shrink-0">Bulk Dealer</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === t ? "bg-green-600 text-white" : "bg-gray-800/60 text-gray-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <p className={sectionHd.replace("mb-4 pb-2 border-b border-gray-800", "")}>{activeTab} Information</p>
              {!editing
                ? <button onClick={startEdit} className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">Edit</button>
                : <div className="flex gap-2">
                    <button onClick={save}   className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">Save</button>
                    <button onClick={cancel} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 transition">Cancel</button>
                  </div>
              }
            </div>

            {/* ── Business ── */}
            {activeTab === "Business" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: "Full Name",       key: "name"        as const },
                  { label: "Email Address",   key: "email"       as const },
                  { label: "Phone Number",    key: "phone"       as const },
                  { label: "Company Name",    key: "companyName" as const },
                  { label: "CAC RC Number",   key: "rcNumber"    as const },
                  { label: "DPR Licence No.", key: "dprLicence"  as const },
                  { label: "TIN Number",      key: "tinNumber"   as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    {editing
                      ? <input value={draft[key]} onChange={set(key)} className={inputCls} />
                      : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile[key] || "—"}</p>
                    }
                  </div>
                ))}
              </div>
            )}

            {/* ── Address ── */}
            {activeTab === "Address" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelCls}>Head Office Address</label>
                  {editing
                    ? <input value={draft.headOfficeAddress} onChange={set("headOfficeAddress")} className={inputCls} />
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.headOfficeAddress || "—"}</p>
                  }
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  {editing
                    ? <select value={draft.state} onChange={set("state")} className={selectCls}>
                        <option value="">Select state…</option>
                        {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.state || "—"}</p>
                  }
                </div>
                <div>
                  <label className={labelCls}>LGA</label>
                  {editing
                    ? <input value={draft.lga} onChange={set("lga")} className={inputCls} />
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.lga || "—"}</p>
                  }
                </div>
              </div>
            )}

            {/* ── Identity ── */}
            {activeTab === "Identity" && (
              <div className="space-y-5">
                {!editing && profile.idNumber && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-4 items-start mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-600/30 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-green-400 font-bold text-sm mb-2">Verified Identity on File</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <span className="text-gray-500">ID Type</span><span className="text-white">{ID_TYPE_LABELS[profile.officialIdType] ?? profile.officialIdType}</span>
                        <span className="text-gray-500">ID Number</span><span className="text-white font-mono">{profile.idNumber}</span>
                        <span className="text-gray-500">Issue Date</span><span className="text-white">{profile.idIssueDate}</span>
                        <span className="text-gray-500">Expiry Date</span><span className="text-white">{profile.idExpiryDate}</span>
                        <span className="text-gray-500">Issuing Authority</span><span className="text-white">{profile.idIssuingAuthority}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>ID Type</label>
                    {editing
                      ? <select value={draft.officialIdType} onChange={set("officialIdType")} className={selectCls}>
                          <option value="">Select ID type…</option>
                          {Object.entries(ID_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{ID_TYPE_LABELS[profile.officialIdType] ?? (profile.officialIdType || "—")}</p>
                    }
                  </div>
                  <div>
                    <label className={labelCls}>ID Number</label>
                    {editing
                      ? <input value={draft.idNumber} onChange={set("idNumber")} className={inputCls} />
                      : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800 font-mono">{profile.idNumber || "—"}</p>
                    }
                  </div>
                  <div>
                    <label className={labelCls}>Issue Date</label>
                    {editing ? <input type="date" value={draft.idIssueDate} onChange={set("idIssueDate")} className={inputCls} />
                      : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.idIssueDate || "—"}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    {editing ? <input type="date" value={draft.idExpiryDate} onChange={set("idExpiryDate")} className={inputCls} />
                      : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.idExpiryDate || "—"}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Issuing Authority</label>
                    {editing ? <input value={draft.idIssuingAuthority} onChange={set("idIssuingAuthority")} className={inputCls} />
                      : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.idIssuingAuthority || "—"}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Bank Details ── */}
            {activeTab === "Bank Details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Bank Name</label>
                  {editing
                    ? <select value={draft.bankName} onChange={set("bankName")} className={selectCls}>
                        <option value="">Select bank…</option>
                        {NIGERIAN_BANKS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.bankName || "—"}</p>
                  }
                </div>
                <div>
                  <label className={labelCls}>Account Number (NUBAN)</label>
                  {editing
                    ? <input value={draft.accountNumber} onChange={(e) => { if (e.target.value.length <= 10) set("accountNumber")(e); }} maxLength={10} inputMode="numeric" className={inputCls} />
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800 font-mono">{profile.accountNumber || "—"}</p>
                  }
                </div>
                <div>
                  <label className={labelCls}>Account Name</label>
                  {editing ? <input value={draft.accountName} onChange={set("accountName")} className={inputCls} />
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.accountName || "—"}</p>}
                </div>
                <div>
                  <label className={labelCls}>Bank Branch</label>
                  {editing ? <input value={draft.bankBranch} onChange={set("bankBranch")} className={inputCls} />
                    : <p className="text-white text-sm py-2.5 px-4 bg-gray-900/30 rounded-lg border border-gray-800">{profile.bankBranch || "—"}</p>}
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === "Security" && (
              <SecurityTab setToast={setToast} />
            )}
          </div>
        </main>

        <footer className="px-6 py-4 border-t border-gray-800/60 flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 hidden md:flex">
          <Link href="/contact"              className="hover:text-gray-300 transition">Contact</Link>
          <span className="text-gray-700">|</span>
          <Link href="/terms-and-conditions" className="hover:text-gray-300 transition">Terms &amp; Conditions</Link>
          <span className="text-gray-700">|</span>
          <Link href="/refund-policy"        className="hover:text-gray-300 transition">Refund Policy</Link>
          <span className="text-gray-700">|</span>
          <Link href="/privacy-policy"       className="hover:text-gray-300 transition">Privacy Policy</Link>
          <span className="text-gray-700">|</span>
          <Link href="/about"                className="hover:text-gray-300 transition">About Us</Link>
        </footer>
      </div>
    </div>
  );
}
