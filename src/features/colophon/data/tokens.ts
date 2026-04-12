export type TokenGroup = {
  label: string;
  tokens: { name: string; variable: string }[];
};

export const tokenGroups: TokenGroup[] = [
  {
    label: "Surface",
    tokens: [
      { name: "Background", variable: "--background" },
      { name: "Foreground", variable: "--foreground" },
      { name: "Card", variable: "--card" },
      { name: "Card Foreground", variable: "--card-foreground" },
    ],
  },
  {
    label: "Interactive",
    tokens: [
      { name: "Primary", variable: "--primary" },
      { name: "Secondary", variable: "--secondary" },
      { name: "Accent", variable: "--accent" },
    ],
  },
  {
    label: "Muted",
    tokens: [
      { name: "Muted", variable: "--muted" },
      { name: "Muted Foreground", variable: "--muted-foreground" },
    ],
  },
  {
    label: "Chrome",
    tokens: [
      { name: "Border", variable: "--border" },
      { name: "Ring", variable: "--ring" },
    ],
  },
];
