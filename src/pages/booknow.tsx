import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Head from "next/head";
import tower from "@/../public/tower.jpg";
import NavBar from "@/components/NavBar";
import FlowCompleteModal from "@/components/FlowCompleteModal";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeString } from "@/lib/security/sanitize";
import { useDepot } from "@/context/DepotContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductKey = "ago" | "pms" | "atk" | "lpg" | "";

interface CompanyInfo {
  name: string;
  dprRegNo: string;
  cacRegNo: string;
  headOfficeAddress: string;
  telephone: string;
  email: string;
  deliveryAddress: string;
  loadingDepot: string;
}

interface OwnerInfo {
  name: string;
  telephone: string;
  address: string;
  email: string;
  officialIdType: string;
  idNumber: string;
}

interface BookingInfo {
  productType: ProductKey;
  productQuantity: string;
  preferredDate: string;
  preferredTime: string;
  deliveryUrgency: string;
  specialInstructions: string;
  haulageTruck: string;
  driverName: string;
  driverIdType: string;
  driverIdNumber: string;
}

interface PaymentInfo {
  paymentMethod: string;
  bankName: string;
  accountName: string;
  transactionRef: string;
}

interface FormData {
  company: CompanyInfo;
  owner: OwnerInfo;
  booking: BookingInfo;
  payment: PaymentInfo;
}

// ─── Product Config ───────────────────────────────────────────────────────────

const PRODUCT_MAP: Record<
  string,
  { label: string; full: string; color: string; description: string }
> = {
  ago: {
    label: "AGO",
    full: "AGO (Diesel)",
    color: "amber",
    description: "Automotive Gas Oil — industrial & transport diesel fuel",
  },
  pms: {
    label: "PMS",
    full: "PMS (Petrol)",
    color: "orange",
    description: "Premium Motor Spirit — standard petrol/gasoline",
  },
  atk: {
    label: "ATK",
    full: "ATK (Jet Fuel)",
    color: "sky",
    description: "Aviation Turbine Kerosene — certified aviation fuel",
  },
  lpg: {
    label: "LPG",
    full: "LPG (Gas)",
    color: "emerald",
    description: "Liquefied Petroleum Gas — cooking & industrial gas",
  },
};

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder-gray-400 bg-white";

const selectClass =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition bg-white";

// ─── Shared Field Wrapper ─────────────────────────────────────────────────────

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

// ─── Product Badge ────────────────────────────────────────────────────────────

const ProductBadge = ({ product }: { product: ProductKey }) => {
  if (!product) return null;
  const info = PRODUCT_MAP[product];
  if (!info) return null;

  return (
    <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-orange-50 border border-orange-200">
      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      <span className="text-xs font-semibold text-orange-700 uppercase tracking-widest">
        Auto-detected product:
      </span>
      <span className="text-sm font-bold text-orange-600">{info.full}</span>
      <span className="ml-auto text-xs text-gray-400 italic">{info.description}</span>
    </div>
  );
};

// ─── Stage 1: Company Information ─────────────────────────────────────────────

