"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxnType   = "purchase_order" | "truck_rental" | "union_dues";
type TxnStatus = "completed" | "pending" | "failed";

interface Transaction {
  id: string;
  date: string;
  type: TxnType;
  depot: string;
  product: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  status: TxnStatus;
  paymentMethod: string;
  truckNumber: string;
}

interface TimelineStep {
  label: string;
  description: string;
  time: string | null;
  state: "done" | "active" | "pending" | "failed";
}

// ─── Mock base transactions ───────────────────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [];

// ─── Timeline generator ───────────────────────────────────────────────────────

function buildTimeline(txn: Transaction): TimelineStep[] {
  const d = (offset: number) => {
    const dt = new Date(txn.date);
    dt.setHours(Math.floor(Math.random() * 6) + 8);
    dt.setMinutes(Math.floor(Math.random() * 59));
    dt.setDate(dt.getDate() + offset);
    return dt.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const isFailed    = txn.status === "failed";
  const isCompleted = txn.status === "completed";
  const isPending   = txn.status === "pending";

  if (txn.type === "purchase_order") {
    const steps = [
      { label: "Order Placed",        description: "Your purchase order has been submitted to e-Nergy."    },
      { label: "Payment Verified",    description: "Payment confirmed and matched against your account."   },
      { label: "Order Confirmed",     description: "Order approved and scheduled for loading."             },
      { label: "Loading at Depot",    description: `Product loading at ${txn.depot} in progress.`         },
      { label: "In Transit",          description: `Truck ${txn.truckNumber} en route to your station.`   },
      { label: "Delivered",           description: "Product successfully delivered and offloaded."         },
    ];
    if (isCompleted) return steps.map((s, i) => ({ ...s, time: d(i === 0 ? 0 : i < 3 ? 0 : i - 2), state: "done" as const }));
    if (isFailed)    return steps.map((s, i) => ({ ...s, time: i <= 1 ? d(0) : null, state: (i <= 1 ? "done" : i === 2 ? "failed" : "pending") as TimelineStep["state"] }));
    /* pending */    return steps.map((s, i) => ({ ...s, time: i <= 2 ? d(i === 0 ? 0 : 0) : null, state: (i < 2 ? "done" : i === 2 ? "active" : "pending") as TimelineStep["state"] }));
  }

  if (txn.type === "truck_rental") {
    const steps = [
      { label: "Booking Submitted",  description: "Truck rental booking received by e-Nergy."                   },
      { label: "Payment Verified",   description: "Rental payment confirmed and cleared."                       },
      { label: "Truck Assigned",     description: `${txn.product} (${txn.truckNumber}) assigned to your order.` },
      { label: "Pickup Ready",       description: `Truck ready for pickup at ${txn.depot}.`                     },
      { label: "Rental Active",      description: "Rental period has started — truck is in your custody."       },
      { label: "Rental Completed",   description: "Truck returned and rental period closed."                    },
    ];
    if (isCompleted) return steps.map((s, i) => ({ ...s, time: d(i * 1), state: "done" as const }));
    if (isFailed)    return steps.map((s, i) => ({ ...s, time: i <= 1 ? d(0) : null, state: (i <= 1 ? "done" : i === 2 ? "failed" : "pending") as TimelineStep["state"] }));
    /* pending */    return steps.map((s, i) => ({ ...s, time: i <= 1 ? d(0) : null, state: (i < 2 ? "done" : i === 2 ? "active" : "pending") as TimelineStep["state"] }));
  }

  // Union Dues
  const steps = [
    { label: "Application Submitted", description: "Your dues payment application has been received."      },
    { label: "Payment Received",       description: "Payment recorded and matched to your membership ID."  },
    { label: "Under Review",           description: "Union secretariat reviewing your payment details."    },
    { label: "Approved",               description: "Payment approved and membership record updated."      },
    { label: "Certificate Issued",     description: "Compliance certificate generated and ready to print." },
  ];
  if (isCompleted) return steps.map((s, i) => ({ ...s, time: d(i), state: "done" as const }));
  if (isFailed)    return steps.map((s, i) => ({ ...s, time: i <= 1 ? d(0) : null, state: (i <= 1 ? "done" : i === 2 ? "failed" : "pending") as TimelineStep["state"] }));
  /* pending */    return steps.map((s, i) => ({ ...s, time: i <= 1 ? d(0) : null, state: (i < 2 ? "done" : i === 2 ? "active" : "pending") as TimelineStep["state"] }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionStatus() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected]       = useState<Transaction | null>(null);
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showDetail, setShowDetail]   = useState(false); // mobile
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeMsg, setDisputeMsg]   = useState("");
  const [disputeSent, setDisputeSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);

        import("@/lib/db-client").then(({ api }) => {
          api.transactions.list({ limit: 200 } as any).then((result) => {
            const apiTxns: Transaction[] = (result?.data ?? []).map((t: any) => ({
              id:            t.reference || t._id,
              date:          t.createdAt ? t.createdAt.slice(0, 10) : "",
              type:          (t.type === "union_dues" ? "union_dues" : t.type === "truck_rental" ? "truck_rental" : "purchase_order") as TxnType,
              depot:         t.depot || "—",
              product:       t.product || "—",
              quantity:      t.quantity ? `${Number(t.quantity).toLocaleString()}` : "—",
              unitPrice:     t.unitPrice ? `₦${Number(t.unitPrice).toLocaleString()}` : "—",
              totalAmount:   `₦${Number(t.totalAmount || 0).toLocaleString()}`,
              status:        (t.status === "completed" ? "completed" : t.status === "failed" ? "failed" : "pending") as TxnStatus,
              paymentMethod: t.paymentMethod || "—",
              truckNumber:   t.truckNumber || "—",
            }));

            const combined = [...apiTxns, ...MOCK_TRANSACTIONS];
            const seen = new Set<string>();
            const unique = combined.filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
            setTransactions(unique);
            if (unique.length > 0) setSelected(unique[0]);
          });
        });
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  // ── Filters ──
  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.id.toLowerCase().includes(q) || t.product.toLowerCase().includes(q) || t.depot.toLowerCase().includes(q);
    const matchType   = filterType   === "All" || t.type   === filterType;
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // ── Badge helpers ──
  const statusBadge = (s: TxnStatus) => {
    const m: Record<TxnStatus, string> = {
      completed: "bg-green-500/20 text-green-400 border-green-500/50",
      pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      failed:    "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return `${m[s]} px-2 py-0.5 rounded-full text-xs font-bold border`;
  };

  const typeBadge = (t: TxnType) => {
    const m: Record<TxnType, string> = {
      purchase_order: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      truck_rental:   "bg-purple-500/20 text-purple-400 border-purple-500/40",
      union_dues:     "bg-amber-500/20 text-amber-400 border-amber-500/40",
    };
    return `${m[t]} px-2 py-0.5 rounded-full text-xs font-bold border`;
  };

  const typeShort = (t: TxnType) => ({ purchase_order: "Fuel", truck_rental: "Truck", union_dues: "Dues" }[t]);

  // ── Step icon ──
  const stepIcon = (state: TimelineStep["state"]) => {
    if (state === "done")    return <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>;
    if (state === "active")  return <div className="w-8 h-8 rounded-full bg-orange-500 ring-4 ring-orange-500/30 flex items-center justify-center shrink-0 animate-pulse"><div className="w-3 h-3 rounded-full bg-white" /></div>;
    if (state === "failed")  return <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>;
    return <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-gray-500" /></div>;
  };

  const timeline = selected ? buildTimeline(selected) : [];

  const handleSelect = (t: Transaction) => { setSelected(t); setShowDetail(true); };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Transaction Status | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      {/* ── Raise Dispute Modal ── */}
      {disputeOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setDisputeOpen(false); setDisputeSent(false); setDisputeMsg(""); }} />
          <div className="relative z-10 w-full max-w-md bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-red-500/5">
              <p className="text-sm font-bold text-red-400 uppercase tracking-wider">Raise a Dispute</p>
              <button onClick={() => { setDisputeOpen(false); setDisputeSent(false); setDisputeMsg(""); }} className="text-gray-500 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {disputeSent ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-white font-bold text-lg">Dispute Submitted</p>
                <p className="text-gray-400 text-sm">Our support team will review your dispute for transaction <span className="text-orange-400 font-mono font-semibold">{selected.id}</span> and respond within 24–48 hours.</p>
                <button onClick={() => { setDisputeOpen(false); setDisputeSent(false); setDisputeMsg(""); }} className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition">
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Transaction</p>
                  <p className="text-sm font-mono font-bold text-orange-400">{selected.id}</p>
                  <p className="text-xs text-gray-400">{selected.type} · {selected.totalAmount}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Describe the issue</label>
                  <textarea
                    rows={4}
                    value={disputeMsg}
                    onChange={(e) => setDisputeMsg(e.target.value)}
                    placeholder="Explain what went wrong with this transaction…"
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-sm resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={() => { setDisputeOpen(false); setDisputeMsg(""); }} className="px-4 py-2 border border-gray-700 text-gray-400 hover:text-white text-sm font-semibold rounded-lg transition">
                    Cancel
                  </button>
                  <button
                    disabled={!disputeMsg.trim()}
                    onClick={() => setDisputeSent(true)}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                  >
                    Submit Dispute
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Transaction Status</h1>
            <p className="text-gray-400 text-sm">Track the real-time status and delivery progress of your transactions</p>
          </div>

          {/* Mobile back button */}
          {showDetail && (
            <button
              onClick={() => setShowDetail(false)}
              className="flex items-center gap-2 mb-4 text-sm text-orange-400 font-semibold md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to list
            </button>
          )}

          <div className="flex gap-6 items-start">

            {/* ── LEFT: Transaction List ── */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 space-y-3 ${showDetail ? "hidden md:block" : "block"}`}>

              {/* Search + filters */}
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Search by ID, product, depot…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition text-xs"
                  >
                    <option value="All">All Types</option>
                    <option value="purchase_order">Fuel Purchase</option>
                    <option value="truck_rental">Truck Rental</option>
                    <option value="union_dues">Union Dues</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition text-xs"
                  >
                    <option value="All">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Transaction cards */}
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                    <p className="text-sm">No transactions match your filters</p>
                  </div>
                ) : (
                  filtered.map((t) => {
                    const isActive = selected?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelect(t)}
                        className={`w-full text-left bg-black/40 backdrop-blur-md border rounded-xl p-4 transition hover:border-orange-500/50 ${
                          isActive ? "border-orange-500 shadow-lg shadow-orange-500/10" : "border-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono text-xs text-orange-400 font-semibold">{t.id}</span>
                          <span className={statusBadge(t.status)}>{t.status}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={typeBadge(t.type)}>{typeShort(t.type)}</span>
                          <span className="text-xs text-gray-400 truncate">{t.product}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-sm font-bold text-white">{t.totalAmount}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT: Detail Panel ── */}
            <div className={`flex-1 min-w-0 space-y-4 ${showDetail || !selected ? "block" : "hidden md:block"}`}>
              {!selected ? (
                <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-16 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">Select a transaction to view its status</p>
                </div>
              ) : (
                <>
                  {/* Transaction overview card */}
                  <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
                    {/* Card header */}
                    <div className="bg-orange-500/10 border-b border-gray-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-base font-bold text-orange-400">{selected.id}</span>
                          <span className={statusBadge(selected.status)}>{selected.status}</span>
                          <span className={typeBadge(selected.type)}>{selected.type}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(selected.date).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
                        <p className="text-2xl font-extrabold text-orange-400">{selected.totalAmount}</p>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                      {[
                        { label: "Depot",          value: selected.depot          },
                        { label: "Product",         value: selected.product        },
                        { label: "Quantity",        value: selected.quantity       },
                        { label: "Unit Price",      value: selected.unitPrice      },
                        { label: "Payment Method",  value: selected.paymentMethod  },
                        { label: "Ref / Truck",     value: selected.truckNumber    },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                          <p className="text-sm text-white font-semibold">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Delivery Timeline</p>

                    <div className="space-y-0">
                      {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        const lineColor =
                          step.state === "done"   ? "bg-green-500" :
                          step.state === "active" ? "bg-orange-500/60" :
                          step.state === "failed" ? "bg-red-500/60" :
                          "bg-gray-700";
                        const labelColor =
                          step.state === "done"    ? "text-white"        :
                          step.state === "active"  ? "text-orange-400"   :
                          step.state === "failed"  ? "text-red-400"      :
                          "text-gray-500";

                        return (
                          <div key={idx} className="flex gap-4">
                            {/* Icon + connector line */}
                            <div className="flex flex-col items-center">
                              {stepIcon(step.state)}
                              {!isLast && (
                                <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${lineColor}`} />
                              )}
                            </div>

                            {/* Content */}
                            <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 mb-0.5">
                                <p className={`text-sm font-semibold ${labelColor}`}>{step.label}</p>
                                {step.time && (
                                  <span className="text-xs text-gray-500">{step.time}</span>
                                )}
                              </div>
                              <p className={`text-xs ${step.state === "pending" ? "text-gray-600" : "text-gray-400"}`}>
                                {step.description}
                              </p>
                              {step.state === "failed" && (
                                <p className="text-xs text-red-400 mt-1 font-medium">
                                  ✕ This step failed — please contact support or raise a dispute.
                                </p>
                              )}
                              {step.state === "active" && (
                                <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-400 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  In progress
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => router.push("/customer/TransactionHistory")}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-black/40 hover:bg-gray-800/60 border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-orange-400 text-xs font-semibold rounded-xl transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Invoice
                    </button>

                    <button
                      onClick={() => router.push("/contact")}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-black/40 hover:bg-gray-800/60 border border-gray-700 hover:border-blue-500/50 text-gray-300 hover:text-blue-400 text-xs font-semibold rounded-xl transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contact Support
                    </button>

                    {selected.status === "failed" && (
                      <button
                        onClick={() => { setDisputeMsg(""); setDisputeSent(false); setDisputeOpen(true); }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Raise Dispute
                      </button>
                    )}

                    {selected.status === "pending" && (
                      <button className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 hover:text-yellow-300 text-xs font-semibold rounded-xl transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Status
                      </button>
                    )}

                    {selected.status === "completed" && (
                      <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/40 text-green-400 hover:text-green-300 text-xs font-semibold rounded-xl transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-order
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
