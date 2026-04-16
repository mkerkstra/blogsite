export type Experiment = {
  slug: string;
  title: string;
  description: string;
};

export type ExperimentSection = {
  label: string;
  experiments: Experiment[];
};

export const sections: ExperimentSection[] = [
  {
    label: "GPU",
    experiments: [
      {
        slug: "reaction-diffusion",
        title: "Reaction Diffusion",
        description: "Gray-Scott model. Two chemicals, simple rules, emergent complexity.",
      },
      {
        slug: "ray-march",
        title: "Ray March",
        description: "Signed distance fields. A 3D renderer in a fragment shader.",
      },
      {
        slug: "flow-field",
        title: "Flow Field",
        description: "120k particles in curl noise. Transform feedback, zero CPU.",
      },
      {
        slug: "physarum",
        title: "Physarum",
        description: "147k slime mold agents. Sense, turn, deposit, repeat.",
      },
      {
        slug: "fluid",
        title: "Fluid",
        description: "Navier-Stokes in six shader passes. Pressure, advection, vorticity.",
      },
      {
        slug: "strange-attractor",
        title: "Strange Attractor",
        description: "150k particles tracing Thomas' chaotic orbits in 3D.",
      },
      {
        slug: "mandelbrot",
        title: "Mandelbrot",
        description: "Fractal zoom. Click to dive, smooth coloring, infinite detail.",
      },
    ],
  },
  {
    label: "Simulation",
    experiments: [
      {
        slug: "cloth",
        title: "Cloth",
        description: "Verlet integration. Drag to interact, pull hard to tear.",
      },
      {
        slug: "boids",
        title: "Boids",
        description: "Flocking. Separation, alignment, cohesion. No leader, no plan.",
      },
      {
        slug: "particle-life",
        title: "Particle Life",
        description: "Six species, random forces, emergent chemistry.",
      },
      {
        slug: "game-of-life",
        title: "Game of Life",
        description: "Four rules. Gliders, guns, and Turing-complete computation.",
      },
      {
        slug: "double-pendulum",
        title: "Double Pendulum",
        description: "Chaos in two arms. Tiny initial differences, wildly different paths.",
      },
    ],
  },
  {
    label: "Math",
    experiments: [
      {
        slug: "fourier",
        title: "Fourier",
        description: "Draw a shape. Rotating circles recreate it.",
      },
      {
        slug: "lsystem",
        title: "L-System",
        description: "Fractal trees from simple rewriting rules.",
      },
      {
        slug: "spectre",
        title: "Spectre",
        description: "The 2023 aperiodic monotile. One shape, infinite non-repeating tiling.",
      },
      {
        slug: "voronoi",
        title: "Voronoi",
        description: "Nearest-neighbor tessellation. Delaunay dual, drifting seeds, circumcircles.",
      },
    ],
  },
  {
    label: "Algorithms",
    experiments: [
      {
        slug: "sorting",
        title: "Sorting",
        description: "Eight algorithms race side-by-side. Pick three, tune the input.",
      },
      {
        slug: "pathfinding",
        title: "Pathfinding",
        description: "A* vs Dijkstra vs BFS. Draw walls, watch the search.",
      },
      {
        slug: "binary-tree",
        title: "Binary Tree",
        description: "AVL insertions with animated rotations and rebalancing.",
      },
      {
        slug: "dp-table",
        title: "DP Table",
        description: "Edit distance. Watch dynamic programming fill a table.",
      },
      {
        slug: "graph",
        title: "Graph",
        description: "Tarjan's algorithm. Find strongly connected components.",
      },
    ],
  },
  {
    label: "ML / AI",
    experiments: [
      {
        slug: "attention-heads",
        title: "Attention Heads",
        description: "Multi-head self-attention. Different heads learn different patterns.",
      },
      {
        slug: "kv-cache",
        title: "KV Cache",
        description: "Key-value caching turns O(n\u00B2) generation into O(n). Watch it grow.",
      },
      {
        slug: "token-sampling",
        title: "Token Sampling",
        description: "Temperature, top-K, top-P. How LLMs choose the next word.",
      },
      {
        slug: "speculative-decoding",
        title: "Speculative Decoding",
        description: "Draft fast, verify once. Cascade rejection on mismatch.",
      },
      {
        slug: "moe-routing",
        title: "Mixture of Experts",
        description: "Sparse routing. Each token activates a fraction of the network.",
      },
      {
        slug: "embedding-space",
        title: "Embedding Space",
        description: "Words as vectors. Semantic clusters, nearest neighbors, vector arithmetic.",
      },
      {
        slug: "tokenizer",
        title: "Tokenizer (BPE)",
        description: "Byte-pair encoding. How text becomes tokens before the model sees it.",
      },
      {
        slug: "beam-search",
        title: "Beam Search",
        description: "Tree of candidates, pruned by score. Greedy vs beam width comparison.",
      },
    ],
  },
  {
    label: "Data Structures",
    experiments: [
      {
        slug: "wavelet-tree",
        title: "Wavelet Tree",
        description:
          "Recursive alphabet splitting. Bitvectors at every node, rank queries in O(log \u03C3).",
      },
      {
        slug: "xor-filter",
        title: "XOR Filter",
        description: "Hypergraph peeling builds a fingerprint table. Three XORs answer membership.",
      },
      {
        slug: "learned-index",
        title: "Learned Index",
        description: "ALEX. Piecewise linear models replace B-tree pages. The CDF is the index.",
      },
      {
        slug: "cuckoo-filter",
        title: "Cuckoo Filter",
        description: "Fingerprints in a cuckoo hash table. Insertions kick, chains cascade.",
      },
    ],
  },
];
