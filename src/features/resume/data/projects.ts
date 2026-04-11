import type { WidgetId } from "./widget-id";

export type Project = {
  name: string;
  url: string;
  href: string;
  blurb: string;
  role: string;
  widget?: WidgetId;
};

export const projects: Project[] = [
  {
    name: "Narrative Nexus",
    url: "narrative.sh",
    href: "https://narrative.sh",
    blurb:
      "AI-powered companion for tabletop RPG dungeon masters. Co-built with a group of long-time friends who are also software devs.",
    role: "TypeScript · Next.js · Go",
  },
];
