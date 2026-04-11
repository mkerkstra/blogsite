export type Project = {
  name: string;
  url: string;
  href: string;
  blurb: string;
  role: string;
};

export const projects: Project[] = [
  {
    name: "Narrative Nexus",
    url: "narrative.sh",
    href: "https://narrative.sh",
    blurb:
      "AI-powered companion for tabletop RPG dungeon masters. Co-built with longtime collaborators I've known since we started our engineering careers together at Reynolds & Reynolds.",
    role: "TypeScript · Next.js · Go",
  },
];
