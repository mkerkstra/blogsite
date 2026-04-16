import { describe, expect, it } from "vitest";
import { FULLSCREEN_VERT, FULLSCREEN_VERT_UV } from "../webgl";

describe("GLSL constants", () => {
  it("FULLSCREEN_VERT is valid GLSL 300 es", () => {
    expect(FULLSCREEN_VERT).toContain("#version 300 es");
    expect(FULLSCREEN_VERT).toContain("gl_Position");
    expect(FULLSCREEN_VERT).toContain("gl_VertexID");
  });

  it("FULLSCREEN_VERT_UV exports vUv varying", () => {
    expect(FULLSCREEN_VERT_UV).toContain("#version 300 es");
    expect(FULLSCREEN_VERT_UV).toContain("out vec2 vUv");
    expect(FULLSCREEN_VERT_UV).toContain("gl_Position");
  });

  it("FULLSCREEN_VERT does not export vUv", () => {
    expect(FULLSCREEN_VERT).not.toContain("vUv");
  });
});

// compileShader and linkProgram require a WebGL2 context which
// happy-dom does not provide. They are integration-tested via
// the experiments themselves loading in a browser.
