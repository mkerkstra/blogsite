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
];
