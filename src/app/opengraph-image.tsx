import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Matt Kerkstra — Platform Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
        fontFamily: "ui-monospace, monospace",
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

      {/* Hero — italic display name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 24,
            color: "#d4ff00",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          ↳ Staff-level Platform Engineer
        </div>
        <div
          style={{
            fontSize: 168,
            fontStyle: "italic",
            fontFamily: "ui-serif, Georgia, serif",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            color: "#f5f1e8",
            display: "flex",
          }}
        >
          Matt Kerkstra
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
    { ...size },
  );
}
