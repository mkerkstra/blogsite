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
}))[] = [{
  name: 'TypeScript',
  kind: 'technical',
  tool: 'language',
  link: 'https://www.typescriptlang.org/',
  experience: '3Y',
  why: `It allows separating business logic from implementation details to be baked into your design patterns. 
            If a product has the good fortune of lasting through the lifecycle of a framework, good static typing will 
            allow devs to make a stronger, more confident case.`,
}, {
  name: 'GraphQL',
  kind: 'technical',
  tool: 'standard',
  link: 'https://graphql.org/',
  experience: '3Y',
  why: `GraphQL - and in particular, GrapQL written in a 
          TypeScript environment solve a lot of the complains we have with REST.`,
}, {
  name: 'React-Query',
  kind: 'technical',
  tool: 'library',
  link: 'https://react-query.tanstack.com/',
  experience: '1Y',
  why: ``,
},
{
  name: 'NoSQL',
  kind: 'technical',
  tool: 'standard',
  link: 'https://hostingdata.co.uk/nosql-database/',
  experience: `3Y`,
  why: `NoSQL gives a faster ramp up time from the product perspective. 
    Particularly with typescript/react, it's easier to think in terms of objects rather than tables.`,
}, {
  name: 'Relational',
  kind: 'technical',
  tool: 'standard',
  link: 'https://dl.acm.org/doi/10.1145/362384.362685',
  experience: '3Y',
  why: `Relational databases can  give a lot more flexibility/introperability 
  than NoSQL when dealing with well-structured data.`,
},
{
  name: 'Research',
  kind: 'soft',
  trait: `Being able to read through really dense code or vague compliance requirements`,
  anecdote: `A 20 year old product migration, a proof-of-concept of movingACH, CCPA`,
}, {
  name: 'Mentorship',
  kind: 'soft',
  trait: `Onboarding and cultivating growth in early career devs`,
  anecdote: `The first company I worked for, I met a lot of really capable developers. 
    We'd all started around the same time, but these folks did not have much in terms of SWE education. 
    The onboarding process was essentially a mini-bootcamp/project teaching COBOL and pick basic. 
    I made a really solid group of friends there, when I came to the realization 
    I was stuck in a cycle of empty promises from management, 
    I started investing my time working in modern web frameworks and running hackathons amongst my friends. 
    2/3 of us wound up being able to find much greener pastures.`,
}];
