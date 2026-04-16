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
    ],
  },
  {
    label: "Algorithms",
    experiments: [
      {
        slug: "sorting",
        title: "Sorting",
        description: "Quicksort vs mergesort vs heapsort. Side-by-side race.",
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
