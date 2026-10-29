import { describe, expect, it } from "vitest";
import { createCampusAnimation, updatePodVisuals } from "./animation";
import { clusterReducer, initialCluster } from "./model";
import { podPosition } from "./scene";

describe("campus animation lifecycle", () => {
  it("animates a replacement separately from the departing identity", () => {
    const a = createCampusAnimation();
    let s = initialCluster();
    const render = () => updatePodVisuals(s, a, (id) => podPosition(s, id));
    render();
    a.time = 1000;
    expect(render().every((p) => p.scale === 1)).toBe(true);
    s = clusterReducer(s, { type: "delete" });
    render();
    s = clusterReducer(s, { type: "tick" });
    const visuals = render();
    expect(visuals.find((p) => p.pod.id === 1)?.departed).toBe(1000);
    expect(visuals.find((p) => p.pod.id === 4)?.scale).toBe(0);
    a.time = 1800;
    expect(render().map((p) => p.pod.id)).toEqual([2, 3, 4]);
    expect(s.pods).toHaveLength(3);
  });
  it("shows manual paused changes immediately and keeps static frames stable", () => {
    const a = createCampusAnimation();
    a.active = false;
    let s = initialCluster();
    const render = () => updatePodVisuals(s, a, (id) => podPosition(s, id));
    expect(render().every((p) => p.scale === 1)).toBe(true);
    s = clusterReducer(s, { type: "delete" });
    expect(render()).toHaveLength(2);
    expect(render()).toEqual(render());
  });
  it("does not leave invisible Pods or departure ghosts in reduced motion", () => {
    const a = createCampusAnimation();
    a.reduced = true;
    let s = initialCluster();
    const render = () => updatePodVisuals(s, a, (id) => podPosition(s, id));
    expect(render().every((p) => p.scale === 1)).toBe(true);
    s = clusterReducer(s, { type: "delete" });
    expect(render()).toHaveLength(2);
  });
});
