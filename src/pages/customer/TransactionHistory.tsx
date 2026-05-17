"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";

type TransactionType = "purchase_order" | "truck_rental" | "union_dues";

interface InvoiceItem {
  description: string;
  qty: string;
  unitPrice: string;
  amount: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issuedDate: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  total: string;
  paymentMethod: string;
  status: string;
  notes?: string;
}

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  depot: string;
  product: string;      // fuel type | truck name | due category
  quantity: string;     // litres | "X days" | "—"
  unitPrice: string;    // per litre | daily rate | "—"
  totalAmount: string;
  status: "completed" | "pending" | "failed";
  paymentMethod: string;
  truckNumber: string;  // reg number | truck ID | "—"
  invoice?: InvoiceData;
}


// ─── Invoice helpers ──────────────────────────────────────────────────────────

function generateInvoice(txn: Transaction, user: { name: string; email: string }): InvoiceData {
  let items: InvoiceItem[];

  if (txn.type === "purchase_order") {
    items = [{ description: `${txn.product} — Petroleum Product`, qty: `${txn.quantity} L`, unitPrice: txn.unitPrice, amount: txn.totalAmount }];
  } else if (txn.type === "truck_rental") {
    items = [{ description: `${txn.product} (${txn.truckNumber})`, qty: txn.quantity, unitPrice: txn.unitPrice, amount: txn.totalAmount }];
  } else {
    items = [{ description: txn.product || "Union Dues", qty: "—", unitPrice: "—", amount: txn.totalAmount }];
  }

  return {
    invoiceNumber: txn.id,
    issuedDate: txn.date,
    customerName: user.name,
    customerEmail: user.email,
    items,
    total: txn.totalAmount,
    paymentMethod: txn.paymentMethod,
    status: txn.status,
  };
}

