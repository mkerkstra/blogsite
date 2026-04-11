import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/app/providers";
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
  title: "Matt Kerkstra — Staff-level Platform Engineer",
  description:
    "Staff-level platform engineer with seven years building production ML infrastructure and the systems other engineers run on.",
  icons: {
    icon: "/favicon.ico",
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
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-10 md:px-8">
              {children}
            </main>
            <Footer />
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
