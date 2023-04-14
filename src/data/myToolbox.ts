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
  tool: 'language' | 'framework' | 'library' | 'database' | 'platform' | 'ide' | 'standard' | 'CI/CD' | 'ORM';
  /** link to the tool's website  or documentation */
  link: string;
})> =
[
  {
    name: `tRPC`,
    kind: 'technical',
    tool: 'library',
    link: 'https://trpc.io/',
    description: `End-to-end typesafety is really appealing and with typescript's performance improvements, 
    using this library in an enterprise-grade application is now feasible.
    Previously, the codegen available with graphql was the best way to marry 
    types between the client and server, but tRPC solves a good amount of those problems.
    `,
  },
  {
    name: `Terraform`,
    kind: 'technical',
    tool: 'platform',
    link: 'https://www.terraform.io/',
    description: `Automating the provisioning and configuration of infrastructure 
    allows us to makes these changes within source control. 
    IaC is a beautiful thing - it reduces the risk of human error and increases
    the efficiency and reliability of infrastructure deployment.
    Most infrastructure providers support terraform and it's a smell if they don't.
    `,
  },
  {
    name: `Prisma`,
    kind: 'technical',
    tool: 'ORM',
    link: 'https://www.prisma.io/',
    description: `Prisma solves an absurd amount of headaches 
    while being darn-near as flexible as a query builder like knex.
    Migrations are cleaner, dataloader patterns are obsolete as queries are similarly cached prisma's query engine.
    I've been watching prisma grow the past couple of years and I still nerd-out when they release features. 
    `,
  },
  {
    name: `Docker`,
    kind: 'technical',
    tool: 'platform',
    link: 'https://www.docker.com/',
    description: `Docker is a platform for building, 
    shipping, and running applications in a containerized environment. 
    Containers provide an isolated and lightweight environment for running applications, 
    making it easier to deploy and manage software across different environments. 
    Docker enables developers to package their applications and dependencies into a portable container image, 
    which can be run on any Docker-enabled host without worrying about differences in the underlying infrastructure.`,
  },
  {
    name: `Kubernetes`,
    kind: 'technical',
    tool: 'platform',
    link: 'https://kubernetes.io/',
    description: `K8s is a container orchestration platform. designed to automate the deployment, 
    scaling, and management of containerized applications.
    While docker is a platform for building and running containerized applications, 
    kubernetes is more focused on managed applications at scale.
    Kubernetes provides a framework for deploying and managing containers across multiple hosts, 
    running on a distributed infrastructure. 
    It provides a powerful set of features for managing containerized workloads, including horizontal 
    scaling, self-healing, and rolling updates, and can 
    be integrated with a variety of other tools and platforms in the container ecosystem.`,
  },
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
      TypeScript environment solve a lot of the complaints with REST. 
      That being said, it adds a lot of complexity to the stack, maintaining the codegen and 
      schema parity can be a headache, and the learning curve is an uphill battle across a team.
      RPC, on the other hand, is a lot more intuitive for developers.
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
      For small projects I love using tools like 
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
      I love postgresql and have been able to use it professionaly in a few different contexts.
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
