import { compileShader, linkProgram } from "@/features/lab/lib/webgl";
import type { Vec } from "./scene";

export type Face = { points: Vec[]; fill: string; stroke: string; depth: number };
type Renderer = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  projection: WebGLUniformLocation | null;
};
const renderers = new WeakMap<CanvasRenderingContext2D, Renderer>();
function createRenderer(ctx: CanvasRenderingContext2D): Renderer | null {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;
  const vertex = compileShader(
    gl,
    gl.VERTEX_SHADER,
    `#version 300 es
  in vec3 position;
  in vec3 color;
  uniform vec2 projection;
  out vec3 tint;
  void main() {
    gl_Position = vec4(position.x * projection.x, position.y * projection.y + 0.02 * position.z, 1.0030045 * position.z - 0.6009014, position.z);
    tint = color;
  }`,
  );
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    `#version 300 es
  precision highp float;
  in vec3 tint;
  out vec4 outputColor;
  void main() { outputColor = vec4(tint, 1.0); }`,
  );
  if (!vertex || !fragment) return null;
  const program = linkProgram(gl, vertex, fragment);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  const buffer = gl.createBuffer();
  if (!program || !buffer) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  for (const [name, offset] of [
    ["position", 0],
    ["color", 12],
  ] as const) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 24, offset);
  }
  const renderer = {
    canvas,
    gl,
    program,
    buffer,
    projection: gl.getUniformLocation(program, "projection"),
  };
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => renderers.delete(ctx));
  renderers.set(ctx, renderer);
  return renderer;
}

/** Per-pixel depth testing handles intersecting faces and close first-person views. */
export function drawDepthFaces(
  ctx: CanvasRenderingContext2D,
  faces: Face[],
  width: number,
  height: number,
  focal: number,
) {
  const renderer = renderers.get(ctx) ?? createRenderer(ctx);
  if (!renderer || renderer.gl.isContextLost()) return false;
  const { gl, canvas } = renderer;
  const dpr = Math.min(2, ctx.getTransform().a);
  const w = Math.round(width * dpr),
    h = Math.round(height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.useProgram(renderer.program);
  gl.uniform2f(renderer.projection, (focal * 2) / width, (focal * 2) / height);
  const triangles: number[] = [],
    edges: number[] = [];
  const append = (array: number[], point: Vec, hex: string) => {
    const color = Number.parseInt(hex.slice(1), 16);
    array.push(
      ...point,
      ((color >> 16) & 255) / 255,
      ((color >> 8) & 255) / 255,
      (color & 255) / 255,
    );
  };
  for (const face of faces) {
    for (let i = 1; i < face.points.length - 1; i++)
      for (const point of [face.points[0], face.points[i], face.points[i + 1]])
        append(triangles, point, face.fill);
    for (let i = 0; i < face.points.length; i++) {
      append(edges, face.points[i], face.stroke);
      append(edges, face.points[(i + 1) % face.points.length], face.stroke);
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.buffer);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1, 1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 6);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edges), gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.LINES, 0, edges.length / 6);
  ctx.drawImage(canvas, 0, 0, width, height);
  return true;
}
export function releaseDepthRenderer(ctx: CanvasRenderingContext2D) {
  const renderer = renderers.get(ctx);
  if (!renderer) return;
  renderer.gl.deleteBuffer(renderer.buffer);
  renderer.gl.deleteProgram(renderer.program);
  renderers.delete(ctx);
}
