"use client";
import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import FlowCompleteModal from "@/components/FlowCompleteModal";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeString } from "@/lib/security/sanitize";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseRecord {
  orderId: string;
  companyName: string;
  ownerName: string;
  email: string;
  telephone: string;
  productType: string;
  productQuantity: string;
  haulageTruck: string;
  driverName: string;
  driverIdType: string;
  driverIdNumber: string;
  truckRegNumber: string;
  tankCapacity: string;
  paymentMethod: string;
  transactionRef: string;
  purchaseDate: string;
  stationAddress: string;
  loadingDepot: string; // AUTO-FILLED from purchase
}

interface LoadingDetails {
  loadingDate: string;
  compartment1: string;
  compartment2: string;
  compartment3: string;
  compartment4: string;
  compartment5: string;
  remarks: string;
}


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

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STAGES = ["ID Verification", "Loading Details", "Compartment Fill"];

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
            <div className={`flex-1 h-0.5 mb-5 transition-all ${i < current ? "bg-orange-500" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Stage 0: ID Verification ─────────────────────────────────────────────────

const VerificationStage = ({
  onVerified,
}: {
  onVerified: (record: PurchaseRecord) => void;
}) => {
  const [inputId, setInputId] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async () => {
    const trimmed = inputId.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg("Please enter your Order ID.");
      setStatus("error");
      return;
    }
    setStatus("checking");
    try {
      const { api } = await import("@/lib/db-client");
      const result = await (api.purchaseOrders.list as Function)({ orderId: trimmed });
      const order = result?.data?.[0];
      if (order) {
        setStatus("idle");
        onVerified({
          orderId: order.orderId || trimmed,
          companyName: order.companyName || "",
          ownerName: order.ownerName || "",
          email: order.ownerEmail || order.companyEmail || "",
          telephone: order.ownerTelephone || order.companyTelephone || "",
          productType: order.productType || "",
          productQuantity: String(order.productQuantity ?? ""),
          haulageTruck: order.haulageTruck || "",
          driverName: "",
          driverIdType: order.ownerIdType || "",
          driverIdNumber: order.ownerIdNumber || "",
          truckRegNumber: "",
          tankCapacity: "",
          paymentMethod: order.paymentMethod || "",
          transactionRef: order.transactionRef || "",
          purchaseDate: (order as any).createdAt || "",
          stationAddress: order.stationAddress || "",
          loadingDepot: order.loadingDepot || "",
        });
      } else {
        setStatus("error");
        setErrorMsg("Order ID not found or payment not yet confirmed. Please check the ID and try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Unable to verify order. Please check your connection and try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">ID Verification</h2>
        <p className="text-sm italic text-gray-500 mt-1">
          Enter the unique Order ID generated after your purchase to begin the loading process.
        </p>
      </div>

      {/* What is an Order ID callout */}
      <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 flex gap-3">
        <span className="text-orange-400 text-xl flex-shrink-0 mt-0.5">ℹ️</span>
        <div className="text-xs text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-1">Where do I find my Order ID?</p>
          Your Order ID (e.g. <span className="font-mono font-bold text-orange-600">ENR-2025-001A</span>) was
          generated on your waybill document after your purchase was confirmed. It is also included in
          your confirmation email. <br />
        </div>
      </div>

      <Field label="Order ID / Unique Purchase Reference">
        <input
          className={`${inputClass} font-mono text-base tracking-widest ${
            status === "error" ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""
          }`}
          placeholder="e.g. ENR-2025-001A"
          value={inputId}
          onChange={(e) => {
            setInputId(e.target.value);
            setStatus("idle");
            setErrorMsg("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        />
        {status === "error" && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <span>⚠</span> {errorMsg}
          </p>
        )}
      </Field>

      <button
        onClick={handleVerify}
        disabled={status === "checking"}
        className="w-full py-3 bg-orange-500 text-white font-bold rounded hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "checking" ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Verifying...
          </>
        ) : (
          "Verify & Proceed →"
        )}
      </button>
    </div>
  );
};

// ─── Verified Banner ──────────────────────────────────────────────────────────

const VerifiedBanner = ({ record }: { record: PurchaseRecord }) => (
  <div className="rounded-lg border-2 border-green-400 bg-green-50 p-4 mb-6">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-green-800 font-bold text-sm">Purchase Verified ✓</p>
        <p className="text-green-700 text-xs mt-0.5">
          Order <span className="font-mono font-bold">{record.orderId}</span> — {record.companyName}
        </p>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-green-700">
          <span><span className="font-semibold">Product:</span> {record.productType}</span>
          <span><span className="font-semibold">Qty:</span> {record.productQuantity} L</span>
          <span><span className="font-semibold">Truck:</span> {record.truckRegNumber}</span>
          <span><span className="font-semibold">Driver:</span> {record.driverName}</span>
          <span><span className="font-semibold">Payment:</span> {record.paymentMethod}</span>
          <span><span className="font-semibold">Date:</span> {record.purchaseDate}</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Stage 1: Loading Details ─────────────────────────────────────────────────

const LoadingDetailsStage = ({
  record,
  data,
  onChange,
}: {
  record: PurchaseRecord;
  data: LoadingDetails;
  onChange: (d: Partial<LoadingDetails>) => void;
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Loading Details</h2>
      <p className="text-sm italic text-gray-500 mt-1">
        Confirm loading depot and select the loading date.
      </p>
    </div>
    <VerifiedBanner record={record} />
    
    <div className="grid grid-cols-1 gap-4">
      <Field label="Loading Depot / Terminal">
        <input
          className={`${inputClass} bg-gray-100 cursor-not-allowed font-semibold text-gray-700`}
          value={record.loadingDepot}
          disabled
          readOnly
        />
        <p className="text-xs text-gray-500 mt-1">
          ℹ️ Depot was selected during purchase and cannot be changed.
        </p>
      </Field>
      
      <Field label="Loading Date">
        <input
          className={`${inputClass} bg-gray-100 cursor-not-allowed`}
          type="text"
          placeholder="updated by terminal supervisor"
          value={data.loadingDate}
          disabled
          readOnly
        />
      </Field>
    </div>

    {/* Truck summary */}
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Truck on Record</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-700">
        <span><span className="font-semibold">Reg No:</span> {record.truckRegNumber}</span>
        <span><span className="font-semibold">Capacity:</span> {record.tankCapacity}</span>
        <span><span className="font-semibold">Haulage:</span> {record.haulageTruck}</span>
        <span><span className="font-semibold">Driver:</span> {record.driverName}</span>
        <span><span className="font-semibold">Driver ID:</span> {record.driverIdNumber}</span>
      </div>
    </div>
  </div>
);

// ─── Stage 2: Compartment Fill (3 compartments only) ──────────────────────────

const CompartmentStage = ({
  record,
  data,
  onChange,
}: {
  record: PurchaseRecord;
  data: LoadingDetails;
  onChange: (d: Partial<LoadingDetails>) => void;
}) => {
  const compartments = [
    { key: "compartment1" as keyof LoadingDetails, label: "Compartment 1" },
    { key: "compartment2" as keyof LoadingDetails, label: "Compartment 2" },
    { key: "compartment3" as keyof LoadingDetails, label: "Compartment 3" },
    { key: "compartment4" as keyof LoadingDetails, label: "Compartment 4" },
    { key: "compartment5" as keyof LoadingDetails, label: "Compartment 5" },
  ];

  const totalFilled = compartments.reduce((acc, c) => acc + (parseFloat(data[c.key] as string) || 0), 0);
  const ordered = parseFloat(record.productQuantity.replace(/,/g, "")) || 0;
  const remaining = ordered - totalFilled;
  const overloaded = remaining < 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Compartment Loading</h2>
        <p className="text-sm italic text-gray-500 mt-1">
          Enter the volume (in litres) to be loaded into each of the 5 compartments. Total must not exceed the ordered quantity.
        </p>
      </div>
      <VerifiedBanner record={record} />

      {/* Ordered qty header */}
      <div className="rounded-lg bg-gray-900 text-white px-5 py-3 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Ordered Quantity</p>
          <p className="text-lg font-bold text-orange-400">{record.productQuantity} Litres</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Product</p>
          <p className="text-base font-bold text-white">{record.productType}</p>
        </div>
      </div>

      {/* Compartment inputs - ONLY 3 */}
      <div className="space-y-3">
        {compartments.map((c, i) => {
          const val = parseFloat(data[c.key] as string) || 0;
          return (
            <div key={c.key} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <div className="flex-1">
                <input
                  className={inputClass}
                  placeholder={`${c.label} volume in litres`}
                  type="number"
                  min="0"
                  value={data[c.key] as string}
                  onChange={(e) => onChange({ [c.key]: e.target.value })}
                />
              </div>
              {val > 0 && (
                <span className="text-xs font-bold text-orange-600 w-24 text-right flex-shrink-0">
                  {val.toLocaleString()} L
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Running totals */}
      <div className={`rounded-lg p-4 border-2 ${overloaded ? "border-red-400 bg-red-50" : "border-green-300 bg-green-50"}`}>
        <div className="flex justify-between text-sm font-semibold">
          <span className={overloaded ? "text-red-700" : "text-green-700"}>Total Filled</span>
          <span className={overloaded ? "text-red-700 font-bold" : "text-green-700 font-bold"}>
            {totalFilled.toLocaleString()} L
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Remaining</span>
          <span className={`font-bold ${overloaded ? "text-red-600" : "text-gray-700"}`}>
            {overloaded ? `OVER by ${Math.abs(remaining).toLocaleString()} L ⚠` : `${remaining.toLocaleString()} L`}
          </span>
        </div>
        {overloaded && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            Total compartment volume exceeds your ordered quantity. Please reduce compartment volumes.
          </p>
        )}
      </div>

      {/* Remarks field */}
      <Field label="Remarks / Notes (Optional)">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="any loading notes, seal numbers, temperature readings, etc."
          value={data.remarks}
          onChange={(e) => onChange({ remarks: e.target.value })}
        />
      </Field>
    </div>
  );
};

// ─── Waybill / Loading Order Document ────────────────────────────────────────

const WaybillModal = ({
  record,
  loading,
  onClose,
  platformInfo,
}: {
  record: PurchaseRecord;
  loading: LoadingDetails;
  onClose: () => void;
  platformInfo: { platformName: string; supportEmail: string; supportPhone: string; rcNumber: string };
}) => {
  const waybillRef = `WB-${record.orderId}-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const compartments = [
    { label: "Compartment 1", value: loading.compartment1 },
    { label: "Compartment 2", value: loading.compartment2 },
    { label: "Compartment 3", value: loading.compartment3 },
    { label: "Compartment 4", value: loading.compartment4 },
    { label: "Compartment 5", value: loading.compartment5 },
  ].filter((c) => c.value && parseFloat(c.value) > 0);

  const totalLoaded = compartments.reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl my-6">

        {/* ── Print styles injected inline ── */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #waybill-doc, #waybill-doc * { visibility: visible !important; }
            #waybill-doc { position: fixed; inset: 0; padding: 32px; background: white; }
            .no-print { display: none !important; }
          }
        `}</style>

        <div id="waybill-doc">
          {/* ── Waybill Header ── */}
          <div className="bg-gray-900 px-8 py-6 relative">
            {/* Close X button */}
            <button
              onClick={onClose}
              className="no-print absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group"
              aria-label="Close waybill"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 group-hover:scale-110 transition-transform"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-400 text-xs font-bold uppercase tracking-[0.3em] mb-1">
                  {platformInfo.platformName}
                </p>
                <h1 className="text-white font-black text-3xl tracking-tight leading-none">
                  LOADING ORDER
                </h1>
                <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">
                  Waybill / Delivery Note
                </p>
              </div>
              <div className="text-right">
                <div className="bg-orange-500 text-white px-4 py-2 rounded inline-block mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Waybill No.</p>
                  <p className="font-mono font-black text-lg tracking-widest">{waybillRef}</p>
                </div>
                <p className="text-gray-400 text-xs block">Issued: {issueDate}</p>
                <p className="text-gray-400 text-xs">
                  Order Ref: <span className="text-orange-400 font-mono">{record.orderId}</span>
                </p>
              </div>
            </div>

            {/* Horizontal rule */}
            <div className="mt-5 border-t border-orange-500/40" />

            {/* Status badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span className="text-green-300 text-xs font-bold uppercase tracking-widest">
                Payment Verified · Authorised for Loading
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-8 space-y-7">

            {/* Section: Consignee */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 border-b border-orange-200 pb-1 mb-3">
                  Consignee (Buyer)
                </p>
                <p className="font-bold text-gray-900 text-sm">{record.companyName}</p>
                <p className="text-gray-600 text-xs mt-0.5">{record.ownerName}</p>
                <p className="text-gray-500 text-xs">{record.email}</p>
                <p className="text-gray-500 text-xs">{record.telephone}</p>
                <p className="text-gray-500 text-xs mt-1">{record.stationAddress}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 border-b border-orange-200 pb-1 mb-3">
                  Consignor (Depot)
                </p>
                <p className="font-bold text-gray-900 text-sm">{record.loadingDepot}</p>
                <p className="text-gray-500 text-xs">
                  Date: {loading.loadingDate
                    ? new Date(loading.loadingDate).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>

            {/* Section: Product */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 border-b border-orange-200 pb-1 mb-3">
                Product Details
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Product</p>
                  <p className="font-bold text-gray-800 text-sm mt-1">{record.productType}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ordered Qty</p>
                  <p className="font-bold text-gray-800 text-sm mt-1">{record.productQuantity} L</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                  <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">Total Loaded</p>
                  <p className="font-black text-orange-600 text-sm mt-1">{totalLoaded.toLocaleString()} L</p>
                </div>
              </div>
            </div>

            {/* Section: Compartments */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 border-b border-orange-200 pb-1 mb-3">
                Compartment Loading Record
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-gray-500 font-semibold rounded-l">
                      Compartment
                    </th>
                    <th className="text-right px-3 py-2 text-xs uppercase tracking-widest text-gray-500 font-semibold rounded-r">
                      Volume Loaded (Litres)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compartments.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-700">{c.label}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {parseFloat(c.value).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900">
                    <td className="px-3 py-2 text-white font-bold rounded-l">TOTAL</td>
                    <td className="px-3 py-2 text-right font-black text-orange-400 rounded-r">
                      {totalLoaded.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section: Vehicle */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 border-b border-orange-200 pb-1 mb-3">
                Vehicle & Driver
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                <span><span className="font-semibold text-gray-900">Reg No:</span> {record.truckRegNumber}</span>
                <span><span className="font-semibold text-gray-900">Capacity:</span> {record.tankCapacity}</span>
                <span><span className="font-semibold text-gray-900">Haulage:</span> {record.haulageTruck}</span>
                <span><span className="font-semibold text-gray-900">Driver:</span> {record.driverName}</span>
                <span><span className="font-semibold text-gray-900">ID Type:</span> {record.driverIdType}</span>
                <span><span className="font-semibold text-gray-900">ID No:</span> {record.driverIdNumber}</span>
              </div>
            </div>

            {/* Remarks */}
            {loading.remarks && (
              <div className="bg-gray-50 rounded p-3 border border-gray-200 text-xs text-gray-600">
                <span className="font-semibold text-gray-800">Remarks: </span>{loading.remarks}
              </div>
            )}

            {/* Payment proof */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-xs text-gray-700">
              <p className="font-bold text-green-800 mb-1 uppercase tracking-widest text-[10px]">
                Payment Confirmation
              </p>
              <p>
                <span className="font-semibold">Method:</span> {record.paymentMethod} ·{" "}
                <span className="font-semibold">Reference:</span>{" "}
                <span className="font-mono">{record.transactionRef}</span> ·{" "}
                <span className="font-semibold">Date:</span> {record.purchaseDate}
              </p>
            </div>

            {/* Legal footer */}
            <div className="border-t-2 border-dashed border-gray-200 pt-5 text-[10px] text-gray-400 leading-relaxed">
              <p className="font-bold text-gray-500 mb-1 uppercase tracking-widest text-[9px]">
                Important Notice
              </p>
              This is an <span className="font-bold text-gray-600">e-Waybill (Electronic Waybill)</span> generated 
              to confirm your purchase with {platformInfo.platformName}. This document serves as proof of your
              transaction and authorisation to proceed to the loading depot.
              <br /><br />
              <span className="font-bold text-orange-600">PLEASE NOTE:</span> This e-Waybill does NOT replace the
              official physical waybill that will be issued by the depot at the time of loading. Upon arrival at{" "}
              <span className="font-semibold text-gray-600">{record.loadingDepot}</span>, you must present this
              e-Waybill to receive your official depot-issued loading waybill, which is the legally binding document
              for transportation and delivery of petroleum products.
              <br /><br />
              Any tampering, falsification, or unauthorised reproduction of this document is an offence punishable
              under the Petroleum Act CAP P10 LFN 2004 and other applicable Nigerian laws. The {platformInfo.platformName}{" "}
              and its partners accept no liability for misuse of this document.
              <br /><br />
              <span className="font-bold text-gray-500">{platformInfo.platformName}</span> · {platformInfo.supportEmail} ·
              {platformInfo.supportPhone}{platformInfo.rcNumber ? ` · RC No. ${platformInfo.rcNumber}` : ""} · DPR Licensed Operator
            </div>
          </div>
        </div>

        {/* ── Modal Actions ── */}
        <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3 no-print border-t border-gray-100 pt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 border-2 border-orange-500 text-orange-600 text-sm font-bold rounded hover:bg-orange-50 transition flex items-center justify-center gap-2"
          >
            🖨 Print Loading Order
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Load Page ───────────────────────────────────────────────────────────

export default function LoadPage() {
  const [platformInfo, setPlatformInfo] = useState({ platformName: "e-Nergy Oil & Gas Platform", supportEmail: "info@energy.ng", supportPhone: "(+234) 08087550875", rcNumber: "" });

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (s) setPlatformInfo({ platformName: s.platformName || "e-Nergy Oil & Gas Platform", supportEmail: s.supportEmail || "info@energy.ng", supportPhone: s.supportPhone || "(+234) 08087550875", rcNumber: s.rcNumber || "" });
    }).catch(() => null);
  }, []);

  const [stage, setStage] = useState(0);
  const [verifiedRecord, setVerifiedRecord] = useState<PurchaseRecord | null>(null);
  const [showWaybill, setShowWaybill] = useState(false);
  const [complete, setComplete] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [loadError, setLoadError] = useState("");
  const rateLimit = useRateLimit({ maxAttempts: 5, windowMs: 60_000 });

  const [loadingDetails, setLoadingDetails] = useState<LoadingDetails>({
    loadingDate: "",
    compartment1: "",
    compartment2: "",
    compartment3: "",
    compartment4: "",
    compartment5: "",
    remarks: "",
  });

  const updateLoading = (d: Partial<LoadingDetails>) =>
    setLoadingDetails((prev) => ({ ...prev, ...d }));

  const handleVerified = (record: PurchaseRecord) => {
    setVerifiedRecord(record);
    setStage(1);
  };

  const handleNext = async () => {
    setLoadError("");

    if (stage === 2) {
      const keys = ["compartment1","compartment2","compartment3","compartment4","compartment5"] as const;
      const totalFilled = keys.reduce((acc, k) => acc + (parseFloat(loadingDetails[k]) || 0), 0);
      if (totalFilled <= 0) {
        setLoadError("Please enter volume for at least one compartment.");
        return;
      }
      const maxQty = parseFloat((verifiedRecord?.productQuantity ?? "").replace(/,/g, "")) || 0;
      if (maxQty > 0 && totalFilled > maxQty) {
        setLoadError(`Total volume (${totalFilled.toLocaleString()}L) exceeds ordered quantity (${maxQty.toLocaleString()}L).`);
        return;
      }
    }

    if (stage < 2) { setStage((s) => s + 1); return; }

    if (!rateLimit.attempt()) {
      setLoadError(`Too many submissions. Please wait ${Math.ceil(rateLimit.remainingMs / 1000)}s.`);
      return;
    }
    const sanitizedRemarks = sanitizeString(loadingDetails.remarks);
    setLoadingDetails((prev) => ({ ...prev, remarks: sanitizedRemarks }));

    const keys = ["compartment1","compartment2","compartment3","compartment4","compartment5"] as const;
    const compartmentValues = keys.map(k => parseFloat(loadingDetails[k]) || 0).filter(v => v > 0);
    const totalLitres = compartmentValues.reduce((a, b) => a + b, 0);

    try {
      const { api } = await import("@/lib/db-client");
      await api.loadingRecords.create({
        loadId:            `LOAD-${Date.now()}`,
        orderId:           verifiedRecord!.orderId,
        product:           verifiedRecord!.productType as "PMS" | "AGO" | "ATK",
        depot:             verifiedRecord!.loadingDepot || undefined,
        truckRegNumber:    verifiedRecord!.truckRegNumber || undefined,
        driverName:        verifiedRecord!.driverName || undefined,
        companyName:       verifiedRecord!.companyName || undefined,
        loadingDate:       loadingDetails.loadingDate || new Date().toISOString(),
        compartments:      compartmentValues,
        totalLitresLoaded: totalLitres,
        remarks:           sanitizedRemarks || undefined,
        status:            "Completed",
      } as any);
    } catch (err) {
      console.error("[load] failed to save loading record:", err);
      setLoadError("Failed to save loading record. Please try again.");
      return;
    }

    setComplete(true);
    setShowWaybill(true);
    setShowFlowModal(true);
  };

  const handleBack = () => {
    if (stage > 1) setStage((s) => s - 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 relative overflow-hidden">
      <Head><title>Load Fuel | e-Nergy</title></Head>
      {/* Animated industrial background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/tower.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24">
        <div className="flex w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">

          {/* Left sidebar */}
          <div className="hidden md:flex flex-col justify-center px-8 py-8 min-w-[220px] max-w-[240px]">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" strokeLinecap="round" />
                <rect x="9" y="11" width="14" height="10" rx="1" />
                <path d="M13 16h4M13 19h2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-gray-900 text-xl font-extrabold uppercase leading-snug mb-4">
              {platformInfo.platformName}<br />Loading<br />Portal
            </h1>
            <p className="text-gray-500 text-xs italic mb-6">
              Verify your purchase and complete the loading process to generate your official waybill.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-bold mt-0.5">1.</span>
                <span>Verify purchase ID</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-bold mt-0.5">2.</span>
                <span>Confirm depot & date</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-bold mt-0.5">3.</span>
                <span>Enter compartment volumes</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-bold mt-0.5">4.</span>
                <span>Print waybill</span>
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✉</span>
                <span className="text-gray-600 text-xs">{platformInfo.supportEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500">📞</span>
                <span className="text-gray-600 text-xs">{platformInfo.supportPhone}</span>
              </div>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block w-px bg-gray-200 my-6" />

          {/* Form */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "90vh" }}>
            {/* Step indicator only shows from stage 1 onward */}
            {stage > 0 && <StepIndicator current={stage - 1} />}

            {stage === 0 && <VerificationStage onVerified={handleVerified} />}
            {stage === 1 && verifiedRecord && (
              <LoadingDetailsStage record={verifiedRecord} data={loadingDetails} onChange={updateLoading} />
            )}
            {stage === 2 && verifiedRecord && (
              <CompartmentStage record={verifiedRecord} data={loadingDetails} onChange={updateLoading} />
            )}

            {/* Navigation */}
            {loadError && <p className="text-sm text-red-500 text-center mt-2">{loadError}</p>}
            {stage > 0 && (
              <div className="flex justify-between items-center mt-4 pt-6 border-t border-gray-100">
                <button
                  onClick={handleBack}
                  className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={stage === 2 && (() => {
                    const keys = ["compartment1","compartment2","compartment3","compartment4","compartment5"] as const;
                    const filled = keys.reduce((acc, k) => acc + (parseFloat(loadingDetails[k]) || 0), 0);
                    const max = parseFloat((verifiedRecord?.productQuantity ?? "").replace(/,/g, "")) || 0;
                    return max > 0 && filled > max;
                  })()}
                  className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stage === 2 ? "Complete & Generate Waybill →" : "Next ›"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showWaybill && verifiedRecord && (
        <WaybillModal
          record={verifiedRecord}
          loading={loadingDetails}
          onClose={() => setShowWaybill(false)}
          platformInfo={platformInfo}
        />
      )}

      <FlowCompleteModal
        isOpen={showFlowModal}
        onClose={() => setShowFlowModal(false)}
        title="Loading Complete!"
        subtitle="Your fuel has been loaded and waybill generated."
        orderId={verifiedRecord?.orderId}
        orderLabel="Order ID"
        completedSteps={[
          { label: "Verified", detail: "ID Check" },
          { label: "Details", detail: "Loading Info" },
          { label: "Filled", detail: "Compartments" },
          { label: "Waybill", detail: "Generated" },
        ]}
        summary={verifiedRecord ? [
          { label: "Company", value: verifiedRecord.companyName },
          { label: "Product", value: verifiedRecord.productType },
          { label: "Quantity", value: `${verifiedRecord.productQuantity}L` },
          { label: "Depot", value: verifiedRecord.loadingDepot },
        ] : []}
        nextActions={[
          {
            label: "Buy More Fuel",
            description: "Place another purchase order",
            href: "/buynow",
            color: "orange",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
          },
          {
            label: "Pay Dues",
            description: "Settle outstanding levies",
            href: "/paydues",
            color: "green",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
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