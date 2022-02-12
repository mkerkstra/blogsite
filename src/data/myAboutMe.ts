export const myAboutMe: {
  name: string;
  title: string;
  location: `${string}, ${string}`;
  stack: 'Fullstack' | 'Frontend' | 'Backend' | 'DevOps' | 'Design';
  blurb: string;
} = {
  name: 'Matt Kerkstra',
  title: 'Senior Software Engineer',
  location: 'Austin, TX',
  stack: 'Fullstack',
  blurb: `
    I am a software engineer from Austin, Texas and 
    I've been slinging code since studying computer science at Rice University.
    
    Fullstack typescript is my comfort zone and I tend to drive products towards
    abstractions that both improve the developer experince of the team as well as 
    enshrine logic that makes sense for their business between their tables, schemas, and types.

    The best part of working in this space is being incentivized
    to constantly grow and cultivate growth in those around you.
  `,
};
