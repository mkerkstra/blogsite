export const aiPositioning = {
  targetRoleFamilies: [
    {
      title: "Staff AI Engineer",
      fit: "Primary",
      rationale:
        "Production LLM product ownership spanning evaluation, retrieval, model integration, backend services, rollout, and user feedback.",
    },
    {
      title: "Staff Applied AI Engineer",
      fit: "Primary",
      rationale:
        "Turns ambiguous workflow problems into measurable AI systems with human calibration and behavioral feedback loops.",
    },
    {
      title: "Staff AI Platform Engineer",
      fit: "Strong adjacent",
      rationale:
        "Owns Kubernetes model serving, GitOps delivery, vector retrieval, observability, and a shared platform used by six engineers.",
    },
  ],
  evidence: [
    {
      label: "AI product delivery",
      proof:
        "Shipped a production LLM system with two teammates in 16 days across three services, including checkpointed orchestration, retrieval, privacy controls, streaming, and review UI.",
    },
    {
      label: "Evaluation and feedback",
      proof:
        "Combined deterministic diffs, LLM-as-judge, clinician calibration, shadow evaluation, and attributed edit signals; cut edit rate per section from roughly 60% to 40%.",
    },
    {
      label: "Inference and platform",
      proof:
        "Owns a Kubernetes ML platform with KServe, vLLM, Langfuse, Milvus, Istio, and ArgoCD across 13 namespaces and nine services while keeping cost flat.",
    },
    {
      label: "Backend and data depth",
      proof:
        "Led a 100M+ record MongoDB-to-PostgreSQL/PostGIS migration that reduced heavy queries from more than five seconds to under 500 milliseconds; owns the chain from schemas through Python algorithms to TypeScript integrations.",
    },
    {
      label: "Full-stack AI delivery",
      proof:
        "Built an offline-resilient React capture flow, asynchronous TypeScript processing, transcription, LLM summarization, and practice-system integration across client and API.",
    },
    {
      label: "Staff-level influence",
      proof:
        "Runs the bi-weekly Backend Guild, authors ADRs, established org-wide patterns, and enables six regular contributors without relying on a management title.",
    },
  ],
  boundaries: [
    "The evidence supports production AI systems, evaluation, retrieval, serving, reliability, and product integration.",
    "The resume does not claim foundation-model research, pretraining, fine-tuning, CUDA or Triton kernel work, or people management.",
    "Clinical AI is the current proof domain, not a restriction on target industry or role family.",
  ],
} as const;
