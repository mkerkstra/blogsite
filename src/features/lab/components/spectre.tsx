"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ────────────────────────────────────────────
   Spectre aperiodic monotile — Canvas2D

   "A chiral aperiodic monotile"
   Smith, Myers, Kaplan, Goodman-Strauss (2023)
   https://arxiv.org/abs/2305.17743

   Substitution system and tile geometry ported from
   Craig S. Kaplan's reference implementation:
   https://cs.uwaterloo.ca/~csk/spectre/
   https://github.com/isohedral/hatviz (MIT License)

   Uses the 9-metatile hierarchy (Gamma, Delta, Theta,
   Lambda, Xi, Pi, Sigma, Phi, Psi) with recursive inflation.
   ──────────────────────────────────────────── */

/* ── Point & Transform math ── */

interface P {
  x: number;
  y: number;
}

function pt(x: number, y: number): P {
  return { x, y };
}

// 2x3 affine matrix stored as [a,b,c, d,e,f]
// x' = a*x + b*y + c
// y' = d*x + e*y + f
type M = [number, number, number, number, number, number];

const IDENT: M = [1, 0, 0, 0, 1, 0];

function mul(A: M, B: M): M {
  return [
    A[0] * B[0] + A[1] * B[3],
    A[0] * B[1] + A[1] * B[4],
    A[0] * B[2] + A[1] * B[5] + A[2],
    A[3] * B[0] + A[4] * B[3],
    A[3] * B[1] + A[4] * B[4],
    A[3] * B[2] + A[4] * B[5] + A[5],
  ];
}

function transPt(T: M, p: P): P {
  return pt(T[0] * p.x + T[1] * p.y + T[2], T[3] * p.x + T[4] * p.y + T[5]);
}

function trot(ang: number): M {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [c, -s, 0, s, c, 0];
}

function ttrans(tx: number, ty: number): M {
  return [1, 0, tx, 0, 1, ty];
}

function transTo(p: P, q: P): M {
  return ttrans(q.x - p.x, q.y - p.y);
}

/* ── Spectre tile vertices ── */

const SPECTRE: P[] = [
  pt(0, 0),
  pt(1.0, 0.0),
  pt(1.5, -0.8660254037844386),
  pt(2.366025403784439, -0.36602540378443865),
  pt(2.366025403784439, 0.6339745962155614),
  pt(3.366025403784439, 0.6339745962155614),
  pt(3.866025403784439, 1.5),
  pt(3.0, 2.0),
  pt(2.133974596215561, 1.5),
  pt(1.6339745962155614, 2.3660254037844393),
  pt(0.6339745962155614, 2.3660254037844393),
  pt(-0.3660254037844386, 2.3660254037844393),
  pt(-0.866025403784439, 1.5),
  pt(0.0, 1.0),
];

/** The four "key" vertices that define the quad coordinate frame */
const SPECTRE_QUAD = [SPECTRE[3], SPECTRE[5], SPECTRE[7], SPECTRE[11]];

/* ── Metatile labels ── */

const LABEL_NAMES = [
  "Gamma",
  "Delta",
  "Theta",
  "Lambda",
  "Xi",
  "Pi",
  "Sigma",
  "Phi",
  "Psi",
] as const;

type LabelName = (typeof LABEL_NAMES)[number];

/* ── Shape: a leaf tile to be drawn ── */

interface Shape {
  kind: "shape";
  pts: P[];
  quad: P[];
  label: LabelName;
}

/* ── Meta: a composite metatile containing children ── */

interface MetaChild {
  geom: Geom;
  xform: M;
}

interface Meta {
  kind: "meta";
  children: MetaChild[];
  quad: P[];
}

type Geom = Shape | Meta;

/* ── Collect all leaf shapes with accumulated transform ── */

interface FlatTile {
  pts: [number, number][];
  label: LabelName;
  orientation: number;
}

