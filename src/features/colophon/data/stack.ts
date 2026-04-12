export type StackItem = {
  label: string;
  value: string;
};

export const stack: StackItem[] = [
  { label: "Framework", value: "Next.js 16 (App Router)" },
  { label: "UI", value: "React 19" },
  { label: "Styling", value: "Tailwind CSS 4" },
  { label: "Language", value: "TypeScript 5.7" },
  { label: "Lint / Format", value: "oxlint + oxfmt" },
  { label: "Tests", value: "vitest + happy-dom" },
  { label: "Hosting", value: "Vercel" },
  { label: "Package Manager", value: "pnpm 10.x" },
];
