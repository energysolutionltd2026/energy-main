"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Light/dark theme management.
 *
 * - `mode` is the user's stored preference: "light", "dark", or "system".
 * - `resolved` is the theme actually applied ("light" | "dark"); when the mode
 *   is "system" it tracks the OS `prefers-color-scheme` live.
 * - The choice persists in localStorage under "theme"; "system" is represented
 *   by the absence of a stored value (so we keep following the OS).
 *
 * The initial `.dark` class is set by a blocking inline script in _document to
 * avoid a flash of the wrong theme before hydration; this provider then keeps it
 * in sync with user/OS changes.
 */
type Mode = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeCtx {
  mode: Mode;
  resolved: Resolved;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "theme";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyClass(resolved: Resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  // Hydrate the stored preference once on mount.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setModeState(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  // Resolve + apply whenever the mode changes; follow the OS when in "system".
  useEffect(() => {
    const compute = () => {
      const r: Resolved =
        mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
      setResolved(r);
      applyClass(r);
    };
    compute();

    if (mode === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", compute);
      return () => mq.removeEventListener("change", compute);
    }
  }, [mode]);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    try {
      if (m === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
