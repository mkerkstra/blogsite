"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── GLSL — fullscreen-triangle vertex shader ── */

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vUv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}`;

/* ── GLSL — Mandelbrot fragment shader ── */

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform float uZoom;
uniform vec2 uResolution;
uniform float uMaxIter;
uniform int uTheme; // 0 = dark, 1 = light

out vec4 fragColor;

// Dark palette: black interior, blues -> lime (#d4ff00) -> whites
vec3 paletteDark(float t) {
  // Cycle through: deep blue -> mid blue -> lime -> white -> deep blue
  vec3 a = vec3(0.02, 0.02, 0.08);
  vec3 b = vec3(0.7, 0.8, 0.4);
  vec3 c = vec3(1.0, 1.0, 0.8);
  vec3 d = vec3(0.0, 0.15, 0.4);

  float pi2 = 6.28318530718;
  return a + b * cos(pi2 * (c * t + d));
}

// Light palette: dark interior, warm browns -> green (#2a8a0e) -> creams
vec3 paletteLight(float t) {
  vec3 a = vec3(0.5, 0.45, 0.4);
  vec3 b = vec3(0.4, 0.45, 0.35);
  vec3 c = vec3(1.0, 0.8, 0.7);
  vec3 d = vec3(0.1, 0.25, 0.15);

  float pi2 = 6.28318530718;
  return a + b * cos(pi2 * (c * t + d));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;

  // Map pixel to complex plane
  vec2 c = uCenter + (uv - 0.5) * vec2(aspect, 1.0) * uZoom;

  // Iterate z = z^2 + c
  vec2 z = vec2(0.0);
  float iter = 0.0;
  for (float i = 0.0; i < 2000.0; i++) {
    if (i >= uMaxIter) break;
    if (dot(z, z) > 256.0) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    iter = i;
  }

  // Smooth coloring
  if (dot(z, z) > 256.0) {
    float smoothIter = iter - log2(log2(dot(z, z))) + 4.0;
    float t = fract(smoothIter * 0.02 + 0.5);

    vec3 col;
    if (uTheme == 0) {
      col = paletteDark(t);
    } else {
      col = paletteLight(t);
    }
    fragColor = vec4(col, 1.0);
  } else {
    // Interior
    if (uTheme == 0) {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      fragColor = vec4(0.06, 0.05, 0.04, 1.0);
    }
  }
}`;

/* ── WebGL helpers ── */

