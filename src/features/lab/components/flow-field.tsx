"use client";

import { useEffect, useRef } from "react";

/* ── Fullscreen triangle for fade pass ── */

const FADE_VERT = `#version 300 es
void main() {
  vec2 uv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`;

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

/* ── Noise (CPU) ── */

function hash(n: number) {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}

// Simple 3D value noise
function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const fx = x - ix,
    fy = y - iy,
    fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);

  const h = (a: number, b: number, c: number) => hash(a * 127.1 + b * 311.7 + c * 74.7 + 1013.0);

  const n000 = h(ix, iy, iz);
  const n100 = h(ix + 1, iy, iz);
  const n010 = h(ix, iy + 1, iz);
  const n110 = h(ix + 1, iy + 1, iz);
  const n001 = h(ix, iy, iz + 1);
  const n101 = h(ix + 1, iy, iz + 1);
  const n011 = h(ix, iy + 1, iz + 1);
  const n111 = h(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * sx;
  const nx10 = n010 + (n110 - n010) * sx;
  const nx01 = n001 + (n101 - n001) * sx;
  const nx11 = n011 + (n111 - n011) * sx;
  const nxy0 = nx00 + (nx10 - nx00) * sy;
  const nxy1 = nx01 + (nx11 - nx01) * sy;
  return nxy0 + (nxy1 - nxy0) * sz;
}

function curl2d(x: number, y: number, z: number): [number, number] {
  const eps = 0.15;
  const dx = noise3(x, y + eps, z) - noise3(x, y - eps, z);
  const dy = noise3(x + eps, y, z) - noise3(x - eps, y, z);
  return [dx / (2 * eps), -dy / (2 * eps)];
}

/* ── Palettes ── */

const PALETTE = {
  light: {
    bg: [0.955, 0.945, 0.92] as readonly number[],
    color: [0.08, 0.08, 0.08] as readonly number[],
  },
  dark: {
    bg: [0.012, 0.012, 0.012] as readonly number[],
    color: [0.8, 0.88, 0.78] as readonly number[],
  },
};

/* ── Helpers ── */

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function link(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("Link:", gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

/* ── Component ── */

const N = 100000;

export function FlowField() {
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

    // ── Particle state (CPU) — x, y, life per particle ──
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const life = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      px[i] = Math.random() * 2 - 1;
      py[i] = Math.random() * 2 - 1;
      life[i] = Math.random() * 5;
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
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);

    // ── Resize ──
    const observer = new ResizeObserver(([entry]) => {
      canvas.width = Math.round(entry.contentRect.width);
      canvas.height = Math.round(entry.contentRect.height);
      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const bg = PALETTE[theme].bg;
      gl.clearColor(bg[0], bg[1], bg[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    observer.observe(canvas);

    gl.clearColor(0.012, 0.012, 0.012, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let raf = 0;
    let lastTime = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now / 1000;

      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const colors = PALETTE[theme];

      const aspect = canvas.width / canvas.height;
      const mx = mouse.x * 2 - 1;
      const my = mouse.y * 2 - 1;
      const speed = reduced ? 0.15 : 1.0;

      // ── Update particles (CPU) ──
      const noiseZ = t * 0.08;
      for (let i = 0; i < N; i++) {
        life[i] -= dt;
        if (life[i] <= 0) {
          px[i] = Math.random() * 2 - 1;
          py[i] = Math.random() * 2 - 1;
          life[i] = 2 + Math.random() * 5;
        }

        // Curl noise velocity
        const [cx, cy] = curl2d(px[i] * 1.2, py[i] * 1.2, noiseZ);
        let vx = cx * 1.8 * speed;
        let vy = cy * 1.8 * speed;

        // Mouse attraction
        const dx = (mx - px[i]) * aspect;
        const dy = my - py[i];
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < 0.6) {
          const force = (1 - md / 0.6) * 1.2 * speed;
          vx += (dx / (md + 0.001)) * force;
          vy += (dy / (md + 0.001)) * force;
        }

        px[i] += vx * dt;
        py[i] += vy * dt;

        // Wrap
        px[i] = ((((px[i] + 1) % 2) + 2) % 2) - 1;
        py[i] = ((((py[i] + 1) % 2) + 2) % 2) - 1;

        // Pack for GPU
        const fadeIn = Math.min(1, (7 - life[i]) / 0.5);
        const fadeOut = Math.min(1, life[i] / 0.8);
        gpuData[i * 3] = px[i];
        gpuData[i * 3 + 1] = py[i];
        gpuData[i * 3 + 2] = fadeIn * fadeOut * 0.7;
      }

      // Upload
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, gpuData);

      // ── Fade pass ──
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(fadeProg);
      gl.uniform4f(fadeLoc.color, colors.bg[0], colors.bg[1], colors.bg[2], 0.008);
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
      style={{ zIndex: 0, cursor: "crosshair" }}
      aria-hidden="true"
    />
  );
}
