"use client";

import { useEffect, useRef } from "react";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { PALETTE } from "@/features/lab/lib/palette";
import {
  compileShader,
  linkProgram,
  FULLSCREEN_VERT_UV as FULLSCREEN_VERT,
} from "@/features/lab/lib/webgl";

/* ────────────────────────────────────────────
   Physarum polycephalum slime mold — WebGL2

   Agent model based on Jeff Jones (2010)
   "Characteristics of pattern formation and evolution in
   approximations of Physarum transport networks"
   https://doi.org/10.1162/artl.2010.16.2.16202

   Agents sense, rotate, deposit pheromone; a diffuse-decay
   pass blurs the trail map each frame.
   ──────────────────────────────────────────── */

/* ────────────────────────────────────────────
   GLSL — agent update pass
   Each texel = one agent (R=x, G=y, B=angle).
   Reads pheromone trail, steers, moves, writes
   new agent state.
   ──────────────────────────────────────────── */

const AGENT_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uAgents;
uniform sampler2D uTrail;
uniform vec2 uAgentTexSize;
uniform vec2 uTrailTexel;
uniform vec2 uMouse;

in vec2 vUv;
out vec4 fragColor;

const float SENSOR_ANGLE = 0.45;
// Sensor + step distances doubled vs the original Jones reference because the
// trail texture is now full canvas resolution (was canvas/2). Keeps agents
// covering the same screen-space distance per frame.
const float SENSOR_DIST  = 18.0;
const float STEP_SIZE    = 2.0;
const float TURN_SPEED   = 0.4;
const float PI2 = 6.28318530718;

