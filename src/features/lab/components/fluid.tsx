"use client";

import { useEffect, useRef } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { PALETTE } from "@/features/lab/lib/palette";
import { compileShader, linkProgram, FULLSCREEN_VERT_UV as VERT } from "@/features/lab/lib/webgl";

/* ────────────────────────────────────────────
   Navier-Stokes fluid simulation — WebGL2

   Implements Jos Stam's "Stable Fluids" (1999)
   https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/ns.pdf

   Splat → advect → divergence → Jacobi pressure solve →
   gradient subtract → dye advect
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   GLSL — splat (Gaussian injection)
   Used for both velocity and dye fields.
   ──────────────────────────────────────────── */

const SPLAT_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 d = (vUv - uPoint) * vec2(uAspect, 1.0);
  float s = exp(-dot(d, d) / uRadius);
  vec4 base = texture(uTarget, vUv);
  fragColor = vec4(base.rgb + uColor * s, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — advection (semi-Lagrangian)
   Shared for velocity and dye advection.
   ──────────────────────────────────────────── */

const ADVECT_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 coord = vUv - uDt * vel * uTexel;
  fragColor = uDissipation * texture(uSource, coord);
}`;

/* ────────────────────────────────────────────
   GLSL — divergence
   ──────────────────────────────────────────── */

const DIVERGENCE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uVelocity;
uniform vec2 uTexel;

in vec2 vUv;
out vec4 fragColor;

void main() {
  float vR = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float vL = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float vT = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float vB = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float div = 0.5 * (vR - vL + vT - vB);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — pressure solve (Jacobi iteration)
   ──────────────────────────────────────────── */

const PRESSURE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;

in vec2 vUv;
out vec4 fragColor;

void main() {
  float pR = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float pL = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float pT = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float pB = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float div = texture(uDivergence, vUv).x;
  fragColor = vec4((pL + pR + pB + pT - div) * 0.25, 0.0, 0.0, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — gradient subtract
   Makes velocity divergence-free.
   ──────────────────────────────────────────── */

const GRADIENT_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;

in vec2 vUv;
out vec4 fragColor;

void main() {
  float pR = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float pL = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float pT = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float pB = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel -= 0.5 * vec2(pR - pL, pT - pB);
  fragColor = vec4(vel, 0.0, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — render (dye to screen)
   ──────────────────────────────────────────── */

const RENDER_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uDye;
uniform vec3 uBg;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec3 dye = texture(uDye, vUv).rgb;
  vec3 c = clamp(uBg + dye, 0.0, 1.0);
  fragColor = vec4(c, 1.0);
}`;

interface FBO {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
}

function createFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  filtering: number,
): FBO | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  return { tex, fbo };
}

function createDoubleFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  filtering: number,
) {
  const a = createFBO(gl, w, h, internalFormat, format, filtering);
  const b = createFBO(gl, w, h, internalFormat, format, filtering);
  if (!a || !b) return null;
  return {
    read: a,
    write: b,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
  };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function Fluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!ctx) return;

    const canvas = cvs;
    const gl = ctx;

    if (!gl.getExtension("EXT_color_buffer_float")) {
      console.warn("EXT_color_buffer_float unavailable");
      return;
    }
    gl.getExtension("OES_texture_float_linear");

    // ── Canvas & sim dimensions ──
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    let sw = Math.ceil(canvas.width / 2);
    let sh = Math.ceil(canvas.height / 2);

    // ── Compile shaders ──
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const splatFs = compileShader(gl, gl.FRAGMENT_SHADER, SPLAT_FRAG);
    const advectFs = compileShader(gl, gl.FRAGMENT_SHADER, ADVECT_FRAG);
    const divFs = compileShader(gl, gl.FRAGMENT_SHADER, DIVERGENCE_FRAG);
    const pressFs = compileShader(gl, gl.FRAGMENT_SHADER, PRESSURE_FRAG);
    const gradFs = compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_FRAG);
    const renderFs = compileShader(gl, gl.FRAGMENT_SHADER, RENDER_FRAG);
    if (!vs || !splatFs || !advectFs || !divFs || !pressFs || !gradFs || !renderFs) return;

    const splatProg = linkProgram(gl, vs, splatFs);
    const advectProg = linkProgram(gl, vs, advectFs);
    const divProg = linkProgram(gl, vs, divFs);
    const pressProg = linkProgram(gl, vs, pressFs);
    const gradProg = linkProgram(gl, vs, gradFs);
    const renderProg = linkProgram(gl, vs, renderFs);
    if (!splatProg || !advectProg || !divProg || !pressProg || !gradProg || !renderProg) return;

    const allShaders = [vs, splatFs, advectFs, divFs, pressFs, gradFs, renderFs];
    const allPrograms = [splatProg, advectProg, divProg, pressProg, gradProg, renderProg];

    // ── Uniform locations ──
    const splat = {
      target: gl.getUniformLocation(splatProg, "uTarget"),
      aspect: gl.getUniformLocation(splatProg, "uAspect"),
      point: gl.getUniformLocation(splatProg, "uPoint"),
      color: gl.getUniformLocation(splatProg, "uColor"),
      radius: gl.getUniformLocation(splatProg, "uRadius"),
    };
    const advect = {
      velocity: gl.getUniformLocation(advectProg, "uVelocity"),
      source: gl.getUniformLocation(advectProg, "uSource"),
      texel: gl.getUniformLocation(advectProg, "uTexel"),
      dt: gl.getUniformLocation(advectProg, "uDt"),
      dissipation: gl.getUniformLocation(advectProg, "uDissipation"),
    };
    const div = {
      velocity: gl.getUniformLocation(divProg, "uVelocity"),
      texel: gl.getUniformLocation(divProg, "uTexel"),
    };
    const press = {
      pressure: gl.getUniformLocation(pressProg, "uPressure"),
      divergence: gl.getUniformLocation(pressProg, "uDivergence"),
      texel: gl.getUniformLocation(pressProg, "uTexel"),
    };
    const grad = {
      pressure: gl.getUniformLocation(gradProg, "uPressure"),
      velocity: gl.getUniformLocation(gradProg, "uVelocity"),
      texel: gl.getUniformLocation(gradProg, "uTexel"),
    };
    const ren = {
      dye: gl.getUniformLocation(renderProg, "uDye"),
      bg: gl.getUniformLocation(renderProg, "uBg"),
    };

    // ── Framebuffers ──
    let velocity = createDoubleFBO(gl, sw, sh, gl.RG32F, gl.RG, gl.LINEAR);
    let pressure = createDoubleFBO(gl, sw, sh, gl.RG32F, gl.RG, gl.NEAREST);
    let divergence = createFBO(gl, sw, sh, gl.RG32F, gl.RG, gl.NEAREST);
    let dye = createDoubleFBO(gl, sw, sh, gl.RGBA32F, gl.RGBA, gl.LINEAR);

    if (!velocity || !pressure || !divergence || !dye) return;

    // ── Empty VAO ──
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // ── Mouse state ──
    const mouse = { x: 0, y: 0, px: 0, py: 0, dx: 0, dy: 0, moved: false };
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / canvas.clientWidth;
      const ny = 1.0 - e.clientY / canvas.clientHeight;
      mouse.dx = (nx - mouse.x) * 50;
      mouse.dy = (ny - mouse.y) * 50;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = nx;
      mouse.y = ny;
      mouse.moved = true;
    };
    window.addEventListener("pointermove", onMove);

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Recreate sim textures at new half resolution
      const nsw = Math.ceil(canvas.width / 2);
      const nsh = Math.ceil(canvas.height / 2);
      if (nsw !== sw || nsh !== sh) {
        sw = nsw;
        sh = nsh;
        // Clean up old FBOs
        const old: FBO[] = [];
        if (velocity) old.push(velocity.read, velocity.write);
        if (pressure) old.push(pressure.read, pressure.write);
        if (divergence) old.push(divergence);
        if (dye) old.push(dye.read, dye.write);
        for (const f of old) {
          gl.deleteTexture(f.tex);
          gl.deleteFramebuffer(f.fbo);
        }
        velocity = createDoubleFBO(gl, sw, sh, gl.RG32F, gl.RG, gl.LINEAR);
        pressure = createDoubleFBO(gl, sw, sh, gl.RG32F, gl.RG, gl.NEAREST);
        divergence = createFBO(gl, sw, sh, gl.RG32F, gl.RG, gl.NEAREST);
        dye = createDoubleFBO(gl, sw, sh, gl.RGBA32F, gl.RGBA, gl.LINEAR);
      }
    });
    observer.observe(canvas);

    // ── Reduced motion ──
    const reduced = prefersReducedMotion();
    const JACOBI_ITERATIONS = reduced ? 15 : 25;
    const SPLAT_FORCE = reduced ? 3000 : 6000;

    // ── Helper: bind FBO and draw fullscreen triangle ──
    function blit(target: FBO | null) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ── Splat helper ──
    function doSplat(x: number, y: number, dx: number, dy: number, time: number) {
      if (!velocity || !dye) return;
      const theme = getTheme();
      const colors = PALETTE[theme];
      const aspect = canvas.width / canvas.height;

      // Velocity splat
      gl.useProgram(splatProg);
      gl.viewport(0, 0, sw, sh);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(splat.target, 0);
      gl.uniform1f(splat.aspect, aspect);
      gl.uniform2f(splat.point, x, y);
      gl.uniform3f(splat.color, dx * SPLAT_FORCE, dy * SPLAT_FORCE, 0.0);
      gl.uniform1f(splat.radius, 0.0004);
      blit(velocity.write);
      velocity.swap();

      // Dye splat — color cycles between fg and accent, stored as signed offset from bg
      const t = Math.sin(time * 0.8) * 0.5 + 0.5;
      const r = colors.fg[0] * (1 - t) + colors.accent[0] * t;
      const g = colors.fg[1] * (1 - t) + colors.accent[1] * t;
      const b = colors.fg[2] * (1 - t) + colors.accent[2] * t;

      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(splat.target, 0);
      gl.uniform3f(
        splat.color,
        (r - colors.bg[0]) * 1.5,
        (g - colors.bg[1]) * 1.5,
        (b - colors.bg[2]) * 1.5,
      );
      gl.uniform1f(splat.radius, 0.001);
      blit(dye.write);
      dye.swap();
    }

    // ── Initial splats for visual interest ──
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.15;
      doSplat(
        0.5 + Math.cos(angle) * r,
        0.5 + Math.sin(angle) * r,
        Math.cos(angle) * 0.25,
        Math.sin(angle) * 0.25,
        i * 0.8,
      );
    }

    // ── Frame loop ──
    let raf = 0;
    let lastTime = performance.now();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!velocity || !pressure || !divergence || !dye) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now / 1000;

      const theme = getTheme();
      const colors = PALETTE[theme];

      // ── Splat from mouse ──
      if (mouse.moved) {
        mouse.moved = false;
        doSplat(mouse.x, mouse.y, mouse.dx, mouse.dy, time);
      }

      gl.viewport(0, 0, sw, sh);
      gl.bindVertexArray(vao);

      // ── 1. Advect velocity ──
      gl.useProgram(advectProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(advect.velocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(advect.source, 1);
      gl.uniform2f(advect.texel, 1 / sw, 1 / sh);
      gl.uniform1f(advect.dt, dt);
      gl.uniform1f(advect.dissipation, 0.99);
      blit(velocity.write);
      velocity.swap();

      // ── 2. Compute divergence ──
      gl.useProgram(divProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(div.velocity, 0);
      gl.uniform2f(div.texel, 1 / sw, 1 / sh);
      blit(divergence);

      // ── 3. Clear pressure ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.read.fbo);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // ── 4. Pressure solve (Jacobi) ──
      gl.useProgram(pressProg);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergence.tex);
      gl.uniform1i(press.divergence, 1);
      gl.uniform2f(press.texel, 1 / sw, 1 / sh);
      for (let i = 0; i < JACOBI_ITERATIONS; i++) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
        gl.uniform1i(press.pressure, 0);
        blit(pressure.write);
        pressure.swap();
      }

      // ── 5. Gradient subtract ──
      gl.useProgram(gradProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
      gl.uniform1i(grad.pressure, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(grad.velocity, 1);
      gl.uniform2f(grad.texel, 1 / sw, 1 / sh);
      blit(velocity.write);
      velocity.swap();

      // ── 6. Advect dye ──
      gl.useProgram(advectProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(advect.velocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(advect.source, 1);
      gl.uniform2f(advect.texel, 1 / sw, 1 / sh);
      gl.uniform1f(advect.dt, dt);
      gl.uniform1f(advect.dissipation, 0.998);
      blit(dye.write);
      dye.swap();

      // ── 7. Render ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(renderProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(ren.dye, 0);
      gl.uniform3fv(ren.bg, colors.bg);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    raf = requestAnimationFrame(frame);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.deleteVertexArray(vao);
      if (velocity) {
        gl.deleteTexture(velocity.read.tex);
        gl.deleteFramebuffer(velocity.read.fbo);
        gl.deleteTexture(velocity.write.tex);
        gl.deleteFramebuffer(velocity.write.fbo);
      }
      if (pressure) {
        gl.deleteTexture(pressure.read.tex);
        gl.deleteFramebuffer(pressure.read.fbo);
        gl.deleteTexture(pressure.write.tex);
        gl.deleteFramebuffer(pressure.write.fbo);
      }
      if (divergence) {
        gl.deleteTexture(divergence.tex);
        gl.deleteFramebuffer(divergence.fbo);
      }
      if (dye) {
        gl.deleteTexture(dye.read.tex);
        gl.deleteFramebuffer(dye.read.fbo);
        gl.deleteTexture(dye.write.tex);
        gl.deleteFramebuffer(dye.write.fbo);
      }
      for (const p of allPrograms) gl.deleteProgram(p);
      for (const s of allShaders) gl.deleteShader(s);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full bg-background"
      style={{ zIndex: 0, touchAction: "none", cursor: "crosshair" }}
      aria-hidden="true"
    />
  );
}
