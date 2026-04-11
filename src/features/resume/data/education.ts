export type Education = {
  school: string;
  schoolUrl?: string;
  degree: string;
  year: number;
  gpa?: number;
};

export const education: Education[] = [
  {
    school: "Rice University",
    schoolUrl: "https://www.rice.edu/",
    degree: "B.A.",
    year: 2018,
    gpa: 3.71,
  },
];
