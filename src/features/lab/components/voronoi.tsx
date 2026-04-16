"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";

/* ── Voronoi Tessellation ──────────────────────
   Bowyer-Watson incremental Delaunay triangulation
   with Voronoi dual extraction. Seeds drift slowly
   and wrap toroidally.

   Bowyer (1981) "Computing Dirichlet Tessellations"
   Watson (1981) "Computing the n-dimensional Delaunay
   tessellation with application to Voronoi polytopes"
   ──────────────────────────────────────────────── */

/* ── Theme Constants ── */

const BG = { dark: "#0a0a0a", light: "#f5f1e8" } as const;
const ACCENT = { dark: "#d4ff00", light: "#2a8a0e" } as const;
const TEXT = {
  dark: (a: number) => `rgba(224,226,220,${a})`,
  light: (a: number) => `rgba(10,10,10,${a})`,
} as const;

/* ── Seed Data ── */

interface Seed {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function createSeeds(count: number, w: number, h: number): Seed[] {
  const seeds: Seed[] = [];
  for (let i = 0; i < count; i++) {
    seeds.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
    });
  }
  return seeds;
}

/* ── Geometry Types ── */

interface Triangle {
  i: number;
  j: number;
  k: number;
  cx: number;
  cy: number;
  rSq: number;
}

interface VoronoiEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface VoronoiCell {
  seedIdx: number;
  vertices: { x: number; y: number }[];
}

/* ── Circumcircle ── */

function circumcircle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): { cx: number; cy: number; rSq: number } | null {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const D = 2 * (dx * ey - dy * ex);
  if (Math.abs(D) < 1e-10) return null;
  const ux = (ey * (dx * dx + dy * dy) - dy * (ex * ex + ey * ey)) / D;
  const uy = (dx * (ex * ex + ey * ey) - ex * (dx * dx + dy * dy)) / D;
  const ccx = ax + ux;
  const ccy = ay + uy;
  return { cx: ccx, cy: ccy, rSq: ux * ux + uy * uy };
}

/* ── Bowyer-Watson Triangulation ── */

function bowyerWatson(
  points: { x: number; y: number }[],
  width: number,
  height: number,
): Triangle[] {
  const margin = Math.max(width, height) * 4;
  const superA = { x: -margin, y: -margin };
  const superB = { x: width + margin * 2, y: -margin };
  const superC = { x: width / 2, y: height + margin * 2 };

  const allPts = [superA, superB, superC, ...points];
  const superCC = circumcircle(superA.x, superA.y, superB.x, superB.y, superC.x, superC.y);
  if (superCC === null) return [];

  let triangles: Triangle[] = [
    { i: 0, j: 1, k: 2, cx: superCC.cx, cy: superCC.cy, rSq: superCC.rSq },
  ];

  for (let p = 3; p < allPts.length; p++) {
    const px = allPts[p].x;
    const py = allPts[p].y;

    const badIndices: number[] = [];
    for (let t = 0; t < triangles.length; t++) {
      const tri = triangles[t];
      const dx = px - tri.cx;
      const dy = py - tri.cy;
      if (dx * dx + dy * dy < tri.rSq + 1e-6) {
        badIndices.push(t);
      }
    }

    /* ── Find polygon hole boundary ── */
    const edges: { a: number; b: number }[] = [];
    for (const bi of badIndices) {
      const tri = triangles[bi];
      const triEdges = [
        { a: tri.i, b: tri.j },
        { a: tri.j, b: tri.k },
        { a: tri.k, b: tri.i },
      ];
      for (const edge of triEdges) {
        let shared = false;
        for (const bj of badIndices) {
          if (bi === bj) continue;
          const other = triangles[bj];
          const otherEdges = [
            [other.i, other.j],
            [other.j, other.k],
            [other.k, other.i],
          ];
          for (const oe of otherEdges) {
            if ((edge.a === oe[0] && edge.b === oe[1]) || (edge.a === oe[1] && edge.b === oe[0])) {
              shared = true;
              break;
            }
          }
          if (shared) break;
        }
        if (!shared) edges.push(edge);
      }
    }

    /* ── Remove bad triangles (reverse order to keep indices stable) ── */
    const sorted = badIndices.slice().sort((a, b) => b - a);
    for (const idx of sorted) {
      triangles.splice(idx, 1);
    }

    /* ── Re-triangulate hole ── */
    for (const edge of edges) {
      const cc = circumcircle(
        allPts[edge.a].x,
        allPts[edge.a].y,
        allPts[edge.b].x,
        allPts[edge.b].y,
        allPts[p].x,
        allPts[p].y,
      );
      if (cc === null) continue;
      triangles.push({
        i: edge.a,
        j: edge.b,
        k: p,
        cx: cc.cx,
        cy: cc.cy,
        rSq: cc.rSq,
      });
    }
  }

  /* ── Remove super-triangle edges ── */
  triangles = triangles.filter((t) => t.i > 2 && t.j > 2 && t.k > 2);

  /* ── Remap indices (subtract 3 for the super-triangle offset) ── */
  return triangles.map((t) => ({
    i: t.i - 3,
    j: t.j - 3,
    k: t.k - 3,
    cx: t.cx,
    cy: t.cy,
    rSq: t.rSq,
  }));
}

