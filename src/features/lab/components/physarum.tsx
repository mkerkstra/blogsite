"use client";

import { useEffect, useRef } from "react";

/* ────────────────────────────────────────────
   GLSL — fullscreen-triangle vertex shader
   shared by sim, diffuse, and render passes
   ──────────────────────────────────────────── */

const FULLSCREEN_VERT = `#version 300 es
out vec2 vUv;
void main() {
  vUv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}`;

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
const float SENSOR_DIST  = 9.0;
const float STEP_SIZE    = 1.0;
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

  // Mouse attraction — gentle bias toward cursor
  vec2 toMouse = uMouse - vec2(x, y);
  float mouseDist = length(toMouse);
  float mouseInfluence = smoothstep(0.1, 0.0, mouseDist) * 0.15;
  if (mouseInfluence > 0.0) {
    float mouseAngle = atan(toMouse.y, toMouse.x);
    float diff = mouseAngle - angle;
    diff = mod(diff + 3.14159265, PI2) - 3.14159265;
    angle += diff * mouseInfluence;
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
  gl_PointSize = 1.0;
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

void main() {
  float sum = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      sum += texture(uTrail, vUv + vec2(float(dx), float(dy)) * uTexel).r;
    }
  }
  float blurred = sum / 9.0;
  fragColor = vec4(min(blurred * DECAY, MAX_PHEROMONE), 0.0, 0.0, 1.0);
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

  // Tone-map with wide dynamic range
  float t = 1.0 - exp(-v * 3.0);

  // Base: bg -> fg
  vec3 c = mix(uBg, uFg, t);

  // Accent spotlight near cursor
  float aspect = size.x / size.y;
  vec2 md = (vUv - uMouse) * vec2(aspect, 1.0);
  float spot = smoothstep(0.22, 0.0, length(md));
  c = mix(c, uAccent, t * spot * 0.4);

  fragColor = vec4(c, 1.0);
}`;

/* ────────────────────────────────────────────
   Theme palettes (sRGB)
   ──────────────────────────────────────────── */

const PALETTE = {
  light: {
    bg: [0.955, 0.945, 0.92],
    fg: [0.05, 0.05, 0.05],
    accent: [0.15, 0.55, 0.05],
  },
  dark: {
    bg: [0.03, 0.03, 0.03],
    fg: [0.88, 0.9, 0.87],
    accent: [0.2, 1.0, 0.35],
  },
} as const;

/* ────────────────────────────────────────────
   WebGL helpers
   ──────────────────────────────────────────── */

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

const AGENT_TEX_SIZE = 384; // 384*384 = 147456 agents

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
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    const tw = Math.ceil(canvas.width / 2);
    const th = Math.ceil(canvas.height / 2);

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
    const agentData = new Float32Array(AGENT_TEX_SIZE * AGENT_TEX_SIZE * 4);
    for (let i = 0; i < AGENT_TEX_SIZE * AGENT_TEX_SIZE; i++) {
      agentData[i * 4 + 0] = Math.random(); // x
      agentData[i * 4 + 1] = Math.random(); // y
      agentData[i * 4 + 2] = Math.random() * Math.PI * 2; // angle
      agentData[i * 4 + 3] = 1.0;
    }

    const agentTex0 = createFloatTex(
      gl,
      AGENT_TEX_SIZE,
      AGENT_TEX_SIZE,
      agentData,
      gl.CLAMP_TO_EDGE,
      gl.NEAREST,
    );
    const agentTex1 = createFloatTex(
      gl,
      AGENT_TEX_SIZE,
      AGENT_TEX_SIZE,
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
    const mouse = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);

    // ── Resize observer ──
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
    });
    observer.observe(canvas);

    // ── Reduced motion ──
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepsPerFrame = reduced ? 1 : 3;

    // ── Frame loop ──
    let raf = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const colors = PALETTE[theme];

      for (let step = 0; step < stepsPerFrame; step++) {
        // ── Pass 1: Agent update ──
        const agentDst = 1 - agentCur;
        gl.bindFramebuffer(gl.FRAMEBUFFER, agentFbos[agentDst].fbo);
        gl.viewport(0, 0, AGENT_TEX_SIZE, AGENT_TEX_SIZE);
        gl.disable(gl.BLEND);
        gl.useProgram(agentProg);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, agentFbos[agentCur].tex);
        gl.uniform1i(agentLoc.agents, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, trailFbos[trailCur].tex);
        gl.uniform1i(agentLoc.trail, 1);

        gl.uniform2f(agentLoc.agentTexSize, AGENT_TEX_SIZE, AGENT_TEX_SIZE);
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
        gl.uniform2f(depositLoc.agentTexSize, AGENT_TEX_SIZE, AGENT_TEX_SIZE);

        gl.bindVertexArray(depositVao);
        gl.drawArrays(gl.POINTS, 0, AGENT_TEX_SIZE * AGENT_TEX_SIZE);
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
