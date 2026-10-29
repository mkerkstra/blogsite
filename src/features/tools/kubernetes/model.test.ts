import { describe, expect, it } from "vitest";
import { clusterReducer, initialCluster, readyPods, type Cluster } from "./model";
const tick = (s: Cluster, count = 1): Cluster => {
  for (let i = 0; i < count; i++) s = clusterReducer(s, { type: "tick" });
  return s;
};
describe("cluster teaching model", () => {
  it("replaces a deleted Pod with a new identity without changing desired state", () => {
    const initial = initialCluster();
    const deleted = clusterReducer(initial, { type: "delete" });
    expect(initial.pods).toHaveLength(3);
    expect(readyPods(deleted)).toHaveLength(2);
    const recovered = tick(deleted, 2);
    expect(recovered.desired).toBe(3);
    expect(readyPods(recovered)).toHaveLength(3);
    expect(recovered.pods.map((p) => p.id)).not.toContain(1);
  });
  it("separates scheduling from readiness", () => {
    const scaled = clusterReducer(initialCluster(), { type: "scale", value: 4 });
    const starting = tick(scaled);
    expect(starting.pods).toHaveLength(4);
    expect(readyPods(starting)).toHaveLength(3);
    expect(readyPods(tick(starting))).toHaveLength(4);
  });
  it("keeps unschedulable Pods Pending while capacity provisioning is paused", () => {
    const s = clusterReducer(clusterReducer(initialCluster(), { type: "auto" }), {
      type: "scale",
      value: 8,
    });
    const stalled = tick(s, 6);
    expect(stalled.pods.filter((p) => p.node === null)).toHaveLength(4);
    expect(stalled.nodes).toHaveLength(2);
    expect(readyPods(stalled)).toHaveLength(4);
    const recovered = tick(clusterReducer(stalled, { type: "auto" }), 5);
    expect(readyPods(recovered)).toHaveLength(8);
    expect(recovered.nodes).toHaveLength(4);
  });
  it("removes failed-node Pods from endpoints immediately and replaces them later", () => {
    const failed = clusterReducer(initialCluster(), { type: "fail" });
    expect(readyPods(failed)).toHaveLength(1);
    const oldIds = failed.pods.filter((p) => p.node === 1).map((p) => p.id);
    const recovered = tick(failed, 4);
    expect(readyPods(recovered)).toHaveLength(3);
    expect(recovered.pods.some((p) => oldIds.includes(p.id))).toBe(false);
  });
  it("can recover after all initial nodes fail", () => {
    let s = initialCluster();
    s = clusterReducer(s, { type: "fail" });
    s = clusterReducer(s, { type: "fail" });
    expect(readyPods(s)).toHaveLength(0);
    expect(readyPods(tick(s, 5))).toHaveLength(3);
  });
  it("operator reconciles manual drift back to its declared contract", () => {
    let s = clusterReducer(initialCluster(), { type: "operator" });
    s = tick(s, 5);
    expect(s.desired).toBe(5);
    s = clusterReducer(s, { type: "scale", value: 1 });
    expect(s.desired).toBe(1);
    expect(tick(s).desired).toBe(5);
    s = clusterReducer(s, { type: "operator" });
    expect(tick(clusterReducer(s, { type: "scale", value: 1 })).desired).toBe(1);
  });
  it("scales to zero without inventing available backends", () => {
    const s = tick(clusterReducer(initialCluster(), { type: "scale", value: 0 }));
    expect(s.pods).toEqual([]);
    expect(readyPods(s)).toEqual([]);
  });
  it("mesh changes the overlay, not replica or endpoint eligibility", () => {
    const s = clusterReducer(initialCluster(), { type: "mesh" });
    expect(s.mesh).toBe(true);
    expect(readyPods(s)).toEqual(readyPods(initialCluster()));
  });
  it("preserves capacity and identity invariants across repeated disruptions", () => {
    let s = clusterReducer(initialCluster(), { type: "scale", value: 8 });
    for (let i = 0; i < 30; i++) {
      s = tick(s);
      if (i % 5 === 0) s = clusterReducer(s, { type: "fail" });
      expect(new Set(s.pods.map((p) => p.id)).size).toBe(s.pods.length);
      expect(new Set(s.nodes.map((n) => n.id)).size).toBe(s.nodes.length);
      for (const n of s.nodes)
        expect(s.pods.filter((p) => p.node === n.id).length).toBeLessThanOrEqual(2);
      expect(s.nodes.length).toBeLessThanOrEqual(4);
    }
    expect(readyPods(tick(s, 6))).toHaveLength(8);
  });
});
