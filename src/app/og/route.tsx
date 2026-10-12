/**
 * OG image route handler — explicitly NOT using the `opengraph-image.tsx`
 * file convention because that auto-generates Twitter card metadata
 * (twitter:image, twitter:card, twitter:title, etc.) that we can't
 * suppress. By serving the same ImageResponse from a regular route
 * handler, we keep open-graph link previews working without leaking
 * twitter:* tags into the HTML head.
 *
 * Pages reference it via og:image tags rendered in-tree by
 * <SocialMeta> (see docs/architecture/static-seo-routes.md).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// Rendered once at build time (no revalidate): the image only changes on
// deploy, and build-time rendering is what makes the local font reads safe.
export const dynamic = "force-static";

const SIZE = { width: 1200, height: 630 };

// Satori chokes on variable fonts (opentype.js can't parse the
// variable-axis tables in Newsreader/Hanken-Grotesk from google/fonts
// and throws "Cannot read properties of undefined (reading '256')").
// Static single-weight WOFFs from @fontsource are vendored in ./fonts
// (OFL-1.1, licenses alongside) so the build has no CDN dependency.
// Font stack matches the web layout:
// - Newsreader italic 400 for the hero display
// - Hanken Grotesk 500 for the tagline, 400 for the metadata strips
const FONT_DIR = join(process.cwd(), "src/app/og/fonts");

async function loadFonts() {
  const [serifItalic, sansMedium, sansRegular] = await Promise.all(
    [
      "newsreader-latin-400-italic.woff",
      "hanken-grotesk-latin-500-normal.woff",
      "hanken-grotesk-latin-400-normal.woff",
    ].map((file) => readFile(join(FONT_DIR, file))),
  );
  return { serifItalic, sansMedium, sansRegular };
}

export async function GET() {
  const { serifItalic, sansMedium, sansRegular } = await loadFonts();
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
      {/* Top label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 22,
          color: "#888888",
          fontFamily: "Hanken Grotesk",
          fontWeight: 400,
        }}
      >
        <span style={{ color: "#d4ff00", fontWeight: 500 }}>{">_"}</span>
        <span>kerkstra.dev</span>
      </div>

      {/* Hero — italic display name + tagline pulled from the resume summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            fontSize: 172,
            fontStyle: "italic",
            fontFamily: "Newsreader",
            lineHeight: 1,
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
          fontSize: 22,
          color: "#888888",
          fontFamily: "Hanken Grotesk",
          fontWeight: 400,
        }}
      >
        <div style={{ display: "flex", gap: 28 }}>
          <span>Austin, TX</span>
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
          name: "Hanken Grotesk",
          data: sansRegular,
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
