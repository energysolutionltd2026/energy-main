import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export interface SessionUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  companyName?: string;
  status?: string;
  emailVerified?: boolean;
  depot?: string;
  [key: string]: unknown;
}

interface UseUserOptions {
  required?: boolean;
  requiredRole?: string | string[];
  redirectTo?: string;
}

export function useUser(options: UseUserOptions = {}) {
  const { required = false, requiredRole, redirectTo = "/auth/login" } = options;
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const u: SessionUser | null = data?.user ?? null;
        setUser(u);
        setLoading(false);

        if (!u && required) {
          const next = encodeURIComponent(window.location.pathname);
          router.replace(`${redirectTo}?next=${next}`);
          return;
        }

        if (u && requiredRole) {
          const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!allowed.includes(u.role)) {
            router.replace(redirectTo);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setLoading(false);
        if (required) router.replace(redirectTo);
      });

    return () => { cancelled = true; };
  }, []);

  return { user, loading };
}
