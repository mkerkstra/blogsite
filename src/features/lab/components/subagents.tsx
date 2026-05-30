import type { ReactNode } from "react";

import { AgentPatternCanvas, type AgentPatternConfig } from "./agent-pattern-canvas";

const config: AgentPatternConfig = {
  title: "Subagents",
  subtitle: "Delegate bounded work into separate context windows, then synthesize the result.",
  tone: "cyan",
  initialPace: "busy",
  scenarios: [
    {
      id: "isolate",
      label: "isolate",
      caption: "Verbose work stays inside the worker context; the parent gets a compact result.",
      nodes: [
        {
          id: "parent",
          label: "Parent",
          detail: "The main thread keeps the goal, constraints, and final synthesis.",
          x: 0.2,
          y: 0.46,
          type: "control",
        },
        {
          id: "worker",
          label: "Researcher",
          detail:
            "A task-specific subagent reads logs, docs, or tests without flooding the parent.",
          x: 0.55,
          y: 0.28,
          type: "worker",
        },
        {
          id: "summary",
          label: "Summary",
          detail: "Only findings, evidence, and unresolved questions return.",
          x: 0.82,
          y: 0.46,
          type: "state",
        },
      ],
      edges: [
        { from: "parent", to: "worker", label: "task prompt" },
        { from: "worker", to: "summary", label: "distill" },
        { from: "summary", to: "parent", label: "merge", bend: 70, dashed: true },
      ],
      metrics: [
        { label: "context preserved", value: 0.82 },
        { label: "parallelism", value: 0.28 },
        { label: "coordination cost", value: 0.32 },
      ],
    },
    {
      id: "parallel",
      label: "parallel",
      caption:
        "Independent lanes can run at the same time when their evidence paths do not depend on each other.",
      nodes: [
        {
          id: "parent",
          label: "Orchestrator",
          detail: "The parent divides the question and later checks for contradictions.",
          x: 0.12,
          y: 0.48,
          type: "control",
        },
        {
          id: "auth",
          label: "Auth lane",
          detail: "One subagent inspects permissions, roles, and session behavior.",
          x: 0.42,
          y: 0.22,
          type: "worker",
        },
        {
          id: "api",
          label: "API lane",
          detail: "Another reads contracts, handlers, and failing logs.",
          x: 0.48,
          y: 0.5,
          type: "worker",
        },
        {
          id: "ui",
          label: "UI lane",
          detail: "A third verifies the visible path and interaction states.",
          x: 0.42,
          y: 0.78,
          type: "worker",
        },
        {
          id: "synthesis",
          label: "Synthesis",
          detail: "The parent combines the lanes into one implementation decision.",
          x: 0.84,
          y: 0.5,
          type: "review",
        },
      ],
      edges: [
        { from: "parent", to: "auth", label: "scope" },
        { from: "parent", to: "api", label: "scope" },
        { from: "parent", to: "ui", label: "scope" },
        { from: "auth", to: "synthesis", label: "evidence" },
        { from: "api", to: "synthesis", label: "evidence" },
        { from: "ui", to: "synthesis", label: "evidence" },
      ],
      metrics: [
        { label: "context preserved", value: 0.76 },
        { label: "parallelism", value: 0.86 },
        { label: "coordination cost", value: 0.58 },
      ],
    },
    {
      id: "tools",
      label: "tools",
      caption:
        "Subagents become safer when their tools, model, and permission scope match the task.",
      nodes: [
        {
          id: "parent",
          label: "Parent",
          detail: "The parent delegates to a subagent whose permissions fit the risk.",
          x: 0.12,
          y: 0.5,
          type: "control",
        },
        {
          id: "safe",
          label: "Read-only",
          detail: "Research agents can be restricted to read, grep, docs, and shell inspection.",
          x: 0.42,
          y: 0.26,
          type: "worker",
        },
        {
          id: "worktree",
          label: "Worktree",
          detail:
            "Implementation agents can run in isolated checkouts when edits should not touch parent state.",
          x: 0.48,
          y: 0.62,
          type: "tool",
        },
        {
          id: "hook",
          label: "Hook",
          detail:
            "Lifecycle rules can validate or summarize subagent work at start and stop boundaries.",
          x: 0.82,
          y: 0.45,
          type: "review",
        },
      ],
      edges: [
        { from: "parent", to: "safe", label: "allowlist" },
        { from: "parent", to: "worktree", label: "isolate" },
        { from: "safe", to: "hook", label: "report" },
        { from: "worktree", to: "hook", label: "diff" },
      ],
      metrics: [
        { label: "context preserved", value: 0.72 },
        { label: "parallelism", value: 0.5 },
        { label: "coordination cost", value: 0.46 },
      ],
    },
  ],
};

export function Subagents({ info }: { info?: ReactNode }) {
  return <AgentPatternCanvas config={config} info={info} />;
}