/* ── Extract Voronoi Edges from Delaunay ── */

function extractVoronoi(
  triangles: Triangle[],
  numPoints: number,
  width: number,
  height: number,
): { edges: VoronoiEdge[]; cells: VoronoiCell[] } {
  /* ── Build adjacency: for each edge (sorted pair), store adjacent triangle indices ── */
  const edgeToTriangles = new Map<string, number[]>();

  function edgeKey(a: number, b: number): string {
    return a < b ? `${a},${b}` : `${b},${a}`;
  }

  for (let t = 0; t < triangles.length; t++) {
    const tri = triangles[t];
    const pairs = [
      [tri.i, tri.j],
      [tri.j, tri.k],
      [tri.k, tri.i],
    ];
    for (const [a, b] of pairs) {
      const key = edgeKey(a, b);
      const existing = edgeToTriangles.get(key);
      if (existing) {
        existing.push(t);
      } else {
        edgeToTriangles.set(key, [t]);
      }
    }
  }

  /* ── Voronoi edges: connect circumcenters of adjacent triangles ── */
  const edges: VoronoiEdge[] = [];
  for (const tris of edgeToTriangles.values()) {
    if (tris.length === 2) {
      const t1 = triangles[tris[0]];
      const t2 = triangles[tris[1]];
      edges.push({ x1: t1.cx, y1: t1.cy, x2: t2.cx, y2: t2.cy });
    } else if (tris.length === 1) {
      /* ── Boundary edge: extend circumcenter toward viewport edge ── */
      const t1 = triangles[tris[0]];
      const dx = t1.cx - width / 2;
      const dy = t1.cy - height / 2;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ext = Math.max(width, height) * 2;
      if (len > 0) {
        edges.push({
          x1: t1.cx,
          y1: t1.cy,
          x2: t1.cx + (dx / len) * ext,
          y2: t1.cy + (dy / len) * ext,
        });
      }
    }
  }

  /* ── Build Voronoi cells: for each seed, collect circumcenters of surrounding triangles ── */
  const seedTriangles: number[][] = Array.from({ length: numPoints }, () => []);
  for (let t = 0; t < triangles.length; t++) {
    const tri = triangles[t];
    seedTriangles[tri.i].push(t);
    seedTriangles[tri.j].push(t);
    seedTriangles[tri.k].push(t);
  }

  const cells: VoronoiCell[] = [];
  for (let s = 0; s < numPoints; s++) {
    const triIndices = seedTriangles[s];
    if (triIndices.length < 3) continue;

    /* ── Sort circumcenters by angle around seed ── */
    const centers = triIndices.map((t) => ({
      x: triangles[t].cx,
      y: triangles[t].cy,
    }));

    /* ── Compute centroid for stable angle sorting ── */
    let cx = 0;
    let cy = 0;
    for (const c of centers) {
      cx += c.x;
      cy += c.y;
    }
    cx /= centers.length;
    cy /= centers.length;

    centers.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

    cells.push({ seedIdx: s, vertices: centers });
  }

  return { edges, cells };
}

