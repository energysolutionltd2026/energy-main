const HEARTBEAT_INTERVAL = 30 * 1000;

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: string;
  depot?: string;
  lastSeen: number;
}

function sendHeartbeat() {
  fetch("/api/admin/heartbeat", { method: "POST" }).catch(() => null);
}

export function getOnlineUsers(): OnlineUser[] {
  // Online users are now fetched from /api/admin/online-users by the admin dashboard directly.
  // This stub exists for backward compatibility with call sites that haven't been migrated.
  return [];
}

export function startTracking(_user: OnlineUser): () => void {
  sendHeartbeat();
  const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  return () => clearInterval(interval);
}
