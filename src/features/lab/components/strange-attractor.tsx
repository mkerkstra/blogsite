"use client";

import { useEffect, useRef } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { TRAIL_PALETTE as PALETTE } from "@/features/lab/lib/palette";
import {
  compileShader as compile,
  linkProgram as link,
  FULLSCREEN_VERT as FADE_VERT,
} from "@/features/lab/lib/webgl";

/* ────────────────────────────────────────────
   Thomas' cyclically symmetric attractor — WebGL2

   René Thomas (1999), "Deterministic chaos seen in terms
   of feedback circuits: Analysis, synthesis, 'labyrinth chaos'"
   doi:10.1142/S0218127499001383
   b = 0.208186
   ──────────────────────────────────────────── */

const FADE_FRAG = `#version 300 es
precision highp float;
uniform vec4 uFadeColor;
out vec4 fragColor;
void main() { fragColor = uFadeColor; }`;

/* ── Particle render ── */

const PARTICLE_VERT = `#version 300 es
precision highp float;
in vec2 aPos;
in float aAlpha;
out float vAlpha;
void main() {
  vAlpha = aAlpha;
  gl_Position = vec4(aPos, 0.0, 1.0);
  gl_PointSize = 1.5;
}`;

const PARTICLE_FRAG = `#version 300 es
precision highp float;
uniform vec3 uColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  fragColor = vec4(uColor, vAlpha);
}`;

/* ── Thomas attractor ODE ── */

const B = 0.208186;

function deriv(x: number, y: number, z: number): [number, number, number] {
  return [Math.sin(y) - B * x, Math.sin(z) - B * y, Math.sin(x) - B * z];
}

/* ── Component ── */

const N = 150000;
const MAX_LIFE = 8;
const DT = 0.035;

