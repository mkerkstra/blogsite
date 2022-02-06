import React from 'react';
import {professionalExperience} from '../components/professionalExperience';
import {devToolbox} from '../components/devToolbox';


const myExperience = professionalExperience([{
  company: {
    name: `Reynolds and Reynolds`,
    link: `https://www.reyrey.com/company`,
    quickOverview: 'An industry leader in automotive technology and digitization.',
    size: `Privately-held medium-size (4,300 employees) company`,
  },
  role: {
    title: 'Software Developer',
    time: {
      start: '02/2019',
      end: '06/2021',
    },
    overview: `I worked in a team that provided tools used by Dealerships in 
      their Finance and Insurance departments (commonly called backoffice or F&I). 
      `,
  },
  projects: [
    {
      title: 'Form Library Version Control',
      overview: `I began on an project moving an internal tool used for version control, deployment, and billing.
      This tool was written in visual basic, SQL and deployed to distributed systems where the installation 
      process was ran in PICK basic. We rewrote it to use a new CI/CD process 
      (previously was tape then FTP) in just COBOL and PICK basic.`,
      growth: [{
        point: `I ramp up quickly.`,
        details: `Two weeks after I started the lead quit without notice.
          I stepped up, took over her responsibilities in terms of designing the core 
          processes of version control & content delivery.`,
      }, {
        point: `When there are tough truths about the state of a project, I am able to 
          articulate the issue and be an advocatate for the codebase.`,
        details: `After diving into what the lead had sketched up and a lot of discussions 
          with as many senior folks I could bounce ideas off of, 
          we reached the conclusion the direction of the version control & distribution 
          would be problematic at scale. Building up support and laying out 
          the options to tackle our concerns was a great learning experience.`,
      }, {
        point: `Just like compliance or translation, 
          the costs to solve issues of scale increase over the lifespan of your product.`,
        details: `This project involved migrating from a 
          relational database to one that's document based.
          The SQL 2008 database we were migrating from was already having performance issues.
          Partly because of the 20 or so years of data sitting on it, partly because of neglect/feature creep.
          Those two facts plus having to switch to an archaic database language made this project quite the hat trick.
          The approach was to:\n

          1. Revisit the problem this product was solving.
            • Do customers actually use X piece of this product or was it a one-off asked by a customer long since gone?
            • If similar subdomains are used in similar ways, how do we bridge the gap between them?

          2. When dealing with some tables having records in the low 9 figures and in a stack where calls to the
            BE are always synchronous and the FE dumps after a call lasts longer than 15-20 seconds
            you can only do so much before you start relying on cron jobs and queues.
            We did what we could before reaching that point since maintaining cron jobs and
            queues can introduce bugs that are a bit more slack.

          3. Finally - negotiate retention with stakeholders and bake those
            into a post-process of the migration tests/staging data.`,
      }],
    },
    {
      title: 'COBOL/PICK basic => React/NestJS/PICK basic proof of concept ',
      overview: `Having a product last for many years is a wonderful problem. 
        To research through and work on software that was used in batch processing 
        before I was born was a great learning experience. 
        Pushing for modernizing that and then having the weight of a pandemic push 
        create a greater need for web-based solutions developing the need for web-based solutions was great timing. 
        I was in a position to build proof of concepts, research 
        and provide options for library and architectural decisions very early in my career.`,
      growth: [{
        point: `Importance of well-defined schema through the application`,
        details: `One of the main things I did was built an ORM. This would 
          not have been close to possible had the pick "dictionary" files were not diligently maintained.
          Investment in a product's type/database definitions/schema 
          pay off in terms of the lifespan of the product; making it more resistant to emerging product requirements
          and framework modernizations.
        `,
      }],
    },
  ],
},
{
  company: {
    name: `Hotel Engine`,
    link: `https://www.hotelengine.com/about-us/`,
    quickOverview: 'A hotel booking platform and lodging performance network.',
    size: 'Series B Scaleup/unicorn - 400 employees',
  },
  role: {
    title: 'Software Engineer',
    time: {
      start: '07/2021',
    },
    overview: `
    During the pandemic, a company that provided B2B hotel bookings hit my RADAR as a great fit for 
    me and two of my coworkers who had been going through interview prep and working on group projects 
    together while looking for other opportunities. After my cultural interview, 
    the two of them applied, we got through the rest of the process and all of us 
    earned an offer within a couple days of each other.
    
    The people I work with are incredibly important to me. 
    We can assign a monetary value to how much we can grow in a particular role. 
    Parts of that are internal - how much do we seek growth out; 
    other parts of that is the medium you are growing in; how much room do I have to grow,
    who do I have to look up to, who do I have to lean on.

    I have been incredibly fortunate to have been surrounded by truly competent engineeers 
    with a wide variety of experience, walks of life, and ideologies.
    `,
  },
  projects: [
    {
      title: `ACH integration with Plaid`,
      overview: `Adding the FE piece of an ACH integration with Plaid.`,
      growth: [
        {
          point: `The source of truth is the source.`,
          details: `Documentation can be a luxury. The source of truth is the source and, by extension, its behavior. 
          During implementation we quickly realized contradictions in the third party's 
          documentation and stated behavior of their SDK.
          The response from the backend dev I was working with was to submit that feedback to the third party, 
          commmunicate that to me, and inform me to double-check their FE SDK.
          That sound up being a good call and saved me a good amount of time debugging my piece of the solution. 
          Being able to dive into someone's code and understand it is an invaluable skill`,
        },
        {
          point: `Working in a narrower scope of an application`,
          details: `Previously, I had been pretty self-reliant/self-driven while working in a project. 
            The first epic I was given at this company required working solely 
            on the frontend piece of a large-scale integration. Communicating what was best to meet our 
            requirements and standards on the frontend didn't always align 1:1 with what the backend wanted to do. 
            Before, finding imperfect solutions that performed felt like compromise, 
            after this experience, I learned to think a little larger. 
            What's important for my slice of the codebase might not be best for another; 
            similarly what's best for the codebase ain't always 
            the best for the state of the product, or for the company.`,
        },
      ],
    },
    {
      title: `CCPA Compliance - cookie opt-out`,
      overview: `Setup strongly typed cookie management for the company's main 
      main application to meet CCPA and GDPR compliance.`,
      growth: [
        {
          point: `I can take abstract requirements, scope out and direct the work accurately and quickly.`,
          details: `Software Development is a unique blend of independent and collaborative work. 
          Being able to work given a wide range of requirements is a valuable skill in terms of 
          bridging any gaps on whatever feature, team, company you're working with. 
          In this case, I was given a very broad requirement - essentially,
          "get our application's use of cookies and our privacy policies CCPA compliant." 
          I broke this down into 
          1) Scoping out CCPA compliance, 
          2) Reaching out to the two folks who were SME in 
            compliance/accessibility for guidance to check the direction I was going.
          3) Feeding our interpretation of CCPA (and GDPR at this point) 
          compliance definitions to management and then legal.
          4) Write out test plan for manual QA, test cases for our unit testing.
          4) Getting the mechanics to work, and submitting rough draft of the copy & 
            UX to our product and design since they were lagging behind dev.
          5) Account for product & design feedback.
          6) Edit test plan if needed. Write out integration tests.
          7) QA & release.
          This is a skill all of us do at some level. Being able, willing, curious, and confident 
          enough to broaden your responsibilities to meet the needs of a problem 
          or the organization goes a long way towards becoming a workplace multiplyer.`,
        },
        {
          point: `Consideration or implementation of accessibility and compliance can be a costly afterthought.`,
          details: `Compliance, accessibility, translation. 
          All of these can throw an incredibly heavy monkey-wrench in any frontend architecture.
          From the start, it is on devs as much as it is on product to stress that fact. 
          It will always be a cost-benefit analysis, but it is imperative that devs advocate/extoll the potential 
          costs of adding these after the fact in an enterprise-grade solution.`,
        },
      ],
    },
    {
      title: `Migrating class-based API calls to React-Query custom hooks`,
      overview: `Led an initiative to move our main product's API calls to React-Query custom hooks.`,
      growth: [
        {
          point: `Large-scale standard and pushes to pay down technical 
            debt within an active product on a team that is very rapidly scaling
            is only possible with patience, diligence, and, most importantly,
            by making it an improvement for the DX as much as it is for the performance or scalability of the product.`,
          details: `The trick to improving standard ain't identifying the issue and 
            providing options or a direction to address it. It's adoption. 
            I started with a bit more cowboy code process, realized that wasn't going to work,
            and switched up the approach to one that first focused on
            improving the DX to lower the threshhold required for adoption within in-flight tickets or feature work.
            This began with creating utilities around our custom hooks, building up our types and 
            constants like route definitions etc to shepherd folks towards the newer patterns.
            Then, for our dedicated tickets, the first subtask was to beef up our
            integration tests around a component we were going to migrate. To make that easier,
            we migrated our tests from Nock to a pretty slick MSW pattern inspired by some of the features in PollyJS.
            The endpoints mocked out by MSW were built to mirror the patterns used for our react-query custom hooks
            to guide folks away from the deprecated API calls.`,
        },
      ],
    },
  ],
}]);