/* ── Cell Color Generator ── */

function cellColor(index: number, theme: "dark" | "light", alpha: number): string {
  const hue = (index * 137.508) % 360;
  const sat = theme === "dark" ? 15 : 12;
  const lit = theme === "dark" ? 20 : 80;
  return `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;
}

/* ── Pulse Animation ── */

interface Pulse {
  x: number;
  y: number;
  t: number;
}

/* ── Component ── */

export function Voronoi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<{
    seeds: Seed[];
    paused: boolean;
    showDelaunay: boolean;
    showFill: boolean;
    showCircumcircles: boolean;
    targetCount: number;
    dragIdx: number;
    dragOffsetX: number;
    dragOffsetY: number;
    pulses: Pulse[];
  }>({
    seeds: [],
    paused: false,
    showDelaunay: false,
    showFill: true,
    showCircumcircles: false,
    targetCount: 30,
    dragIdx: -1,
    dragOffsetX: 0,
    dragOffsetY: 0,
    pulses: [],
  });

  const [seedCount, setSeedCount] = useState(30);
  const [showDelaunay, setShowDelaunay] = useState(false);
  const [showFill, setShowFill] = useState(true);
  const [showCircumcircles, setShowCircumcircles] = useState(false);
  const [paused, setPaused] = useState(false);

  /* ── Initialize seeds ── */

  const initSeeds = useCallback((count: number, w: number, h: number) => {
    const s = simRef.current;
    s.seeds = createSeeds(count, w, h);
    s.targetCount = count;
  }, []);

  /* ── Reset handler ── */

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = simRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    s.seeds = createSeeds(s.targetCount, rect.width * dpr, rect.height * dpr);
    s.paused = false;
    setPaused(false);
  }, []);

  /* ── Count handler ── */

  const handleCount = useCallback((val: number) => {
    const s = simRef.current;
    s.targetCount = val;
    setSeedCount(val);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    s.seeds = createSeeds(val, rect.width * dpr, rect.height * dpr);
  }, []);

  /* ── Toggle handlers ── */

  const togglePause = useCallback(() => {
    const next = !simRef.current.paused;
    simRef.current.paused = next;
    setPaused(next);
  }, []);

  const toggleDelaunay = useCallback(() => {
    const next = !simRef.current.showDelaunay;
    simRef.current.showDelaunay = next;
    setShowDelaunay(next);
  }, []);

  const toggleFill = useCallback(() => {
    const next = !simRef.current.showFill;
    simRef.current.showFill = next;
    setShowFill(next);
  }, []);

  const toggleCircumcircles = useCallback(() => {
    const next = !simRef.current.showCircumcircles;
    simRef.current.showCircumcircles = next;
    setShowCircumcircles(next);
  }, []);

  /* ── Effect: animation loop ── */

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas = maybeCanvas;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    const s = simRef.current;
    const reduced = prefersReducedMotion();

    /* ── Size canvas ── */
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initSeeds(s.targetCount, rect.width * dpr, rect.height * dpr);

    /* ── Resize observer ── */
    const observer = new ResizeObserver(([entry]) => {
      const dp = window.devicePixelRatio || 1;
      const newW = Math.round(entry.contentRect.width * dp);
      const newH = Math.round(entry.contentRect.height * dp);
      const oldW = canvas.width;
      const oldH = canvas.height;

      canvas.width = newW;
      canvas.height = newH;
      ctx.setTransform(dp, 0, 0, dp, 0, 0);

      const scaleX = oldW > 0 ? newW / oldW : 1;
      const scaleY = oldH > 0 ? newH / oldH : 1;
      for (const seed of s.seeds) {
        seed.x *= scaleX;
        seed.y *= scaleY;
      }
    });
    observer.observe(canvas);

    /* ── Pointer handlers ── */
    function getCanvasPos(e: PointerEvent): { cx: number; cy: number } {
      const dp = window.devicePixelRatio || 1;
      return { cx: e.clientX * dp, cy: e.clientY * dp };
    }

    function findSeedAt(cx: number, cy: number): number {
      const threshold = 20 * (window.devicePixelRatio || 1);
      const threshSq = threshold * threshold;
      let closest = -1;
      let closestDist = Infinity;
      for (let i = 0; i < s.seeds.length; i++) {
        const dx = s.seeds[i].x - cx;
        const dy = s.seeds[i].y - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq < threshSq && distSq < closestDist) {
          closest = i;
          closestDist = distSq;
        }
      }
      return closest;
    }

    function onPointerDown(e: PointerEvent) {
      const { cx, cy } = getCanvasPos(e);
      const idx = findSeedAt(cx, cy);
      if (idx >= 0) {
        s.dragIdx = idx;
        s.dragOffsetX = s.seeds[idx].x - cx;
        s.dragOffsetY = s.seeds[idx].y - cy;
        canvas.setPointerCapture(e.pointerId);
      } else {
        /* ── Add new seed ── */
        s.seeds.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
        });
        s.pulses.push({ x: cx, y: cy, t: 1.0 });
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (s.dragIdx < 0) return;
      const { cx, cy } = getCanvasPos(e);
      const seed = s.seeds[s.dragIdx];
      if (seed) {
        seed.x = cx + s.dragOffsetX;
        seed.y = cy + s.dragOffsetY;
        seed.vx = 0;
        seed.vy = 0;
      }
    }

    function onPointerUp() {
      s.dragIdx = -1;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    /* ── Keyboard handler ── */
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLButtonElement) return;
      if (e.key === " ") {
        e.preventDefault();
        const next = !s.paused;
        s.paused = next;
        setPaused(next);
      } else if (e.key === "r" || e.key === "R") {
        const dp = window.devicePixelRatio || 1;
        const r = canvas.getBoundingClientRect();
        s.seeds = createSeeds(s.targetCount, r.width * dp, r.height * dp);
        s.paused = false;
        setPaused(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    /* ── Animation loop ── */
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);

      const theme = getTheme();
      const dp = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      const logH = h / dp;

      /* ── Update seed positions ── */
      if (!s.paused) {
        const speed = reduced ? 0.15 : 1.0;
        for (let i = 0; i < s.seeds.length; i++) {
          if (i === s.dragIdx) continue;
          const seed = s.seeds[i];
          seed.x += seed.vx * speed;
          seed.y += seed.vy * speed;

          /* ── Toroidal wrap ── */
          if (seed.x < 0) seed.x += w;
          if (seed.x > w) seed.x -= w;
          if (seed.y < 0) seed.y += h;
          if (seed.y > h) seed.y -= h;
        }
      }

      /* ── Update pulses ── */
      for (let i = s.pulses.length - 1; i >= 0; i--) {
        s.pulses[i].t -= 0.03;
        if (s.pulses[i].t <= 0) {
          s.pulses.splice(i, 1);
        }
      }

      /* ── Compute Delaunay triangulation ── */
      const pts = s.seeds.map((seed) => ({ x: seed.x, y: seed.y }));
      const triangles = bowyerWatson(pts, w, h);
      const { edges: voronoiEdges, cells } = extractVoronoi(triangles, s.seeds.length, w, h);

      /* ── Clear ── */
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BG[theme];
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      /* ── Draw cell fills ── */
      if (s.showFill) {
        for (const cell of cells) {
          if (cell.vertices.length < 3) continue;
          ctx.beginPath();
          const v0 = cell.vertices[0];
          ctx.moveTo(v0.x / dp, v0.y / dp);
          for (let v = 1; v < cell.vertices.length; v++) {
            ctx.lineTo(cell.vertices[v].x / dp, cell.vertices[v].y / dp);
          }
          ctx.closePath();
          ctx.fillStyle = cellColor(cell.seedIdx, theme, 0.06);
          ctx.fill();
        }
      }

      /* ── Draw Voronoi edges ── */
      ctx.strokeStyle = TEXT[theme](0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const edge of voronoiEdges) {
        ctx.moveTo(edge.x1 / dp, edge.y1 / dp);
        ctx.lineTo(edge.x2 / dp, edge.y2 / dp);
      }
      ctx.stroke();

      /* ── Draw Delaunay overlay ── */
      if (s.showDelaunay) {
        ctx.strokeStyle = theme === "dark" ? "rgba(212,255,0,0.2)" : "rgba(42,138,14,0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (const tri of triangles) {
          const a = pts[tri.i];
          const b = pts[tri.j];
          const c = pts[tri.k];
          ctx.moveTo(a.x / dp, a.y / dp);
          ctx.lineTo(b.x / dp, b.y / dp);
          ctx.lineTo(c.x / dp, c.y / dp);
          ctx.closePath();
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      /* ── Draw circumcircles ── */
      if (s.showCircumcircles) {
        ctx.strokeStyle = theme === "dark" ? "rgba(212,255,0,0.12)" : "rgba(42,138,14,0.3)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (const tri of triangles) {
          const r = Math.sqrt(tri.rSq);
          ctx.moveTo((tri.cx + r) / dp, tri.cy / dp);
          ctx.arc(tri.cx / dp, tri.cy / dp, r / dp, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      /* ── Draw seeds ── */
      const accent = ACCENT[theme];
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (const seed of s.seeds) {
        ctx.moveTo(seed.x / dp + 4, seed.y / dp);
        ctx.arc(seed.x / dp, seed.y / dp, 4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      /* ── Draw pulses ── */
      for (const pulse of s.pulses) {
        const radius = (1 - pulse.t) * 30;
        const alpha = pulse.t * 0.5;
        ctx.strokeStyle =
          theme === "dark" ? `rgba(212,255,0,${alpha})` : `rgba(42,138,14,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pulse.x / dp, pulse.y / dp, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* ── Bottom-left label ── */
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = TEXT[theme](0.25);
      ctx.fillText(`VORONOI  ${s.seeds.length} SEEDS`, 12, logH - 60);
      ctx.fillText("CLICK TO ADD  |  DRAG TO MOVE  |  SPACE PAUSE  |  R RESET", 12, logH - 48);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [initSeeds]);

  /* ── Styles ── */

  const btnBase = "px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors";
  const btnActive = "bg-foreground/10 text-foreground/80";
  const btnInactive = "text-foreground/30 hover:text-foreground/50";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none" }}
        aria-hidden="true"
      />

      {/* ── Controls (top-right) ── */}
      <div className="fixed right-4 top-16 z-10" style={{ touchAction: "none" }}>
        <div className="flex flex-col gap-2 rounded bg-background/80 px-3 py-2.5 backdrop-blur-sm">
          {/* ── Seed count ── */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-foreground/30">
              Seeds
            </span>
            <div className="flex gap-1">
              {[15, 30, 50, 80].map((n) => (
                <button
                  key={n}
                  onClick={() => handleCount(n)}
                  className={`${btnBase} ${seedCount === n ? btnActive : btnInactive}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <span className="h-px w-full bg-foreground/10" />

          {/* ── Toggles ── */}
          <div className="flex flex-col gap-1">
            <button
              onClick={toggleDelaunay}
              className={`${btnBase} text-left ${showDelaunay ? btnActive : btnInactive}`}
            >
              Delaunay
            </button>
            <button
              onClick={toggleFill}
              className={`${btnBase} text-left ${showFill ? btnActive : btnInactive}`}
            >
              Fill
            </button>
            <button
              onClick={toggleCircumcircles}
              className={`${btnBase} text-left ${showCircumcircles ? btnActive : btnInactive}`}
            >
              Circumcircles
            </button>
          </div>

          <span className="h-px w-full bg-foreground/10" />

          {/* ── Pause / Reset ── */}
          <div className="flex gap-1">
            <button
              onClick={togglePause}
              className={`${btnBase} ${paused ? btnActive : btnInactive}`}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button onClick={handleReset} className={`${btnBase} ${btnInactive}`}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
