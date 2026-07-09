"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  // business
  companyName: string;
  dprRegNo: string;
  cacRegNo: string;
  // address
  headOfficeAddress: string;
  stationAddress: string;
  state: string;
  lga: string;
  // identity
  memberId: string;
  officialIdType: string;
  idNumber: string;
  idIssueDate: string;
  idExpiryDate: string;
  idIssuingAuthority: string;
  // bank details
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankBranch: string;
  // account
  password: string;
}

const EMPTY: CustomerProfile = {
  name: "", email: "", phone: "", role: "Customer",
  companyName: "", dprRegNo: "", cacRegNo: "",
  headOfficeAddress: "", stationAddress: "", state: "", lga: "",
  memberId: "", officialIdType: "", idNumber: "", idIssueDate: "", idExpiryDate: "", idIssuingAuthority: "",
  bankName: "", accountName: "", accountNumber: "", bankBranch: "",
  password: "",
};

// Mock identity data injected when localStorage has none
const MOCK_IDENTITY = {
  officialIdType:     "",
  idNumber:           "",
  idIssueDate:        "",
  idExpiryDate:       "",
  idIssuingAuthority: "",
};

const ID_TYPE_LABELS: Record<string, string> = {
  "nin":               "National Identity Number (NIN)",
  "nimc-slip":         "NIMC Enrolment Slip",
  "passport":          "International Passport",
  "drivers-license":   "Driver's License (FRSC)",
  "voters-card":       "Permanent Voter's Card (PVC)",
  "bvn":               "Bank Verification Number (BVN)",
  "tin":               "Tax Identification Number (TIN)",
  "nysc":              "NYSC Discharge / Exemption Certificate",
  "birth-certificate": "Birth Certificate",
  "cac":               "CAC Business Registration Certificate",
  "lasrra":            "Lagos Resident Registration Card (LASRRA)",
  "lagos-id":          "Lagos State ID Card",
  "government-staff-id": "Government Staff ID Card",
  "military-id":       "Military / Police ID Card",
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe",
  "Zamfara","Abuja (FCT)",
];

const inputClass =
  "w-full bg-card/60 border border-line rounded-lg px-4 py-2.5 text-foreground placeholder-muted focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed";
