import type { WidgetId } from "./widget-id";

export type Highlight = { text: string; widget?: WidgetId };

export type Company = {
  name: string;
  link?: string;
  blurb: string;
};

export type Role = {
  title: string;
  time: {
    start: Date;
    end?: Date;
  };
  location: string;
  overview?: string;
};

export type Job = {
  company: Company;
  role: Role;
  highlights: Highlight[];
};

export const experience: Job[] = [
  {
    company: {
      name: "VideaHealth",
      link: "https://www.videahealth.com/",
      blurb: "AI-powered dental diagnostics.",
    },
    role: {
      title: "Senior Software Engineer",
      time: {
        start: new Date("2023-05-01"),
      },
      location: "Remote",
      overview: "#1 contributor of 45+ engineers across 5 repositories. Operating at Staff scope.",
    },
    highlights: [
      {
        text: "Architected and shipped a production AI clinical-note templating system from empty repo to production in **16 days** across 3 services. Graph-based LLM pipeline with Postgres-backed checkpointing, semantic section matching via BAAI/bge-m3 embeddings + Milvus, dual-detector PHI anonymization (Presidio + LLM), SSE streaming, and an admin review UI with structured rich-text editing.",
      },
      {
        text: "Built the production **Kubernetes ML platform** from an empty repo. Istio ambient mesh, ArgoCD app-of-apps with Kustomize overlays, KServe + vLLM for self-hosted model serving (embeddings, ASR), Langfuse for LLM observability, Milvus for vector search. 13 namespaces / 9 services. Cost stayed flat; new services deploy with a Helm chart and an ArgoCD app. Six engineers now contribute regularly.",
      },
      {
        text: "Led **MongoDB → PostgreSQL/PostGIS** migration of a clinical analyses data model (100M+ records); cut heavy queries from >5s to <500ms. Unlocked a multi-year cascade of product capabilities - spatial segmentation storage, per-patient overlays, and the clinical recommendation engine in production today. Own every layer of that chain, from schema through Python algorithms to TypeScript integration across 10+ versions.",
        widget: "compounding-arc",
      },
      {
        text: "Built an end-to-end **voice-to-clinical-note pipeline**: offline-resilient browser capture (OPFS, Service Workers), Jotai recording state, BullMQ async processing, transcription, structured LLM summarization, multi-language support. Migrated the service into the ML cluster for direct in-mesh access to inference infra. 60K+ TS LOC across client and API.",
      },
      {
        text: "Delivered the unified-appointments backend that landed the **largest dental services organization (DSO) contract** in the United States - vault practice search, dual-mode practice support, optimizations for legacy PMS integrations.",
        widget: "huddle",
      },
      {
        text: "Established a **Kubeflow**-based experimentation framework standardizing data versioning and model promotion across the ML org.",
      },
      {
        text: "Run the bi-weekly **Backend Guild** (18+ months) driving cross-team architectural alignment. Drove org-wide adoption of typed query patterns (Kysely + footgun-prevention bots) and AI-assisted developer tooling - first mover on Cursor rules, CLAUDE.md, and MCP integrations a year before mainstream.",
      },
    ],
  },
  {
    company: {
      name: "Paperspace",
      link: "https://www.paperspace.com/",
      blurb: "MLOps as a service. Acquired by DigitalOcean.",
    },
    role: {
      title: "Software Engineer",
      time: {
        start: new Date("2022-06-01"),
        end: new Date("2023-03-01"),
      },
      location: "Remote",
    },
    highlights: [
      {
        text: "Rebuilt Node.js + Stripe billing to support **2.5× YoY revenue growth** while keeping payments under 200 ms.",
      },
      {
        text: "Implemented real-time fraud and sanctions checks that shut down illicit GPU crypto-mining from embargoed regions, **reducing chargebacks >50%**.",
        widget: "fraud-filter",
      },
    ],
  },
  {
    company: {
      name: "Hotel Engine",
      link: "https://www.hotelengine.com/about-us/",
      blurb: "A hotel booking platform and lodging performance network.",
    },
    role: {
      title: "Senior Software Engineer / Software Engineer",
      time: {
        start: new Date("2021-07-01"),
        end: new Date("2022-06-01"),
      },
      location: "Remote",
    },
    highlights: [
      {
        text: "Introduced bundle splitting, CDN routing, and feature flags, shrinking **mean deploy time from 15 min to 6 min** for 40+ engineers.",
      },
      {
        text: "Drove Redux → React Query migration, reducing cold-start data fetches 40% and bundle size 20%.",
        widget: "coldstart",
      },
    ],
  },
  {
    company: {
      name: "Reynolds & Reynolds",
      link: "https://www.reyrey.com/company",
      blurb: "Industry leader in automotive technology and digitization.",
    },
    role: {
      title: "Software Developer",
      time: {
        start: new Date("2019-02-01"),
        end: new Date("2021-06-01"),
      },
      location: "Houston, TX",
    },
    highlights: [
      {
        text: "Converted a 20-year-old version-control system for F&I forms from VB6/SQL to COBOL + Pick BASIC - responsible for distributed delivery, usage tracking & billing, and integration with F&I systems. Assumed lead role two weeks after onboarding and delivered on schedule.",
        widget: "reyrey-terminal",
      },
    ],
  },
];
