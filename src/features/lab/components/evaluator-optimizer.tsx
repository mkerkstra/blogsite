import type { ReactNode } from "react";

import { AgentPatternCanvas, type AgentPatternConfig } from "./agent-pattern-canvas";

const config: AgentPatternConfig = {
  title: "Evaluator Optimizer",
  subtitle: "One model generates, another evaluates, and the loop stops when the rubric passes.",
  tone: "amber",
  initialPace: "busy",
  scenarios: [
    {
      id: "loop",
      label: "loop",
      caption:
        "A generator drafts, an evaluator scores against a rubric, and feedback drives revision.",
      nodes: [
        {
          id: "request",
          label: "Request",
          detail: "The task arrives with an explicit success criterion.",
          x: 0.1,
          y: 0.5,
          type: "user",
        },
        {
          id: "generator",
          label: "Generator",
          detail: "The optimizer proposes the next candidate answer or patch.",
          x: 0.38,
          y: 0.5,
          type: "worker",
        },
        {
          id: "evaluator",
          label: "Evaluator",
          detail: "A separate pass checks the candidate against concrete criteria.",
          x: 0.64,
          y: 0.28,
          type: "review",
        },
        {
          id: "done",
          label: "Accepted",
          detail: "The loop exits only when the score clears the threshold or budget ends.",
          x: 0.88,
          y: 0.5,
          type: "state",
        },
      ],
      edges: [
        { from: "request", to: "generator", label: "prompt" },
        { from: "generator", to: "evaluator", label: "candidate" },
        { from: "evaluator", to: "generator", label: "feedback", bend: 64, dashed: true },
        { from: "evaluator", to: "done", label: "pass" },
      ],
      metrics: [
        { label: "quality signal", value: 0.84 },
        { label: "token spend", value: 0.62 },
        { label: "stop clarity", value: 0.76 },
      ],
    },
    {
      id: "rubric",
      label: "rubric",
      caption: "The pattern works best when the evaluator has a crisp rubric instead of taste.",
      nodes: [
        {
          id: "candidate",
          label: "Candidate",
          detail: "A draft can be code, prose, plan, extraction, or answer.",
          x: 0.16,
          y: 0.48,
          type: "worker",
        },
        {
          id: "tests",
          label: "Tests",
          detail: "Deterministic checks catch syntax, schema, or behavioral regressions.",
          x: 0.45,
          y: 0.25,
          type: "tool",
        },
        {
          id: "judge",
          label: "Judge",
          detail: "An LLM judge handles semantic quality when exact tests are insufficient.",
          x: 0.45,
          y: 0.68,
          type: "review",
        },
        {
          id: "decision",
          label: "Decision",
          detail: "The orchestrator accepts, retries, or escalates based on the combined score.",
          x: 0.82,
          y: 0.48,
          type: "control",
        },
      ],
      edges: [
        { from: "candidate", to: "tests", label: "run" },
        { from: "candidate", to: "judge", label: "score" },
        { from: "tests", to: "decision", label: "signal" },
        { from: "judge", to: "decision", label: "signal" },
      ],
      metrics: [
        { label: "quality signal", value: 0.9 },
        { label: "token spend", value: 0.5 },
        { label: "stop clarity", value: 0.88 },
      ],
    },
    {
      id: "drift",
      label: "drift",
      caption:
        "Vague feedback produces churn: the optimizer keeps changing shape without converging.",
      nodes: [
        {
          id: "generator",
          label: "Generator",
          detail: "Without a stable target, each retry can optimize a different property.",
          x: 0.24,
          y: 0.5,
          type: "worker",
        },
        {
          id: "critic",
          label: "Critic",
          detail: "Subjective critique can improve tone while leaving correctness unstable.",
          x: 0.54,
          y: 0.28,
          type: "review",
        },
        {
          id: "budget",
          label: "Budget",
          detail: "A max-turn limit stops runaway iteration when the rubric cannot.",
          x: 0.78,
          y: 0.62,
          type: "state",
        },
      ],
      edges: [
        { from: "generator", to: "critic", label: "draft" },
        { from: "critic", to: "generator", label: "try again", bend: 70, dashed: true },
        { from: "critic", to: "budget", label: "cap" },
        { from: "budget", to: "generator", label: "stop?", bend: -40, dashed: true },
      ],
      metrics: [
        { label: "quality signal", value: 0.42 },
        { label: "token spend", value: 0.82 },
        { label: "stop clarity", value: 0.28 },
      ],
    },
  ],
};

export function EvaluatorOptimizer({ info }: { info?: ReactNode }) {
  return <AgentPatternCanvas config={config} info={info} />;
}
