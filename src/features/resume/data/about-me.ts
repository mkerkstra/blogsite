export type AboutMe = {
  name: string;
  title: string;
  location: `${string}, ${string}`;
  blurb: string;
  contact: {
    email: string;
    phone: string;
    github: string;
    githubUrl: string;
    linkedin: string;
    linkedinUrl: string;
  };
};

export const aboutMe: AboutMe = {
  name: "Matt Kerkstra",
  title: "Staff AI Engineer",
  location: "Austin, TX",
  blurb:
    "Staff-level AI engineer with seven years building customer-facing production systems. At VideaHealth, I operate at Staff scope across 45 engineers, owning LLM product delivery from evaluation and retrieval through KServe/vLLM serving, Kubernetes operations, backend integrations, safe rollout, and user feedback. Cut clinician edit rate from roughly 60% to 40%, shipped production AI in 16 days, and enable six engineers across 13 namespaces and nine services. TypeScript, Python, Go, React, PostgreSQL.",
  contact: {
    email: "mattkerkstra@gmail.com",
    phone: "918-398-3588",
    github: "github.com/mkerkstra",
    githubUrl: "https://github.com/mkerkstra",
    linkedin: "linkedin.com/in/matt-kerkstra",
    linkedinUrl: "https://linkedin.com/in/matt-kerkstra",
  },
};
