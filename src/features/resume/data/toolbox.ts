export type ToolGroupId =
  | "ml-llm"
  | "infrastructure"
  | "data"
  | "languages"
  | "app-stack"
  | "observability"
  | "soft";

export type ToolGroup = {
  id: ToolGroupId;
  label: string;
  blurb?: string;
  tools: Tool[];
};

export type Tool = {
  name: string;
  link?: string;
};

export const toolbox: ToolGroup[] = [
  {
    id: "ml-llm",
    label: "ML / LLM",
    tools: [
      { name: "Kubeflow", link: "https://www.kubeflow.org/" },
      { name: "KServe", link: "https://kserve.github.io/website/" },
      { name: "vLLM", link: "https://github.com/vllm-project/vllm" },
      { name: "LangGraph", link: "https://www.langchain.com/langgraph" },
      { name: "Langfuse", link: "https://langfuse.com/" },
      { name: "RAG" },
      { name: "Milvus", link: "https://milvus.io/" },
      { name: "BAAI/bge-m3", link: "https://huggingface.co/BAAI/bge-m3" },
      { name: "Presidio", link: "https://microsoft.github.io/presidio/" },
      { name: "AWS Bedrock", link: "https://aws.amazon.com/bedrock/" },
      { name: "Anthropic Claude", link: "https://www.anthropic.com/claude" },
      { name: "MCP", link: "https://modelcontextprotocol.io/" },
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    tools: [
      { name: "Kubernetes", link: "https://kubernetes.io/" },
      { name: "Istio (ambient mesh)", link: "https://istio.io/" },
      { name: "ArgoCD", link: "https://argo-cd.readthedocs.io/" },
      { name: "Helm", link: "https://helm.sh/" },
      { name: "Kustomize", link: "https://kustomize.io/" },
      { name: "Terraform", link: "https://www.terraform.io/" },
      { name: "Karpenter", link: "https://karpenter.sh/" },
      { name: "GitHub Actions", link: "https://github.com/features/actions" },
      { name: "cert-manager", link: "https://cert-manager.io/" },
      {
        name: "external-secrets",
        link: "https://external-secrets.io/",
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    tools: [
      { name: "PostgreSQL", link: "https://www.postgresql.org/" },
      { name: "PostGIS", link: "https://postgis.net/" },
      { name: "Aurora", link: "https://aws.amazon.com/rds/aurora/" },
      { name: "ClickHouse", link: "https://clickhouse.com/" },
      { name: "Snowflake", link: "https://www.snowflake.com/" },
      { name: "Kysely", link: "https://kysely.dev/" },
      { name: "Mongo → PG migrations" },
      { name: "Redis / Valkey", link: "https://valkey.io/" },
      { name: "BullMQ", link: "https://bullmq.io/" },
      { name: "Kafka", link: "https://kafka.apache.org/" },
    ],
  },
  {
    id: "languages",
    label: "Languages",
    tools: [
      { name: "TypeScript", link: "https://www.typescriptlang.org/" },
      { name: "Python", link: "https://www.python.org/" },
      { name: "Go", link: "https://go.dev/" },
      { name: "SQL" },
    ],
  },
  {
    id: "app-stack",
    label: "App Stack",
    tools: [
      { name: "NestJS", link: "https://nestjs.com/" },
      { name: "FastAPI", link: "https://fastapi.tiangolo.com/" },
      { name: "React", link: "https://react.dev/" },
      { name: "Next.js", link: "https://nextjs.org/" },
      { name: "Jotai", link: "https://jotai.org/" },
      {
        name: "React Query",
        link: "https://tanstack.com/query/latest",
      },
      { name: "Tiptap", link: "https://tiptap.dev/" },
      {
        name: "OPFS",
        link: "https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system",
      },
      {
        name: "Service Workers",
        link: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API",
      },
    ],
  },
  {
    id: "observability",
    label: "Observability",
    tools: [
      { name: "Grafana", link: "https://grafana.com/" },
      { name: "Tempo", link: "https://grafana.com/oss/tempo/" },
      { name: "Alloy", link: "https://grafana.com/oss/alloy/" },
      { name: "OpenTelemetry", link: "https://opentelemetry.io/" },
      { name: "Mimir", link: "https://grafana.com/oss/mimir/" },
      { name: "Loki", link: "https://grafana.com/oss/loki/" },
    ],
  },
];