// Hash for pseudo-random jitter
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  vec4 agent = texelFetch(uAgents, coord, 0);
  float x = agent.r;
  float y = agent.g;
  float angle = agent.b;

  // Sensor positions in trail UV space
  vec2 fwd   = vec2(cos(angle), sin(angle));
  vec2 left  = vec2(cos(angle + SENSOR_ANGLE), sin(angle + SENSOR_ANGLE));
  vec2 right = vec2(cos(angle - SENSOR_ANGLE), sin(angle - SENSOR_ANGLE));

  vec2 posFwd   = vec2(x, y) + fwd   * SENSOR_DIST * uTrailTexel;
  vec2 posLeft  = vec2(x, y) + left  * SENSOR_DIST * uTrailTexel;
  vec2 posRight = vec2(x, y) + right * SENSOR_DIST * uTrailTexel;

  float sFwd   = texture(uTrail, posFwd).r;
  float sLeft  = texture(uTrail, posLeft).r;
  float sRight = texture(uTrail, posRight).r;

  // Steer toward strongest pheromone
  float rnd = hash(vec2(coord) + agent.rg * 100.0);
  if (sFwd > sLeft && sFwd > sRight) {
    // forward is strongest — go straight with jitter
    angle += (rnd - 0.5) * 0.1;
  } else if (sFwd < sLeft && sFwd < sRight) {
    // forward is weakest — turn randomly left or right
    angle += (rnd > 0.5 ? 1.0 : -1.0) * TURN_SPEED;
  } else if (sLeft > sRight) {
    angle += TURN_SPEED;
  } else {
    angle -= TURN_SPEED;
  }

  // Mouse attraction — only when cursor is on-canvas (uMouse.x < 0 sentinel
   // disables it so agents don't pile at the default (0.5, 0.5) center).
  if (uMouse.x >= 0.0) {
    vec2 toMouse = uMouse - vec2(x, y);
    float mouseDist = length(toMouse);
    float mouseInfluence = smoothstep(0.22, 0.0, mouseDist) * 0.45;
    if (mouseInfluence > 0.0) {
      float mouseAngle = atan(toMouse.y, toMouse.x);
      float diff = mouseAngle - angle;
      diff = mod(diff + 3.14159265, PI2) - 3.14159265;
      angle += diff * mouseInfluence;
    }
  }

  // Move forward
  x += cos(angle) * STEP_SIZE * uTrailTexel.x;
  y += sin(angle) * STEP_SIZE * uTrailTexel.y;

  // Wrap to [0, 1]
  x = fract(x);
  y = fract(y);

  // Keep angle in [0, 2PI]
  angle = mod(angle, PI2);

  fragColor = vec4(x, y, angle, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — deposit pass vertex shader
   Uses gl_VertexID to read agent position from
   agent texture, emits a GL_POINT into trail FBO.
   ──────────────────────────────────────────── */

const DEPOSIT_VERT = `#version 300 es
precision highp float;

uniform sampler2D uAgents;
uniform vec2 uAgentTexSize;

void main() {
  int id = gl_VertexID;
  ivec2 coord = ivec2(id % int(uAgentTexSize.x), id / int(uAgentTexSize.x));
  vec4 agent = texelFetch(uAgents, coord, 0);
  gl_Position = vec4(agent.xy * 2.0 - 1.0, 0.0, 1.0);
  // 2px point compensates for the 4× larger trail texture so trail density
  // per CSS pixel matches the original canvas/2 trail.
  gl_PointSize = 2.0;
}`;

const DEPOSIT_FRAG = `#version 300 es
precision highp float;

const float DEPOSIT = 0.01;

out vec4 fragColor;

void main() {
  fragColor = vec4(DEPOSIT, 0.0, 0.0, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — diffuse + decay pass
   3x3 box blur with decay on trail texture.
   ──────────────────────────────────────────── */

const DIFFUSE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uTrail;
uniform vec2 uTexel;

in vec2 vUv;
out vec4 fragColor;

const float DECAY = 0.96;
const float MAX_PHEROMONE = 0.6;
// Weighted 3x3 kernel — center-heavy preserves sharper filaments than the
// uniform box blur. Sums to 1.0 (0.5 + 8 * 0.0625).
const float CENTER = 0.5;
const float NEIGHBOR = 0.0625;

void main() {
  float sum = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      float w = (dx == 0 && dy == 0) ? CENTER : NEIGHBOR;
      sum += texture(uTrail, vUv + vec2(float(dx), float(dy)) * uTexel).r * w;
    }
  }
  fragColor = vec4(min(sum * DECAY, MAX_PHEROMONE), 0.0, 0.0, 1.0);
}`;

/* ────────────────────────────────────────────
   GLSL — render pass
   Maps pheromone concentration to site palette.
   ──────────────────────────────────────────── */

const RENDER_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uTrail;
uniform vec3 uBg;
uniform vec3 uFg;
uniform vec3 uAccent;
uniform vec2 uMouse;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 size = vec2(textureSize(uTrail, 0));
  vec2 tx = 1.0 / size;

  // Bilinear sample for smooth upscale
  vec2 uv = vUv * size - 0.5;
  vec2 f = fract(uv);
  vec2 base = (floor(uv) + 0.5) / size;
  float v = mix(
    mix(texture(uTrail, base).r,                     texture(uTrail, base + vec2(tx.x, 0.0)).r, f.x),
    mix(texture(uTrail, base + vec2(0.0, tx.y)).r,   texture(uTrail, base + tx).r,              f.x),
    f.y
  );

  // Sharper tone-map — steep ramp then plateau gives crisper filament edges.
  float t = 1.0 - exp(-v * 8.0);

  // Base: bg -> fg
  vec3 c = mix(uBg, uFg, t);

  // Accent spotlight near cursor
  float aspect = size.x / size.y;
  vec2 md = (vUv - uMouse) * vec2(aspect, 1.0);
  float spot = smoothstep(0.22, 0.0, length(md));
  c = mix(c, uAccent, t * spot * 0.4);

  fragColor = vec4(c, 1.0);
}`;

function createFloatTex(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  data: Float32Array | null,
  wrap: number,
  filter: number,
) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return tex;
}

function createFBO(gl: WebGL2RenderingContext, tex: WebGLTexture) {
  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fbo;
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

// Agent count is computed at mount time as a function of the trail texture
// area. Target ~12.5% raw deposit coverage; combined with gl_PointSize=2 each
// agent paints ~4 trail texels per step, yielding ~50% effective coverage —
// the original Jones-feel from a 384² grid on a 1454×810 viewport.
const AGENT_DENSITY = 0.125;
// Hard caps so very large or very small viewports stay reasonable.
const MIN_AGENT_TEX = 256; // 65k agents
const MAX_AGENT_TEX = 1024; // ~1M agents

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function Physarum() {
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
    gl.getExtension("OES_texture_float_linear");

    // ── Canvas & sim dimensions ──
    // Backing buffer scaled by DPR; trail texture matches canvas 1:1 so the
    // network is rendered at native pixel density (no bilinear-upsample blur).
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const tw = canvas.width;
    const th = canvas.height;

    // Agent count proportional to viewport so the network density stays
    // consistent across screen sizes / DPR.
    const targetAgents = Math.floor(tw * th * AGENT_DENSITY);
    const agentTexSize = Math.max(
      MIN_AGENT_TEX,
      Math.min(MAX_AGENT_TEX, Math.ceil(Math.sqrt(targetAgents))),
    );
    const agentCount = agentTexSize * agentTexSize;

    // ── Compile shaders ──
    const fullscreenVs = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const agentFs = compileShader(gl, gl.FRAGMENT_SHADER, AGENT_FRAG);
    const depositVs = compileShader(gl, gl.VERTEX_SHADER, DEPOSIT_VERT);
    const depositFs = compileShader(gl, gl.FRAGMENT_SHADER, DEPOSIT_FRAG);
    const diffuseFs = compileShader(gl, gl.FRAGMENT_SHADER, DIFFUSE_FRAG);
    const renderFs = compileShader(gl, gl.FRAGMENT_SHADER, RENDER_FRAG);
    if (!fullscreenVs || !agentFs || !depositVs || !depositFs || !diffuseFs || !renderFs) return;

    const agentProg = linkProgram(gl, fullscreenVs, agentFs);
    const depositProg = linkProgram(gl, depositVs, depositFs);
    // Need a second fullscreen VS instance for diffuse (can't share across programs)
    const fullscreenVs2 = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const fullscreenVs3 = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERT);
    if (!fullscreenVs2 || !fullscreenVs3) return;
    const diffuseProg = linkProgram(gl, fullscreenVs2, diffuseFs);
    const renderProg = linkProgram(gl, fullscreenVs3, renderFs);
    if (!agentProg || !depositProg || !diffuseProg || !renderProg) return;

    // ── Uniform locations ──
    const agentLoc = {
      agents: gl.getUniformLocation(agentProg, "uAgents"),
      trail: gl.getUniformLocation(agentProg, "uTrail"),
      agentTexSize: gl.getUniformLocation(agentProg, "uAgentTexSize"),
      trailTexel: gl.getUniformLocation(agentProg, "uTrailTexel"),
      mouse: gl.getUniformLocation(agentProg, "uMouse"),
    };
    const depositLoc = {
      agents: gl.getUniformLocation(depositProg, "uAgents"),
      agentTexSize: gl.getUniformLocation(depositProg, "uAgentTexSize"),
    };
    const diffuseLoc = {
      trail: gl.getUniformLocation(diffuseProg, "uTrail"),
      texel: gl.getUniformLocation(diffuseProg, "uTexel"),
    };
    const renLoc = {
      trail: gl.getUniformLocation(renderProg, "uTrail"),
      bg: gl.getUniformLocation(renderProg, "uBg"),
      fg: gl.getUniformLocation(renderProg, "uFg"),
      accent: gl.getUniformLocation(renderProg, "uAccent"),
      mouse: gl.getUniformLocation(renderProg, "uMouse"),
    };

    // ── Agent textures (ping-pong) ──
    const seedAgents = () => {
      const data = new Float32Array(agentCount * 4);
      for (let i = 0; i < agentCount; i++) {
        data[i * 4 + 0] = Math.random();
        data[i * 4 + 1] = Math.random();
        data[i * 4 + 2] = Math.random() * Math.PI * 2;
        data[i * 4 + 3] = 1.0;
      }
      return data;
    };
    const agentData = seedAgents();

    const agentTex0 = createFloatTex(
      gl,
      agentTexSize,
      agentTexSize,
      agentData,
      gl.CLAMP_TO_EDGE,
      gl.NEAREST,
    );
    const agentTex1 = createFloatTex(
      gl,
      agentTexSize,
      agentTexSize,
      null,
      gl.CLAMP_TO_EDGE,
      gl.NEAREST,
    );
    if (!agentTex0 || !agentTex1) return;

    const agentFbo0 = createFBO(gl, agentTex0);
    const agentFbo1 = createFBO(gl, agentTex1);
    if (!agentFbo0 || !agentFbo1) return;

    const agentFbos = [
      { tex: agentTex0, fbo: agentFbo0 },
      { tex: agentTex1, fbo: agentFbo1 },
    ];

    // ── Trail textures (ping-pong) ──
    const trailTex0 = createFloatTex(gl, tw, th, null, gl.REPEAT, gl.LINEAR);
    const trailTex1 = createFloatTex(gl, tw, th, null, gl.REPEAT, gl.LINEAR);
    if (!trailTex0 || !trailTex1) return;

    const trailFbo0 = createFBO(gl, trailTex0);
    const trailFbo1 = createFBO(gl, trailTex1);
    if (!trailFbo0 || !trailFbo1) return;

    const trailFbos = [
      { tex: trailTex0, fbo: trailFbo0 },
      { tex: trailTex1, fbo: trailFbo1 },
    ];

    // Clear trail FBOs to zero
    for (const { fbo } of trailFbos) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    let agentCur = 0;
    let trailCur = 0;

    // ── VAOs ──
    const fullscreenVao = gl.createVertexArray();
    const depositVao = gl.createVertexArray();

    // ── Mouse state ──
    // mouse.{x,y} drives the attractor; -1 disables it via the shader gate.
    // Hover does nothing — only press-and-hold attracts. Shift-click resets.
    const mouse = { x: -1, y: -1 };
    const pointerPos = { x: 0.5, y: 0.5 };
    let attracting = false;
    const setMouseFromPointer = () => {
      if (attracting) {
        mouse.x = pointerPos.x;
        mouse.y = pointerPos.y;
      } else {
        mouse.x = -1;
        mouse.y = -1;
      }
    };
    const onMove = (e: PointerEvent) => {
      pointerPos.x = e.clientX / window.innerWidth;
      pointerPos.y = 1.0 - e.clientY / window.innerHeight;
      setMouseFromPointer();
    };
    const dispersePulse = () => {
      const fresh = seedAgents();
      gl.bindTexture(gl.TEXTURE_2D, agentFbos[agentCur].tex);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        agentTexSize,
        agentTexSize,
        gl.RGBA,
        gl.FLOAT,
        fresh,
      );
      for (const { fbo } of trailFbos) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.shiftKey) {
        dispersePulse();
        return;
      }
      attracting = true;
      pointerPos.x = e.clientX / window.innerWidth;
      pointerPos.y = 1.0 - e.clientY / window.innerHeight;
      setMouseFromPointer();
    };
    const onPointerUp = () => {
      attracting = false;
      setMouseFromPointer();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerdown", onPointerDown);

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    });
    observer.observe(canvas);

    // ── Reduced motion ──
    const reduced = prefersReducedMotion();
    const stepsPerFrame = reduced ? 1 : 3;

    // ── Frame loop ──
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const theme = getTheme();
      const colors = PALETTE[theme];

      for (let step = 0; step < stepsPerFrame; step++) {
        // ── Pass 1: Agent update ──
        const agentDst = 1 - agentCur;
        gl.bindFramebuffer(gl.FRAMEBUFFER, agentFbos[agentDst].fbo);
        gl.viewport(0, 0, agentTexSize, agentTexSize);
        gl.disable(gl.BLEND);
        gl.useProgram(agentProg);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, agentFbos[agentCur].tex);
        gl.uniform1i(agentLoc.agents, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, trailFbos[trailCur].tex);
        gl.uniform1i(agentLoc.trail, 1);

        gl.uniform2f(agentLoc.agentTexSize, agentTexSize, agentTexSize);
        gl.uniform2f(agentLoc.trailTexel, 1 / tw, 1 / th);
        gl.uniform2f(agentLoc.mouse, mouse.x, mouse.y);

        gl.bindVertexArray(fullscreenVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        agentCur = agentDst;

        // ── Pass 2: Deposit (agents write into trail via GL_POINTS) ──
        // Read from current trail into the OTHER trail FBO (additive)
        const trailDst = 1 - trailCur;

        // First, copy current trail to destination so deposits are additive on existing data
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, trailFbos[trailCur].fbo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, trailFbos[trailDst].fbo);
        gl.blitFramebuffer(0, 0, tw, th, 0, 0, tw, th, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        // Now draw deposits additively into destination
        gl.bindFramebuffer(gl.FRAMEBUFFER, trailFbos[trailDst].fbo);
        gl.viewport(0, 0, tw, th);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.useProgram(depositProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, agentFbos[agentCur].tex);
        gl.uniform1i(depositLoc.agents, 0);
        gl.uniform2f(depositLoc.agentTexSize, agentTexSize, agentTexSize);

        gl.bindVertexArray(depositVao);
        gl.drawArrays(gl.POINTS, 0, agentCount);
        gl.disable(gl.BLEND);

        trailCur = trailDst;

        // ── Pass 3: Diffuse + decay ──
        const diffDst = 1 - trailCur;
        gl.bindFramebuffer(gl.FRAMEBUFFER, trailFbos[diffDst].fbo);
        gl.viewport(0, 0, tw, th);
        gl.useProgram(diffuseProg);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, trailFbos[trailCur].tex);
        gl.uniform1i(diffuseLoc.trail, 0);
        gl.uniform2f(diffuseLoc.texel, 1 / tw, 1 / th);

        gl.bindVertexArray(fullscreenVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        trailCur = diffDst;
      }

      // ── Pass 4: Render to screen ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(renderProg);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trailFbos[trailCur].tex);
      gl.uniform1i(renLoc.trail, 0);
      gl.uniform3fv(renLoc.bg, colors.bg);
      gl.uniform3fv(renLoc.fg, colors.fg);
      gl.uniform3fv(renLoc.accent, colors.accent);
      gl.uniform2f(renLoc.mouse, mouse.x, mouse.y);

      gl.bindVertexArray(fullscreenVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    raf = requestAnimationFrame(frame);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      gl.deleteVertexArray(fullscreenVao);
      gl.deleteVertexArray(depositVao);
      for (const { tex, fbo } of agentFbos) {
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
      }
      for (const { tex, fbo } of trailFbos) {
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
      }
      gl.deleteProgram(agentProg);
      gl.deleteProgram(depositProg);
      gl.deleteProgram(diffuseProg);
      gl.deleteProgram(renderProg);
      gl.deleteShader(fullscreenVs);
      gl.deleteShader(fullscreenVs2);
      gl.deleteShader(fullscreenVs3);
      gl.deleteShader(agentFs);
      gl.deleteShader(depositVs);
      gl.deleteShader(depositFs);
      gl.deleteShader(diffuseFs);
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
