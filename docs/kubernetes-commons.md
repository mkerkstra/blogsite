# The cluster commons

A browser-only Kubernetes refresher at `/tools/kubernetes`, linked from `/tools`, the navigation, command palette, and sitemap. React and a custom Canvas2D perspective renderer reuse the labs' controls, theme helpers, canvas sizing, fullscreen, and recording. No rendering dependencies or cloud integrations are added.

## A ten-minute field trip

1. **The contract:** the tea application declares an outcome; the platform supplies capabilities and guardrails. The shared API makes independent delivery possible.
2. **Control plane:** pause, delete a Pod, then step twice. A ReplicaSet creates a new Pod identity, the scheduler binds it, and readiness follows startup.
3. **Pods and health:** take a node offline. Its Pods immediately leave the toy model's ready endpoints. Step through detection/eviction and replacement. Explain that real failure detection and eviction are not instantaneous.
4. **Services:** send tea requests. The Service name stays stable while backend identities change. Scale to zero and step, then send a request to demonstrate that an address is not availability.
5. **Auto Mode:** reset, pause capacity provisioning, set replicas to eight, then step. Four Pods cannot fit. Resume capacity and step through provisioning, binding, and readiness. Contrast replica autoscaling (HPA) with node provisioning (managed Karpenter-based compute).
6. **Istio:** enable the overlay and send a request. The proxy companions represent the sidecar data plane. Istiod distributes configuration; it does not relay application traffic. Explain ambient mode separately.
7. **Operators:** enable the fictional TeaStand operator. Step to reconcile five replicas. Manually change the count and step again: the controller restores its contract. A CRD defines a kind; an operator implements behavior.
8. **Config and storage:** ask which state must survive kiosk replacement. Discuss ConfigMaps, Secrets, PVCs, storage classes, backups, namespaces, and policy.
9. **Teamwork:** ask who owns a Pending Pod incident. Inspect declared requests, events, NodePools, available capacity, and application needs together instead of handing off an opaque ticket.

## Controls and accessibility

- The initial campus overview shows the whole architecture. **Take a walk** switches to eye level. Drag to look; focus the canvas and use WASD to move and arrow keys to look. Shift increases movement speed. Touch users can drag and use four movement buttons.
- Click a visible landmark label or choose a tour stop. Every lesson and simulation action is available without canvas interaction.
- **Pause**, **Step**, and **Reset** support presenter-led explanations. Reduced motion starts paused and skips request-packet travel. Camera navigation is immediate and user controlled.
- **How it works**, fullscreen, and canvas recording use shared lab chrome. The shared recorder captures the canvas, not the HTML lesson panel.
- Mobile stacks the scene above a scrollable guide. Light and dark themes are supported. The expandable inventory provides the scene's current nodes and Pods in text.

## Deliberate boundaries

This is a conceptual simulation, not a Kubernetes or AWS emulator. No commands execute, requests leave the browser, or resources are provisioned. The displayed snippets are explanatory excerpts, not deployable manifests.

- The pool has at most four nodes with two slots each. Real scheduling considers resource requests, affinity, taints, topology, volumes, and other constraints. Provisioning also depends on limits, quotas, IAM, and cloud availability.
- Manual scaling stands in for an application/HPA decision. The model does not implement an HPA, consolidation, rolling updates, PodDisruptionBudgets, or production failure timers.
- Each reconciliation step compresses asynchronous controller behavior. A newly bound Pod becomes ready on the next step. Failed-node detection/eviction is compressed; readiness changes and endpoint propagation are not instantaneous in real clusters.
- Request selection rotates through ready Pods for clarity. Real networking implementations need not round-robin per HTTP request. Paths are logical, not physical cables or a precise packet trace.
- Auto Mode's managed compute is not a Karpenter Deployment inside the application cluster. Its NodeClass API differs from the EC2NodeClass used by self-managed AWS Karpenter. Pausing capacity is a teaching switch, not a claim about an Auto Mode UI control.
- Istio is optional and not automatically supplied by Auto Mode. The overlay illustrates sidecars; it does not install proxies, enforce mTLS, or establish compatibility of a particular mesh deployment. Ambient mode uses ztunnels and optional waypoints.
- TeaStand is a fictional custom API. It illustrates ownership and reconciliation, not a shipped operator. Turning it off leaves its Deployment for continued exploration; real deletion behavior depends on ownership, finalizers, and the operator.
- Configuration and storage buildings are explanatory landmarks only. The model does not simulate persistence, encryption, secret management, or namespace isolation.

## Verification and screenshots

- `pnpm test`: includes invariant and transition tests for capacity, readiness, failure recovery, operator ownership, immutable state, and identity replacement.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- With a local server running, `pnpm exec tsx scripts/capture-kubernetes.ts` checks capacity recovery, operator reconciliation, mobile overflow, reduced motion, and browser runtime errors. It refreshes the two tool previews and screenshots under `docs/screenshots/kubernetes/`. Set `TOOLS_PREVIEW_URL` to target a different local server.

## Primary references

The tour links to the relevant official page at each stop. Additional architecture references:

- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
- [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
- [Auto Mode managed components and responsibilities](https://docs.aws.amazon.com/eks/latest/best-practices/automode.html)
- [Karpenter NodePools](https://karpenter.sh/docs/concepts/nodepools/)
- [Istio data plane modes](https://istio.io/latest/docs/overview/dataplane-modes/)
- [Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
