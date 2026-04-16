"use client";

import { useEffect, useRef } from "react";
import { getTheme } from "@/features/lab/lib/env";
import { PALETTE } from "@/features/lab/lib/palette";
import { compileShader, linkProgram, FULLSCREEN_VERT_UV as VERT } from "@/features/lab/lib/webgl";

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uBg;
uniform vec3 uFg;
uniform vec3 uAccent;

in vec2 vUv;
out vec4 fragColor;

// ── SDF primitives ──

float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Hash for per-cell variation
float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

// ── Scene — infinite grid of phase-shifted morphing shapes ──

const float CELL = 4.5;

float mapCell(vec3 p, float phase) {
  // Per-cell tumble at its own phase
  float t = uTime * 0.15 + phase * 2.0;
  p.xz *= rot2(t);
  p.yz *= rot2(t * 0.73);

  float t1 = sin(uTime * 0.35 + phase * 4.0) * 0.5 + 0.5;
  float t2 = cos(uTime * 0.25 + phase * 3.0) * 0.5 + 0.5;

  float sphere = sdSphere(p, 0.85);
  float box = sdRoundBox(p, vec3(0.62), 0.06);
  float torus = sdTorus(p, vec2(0.8, 0.22));
  float octa = sdOctahedron(p, 1.05);

  float ab = mix(sphere, box, t1);
  float cd = mix(torus, octa, t2);
  return smin(ab, cd, 0.35 + 0.15 * sin(uTime * 0.2 + phase));
}

float map(vec3 p) {
  // Domain repetition
  vec3 cellId = floor(p / CELL + 0.5);
  vec3 q = p - cellId * CELL;
  float phase = hash(cellId);
  return mapCell(q, phase);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0005, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    occ += (h - map(p + h * n)) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}


void main() {
  vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);

  // Camera — orbit between cells, never inside a shape
  float theta = (uMouse.x - 0.5) * 6.28318 + uTime * 0.05;
  float phi = mix(0.25, 1.0, uMouse.y);
  // Place camera at a cell boundary (offset by half cell) so it sits
  // in the gap between shapes, not inside one
  float camDist = CELL * 1.1;
  vec3 ro = vec3(
    cos(theta) * cos(phi) * camDist,
    sin(phi) * camDist + 0.5,
    sin(theta) * cos(phi) * camDist
  );
  vec3 ta = vec3(0.0);

  // Camera matrix
  vec3 cw = normalize(ta - ro);
  vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
  vec3 cv = cross(cu, cw);
  vec3 rd = normalize(cu * uv.x + cv * uv.y + cw * 1.8);

  // Near clip — camera can sit inside shapes, skip past them
  float t = 2.0;
  float d;
  for (int i = 0; i < 128; i++) {
    d = map(ro + rd * t);
    if (d < 0.001 || t > 30.0) break;
    t += d * 0.6; // conservative step — smin overestimates near blend zones
  }

  vec3 col = uBg;

  if (t < 30.0) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec3 lDir = normalize(vec3(0.5, 0.8, -0.6));

    float diff = max(dot(n, lDir), 0.0);
    float ao = calcAO(p, n);

    // Diffuse — AO provides depth, no cast shadows needed
    col = uFg * (0.1 + 0.9 * diff) * ao;

    // Rim light — accent color
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col += uAccent * rim * 0.3;

    // Specular
    vec3 h = normalize(lDir - rd);
    float spec = pow(max(dot(n, h), 0.0), 48.0);
    col += uAccent * spec * 0.2;

    // Distance fog
    col = mix(col, uBg, smoothstep(8.0, 28.0, t));
  }

  fragColor = vec4(col, 1.0);
}`;

/* ── Component ── */

export function RayMarch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const glCtx = cvs.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!glCtx) return;
    const canvas = cvs;
    const gl = glCtx;

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = linkProgram(gl, vs, fs);
    if (!prog) return;

    const loc = {
      time: gl.getUniformLocation(prog, "uTime"),
      resolution: gl.getUniformLocation(prog, "uResolution"),
      mouse: gl.getUniformLocation(prog, "uMouse"),
      bg: gl.getUniformLocation(prog, "uBg"),
      fg: gl.getUniformLocation(prog, "uFg"),
      accent: gl.getUniformLocation(prog, "uAccent"),
    };

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const mouse = { x: 0.5, y: 0.45 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
    });
    observer.observe(canvas);

    const t0 = performance.now();
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const theme = getTheme();
      const colors = PALETTE[theme];
      const elapsed = (performance.now() - t0) / 1000;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.uniform1f(loc.time, elapsed);
      gl.uniform2f(loc.resolution, canvas.width, canvas.height);
      gl.uniform2f(loc.mouse, mouse.x, mouse.y);
      gl.uniform3fv(loc.bg, colors.bg);
      gl.uniform3fv(loc.fg, colors.fg);
      gl.uniform3fv(loc.accent, colors.accent);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full bg-background"
      style={{ zIndex: 0, cursor: "grab" }}
      aria-hidden="true"
    />
  );
}
