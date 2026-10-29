import { drawDepthFaces } from "./depth-renderer";
import { updatePodVisuals, type CampusAnimation } from "./animation";
import type { Cluster } from "./model";
export type Vec = [number, number, number];
export type Camera = { x: number; y: number; z: number; yaw: number; pitch: number };
export type Hit = { x: number; y: number; radius: number; landmark: string };
export const homeCamera = (): Camera => ({ x: 22, y: 19, z: 32, yaw: -0.57, pitch: -0.42 });
export const walkCamera = (): Camera => ({ x: 12, y: 3, z: 22, yaw: -0.48, pitch: 0.02 });
export const positions: Record<string, Vec> = {
  commons: [0, 0, 0],
  control: [-9, 0, -12],
  pods: [-6, 0, 1],
  service: [0, 0, 12],
  capacity: [11, 0, -12],
  mesh: [11, 0, 9],
  operator: [-13, 0, 9],
  pantry: [1, 0, -13],
};
export const nodePosition = (id: number): Vec => [id % 2 ? -5 : 5, 0, id <= 2 ? 2 : -5];
export function podPosition(s: Cluster, id: number): Vec {
  const p = s.pods.find((p) => p.id === id);
  if (!p || p.node === null)
    return [
      -6 + s.pods.filter((p) => p.node === null).findIndex((p) => p.id === id) * 1.5,
      0.9,
      17,
    ];
  const n = nodePosition(p.node);
  const slot = s.pods.filter((q) => q.node === p.node).findIndex((q) => q.id === id);
  return [n[0] + (slot === 0 ? -1.15 : 1.15), 0.9, n[2]];
}
export function lookAt(point: Vec, walking: boolean): Camera {
  const [x, , z] = point;
  return { x: x + 7, y: walking ? 3 : 11, z: z + 13, yaw: -0.49, pitch: walking ? 0 : -0.4 };
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camera: Camera,
  s: Cluster,
  selected: string,
  dark: boolean,
  time: number,
  request: { pod: number; start: number } | null,
  animation: CampusAnimation,
): Hit[] {
  const bg = dark ? "#0b0e0b" : "#f5f1e8";
  const fg = dark ? "#eeeade" : "#252b21";
  const accent = dark ? "#d4ff00" : "#2a8a0e";
  const phase = animation.reduced ? 0 : animation.time / 1000;
  const muted = dark ? "#9ba28e" : "#626b59";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const compact = w < 600;
  const focal = Math.min(w * (compact ? 0.68 : 0.95), h * 1.35);
  function view(p: Vec): Vec {
    const dx = p[0] - camera.x,
      dy = p[1] - camera.y,
      dz = p[2] - camera.z;
    const depth = dx * Math.sin(camera.yaw) - dz * Math.cos(camera.yaw);
    return [
      dx * Math.cos(camera.yaw) + dz * Math.sin(camera.yaw),
      dy * Math.cos(camera.pitch) - depth * Math.sin(camera.pitch),
      depth * Math.cos(camera.pitch) + dy * Math.sin(camera.pitch),
    ];
  }
  function project(v: Vec): [number, number] {
    return [w / 2 + (v[0] / v[2]) * focal, h * 0.49 - (v[1] / v[2]) * focal];
  }
  function line(a: Vec, b: Vec, color: string, width = 1, dash = false) {
    let av = view(a),
      bv = view(b);
    if (av[2] < 0.3 && bv[2] < 0.3) return;
    if (av[2] < 0.3 || bv[2] < 0.3) {
      if (av[2] > bv[2]) [av, bv] = [bv, av];
      const t = (0.3 - av[2]) / (bv[2] - av[2]);
      av = av.map((v, i) => v + (bv[i] - v) * t) as Vec;
    }
    const p = project(av),
      q = project(bv);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash ? [4, 5] : []);
    ctx.beginPath();
    ctx.moveTo(...p);
    ctx.lineTo(...q);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let i = -32; i <= 32; i += 2) {
    line([i, -0.05, -32], [i, -0.05, 32], dark ? "#1c241b" : "#e0dfd1");
    line([-32, -0.05, i], [32, -0.05, i], dark ? "#1c241b" : "#e0dfd1");
  }
  const faces: { points: Vec[]; fill: string; stroke: string; depth: number }[] = [];
  const labels: { p: Vec; title: string; sub: string; landmark: string }[] = [];
  let podTransform: { origin: Vec; scale: number } | null = null;
  function box(p: Vec, size: Vec, highlight = false, pale = false) {
    if (podTransform) {
      const { origin, scale } = podTransform;
      p = p.map((v, i) => origin[i] + (v - origin[i]) * scale) as Vec;
      size = size.map((v) => v * scale) as Vec;
    }
    const [x, y, z] = p,
      [sx, sy, sz] = size;
    const vertices: Vec[] = [
      [x - sx / 2, y, z - sz / 2],
      [x + sx / 2, y, z - sz / 2],
      [x + sx / 2, y, z + sz / 2],
      [x - sx / 2, y, z + sz / 2],
      [x - sx / 2, y + sy, z - sz / 2],
      [x + sx / 2, y + sy, z - sz / 2],
      [x + sx / 2, y + sy, z + sz / 2],
      [x - sx / 2, y + sy, z + sz / 2],
    ];
    const colors = highlight
      ? dark
        ? ["#485411", "#748422", "#b6cb4c"]
        : ["#b6c99e", "#c4d7ac", "#e2edce"]
      : pale
        ? dark
          ? ["#3a4235", "#505a46", "#6c775c"]
          : ["#b9c2ab", "#d3d9c6", "#e6e9d8"]
        : dark
          ? ["#20291f", "#2e3829", "#404a34"]
          : ["#c7c9b9", "#dadbcb", "#eeeddf"];
    [
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
      [4, 5, 6, 7],
      [3, 2, 1, 0],
    ].forEach((indices, i) => {
      let points = indices.map((j) => view(vertices[j]));
      const clipped: Vec[] = [];
      for (let j = 0; j < points.length; j++) {
        const a = points[j],
          b = points[(j + 1) % points.length];
        if (a[2] >= 0.3) clipped.push(a);
        if (a[2] >= 0.3 !== b[2] >= 0.3) {
          const t = (0.3 - a[2]) / (b[2] - a[2]);
          clipped.push(a.map((v, k) => v + (b[k] - v) * t) as Vec);
        }
      }
      points = clipped;
      if (points.length >= 3)
        faces.push({
          points,
          fill: colors[i === 4 ? 2 : i % 2],
          stroke: highlight ? accent : dark ? "#758064" : "#969e86",
          depth: points.reduce((n, v) => n + v[2], 0) / points.length,
        });
    });
  }
  function cylinder(p: Vec, radius: number, height: number) {
    const top: Vec[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        b = ((i + 1) / 16) * Math.PI * 2;
      const pa: Vec = [p[0] + Math.cos(a) * radius, p[1], p[2] + Math.sin(a) * radius];
      const pb: Vec = [p[0] + Math.cos(b) * radius, p[1], p[2] + Math.sin(b) * radius];
      const va: Vec = [pa[0], p[1] + height, pa[2]],
        vb: Vec = [pb[0], p[1] + height, pb[2]];
      top.push(view(va));
      const points = [pa, pb, vb, va].map(view);
      if (points.every((v) => v[2] > 0.3))
        faces.push({
          points,
          fill: dark ? (i % 3 ? "#c1c99d" : "#a0aa7b") : "#e8edd8",
          stroke: accent,
          depth: points.reduce((n, v) => n + v[2], 0) / 4,
        });
    }
    if (top.every((v) => v[2] > 0.3))
      faces.push({
        points: top,
        fill: dark ? "#59612f" : "#9aaa75",
        stroke: accent,
        depth: top.reduce((n, v) => n + v[2], 0) / top.length,
      });
  }
  function label(p: Vec, title: string, sub: string, landmark: string) {
    labels.push({ p, title, sub, landmark });
  }
  function path(a: Vec, b: Vec, active = false, dashed = false) {
    line(
      [a[0], 0.13, a[2]],
      [b[0], 0.13, b[2]],
      active ? accent : dark ? "#566245" : "#a0ac89",
      active ? 2.5 : 1.5,
      dashed,
    );
  }
  const service = positions.service;
  for (const n of s.nodes) path(service, nodePosition(n.id), selected === "service");
  path(positions.control, [0, 0, 0], selected === "control", true);
  path(positions.capacity, [5, 0, -5], selected === "capacity", true);
  path(positions.operator, positions.control, selected === "operator", true);
  path(positions.mesh, service, s.mesh, true);
  for (const n of s.nodes) {
    const p = nodePosition(n.id);
    box(p, [5, 0.45, 4], selected === "pods", n.status === "ready");
    box([p[0], 0.45, p[2] - 1.7], [4.8, 0.25, 0.3], false);
    label(
      [p[0], 0.5, p[2] + 2.4],
      `Node ${n.id}`,
      n.status === "ready"
        ? `${s.pods.filter((q) => q.node === n.id).length}/2 slots · kubelet`
        : n.status,
      "pods",
    );
  }
  const visuals = updatePodVisuals(s, animation, (id) => podPosition(s, id));
  for (const visual of visuals) {
    const p = visual.pod;
    const pos: Vec = [...visual.position];
    pos[1] += (1 - visual.scale) * 1.5;
    podTransform = { origin: pos, scale: visual.scale };
    box(pos, [1.45, 1.35, 1.35], p.ready);
    box([pos[0], pos[1] + 1.35, pos[2]], [1.8, 0.22, 1.65], p.ready);
    // A tiny chimney and two front windows give each disposable kiosk some personality.
    box([pos[0] + 0.35, pos[1] + 1.57, pos[2] - 0.3], [0.25, 0.5, 0.25], false, true);
    for (const offset of [-0.35, 0.35])
      box([pos[0] + offset, pos[1] + 0.65, pos[2] + 0.69], [0.18, 0.22, 0.05], false, true);
    if (s.mesh && p.node !== null)
      box([pos[0] + 0.9, pos[1], pos[2] + 0.5], [0.35, 0.85, 0.35], true);
    podTransform = null;
    if (visual.departed !== undefined) continue;
    label(
      [pos[0], pos[1] + 2.2, pos[2]],
      `tea-${p.id}`,
      p.node === null ? "Pending" : p.ready ? "Ready" : "Not ready",
      "pods",
    );
  }
  box([-9, 0, -12], [6, 0.5, 4], selected === "control");
  for (let i = 0; i < 3; i++)
    box([-11 + i * 2, 0.5, -12], [1.6, 3.2 + i * 0.6, 2], selected === "control", true);
  label([-9, 5.6, -12], "Control plane", "API · controllers · scheduler · etcd", "control");
  box([11, 0, -12], [4, 0.5, 4], selected === "capacity");
  box([10, 0.5, -12], [0.65, 6, 0.65], selected === "capacity", true);
  box([12, 6, -12], [5, 0.4, 0.5], true);
  const provisioning = s.nodes.some((n) => n.status === "provisioning");
  const craneX = 13 + Math.sin(phase * (provisioning ? 1.7 : 0.45)) * (provisioning ? 1 : 0.35);
  const craneY = 2.5 + (1 + Math.sin(phase * (provisioning ? 2 : 0.6))) * (provisioning ? 1 : 0.2);
  line([craneX, 6, -12], [craneX, craneY + 0.9, -12], accent, 2);
  box([craneX, craneY, -12], [1.4, 0.9, 1.4], true);
  label([11, 7.5, -12], "Capacity crane", "Auto Mode · managed Karpenter", "capacity");
  box(service, [4, 0.4, 3], selected === "service");
  box([0, 0.4, 12], [2.8, 2, 1.8], true);
  box([0, 2.4, 12], [3.5, 0.3, 2.3], true);
  cylinder([0, 2.7, 12], 0.55, 0.8);
  box([0.75, 2.85, 12], [0.5, 0.15, 0.18], true);
  box([0.95, 2.85, 12], [0.15, 0.5, 0.18], true);
  box([0.75, 3.2, 12], [0.5, 0.15, 0.18], true);
  label([0, 4.4, 12], "tea-api Service", "One name. Ready endpoints.", "service");
  box([-13, 0, 9], [3, 2.6, 3], selected === "operator", true);
  box([-13, 2.6, 9], [3.5, 0.35, 3.5], true);
  label(
    [-13, 4.3, 9],
    "Operator workshop",
    s.operator ? "TeaStand → 5 replicas" : "Custom API + domain knowledge",
    "operator",
  );
  box([11, 0, 9], [3, 2.8, 2], s.mesh || selected === "mesh", true);
  box([11, 2.8, 9], [0.3, 1.6, 0.3], true);
  label(
    [11, 5.3, 9],
    "Istio post office",
    s.mesh ? "istiod · sidecar overlay on" : "Optional mesh · overlay off",
    "mesh",
  );
  box([1, 0, -13], [3.5, 2.5, 3], selected === "pantry", true);
  box([1, 2.5, -13], [4, 0.3, 3.5], true);
  label([1, 4, -13], "The pantry", "Config · Secrets · storage", "pantry");
  if (!drawDepthFaces(ctx, faces, w, h, focal)) {
    ctx.fillStyle = fg;
    ctx.font = "14px sans-serif";
    ctx.fillText(
      "3D rendering is unavailable. Use the guide and text inventory to explore.",
      20,
      h / 2,
    );
    return [];
  }
  // These pulses depict control messages, never application traffic through a controller.
  function dot(p: Vec, radius: number, color: string, opacity = 1) {
    const v = view(p);
    if (v[2] < 0.3) return;
    const screen = project(v);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(...screen, Math.max(1, Math.min(14, (radius * focal) / v[2])), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function message(a: Vec, b: Vec, offset: number) {
    const t = (phase * 0.22 + offset) % 1;
    dot(a.map((value, i) => value + (b[i] - value) * t) as Vec, 0.12, accent, 0.85);
  }
  if (!animation.reduced) {
    message([-9, 0.4, -12], [0, 0.4, 0], 0);
    if (s.operator) message([-13, 0.4, 9], [-9, 0.4, -12], 0.3);
    if (s.mesh) message([11, 0.4, 9], [0, 0.4, 12], 0.6);
    for (const visual of visuals) {
      if (!visual.pod.ready || visual.departed !== undefined || visual.scale < 1) continue;
      const [x, y, z] = visual.position;
      for (let i = 0; i < 3; i++) {
        const rise = (phase * 0.45 + i / 3 + visual.pod.id * 0.17) % 1;
        dot(
          [x + 0.35 + Math.sin(phase + i) * rise * 0.25, y + 2.1 + rise * 1.4, z - 0.3],
          0.07 + rise * 0.1,
          fg,
          (1 - rise) * 0.5,
        );
      }
    }
    for (let i = 0; i < 3; i++) {
      const rise = (phase * 0.4 + i / 3) % 1;
      dot(
        [Math.sin(phase + i) * rise * 0.3, 3.6 + rise, 12],
        0.09 + rise * 0.13,
        fg,
        (1 - rise) * 0.5,
      );
    }
  }
  if (request) {
    const end = podPosition(s, request.pod);
    const progress = Math.min(1, (time - request.start) / 1800);
    const start: Vec = [0, 1, 18],
      middle: Vec = [0, 1.5, 12];
    line(start, middle, accent, 3);
    line(middle, [end[0], end[1] + 1, end[2]], accent, 3);
    const a = progress < 0.35 ? start : middle,
      b = progress < 0.35 ? middle : ([end[0], end[1] + 1, end[2]] as Vec);
    const t = progress < 0.35 ? progress / 0.35 : (progress - 0.35) / 0.65;
    const v = view(a.map((val, i) => val + (b[i] - val) * t) as Vec);
    if (v[2] > 0.3) {
      const p = project(v);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(...p, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const hits: Hit[] = [];
  const occupied: { x: number; y: number; w: number; h: number }[] = [];
  labels
    .sort(
      (a, b) =>
        Number(b.landmark === selected) - Number(a.landmark === selected) ||
        view(a.p)[2] - view(b.p)[2],
    )
    .forEach(({ p, title, sub, landmark }) => {
      const v = view(p);
      if (v[2] < 2) return;
      const [rawX, rawY] = project(v);
      if (rawX < 0 || rawX > w || rawY < 20 || rawY > h - 35) return;
      const tiny = title.startsWith("tea-") && title !== "tea-api Service";
      if (compact && tiny && selected !== "pods") return;
      const size = compact ? 10 : tiny ? 11 : 13;
      const subtitle = compact ? "" : sub;
      ctx.font = `${tiny ? 400 : 600} ${size}px ui-monospace, Menlo, monospace`;
      const width = Math.max(ctx.measureText(title).width, subtitle.length * 6) + 18;
      const height = subtitle ? 39 : 23;
      const x = Math.max(width / 2 + 8, Math.min(w - width / 2 - 8, rawX));
      let y = rawY;
      for (let attempt = 0; attempt < 5; attempt++) {
        const collision = occupied.some(
          (r) =>
            x + width / 2 > r.x &&
            x - width / 2 < r.x + r.w &&
            y + height - 14 > r.y &&
            y - 14 < r.y + r.h,
        );
        if (!collision) break;
        y -= height + 4;
      }
      if (y < 150 && compact) return;
      if (
        y < 20 ||
        occupied.some(
          (r) =>
            x + width / 2 > r.x &&
            x - width / 2 < r.x + r.w &&
            y + height - 14 > r.y &&
            y - 14 < r.y + r.h,
        )
      )
        return;
      occupied.push({ x: x - width / 2, y: y - 14, w: width, h: height });
      if (Math.abs(y - rawY) > 5) {
        ctx.strokeStyle = muted;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(rawX, rawY);
        ctx.lineTo(x, y + height - 14);
        ctx.stroke();
      }
      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.93;
      ctx.fillRect(x - width / 2, y - 14, width, height);
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.fillStyle = selected === landmark ? accent : fg;
      ctx.fillText(title, x, y);
      if (subtitle) {
        ctx.font = "10px ui-monospace, Menlo, monospace";
        ctx.fillStyle = muted;
        ctx.fillText(subtitle, x, y + 15);
      }
      hits.push({ x, y, radius: Math.max(25, width / 2), landmark });
    });
  return hits;
}
