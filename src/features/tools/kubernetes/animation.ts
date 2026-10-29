import type { Cluster, Pod } from "./model";
import type { Vec } from "./scene";

export type PodVisual = { pod: Pod; position: Vec; born: number; departed?: number };
export type CampusAnimation = {
  active: boolean;
  time: number;
  reduced: boolean;
  pods: Map<number, PodVisual>;
};
export function createCampusAnimation(): CampusAnimation {
  return { time: 0, active: true, reduced: false, pods: new Map() };
}

/** Visual identities follow the model; replacement Pods never travel from a failed node. */
export function updatePodVisuals(
  s: Cluster,
  animation: CampusAnimation,
  position: (id: number) => Vec,
) {
  const { time, pods, reduced } = animation;
  for (const pod of s.pods) {
    const previous = pods.get(pod.id);
    pods.set(pod.id, {
      pod,
      position: position(pod.id),
      born:
        previous && previous.pod.node === pod.node
          ? previous.born
          : time - (animation.active ? 0 : 800),
    });
  }
  const current = new Set(s.pods.map((p) => p.id));
  for (const [id, visual] of pods) {
    if (!current.has(id)) {
      visual.departed ??= time;
      if (reduced || !animation.active || time - visual.departed >= 700) pods.delete(id);
    }
  }
  return [...pods.values()].map((visual) => {
    const progress = reduced ? 1 : Math.min(1, (time - visual.born) / 800);
    const arrival = 1 - (1 - progress) ** 3;
    const scale =
      visual.departed === undefined ? arrival : Math.max(0, 1 - (time - visual.departed) / 700);
    return { ...visual, scale };
  });
}
