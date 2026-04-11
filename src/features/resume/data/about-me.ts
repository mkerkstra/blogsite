export type AboutMe = {
  name: string;
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
  location: "Austin, TX",
  blurb:
    "Staff-level platform engineer. Seven years building production ML infrastructure and the systems other engineers run on. #1 of 45+ contributors across five repositories at my current employer — 2,076 commits, 1.5M LOC over three years. Built the Kubernetes ML platform, the model-serving stack, a voice-to-clinical-note pipeline, and a graph-based clinical AI application that shipped from architecture to production in sixteen days. Architectural bets compound: a single 2023 Postgres/PostGIS migration is still enabling new product surface in 2026.",
  contact: {
    email: "mattkerkstra@gmail.com",
    phone: "918-398-3588",
    github: "github.com/mkerkstra",
    githubUrl: "https://github.com/mkerkstra",
    linkedin: "linkedin.com/in/matt-kerkstra",
    linkedinUrl: "https://linkedin.com/in/matt-kerkstra",
  },
};