function collectTiles(geom: Geom, xform: M, out: FlatTile[]): void {
  if (geom.kind === "shape") {
    const worldPts = geom.pts.map((p) => {
      const wp = transPt(xform, p);
      return [wp.x, wp.y] as [number, number];
    });
    const orientation = Math.atan2(xform[3], xform[0]);
    out.push({ pts: worldPts, label: geom.label, orientation });
  } else {
    for (const child of geom.children) {
      collectTiles(child.geom, mul(xform, child.xform), out);
    }
  }
}

/* ── Build base Spectre tiles (level 0) ── */

function buildSpectreBase(): Record<LabelName, Geom> {
  const ret: Partial<Record<LabelName, Geom>> = {};

  // All non-Gamma types are plain shapes
  for (const lab of ["Delta", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Phi", "Psi"] as const) {
    const shape: Shape = {
      kind: "shape",
      pts: [...SPECTRE],
      quad: [...SPECTRE_QUAD],
      label: lab,
    };
    ret[lab] = shape;
  }

  // Gamma is a "mystic" — two Spectres combined
  const mystic: Meta = {
    kind: "meta",
    children: [
      {
        geom: {
          kind: "shape",
          pts: [...SPECTRE],
          quad: [...SPECTRE_QUAD],
          label: "Gamma",
        },
        xform: IDENT,
      },
      {
        geom: {
          kind: "shape",
          pts: [...SPECTRE],
          quad: [...SPECTRE_QUAD],
          label: "Gamma",
        },
        xform: mul(ttrans(SPECTRE[8].x, SPECTRE[8].y), trot(Math.PI / 6)),
      },
    ],
    quad: [...SPECTRE_QUAD],
  };
  ret["Gamma"] = mystic;

  return ret as Record<LabelName, Geom>;
}

/* ── Build supertiles (one level of substitution) ── */

function buildSupertiles(sys: Record<LabelName, Geom>): Record<LabelName, Geom> {
  const quad = sys["Delta"].quad;

  // Reflection matrix
  const R: M = [-1, 0, 0, 0, 1, 0];

  // Rules for building the 8 transform positions
  // [angle_delta, from_quad_idx, to_quad_idx]
  const tRules: [number, number, number][] = [
    [60, 3, 1],
    [0, 2, 0],
    [60, 3, 1],
    [60, 3, 1],
    [0, 2, 0],
    [60, 3, 1],
    [-120, 3, 3],
  ];

  const Ts: M[] = [IDENT];
  let totalAng = 0;
  let rotation = IDENT;
  const tquad = [...quad];

  for (const [ang, from, to] of tRules) {
    totalAng += ang;
    if (ang !== 0) {
      rotation = trot((totalAng * Math.PI) / 180);
      for (let i = 0; i < 4; i++) {
        tquad[i] = transPt(rotation, quad[i]);
      }
    }

    const prevTs = Ts[Ts.length - 1];
    const ttt = transTo(tquad[to], transPt(prevTs, quad[from]));
    Ts.push(mul(ttt, rotation));
  }

  // Apply reflection to all transforms
  for (let idx = 0; idx < Ts.length; idx++) {
    Ts[idx] = mul(R, Ts[idx]);
  }

  // Substitution rules: for each metatile type, which 8 children to place
  // "null" means skip that position
  const superRules: Record<LabelName, (LabelName | "null")[]> = {
    Gamma: ["Pi", "Delta", "null", "Theta", "Sigma", "Xi", "Phi", "Gamma"],
    Delta: ["Xi", "Delta", "Xi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
    Theta: ["Psi", "Delta", "Pi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
    Lambda: ["Psi", "Delta", "Xi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
    Xi: ["Psi", "Delta", "Pi", "Phi", "Sigma", "Psi", "Phi", "Gamma"],
    Pi: ["Psi", "Delta", "Xi", "Phi", "Sigma", "Psi", "Phi", "Gamma"],
    Sigma: ["Xi", "Delta", "Xi", "Phi", "Sigma", "Pi", "Lambda", "Gamma"],
    Phi: ["Psi", "Delta", "Psi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
    Psi: ["Psi", "Delta", "Psi", "Phi", "Sigma", "Psi", "Phi", "Gamma"],
  };

  // The quad for the supertile level
  const superQuad = [
    transPt(Ts[6], quad[2]),
    transPt(Ts[5], quad[1]),
    transPt(Ts[3], quad[2]),
    transPt(Ts[0], quad[1]),
  ];

  const ret: Partial<Record<LabelName, Geom>> = {};

  for (const lab of LABEL_NAMES) {
    const subs = superRules[lab];
    const sup: Meta = {
      kind: "meta",
      children: [],
      quad: superQuad,
    };
    for (let idx = 0; idx < 8; idx++) {
      const subLabel = subs[idx];
      if (subLabel === "null") continue;
      sup.children.push({
        geom: sys[subLabel],
        xform: Ts[idx],
      });
    }
    ret[lab] = sup;
  }

  return ret as Record<LabelName, Geom>;
}

/* ── Generate the full tiling ── */

function generateTiling(levels: number): FlatTile[] {
  let sys = buildSpectreBase();

  for (let i = 0; i < levels; i++) {
    sys = buildSupertiles(sys);
  }

  // Use "Gamma" as the root (the mystic, which produces the most
  // interesting and complete tiling)
  const root = sys["Gamma"];
  const tiles: FlatTile[] = [];
  collectTiles(root, IDENT, tiles);
  return tiles;
}

/* ── Color palettes ── */

type ColorMode = "type" | "orientation" | "mono";

const LABEL_TO_INDEX: Record<LabelName, number> = {
  Gamma: 0,
  Delta: 1,
  Theta: 2,
  Lambda: 3,
  Xi: 4,
  Pi: 5,
  Sigma: 6,
  Phi: 7,
  Psi: 8,
};

const COLORS_DARK = [
  "rgba(212,255,0,0.40)", // Gamma — lime
  "rgba(0,212,255,0.35)", // Delta — cyan
  "rgba(255,107,107,0.35)", // Theta — red
  "rgba(192,132,252,0.35)", // Lambda — purple
  "rgba(52,211,153,0.35)", // Xi — emerald
  "rgba(251,191,36,0.35)", // Pi — amber
  "rgba(129,140,248,0.35)", // Sigma — indigo
  "rgba(244,114,182,0.35)", // Phi — pink
  "rgba(163,230,53,0.35)", // Psi — lime-green
];

const COLORS_LIGHT = [
  "rgba(100,120,0,0.30)", // Gamma — olive
  "rgba(0,130,170,0.28)", // Delta — teal
  "rgba(180,50,50,0.28)", // Theta — burgundy
  "rgba(120,60,180,0.28)", // Lambda — grape
  "rgba(20,140,80,0.28)", // Xi — forest
  "rgba(180,130,20,0.28)", // Pi — gold
  "rgba(60,70,180,0.28)", // Sigma — navy
  "rgba(180,60,120,0.28)", // Phi — rose
  "rgba(80,150,30,0.28)", // Psi — green
];

function hslFromAngle(angle: number, isDark: boolean): string {
  const hue = ((angle * 180) / Math.PI + 360) % 360;
  if (isDark) {
    return `hsla(${hue.toFixed(0)}, 60%, 55%, 0.40)`;
  }
  return `hsla(${hue.toFixed(0)}, 50%, 35%, 0.30)`;
}

function getTileColor(tile: FlatTile, mode: ColorMode, isDark: boolean): string {
  const palette = isDark ? COLORS_DARK : COLORS_LIGHT;

  switch (mode) {
    case "type": {
      const idx = LABEL_TO_INDEX[tile.label];
      return palette[idx % palette.length];
    }
    case "orientation":
      return hslFromAngle(tile.orientation, isDark);
    case "mono":
      return isDark ? "rgba(212,255,0,0.25)" : "rgba(10,10,10,0.12)";
  }
}

/* ── Component ── */

export function Spectre() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  const [level, setLevel] = useState(3);
  const [colorMode, setColorMode] = useState<ColorMode>("type");
  const [tileCount, setTileCount] = useState(0);

  const viewRef = useRef({
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    dirty: true,
  });

  const tilesRef = useRef<FlatTile[]>([]);
  const levelRef = useRef(level);
  const colorModeRef = useRef(colorMode);

  const regenerate = useCallback((newLevel: number) => {
    const tiles = generateTiling(newLevel);
    tilesRef.current = tiles;
    levelRef.current = newLevel;

    // Auto-fit bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const tile of tiles) {
      for (const p of tile.pts) {
        if (p[0] < minX) minX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] > maxY) maxY = p[1];
      }
    }

    const maybeCanvas = canvasRef.current;
    if (maybeCanvas) {
      const bw = maxX - minX || 1;
      const bh = maxY - minY || 1;
      const cw = maybeCanvas.width;
      const ch = maybeCanvas.height;
      const pad = 60;
      const sc = Math.min((cw - pad * 2) / bw, (ch - pad * 2) / bh);
      viewRef.current.zoom = sc;
      viewRef.current.offsetX = cw / 2 - ((minX + maxX) / 2) * sc;
      viewRef.current.offsetY = ch / 2 - ((minY + maxY) / 2) * sc;
    }

    viewRef.current.dirty = true;
    return tiles.length;
  }, []);

  const draw = useCallback(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const v = viewRef.current;
    const tiles = tilesRef.current;
    const mode = colorModeRef.current;
    const isDark = getTheme() === "dark";

    ctx.fillStyle = isDark ? "#0a0a0a" : "#f5f1e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const strokeColor = isDark ? "rgba(224,226,220,0.15)" : "rgba(10,10,10,0.1)";

    // Visible bounds for culling
    const invZoom = 1 / v.zoom;
    const pad = 50 * invZoom;
    const visMinX = -v.offsetX * invZoom - pad;
    const visMaxX = (canvas.width - v.offsetX) * invZoom + pad;
    const visMinY = -v.offsetY * invZoom - pad;
    const visMaxY = (canvas.height - v.offsetY) * invZoom + pad;

    ctx.save();
    ctx.translate(v.offsetX, v.offsetY);
    ctx.scale(v.zoom, v.zoom);
    ctx.lineWidth = Math.max(0.3, 0.6 / v.zoom);
    ctx.lineJoin = "round";

    for (const tile of tiles) {
      // Quick AABB cull
      const p0 = tile.pts[0];
      let tMinX = p0[0];
      let tMaxX = p0[0];
      let tMinY = p0[1];
      let tMaxY = p0[1];
      for (let i = 1; i < tile.pts.length; i++) {
        const px = tile.pts[i][0];
        const py = tile.pts[i][1];
        if (px < tMinX) tMinX = px;
        if (px > tMaxX) tMaxX = px;
        if (py < tMinY) tMinY = py;
        if (py > tMaxY) tMaxY = py;
      }
      if (tMaxX < visMinX || tMinX > visMaxX || tMaxY < visMinY || tMinY > visMaxY) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(tile.pts[0][0], tile.pts[0][1]);
      for (let i = 1; i < tile.pts.length; i++) {
        ctx.lineTo(tile.pts[i][0], tile.pts[i][1]);
      }
      ctx.closePath();

      ctx.fillStyle = getTileColor(tile, mode, isDark);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const handleReset = useCallback(() => {
    const count = regenerate(levelRef.current);
    setTileCount(count);
    viewRef.current.dirty = true;
  }, [regenerate]);

  const COLOR_MODES: ColorMode[] = ["type", "orientation", "mono"];
  const COLOR_MODE_LABELS: Record<ColorMode, string> = {
    type: "TYPE",
    orientation: "ANGLE",
    mono: "MONO",
  };

  const cycleColorMode = useCallback(() => {
    setColorMode((prev) => {
      const idx = COLOR_MODES.indexOf(prev);
      const next = COLOR_MODES[(idx + 1) % COLOR_MODES.length];
      colorModeRef.current = next;
      viewRef.current.dirty = true;
      return next;
    });
  }, []);

  // Canvas setup, interaction, render loop
  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * window.devicePixelRatio);
    canvas.height = Math.round(rect.height * window.devicePixelRatio);

    const count = regenerate(levelRef.current);
    setTileCount(count);

    // Pan state
    const pan = {
      active: false,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
    };

    // Pinch state
    const pinch = {
      active: false,
      initialDistance: 0,
      initialZoom: 1,
      centerX: 0,
      centerY: 0,
    };
    const activePointers = new Map<number, { x: number; y: number }>();

    function getPointerDistance(): number {
      const pts = Array.from(activePointers.values());
      if (pts.length < 2) return 0;
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function getPointerCenter(): [number, number] {
      const pts = Array.from(activePointers.values());
      if (pts.length < 2) return [0, 0];
      return [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2];
    }

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        pinch.active = true;
        pan.active = false;
        pinch.initialDistance = getPointerDistance();
        pinch.initialZoom = viewRef.current.zoom;
        const center = getPointerCenter();
        pinch.centerX = center[0];
        pinch.centerY = center[1];
        return;
      }
      if (e.button === 0 && activePointers.size === 1) {
        pan.active = true;
        pan.startX = e.clientX;
        pan.startY = e.clientY;
        pan.startOffsetX = viewRef.current.offsetX;
        pan.startOffsetY = viewRef.current.offsetY;
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch.active && activePointers.size >= 2) {
        const dist = getPointerDistance();
        if (pinch.initialDistance > 0) {
          const v = viewRef.current;
          const ratio = dist / pinch.initialDistance;
          const newZoom = pinch.initialZoom * ratio;
          const dpr = window.devicePixelRatio;
          const cx = pinch.centerX * dpr;
          const cy = pinch.centerY * dpr;
          v.offsetX = cx - (cx - v.offsetX) * (newZoom / v.zoom);
          v.offsetY = cy - (cy - v.offsetY) * (newZoom / v.zoom);
          v.zoom = newZoom;
          v.dirty = true;
        }
        return;
      }
      if (!pan.active) return;
      const v = viewRef.current;
      const dpr = window.devicePixelRatio;
      v.offsetX = pan.startOffsetX + (e.clientX - pan.startX) * dpr;
      v.offsetY = pan.startOffsetY + (e.clientY - pan.startY) * dpr;
      v.dirty = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinch.active = false;
      if (activePointers.size === 0) pan.active = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const dpr = window.devicePixelRatio;
      const mx = e.clientX * dpr;
      const my = e.clientY * dpr;
      v.offsetX = mx - (mx - v.offsetX) * zoomFactor;
      v.offsetY = my - (my - v.offsetY) * zoomFactor;
      v.zoom *= zoomFactor;
      v.dirty = true;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const resizeObs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      viewRef.current.dirty = true;
    });
    resizeObs.observe(canvas);

    const themeObs = new MutationObserver(() => {
      viewRef.current.dirty = true;
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const _reduced = prefersReducedMotion();

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      if (viewRef.current.dirty) {
        viewRef.current.dirty = false;
        draw();
      }
    }
    viewRef.current.dirty = true;
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObs.disconnect();
      themeObs.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [regenerate, draw]);

  useEffect(() => {
    levelRef.current = level;
    const count = regenerate(level);
    setTileCount(count);
  }, [level, regenerate]);

  useEffect(() => {
    colorModeRef.current = colorMode;
    viewRef.current.dirty = true;
  }, [colorMode]);

  const btnBase = "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors";
  const btnInactive = "text-foreground/40 hover:text-foreground/70";
  const btnActive = "text-foreground/90";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none", cursor: "grab" }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-16 left-1/2 z-10 -translate-x-1/2"
        style={{ touchAction: "none" }}
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded bg-background/70 px-3 py-1.5 backdrop-blur-sm">
          <label className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              LEVEL
            </span>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] text-foreground/60 outline-none"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <span className="h-4 w-px bg-foreground/10" />

          <button onClick={cycleColorMode} className={`${btnBase} ${btnActive}`}>
            {COLOR_MODE_LABELS[colorMode]}
          </button>

          <span className="h-4 w-px bg-foreground/10" />

          <span className="font-mono text-[10px] tabular-nums tracking-wide text-foreground/40">
            {tileCount.toLocaleString()} tiles
          </span>

          <span className="h-4 w-px bg-foreground/10" />

          <button onClick={handleReset} className={`${btnBase} ${btnInactive}`}>
            RESET
          </button>
        </div>
      </div>
    </>
  );
}
