"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";
import type { Notification, NotifType } from "../../components/NotificationBell";

const TYPE_CONFIG: Record<NotifType, { color: string; bg: string; border: string; label: string; icon: string }> = {
  supply:      { color: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/30",   label: "Supply",      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  stock:       { color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/30",    label: "Stock Alert", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  dues:        { color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30", label: "Dues",        icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  truck:       { color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30", label: "Truck",       icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h6l2-1zM13 6l3 5h3l1 2v3h-2" },
  transaction: { color: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/30",  label: "Transaction", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  system:      { color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", label: "System",      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

const FILTERS: { label: string; value: string }[] = [
  { label: "All",         value: "all"         },
  { label: "Unread",      value: "unread"      },
  { label: "Supply",      value: "supply"      },
  { label: "Stock Alert", value: "stock"       },
  { label: "Dues",        value: "dues"        },
  { label: "Truck",       value: "truck"       },
  { label: "Transaction", value: "transaction" },
  { label: "System",      value: "system"      },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser]         = useState<any>(null);
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState<Notification | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);
        return import("@/lib/db-client").then(({ api }) =>
          api.notifications.list({ recipientEmail: u.email, limit: 200 } as any)
        );
      })
      .then(result => {
        if (!result?.data) return;
        const mapped: Notification[] = result.data.map((n: any) => ({
          id: n._id, type: (n.type || "system") as NotifType,
          title: n.title, message: n.message,
          href: n.href || "/customer",
          timestamp: n.createdAt || new Date().toISOString(),
          read: !!n.read,
        }));
        setNotifs(mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    import("@/lib/db-client").then(({ api }) => { api.notifications.markRead(id).catch(() => null); });
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    if (user?.email) import("@/lib/db-client").then(({ api }) => { api.notifications.markAllRead(user.email).catch(() => null); });
  };

  const deleteNotif = (id: string) => {
    if (selected?.id === id) setSelected(null);
    setNotifs(prev => prev.filter(n => n.id !== id));
    import("@/lib/db-client").then(({ api }) => { api.notifications.delete(id).catch(() => null); });
  };

  const clearAll = () => { setSelected(null); setNotifs([]); };

  const handleSelect = (n: Notification) => {
    setSelected(n);
    markRead(n.id);
  };

  const filtered = notifs.filter((n) => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head><title>Notifications | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Notifications</h1>
              <p className="text-gray-400 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold rounded-lg transition">
                  Mark all read
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={clearAll}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-5 bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-1 overflow-x-auto w-fit max-w-full">
            {FILTERS.map((f) => {
              const count = f.value === "all"    ? notifs.length
                          : f.value === "unread" ? notifs.filter((n) => !n.read).length
                          : notifs.filter((n) => n.type === f.value).length;
              return (
                <button key={f.value} onClick={() => { setFilter(f.value); setSelected(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    filter === f.value
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {f.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      filter === f.value ? "bg-white/20 text-white" : "bg-gray-700 text-gray-300"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Split panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* ── List ── */}
            <div className={`lg:col-span-2 ${selected ? "hidden lg:block" : ""}`}>
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="py-16 text-center px-6">
                    <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-sm text-gray-500">No notifications here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/60">
                    {filtered.map((n) => {
                      const cfg = TYPE_CONFIG[n.type];
                      const isSelected = selected?.id === n.id;
                      return (
                        <button key={n.id} onClick={() => handleSelect(n)}
                          className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition ${
                            isSelected ? "bg-orange-500/10 border-l-2 border-orange-500" :
                            !n.read    ? "bg-orange-500/[0.03] hover:bg-white/5" : "hover:bg-white/5"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${cfg.bg} ${cfg.border}`}>
                            <svg className={`w-4 h-4 ${cfg.color}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-bold leading-snug ${!n.read ? "text-white" : "text-gray-300"}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">{timeAgo(n.timestamp)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className={`inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Detail panel ── */}
            <div className={`lg:col-span-3 ${!selected ? "hidden lg:flex lg:items-center lg:justify-center" : ""}`}>
              {!selected ? (
                <div className="text-center py-20 px-6 w-full bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl">
                  <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-gray-500">Select a notification to view details</p>
                </div>
              ) : (() => {
                const cfg = TYPE_CONFIG[selected.type];
                return (
                  <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden h-full">
                    {/* Detail header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-orange-500/5">
                      <button onClick={() => setSelected(null)} className="lg:hidden flex items-center gap-1.5 text-gray-400 hover:text-white text-xs font-semibold transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                      </button>
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider hidden lg:block">Notification Detail</p>
                      <button onClick={() => deleteNotif(selected.id)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition ml-auto">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Icon + title */}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                          <svg className={`w-6 h-6 ${cfg.color}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-white leading-tight">{selected.title}</h2>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-500">{fullDate(selected.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
                        <p className="text-sm text-gray-300 leading-relaxed">{selected.message}</p>
                      </div>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Status",    value: selected.read ? "Read" : "Unread" },
                          { label: "Type",      value: cfg.label                         },
                          { label: "Received",  value: timeAgo(selected.timestamp)       },
                          { label: "Full Date", value: fullDate(selected.timestamp)      },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-black/30 border border-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-sm font-semibold text-white">{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => { setSelected(null); router.push(selected.href); }}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                      >
                        Go to related page
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
          <div className="mb-20" />
        </div>
      </div>
    </div>
  );
}
