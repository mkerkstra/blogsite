/**
 * OG image route handler — explicitly NOT using the `opengraph-image.tsx`
 * file convention because that auto-generates Twitter card metadata
 * (twitter:image, twitter:card, twitter:title, etc.) that we can't
 * suppress. By serving the same ImageResponse from a regular route
 * handler, we keep open-graph link previews working without leaking
 * twitter:* tags into the HTML head.
 *
 * The metadata.openGraph.images field in src/app/layout.tsx points
 * here explicitly.
 */
import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const revalidate = 86400;

const SIZE = { width: 1200, height: 630 };

// Satori chokes on variable fonts (opentype.js can't parse the
// variable-axis tables in Newsreader/Hanken-Grotesk from google/fonts
// and throws "Cannot read properties of undefined (reading '256')").
// Pull static single-weight WOFFs from @fontsource via jsdelivr
// instead — Satori supports WOFF and fontsource ships pre-sliced
// static-weight files. Font stack matches the web layout:
// - Newsreader italic 400 for the hero display
// - Hanken Grotesk 500 for body / tagline copy
// - JetBrains Mono 400 for metadata labels (top/bottom strips)
async function loadFonts() {
  const [serifItalic, sansMedium, monoRegular] = await Promise.all([
    fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/newsreader/files/newsreader-latin-400-italic.woff",
    ).then((r) => r.arrayBuffer()),
    fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff",
    ).then((r) => r.arrayBuffer()),
    fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
    ).then((r) => r.arrayBuffer()),
  ]);
  return { serifItalic, sansMedium, monoRegular };
}

export async function GET() {
  const { serifItalic, monoRegular, sansMedium } = await loadFonts();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        color: "#f5f1e8",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 88px",
        fontFamily: "Hanken Grotesk",
        position: "relative",
      }}
    >
      {/* Top mono label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 18,
          color: "#666666",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontFamily: "JetBrains Mono",
        }}
      >
        <span style={{ color: "#d4ff00", fontWeight: 700 }}>{">_"}</span>
        <span>kerkstra.dev</span>
      </div>

      {/* Hero — italic display name + tagline pulled from the resume summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            fontSize: 200,
            fontStyle: "italic",
            fontFamily: "Newsreader",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            color: "#f5f1e8",
            display: "flex",
          }}
        >
          Matt Kerkstra
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#d4ff00",
            letterSpacing: "0.02em",
            fontFamily: "Hanken Grotesk",
            fontWeight: 500,
            display: "flex",
          }}
        >
          building the systems other engineers run on.
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 18,
          color: "#666666",
          letterSpacing: "0.12em",
          fontFamily: "JetBrains Mono",
        }}
      >
        <div style={{ display: "flex", gap: 28 }}>
          <span>AUSTIN, TX</span>
          <span style={{ color: "#333333" }}>·</span>
          <span>github.com/mkerkstra</span>
        </div>
        <div style={{ display: "flex" }}>
          <span style={{ color: "#d4ff00" }}>kerkstra.dev</span>
        </div>
      </div>

      {/* Hairline rule along bottom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 56,
          height: 1,
          background: "#222222",
          display: "flex",
        }}
      />
    </div>,
    {
      ...SIZE,
      fonts: [
        {
          name: "Newsreader",
          data: serifItalic,
          style: "italic",
          weight: 400,
        },
        {
          name: "JetBrains Mono",
          data: monoRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Hanken Grotesk",
          data: sansMedium,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
