import type { WidgetId } from "./widget-id";

export type Highlight = { text: string; pdfText?: string; widget?: WidgetId };

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
      overview:
        "Operating at Staff scope across a 45-person engineering org: own production LLM products, the Kubernetes ML platform, and source-system integrations.",
    },
    highlights: [
      {
        text: "Co-led AI product delivery for **Canon**, replacing fixed clinical-note templates with a block-based system that learns each customer's structure from examples. Built the evaluation and evidence-gated rollout around deterministic diffs, LLM-as-judge over semantic differences, and clinician calibration. Cutover proceeded customer by customer, and clinician edit rate per section fell from roughly 60% to 40%.",
        pdfText:
          "Co-led AI product delivery for **Canon**, a block-based LLM system that learns each customer's structure. Evidence-gated evaluation and rollout - deterministic diffs, LLM-as-judge, clinician calibration - cut edit rate from roughly 60% to 40%.",
      },
      {
        text: "Shipped the first production clinical-note **LLM system** with two teammates in 16 days across 3 services: graph-based orchestration with Postgres checkpointing, BAAI/bge-m3 embeddings + Milvus retrieval, dual-detector PHI anonymization (Presidio + LLM), SSE streaming, and an admin review UI. Onboarding shipped as an agent skill for iteration speed, with the hardening plan written down up front.",
        pdfText:
          "Shipped the first production **LLM system** with two teammates in 16 days across 3 services: checkpointed graph, embeddings + Milvus retrieval, PHI anonymization, SSE streaming, and review UI.",
      },
      {
        text: "Built the **AI evaluation and feedback loop** with the voice and product teams: clinician edits attributed to the block that produced the text, per-block performance statistics, and edit-pattern dashboards. Turned prioritization debates into measured user behavior and gave clinicians the deciding vote on what ships next.",
        pdfText:
          "Built the **AI evaluation and feedback loop**: edits attributed to source blocks, per-block performance stats, and pattern dashboards that let measured user behavior prioritize improvements.",
      },
      {
        text: "Own the **Kubernetes ML platform** the org deploys on: Istio ambient mesh, ArgoCD app-of-apps with Kustomize overlays, KServe + vLLM self-hosted model serving (embeddings, ASR), Langfuse for LLM observability, Milvus for vector search - 13 namespaces / 9 services. Built with the platform team; new services ship with a Helm chart and an ArgoCD app, cost stayed flat, and six engineers contribute regularly.",
        pdfText:
          "Own the **Kubernetes ML platform**: Istio ambient mesh, ArgoCD, KServe + vLLM model serving, Langfuse, and Milvus across 13 namespaces / 9 services. Cost stayed flat; six engineers contribute regularly.",
      },
      {
        text: 'Designed a **production shadow evaluation** with the voice team: both diarization variants generated on sampled real sessions, the delivered note never waits, and go-live is a reviewer-gated config change. The design answers "does speaker attribution improve the output?" with production traffic and zero patient-facing exposure.',
        pdfText:
          "Designed a **production shadow evaluation** on sampled sessions: both variants run, delivered notes never wait, and activation remains reviewer-gated.",
      },
      {
        text: "Led the **MongoDB → PostgreSQL/PostGIS** migration of 100M+ clinical analysis records with the data and CV teams; heavy queries dropped from >5s to <500ms. Own the chain from schemas through Python treatment-recommendation algorithms to TypeScript integrations across 10+ versions.",
        pdfText:
          "Led the **MongoDB -> PostgreSQL/PostGIS** migration of 100M+ records; cut heavy queries from >5s to <500ms. Own schemas, Python algorithms, and TypeScript integrations across 10+ versions.",
        widget: "compounding-arc",
      },
      {
        text: "Built the end-to-end **voice-to-clinical-note product**: offline-resilient React/browser capture, BullMQ async processing, transcription, structured LLM summarization, and practice-management-system context. More than 60K TypeScript LOC across client and API.",
        pdfText:
          "Built the end-to-end **voice-to-clinical-note product**: offline-resilient React capture, BullMQ async processing, transcription, LLM summarization, and PMS context.",
      },
      {
        text: "Delivered the unified-appointments backend behind the **largest dental services organization (DSO) contract** in the United States - vault practice search, dual-mode practice support, legacy PMS integration optimizations.",
        pdfText:
          "Built the unified-appointments backend behind the **largest U.S. DSO contract**, including vault search, dual-mode practices, and legacy PMS optimizations.",
        widget: "huddle",
      },
      {
        text: "Run the bi-weekly **Backend Guild** (18+ months): typed query patterns (Kysely + footgun-prevention bots) adopted org-wide, AI-assisted developer tooling, architecture decisions written down as ADRs.",
        pdfText:
          "Run the bi-weekly **Backend Guild**: org-wide typed-query patterns, AI developer tooling, and written ADRs.",
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
