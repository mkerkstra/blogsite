"use client";

import { useEffect, useRef } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { PALETTE } from "@/features/lab/lib/palette";
import { compileShader, linkProgram, FULLSCREEN_VERT_UV as VERT } from "@/features/lab/lib/webgl";

/* ────────────────────────────────────────────
   GLSL — Gray-Scott simulation step
   Reads from ping texture, writes to pong FBO.
   ──────────────────────────────────────────── */

const SIM_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uState;
uniform vec2 uTexel;       // 1/simWidth, 1/simHeight
uniform float uFeed;
uniform float uKill;
uniform vec2 uMouse;       // UV coords
uniform float uMouseDown;  // 1.0 when pressed
uniform float uBrush;      // seed radius (aspect-corrected)

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 st = texture(uState, vUv).rg;
  float u = st.r, v = st.g;

  // ── 9-point weighted Laplacian ──
  float lu = -u;
  float lv = -v;

  lu += 0.2 * (
    texture(uState, vUv + vec2( uTexel.x, 0.0)).r +
    texture(uState, vUv + vec2(-uTexel.x, 0.0)).r +
    texture(uState, vUv + vec2(0.0,  uTexel.y)).r +
    texture(uState, vUv + vec2(0.0, -uTexel.y)).r
  );
  lu += 0.05 * (
    texture(uState, vUv + uTexel).r +
    texture(uState, vUv + vec2(-uTexel.x, uTexel.y)).r +
    texture(uState, vUv + vec2(uTexel.x, -uTexel.y)).r +
    texture(uState, vUv - uTexel).r
  );

  lv += 0.2 * (
    texture(uState, vUv + vec2( uTexel.x, 0.0)).g +
    texture(uState, vUv + vec2(-uTexel.x, 0.0)).g +
    texture(uState, vUv + vec2(0.0,  uTexel.y)).g +
    texture(uState, vUv + vec2(0.0, -uTexel.y)).g
  );
  lv += 0.05 * (
    texture(uState, vUv + uTexel).g +
    texture(uState, vUv + vec2(-uTexel.x, uTexel.y)).g +
    texture(uState, vUv + vec2(uTexel.x, -uTexel.y)).g +
    texture(uState, vUv - uTexel).g
  );

  // ── Mouse interaction ──
  float aspect = uTexel.y / uTexel.x;
  vec2 md = (vUv - uMouse) * vec2(aspect, 1.0);
  float dist = length(md);

  // Hover: warm feed/kill near cursor
  float hover = smoothstep(0.12, 0.0, dist);
  float feed = uFeed + hover * 0.002;
  float kill = uKill - hover * 0.001;

  // Click: seed V
  if (uMouseDown > 0.5 && dist < uBrush) {
    v = 1.0;
  }

  // ── Gray-Scott equations (dt=1) ──
  float uvv = u * v * v;
  u += 0.2097 * lu - uvv + feed * (1.0 - u);
  v += 0.105  * lv + uvv - (feed + kill) * v;

  fragColor = vec4(clamp(u, 0.0, 1.0), clamp(v, 0.0, 1.0), 0.0, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — render pass
   Reads sim texture, maps V concentration to
   the site's 3-color palette.
   ──────────────────────────────────────────── */

const RENDER_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uState;
uniform vec3 uBg;
uniform vec3 uFg;
uniform vec3 uAccent;
uniform vec2 uMouse;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 size = vec2(textureSize(uState, 0));
  vec2 tx = 1.0 / size;

  // Bilinear V for smooth upscale
  vec2 uv = vUv * size - 0.5;
  vec2 f = fract(uv);
  vec2 base = (floor(uv) + 0.5) / size;
  float v = mix(
    mix(texture(uState, base).g,            texture(uState, base + vec2(tx.x, 0.0)).g, f.x),
    mix(texture(uState, base + vec2(0.0, tx.y)).g, texture(uState, base + tx).g,              f.x),
    f.y
  );

  // Two-tone base: bg channels, fg worm bodies
  vec3 c = mix(uBg, uFg, smoothstep(0.02, 0.10, v));

  // Accent spotlight — lime reveals at cursor proximity
  float aspect = size.x / size.y;
  vec2 md = (vUv - uMouse) * vec2(aspect, 1.0);
  float spot = smoothstep(0.22, 0.0, length(md));

  // Border from raw NEAREST texels (not interpolated)
  float vC = texture(uState, vUv).g;
  float minN = min(
    min(texture(uState, vUv + vec2(-tx.x, 0.0)).g,
        texture(uState, vUv + vec2( tx.x, 0.0)).g),
    min(texture(uState, vUv + vec2(0.0, -tx.y)).g,
        texture(uState, vUv + vec2(0.0,  tx.y)).g)
  );
  float border = step(0.05, vC) * (1.0 - step(0.05, minN));

  c = mix(c, uAccent, border * spot * 0.9);

  fragColor = vec4(c, 1.0);
}`;

function createFBO(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, w, h, 0, gl.RG, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  return { tex, fbo };
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function ReactionDiffusion() {
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

    // Rebind so TS narrows through closures
    const canvas = cvs;
    const gl = ctx;

    if (!gl.getExtension("EXT_color_buffer_float")) {
      console.warn("EXT_color_buffer_float unavailable — no float FBOs");
      return;
    }

    // ── Canvas & sim dimensions ──
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const sw = Math.ceil(canvas.width / 2);
    const sh = Math.ceil(canvas.height / 2);

    // ── Compile shaders ──
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const simFs = compileShader(gl, gl.FRAGMENT_SHADER, SIM_FRAG);
    const renderFs = compileShader(gl, gl.FRAGMENT_SHADER, RENDER_FRAG);
    if (!vs || !simFs || !renderFs) return;

    const simProg = linkProgram(gl, vs, simFs);
    const renderProg = linkProgram(gl, vs, renderFs);
    if (!simProg || !renderProg) return;

    // ── Uniform locations ──
    const sim = {
      state: gl.getUniformLocation(simProg, "uState"),
      texel: gl.getUniformLocation(simProg, "uTexel"),
      feed: gl.getUniformLocation(simProg, "uFeed"),
      kill: gl.getUniformLocation(simProg, "uKill"),
      mouse: gl.getUniformLocation(simProg, "uMouse"),
      mouseDown: gl.getUniformLocation(simProg, "uMouseDown"),
      brush: gl.getUniformLocation(simProg, "uBrush"),
    };
    const ren = {
      state: gl.getUniformLocation(renderProg, "uState"),
      bg: gl.getUniformLocation(renderProg, "uBg"),
      fg: gl.getUniformLocation(renderProg, "uFg"),
      accent: gl.getUniformLocation(renderProg, "uAccent"),
      mouse: gl.getUniformLocation(renderProg, "uMouse"),
    };

    // ── Ping-pong FBOs ──
    const fbo0 = createFBO(gl, sw, sh);
    const fbo1 = createFBO(gl, sw, sh);
    if (!fbo0 || !fbo1) return;
    const fbos = [fbo0, fbo1];
    let cur = 0;

    // ── Seed initial state ──
    const init = new Float32Array(sw * sh * 2);
    for (let i = 0; i < sw * sh; i++) init[i * 2] = 1.0; // U=1, V=0

    const SEEDS = 12;
    for (let s = 0; s < SEEDS; s++) {
      const cx = Math.random() * sw;
      const cy = Math.random() * sh;
      const r = 3 + Math.random() * 5;
      const r2 = r * r;
      for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(sh, Math.ceil(cy + r)); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(sw, Math.ceil(cx + r)); x++) {
          if ((x - cx) ** 2 + (y - cy) ** 2 < r2) {
            init[(y * sw + x) * 2 + 1] = 1.0;
          }
        }
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, fbos[0].tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, sw, sh, gl.RG, gl.FLOAT, init);

    // ── Empty VAO (WebGL2 requires one bound) ──
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // ── Mouse state ──
    const mouse = { x: 0.5, y: 0.5, down: false };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };
    const onDown = (e: PointerEvent) => {
      mouse.down = true;
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };
    const onUp = () => {
      mouse.down = false;
    };
    window.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    });
    observer.observe(canvas);

    // ── Reduced motion ──
    const reduced = prefersReducedMotion();
    const stepsPerFrame = reduced ? 2 : 16;

    // ── Frame loop ──
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const theme = getTheme();
      const colors = PALETTE[theme];

      // — Simulation steps —
      gl.useProgram(simProg);
      gl.viewport(0, 0, sw, sh);
      gl.uniform1i(sim.state, 0);
      gl.uniform2f(sim.texel, 1 / sw, 1 / sh);
      gl.uniform1f(sim.feed, 0.042);
      gl.uniform1f(sim.kill, 0.063);
      gl.uniform2f(sim.mouse, mouse.x, mouse.y);
      gl.uniform1f(sim.mouseDown, mouse.down ? 1 : 0);
      gl.uniform1f(sim.brush, 0.015);

      for (let i = 0; i < stepsPerFrame; i++) {
        const dst = 1 - cur;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[dst].fbo);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos[cur].tex);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        cur = dst;
      }

      // — Render pass —
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(renderProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbos[cur].tex);
      gl.uniform1i(ren.state, 0);
      gl.uniform3fv(ren.bg, colors.bg);
      gl.uniform3fv(ren.fg, colors.fg);
      gl.uniform3fv(ren.accent, colors.accent);
      gl.uniform2f(ren.mouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    raf = requestAnimationFrame(frame);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      gl.deleteVertexArray(vao);
      for (const { tex, fbo } of fbos) {
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
      }
      gl.deleteProgram(simProg);
      gl.deleteProgram(renderProg);
      gl.deleteShader(vs);
      gl.deleteShader(simFs);
      gl.deleteShader(renderFs);
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