export function StrangeAttractor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("webgl2", { alpha: false, antialias: false, depth: false });
    if (!ctx) return;
    const canvas = cvs;
    const gl = ctx;

    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);

    // ── Shaders ──
    const fadeVs = compile(gl, gl.VERTEX_SHADER, FADE_VERT);
    const fadeFs = compile(gl, gl.FRAGMENT_SHADER, FADE_FRAG);
    const partVs = compile(gl, gl.VERTEX_SHADER, PARTICLE_VERT);
    const partFs = compile(gl, gl.FRAGMENT_SHADER, PARTICLE_FRAG);
    if (!fadeVs || !fadeFs || !partVs || !partFs) return;

    const fadeProg = link(gl, fadeVs, fadeFs);
    const partProg = link(gl, partVs, partFs);
    if (!fadeProg || !partProg) return;

    const fadeLoc = { color: gl.getUniformLocation(fadeProg, "uFadeColor") };
    const partLoc = { color: gl.getUniformLocation(partProg, "uColor") };

    // ── Particle state (CPU) — x, y, z, life per particle ──
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const pz = new Float32Array(N);
    const life = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      px[i] = (Math.random() - 0.5) * 4;
      py[i] = (Math.random() - 0.5) * 4;
      pz[i] = (Math.random() - 0.5) * 4;
      life[i] = Math.random() * MAX_LIFE;
    }

    // GPU buffer — interleaved [x, y, alpha] for rendering
    const gpuData = new Float32Array(N * 3);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, gpuData.byteLength, gl.DYNAMIC_DRAW);

    // Particle VAO
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const posLoc = gl.getAttribLocation(partProg, "aPos");
    const alphaLoc = gl.getAttribLocation(partProg, "aAlpha");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(alphaLoc);
    gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 12, 8);

    // Fade VAO (empty)
    const fadeVao = gl.createVertexArray();

    // ── Mouse ──
    const mouse = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);

    // ── Resize ──
    const observer = new ResizeObserver(([entry]) => {
      canvas.width = Math.round(entry.contentRect.width);
      canvas.height = Math.round(entry.contentRect.height);
      const theme = getTheme();
      const bg = PALETTE[theme].bg;
      gl.clearColor(bg[0], bg[1], bg[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    observer.observe(canvas);

    gl.clearColor(0.012, 0.012, 0.012, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let raf = 0;
    let lastTime = performance.now();
    const reduced = prefersReducedMotion();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const frameDt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now / 1000;

      const theme = getTheme();
      const colors = PALETTE[theme];

      const substeps = reduced ? 1 : 3;
      const orbitSpeed = reduced ? 0.02 : 0.08;

      // ── Camera: auto-orbit + mouse influence ──
      const theta = t * orbitSpeed + (mouse.x - 0.5) * Math.PI * 2;
      const phi = 0.3 + (mouse.y - 0.5) * 0.6;
      const cosT = Math.cos(theta),
        sinT = Math.sin(theta);
      const cosP = Math.cos(phi),
        sinP = Math.sin(phi);
      const scale = 0.2;
      const aspect = canvas.height / canvas.width;

      // ── Update particles (CPU) ──
      for (let i = 0; i < N; i++) {
        life[i] -= frameDt;
        if (life[i] <= 0) {
          px[i] = (Math.random() - 0.5) * 4;
          py[i] = (Math.random() - 0.5) * 4;
          pz[i] = (Math.random() - 0.5) * 4;
          life[i] = MAX_LIFE;
        }

        // RK4 integration (multiple substeps)
        let x = px[i],
          y = py[i],
          z = pz[i];
        for (let s = 0; s < substeps; s++) {
          const [k1x, k1y, k1z] = deriv(x, y, z);
          const [k2x, k2y, k2z] = deriv(x + (k1x * DT) / 2, y + (k1y * DT) / 2, z + (k1z * DT) / 2);
          const [k3x, k3y, k3z] = deriv(x + (k2x * DT) / 2, y + (k2y * DT) / 2, z + (k2z * DT) / 2);
          const [k4x, k4y, k4z] = deriv(x + k3x * DT, y + k3y * DT, z + k3z * DT);
          x += ((k1x + 2 * k2x + 2 * k3x + k4x) * DT) / 6;
          y += ((k1y + 2 * k2y + 2 * k3y + k4y) * DT) / 6;
          z += ((k1z + 2 * k2z + 2 * k3z + k4z) * DT) / 6;
        }
        px[i] = x;
        py[i] = y;
        pz[i] = z;

        // 3D → 2D projection (rotate around Y by theta, tilt by phi)
        const rx = x * cosT + z * sinT;
        const ry = y * cosP - (-x * sinT + z * cosT) * sinP;
        const screenX = rx * scale * aspect;
        const screenY = ry * scale;

        // Fade in/out based on life
        const age = MAX_LIFE - life[i];
        const fadeIn = Math.min(1, age / 0.5);
        const fadeOut = Math.min(1, life[i] / 1.0);
        const alpha = fadeIn * fadeOut * 0.7;

        gpuData[i * 3] = screenX;
        gpuData[i * 3 + 1] = screenY;
        gpuData[i * 3 + 2] = alpha;
      }

      // Upload
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpuData);

      // ── Fade pass ──
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(fadeProg);
      gl.uniform4f(fadeLoc.color, colors.bg[0], colors.bg[1], colors.bg[2], 0.012);
      gl.bindVertexArray(fadeVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // ── Particle pass (additive) ──
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(partProg);
      gl.uniform3fv(partLoc.color, colors.color);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, N);
      gl.disable(gl.BLEND);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteVertexArray(fadeVao);
      gl.deleteProgram(fadeProg);
      gl.deleteProgram(partProg);
      gl.deleteShader(fadeVs);
      gl.deleteShader(fadeFs);
      gl.deleteShader(partVs);
      gl.deleteShader(partFs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      style={{ zIndex: 0, cursor: "grab" }}
      aria-hidden="true"
    />
  );
}