function InvoiceModal({ invoice, onClose }: { invoice: InvoiceData; onClose: () => void }) {
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=860,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#111;background:#fff}
        .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #f97316;padding-bottom:20px;margin-bottom:24px}
        .company h1{font-size:28px;font-weight:800;color:#f97316}
        .company p{font-size:12px;color:#666;margin-top:4px}
        .invoice-meta{text-align:right}
        .invoice-meta h2{font-size:24px;font-weight:700;color:#333}
        .invoice-meta p{font-size:12px;color:#666;margin-top:4px}
        .bill{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:16px;background:#f9f9f9;border-radius:8px;margin-bottom:24px}
        .bill h3{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px}
        .bill p{font-size:13px;color:#333;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        thead tr{background:#f97316;color:#fff}
        thead th{padding:10px 12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
        tbody tr{border-bottom:1px solid #eee}
        tbody td{padding:12px;font-size:13px;color:#333}
        .total-row{display:flex;justify-content:flex-end;margin-bottom:24px}
        .total-box{background:#fff7ed;border:2px solid #f97316;border-radius:8px;padding:16px 24px;min-width:200px;text-align:right}
        .total-box p{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px}
        .total-box h3{font-size:22px;font-weight:800;color:#f97316;margin-top:4px}
        .notes{margin-bottom:24px;padding:12px 16px;background:#f0f9ff;border-left:4px solid #38bdf8;border-radius:4px;font-size:12px;color:#0369a1}
        .footer{border-top:1px solid #eee;padding-top:16px;display:flex;justify-content:space-between;font-size:12px;color:#999}
        .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
        .completed{background:#dcfce7;color:#16a34a}
        .pending{background:#fef9c3;color:#b45309}
        .failed{background:#fee2e2;color:#dc2626}
      </style>
    </head><body>
      <div class="header">
        <div class="company"><h1>e-Nergy</h1><p>Oil &amp; Gas Platform · Nigeria</p></div>
        <div class="invoice-meta">
          <h2>INVOICE</h2>
          <p><strong>No:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date(invoice.issuedDate).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
      <div class="bill">
        <div>
          <h3>Bill To</h3>
          <p><strong>${invoice.customerName}</strong></p>
          <p>${invoice.customerEmail}</p>
        </div>
        <div>
          <h3>Payment Details</h3>
          <p><strong>Method:</strong> ${invoice.paymentMethod}</p>
          <p><strong>Status:</strong> <span class="badge ${invoice.status.toLowerCase()}">${invoice.status}</span></p>
        </div>
      </div>
      <table>
        <thead><tr><th style="width:45%">Description</th><th style="width:20%">Qty</th><th style="width:20%">Unit Price</th><th style="width:15%;text-align:right">Amount</th></tr></thead>
        <tbody>
          ${invoice.items.map(item => `<tr><td>${item.description}</td><td>${item.qty}</td><td>${item.unitPrice}</td><td style="text-align:right;font-weight:600">${item.amount}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="total-row"><div class="total-box"><p>Total Amount</p><h3>${invoice.total}</h3></div></div>
      ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}
      <div class="footer"><span>Thank you for using the e-Nergy platform.</span><span>Generated: ${new Date().toLocaleString("en-NG")}</span></div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Invoice</h2>
            <p className="text-xs text-gray-400 font-mono">{invoice.invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Company + meta */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-extrabold text-orange-500">e-Nergy</h1>
              <p className="text-xs text-gray-400">Oil &amp; Gas Platform · Nigeria</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Invoice</p>
              <p className="text-sm font-mono font-semibold text-white mt-0.5">{invoice.invoiceNumber}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(invoice.issuedDate).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Bill to + details */}
          <div className="grid grid-cols-2 gap-4 bg-gray-800/50 rounded-xl p-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Bill To</p>
              <p className="text-sm font-semibold text-white">{invoice.customerName}</p>
              <p className="text-xs text-gray-400">{invoice.customerEmail}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Payment Details</p>
              <p className="text-xs text-gray-300"><span className="text-gray-500">Method: </span>{invoice.paymentMethod}</p>
              <p className="text-xs text-gray-300 mt-1">
                <span className="text-gray-500">Status: </span>
                <span className={`font-semibold ${invoice.status === "completed" ? "text-green-400" : invoice.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
                  {invoice.status}
                </span>
              </p>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left pb-2 text-[10px] text-gray-500 uppercase tracking-wide font-semibold w-[44%]">Description</th>
                <th className="text-left pb-2 text-[10px] text-gray-500 uppercase tracking-wide font-semibold w-[18%]">Qty</th>
                <th className="text-left pb-2 text-[10px] text-gray-500 uppercase tracking-wide font-semibold w-[20%]">Unit Price</th>
                <th className="text-right pb-2 text-[10px] text-gray-500 uppercase tracking-wide font-semibold w-[18%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-800/60">
                  <td className="py-3 text-gray-200">{item.description}</td>
                  <td className="py-3 text-gray-400">{item.qty}</td>
                  <td className="py-3 text-gray-400">{item.unitPrice}</td>
                  <td className="py-3 text-right font-semibold text-white">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-6 py-4 text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Amount</p>
              <p className="text-2xl font-extrabold text-orange-400 mt-1">{invoice.total}</p>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
              <span className="font-semibold text-blue-400">Notes: </span>{invoice.notes}
            </div>
          )}

          <p className="text-xs text-gray-600 text-center border-t border-gray-800 pt-4">
            Thank you for using the e-Nergy platform. · Generated {new Date().toLocaleString("en-NG")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterProduct, setFilterProduct] = useState("All");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);

        import("@/lib/db-client").then(({ api }) => {
          api.transactions.list({ limit: 200 } as any).then((result) => {
            const apiTxns = (result?.data ?? []).map((t: any) => ({
              id: t.reference || t._id,
              date: t.createdAt ? t.createdAt.slice(0, 10) : "",
              type: (t.type === "union_dues" ? "union_dues" : t.type === "truck_rental" ? "truck_rental" : "purchase_order") as TransactionType,
              depot: t.depot || "—",
              product: t.product || "—",
              quantity: t.quantity ? `${Number(t.quantity).toLocaleString()}` : "—",
              unitPrice: t.unitPrice ? `₦${Number(t.unitPrice).toLocaleString()}` : "—",
              totalAmount: `₦${Number(t.totalAmount || 0).toLocaleString()}`,
              status: (t.status === "completed" ? "completed" : t.status === "failed" ? "failed" : "pending") as "completed" | "pending" | "failed",
              paymentMethod: t.paymentMethod || "—",
              truckNumber: t.truckNumber || "—",
            }));
            setTransactions(apiTxns as Transaction[]);
          });
        });
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.depot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.truckNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || transaction.status === filterStatus;
    const matchesType = filterType === "All" || transaction.type === filterType;
    const matchesProduct =
      filterProduct === "All" ||
      (transaction.type === "purchase_order" && transaction.product === filterProduct);

    return matchesSearch && matchesStatus && matchesType && matchesProduct;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "purchase_order": return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "truck_rental":   return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      case "union_dues":     return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    }
  };

  const getProductColor = (type: TransactionType, product: string) => {
    if (type === "purchase_order") {
      switch (product) {
        case "PMS": return "bg-red-500/20 text-red-400 border-red-500/50";
        case "AGO": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
        case "ATK": return "bg-green-500/20 text-green-400 border-green-500/50";
      }
    }
    return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Transaction History | e-Nergy</title></Head>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/65 z-0" />

      {/* Customer Navigation (fixed topbar + fixed sidebar) */}
      <CustomerNavigation user={user} />

      {/* Main Content Area — offset for topbar (pt-16) and sidebar (md:pl-64) */}
      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
            <p className="text-gray-400 text-sm">View and manage all your petroleum purchase transactions</p>
          </div>

          {/* Filters and Search */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Search Transactions
                </label>
                <input
                  type="text"
                  placeholder="Search by ID, Depot, Product or Truck"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Type
                </label>
                <select
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="purchase_order">Fuel Purchase</option>
                  <option value="truck_rental">Truck Rental</option>
                  <option value="union_dues">Union Dues</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Status
                </label>
                <select
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Fuel Product Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                  Fuel Product
                </label>
                <select
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                >
                  <option value="All">All Products</option>
                  <option value="PMS">PMS (Petrol)</option>
                  <option value="AGO">AGO (Diesel)</option>
                  <option value="ATK">ATK (Jet Fuel)</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-orange-500/10 border-b border-gray-800">
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider hidden lg:table-cell">Depot</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider hidden xl:table-cell">Qty</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider hidden xl:table-cell">Unit Price</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Total</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-orange-500 uppercase tracking-wider">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-12 text-center">
                        <div className="text-gray-500">
                          <svg
                            className="w-12 h-12 mx-auto mb-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p className="text-lg font-semibold">No transactions found</p>
                          <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-orange-400">
                            {transaction.id}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-300">
                          {new Date(transaction.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getTypeColor(transaction.type)}`}>
                            {transaction.type === "purchase_order" ? "Fuel" : transaction.type === "truck_rental" ? "Truck" : "Dues"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-300 hidden lg:table-cell max-w-[140px] truncate">
                          {transaction.depot}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap max-w-[140px]">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border truncate block max-w-full ${getProductColor(transaction.type, transaction.product)}`}>
                            {transaction.product.length > 18 ? transaction.product.slice(0, 17) + "…" : transaction.product}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-300 font-semibold hidden xl:table-cell">
                          {transaction.quantity}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-300 hidden xl:table-cell">
                          {transaction.unitPrice}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs font-bold text-white">
                          {transaction.totalAmount}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-400 hidden lg:table-cell">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTxn(transaction); }}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-orange-500/20 hover:border-orange-500/50 border border-gray-700 text-gray-300 hover:text-orange-400 text-xs font-semibold rounded-lg transition"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-20">
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Total</p>
              <p className="text-2xl font-bold text-white">{transactions.length}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-blue-800/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Fuel Purchases</p>
              <p className="text-2xl font-bold text-blue-400">
                {transactions.filter((t) => t.type === "purchase_order").length}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-purple-800/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Truck Rentals</p>
              <p className="text-2xl font-bold text-purple-400">
                {transactions.filter((t) => t.type === "truck_rental").length}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-amber-800/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Union Dues</p>
              <p className="text-2xl font-bold text-amber-400">
                {transactions.filter((t) => t.type === "union_dues").length}
              </p>
            </div>
            <div className="col-span-2 lg:col-span-4 grid grid-cols-3 gap-4">
              <div className="bg-black/40 backdrop-blur-md border border-green-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {transactions.filter((t) => t.status === "completed").length}
                </p>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-yellow-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {transactions.filter((t) => t.status === "pending").length}
                </p>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-red-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-400">
                  {transactions.filter((t) => t.status === "failed").length}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Invoice modal */}
      {selectedTxn && (
        <InvoiceModal
          invoice={selectedTxn.invoice ?? generateInvoice(selectedTxn, user)}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </div>
  );
}
