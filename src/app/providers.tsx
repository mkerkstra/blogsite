"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * next-themes renders an inline <script> tag at the top of the
 * provider tree to set the theme class on <html> before FOUC.
 * React 19's reconciler warns about <script> children in client
 * components ("Encountered a script tag while rendering React
 * component. Scripts inside React components are never executed
 * when rendering on the client"). The warning is dev-only and
 * benign — the script DOES execute on initial SSR parse, which is
 * exactly when next-themes needs it. We're already on the latest
 * next-themes (0.4.6); no clean fix until the library author
 * restructures its script injection for React 19.
 *
 * See: https://github.com/pacocoursey/next-themes
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
