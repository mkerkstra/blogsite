"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Footprints,
  Map,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { LabChrome } from "@/features/lab/components/chrome/lab-chrome";
import { ControlGroup, LabSelect, Stepper, Tool } from "@/features/lab/components/chrome/controls";
import { useLabCanvas } from "@/features/lab/lib/use-lab-canvas";
import { getTheme, prefersReducedMotion } from "@/features/lab/lib/env";
import { clusterReducer, initialCluster, readyPods } from "./model";
import { lessons } from "./lessons";
import {
  drawScene,
  homeCamera,
  lookAt,
  nodePosition,
  positions,
  walkCamera,
  type Hit,
} from "./scene";
import styles from "./kubernetes.module.css";

const options = lessons.map((lesson, i) => ({
  value: String(i),
  label: `${i + 1}. ${lesson.short}`,
}));
export function KubernetesCommons() {
  const [cluster, dispatch] = useReducer(clusterReducer, undefined, initialCluster);
  const [stop, setStop] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [walking, setWalking] = useState(false);
  const [requestStatus, setRequestStatus] = useState("The kettles are ready. Send a request.");
  const [canvasError, setCanvasError] = useState(false);
  const { canvasRef, sizeRef } = useLabCanvas();
  const guideRef = useRef<HTMLElement>(null);
  const camera = useRef(homeCamera());
  const hits = useRef<Hit[]>([]);
  const keys = useRef(new Set<string>());
  const motion = useRef(false);
  const walkingRef = useRef(false);
  const request = useRef<{ pod: number; start: number } | null>(null);
  const requestCount = useRef(0);
  const live = useRef({ cluster, selected: lessons[stop].landmark });
  live.current = { cluster, selected: lessons[stop].landmark };
  walkingRef.current = walking;
  const lesson = lessons[stop];
  const ready = readyPods(cluster);
  const pending = cluster.pods.filter((p) => p.node === null).length;

  function visit(index: number) {
    setStop(index);
    guideRef.current?.scrollTo({ top: 0 });
    const landmark = lessons[index].landmark;
    camera.current =
      landmark === "commons"
        ? walkingRef.current
          ? walkCamera()
          : homeCamera()
        : lookAt(positions[landmark], walkingRef.current);
  }
  function changeView() {
    const next = !walking;
    setWalking(next);
    camera.current = next ? walkCamera() : homeCamera();
    canvasRef.current?.focus({ preventScroll: true });
  }
  function move(forward: number, sideways = 0) {
    const c = camera.current;
    c.x = Math.max(-30, Math.min(30, c.x + Math.sin(c.yaw) * forward + Math.cos(c.yaw) * sideways));
    c.z = Math.max(-28, Math.min(32, c.z - Math.cos(c.yaw) * forward + Math.sin(c.yaw) * sideways));
  }
  function sendRequest() {
    if (!ready.length) {
      request.current = null;
      setRequestStatus(
        "No ready endpoints. The Service name exists, but this request cannot be served.",
      );
      return;
    }
    const pod = ready[requestCount.current++ % ready.length];
    request.current = { pod: pod.id, start: performance.now() - (motion.current ? 1800 : 0) };
    setRequestStatus(
      `Request ${requestCount.current} → tea-api → ${cluster.mesh ? "illustrative mesh proxy → " : ""}tea-${pod.id}. One ready backend selected.`,
    );
  }
  function reset() {
    dispatch({ type: "reset" });
    setPlaying(true);
    setStop(0);
    setWalking(false);
    camera.current = homeCamera();
    request.current = null;
    requestCount.current = 0;
    setRequestStatus("The kettles are ready. Send a request.");
  }
  useEffect(() => {
    motion.current = prefersReducedMotion();
    if (motion.current) setPlaying(false);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 2200);
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      setCanvasError(true);
      return;
    }
    let raf = 0,
      last = 0;
    const clearKeys = () => keys.current.clear();
    window.addEventListener("blur", clearKeys);
    const draw = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const c = camera.current;
      if (document.activeElement === canvas) {
        const k = keys.current;
        const speed = dt * (k.has("shift") ? 12 : 6);
        const forward = Number(k.has("w")) - Number(k.has("s"));
        const sideways = Number(k.has("d")) - Number(k.has("a"));
        c.x = Math.max(
          -30,
          Math.min(30, c.x + (Math.sin(c.yaw) * forward + Math.cos(c.yaw) * sideways) * speed),
        );
        c.z = Math.max(
          -28,
          Math.min(32, c.z + (-Math.cos(c.yaw) * forward + Math.sin(c.yaw) * sideways) * speed),
        );
        c.yaw += (Number(k.has("arrowright")) - Number(k.has("arrowleft"))) * dt * 1.3;
        c.pitch = Math.max(
          -0.9,
          Math.min(0.65, c.pitch + (Number(k.has("arrowup")) - Number(k.has("arrowdown"))) * dt),
        );
      } else clearKeys();
      const { width, height, dpr } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = request.current;
      if (r && !readyPods(live.current.cluster).some((p) => p.id === r.pod)) request.current = null;
      hits.current = drawScene(
        ctx,
        width / dpr,
        height / dpr,
        c,
        live.current.cluster,
        live.current.selected,
        getTheme() === "dark",
        time,
        request.current,
      );
      if (r && time - r.start > 3000) request.current = null;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("blur", clearKeys);
    };
  }, [canvasRef, sizeRef]);
  const drag = useRef<{ x: number; y: number; distance: number } | null>(null);
  return (
    <>
      <div className={styles.shell}>
        <aside ref={guideRef} className={styles.guide} aria-label="Guided Kubernetes refresher">
          <Link href="/tools" className={styles.back}>
            ← All tools
          </Link>
          <p className={styles.eyebrow}>A cloud-native field trip · EKS Auto Mode</p>
          <h1>
            The cluster <em>commons.</em>
          </h1>
          <p className={styles.intro}>Big infrastructure ideas. Tiny tea kiosks.</p>
          <div className={styles.tourNav}>
            <LabSelect
              label="Stop"
              value={String(stop)}
              onChange={(v) => visit(Number(v))}
              options={options}
            />
            <Tool
              label="Previous stop"
              icon={<ArrowLeft size={16} />}
              onClick={() => visit((stop + lessons.length - 1) % lessons.length)}
            />
            <Tool
              label="Next stop"
              icon={<ArrowRight size={16} />}
              onClick={() => visit((stop + 1) % lessons.length)}
            />
          </div>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Guided tour progress"
            aria-valuemin={1}
            aria-valuemax={lessons.length}
            aria-valuenow={stop + 1}
          >
            {lessons.map((l, i) => (
              <span key={l.short} data-active={i <= stop} />
            ))}
          </div>
          <section className={styles.lesson} aria-labelledby="lesson-title">
            <p className={styles.kicker}>{lesson.kicker}</p>
            <h2 id="lesson-title">{lesson.title}</h2>
            <p>{lesson.body}</p>
            <h3>The team contract</h3>
            <p>{lesson.contract}</p>
            <div className={styles.try}>
              <h3>Try it together</h3>
              <p>{lesson.try}</p>
            </div>
          </section>
          <section className={styles.experiments} aria-label="Cluster experiments">
            <div className={styles.replicaRow}>
              <Stepper
                label="Replicas"
                value={cluster.desired}
                min={0}
                max={8}
                onChange={(value) => dispatch({ type: "scale", value })}
              />
              <span>desired state</span>
            </div>
            <div className={styles.actions}>
              <Tool
                label="Send a tea request"
                icon={<>Send a tea request ↗</>}
                onClick={sendRequest}
                primary
              />
              <Tool
                label="Delete a Pod"
                icon={<>Delete a Pod</>}
                onClick={() => dispatch({ type: "delete" })}
              />
              <Tool
                label="Node nap: take a node offline"
                icon={<>Node nap</>}
                onClick={() => dispatch({ type: "fail" })}
              />
              <Tool
                label={`Capacity: ${cluster.auto ? "auto" : "paused"}. Toggle provisioning`}
                pressed={cluster.auto}
                icon={<>{cluster.auto ? "Capacity: auto" : "Capacity: paused"}</>}
                onClick={() => dispatch({ type: "auto" })}
              />
              <Tool
                label={`Istio: ${cluster.mesh ? "on" : "off"}. Toggle overlay`}
                pressed={cluster.mesh}
                icon={<>Istio: {cluster.mesh ? "on" : "off"}</>}
                onClick={() => dispatch({ type: "mesh" })}
              />
              <Tool
                label={`Operator: ${cluster.operator ? "on" : "off"}. Toggle TeaStand operator`}
                pressed={cluster.operator}
                icon={<>Operator: {cluster.operator ? "on" : "off"}</>}
                onClick={() => dispatch({ type: "operator" })}
              />
            </div>
            <p className={styles.request} role="status">
              {requestStatus}
            </p>
          </section>
          <details className={styles.details}>
            <summary>Under the hood</summary>
            <pre>{lesson.code}</pre>
            <a href={lesson.source} target="_blank" rel="noreferrer">
              Read the official documentation ↗
            </a>
          </details>
          <details className={styles.details}>
            <summary>Cluster inventory & accessible scene description</summary>
            <p>
              The control plane reconciles the tea-api Deployment. A Service selects its ready Pods.
              Auto Mode supplies worker nodes. The optional mesh and operator are separate
              controllers.
            </p>
            <ul>
              {cluster.nodes.map((n) => (
                <li key={n.id}>
                  Node {n.id}: {n.status}
                </li>
              ))}
              {cluster.pods.map((p) => (
                <li key={p.id}>
                  tea-{p.id}:{" "}
                  {p.node === null
                    ? "Pending"
                    : `${p.ready ? "Ready" : "Not ready"} on node ${p.node}`}
                </li>
              ))}
            </ul>
          </details>
          <p className={styles.note}>
            Teaching model, not a live cluster. Timings are accelerated; scheduling uses two slots
            per node. No real cloud resources, requests, or credentials.
          </p>
        </aside>
        <section className={styles.world} aria-label="Interactive cluster campus">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label="3D cluster campus. Focus to move with W A S D and look with arrow keys. Drag to look; click a landmark label to visit its lesson."
            aria-describedby="walk-instructions"
            onKeyDown={(e) => {
              if (
                [
                  "w",
                  "a",
                  "s",
                  "d",
                  "shift",
                  "arrowup",
                  "arrowdown",
                  "arrowleft",
                  "arrowright",
                ].includes(e.key.toLowerCase()) &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey
              ) {
                e.preventDefault();
                keys.current.add(e.key.toLowerCase());
              }
            }}
            onKeyUp={(e) => keys.current.delete(e.key.toLowerCase())}
            onBlur={() => keys.current.clear()}
            onPointerDown={(e) => {
              e.currentTarget.focus({ preventScroll: true });
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, distance: 0 };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const dx = e.clientX - d.x,
                dy = e.clientY - d.y;
              d.distance += Math.abs(dx) + Math.abs(dy);
              d.x = e.clientX;
              d.y = e.clientY;
              camera.current.yaw += dx * 0.004;
              camera.current.pitch = Math.max(
                -0.9,
                Math.min(0.65, camera.current.pitch - dy * 0.004),
              );
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onPointerUp={(e) => {
              const d = drag.current;
              drag.current = null;
              if (d && d.distance < 7) {
                const rect = e.currentTarget.getBoundingClientRect();
                const hit = [...hits.current]
                  .reverse()
                  .find(
                    (hit) =>
                      Math.abs(hit.x - (e.clientX - rect.left)) < hit.radius &&
                      Math.abs(hit.y - (e.clientY - rect.top)) < 23,
                  );
                if (hit) {
                  const index = lessons.findIndex((l) => l.landmark === hit.landmark);
                  if (index >= 0) visit(index);
                }
              }
            }}
          />
          {canvasError && (
            <p className={styles.fallback}>
              Canvas is unavailable. All lessons, experiments, and cluster inventory remain
              available in the guide.
            </p>
          )}
          <div className={styles.worldHeader}>
            <div>
              <span className={styles.liveDot} />
              {walking ? "At kiosk level" : "The campus map"}
              <p>Namespace: tea-garden · illustrative architecture</p>
            </div>
            <div className={styles.viewButton}>
              <Tool
                label={
                  walking
                    ? "Campus map: switch to overview"
                    : "Take a walk: enter first-person view"
                }
                onClick={changeView}
                icon={
                  walking ? (
                    <>
                      <Map size={15} /> Campus map
                    </>
                  ) : (
                    <>
                      <Footprints size={15} /> Take a walk
                    </>
                  )
                }
                primary
              />
            </div>
          </div>
          <div className={styles.stats} role="group" aria-label="Cluster status">
            <div>
              <strong>
                {ready.length}
                <span>/{cluster.desired}</span>
              </strong>
              <span>Ready / desired</span>
            </div>
            <div>
              <strong>{pending}</strong>
              <span>Pending Pods</span>
            </div>
            <div>
              <strong>{cluster.nodes.filter((n) => n.status === "ready").length}</strong>
              <span>Ready nodes</span>
            </div>
          </div>
          <div className={styles.bottomOverlay}>
            <div className={styles.events}>
              <p>
                Dispatches from the commons <span>step {cluster.tick}</span>
              </p>
              <ol aria-live="polite" aria-relevant="additions text">
                {cluster.events.slice(0, 3).map((event, i) => (
                  <li key={`${i}-${event}`}>{event}</li>
                ))}
              </ol>
            </div>
            <div className={styles.map}>
              <svg
                viewBox="-19 -19 38 42"
                role="img"
                aria-label="Top-down orientation map of campus landmarks"
              >
                <rect
                  x="-18"
                  y="-18"
                  width="36"
                  height="40"
                  rx="1"
                  fill="none"
                  stroke="currentColor"
                  opacity="0.3"
                />
                {Object.entries(positions)
                  .filter(([key]) => key !== "commons" && key !== "pods")
                  .map(([key, p]) => (
                    <circle
                      key={key}
                      cx={p[0]}
                      cy={p[2]}
                      r={key === lesson.landmark ? 1.8 : 1}
                      fill="currentColor"
                    />
                  ))}
                {cluster.nodes.map((n) => {
                  const p = nodePosition(n.id);
                  return (
                    <rect
                      key={n.id}
                      x={p[0] - 2}
                      y={p[2] - 1.5}
                      width="4"
                      height="3"
                      fill="none"
                      stroke="currentColor"
                    />
                  );
                })}
              </svg>
              <span>Campus footprint</span>
            </div>
          </div>
          <div className={styles.walkInstructions} id="walk-instructions">
            Drag to look · WASD to move · arrows to look · click labels to explore
          </div>
          {walking && (
            <div className={styles.walkControls} role="group" aria-label="Walking controls">
              <Tool label="Walk left" onClick={() => move(0, -2)} icon={<ArrowLeft size={18} />} />
              <Tool label="Walk forward" onClick={() => move(2)} icon={<ArrowUp size={18} />} />
              <Tool label="Walk backward" onClick={() => move(-2)} icon={<ArrowDown size={18} />} />
              <Tool label="Walk right" onClick={() => move(0, 2)} icon={<ArrowRight size={18} />} />
            </div>
          )}
        </section>
      </div>
      <LabChrome
        identity={{ name: "The cluster commons" }}
        info={
          <>
            <p>
              Walk through a tiny tea-serving campus to revisit Kubernetes, EKS Auto Mode,
              Karpenter, Istio, and operators. Choose a stop to move the camera and read the team
              contract.
            </p>
            <p>
              Use the simulation controls to change desired state and watch controllers respond.
              Pause and step for a presenter-led explanation. Reduced-motion preferences start the
              simulation paused.
            </p>
            <p>
              The geometry is a conceptual map. Services are logical endpoints, not physical
              buildings; controllers do not sit in the application traffic path. Node capacity,
              readiness, failure recovery, and request routing are simplified.
            </p>
            <p>
              Use the inventory in the guide for a text equivalent. All experiments work without
              walking or using a mouse.
            </p>
          </>
        }
      >
        <ControlGroup sticky>
          <Tool
            label={playing ? "Pause simulation" : "Play simulation"}
            onClick={() => setPlaying(!playing)}
            icon={playing ? <Pause size={16} /> : <Play size={16} />}
            primary
          />
          <Tool
            label="Step: advance one reconciliation step"
            onClick={() => {
              setPlaying(false);
              dispatch({ type: "tick" });
            }}
            icon={<>Step →</>}
          />
          <Tool label="Reset campus" onClick={reset} icon={<RotateCcw size={16} />} />
        </ControlGroup>
        <ControlGroup>
          <span className="text-xs text-muted-foreground">
            {stop + 1} / {lessons.length} · {lesson.short}
          </span>
          <Tool
            label="Next guided stop"
            onClick={() => visit((stop + 1) % lessons.length)}
            icon={<ArrowRight size={16} />}
          />
        </ControlGroup>
      </LabChrome>
    </>
  );
}
