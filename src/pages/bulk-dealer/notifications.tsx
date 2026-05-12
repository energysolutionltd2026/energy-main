"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import tower from "@/../public/tower.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifType = "stock" | "delivery" | "order" | "payment" | "system" | "reconciliation";

interface Notification {
  id: string; type: NotifType; title: string; message: string;
  href: string; timestamp: string; read: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, { color: string; bg: string; border: string; icon: string; label: string }> = {
  stock:          { color: "text-red-300",    bg: "bg-red-500/30",    border: "border-red-500/50",    label: "Stock Alert",     icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  delivery:       { color: "text-blue-300",   bg: "bg-blue-500/30",   border: "border-blue-500/50",   label: "Delivery",        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10L4 7" },
  order:          { color: "text-purple-300", bg: "bg-purple-500/30", border: "border-purple-500/50", label: "Allocation",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  payment:        { color: "text-green-300",  bg: "bg-green-500/30",  border: "border-green-500/50",  label: "Payment",         icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  system:         { color: "text-orange-300", bg: "bg-orange-500/30", border: "border-orange-500/50", label: "System",          icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  reconciliation: { color: "text-yellow-300", bg: "bg-yellow-500/30", border: "border-yellow-500/50", label: "Reconciliation",  icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
};


function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ALL_TYPES: (NotifType | "all")[] = ["all", "stock", "delivery", "order", "payment", "reconciliation", "system"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BulkDealerNotifications() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [filter, setFilter]       = useState<NotifType | "all">("all");
  const [selected, setSelected]   = useState<Notification | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const u = data?.user;
        if (!u || u.role !== "bulk_dealer") { router.push("/auth/login"); return; }
        setUser(u);
        return import("@/lib/db-client").then(({ api }) =>
          api.notifications.list({ recipientEmail: u.email, limit: 200 } as any)
        );
      })
      .then(result => {
        if (!result?.data) return;
        const mapped = result.data.map((n: any) => ({
          id: n._id, type: (n.type || "system") as NotifType,
          title: n.title, message: n.message,
          href: n.href || "/bulk-dealer/dashboard",
          timestamp: n.createdAt || new Date().toISOString(),
          read: !!n.read,
        }));
        setNotifs(mapped);
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    import("@/lib/db-client").then(({ api }) => { api.notifications.markRead(id).catch(() => null); });
  };
  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    if (user?.email) import("@/lib/db-client").then(({ api }) => { api.notifications.markAllRead(user.email).catch(() => null); });
  };
  const deleteOne = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) setSelected(null);
    import("@/lib/db-client").then(({ api }) => { api.notifications.delete(id).catch(() => null); });
  };
  const clearAll = () => { setNotifs([]); setSelected(null); };

  const handleClick = (n: Notification) => { markRead(n.id); setSelected(n); };

  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.type === filter);
  const unread   = notifs.filter((n) => !n.read).length;

  if (!user) return null;

  return (
    <div className="min-h-screen text-white relative"
      style={{ backgroundImage: `url(${tower.src})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <Head><title>Notifications | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link href="/bulk-dealer/dashboard">
            <Image src="/eNnergy Logo.png" alt="e-Nergy" width={70} height={46} priority
              className="object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/bulk-dealer/dashboard" className="text-sm text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg transition">
              ← Dashboard
            </Link>
            <button onClick={() => { localStorage.removeItem("user"); router.push("/auth/login"); }}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 pb-10 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              {unread > 0 && <p className="text-sm text-gray-400 mt-0.5">{unread} unread</p>}
            </div>
            <div className="flex gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-sm text-green-400 hover:text-green-300 font-semibold transition px-3 py-2 border border-green-500/30 rounded-lg">
                  Mark all read
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-300 font-semibold transition px-3 py-2 border border-red-500/30 rounded-lg">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap mb-5">
            {ALL_TYPES.map((t) => {
              const count = t === "all" ? notifs.length : notifs.filter((n) => n.type === t).length;
              const unreadCount = t === "all" ? unread : notifs.filter((n) => n.type === t && !n.read).length;
              return (
                <button key={t} onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 capitalize ${
                    filter === t ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:text-white"
                  }`}>
                  {t === "all" ? "All" : TYPE_CONFIG[t].label}
                  {unreadCount > 0
                    ? <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === t ? "bg-white/20" : "bg-green-500 text-white"}`}>{unreadCount}</span>
                    : count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === t ? "bg-white/20" : "bg-gray-700"}`}>{count}</span>
                  }
                </button>
              );
            })}
          </div>

          {/* Split panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* List */}
            <div className="lg:col-span-2 space-y-2">
              {filtered.length === 0 ? (
                <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl p-10 text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-300 text-sm">No notifications here</p>
                </div>
              ) : (
                filtered.map((n) => {
                  const cfg = TYPE_CONFIG[n.type];
                  const isSelected = selected?.id === n.id;
                  return (
                    <button key={n.id} onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition ${
                        isSelected ? "bg-green-600/25 border-green-500/60" :
                        !n.read ? "bg-gray-800 border-gray-600 border-l-2 border-l-green-400" :
                        "bg-gray-900/80 border-gray-700 hover:bg-gray-800"
                      }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${cfg.bg} ${cfg.border}`}>
                        <svg className={`w-4 h-4 ${cfg.color}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-tight ${!n.read ? "text-white" : "text-gray-200"}`}>{n.title}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{timeAgo(n.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1.5" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-3">
              {!selected ? (
                <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl p-10 text-center h-full flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-300 text-sm">Select a notification to view details</p>
                </div>
              ) : (() => {
                const cfg = TYPE_CONFIG[selected.type];
                return (
                  <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-6">
                    {/* Detail header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                        <svg className={`w-6 h-6 ${cfg.color}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-base">{selected.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                          <span className="text-xs text-gray-300">{timeAgo(selected.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Message card */}
                    <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 mb-5">
                      <p className="text-sm text-gray-100 leading-relaxed">{selected.message}</p>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { label: "Status",    value: selected.read ? "Read" : "Unread" },
                        { label: "Type",      value: cfg.label },
                        { label: "Received",  value: timeAgo(selected.timestamp) },
                        { label: "Full Date", value: new Date(selected.timestamp).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) },
                      ].map((m) => (
                        <div key={m.label} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                          <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                          <p className="text-sm text-white font-semibold">{m.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link href={selected.href}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition text-center">
                        Go to related page →
                      </Link>
                      <button onClick={() => deleteOne(selected.id)}
                        className="px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </main>

        <footer className="px-6 py-4 border-t border-gray-800/60 flex items-center justify-center gap-6 text-xs text-gray-500">
          <Link href="/contact" className="hover:text-gray-300 transition">Contact</Link>
          <span className="text-gray-700">|</span>
          <Link href="/privacy-policy" className="hover:text-gray-300 transition">Privacy Policy</Link>
          <span className="text-gray-700">|</span>
          <Link href="/about" className="hover:text-gray-300 transition">About Us</Link>
        </footer>
      </div>
    </div>
  );
}
