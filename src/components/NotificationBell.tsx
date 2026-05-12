"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifType = "supply" | "stock" | "dues" | "truck" | "transaction" | "system";

export interface Notification {
  id:        string;
  type:      NotifType;
  title:     string;
  message:   string;
  href:      string;
  timestamp: string; // ISO string
  read:      boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { color: string; bg: string; border: string; icon: string }> = {
  supply:      { color: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/30",   icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  stock:       { color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/30",    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  dues:        { color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  truck:       { color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30", icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1h6l2-1zM13 6l3 5h3l1 2v3h-2" },
  transaction: { color: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/30",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  system:      { color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

const STATION_STOCK_ALERTS = [
  { product: "AGO", station: "Ikeja Central",  status: "Limited" },
  { product: "ATK", station: "Ikeja Central",  status: "Empty"   },
  { product: "PMS", station: "Lekki Junction", status: "Limited" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function generateBaseNotifications(): Notification[] {
  const now = Date.now();
  const notifs: Notification[] = [];

  // Stock alerts from mock station data
  STATION_STOCK_ALERTS.forEach((alert, i) => {
    notifs.push({
      id:        `stock-${alert.station}-${alert.product}`,
      type:      "stock",
      title:     alert.status === "Empty" ? "Stock Empty" : "Low Stock Alert",
      message:   `${alert.product} at ${alert.station} is ${alert.status.toLowerCase()}. Request a restock now.`,
      href:      "/customer/station-manager",
      timestamp: new Date(now - (i + 1) * 3600000).toISOString(),
      read:      false,
    });
  });

  // Dues reminder
  notifs.push({
    id:        "dues-reminder-2025",
    type:      "dues",
    title:     "Union Dues Reminder",
    message:   "Your 2025 annual membership dues are due. Avoid disruption to your account.",
    href:      "/paydues",
    timestamp: new Date(now - 7 * 3600000).toISOString(),
    read:      false,
  });

  // System welcome
  notifs.push({
    id:        "system-welcome",
    type:      "system",
    title:     "Welcome to e-Nergy",
    message:   "Your customer dashboard is ready. Explore your stations, transactions, and more.",
    href:      "/customer",
    timestamp: new Date(now - 24 * 3600000).toISOString(),
    read:      true,
  });

  return notifs;
}

function mergeNotifications(base: Notification[], stored: Notification[]): Notification[] {
  const storedMap = new Map(stored.map((n) => [n.id, n]));
  // Base notifications keep stored read-state if they already exist
  const merged = base.map((n) => storedMap.has(n.id) ? { ...n, read: storedMap.get(n.id)!.read } : n);
  // Add stored-only notifications (from supply requests, transactions) that aren't in base
  stored.forEach((n) => {
    if (!merged.find((m) => m.id === n.id)) merged.push(n);
  });
  return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      (api.notifications as any)?.list?.({ limit: 20 }).then((result: any) => {
        if (result?.data?.length) {
          setNotifs(result.data.map((n: any) => ({
            id: n._id || n.id,
            type: n.type || "info",
            title: n.title || "Notification",
            message: n.message || "",
            href: n.href || "#",
            timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
            read: n.read ?? false,
          })));
        } else {
          setNotifs(generateBaseNotifications());
        }
      }).catch(() => setNotifs(generateBaseNotifications()));
    }).catch(() => setNotifs(generateBaseNotifications()));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    import("@/lib/db-client").then(({ api }) => {
      (api.notifications as any)?.update?.(id, { read: true }).catch(() => null);
    }).catch(() => null);
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (notif: Notification) => {
    markRead(notif.id);
    setOpen(false);
    router.push(notif.href);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-orange-500/5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">Notifications</p>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-800/60">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-10 h-10 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              notifs.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                      !n.read ? "bg-orange-500/[0.04]" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${cfg.bg} ${cfg.border}`}>
                      <svg className={`w-4 h-4 ${cfg.color}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-tight ${!n.read ? "text-white" : "text-gray-300"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0 mt-0.5">
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-800 bg-gray-900/40">
            <button
              onClick={() => { setOpen(false); router.push("/customer/notifications"); }}
              className="w-full text-xs text-center text-gray-400 hover:text-orange-400 font-semibold transition py-0.5"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
