/**
 * Centralized glossary for lab experiment "how it works" panels.
 * Used by the <Term> component to show inline tooltip definitions.
 */
export const glossary: Record<string, string> = {
  // GPU / Graphics
  "fragment-shader": "A GPU program that runs once per pixel, computing the final color output.",
  "vertex-shader":
    "A GPU program that runs once per vertex, transforming positions before rasterization.",
  framebuffer:
    "An off-screen render target. Shaders read from one and write to another to chain passes.",
  texel: "A single pixel in a texture, the texture equivalent of a screen pixel.",
  "transform-feedback":
    "A GPU feature that writes vertex shader output back to a buffer, keeping the entire simulation on the GPU without CPU roundtrips.",
  sdf: "Signed distance field. A function that returns the distance from any point to the nearest surface, negative inside.",
  "additive-blending":
    "A compositing mode where pixel colors add together. Overlapping bright regions glow.",
  "gl-points": "A WebGL draw mode that renders each vertex as a single screen-space point sprite.",
  "gaussian-splat":
    "A soft, bell-curve-shaped injection of value (velocity, dye, etc.) centered on a point.",

  // Math / Physics
  "divergence-free":
    "A vector field with no sources or sinks. Fluid flowing through it neither compresses nor expands.",
  "curl-noise":
    "A velocity field derived from the curl of a noise function. Guaranteed divergence-free, producing smooth, swirling flow.",
  laplacian:
    "A second-order spatial derivative that measures how a value at a point differs from its neighbors. Drives diffusion.",
  "navier-stokes":
    "The fundamental equations of fluid motion, relating velocity, pressure, viscosity, and external forces.",
  "helmholtz-hodge":
    "A decomposition that splits any vector field into a divergence-free part and a curl-free (gradient) part.",
  "jacobi-iteration":
    "An iterative method for solving linear systems. Each pass refines the estimate using neighbors' previous values.",
  "runge-kutta":
    "A fourth-order ODE integrator (RK4). Evaluates the derivative four times per step for high accuracy.",
  "verlet-integration":
    "A position-based physics integrator. Velocity is implicit in the difference between current and previous position.",
  "gauss-seidel":
    "An iterative constraint solver. Each pass propagates corrections further across a mesh.",
  "vorticity-confinement":
    "A technique that re-injects rotational energy lost to numerical dissipation, keeping small swirls alive.",
  chemotaxis: "Movement of an organism toward or away from a chemical signal gradient.",
  "semi-lagrangian":
    "An advection scheme that traces each cell backward through the velocity field to sample where it came from. Unconditionally stable.",
  "hausdorff-dimension":
    "A measure of fractal complexity. Non-integer values indicate a shape is rougher than its topological dimension.",
  "limit-cycle":
    "A closed trajectory in phase space that nearby orbits converge to or diverge from.",
  "phase-space":
    "The space of all possible states of a system, where each axis is a variable (x, y, z, etc.).",
  "invariant-measure":
    "The probability distribution describing where a chaotic system spends its time over the long run.",

  // Signal processing
  dft: "Discrete Fourier Transform. Decomposes a finite signal into a sum of sinusoids at integer frequencies.",
  epicycle:
    "A circle whose center moves along another circle. Nested epicycles can trace any closed curve.",

  // CS / Algorithms
  "balance-factor":
    "Left subtree height minus right subtree height. AVL trees keep this within +/-1 at every node.",
  "avl-rotation":
    "A local tree restructuring (single or double) that restores balance after an insertion or deletion.",
  "red-black-tree":
    "A self-balancing BST using node coloring. Less strict than AVL (height up to 2x optimal), so fewer rotations on insert.",
  bst: "Binary search tree. Left children are smaller, right children are larger.",
  "low-link":
    "The smallest discovery time reachable from a node's DFS subtree, including back edges. Used to find SCC roots.",
  scc: "Strongly connected component. A maximal set of nodes where every node can reach every other.",
  "priority-queue":
    "A data structure that always returns the element with the highest (or lowest) priority. Typically a binary heap.",
  heuristic: "An estimated cost to the goal. A* uses it to prioritize which nodes to explore next.",
  "edit-distance":
    "The minimum number of insertions, deletions, and substitutions to transform one string into another.",
  "turing-complete": "Capable of simulating any computation, given enough time and space.",
  "glider-gun":
    "A Game of Life pattern that periodically emits gliders, enabling signal propagation.",

  // Data structure terms
  bitvector:
    "A compact array of 0/1 bits supporting fast rank (count 1s up to position i) and select (find the i-th 1) queries.",
  "rank-query": "Count how many times a value appears up to a given position in a sequence.",
  "select-query": "Find the position of the i-th occurrence of a value in a sequence.",
  "zero-order-entropy":
    "The minimum bits per symbol needed to encode a string, considering only individual symbol frequencies.",
  fingerprint:
    "A short hash (typically 8-16 bits) representing an element. Compact but allows false positives.",
  "cuckoo-hashing":
    "A hash table scheme where each key maps to two candidate buckets. Collisions are resolved by evicting existing items to their alternate bucket.",
  hypergraph:
    "A generalization of a graph where each edge (hyperedge) can connect three or more vertices.",
  peeling:
    "Iteratively removing degree-1 vertices from a hypergraph until empty. If successful, the structure is solvable.",
  gf2: "The finite field with two elements (0 and 1). Arithmetic is XOR for addition and AND for multiplication.",
  cdf: "Cumulative distribution function. Maps a value to the fraction of data points less than or equal to it.",
  "gapped-array":
    "A sorted array with reserved empty slots, allowing O(1) amortized inserts without shifting all elements.",

  // ML / AI
  autoregressive:
    "Generating one token at a time, each conditioned on all previous tokens. The standard mode for LLM text generation.",
  "kv-cache":
    "A memory buffer storing previously computed key and value vectors so they don't need recomputing at each generation step.",
  "attention-weights":
    "Scores (summing to 1) that determine how much each token influences the representation of another token.",
  softmax:
    "A function that converts raw scores (logits) into a probability distribution. Each output is between 0 and 1, and they sum to 1.",
  logits:
    "The raw, unnormalized scores a model outputs before softmax. Higher logits mean higher probability after normalization.",
  "query-vector":
    "The vector a token uses to 'ask' what it should attend to. Dot-producted against key vectors to compute attention scores.",
  "key-vector":
    "The vector a token exposes for other tokens to match against. Part of the attention mechanism's lookup table.",
  "prompt-caching":
    "Storing KV pairs for shared prompt prefixes across API requests. Cache hits skip prefill, reducing latency and cost.",
  ttl: "Time to live. How long a cached entry remains valid before expiration. Anthropic's prompt cache uses a 5-minute TTL.",
  "rejection-sampling":
    "A technique that accepts or rejects samples based on a ratio of target to proposal distributions. Guarantees the output matches the target distribution.",
  "forward-pass":
    "A single run of input through the neural network to produce output. In verification, all draft tokens are checked in one forward pass.",
  "draft-model":
    "A small, fast model that proposes candidate tokens during speculative decoding. Its speed makes up for occasional rejections.",
  "feed-forward":
    "The dense neural network layer in each transformer block. MoE replaces this with multiple smaller expert networks.",
  "gating-network":
    "A small network that computes routing scores, deciding which experts process each token. Also called the router.",
  "auxiliary-loss":
    "An extra loss term added during training to encourage balanced expert utilization, preventing popular-expert collapse.",
  "sparse-activation":
    "Only a subset of model parameters are active for any given input. MoE activates K of N experts per token.",
  "nucleus-sampling":
    "Top-P sampling. Selects from the smallest set of tokens whose cumulative probability exceeds a threshold P.",
  temperature:
    "A scaling factor applied to logits before softmax. Lower values sharpen the distribution (more deterministic), higher values flatten it (more random).",
  "top-k-sampling":
    "Truncates the probability distribution to the K highest-probability tokens, then renormalizes before sampling.",
  "attention-head":
    "One of several parallel attention mechanisms in a transformer layer. Each head learns different patterns independently.",
  "self-attention":
    "An attention mechanism where tokens in the same sequence attend to each other, computing contextual representations.",
  "head-pruning":
    "Removing redundant or unimportant attention heads from a trained model to reduce computation with minimal quality loss.",
  coreference:
    "When two expressions in text refer to the same entity. E.g., 'the cat' and 'it' in 'the cat sat because it was tired.'",

  // Swarm / Agent
  "emergent-behavior":
    "Complex global patterns arising from simple local rules with no central coordination.",
  "perception-radius":
    "The range within which an agent detects neighbors. Beyond this distance, other agents are invisible.",

  // Tiling / Geometry
  "aperiodic-tiling":
    "A tiling of the plane that covers every point with no gaps or overlaps, but whose pattern never repeats by translation.",
  "einstein-problem":
    "Can a single shape tile the plane only aperiodically? Open from 1961 until the spectre tile solved it in 2023.",
  monotile:
    "A single tile shape that admits a tiling of the plane. An aperiodic monotile forces non-repeating patterns.",
  "substitution-tiling":
    "A tiling built by recursively replacing each tile with a cluster of smaller copies. Each level of the hierarchy is called a supertile.",

  // Misc
  "pearson-classification":
    "A mapping of Gray-Scott (F, k) parameters to pattern regimes: spots, stripes, mitosis, coral growth, and more.",
  "sphere-tracing":
    "A ray marching technique that steps forward by the SDF distance at each point, guaranteeing it never overshoots the surface.",
  "domain-repetition":
    "Using modular arithmetic (fmod) on ray position to tile a single shape infinitely across space.",
  "perlin-noise":
    "A smooth, gradient-based pseudorandom noise function. Produces natural-looking turbulence when layered in octaves.",

  // Embeddings
  "word-embedding":
    "A mapping from words to dense numerical vectors. Nearby vectors have similar meanings.",
  "learned-representation":
    "A vector representation discovered by training on data, not designed by hand. The model learns which features matter.",
  "vector-arithmetic":
    "Arithmetic on embedding vectors that captures semantic relationships. Directions in the space encode consistent meaning shifts.",
  "cosine-similarity":
    "A measure of angle between two vectors, from -1 (opposite) to 1 (identical). Used to quantify semantic similarity.",
  "contextual-embedding":
    "An embedding that changes based on surrounding words. 'Bank' gets different vectors near 'river' vs 'money.'",
  rag: "Retrieval augmented generation. Fetch relevant external context first, then provide it to a language model when generating.",
  "top-k-retrieval":
    "Returning the K highest-scoring matches for a query. Larger K improves recall but adds noise and context cost.",
  umap: "Uniform Manifold Approximation and Projection. Reduces high-dimensional vectors to 2D or 3D for visualization while preserving local neighborhoods.",
  "approximate-nearest-neighbor":
    "A class of algorithms (HNSW, IVF, ScaNN) that trade a little recall for huge speed wins on large vector sets. Standard for production retrieval.",
  hnsw: "Hierarchical Navigable Small World. A layered graph index for approximate nearest-neighbor search. Sub-millisecond at ~0.98 recall on millions of vectors.",
  pgvector:
    "A Postgres extension that stores vectors as a column type and supports <=> (cosine distance), <-> (L2), and <#> (inner product) with HNSW/IVFFlat indexes.",

  // Tokenization
  "bpe-tokenizer":
    "A tokenizer that uses byte-pair encoding to break text into subword tokens. The standard for modern LLMs.",
  "byte-pair-encoding":
    "An algorithm that iteratively merges the most frequent adjacent pair of symbols until a target vocabulary size is reached.",
  "subword-tokenization":
    "Splitting text into pieces between characters and whole words. Handles unseen words while keeping common words as single tokens.",
  "compression-ratio":
    "The ratio of input characters to output tokens. Higher ratios mean more efficient encoding. English BPE typically achieves 3-4x.",

  // Chaos / Double Pendulum
  "double-pendulum":
    "Two rigid arms connected end to end, free to swing under gravity. A classic example of chaotic motion.",
  "deterministic-chaos":
    "Behavior that is fully determined by initial conditions yet practically unpredictable due to extreme sensitivity to those conditions.",
  "sensitive-dependence":
    "The property that arbitrarily small changes in initial state lead to exponentially diverging trajectories over time.",
  "lyapunov-exponent":
    "A measure of how fast nearby trajectories diverge. Positive values indicate chaos; the larger the value, the faster the divergence.",
  "lagrangian-mechanics":
    "A reformulation of classical mechanics using kinetic and potential energy rather than forces. Natural for constrained systems like pendulums.",

  // Voronoi / Delaunay
  "voronoi-diagram":
    "A partition of space where every point is assigned to the nearest seed. Boundaries are equidistant from adjacent seeds.",
  "delaunay-triangulation":
    "The dual of a Voronoi diagram. A triangulation where no point lies inside any triangle's circumcircle.",
  circumcircle:
    "The unique circle passing through all three vertices of a triangle. Its center is equidistant from all three vertices.",
  "bowyer-watson":
    "An incremental algorithm for Delaunay triangulation. Insert points one by one, removing and re-triangulating violated circumcircles.",
  "lloyd-relaxation":
    "Iteratively moving each seed to the centroid of its Voronoi cell. Converges to an evenly-spaced distribution called a centroidal Voronoi tessellation.",

  // Beam Search
  "beam-search":
    "A search algorithm that keeps the top-B scoring partial sequences at each step. Beam width 1 is greedy search.",
  "greedy-decoding":
    "Always selecting the highest-probability token at each step. Fast but misses globally better sequences.",
  "cumulative-probability":
    "The product of probabilities along a path. Beam search maximizes this over the full sequence, not just each step.",
  "sequence-score":
    "The log-probability of a complete generated sequence. Often length-normalized to avoid favoring short outputs.",
};