const selectClass =
  "w-full bg-card/60 border border-line rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card backdrop-blur-md border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-line bg-orange-500/5">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div className={half ? "" : "col-span-2 sm:col-span-1"}>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerProfilePage() {
  const router = useRouter();
  const [user, setUser]         = useState<any>(null);
  const [profile, setProfile]   = useState<CustomerProfile>(EMPTY);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState<CustomerProfile>(EMPTY);
  const [saved, setSaved]       = useState(false);

  // Change password
  const [showChangePw, setShowChangePw]   = useState(false);
  const [pwForm, setPwForm]               = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]             = useState("");
  const [pwSuccess, setPwSuccess]         = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNext, setShowPwNext]       = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  // Delete account
  const [showDelete, setShowDelete]   = useState(false);
  const [deletePass, setDeletePass]   = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);

  useEffect(() => {
    const buildProfile = (src: any): CustomerProfile => ({
      name:               src.name               || "",
      email:              src.email              || "",
      phone:              src.phone              || "",
      role:               src.role               || "Customer",
      companyName:        src.companyName        || "",
      dprRegNo:           src.dprRegNo           || "",
      cacRegNo:           src.cacRegNo           || "",
      headOfficeAddress:  src.headOfficeAddress  || "",
      stationAddress:     src.stationAddress     || "",
      state:              src.state              || "",
      lga:                src.lga                || "",
      memberId:           src.memberId           || "",
      officialIdType:     src.officialIdType     || MOCK_IDENTITY.officialIdType,
      idNumber:           src.idNumber           || MOCK_IDENTITY.idNumber,
      idIssueDate:        src.idIssueDate        || MOCK_IDENTITY.idIssueDate,
      idExpiryDate:       src.idExpiryDate       || MOCK_IDENTITY.idExpiryDate,
      idIssuingAuthority: src.idIssuingAuthority || MOCK_IDENTITY.idIssuingAuthority,
      bankName:           src.bankName           || "",
      accountName:        src.accountName        || "",
      accountNumber:      src.accountNumber      || "",
      bankBranch:         src.bankBranch         || "",
      password:           "",
    });

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);
        const p = buildProfile(u);
        setProfile(p);
        setDraft(p);
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const set = (key: keyof CustomerProfile, val: string) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    if (user?._id) {
      try {
        const { api } = await import("@/lib/db-client");
        const { password: _pw, role: _r, ...patch } = draft;
        await api.users.update(user._id, patch);
      } catch (err) {
        console.error("[profile] update failed:", err);
        alert("Failed to save profile. Please check your connection and try again.");
        return;
      }
    }
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };

  // Change password
  const handleChangePw = () => {
    setPwError("");
    if (!pwForm.current) { setPwError("Please enter your current password."); return; }
    if (pwForm.next.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, password: pwForm.next }),
    }).then((r) => {
      if (!r.ok) { setPwError("Current password is incorrect."); return; }
      setPwForm({ current: "", next: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2500);
    }).catch(() => setPwError("Failed to update password. Please try again."));
  };

  // Delete account
  const handleDelete = () => {
    setDeleteError("");
    if (!deletePass) { setDeleteError("Please enter your password to confirm."); return; }
    if (user?._id) {
      import("@/lib/db-client").then(({ api }) => {
        api.users.delete(user._id).catch(() => null);
      });
    }
    fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"));
  };

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      {show
        ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
        : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
      }
    </svg>
  );

  const PwInput = ({
    label, value, show, onToggle, onChange, placeholder,
  }: {
    label: string; value: string; show: boolean;
    onToggle: () => void; onChange: (v: string) => void; placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          className={inputClass + " pr-10"}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
        >
          <EyeIcon show={show} />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen text-foreground"

    >
      <Head><title>My Profile | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-background z-0" />
      <CustomerNavigation user={user} />

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6 max-w-4xl">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">My Profile</h1>
              <p className="text-muted text-sm">View and update your account details</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {saved && (
                <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
              {editing ? (
                <>
                  <button onClick={handleCancel}
                    className="px-4 py-2 border border-line text-muted hover:text-foreground hover:border-line text-sm font-semibold rounded-lg transition">
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-orange-500/20">
                    Save Changes
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-orange-500/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Avatar + name hero */}
          <div className="bg-card backdrop-blur-md border border-line rounded-xl p-6 mb-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-extrabold shrink-0 shadow-lg shadow-orange-500/30">
              {profile.name.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{profile.name || "—"}</h2>
              <p className="text-sm text-muted truncate">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-orange-500/20 text-orange-400 border-orange-500/40">
                  {profile.role}
                </span>
                {profile.memberId && (
                  <span className="text-xs text-muted font-mono">ID: {profile.memberId}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">

            {/* Personal Information */}
            <Section title="Personal Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input className={inputClass} value={draft.name} disabled={!editing}
                    onChange={(e) => set("name", e.target.value)} placeholder="Enter your full name" />
                </Field>
                <Field label="Email Address">
                  <input className={inputClass} type="email" value={draft.email} disabled={!editing}
                    onChange={(e) => set("email", e.target.value)} placeholder="your@email.com" />
                </Field>
                <Field label="Phone Number">
                  <input className={inputClass} value={draft.phone} disabled={!editing}
                    onChange={(e) => set("phone", e.target.value)} placeholder="+234 800 000 0000" />
                </Field>
                <Field label="Membership ID">
                  <input className={inputClass} value={draft.memberId} disabled={!editing}
                    onChange={(e) => set("memberId", e.target.value)} placeholder="Union membership ID" />
                </Field>
              </div>
            </Section>

            {/* Identity Verification */}
            <Section title="Identity Verification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Official ID Type">
                  <select className={selectClass} value={draft.officialIdType} disabled={!editing}
                    onChange={(e) => set("officialIdType", e.target.value)}>
                    <option value="">Select ID type</option>
                    <option value="nin">National Identity Number (NIN)</option>
                    <option value="nimc-slip">NIMC Enrolment Slip</option>
                    <option value="passport">International Passport</option>
                    <option value="drivers-license">Driver's License (FRSC)</option>
                    <option value="voters-card">Permanent Voter's Card (PVC)</option>
                    <option value="bvn">Bank Verification Number (BVN)</option>
                    <option value="tin">Tax Identification Number (TIN)</option>
                    <option value="nysc">NYSC Discharge / Exemption Certificate</option>
                    <option value="birth-certificate">Birth Certificate</option>
                    <option value="cac">CAC Business Registration Certificate</option>
                    <option value="lasrra">Lagos Resident Registration Card (LASRRA)</option>
                    <option value="lagos-id">Lagos State ID Card</option>
                    <option value="government-staff-id">Government Staff ID Card</option>
                    <option value="military-id">Military / Police ID Card</option>
                  </select>
                </Field>
                <Field label="ID Number">
                  <input className={inputClass} value={draft.idNumber} disabled={!editing}
                    onChange={(e) => set("idNumber", e.target.value)} placeholder="Enter ID number" />
                </Field>
                <Field label="Date of Issue">
                  <input className={inputClass} type="date" value={draft.idIssueDate} disabled={!editing}
                    onChange={(e) => set("idIssueDate", e.target.value)} />
                </Field>
                <Field label="Expiry Date">
                  <input className={inputClass} type="date" value={draft.idExpiryDate} disabled={!editing}
                    onChange={(e) => set("idExpiryDate", e.target.value)} />
                </Field>
                <div className="col-span-1 sm:col-span-2">
                  <Field label="Issuing Authority">
                    <input className={inputClass} value={draft.idIssuingAuthority} disabled={!editing}
                      onChange={(e) => set("idIssuingAuthority", e.target.value)}
                      placeholder="e.g. NIMC, Federal Road Safety Corps, INEC" />
                  </Field>
                </div>
              </div>

              {/* Saved ID card — shown when data exists and not editing */}
              {!editing && profile.idNumber && (
                <div className="mt-2 rounded-xl border border-orange-500/20 bg-orange-500/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-orange-500/15 bg-orange-500/10">
                    <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Verified Identity on File</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">ID Type</p>
                      <p className="text-sm font-semibold text-foreground">{ID_TYPE_LABELS[profile.officialIdType] || profile.officialIdType || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">ID Number</p>
                      <p className="text-sm font-semibold text-foreground font-mono tracking-widest">{profile.idNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Date of Issue</p>
                      <p className="text-sm font-semibold text-foreground">
                        {profile.idIssueDate ? new Date(profile.idIssueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Expiry Date</p>
                      <p className="text-sm font-semibold text-foreground">
                        {profile.idExpiryDate ? new Date(profile.idExpiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    {profile.idIssuingAuthority && (
                      <div className="col-span-1 sm:col-span-2">
                        <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Issuing Authority</p>
                        <p className="text-sm font-semibold text-foreground">{profile.idIssuingAuthority}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

            {/* Business Information */}
            <Section title="Business Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company / Business Name">
                  <input className={inputClass} value={draft.companyName} disabled={!editing}
                    onChange={(e) => set("companyName", e.target.value)} placeholder="e.g. Chipet Oil & Gas Ltd" />
                </Field>
                <Field label="DPR Registration No.">
                  <input className={inputClass} value={draft.dprRegNo} disabled={!editing}
                    onChange={(e) => set("dprRegNo", e.target.value)} placeholder="DPR-XXXX-XXXX" />
                </Field>
                <Field label="CAC Registration No." half>
                  <input className={inputClass} value={draft.cacRegNo} disabled={!editing}
                    onChange={(e) => set("cacRegNo", e.target.value)} placeholder="e.g. RN4893464" />
                </Field>
              </div>
            </Section>

            {/* Address */}
            <Section title="Address">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="State">
                  <select className={selectClass} value={draft.state} disabled={!editing}
                    onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="LGA / City">
                  <input className={inputClass} value={draft.lga} disabled={!editing}
                    onChange={(e) => set("lga", e.target.value)} placeholder="Local Government Area" />
                </Field>
                <div className="col-span-1 sm:col-span-2">
                  <Field label="Head Office Address">
                    <input className={inputClass} value={draft.headOfficeAddress} disabled={!editing}
                      onChange={(e) => set("headOfficeAddress", e.target.value)}
                      placeholder="Full head office / registered address" />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Field label="Station / Delivery Address">
                    <input className={inputClass} value={draft.stationAddress} disabled={!editing}
                      onChange={(e) => set("stationAddress", e.target.value)}
                      placeholder="Physical station address for deliveries" />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Bank Details */}
            <Section title="Bank Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name">
                  <select className={selectClass} value={draft.bankName} disabled={!editing}
                    onChange={(e) => set("bankName", e.target.value)}>
                    <option value="">Select bank</option>
                    {[
                      "Access Bank","Citibank Nigeria","Ecobank Nigeria","Fidelity Bank",
                      "First Bank of Nigeria","First City Monument Bank (FCMB)","Globus Bank",
                      "Guaranty Trust Bank (GTBank)","Heritage Bank","Keystone Bank","Kuda Bank",
                      "Moniepoint MFB","OPay (Paycom)","Palmpay","Polaris Bank","Providus Bank",
                      "Stanbic IBTC Bank","Standard Chartered Bank","Sterling Bank","SunTrust Bank",
                      "Union Bank of Nigeria","United Bank for Africa (UBA)","Unity Bank",
                      "VFD Microfinance Bank","Wema Bank","Zenith Bank",
                    ].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Account Name">
                  <input className={inputClass} value={draft.accountName} disabled={!editing}
                    onChange={(e) => set("accountName", e.target.value)}
                    placeholder="Name on the account" />
                </Field>
                <Field label="Account Number">
                  <input className={inputClass} value={draft.accountNumber} disabled={!editing}
                    onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit NUBAN number" maxLength={10} />
                </Field>
                <Field label="Branch">
                  <input className={inputClass} value={draft.bankBranch} disabled={!editing}
                    onChange={(e) => set("bankBranch", e.target.value)}
                    placeholder="e.g. Ikeja Branch" />
                </Field>
              </div>
            </Section>

            {/* Security */}
            <Section title="Security">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Password</p>
                  <p className="text-xs text-muted mt-0.5">Change your account password</p>
                </div>
                <button
                  onClick={() => { setShowChangePw((v) => !v); setPwError(""); setPwSuccess(false); setPwForm({ current: "", next: "", confirm: "" }); }}
                  className="px-4 py-2 bg-card-2 hover:bg-card-2 border border-line hover:border-orange-500/50 text-foreground hover:text-orange-400 text-xs font-semibold rounded-lg transition"
                >
                  {showChangePw ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showChangePw && (
                <div className="mt-4 space-y-4 bg-card/40 border border-line rounded-xl p-5">
                  <PwInput label="Current Password" value={pwForm.current} show={showPwCurrent}
                    onToggle={() => setShowPwCurrent((v) => !v)} onChange={(v) => setPwForm((f) => ({ ...f, current: v }))} />
                  <PwInput label="New Password" value={pwForm.next} show={showPwNext}
                    placeholder="Min. 6 characters"
                    onToggle={() => setShowPwNext((v) => !v)} onChange={(v) => setPwForm((f) => ({ ...f, next: v }))} />
                  <PwInput label="Confirm New Password" value={pwForm.confirm} show={showPwConfirm}
                    onToggle={() => setShowPwConfirm((v) => !v)} onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))} />
                  {pwError   && <p className="text-xs text-red-400 font-medium">{pwError}</p>}
                  {pwSuccess && <p className="text-xs text-green-400 font-semibold">✓ Password updated successfully.</p>}
                  <button onClick={handleChangePw}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-orange-500/20">
                    Update Password
                  </button>
                </div>
              )}
            </Section>

            {/* Danger Zone */}
            <div className="bg-card backdrop-blur-md border border-red-900/50 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-red-900/40 bg-red-500/5">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Danger Zone</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Delete Account</p>
                    <p className="text-xs text-muted mt-0.5">
                      Permanently delete your account and all associated data. This cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowDelete((v) => !v); setDeleteError(""); setDeletePass(""); }}
                    className="flex-shrink-0 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-500/70 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition"
                  >
                    {showDelete ? "Cancel" : "Delete Account"}
                  </button>
                </div>

                {showDelete && (
                  <div className="mt-5 bg-red-950/30 border border-red-900/50 rounded-xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-300">This action is irreversible</p>
                        <p className="text-xs text-red-400/70 mt-0.5">
                          All your transactions, station data, and profile information will be permanently erased.
                          Enter your password below to confirm.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showDeletePw ? "text" : "password"}
                          value={deletePass}
                          onChange={(e) => setDeletePass(e.target.value)}
                          placeholder="Enter your password to confirm"
                          className="w-full bg-card/60 border border-red-900/60 rounded-lg px-4 py-2.5 text-foreground placeholder-muted focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            {showDeletePw
                              ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                              : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                            }
                          </svg>
                        </button>
                      </div>
                      {deleteError && <p className="text-xs text-red-400 mt-1.5 font-medium">{deleteError}</p>}
                    </div>

                    <button
                      onClick={handleDelete}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-lg transition"
                    >
                      Yes, permanently delete my account
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
