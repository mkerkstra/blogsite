import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";

import { Providers } from "@/app/providers";
import { CommandPalette } from "@/components/command-palette";
import { DevConsoleFilter } from "@/components/dev-console-filter";
import { Footer } from "@/features/resume/components/footer";
import { Navbar } from "@/features/resume/components/navbar";

// Fonts mirror ~/projects/videa/contribution-report.html:
// - Hanken Grotesk for body + headings (sans)
// - Newsreader italic for display accents (the hero name, "at" connectors, ledes)
// - JetBrains Mono for labels, chips, metadata

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://www.kerkstra.dev";
const SITE_NAME = "kerkstra.dev";
const DEFAULT_TITLE = "Matt Kerkstra — Software Engineer";
const DEFAULT_DESCRIPTION =
  "Staff-level platform engineer with seven years building production ML infrastructure and the systems other engineers run on.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title template — child pages override `title` and the template
  // wraps it as "Page Title · kerkstra.dev". Pages that want a fully
  // custom title (no template) can set `title: { absolute: "..." }`.
  title: {
    default: DEFAULT_TITLE,
    template: "%s · kerkstra.dev",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Matt Kerkstra", url: SITE_URL }],
  creator: "Matt Kerkstra",
  publisher: "Matt Kerkstra",
  alternates: {
    canonical: "/",
    types: {
      "application/json": "/api/resume.json",
    },
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: DEFAULT_TITLE,
        type: "image/png",
      },
    ],
  },
  // Next 16 auto-derives twitter:* from openGraph with no clean
  // opt-out (twitter: null doesn't suppress; explicit empty objects
  // still emit empty tags). Matt is off X and doesn't want twitter
  // cards. Workaround: scripts/strip-twitter-tags.ts runs as a
  // post-build step that strips twitter:* meta tags from every
  // prerendered HTML file under .next/server/app. The openGraph
  // fields here keep driving Slack/LinkedIn/Discord previews.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="grain min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <DevConsoleFilter />
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
