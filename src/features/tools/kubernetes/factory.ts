export const factoryStages = [
  {
    title: "1. Order a tea stand",
    stop: 6,
    text: "Application intent: a TeaStand asks for five servings. The platform's operator translates that contract into a Deployment.",
  },
  {
    title: "2. Reconcile the declaration",
    stop: 1,
    text: "The operator sets five replicas. The ReplicaSet creates Pods; the scheduler fits four on existing nodes. One must wait.",
  },
  {
    title: "3. Make room",
    stop: 4,
    text: "Auto Mode supplies the missing capacity within the pool limits. A new node registers; the scheduler binds the waiting Pod.",
  },
  {
    title: "4. Open the kiosks",
    stop: 2,
    text: "Kubelets start containers. Readiness gates the Service's endpoints. The recipe and storage are separate contracts, represented by the pantry.",
  },
  {
    title: "5. Set the delivery rules",
    stop: 5,
    text: "The optional Istio overlay adds proxy companions. Istiod distributes configuration; it does not carry tea requests.",
  },
  {
    title: "6. Serve a cup",
    stop: 3,
    text: "Now follow the bright request path: caller → stable Service → ready backend, with an illustrative proxy hop. The control plane is not in this traffic path.",
  },
  {
    title: "7. A kiosk disappears",
    stop: 2,
    text: "A Pod is deleted, but the declaration still says five. Other ready backends remain eligible while the controllers repair the gap.",
  },
  {
    title: "8. Replace, don't teleport",
    stop: 1,
    text: "The ReplicaSet creates a new Pod identity. The scheduler binds it and its kubelet starts it. Readiness still has to pass.",
  },
  {
    title: "9. The whole system, in concert",
    stop: 8,
    text: "Five ready kiosks again. The operator, controllers, capacity, runtime, Service, and optional mesh uphold one shared contract. Another cup can be served.",
  },
] as const;
