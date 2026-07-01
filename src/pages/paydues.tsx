"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import FlowCompleteModal from "@/components/FlowCompleteModal";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeString } from "@/lib/security/sanitize";
import { useDepot } from "@/context/DepotContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberInfo {
  fullName: string;
  companyName: string;
  membershipId: string;
  email: string;
  telephone: string;
  address: string;
  paymentDepot: string;
}

interface DueSelection {
  // No longer boolean checkboxes — dues are fixed and all apply
}

interface LevyDetails {
  productType: string;
  litres: string;
  truckCount: string;
  declaredValue: string;
}

interface PaymentInfo {
  paymentMethod: string;
  bankName: string;
  accountName: string;
  transactionRef: string;
}

interface FormData {
  member: MemberInfo;
  dues: DueSelection;
  levy: LevyDetails;
  payment: PaymentInfo;
}

// ─── Due Definitions ──────────────────────────────────────────────────────────

const PRODUCTS = [
  { value: "PMS", label: "PMS – Premium Motor Spirit (Petrol)" },
  { value: "AGO", label: "AGO – Automotive Gas Oil (Diesel)" },
  { value: "DPK", label: "DPK – Dual Purpose Kerosene" },
  { value: "LPG", label: "LPG – Liquefied Petroleum Gas" },
  { value: "CRUDE", label: "Crude Oil" },
];

const STAGES = ["Member Info", "Select Dues", "Payment"];

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

