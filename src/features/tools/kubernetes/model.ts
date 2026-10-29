export type Pod = { id: number; node: number | null; ready: boolean };
export type Worker = { id: number; status: "ready" | "provisioning" | "offline" };
export type Cluster = {
  desired: number;
  pods: Pod[];
  nodes: Worker[];
  nextPod: number;
  auto: boolean;
  mesh: boolean;
  operator: boolean;
  tick: number;
  events: string[];
};
export type Action =
  | { type: "tick" }
  | { type: "scale"; value: number }
  | { type: "delete" }
  | { type: "fail" }
  | { type: "auto" }
  | { type: "mesh" }
  | { type: "operator" }
  | { type: "reset" }
  | { type: "factory" };

export function initialCluster(): Cluster {
  return {
    desired: 3,
    pods: [1, 2, 3].map((id) => ({ id, node: id === 2 ? 2 : 1, ready: true })),
    nodes: [
      { id: 1, status: "ready" },
      { id: 2, status: "ready" },
    ],
    nextPod: 4,
    auto: true,
    mesh: false,
    operator: false,
    tick: 0,
    events: ["Tea is served. Three ready Pods, one stable Service."],
  };
}
function note(s: Cluster, message: string) {
  s.events = [message, ...s.events].slice(0, 5);
}
export function readyPods(s: Cluster) {
  return s.pods.filter(
    (p) => p.ready && s.nodes.some((n) => n.id === p.node && n.status === "ready"),
  );
}
export function clusterReducer(state: Cluster, action: Action): Cluster {
  if (action.type === "reset") return initialCluster();
  if (action.type === "factory")
    return {
      ...initialCluster(),
      desired: 0,
      pods: [],
      nextPod: 1,
      operator: true,
      events: [
        "Application team submits a TeaStand requesting five servings. The platform provides two ready nodes.",
      ],
    };
  const s: Cluster = {
    ...state,
    pods: state.pods.map((p) => ({ ...p })),
    nodes: state.nodes.map((n) => ({ ...n })),
    events: [...state.events],
  };
  switch (action.type) {
    case "scale":
      s.desired = Math.max(0, Math.min(8, action.value));
      note(s, `Application team: Deployment now asks for ${s.desired} tea-api replicas.`);
      return s;
    case "delete": {
      const victim = readyPods(s)[0];
      if (victim) {
        s.pods = s.pods.filter((p) => p.id !== victim.id);
        note(s, `Pod tea-${victim.id} deleted. Desired replicas are still ${s.desired}.`);
      }
      return s;
    }
    case "fail": {
      const node = s.nodes.find((n) => n.status === "ready");
      if (node) {
        node.status = "offline";
        s.pods
          .filter((p) => p.node === node.id)
          .forEach((p) => {
            p.ready = false;
          });
        note(s, `Node ${node.id} is offline. Its Pods no longer receive Service traffic.`);
      }
      return s;
    }
    case "auto":
      s.auto = !s.auto;
      note(
        s,
        s.auto
          ? "Capacity provisioning resumed."
          : "Capacity provisioning paused for this experiment.",
      );
      return s;
    case "mesh":
      s.mesh = !s.mesh;
      note(
        s,
        s.mesh
          ? "Illustrative Istio sidecars enabled. Proxies handle mesh policy; applications still make tea."
          : "Mesh overlay removed. Kubernetes Services still work.",
      );
      return s;
    case "operator":
      s.operator = !s.operator;
      note(
        s,
        s.operator
          ? "TeaStand custom resource created. Its operator will reconcile a Deployment."
          : "Operator demo released control of replicas; Deployment retained for exploration.",
      );
      return s;
    case "tick":
      break;
  }
  s.tick++;
  if (s.operator && s.desired !== 5) {
    s.desired = 5;
    note(
      s,
      "TeaStand operator: spec.servings=5, so reconcile the owned Deployment to five replicas.",
    );
  }
  // Recovery is deliberately compressed into one teaching step, not a real eviction timeout.
  const lost = s.pods.filter((p) => s.nodes.some((n) => n.id === p.node && n.status === "offline"));
  if (lost.length) {
    s.pods = s.pods.filter((p) => !lost.includes(p));
    note(
      s,
      "After detection and eviction: lost Pods are removed. Replacements get new identities.",
    );
  }
  const booting = s.nodes.filter((n) => n.status === "provisioning");
  booting.forEach((n) => {
    n.status = "ready";
  });
  if (booting.length)
    note(s, "New node registered and Ready. The scheduler can now place waiting Pods.");
  s.pods
    .filter((p) => p.node !== null && !p.ready)
    .forEach((p) => {
      p.ready = true;
    });
  if (s.pods.length > s.desired) {
    s.pods = s.pods.slice(0, s.desired);
    note(s, "ReplicaSet scales down the extra Pods.");
  }
  if (s.pods.length < s.desired) {
    const missing = s.desired - s.pods.length;
    for (let i = 0; i < missing; i++) s.pods.push({ id: s.nextPod++, node: null, ready: false });
    note(
      s,
      `ReplicaSet creates ${missing} replacement or additional Pod${missing === 1 ? "" : "s"}.`,
    );
  }
  for (const p of s.pods.filter((p) => p.node === null)) {
    const node = s.nodes
      .filter((n) => n.status === "ready")
      .sort(
        (a, b) =>
          s.pods.filter((q) => q.node === a.id).length -
          s.pods.filter((q) => q.node === b.id).length,
      )
      .find((n) => s.pods.filter((q) => q.node === n.id).length < 2);
    if (node) {
      p.node = node.id;
      note(
        s,
        `Scheduler binds tea-${p.id} to node ${node.id}. Kubelet starts containers; readiness follows.`,
      );
    }
  }
  if (s.pods.some((p) => p.node === null)) {
    if (s.auto && s.nodes.filter((n) => n.status !== "offline").length < 4) {
      const id = [1, 2, 3, 4].find(
        (id) => !s.nodes.some((n) => n.id === id && n.status !== "offline"),
      );
      if (id === undefined) return s;
      s.nodes = s.nodes.filter((n) => n.id !== id);
      s.nodes.push({ id, status: "provisioning" });
      note(
        s,
        "Auto Mode managed compute requests a node for unschedulable Pods, within the NodePool budget.",
      );
    } else
      note(
        s,
        "Pending: no node fits. Inspect requests, NodePool constraints, limits, and cloud capacity.",
      );
  }
  return s;
}
