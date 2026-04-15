export type Experiment = {
  slug: string;
  title: string;
  description: string;
};

export const experiments: Experiment[] = [
  {
    slug: "reaction-diffusion",
    title: "Reaction Diffusion",
    description: "Gray-Scott model. Two chemicals, simple rules, emergent complexity.",
  },
  {
    slug: "ray-march",
    title: "Ray March",
    description: "Signed distance fields. A 3D renderer in a fragment shader.",
  },
  {
    slug: "flow-field",
    title: "Flow Field",
    description: "120k particles in curl noise. Transform feedback, zero CPU.",
  },
];
