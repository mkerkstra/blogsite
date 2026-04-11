import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/app/providers";
import { CommandPalette } from "@/components/command-palette";
import { Footer } from "@/features/resume/components/footer";
import { Navbar } from "@/features/resume/components/navbar";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kerkstra.dev"),
  title: "Matt Kerkstra — Platform Engineer",
  description:
    "Staff-level platform engineer with seven years building production ML infrastructure and the systems other engineers run on.",
  alternates: {
    types: {
      "application/json": "/api/resume.json",
    },
  },
  openGraph: {
    title: "Matt Kerkstra — Platform Engineer",
    description:
      "Staff-level platform engineer with seven years building production ML infrastructure and the systems other engineers run on.",
    url: "https://www.kerkstra.dev",
    siteName: "kerkstra.dev",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="grain min-h-screen bg-background font-mono text-foreground antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:text-foreground focus:outline focus:outline-2 focus:outline-accent"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-10 md:px-8">
              {children}
            </main>
            <Footer />
          </div>
          <CommandPalette />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
