import { ImageResponse } from "next/og";

export const alt = "Matt Kerkstra — Platform Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fetch the actual font files at request time so Satori renders the
// hero in real Instrument Serif italic instead of falling back to sans.
// google/fonts ships TTFs in their public repo — stable URLs, cached
// by Vercel after first request.
// Satori chokes on variable fonts (the [wght] axis). Pull static
// single-weight TTFs: Instrument Serif italic from google/fonts,
// JetBrains Mono regular from JetBrains' own repo (the google/fonts
// copy is variable-only).
async function loadFonts() {
  const [serifItalic, monoRegular] = await Promise.all([
    fetch(
      "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf",
    ).then((r) => r.arrayBuffer()),
    fetch(
      "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf",
    ).then((r) => r.arrayBuffer()),
  ]);
  return { serifItalic, monoRegular };
}

export default async function OpengraphImage() {
  const { serifItalic, monoRegular } = await loadFonts();
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
        fontFamily: "JetBrains Mono",
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
            fontFamily: "Instrument Serif",
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
            letterSpacing: "0.06em",
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
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
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
      ],
    },
  );
}
