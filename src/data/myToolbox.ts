export const myToolbox: ({
  name: string;
} & ({
  kind: 'soft';
  /** what quality or trait of this soft skill provides value? */
  trait: string;
  /** occurence/anecdote demonstrating posession of quality/trait and how it benefited your team */
  anecdote: string;
} | {
  kind: 'technical';
  /** what kind of tool is this? */
  tool: 'language' | 'framework' | 'library' | 'database' | 'platform' | 'ide' | 'standard';
  /** link to the tool's website  or documentation */
  link: string;
  /** quick overview of my experience with the tool */
  experience: string;
  /** the benefits of using it. */
  why: string;
}))[] = [
  {
    name: 'TypeScript',
    kind: 'technical',
    tool: 'language',
    link: 'https://www.typescriptlang.org/',
    experience: '3Y',
    why: `
      It allows separating business logic from implementation details to be baked into your design patterns. 
      If a product has the good fortune of lasting through the lifecycle of a framework, good static typing will 
      allow devs to make a stronger, more confident case.
    `,
  },
  {
    name: 'GraphQL',
    kind: 'technical',
    tool: 'standard',
    link: 'https://graphql.org/',
    experience: '3Y',
    why: `
      GraphQL - and in particular, GrapQL written in a 
      TypeScript environment solve a lot of the complains we have with REST.
    `,
  },
  {
    name: 'React-Query',
    kind: 'technical',
    tool: 'library',
    link: 'https://react-query.tanstack.com/',
    experience: '1Y',
    why: `
      I have been involved with weighing this against 
      Apollo/client, Relay, and SWR at the start of a green-field application as well as strategizing and managing 
      a migration from class-based API calls towards react-query hooks within an enterprise application.
      React-query is a beautiful abstraction for handling 
      data synchronization between the client and the backend (both rest and graphql APIs are supported).
    `,
  },
  {
    name: 'SWR',
    kind: 'technical',
    tool: 'library',
    link: 'https://swr.vercel.app/',
    experience: '1Y',
    why: `
      SWR is a library that allows you to write data fetching and caching logic in a functional style.
      Minimalistic abstraction - a great building block for building exactly what you need.
    `,
  },
  {
    name: 'Apollo',
    kind: 'technical',
    tool: 'library',
    link: 'https://www.apollographql.com/',
    experience: '1Y',
    why: `
      Apollo provides frameworks for building GraphQL applications.
      I've used apollo/client and apollo/server on NestJS on a greenfield application.
      The tooling is powerful and schema parity is easy to achieve.
    `,
  },
  {
    name: 'NestJS',
    kind: 'technical',
    tool: 'library',
    link: 'https://nestjs.com/',
    experience: '2Y',
    why: `
      NestJS is a great opinionated framework. 
      It's efficient (uses express or fastify under the hood) and while it can feel like there's a 
      lot of boilerplate, it scales very well and eforces a standard.
      It has a healthy ecosystem of plugins and libraries.
    `,
  },
  {
    name: 'Fastify',
    kind: 'technical',
    tool: 'library',
    link: 'https://www.fastify.io/',
    experience: '2Y',
    why: `
      Fastify is a great node framework whose benchmarks blow express, koa, restify, etc out of the water.
      My experience with it was with a graphql api and a custom query builder
      library down to the document db within a greenfield application.
      It has a healthy ecosystem of plugins, contributors, and middleware
    `,
  },
  {
    name: 'React',
    kind: 'technical',
    tool: 'library',
    link: 'https://reactjs.org/',
    experience: '3Y',
    why: `
      I've been lucky in that all of my professional javascript/typescript
      experience has had react within the tech stack.
      React has pushed the field to a new level.
    `,
  },
  {
    name: 'Next.js',
    kind: 'technical',
    tool: 'library',
    link: 'https://nextjs.org/',
    experience: '1Y',
    why: `
      NextJS (and vercel as a whole really) has taken major pain points of
      react/web development and folded them out of the developer experience.
      It's wonderful to work with and it's exciting to watch vercel's ecosystem grow.
    `,
  },
  {
    name: 'Tailwind CSS',
    kind: 'technical',
    tool: 'library',
    link: 'https://tailwindcss.com/',
    experience: '1Y',
    why: `
      This site is built with Tailwind CSS. Their tagling is - a utility-first CSS framework.
      It's a great tool for building responsive, mobile-first layouts
      and I have learned quite a lot about css/design just from the standards it enforces.
    `,
  },
  {
    name: 'NoSQL',
    kind: 'technical',
    tool: 'standard',
    link: 'https://hostingdata.co.uk/nosql-database/',
    experience: `3Y`,
    why: `
      NoSQL gives a faster ramp up time from the product perspective. 
      Particularly with typescript/react, it's easier to think in terms of objects rather than tables.
    `,
  },
  {
    name: 'Relational',
    kind: 'technical',
    tool: 'standard',
    link: 'https://dl.acm.org/doi/10.1145/362384.362685',
    experience: '3Y',
    why: `
      Relational databases can  give a lot more flexibility/introperability 
      than NoSQL when dealing with well-structured data.
    `,
  },
  {
    name: 'Research',
    kind: 'soft',
    trait: `Being able to read through really dense code or vague compliance requirements`,
    anecdote: `
      A 20 year old product migration, a proof-of-concept of movingACH, CCPA
    `,
  },
  {
    name: 'Mentorship',
    kind: 'soft',
    trait: `Onboarding and cultivating growth in early career devs`,
    anecdote: `
      The first company I worked for, I met a lot of really capable developers. 
      We'd all started around the same time, but these folks did not have much in terms of SWE education. 
      The onboarding process was essentially a mini-bootcamp/project teaching COBOL and pick basic. 
      I made a really solid group of friends there, when I came to the realization 
      I was stuck in a cycle of empty promises from management, 
      I started investing my time working in modern web frameworks and running hackathons amongst my friends. 
      2/3 of us wound up being able to find much greener pastures.
    `,
  },
];
