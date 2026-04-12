export type LighthouseCategory = {
  id: string;
  label: string;
  description: string;
};

export const lighthouseCategories: LighthouseCategory[] = [
  {
    id: "performance",
    label: "Performance",
    description:
      "Measures how fast your page loads and becomes interactive. The key metrics are Largest Contentful Paint (how long until the main content is visible), Cumulative Layout Shift (how much the page jumps around as it loads), and Interaction to Next Paint (how fast the page responds to user input).",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description:
      "Tests whether your site works for everyone, including people using screen readers, keyboard navigation, or high-contrast modes. Checks semantic HTML structure, color contrast ratios, ARIA labels, and focus management.",
  },
  {
    id: "bestPractices",
    label: "Best Practices",
    description:
      "Validates security and modern web standards. Checks for HTTPS, no console errors, no deprecated APIs, correct image aspect ratios, and proper document structure.",
  },
  {
    id: "seo",
    label: "SEO",
    description:
      "Evaluates how discoverable your site is to search engines. Checks for crawlable links, valid meta tags, descriptive titles, a sitemap, and a robots.txt that doesn't block important content.",
  },
];
