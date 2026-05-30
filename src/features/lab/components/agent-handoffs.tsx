import type { ReactNode } from "react";

import { AgentPatternCanvas, type AgentPatternConfig } from "./agent-pattern-canvas";

const config: AgentPatternConfig = {
  title: "Agent Handoffs",
  subtitle: "Transfer control between agents or states when the conversation reaches a boundary.",
  tone: "violet",
  initialPace: "busy",
  scenarios: [
    {
      id: "state",
      label: "state",
      caption: "A state variable determines which specialist owns the next turn.",
      nodes: [
        {
          id: "user",
          label: "User",
          detail: "The same conversation can move through multiple operating modes.",
          x: 0.1,
          y: 0.5,
          type: "user",
        },
        {
          id: "router",
          label: "Router",
          detail: "A tool call or state update changes the active agent.",
          x: 0.36,
          y: 0.5,
          type: "control",
        },
        {
          id: "state",
          label: "State",
          detail: "The active agent is explicit, inspectable, and durable across turns.",
          x: 0.58,
          y: 0.26,
          type: "state",
        },
        {
          id: "agent",
          label: "Specialist",
          detail: "The selected agent gets the tools and prompt that match the current stage.",
          x: 0.82,
          y: 0.5,
          type: "worker",
        },
      ],
      edges: [
        { from: "user", to: "router", label: "intent" },
        { from: "router", to: "state", label: "set active" },
        { from: "state", to: "agent", label: "configure" },
        { from: "agent", to: "user", label: "reply", bend: 90, dashed: true },
      ],
      metrics: [
        { label: "turn continuity", value: 0.84 },
        { label: "precondition safety", value: 0.74 },
        { label: "handoff overhead", value: 0.48 },
      ],
    },
    {
      id: "sequence",
      label: "sequence",
      caption:
        "Handoffs are strongest when each stage unlocks the next one after required data exists.",
      nodes: [
        {
          id: "collect",
          label: "Collect",
          detail: "The first agent gathers required identifiers and consent.",
          x: 0.16,
          y: 0.5,
          type: "worker",
        },
        {
          id: "verify",
          label: "Verify",
          detail: "The next agent checks policy, account state, or eligibility.",
          x: 0.4,
          y: 0.28,
          type: "review",
        },
        {
          id: "act",
          label: "Act",
          detail: "Only after prerequisites pass can the action agent use write tools.",
          x: 0.64,
          y: 0.5,
          type: "tool",
        },
        {
          id: "close",
          label: "Close",
          detail: "The final agent confirms outcome and records the result.",
          x: 0.86,
          y: 0.5,
          type: "state",
        },
      ],
      edges: [
        { from: "collect", to: "verify", label: "id present" },
        { from: "verify", to: "act", label: "eligible" },
        { from: "act", to: "close", label: "receipt" },
      ],
      metrics: [
        { label: "turn continuity", value: 0.72 },
        { label: "precondition safety", value: 0.9 },
        { label: "handoff overhead", value: 0.38 },
      ],
    },
    {
      id: "bounce",
      label: "bounce",
      caption: "Too many ambiguous transfers can make the user repeat context and lose trust.",
      nodes: [
        {
          id: "agent-a",
          label: "Agent A",
          detail: "A broad prompt can hand off too early.",
          x: 0.22,
          y: 0.4,
          type: "worker",
        },
        {
          id: "agent-b",
          label: "Agent B",
          detail: "The receiving agent may not have enough state to continue cleanly.",
          x: 0.55,
          y: 0.24,
          type: "worker",
        },
        {
          id: "agent-c",
          label: "Agent C",
          detail: "A third transfer is often a symptom of missing ownership rules.",
          x: 0.72,
          y: 0.62,
          type: "worker",
        },
        {
          id: "user",
          label: "User",
          detail: "The user feels the boundary when agents ask for information twice.",
          x: 0.36,
          y: 0.72,
          type: "user",
        },
      ],
      edges: [
        { from: "agent-a", to: "agent-b", label: "maybe" },
        { from: "agent-b", to: "agent-c", label: "maybe", dashed: true },
        { from: "agent-c", to: "user", label: "ask again", dashed: true },
        { from: "user", to: "agent-a", label: "restart", bend: -46, dashed: true },
      ],
      metrics: [
        { label: "turn continuity", value: 0.34 },
        { label: "precondition safety", value: 0.42 },
        { label: "handoff overhead", value: 0.84 },
      ],
    },
  ],
};

export function AgentHandoffs({ info }: { info?: ReactNode }) {
  return <AgentPatternCanvas config={config} info={info} />;
}