const CompanyStage = ({
  data,
  onChange,
}: {
  data: CompanyInfo;
  onChange: (d: Partial<CompanyInfo>) => void;
}) => {
  const { depots } = useDepot();
  return (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Company Information</h2>
      <p className="text-sm italic text-gray-500 mt-1">
        Carefully enter your company details into the columns provided.
      </p>
    </div>
    <Field label="Loading Depot">
      <select className={selectClass} value={data.loadingDepot} onChange={(e) => onChange({ loadingDepot: e.target.value })}>
        <option value="">select a loading depot</option>
        {depots.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </Field>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name of Company">
        <input
          className={inputClass}
          placeholder="e.g. Chipet Oil"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>
      <Field label="Marketer's License Number">
        <input
          className={inputClass}
          placeholder="**********"
          value={data.dprRegNo}
          onChange={(e) => onChange({ dprRegNo: e.target.value })}
        />
      </Field>
    </div>
    <Field label="CAC Registration Number">
      <input
        className={inputClass}
        placeholder="e.g. RN4893464"
        value={data.cacRegNo}
        onChange={(e) => onChange({ cacRegNo: e.target.value })}
      />
    </Field>
    <Field label="Head Office Address">
      <input
        className={inputClass}
        placeholder="124, Marwa road, depot bus-stop, Ijegun waterside, Lagos."
        value={data.headOfficeAddress}
        onChange={(e) => onChange({ headOfficeAddress: e.target.value })}
      />
    </Field>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Telephone">
        <input
          className={inputClass}
          placeholder="+234 814 343 2374"
          value={data.telephone}
          onChange={(e) => onChange({ telephone: e.target.value })}
        />
      </Field>
      <Field label="Email">
        <input
          className={inputClass}
          placeholder="info@chipetoil.com"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </Field>
    </div>
    <Field label="Delivery Address">
      <input
        className={inputClass}
        placeholder="124, Marwa road, depot bus-stop, Ijegun waterside, Lagos."
        value={data.deliveryAddress}
        onChange={(e) => onChange({ deliveryAddress: e.target.value })}
      />
    </Field>
  </div>
  );
};

// ─── Stage 2: Owner's Information ─────────────────────────────────────────────

const OwnerStage = ({
  data,
  onChange,
}: {
  data: OwnerInfo;
  onChange: (d: Partial<OwnerInfo>) => void;
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Owner&apos;s Information</h2>
      <p className="text-sm italic text-gray-500 mt-1">
        Carefully fill in your company owner&apos;s details into the columns provided.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name">
        <input
          className={inputClass}
          placeholder="enter your name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>
      <Field label="Telephone">
        <input
          className={inputClass}
          placeholder="(+234)"
          value={data.telephone}
          onChange={(e) => onChange({ telephone: e.target.value })}
        />
      </Field>
    </div>
    <Field label="Address">
      <input
        className={inputClass}
        placeholder="enter your address"
        value={data.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />
    </Field>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Email">
        <input
          className={inputClass}
          placeholder="enter your email"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </Field>
      <Field label="Official ID Type">
        <select
          className={selectClass}
          value={data.officialIdType}
          onChange={(e) => onChange({ officialIdType: e.target.value })}
        >
          <option value="">Select an official ID</option>
          <option value="nin">NIN</option>
          <option value="passport">International Passport</option>
          <option value="drivers-license">Driver&apos;s License</option>
          <option value="voters-card">Voter&apos;s Card</option>
        </select>
      </Field>
    </div>
    <Field label="ID Number">
      <input
        className={inputClass}
        placeholder="enter selected ID number"
        value={data.idNumber}
        onChange={(e) => onChange({ idNumber: e.target.value })}
      />
    </Field>
  </div>
);

// ─── Stage 3: Booking Details ──────────────────────────────────────────────────

const BookingStage = ({
  data,
  onChange,
  detectedProduct,
}: {
  data: BookingInfo;
  onChange: (d: Partial<BookingInfo>) => void;
  detectedProduct: ProductKey;
}) => {
  // On mount, if a product was detected and no product is set yet, pre-fill it
  useEffect(() => {
    if (detectedProduct && !data.productType) {
      onChange({ productType: detectedProduct });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedProduct]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
        <p className="text-sm italic text-gray-500 mt-1">
          Specify the product, quantity, preferred delivery schedule and logistics for your booking.
        </p>
      </div>

      {/* Product detected banner */}
      {detectedProduct && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-50 border border-orange-200">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-semibold text-orange-700 uppercase tracking-widest">
            Pre-filled from product page:
          </span>
          <span className="text-sm font-bold text-orange-600">
            {PRODUCT_MAP[detectedProduct]?.full}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Product Type">
          <select
            className={selectClass}
            value={data.productType}
            onChange={(e) => onChange({ productType: e.target.value as ProductKey })}
          >
            <option value="">select type</option>
            <option value="ago">AGO (Diesel)</option>
            <option value="pms">PMS (Petrol)</option>
            <option value="atk">ATK (Jet Fuel)</option>
            <option value="lpg">LPG (Gas)</option>
          </select>
        </Field>

        <Field label="Product Quantity">
          <select
            className={selectClass}
            value={data.productQuantity}
            onChange={(e) => onChange({ productQuantity: e.target.value })}
          >
            <option value="">select a quantity</option>
            <option value="33000">33,000 litres</option>
            <option value="45000">45,000 litres</option>
            <option value="60000">60,000 litres</option>
            <option value="100000">100,000 litres</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Preferred Delivery Date">
          <input
            className={inputClass}
            type="date"
            value={data.preferredDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => onChange({ preferredDate: e.target.value })}
          />
        </Field>
        <Field label="Preferred Delivery Time">
          <select
            className={selectClass}
            value={data.preferredTime}
            onChange={(e) => onChange({ preferredTime: e.target.value })}
          >
            <option value="">select preferred time</option>
            <option value="06:00-09:00">6:00 AM – 9:00 AM</option>
            <option value="09:00-12:00">9:00 AM – 12:00 PM</option>
            <option value="12:00-15:00">12:00 PM – 3:00 PM</option>
            <option value="15:00-18:00">3:00 PM – 6:00 PM</option>
          </select>
        </Field>
      </div>

      <Field label="Delivery Urgency">
        <select
          className={selectClass}
          value={data.deliveryUrgency}
          onChange={(e) => onChange({ deliveryUrgency: e.target.value })}
        >
          <option value="">select urgency level</option>
          <option value="standard">Standard (48–72 hrs)</option>
          <option value="priority">Priority (24–48 hrs)</option>
          <option value="express">Express (within 24 hrs)</option>
        </select>
      </Field>

      <Field label="Haulage Truck">
        <select
          className={selectClass}
          value={data.haulageTruck}
          onChange={(e) => onChange({ haulageTruck: e.target.value })}
        >
          <option value="">select truck arrangement</option>
          <option value="owned_truck">Owned Truck</option>
          <option value="Company Provided">Company Provided Truck</option>
        </select>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Driver's Name" className="md:col-span-1">
          <input
            className={inputClass}
            placeholder="enter driver's full name"
            value={data.driverName}
            onChange={(e) => onChange({ driverName: e.target.value })}
          />
        </Field>
        <Field label="Driver's ID Type">
          <select
            className={selectClass}
            value={data.driverIdType}
            onChange={(e) => onChange({ driverIdType: e.target.value })}
          >
            <option value="">select ID type</option>
            <option value="nin">NIN</option>
            <option value="passport">Passport</option>
            <option value="drivers-license">Driver&apos;s License</option>
          </select>
        </Field>
        <Field label="Driver's ID Number">
          <input
            className={inputClass}
            placeholder="enter ID number"
            value={data.driverIdNumber}
            onChange={(e) => onChange({ driverIdNumber: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Special Instructions (Optional)">
        <textarea
          className={`${inputClass} resize-none`}
          placeholder="Any special delivery instructions, access notes, or requirements…"
          rows={3}
          value={data.specialInstructions}
          onChange={(e) => onChange({ specialInstructions: e.target.value })}
        />
      </Field>
    </div>
  );
};

// ─── Stage 4: Payment ──────────────────────────────────────────────────────────

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
        <path d="M8 12h8M12 8v8" strokeLinecap="round" />
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
  bankSettings: { bankName: string; bankAccountName: string; bankAccountNumber: string };
  availableMethods?: typeof PAYMENT_METHODS;
}) => {
  const isPaystack = data.paymentMethod === "paystack";
  const isGlobalpay = data.paymentMethod === "globalpay";
  const isManual   = data.paymentMethod && data.paymentMethod !== "paystack" && data.paymentMethod !== "globalpay";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Payment</h2>
        <p className="text-sm italic text-gray-500 mt-1">
          Secure your booking by completing the deposit or full payment below.
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
                  ${selected
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
            <p className="font-bold text-teal-800 text-sm">Secure Booking Deposit via Paystack</p>
            <p className="text-teal-700 text-xs mt-1 leading-relaxed">
              You will be securely redirected to Paystack&apos;s checkout to complete your booking deposit.
              Paystack accepts cards, bank transfers, and OPay — no details needed here.
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
            <p className="font-bold text-blue-800 text-sm">Secure Booking Deposit via GlobalPay</p>
            <p className="text-blue-700 text-xs mt-1 leading-relaxed">
              You will be securely redirected to GlobalPay&apos;s checkout to complete your booking deposit.
              No card details needed here.
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
                Transfer booking deposit to this account
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
            Booking reservations require a deposit within 24 hours of placement to confirm your slot.
            Please ensure your transfer reference is accurate before submitting your booking.
          </div>
        </>
      )}
    </div>
  );
};

// ─── Step Indicator ────────────────────────────────────────────────────────────

const STAGES = ["Company Info", "Owner Info", "Booking Details", "Payment"];

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center mb-8">
    {STAGES.map((label, i) => {
      const done   = i < current;
      const active = i === current;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done
                  ? "bg-orange-500 text-white"
                  : active
                  ? "bg-orange-500 text-white ring-4 ring-orange-200"
                  : "bg-gray-200 text-gray-400"
                }`}
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
              className={`flex-1 h-0.5 mb-5 transition-all ${
                i < current ? "bg-orange-500" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main BookNow Page ─────────────────────────────────────────────────────────

export default function BookNow() {
  const router = useRouter();
  const [stage, setStage]               = useState(0);
  const [submitted, setSubmitted]       = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [detectedProduct, setDetected]  = useState<ProductKey>("");
  const [submitError, setSubmitError]   = useState("");
  const [bankSettings, setBankSettings] = useState({ bankName: "First Bank of Nigeria", bankAccountName: "e-Nergy Solutions Limited", bankAccountNumber: "" });
  const [platformInfo, setPlatformInfo] = useState({ supportEmail: "info@e-nergy.com.ng", supportPhone: "(+234) 08087550875" });
  const [paystackKey, setPaystackKey]   = useState("pk_test_REPLACE_WITH_YOUR_KEY");
  const [enabledMethods, setEnabledMethods] = useState({ enableBankTransfer: true, enablePaystack: true, enableOpay: true, enableGlobalpay: true });
  const [prices, setPrices] = useState({ pms: 0, ago: 0, atk: 0 });
  const rateLimit = useRateLimit({ maxAttempts: 5, windowMs: 60_000 });

  // ── Detect product from query param: /booknow?product=pms ──────────────────
  // On your product pages, link like:
  //   <Link href="/booknow?product=pms">Book Now</Link>
  //   or router.push(`/booknow?product=${productKey}`)
  useEffect(() => {
    if (!router.isReady) return;
    const qp = router.query.product;
    const key = (Array.isArray(qp) ? qp[0] : qp ?? "").toLowerCase() as ProductKey;
    if (key && PRODUCT_MAP[key]) {
      setDetected(key);
      // Pre-fill the booking product type immediately
      setFormData((f) => ({
        ...f,
        booking: { ...f.booking, productType: key },
      }));
    }
  }, [router.isReady, router.query.product]);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setBankSettings({ bankName: s.bankName || "First Bank of Nigeria", bankAccountName: s.bankAccountName || "e-Nergy Solutions Limited", bankAccountNumber: s.bankAccountNumber || "" });
      setPlatformInfo({ supportEmail: s.supportEmail || "info@e-nergy.com.ng", supportPhone: s.supportPhone || "(+234) 08087550875" });
      if (s.paystackPublicKey) setPaystackKey(s.paystackPublicKey);
      setEnabledMethods({ enableBankTransfer: s.enableBankTransfer !== false, enablePaystack: s.enablePaystack !== false, enableOpay: s.enableOpay !== false, enableGlobalpay: s.enableGlobalpay !== false });
      setPrices({ pms: s.pmsPricePerLitre || 0, ago: s.agoPricePerLitre || 0, atk: s.atkPricePerLitre || 0 });
    }).catch(() => null);
  }, []);

  const computeBookingTotal = () => {
    const qty   = Number(formData.booking.productQuantity) || 0;
    const type  = formData.booking.productType.toLowerCase();
    const price = type === "pms" ? prices.pms : type === "ago" ? prices.ago : type === "atk" ? prices.atk : 0;
    return qty * price;
  };

  // ── Load Paystack script ────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("paystack-script")) return;
    const script  = document.createElement("script");
    script.id     = "paystack-script";
    script.src    = "https://js.paystack.co/v1/inline.js";
    script.async  = true;
    document.body.appendChild(script);
  }, []);

  const [formData, setFormData] = useState<FormData>({
    company: {
      name: "", dprRegNo: "", cacRegNo: "",
      headOfficeAddress: "", telephone: "", email: "", deliveryAddress: "", loadingDepot: "",
    },
    owner: {
      name: "", telephone: "", address: "",
      email: "", officialIdType: "", idNumber: "",
    },
    booking: {
      productType: "",
      productQuantity: "",
      preferredDate: "",
      preferredTime: "",
      deliveryUrgency: "",
      specialInstructions: "",
      haulageTruck: "",
      driverName: "",
      driverIdType: "",
      driverIdNumber: "",
    },
    payment: {
      paymentMethod: "", bankName: "", accountName: "", transactionRef: "",
    },
  });

  const updateCompany = (d: Partial<CompanyInfo>) =>
    setFormData((f) => ({ ...f, company: { ...f.company, ...d } }));
  const updateOwner = (d: Partial<OwnerInfo>) =>
    setFormData((f) => ({ ...f, owner: { ...f.owner, ...d } }));
  const updateBooking = (d: Partial<BookingInfo>) =>
    setFormData((f) => ({ ...f, booking: { ...f.booking, ...d } }));
  const updatePayment = (d: Partial<PaymentInfo>) =>
    setFormData((f) => ({ ...f, payment: { ...f.payment, ...d } }));

  const handlePaystack = () => {
    // @ts-ignore
    if (!window.PaystackPop) { alert("Payment gateway is still loading. Please wait a moment and try again."); return; }
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key:      paystackKey,
      email:    sanitizeString(formData.owner.email || formData.company.email),
      amount:   computeBookingTotal() * 100,
      currency: "NGN",
      ref:      `BK-${Date.now()}`,
      metadata: {
        companyName:     sanitizeString(formData.company.name),
        productType:     sanitizeString(formData.booking.productType),
        productQuantity: sanitizeString(formData.booking.productQuantity),
        preferredDate:   formData.booking.preferredDate,
        deliveryUrgency: sanitizeString(formData.booking.deliveryUrgency),
      },
      onClose:  () => {},
      callback: (response: { reference: string }) => {
        handleManualSubmit(response.reference);
      },
    });
    handler.openIframe();
  };

  const handleGlobalPay = async () => {
    try {
      const id = `ENR-${Date.now()}`;
      const mapPM = (m: string) => m === "bank-transfer" ? "bank_transfer" : "card";

      // Build the purchase order payload (same as handleManualSubmit)
      const poPayload = {
        orderId:          id,
        loadingDepot:     sanitizeString(formData.company.loadingDepot),
        companyName:      sanitizeString(formData.company.name),
        dprRegNo:         sanitizeString(formData.company.dprRegNo),
        cacRegNo:         sanitizeString(formData.company.cacRegNo),
        companyAddress:   sanitizeString(formData.company.headOfficeAddress),
        companyTelephone: sanitizeString(formData.company.telephone),
        companyEmail:     sanitizeString(formData.company.email),
        stationAddress:   sanitizeString(formData.company.deliveryAddress),
        ownerName:        sanitizeString(formData.owner.name),
        ownerTelephone:   sanitizeString(formData.owner.telephone),
        ownerAddress:     sanitizeString(formData.owner.address),
        ownerEmail:       sanitizeString(formData.owner.email),
        ownerIdType:      sanitizeString(formData.owner.officialIdType),
        ownerIdNumber:    sanitizeString(formData.owner.idNumber),
        productType:      formData.booking.productType.toUpperCase(),
        productQuantity:  parseInt(sanitizeString(formData.booking.productQuantity).replace(/[^0-9]/g, ""), 10) || 0,
        haulageTruck:     (formData.booking.haulageTruck === "rent_truck" ? "rent_truck" : "owned_truck"),
        paymentMethod:    "card",
        totalAmount:      computeBookingTotal(),
        // fields GlobalPay backend needs for customer info
        directorName:     sanitizeString(formData.owner.name || formData.company.name),
        email:            sanitizeString(formData.owner.email || formData.company.email),
        telephone:        sanitizeString(formData.owner.telephone || formData.company.telephone),
      };

      const res = await fetch("/api/db/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poPayload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "Failed to create booking");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        // Fallback: show success if no checkout URL (shouldn't happen)
        setSubmitted(true);
        setShowFlowModal(true);
      }
    } catch (err: any) {
      setSubmitError(err?.message ?? "GlobalPay initiation failed. Please try again.");
    }
  };

  const validateStage = (s: number): string => {
    if (s === 0) {
      const c = formData.company;
      if (!c.loadingDepot)             return "Please select a loading depot.";
      if (!c.name.trim())              return "Company name is required.";
      if (!c.dprRegNo.trim())          return "Marketer's License Number is required.";
      if (!c.cacRegNo.trim())          return "CAC Registration number is required.";
      if (!c.headOfficeAddress.trim()) return "Head office address is required.";
      if (!c.telephone.trim())         return "Company telephone is required.";
      if (!c.email.trim())             return "Company email is required.";
      if (!c.deliveryAddress.trim())   return "Delivery address is required.";
    }
    if (s === 1) {
      const o = formData.owner;
      if (!o.name.trim())        return "Owner name is required.";
      if (!o.telephone.trim())   return "Owner telephone is required.";
      if (!o.address.trim())     return "Owner address is required.";
      if (!o.email.trim())       return "Owner email is required.";
      if (!o.officialIdType)     return "Please select an official ID type.";
      if (!o.idNumber.trim())    return "ID number is required.";
    }
    if (s === 2) {
      const b = formData.booking;
      if (!b.productType)     return "Please select a product type.";
      if (!b.productQuantity) return "Please select a product quantity.";
      if (!b.preferredDate)   return "Preferred delivery date is required.";
    }
    if (s === 3) {
      if (!formData.payment.paymentMethod) return "Please select a payment method.";
    }
    return "";
  };

  const handleManualSubmit = async (paystackRef?: string) => {
    try {
      const { api } = await import("@/lib/db-client");
      const orderId = `ENR-${Date.now()}`;
      const mapPM = (m: string) => m === "bank-transfer" ? "bank_transfer" : m === "paystack" ? "card" : m === "globalpay" ? "card" : m;
      const pmMethod = paystackRef ? "card" : mapPM(formData.payment.paymentMethod);
      const txnRef = paystackRef || sanitizeString(formData.payment.transactionRef);

      const poDoc = await api.purchaseOrders.create({
        orderId,
        loadingDepot: sanitizeString(formData.company.loadingDepot),
        companyName: sanitizeString(formData.company.name),
        dprRegNo: sanitizeString(formData.company.dprRegNo),
        cacRegNo: sanitizeString(formData.company.cacRegNo),
        companyAddress: sanitizeString(formData.company.headOfficeAddress),
        companyTelephone: sanitizeString(formData.company.telephone),
        companyEmail: sanitizeString(formData.company.email),
        stationAddress: sanitizeString(formData.company.deliveryAddress),
        ownerName: sanitizeString(formData.owner.name),
        ownerTelephone: sanitizeString(formData.owner.telephone),
        ownerAddress: sanitizeString(formData.owner.address),
        ownerEmail: sanitizeString(formData.owner.email),
        ownerIdType: sanitizeString(formData.owner.officialIdType),
        ownerIdNumber: sanitizeString(formData.owner.idNumber),
        productType: formData.booking.productType.toUpperCase(),
        productQuantity: parseInt(sanitizeString(formData.booking.productQuantity).replace(/[^0-9]/g, ""), 10) || 0,
        haulageTruck: (formData.booking.haulageTruck === "rent_truck" ? "rent_truck" : "owned_truck") as "owned_truck" | "rent_truck",
        paymentMethod: pmMethod as import("@/lib/db-types").PaymentMethod,
        bankName: sanitizeString(formData.payment.bankName),
        bankAccountName: sanitizeString(formData.payment.accountName),
        transactionRef: txnRef,
      });

      // Create Transaction and cross-link with PurchaseOrder
      // Use paystackRef as reference when available so the webhook finds
      // this record and updates it instead of creating a duplicate
      const txnDoc = await api.transactions.create({
        txnId:         `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        type:          "purchase_order",
        user:          sanitizeString(formData.owner.name || formData.company.name),
        userEmail:     sanitizeString(formData.owner.email || formData.company.email),
        userRole:      "bulk_dealer",
        product:       formData.booking.productType.toUpperCase(),
        quantity:      sanitizeString(formData.booking.productQuantity),
        totalAmount:   computeBookingTotal(),
        status:        paystackRef ? "completed" : "pending",
        paymentMethod: pmMethod,
        depot:         sanitizeString(formData.company.loadingDepot),
        reference:     paystackRef || orderId,
        referenceType: "purchase_order",
        ...(poDoc?._id ? { referenceId: poDoc._id } : {}),
      } as any).catch(() => null);

      if (txnDoc?._id && poDoc?._id) {
        api.purchaseOrders.update(String(poDoc._id), { transactionId: txnDoc._id } as any).catch(() => null);
      }

      setSubmitted(true);
      setShowFlowModal(true);
    } catch (err) {
      console.error("[booknow] order create failed:", err);
      setSubmitError("Failed to submit booking. Please check your connection and try again.");
    }
  };

  const handleNext = () => {
    setSubmitError("");
    const err = validateStage(stage);
    if (err) { setSubmitError(err); return; }
    if (stage < 3) { setStage((s) => s + 1); return; }
    if (!rateLimit.attempt()) {
      setSubmitError(`Too many submissions. Please wait ${Math.ceil(rateLimit.remainingMs / 1000)}s.`);
      return;
    }
    if (formData.payment.paymentMethod === "paystack") { handlePaystack(); return; }
    if (formData.payment.paymentMethod === "globalpay") { handleGlobalPay(); return; }
    handleManualSubmit();
  };

  const handleBack = () => {
    if (stage > 0) setStage((s) => s - 1);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Book Now | e-Nergy</title></Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24">
        {submitted ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 p-10 max-w-md w-full text-center space-y-4">
            <div className="text-6xl">📋</div>
            <h2 className="text-2xl font-bold text-gray-800">Booking Submitted!</h2>
            <p className="text-gray-500 text-sm">
              Your booking for{" "}
              <span className="font-semibold">
                {formData.booking.productType
                  ? PRODUCT_MAP[formData.booking.productType]?.full
                  : "your product"}
              </span>{" "}
              has been received.{" "}
              {formData.company.name && (
                <>
                  <span className="font-semibold">{formData.company.name}</span>&apos;s{" "}
                </>
              )}
              booking is now pending confirmation. Our team will contact you within 24 hours to confirm
              your delivery slot.
            </p>
            {formData.booking.preferredDate && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-200">
                <span className="text-orange-500">📅</span>
                <span className="text-sm font-semibold text-orange-700">
                  Requested: {new Date(formData.booking.preferredDate).toLocaleDateString("en-GB", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                setSubmitted(false);
                setStage(0);
                setFormData((f) => ({
                  ...f,
                  booking: { ...f.booking, productType: detectedProduct },
                }));
              }}
              className="mt-4 px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition"
            >
              Make Another Booking
            </button>
          </div>
        ) : (
          <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">

            {/* Left sidebar */}
            <div className="hidden md:flex flex-col justify-center px-8 py-8 min-w-[240px] max-w-[260px] pt-0">
              <h1 className="text-gray-900 text-xl font-extrabold uppercase leading-snug mb-4">
                Welcome to<br />e-Nergy<br />Oil &amp; Gas<br />Booking Portal
              </h1>

              {/* Detected product pill in sidebar */}
              {detectedProduct && PRODUCT_MAP[detectedProduct] && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-orange-100 border border-orange-300 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-0.5">
                    Booking
                  </p>
                  <p className="text-sm font-extrabold text-orange-700">
                    {PRODUCT_MAP[detectedProduct].full}
                  </p>
                </div>
              )}

              <p className="text-gray-500 text-xs italic mb-8">
                Please be informed that bookings require a deposit within 24 hours of placement to secure your delivery slot.
              </p>
              <div className="space-y-3">
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

            {/* Right: form */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>
              <StepIndicator current={stage} />

              {stage === 0 && (
                <CompanyStage data={formData.company} onChange={updateCompany} />
              )}
              {stage === 1 && (
                <OwnerStage data={formData.owner} onChange={updateOwner} />
              )}
              {stage === 2 && (
                <BookingStage
                  data={formData.booking}
                  onChange={updateBooking}
                  detectedProduct={detectedProduct}
                />
              )}
              {stage === 3 && (
                <PaymentStage data={formData.payment} onChange={updatePayment} bankSettings={bankSettings} availableMethods={PAYMENT_METHODS.filter(m => m.value === "bank-transfer" ? enabledMethods.enableBankTransfer : m.value === "opay" ? enabledMethods.enableOpay : m.value === "globalpay" ? enabledMethods.enableGlobalpay : enabledMethods.enablePaystack)} />
              )}

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
                  {stage === 3
                    ? formData.payment.paymentMethod === "paystack"
                      ? "Pay Deposit →"
                      : formData.payment.paymentMethod
                      ? "Confirm Booking →"
                      : "Submit Booking"
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
        title="Booking Submitted!"
        subtitle="Your delivery booking has been received. We'll be in touch shortly."
        completedSteps={[
          { label: "Company", detail: "Info Added" },
          { label: "Owner", detail: "Details" },
          { label: "Booking", detail: "Scheduled" },
          { label: "Payment", detail: "Confirmed" },
        ]}
        summary={[
          { label: "Company", value: formData.company.name },
          { label: "Product", value: formData.booking.productType ? (PRODUCT_MAP[formData.booking.productType]?.full ?? formData.booking.productType) : "—" },
          { label: "Quantity", value: formData.booking.productQuantity ? `${formData.booking.productQuantity}L` : "—" },
          { label: "Urgency", value: formData.booking.deliveryUrgency || "—" },
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
            label: "Pay Dues",
            description: "Settle outstanding levies",
            href: "/paydues",
            color: "purple",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
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
