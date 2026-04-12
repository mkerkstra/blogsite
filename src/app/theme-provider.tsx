"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // localStorage unavailable (private mode, storage disabled)
  }
  return "system";
}

function applyTheme(resolved: ResolvedTheme) {
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  html.classList.add(resolved);
  html.style.colorScheme = resolved;
}

/**
 * Minimal theme provider. Replaces next-themes to avoid rendering
 * an inline <script> tag inside a client component tree (which
 * React 19 flags as a reconciler warning). The theme-init script
 * lives in the Server Component <head> via <ThemeInitScript />
 * in layout.tsx; this provider only tracks state and responds to
 * user toggles and system preference changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // On first render we don't know the user's theme (hydration safety).
  // Initial state is a reasonable placeholder — the useEffect below
  // reconciles with the real value immediately after mount, matching
  // what the inline ThemeInitScript already applied to <html>.
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedThemeState] = React.useState<ResolvedTheme>("dark");

  // Initial client-side sync — reads the stored preference and
  // derives the resolved theme once the browser is available.
  React.useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    const resolved = stored === "system" ? readSystemTheme() : stored;
    setResolvedThemeState(resolved);
    // ThemeInitScript already applied this class before hydration;
    // call applyTheme again defensively in case the script failed.
    applyTheme(resolved);
  }, []);

  // If the user's theme is "system", track OS preference changes.
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const resolved: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedThemeState(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
    setThemeState(next);
    const resolved = next === "system" ? readSystemTheme() : next;
    setResolvedThemeState(resolved);
    applyTheme(resolved);
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook for reading and updating the theme. Must be called inside a
 * <ThemeProvider>. Shape mirrors next-themes' `useTheme` so existing
 * consumers (theme-toggle, command-palette) don't need API changes.
 */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