const myToolbox = devToolbox([{
  name: 'TypeScript',
  kind: 'technical',
  tool: 'language',
  link: 'https://www.typescriptlang.org/',
  experience: 'TS - 2019',
  why: `It allows separating business logic from implementation details to be baked into your design patterns. 
            If a product has the good fortune of lasting through the lifecycle of a framework, good static typing will 
            allow devs to make a stronger, more confident case.`,
}, {
  name: 'GraphQL',
  kind: 'technical',
  tool: 'standard',
  link: 'https://graphql.org/',
  experience: '2019',
  why: `GraphQL - and in particular, GrapQL written in a 
          TypeScript environment solve a lot of the complains we have with REST.`,
}, {
  name: 'Document Databases',
  kind: 'technical',
  tool: 'standard',
  link: 'https://hostingdata.co.uk/nosql-database/',
  experience: 'PickBasic/AQL - 2019, MongoDB - 2020',
  why: `Speed of development`,
}, {
  name: 'Relational Databases',
  kind: 'technical',
  tool: 'standard',
  link: 'https://dl.acm.org/doi/10.1145/362384.362685',
  experience: 'SQL 2008 - 2019, PostGres - 2021',
  why: 'Joins',
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
}]);

const classes = {
  container: `max-w-3xl mx-auto`,
  section: `w-full relative mx-auto my-4`,
  header: `
    text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200
  `,
};

export default function Resume() {
  return (
    <div className={classes.container}>
      <section className={`
        ${classes.section}`
      }>
        <h2 className={classes.header}>Where I&apos;ve Worked</h2>
        <div className={`rounded border-2`}>{myExperience}</div>
      </section>
      <section className={`
        ${classes.section}`
      }>
        <h2 className={classes.header}>Tools I Love to Work With</h2>
        {myToolbox}
      </section>
      <section className={`${classes.section}`}>
        <h2 className={classes.header}>People I love to learn from:</h2>
      </section>
    </div>
  );
}
