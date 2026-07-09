"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alloc {
  _id: string;
  allocationId: string;
  dealerEmail: string;
  dealerName: string;
  product: "PMS" | "AGO" | "ATK";
  volumeLitres: number;
  usedLitres: number;
  depot: string;
  validFrom: string;
  validTo: string;
  status: "active" | "exhausted" | "expired" | "revoked";
  notes?: string;
  createdAt: string;
}

interface DealerOption { email: string; name: string; }

const PRODUCTS = ["PMS", "AGO", "ATK"] as const;

const PRODUCT_COLOR: Record<string, string> = {
  PMS: "bg-red-500/20 text-red-400 border-red-500/40",
  AGO: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  ATK: "bg-green-500/20 text-green-400 border-green-500/40",
};

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-green-500/20 text-green-400 border-green-500/40",
  exhausted: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  expired:   "bg-gray-500/20 text-muted border-line/40",
  revoked:   "bg-red-500/20 text-red-400 border-red-500/40",
};

const inputCls  = "w-full bg-card/60 border border-line rounded-lg px-3 py-2.5 text-foreground placeholder-muted focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";
const selectCls = "w-full bg-card/60 border border-line rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";
const btn       = "px-4 py-2 rounded-lg text-sm font-semibold transition";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>{label}</span>;
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted">
        <span>{used.toLocaleString()} L used</span>
        <span className={pct >= 90 ? "text-red-400" : pct >= 60 ? "text-yellow-400" : "text-green-400"}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-card-2 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted">{(total - used).toLocaleString()} L remaining</p>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  dealers, depots, adminEmail, onCreated, onClose,
}: {
  dealers: DealerOption[];
  depots: string[];
  adminEmail: string;
  onCreated: (a: Alloc) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    dealerEmail: "",
    product:     "PMS" as "PMS" | "AGO" | "ATK",
    volumeLitres: "",
    depot:       "",
    validFrom:   today,
    validTo:     in30,
    notes:       "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const dealer = dealers.find(d => d.email === form.dealerEmail);

  const handleSubmit = async () => {
    if (!form.dealerEmail || !form.volumeLitres || !form.depot || !form.validFrom || !form.validTo) {
      setError("Please fill in all required fields."); return;
    }
    if (Number(form.volumeLitres) <= 0) { setError("Volume must be greater than 0."); return; }
    if (form.validTo <= form.validFrom) { setError("Valid To must be after Valid From."); return; }

    setSaving(true);
    setError("");
    const { api } = await import("@/lib/db-client");
    const result = await api.allocations.create({
      allocationId: `ALLOC-${Date.now().toString().slice(-8)}`,
      dealerEmail:  form.dealerEmail,
      dealerName:   dealer?.name ?? form.dealerEmail,
      product:      form.product,
      volumeLitres: Number(form.volumeLitres),
      usedLitres:   0,
      depot:        form.depot,
      validFrom:    form.validFrom,
      validTo:      form.validTo,
      notes:        form.notes || undefined,
      createdBy:    adminEmail,
      status:       "active",
    } as any);

    if (!result) { setError("Failed to create allocation. Try again."); setSaving(false); return; }
    onCreated(result as unknown as Alloc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background border border-line rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-orange-500/5">
          <p className="text-sm font-bold text-orange-400 uppercase tracking-wider">New Allocation</p>
          <button onClick={onClose} className="text-muted hover:text-foreground transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Bulk Dealer <span className="text-red-400">*</span></label>
            <select className={selectCls} value={form.dealerEmail} onChange={e => setForm(f => ({ ...f, dealerEmail: e.target.value }))}>
              <option value="">Select dealer</option>
              {dealers.map(d => <option key={d.email} value={d.email}>{d.name} — {d.email}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Product <span className="text-red-400">*</span></label>
              <select className={selectCls} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value as any }))}>
                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Volume (Litres) <span className="text-red-400">*</span></label>
              <input type="number" min="1" className={inputCls} placeholder="e.g. 33000"
                value={form.volumeLitres} onChange={e => setForm(f => ({ ...f, volumeLitres: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Depot <span className="text-red-400">*</span></label>
            <select className={selectCls} value={form.depot} onChange={e => setForm(f => ({ ...f, depot: e.target.value }))}>
              <option value="">Select depot</option>
              {depots.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Valid From <span className="text-red-400">*</span></label>
              <input type="date" className={inputCls} value={form.validFrom}
                onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Valid To <span className="text-red-400">*</span></label>
              <input type="date" className={inputCls} value={form.validTo}
                onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Notes (optional)</label>
            <textarea className={inputCls + " resize-none"} rows={2} placeholder="e.g. NNPC Q2 allocation"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-3">
          <button onClick={onClose} className={`${btn} border border-line text-muted hover:text-foreground`}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className={`${btn} bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50`}>
            {saving ? "Creating…" : "Create Allocation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ alloc, onUpdate, onClose }: {
  alloc: Alloc;
  onUpdate: (id: string, data: Partial<Alloc>) => void;
  onClose: () => void;
}) {
  const [editVolume, setEditVolume] = useState(String(alloc.volumeLitres));
  const [editUsed,   setEditUsed]   = useState(String(alloc.usedLitres));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { api } = await import("@/lib/db-client");
    const data = { volumeLitres: Number(editVolume), usedLitres: Number(editUsed) };
    await api.allocations.update(alloc._id, data as any);
    onUpdate(alloc._id, data);
    setSaving(false);
    onClose();
  };

  const revoke = async () => {
    const { api } = await import("@/lib/db-client");
    await api.allocations.update(alloc._id, { status: "revoked" } as any);
    onUpdate(alloc._id, { status: "revoked" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background border border-line rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-orange-500/5">
          <div>
            <p className="text-sm font-bold text-orange-400 uppercase tracking-wider">Allocation Detail</p>
            <p className="text-xs text-muted font-mono mt-0.5">{alloc.allocationId}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: "Dealer",   value: `${alloc.dealerName} (${alloc.dealerEmail})` },
            { label: "Depot",    value: alloc.depot },
            { label: "Valid",    value: `${alloc.validFrom.slice(0,10)} → ${alloc.validTo.slice(0,10)}` },
            { label: "Status",   value: <Badge label={alloc.status} cls={STATUS_COLOR[alloc.status]} /> },
            { label: "Product",  value: <Badge label={alloc.product} cls={PRODUCT_COLOR[alloc.product]} /> },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center border-b border-line/60 pb-2 last:border-0 last:pb-0">
              <span className="text-xs text-muted">{label}</span>
              <span className="text-sm text-foreground font-medium">{value}</span>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Total Volume (L)</label>
              <input type="number" min="1" className={inputCls} value={editVolume}
                onChange={e => setEditVolume(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Used (L)</label>
              <input type="number" min="0" className={inputCls} value={editUsed}
                onChange={e => setEditUsed(e.target.value)} />
            </div>
          </div>

          {alloc.notes && (
            <p className="text-xs text-muted bg-card/50 rounded-lg px-3 py-2 border border-line">
              <span className="text-muted">Notes: </span>{alloc.notes}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-between gap-3">
          {alloc.status !== "revoked" && (
            <button onClick={revoke}
              className={`${btn} bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs`}>
              Revoke
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className={`${btn} border border-line text-muted hover:text-foreground`}>Cancel</button>
            <button onClick={save} disabled={saving}
              className={`${btn} bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50`}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAllocations() {
  const router = useRouter();
  const [user,   setUser]   = useState<any>(null);
  const [allocs, setAllocs] = useState<Alloc[]>([]);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [depots,  setDepots]  = useState<string[]>([]);
  const [filter,  setFilter]  = useState<"All" | Alloc["status"]>("All");
  const [search,  setSearch]  = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detail,     setDetail]     = useState<Alloc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const u = data?.user;
        if (!u || u.role !== "admin") { router.push("/auth/login"); return; }
        setUser(u);

        import("@/lib/db-client").then(({ api }) => {
          Promise.allSettled([
            api.allocations.list({ limit: 500 } as any),
            api.users.list({ role: "bulk_dealer", limit: 200 }),
            api.depots.list(),
          ]).then(([aRes, dRes, depRes]) => {
            if (aRes.status === "fulfilled") setAllocs((aRes.value?.data ?? []) as Alloc[]);
            if (dRes.status === "fulfilled") {
              setDealers((dRes.value?.data ?? []).map((u: any) => ({ email: u.email, name: u.name })));
            }
            if (depRes.status === "fulfilled") {
              setDepots((depRes.value?.data ?? []).map((d: any) => d.name ?? d.depotName ?? d._id));
            }
            setLoading(false);
          });
        });
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const counts: Record<string, number> = {
    All: allocs.length,
    Active:    allocs.filter(a => a.status === "active").length,
    Exhausted: allocs.filter(a => a.status === "exhausted").length,
    Expired:   allocs.filter(a => a.status === "expired").length,
    Revoked:   allocs.filter(a => a.status === "revoked").length,
  };

  const displayed = allocs
    .filter(a => filter === "All" || a.status === filter)
    .filter(a =>
      !search ||
      a.dealerName.toLowerCase().includes(search.toLowerCase()) ||
      a.dealerEmail.toLowerCase().includes(search.toLowerCase()) ||
      a.allocationId.toLowerCase().includes(search.toLowerCase()) ||
      a.depot.toLowerCase().includes(search.toLowerCase())
    );

  const handleCreated = (a: Alloc) => {
    setAllocs(prev => [a, ...prev]);
    setShowCreate(false);
  };

  const handleUpdate = (id: string, data: Partial<Alloc>) => {
    setAllocs(prev => prev.map(a => a._id === id ? { ...a, ...data } : a));
  };

  return (
    <div className="min-h-screen text-foreground"
>
      <Head><title>Allocations | e-Nergy Admin</title></Head>
      <div className="fixed inset-0 bg-background z-0" />

      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-card backdrop-blur-md border-b border-line flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/dashboard")}
            className="text-muted hover:text-orange-400 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-orange-400 font-bold text-sm uppercase tracking-wider">Fuel Allocations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted hidden sm:block">{user.name}</span>
          <button
            onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/auth/login"))}
            className="text-xs text-muted hover:text-foreground border border-line hover:border-line px-3 py-1.5 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>

      <div className="relative z-10 pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fuel Allocations</h1>
            <p className="text-sm text-muted mt-0.5">Assign and manage fuel quotas for bulk dealers</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-500/20 transition shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Allocation
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",     value: counts.All,       color: "text-foreground",        border: "border-line"       },
            { label: "Active",    value: counts.Active,    color: "text-green-400",    border: "border-green-800/50"   },
            { label: "Exhausted", value: counts.Exhausted, color: "text-orange-400",   border: "border-orange-800/50"  },
            { label: "Expired",   value: counts.Expired,   color: "text-muted",     border: "border-line"       },
          ].map(c => (
            <div key={c.label} className={`bg-card backdrop-blur-md border ${c.border} rounded-xl p-4`}>
              <p className="text-xs text-muted uppercase font-semibold mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-1 bg-card backdrop-blur-sm border border-line rounded-xl p-1 overflow-x-auto">
            {(["All", "active", "exhausted", "expired", "revoked"] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${filter === s ? "bg-orange-500 text-white" : "text-muted hover:text-white"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)} {counts[s.charAt(0).toUpperCase() + s.slice(1)] !== undefined ? `(${counts[s.charAt(0).toUpperCase() + s.slice(1)]})` : ""}
              </button>
            ))}
          </div>
          <input
            className="flex-1 bg-card border border-line rounded-xl px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-orange-500 transition"
            placeholder="Search dealer, depot, ID…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-card backdrop-blur-md border border-line rounded-xl overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 border-b border-line text-xs text-muted uppercase tracking-wide">
            <span className="col-span-2">ID</span>
            <span className="col-span-2">Dealer</span>
            <span className="col-span-1">Product</span>
            <span className="col-span-2">Depot</span>
            <span className="col-span-2">Usage</span>
            <span className="col-span-1">Valid To</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1 text-right">View</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && displayed.length === 0 && (
            <p className="text-center text-muted py-14 text-sm">No allocations found</p>
          )}

          {!loading && displayed.map(a => (
            <div key={a._id}
              className="grid grid-cols-2 lg:grid-cols-12 gap-2 px-4 py-3.5 border-b border-line/50 hover:bg-card-2 transition items-center">
              <span className="col-span-1 lg:col-span-2 text-orange-400 font-mono text-xs">{a.allocationId}</span>
              <div className="col-span-1 lg:col-span-2">
                <p className="text-sm text-foreground font-medium truncate">{a.dealerName}</p>
                <p className="text-xs text-muted truncate">{a.dealerEmail}</p>
              </div>
              <span className="col-span-1 hidden lg:block">
                <Badge label={a.product} cls={PRODUCT_COLOR[a.product]} />
              </span>
              <span className="col-span-1 lg:col-span-2 text-xs text-muted truncate hidden lg:block">{a.depot}</span>
              <div className="col-span-2 lg:col-span-2">
                <UsageBar used={a.usedLitres} total={a.volumeLitres} />
              </div>
              <span className="col-span-1 text-xs text-muted hidden lg:block">
                {new Date(a.validTo).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="col-span-1 hidden lg:block">
                <Badge label={a.status} cls={STATUS_COLOR[a.status]} />
              </span>
              <div className="col-span-2 lg:col-span-1 flex justify-end">
                <button onClick={() => setDetail(a)}
                  className="px-3 py-1.5 bg-card-2 hover:bg-orange-500/20 hover:border-orange-500/50 border border-line hover:text-orange-400 text-foreground text-xs font-semibold rounded-lg transition">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateModal
          dealers={dealers}
          depots={depots}
          adminEmail={user.email}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {detail && (
        <DetailModal
          alloc={detail}
          onUpdate={handleUpdate}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