function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader compile:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("Program link:", gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

/* ── Zoom formatting ── */

function formatZoom(zoom: number): string {
  const magnification = 3.0 / zoom;
  if (magnification < 1000) return `${magnification.toFixed(0)}x`;
  if (magnification < 1_000_000) return `${(magnification / 1000).toFixed(1)}K x`;
  if (magnification < 1_000_000_000) return `${(magnification / 1_000_000).toFixed(1)}M x`;
  return `${(magnification / 1_000_000_000).toFixed(1)}B x`;
}

function formatCoord(n: number): string {
  return n >= 0 ? ` ${n.toFixed(10)}` : n.toFixed(10);
}

/* ── Defaults ── */

const DEFAULT_CENTER: [number, number] = [-0.5, 0.0];
const DEFAULT_ZOOM = 3.0;
const ZOOM_FACTOR = 2.0;
const MIN_ZOOM = 1e-13;

/* ── Component ── */

export function Mandelbrot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View state kept in refs for the GL render loop, mirrored to React state for display
  const viewRef = useRef({
    center: [...DEFAULT_CENTER] as [number, number],
    zoom: DEFAULT_ZOOM,
    dirty: true,
  });

  const [displayCenter, setDisplayCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [displayZoom, setDisplayZoom] = useState(DEFAULT_ZOOM);
  const [displayIter, setDisplayIter] = useState(100);

  const syncDisplay = useCallback(() => {
    const v = viewRef.current;
    setDisplayCenter([v.center[0], v.center[1]]);
    setDisplayZoom(v.zoom);
    setDisplayIter(Math.floor(computeMaxIter(v.zoom)));
  }, []);

  const handleReset = useCallback(() => {
    const v = viewRef.current;
    v.center[0] = DEFAULT_CENTER[0];
    v.center[1] = DEFAULT_CENTER[1];
    v.zoom = DEFAULT_ZOOM;
    v.dirty = true;
    syncDisplay();
  }, [syncDisplay]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("webgl2", {
      antialias: false,
      depth: false,
    });
    if (!ctx) return;

    // Rebind so TS narrows through closures
    const canvas = cvs;
    const gl = ctx;

    // ── Canvas dimensions ──
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * window.devicePixelRatio);
    canvas.height = Math.round(rect.height * window.devicePixelRatio);

    // ── Compile shaders ──
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = linkProgram(gl, vs, fs);
    if (!prog) return;

    const loc = {
      center: gl.getUniformLocation(prog, "uCenter"),
      zoom: gl.getUniformLocation(prog, "uZoom"),
      resolution: gl.getUniformLocation(prog, "uResolution"),
      maxIter: gl.getUniformLocation(prog, "uMaxIter"),
      theme: gl.getUniformLocation(prog, "uTheme"),
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // ── Render function (called on demand, not every frame) ──
    let currentTheme = document.documentElement.classList.contains("dark") ? 0 : 1;

    function render() {
      const v = viewRef.current;
      const maxIter = computeMaxIter(v.zoom);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.uniform2f(loc.center, v.center[0], v.center[1]);
      gl.uniform1f(loc.zoom, v.zoom);
      gl.uniform2f(loc.resolution, canvas.width, canvas.height);
      gl.uniform1f(loc.maxIter, maxIter);
      gl.uniform1i(loc.theme, currentTheme);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ── Pan state ──
    const pan = {
      active: false,
      startX: 0,
      startY: 0,
      startCenterX: 0,
      startCenterY: 0,
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only start pan on primary button without shift
      if (e.button === 0 && !e.shiftKey) {
        pan.active = true;
        pan.startX = e.clientX;
        pan.startY = e.clientY;
        pan.startCenterX = viewRef.current.center[0];
        pan.startCenterY = viewRef.current.center[1];
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pan.active) return;
      const v = viewRef.current;
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      const aspect = cssWidth / cssHeight;
      const dx = (e.clientX - pan.startX) / cssWidth;
      const dy = (e.clientY - pan.startY) / cssHeight;
      v.center[0] = pan.startCenterX - dx * aspect * v.zoom;
      v.center[1] = pan.startCenterY + dy * v.zoom;
      v.dirty = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pan.active) return;
      // If no drag occurred, treat as a zoom click
      const dx = Math.abs(e.clientX - pan.startX);
      const dy = Math.abs(e.clientY - pan.startY);
      if (dx < 4 && dy < 4) {
        zoomAtPoint(e.clientX, e.clientY, true);
      }
      pan.active = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      zoomAtPoint(e.clientX, e.clientY, false);
    };

    const onClick = (e: MouseEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        zoomAtPoint(e.clientX, e.clientY, false);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomIn = e.deltaY < 0;
      zoomAtPoint(e.clientX, e.clientY, zoomIn);
    };

    function zoomAtPoint(clientX: number, clientY: number, zoomIn: boolean) {
      const v = viewRef.current;
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      const aspect = cssWidth / cssHeight;

      // Map click to complex plane
      const uvX = clientX / cssWidth;
      const uvY = 1.0 - clientY / cssHeight;
      const cx = v.center[0] + (uvX - 0.5) * aspect * v.zoom;
      const cy = v.center[1] + (uvY - 0.5) * v.zoom;

      if (zoomIn) {
        v.zoom = Math.max(v.zoom / ZOOM_FACTOR, MIN_ZOOM);
      } else {
        v.zoom = Math.min(v.zoom * ZOOM_FACTOR, 8.0);
      }

      // Re-center so the clicked point stays under cursor
      v.center[0] = cx - (uvX - 0.5) * aspect * v.zoom;
      v.center[1] = cy - (uvY - 0.5) * v.zoom;
      v.dirty = true;
      syncDisplay();
    }

    // Bind the syncDisplay function for external calls
    const syncDisplayRef = syncDisplay;

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width * window.devicePixelRatio);
      canvas.height = Math.round(height * window.devicePixelRatio);
      viewRef.current.dirty = true;
    });
    observer.observe(canvas);

    // ── Theme observer ──
    const themeObserver = new MutationObserver(() => {
      const newTheme = document.documentElement.classList.contains("dark") ? 0 : 1;
      if (newTheme !== currentTheme) {
        currentTheme = newTheme;
        viewRef.current.dirty = true;
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // ── Reduced motion: skip zoom animations (we don't animate, so just note it) ──
    const _reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Render loop: only re-render when dirty ──
    let raf = 0;

    function loop() {
      raf = requestAnimationFrame(loop);
      if (viewRef.current.dirty) {
        viewRef.current.dirty = false;
        render();
        syncDisplayRef();
      }
    }

    // Initial render
    viewRef.current.dirty = true;
    raf = requestAnimationFrame(loop);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("wheel", onWheel);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [syncDisplay]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full bg-background"
        style={{ zIndex: 0, touchAction: "none", cursor: "crosshair" }}
        aria-hidden="true"
      />
      {/* Controls bar */}
      <div className="pointer-events-auto fixed bottom-16 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded bg-background/70 px-3 py-1.5 backdrop-blur-sm md:bottom-14">
        <button
          onClick={handleReset}
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-foreground/80"
        >
          reset
        </button>
        <span className="text-foreground/20">|</span>
        <span className="font-mono text-[10px] tabular-nums tracking-wide text-foreground/40">
          {formatZoom(displayZoom)}
        </span>
        <span className="text-foreground/20">|</span>
        <span className="font-mono text-[10px] tabular-nums tracking-wide text-foreground/40">
          {displayIter} iter
        </span>
        <span className="hidden text-foreground/20 sm:inline">|</span>
        <span className="hidden font-mono text-[10px] tabular-nums tracking-wide text-foreground/40 sm:inline">
          {formatCoord(displayCenter[0])}, {formatCoord(displayCenter[1])}i
        </span>
      </div>
    </>
  );
}

/* ── Max iterations scales with zoom depth ── */

function computeMaxIter(zoom: number): number {
  const depth = Math.log2(3.0 / zoom);
  return Math.min(Math.max(100 + depth * 60, 100), 2000);
}