const DEFAULT_DUES_AMOUNT = 300000;

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center mb-8">
    {STAGES.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done ? "bg-orange-500 text-white" : active ? "bg-orange-500 text-white ring-4 ring-orange-200" : "bg-gray-200 text-gray-400"}`}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs mt-1 font-medium whitespace-nowrap
              ${active ? "text-orange-600" : done ? "text-orange-400" : "text-gray-400"}`}
            >
              {label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div
              className={`flex-1 h-0.5 mb-5 transition-all ${i < current ? "bg-orange-500" : "bg-gray-200"}`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Stage 1: Member Information ─────────────────────────────────────────────

const MemberStage = ({
  data,
  onChange,
}: {
  data: MemberInfo;
  onChange: (d: Partial<MemberInfo>) => void;
}) => {
  const { depots } = useDepot();
  return (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Member Information</h2>
      <p className="text-sm italic text-gray-500 mt-1">
        Enter your membership and contact details to proceed with dues payment.
      </p>
    </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <Field label="select payment depot">
            <select className={selectClass} value={data.paymentDepot} onChange={(e) => onChange({ paymentDepot: e.target.value })}>
              <option value="">select a payment depot</option>
              {depots.length > 0 ? depots.map(d => <option key={d} value={d}>{d}</option>) : (
                <>
                  <option value="Lagos Main Depot">Lagos Main Depot</option>
                  <option value="Port Harcourt Terminal">Port Harcourt Terminal</option>
                  <option value="Abuja Central Terminal">Abuja Central Terminal</option>
                  <option value="Warri Storage Facility">Warri Storage Facility</option>
                </>
              )}
            </select>
          </Field>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name">
        <input
          className={inputClass}
          placeholder="e.g. Chukwuemeka Okafor"
          value={data.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
        />
      </Field>
      <Field label="Membership ID">
        <input
          className={inputClass}
          placeholder="e.g. ENR-2024-00123"
          value={data.membershipId}
          onChange={(e) => onChange({ membershipId: e.target.value })}
        />
      </Field>
    </div>
    <Field label="Company Name">
      <input
        className={inputClass}
        placeholder="e.g. Chipet Oil & Gas Ltd"
        value={data.companyName}
        onChange={(e) => onChange({ companyName: e.target.value })}
      />
    </Field>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Email Address">
        <input
          className={inputClass}
          placeholder="info@company.com"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </Field>
      <Field label="Telephone">
        <input
          className={inputClass}
          placeholder="+234 814 343 2374"
          value={data.telephone}
          onChange={(e) => onChange({ telephone: e.target.value })}
        />
      </Field>
    </div>
    <Field label="Address">
      <input
        className={inputClass}
        placeholder="124, Marwa road, depot bus-stop, Ijegun waterside, Lagos."
        value={data.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />
    </Field>
  </div>
  );
};

// ─── Stage 2: Select Dues ─────────────────────────────────────────────────────

const DuesStage = ({ amount }: { amount: number }) => {
  const total = amount;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dues Payment</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="text-sm text-blue-800 leading-relaxed">
            <span className="font-semibold">Note:</span> This payment captures all applicable dues, including Annual Membership, Product Handling Levy, Loading Fee, Depot Access Fee, and Regulatory Compliance.
          </p>
        </div>
      </div>

      <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Total Amount Payable</p>
        <p className="text-4xl font-extrabold text-orange-600">
          ₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};

// ─── Stage 3: Payment ─────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  {
    value: "bank-transfer",
    label: "Bank Transfer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M3 10h18M7 15h2M12 15h2" strokeLinecap="round" />
        <path d="M12 3L3 8h18L12 3z" />
      </svg>
    ),
  },
  {
    value: "card",
    label: "Debit / Credit Card",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" strokeLinecap="round" />
        <path d="M6 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "opay",
    label: "OPay",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 12h1M16 12h1M12 7v1M12 16v1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "paystack",
    label: "Paystack",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" strokeLinecap="round" />
        <path d="M7 15h4M15 15h2" strokeLinecap="round" />
        <circle cx="6" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    value: "globalpay",
    label: "GlobalPay",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a15 15 0 010 18M3 12h18" strokeLinecap="round" />
        <path d="M5.6 7h12.8M5.6 17h12.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PaymentStage = ({
  data,
  onChange,
  bankSettings,
  availableMethods = PAYMENT_METHODS,
}: {
  data: PaymentInfo;
  onChange: (d: Partial<PaymentInfo>) => void;
  bankSettings: { bankName: string; bankAccountName: string; bankAccountNumber: string; opayNumber: string };
  availableMethods?: typeof PAYMENT_METHODS;
}) => {
  const isPaystack = data.paymentMethod === "paystack";
  const isGlobalpay = data.paymentMethod === "globalpay";
  const isManual = data.paymentMethod && data.paymentMethod !== "paystack" && data.paymentMethod !== "globalpay";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Payment</h2>
        <p className="text-sm italic text-gray-500 mt-1">
          Select your preferred payment method to complete your dues payment.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          Payment Method
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
          {availableMethods.map((method) => {
            const selected = data.paymentMethod === method.value;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => onChange({ paymentMethod: method.value })}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 px-3 py-4 transition-all focus:outline-none
                  ${
                    selected
                      ? "border-orange-500 bg-orange-50 text-orange-600 shadow-md"
                      : "border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/40"
                  }`}
              >
                {method.icon}
                <span className="text-xs font-semibold text-center leading-tight">{method.label}</span>
                {selected && (
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">
                    Selected ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isPaystack && (
        <div className="rounded-lg border-2 border-teal-400 bg-teal-50 p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-teal-800 text-sm">Secure Payment via Paystack</p>
            <p className="text-teal-700 text-xs mt-1 leading-relaxed">
              You will be securely redirected to Paystack&apos;s checkout to complete your dues payment. No card
              details needed here.
            </p>
          </div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
            </svg>
            256-bit SSL encrypted · PCI DSS compliant
          </div>
        </div>
      )}

      {isGlobalpay && (
        <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a15 15 0 010 18M3 12h18" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-blue-800 text-sm">Secure Payment via GlobalPay</p>
            <p className="text-blue-700 text-xs mt-1 leading-relaxed">
              You will be securely redirected to GlobalPay&apos;s checkout to complete your dues payment. No card
              details needed here.
            </p>
          </div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
            </svg>
            256-bit SSL encrypted · PCI DSS compliant
          </div>
        </div>
      )}

      {isManual && (
        <>
          {data.paymentMethod === "bank-transfer" && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-1">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-widest mb-2">
                Transfer to this account
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Bank:</span> {bankSettings.bankName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Account Name:</span> {bankSettings.bankAccountName}
              </p>
              {bankSettings.bankAccountNumber && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Account Number:</span> {bankSettings.bankAccountNumber}
                </p>
              )}
            </div>
          )}
          {data.paymentMethod === "opay" && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-1">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-2">
                Pay via OPay
              </p>
              {bankSettings.opayNumber && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">OPay Number:</span> {bankSettings.opayNumber}
                </p>
              )}
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Account Name:</span> {bankSettings.bankAccountName}
              </p>
              <p className="text-sm text-gray-700 mt-1 text-green-700">
                Send the exact amount to the OPay number above, then enter your transaction reference below.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Bank Name">
              <input
                className={inputClass}
                placeholder="enter your bank name"
                value={data.bankName}
                onChange={(e) => onChange({ bankName: e.target.value })}
              />
            </Field>
            <Field label="Account Name">
              <input
                className={inputClass}
                placeholder="account name used for transfer"
                value={data.accountName}
                onChange={(e) => onChange({ accountName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Transaction Reference / Receipt Number">
            <input
              className={inputClass}
              placeholder="enter transaction reference"
              value={data.transactionRef}
              onChange={(e) => onChange({ transactionRef: e.target.value })}
            />
          </Field>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-1">Important Notice</p>
            Manual payment submissions are reviewed within 24–48 business hours. Ensure your transaction
            reference is accurate. An invoice will be emailed to you upon confirmation.
          </div>
        </>
      )}
    </div>
  );
};

// ─── Invoice Modal ────────────────────────────────────────────────────────────

const InvoiceModal = ({
  formData,
  total,
  onClose,
  platformInfo,
}: {
  formData: FormData;
  total: number;
  onClose: () => void;
  platformInfo: { supportEmail: string; supportPhone: string };
}) => {
  const { member, payment } = formData;

  const lineItems: { label: string; desc: string; amount: number }[] = [
    { label: "Union Dues (All Applicable Fees)", desc: "Covers: Annual Membership, Product Handling Levy, Loading Fee, Depot Access, Regulatory Compliance", amount: total },
  ];

  const invoiceRef = `ENR-DUE-${Date.now().toString().slice(-8)}`;
  const date = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Invoice header */}
        <div className="bg-orange-500 px-8 py-6 flex justify-between items-start">
          <div>
            <p className="text-orange-100 text-xs uppercase tracking-widest font-semibold mb-1">
              Official Invoice
            </p>
            <h2 className="text-white font-extrabold text-2xl leading-tight">
              e-Nergy Oil &amp; Gas
            </h2>
            <p className="text-orange-100 text-xs mt-1">Dues Payment Receipt</p>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-xs">Invoice No.</p>
            <p className="text-white font-bold font-mono text-sm">{invoiceRef}</p>
            <p className="text-orange-100 text-xs mt-1">{date}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Billed To */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Billed To</p>
              <p className="font-bold text-gray-800">{member.fullName || "—"}</p>
              <p className="text-sm text-gray-600">{member.companyName || "—"}</p>
              <p className="text-sm text-gray-500">{member.email || "—"}</p>
              <p className="text-sm text-gray-500">{member.telephone || "—"}</p>
              <p className="text-sm text-gray-500">{member.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Membership Details
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">ID:</span> {member.membershipId || "—"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Payment Method:</span>{" "}
                {payment.paymentMethod
                  ? PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod)?.label
                  : "—"}
              </p>
               {payment.transactionRef && (
                 <p className="text-sm text-gray-600">
                   <span className="font-semibold">Ref:</span> {payment.transactionRef}
                 </p>
               )}
             </div>
           </div>

          {/* Line items */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left pb-2 text-xs uppercase tracking-widest text-gray-400 font-semibold">
                    Description
                  </th>
                  <th className="text-left pb-2 text-xs uppercase tracking-widest text-gray-400 font-semibold">
                    Details
                  </th>
                  <th className="text-right pb-2 text-xs uppercase tracking-widest text-gray-400 font-semibold">
                    Amount (₦)
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-800">{item.label}</td>
                    <td className="py-3 text-gray-500 text-xs">{item.desc}</td>
                    <td className="py-3 text-right font-semibold text-gray-800">
                      {item.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note about dues coverage */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> This payment captures all applicable dues as listed above, including membership, handling levy, loading fee, depot access, and regulatory compliance.
            </p>
          </div>

          {/* Total */}
          <div className="bg-gray-900 rounded-lg px-6 py-4 flex justify-between items-center">
            <span className="text-white font-bold uppercase tracking-widest text-sm">Total Paid</span>
            <span className="text-orange-400 font-extrabold text-2xl">
              ₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <p className="text-xs text-gray-400 text-center">
            This invoice was generated by the e-Nergy platform. For queries, contact{" "}
            <span className="text-orange-500">{platformInfo.supportEmail}</span> or call {platformInfo.supportPhone}.
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 border-2 border-orange-500 text-orange-600 text-sm font-bold rounded hover:bg-orange-50 transition"
          >
            🖨 Print Invoice
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main PayDues Page ────────────────────────────────────────────────────────

export default function PayDues() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [duesAmount, setDuesAmount] = useState(DEFAULT_DUES_AMOUNT);
  const [bankSettings, setBankSettings] = useState({ bankName: "First Bank of Nigeria", bankAccountName: "e-Nergy Oil & Gas", bankAccountNumber: "", opayNumber: "" });
  const [platformInfo, setPlatformInfo] = useState({ supportEmail: "info@e-nergy.com.ng", supportPhone: "(+234) 08087550875" });
  const [paystackKey, setPaystackKey] = useState("pk_test_REPLACE_WITH_YOUR_KEY");
  const [enabledMethods, setEnabledMethods] = useState({ enableBankTransfer: true, enablePaystack: true, enableOpay: true, enableGlobalpay: true });
  const rateLimit = useRateLimit({ maxAttempts: 5, windowMs: 60_000 });

  useEffect(() => {
    if (document.getElementById("paystack-script")) return;
    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u) return;
        if (u.role === "customer") setIsCustomer(true);
        setFormData((f) => ({
          ...f,
          member: {
            ...f.member,
            fullName: u.name || "",
            email: u.email || "",
            telephone: u.phone || "",
            membershipId: u.memberId || "",
            companyName: u.companyName || "",
          },
        }));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    import("@/lib/db-client")
      .then(({ api }) => api.platformSettings.get())
      .then((settings) => {
        if (settings?.annualMembershipFee) setDuesAmount(settings.annualMembershipFee);
        if (settings) {
          setBankSettings({ bankName: settings.bankName || "First Bank of Nigeria", bankAccountName: settings.bankAccountName || "e-Nergy Oil & Gas", bankAccountNumber: settings.bankAccountNumber || "", opayNumber: settings.opayNumber || "" });
          setPlatformInfo({ supportEmail: settings.supportEmail || "info@e-nergy.com.ng", supportPhone: settings.supportPhone || "(+234) 08087550875" });
          if (settings.paystackPublicKey) setPaystackKey(settings.paystackPublicKey);
          setEnabledMethods({ enableBankTransfer: settings.enableBankTransfer !== false, enablePaystack: settings.enablePaystack !== false, enableOpay: settings.enableOpay !== false, enableGlobalpay: settings.enableGlobalpay !== false });
        }
      })
      .catch(() => null);
  }, []);

  const [formData, setFormData] = useState<FormData>({
    member: {
      fullName: "",
      companyName: "",
      membershipId: "",
      email: "",
      telephone: "",
      address: "",
      paymentDepot: "",
    },
    dues: {},
    levy: {
      productType: "",
      litres: "",
      truckCount: "",
      declaredValue: "",
    },
    payment: {
      paymentMethod: "",
      bankName: "",
      accountName: "",
      transactionRef: "",
    },
  });

   const updateMember = (d: Partial<MemberInfo>) =>
     setFormData((f) => ({ ...f, member: { ...f.member, ...d } }));
   const updatePayment = (d: Partial<PaymentInfo>) =>
     setFormData((f) => ({ ...f, payment: { ...f.payment, ...d } }));

  const computeTotal = () => duesAmount;

  const saveDuesTransaction = (opts: { paystackRef?: string } = {}) => {
    const { member: rawMember, payment } = formData;
    const member = {
      ...rawMember,
      fullName:     sanitizeString(rawMember.fullName),
      companyName:  sanitizeString(rawMember.companyName),
      membershipId: sanitizeString(rawMember.membershipId),
      email:        sanitizeString(rawMember.email),
      telephone:    sanitizeString(rawMember.telephone),
      address:      sanitizeString(rawMember.address),
    };
    const total = duesAmount;
    const isPaystack = payment.paymentMethod === "paystack";
    const txnId = opts.paystackRef ?? (payment.transactionRef?.trim() || `DUE-${Date.now().toString().slice(-8)}`);
    const txnDate = new Date().toISOString().slice(0, 10);
    const isPaid = isPaystack;
    const pmMethod = isPaystack ? "card" : payment.paymentMethod === "globalpay" ? "card" : payment.paymentMethod === "bank-transfer" ? "bank_transfer" : (payment.paymentMethod as any) || "bank_transfer";

    // Create Transaction + UnionDues and cross-link them
    import("@/lib/db-client").then(async ({ api }) => {
      try {
        // 1. Create Transaction record first to get its _id
        const txnDoc = await api.transactions.create({
          txnId:         `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
          type:          "union_dues",
          user:          member.fullName || "Member",
          userEmail:     member.email,
          userRole:      "customer",
          product:       "Union Dues (All Applicable Fees)",
          totalAmount:   total,
          status:        isPaid ? "completed" : "pending",
          paymentMethod: pmMethod,
          depot:         member.paymentDepot || undefined,
          reference:     txnId,
          referenceType: "union_dues",
        } as any).catch(() => null);

        // 2. Create UnionDues with transactionId linked
        const duesDoc = await api.unionDues.create({
          paymentId:       txnId,
          userEmail:       member.email,
          userRole:        "customer",
          fullName:        member.fullName,
          companyName:     member.companyName,
          membershipId:    member.membershipId,
          telephone:       member.telephone,
          address:         member.address,
          paymentDepot:    member.paymentDepot,
          amountDue:       total,
          amountPaid:      isPaid ? total : 0,
          paymentMethod:   pmMethod,
          bankName:        payment.bankName || undefined,
          bankAccountName: payment.accountName || undefined,
          transactionRef:  txnId,
          status:          isPaid ? "paid" : "pending",
          paidAt:          isPaid ? new Date().toISOString() : undefined,
          duesPeriod:      txnDate.slice(0, 7),
          ...(txnDoc?._id ? { transactionId: txnDoc._id } : {}),
        } as any).catch(() => null);

        // 3. Back-link Transaction to UnionDues record
        if (txnDoc?._id && duesDoc?._id) {
          api.transactions.update(String(txnDoc._id), {
            referenceId: duesDoc._id,
          } as any).catch(() => null);
        }
      } catch {
        // fire-and-forget — UI already shown success
      }
    }).catch(() => null);
  };

  const handlePaystack = () => {
    // @ts-ignore
    if (!window.PaystackPop) { alert("Payment gateway is still loading. Please wait a moment and try again."); return; }
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: formData.member.email,
      amount: computeTotal() * 100, // kobo
      currency: "NGN",
      ref: `ENR-DUE-${Date.now()}`,
      metadata: {
        type: "union_dues",
        memberName: formData.member.fullName,
        company: formData.member.companyName,
        membershipId: formData.member.membershipId,
      },
      onClose: () => {},
      callback: (response: { reference: string }) => {
        saveDuesTransaction({ paystackRef: response.reference });
        setShowInvoice(true);
        setShowFlowModal(true);
      },
    });
    handler.openIframe();
  };

  const handleGlobalPay = async () => {
    try {
      const id = `DUES-${Date.now()}`;

      const duesPayload = {
        paymentId:    id,
        userEmail:    sanitizeString(formData.member.email),
        userRole:     "customer",
        fullName:     sanitizeString(formData.member.fullName),
        companyName:  sanitizeString(formData.member.companyName),
        membershipId: sanitizeString(formData.member.membershipId),
        telephone:    sanitizeString(formData.member.telephone),
        address:      sanitizeString(formData.member.address),
        paymentDepot: formData.member.paymentDepot,
        amountDue:    duesAmount,
        amountPaid:   0,
        paymentMethod: "card",
        status:       "pending",
        duesPeriod:   new Date().toISOString().slice(0, 7),
      };

      const res = await fetch("/api/db/union-dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duesPayload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "Failed to create dues record");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        // Fallback if no checkout URL
        setShowInvoice(true);
        setShowFlowModal(true);
      }
    } catch (err: any) {
      setSubmitError(err?.message ?? "GlobalPay initiation failed. Please try again.");
    }
  };

  const validateStage = (s: number): string => {
    if (s === 0) {
      const m = formData.member;
      if (!m.paymentDepot)        return "Please select a payment depot.";
      if (!m.fullName.trim())     return "Full name is required.";
      if (!m.membershipId.trim()) return "Membership ID is required.";
      if (!m.companyName.trim())  return "Company name is required.";
      if (!m.email.trim())        return "Email address is required.";
      if (!m.telephone.trim())    return "Telephone is required.";
    }
    if (s === 2) {
      if (!formData.payment.paymentMethod) return "Please select a payment method.";
    }
    return "";
  };

  const handleNext = () => {
    setSubmitError("");
    const err = validateStage(stage);
    if (err) { setSubmitError(err); return; }
    if (stage < 2) { setStage((s) => s + 1); return; }
    if (!rateLimit.attempt()) {
      setSubmitError(`Too many submissions. Please wait ${Math.ceil(rateLimit.remainingMs / 1000)}s.`);
      return;
    }
    if (formData.payment.paymentMethod === "paystack") handlePaystack();
    else if (formData.payment.paymentMethod === "globalpay") { handleGlobalPay(); return; }
    else { saveDuesTransaction(); setShowInvoice(true); setShowFlowModal(true); }
  };

  const handleBack = () => {
    if (stage > 0) setStage((s) => s - 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 relative overflow-hidden">
      <Head><title>Pay Dues | e-Nergy</title></Head>
      {/* Background pattern */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/tower.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24">
  
        {showInvoice ? (
          <>
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 p-10 max-w-md w-full text-center space-y-4">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-bold text-gray-800">Payment Recorded!</h2>
              <p className="text-gray-500 text-sm">
                Your dues payment for{" "}
                <span className="font-semibold">
                  {formData.member.companyName || formData.member.fullName || "your account"}
                </span>{" "}
                has been recorded. Your invoice is ready below.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowInvoice(false);
                    // Show the invoice modal for printing
                    setTimeout(() => setShowInvoice(true), 50);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition"
                >
                  View &amp; Print Invoice
                </button>
                <button
                  onClick={() => {
                    setShowInvoice(false);
                    setStage(0);
                    setFormData({
                      member: { fullName: "", companyName: "", membershipId: "", email: "", telephone: "", address: "", paymentDepot: "" },
                      dues: {},
                      levy: { productType: "", litres: "", truckCount: "", declaredValue: "" },
                      payment: { paymentMethod: "", bankName: "", accountName: "", transactionRef: "" },
                    });
                  }}
                  className="px-6 py-2 text-orange-500 text-sm font-semibold rounded border border-orange-300 hover:bg-orange-50 transition"
                >
                  Pay Another Due
                </button>
              </div>
            </div>
            <InvoiceModal formData={formData} total={duesAmount} onClose={() => setShowInvoice(false)} platformInfo={platformInfo} />
          </>
        ) : (
          <div className="flex w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">
            {isCustomer && (
              <div className="absolute top-20 left-4 z-10">
                <Link href="/customer/TransactionHistory" className="flex items-center gap-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-orange-400 text-xs font-semibold px-3 py-2 rounded-full shadow-lg backdrop-blur-sm transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            )}
            {/* Left sidebar */}
            <div className="hidden md:flex flex-col justify-center px-8 py-8 min-w-[240px] max-w-[260px] pt-0">
              <h1 className="text-gray-900 text-xl font-extrabold uppercase leading-snug mb-4">
                e-Nergy<br />Membership<br />Dues<br />Portal
              </h1>
              <p className="text-gray-500 text-xs italic mb-8">
                Pay your applicable membership dues and generate an official invoice instantly upon completion.
              </p>
              <div className="space-y-4 text-xs text-gray-500">
{/*                 <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 space-y-2">
                  <p className="font-bold text-orange-700 text-xs uppercase tracking-widest">Due Schedule</p>
                  <p>Annual Membership — ₦250,000</p>
                  <p>Handling Levy — ₦2.50/litre</p>
                  <p>Loading Fee — ₦15,000/truck</p>
                  <p>Depot Access — ₦50,000</p>
                  <p>Regulatory — 1.5% of value</p>
                </div> */}
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-lg">✉</span>
                  <span className="text-gray-600 text-xs">{platformInfo.supportEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-lg">📞</span>
                  <span className="text-gray-600 text-xs">{platformInfo.supportPhone}</span>
                </div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px bg-gray-200 my-6" />

            {/* Form area */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>
              <StepIndicator current={stage} />

              {stage === 0 && <MemberStage data={formData.member} onChange={updateMember} />}
               {stage === 1 && <DuesStage amount={duesAmount} />}
              {stage === 2 && <PaymentStage data={formData.payment} onChange={updatePayment} bankSettings={bankSettings} availableMethods={PAYMENT_METHODS.filter(m => m.value === "bank-transfer" ? enabledMethods.enableBankTransfer : m.value === "opay" ? enabledMethods.enableOpay : m.value === "globalpay" ? enabledMethods.enableGlobalpay : enabledMethods.enablePaystack)} />}

              {/* Navigation */}
              {submitError && <p className="text-sm text-red-500 text-center mt-2">{submitError}</p>}
              <div className="flex justify-between items-center mt-4 pt-6 border-t border-gray-100">
                {stage > 0 ? (
                  <button
                    onClick={handleBack}
                    className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition"
                  >
                    ‹ Back
                  </button>
                ) : (
                  <div />
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all"
                >
                  {stage === 2
                    ? formData.payment.paymentMethod === "paystack"
                      ? "Pay Now →"
                      : formData.payment.paymentMethod
                      ? "Complete Payment →"
                      : "Generate Invoice"
                    : "Next ›"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <FlowCompleteModal
        isOpen={showFlowModal}
        onClose={() => setShowFlowModal(false)}
        title="Dues Paid!"
        subtitle="Your dues and levies have been settled successfully."
        completedSteps={[
          { label: "Member Info", detail: "Verified" },
          { label: "Dues Selected", detail: "All Levies" },
          { label: "Payment", detail: "Confirmed" },
        ]}
        summary={[
          { label: "Name", value: formData.member.fullName },
          { label: "Company", value: formData.member.companyName },
          { label: "Membership ID", value: formData.member.membershipId },
          { label: "Depot", value: formData.member.paymentDepot },
        ]}
        nextActions={[
          {
            label: "Buy Fuel",
            description: "Place a new purchase order",
            href: "/buynow",
            color: "orange",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
          },
          {
            label: "Load Fuel",
            description: "Proceed to loading bay",
            href: "/load",
            color: "green",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H7m0 0l4-4m-4 4l4 4"/></svg>,
          },
          {
            label: "Book Delivery",
            description: "Schedule your next delivery",
            href: "/booknow",
            color: "blue",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
          },
          {
            label: "Rent a Truck",
            description: "Find available trucks",
            href: "/RentTruck",
            color: "yellow",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v3h-3m0 0a2 2 0 11-4 0 2 2 0 014 0zm-8 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
          },
          {
            label: "Go Home",
            description: "Return to dashboard",
            href: "/home",
            color: "gray",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
          },
        ]}
      />
    </div>
  );
}
