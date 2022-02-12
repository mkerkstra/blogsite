/**
 * If you were stuck on an island...
 */
export const myToolbox: Array<{
  /** The name of the tool/skill. */
  name: string;
  /** Benefits I see about using it or my experience with the skill. */
  description: string;
} & ({
  kind: 'soft'
} | {
  kind: 'technical';
  /** what kind of technical tool is this? */
  tool: 'language' | 'framework' | 'library' | 'database' | 'platform' | 'ide' | 'standard' | 'CI/CD';
  /** link to the tool's website  or documentation */
  link: string;
})> =
[
  {
    name: 'TypeScript',
    kind: 'technical',
    tool: 'language',
    link: 'https://www.typescriptlang.org/',
    description: `
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
    description: `
      GraphQL - and in particular, GrapQL written in a 
      TypeScript environment solve a lot of the complains we have with REST.
    `,
  },
  {
    name: 'React-Query',
    kind: 'technical',
    tool: 'library',
    link: 'https://react-query.tanstack.com/',
    description: `
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
    description: `
      SWR is a library that allows you to write data fetching and caching logic in a functional style.
      Minimalistic abstraction - a great building block for building exactly what you need.
    `,
  },
  {
    name: 'Apollo',
    kind: 'technical',
    tool: 'library',
    link: 'https://www.apollographql.com/',
    description: `
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
    description: `
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
    description: `
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
    description: `
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
    description: `
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
    description: `
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
    description: `
      NoSQL gives a faster ramp up time from the product perspective. 
      Particularly with typescript/react, it's easier to think in terms of objects rather than tables.
    `,
  },
  {
    name: 'Relational',
    kind: 'technical',
    tool: 'standard',
    link: 'https://dl.acm.org/doi/10.1145/362384.362685',
    description: `
      Relational databases can  give a lot more flexibility/introperability 
      than NoSQL when dealing with well-structured data.
    `,
  },
  {
    name: 'Research',
    kind: 'soft',
    description: `
      Being able to read through really dense code or vague compliance requirements
      A 20 year old product migration, a proof-of-concept of movingACH, CCPA
    `,
  },
  {
    name: 'Mentorship',
    kind: 'soft',
    description: `
      Onboarding and cultivating growth in early career devs
      The first company I worked for, I met a lot of really capable developers. 
      We'd all started around the same time, but these folks did not have much in terms of SWE education. 
      The onboarding process was essentially a mini-bootcamp/project teaching COBOL and pick basic. 
      I made a really solid group of friends there, when I came to the realization 
      I was stuck in a cycle of empty promises from management, 
      I started investing my time working in modern web frameworks and running hackathons amongst my friends. 
      2/3 of us wound up being able to find much greener pastures.
    `,
  },
  {
    name: 'GitHub Actions',
    kind: 'technical',
    tool: 'CI/CD',
    link: 'https://github.com/features/actions',
    description: `
      GH actions adds a ton of flexibility for welding your integraton to your deployment. 
    `,
  },
  {
    name: 'GitHub Copilot',
    kind: 'technical',
    tool: 'ide',
    link: `https://copilot.github.com/`,
    description: `
      GitHub copilot ain't always perfect, but when it's 
      pretty good at either interpolating the last 50-60% of what you're intending 
      to write or maybe even showing you an alternative you hadn't thought about yet.
      The trick to it is knowing when it's right.
    `,
  },
  {
    name: 'VS Code',
    kind: 'technical',
    tool: 'ide',
    link: `https://code.visualstudio.com/`,
    description: `
      Switching from sublime text to VS code blew my mind when it first came out.
      It felt almost as powerful as intelliJ, eclipse, or netbeans but as lightweight as sublime.
      It's flexible and personalization/settings as well as the portability/ease of collaboration
      with project settings and workspaces have cemented it as the leading tool used by developers.
    `,
  },
];
