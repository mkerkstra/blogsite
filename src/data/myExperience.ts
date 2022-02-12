import {RequireAtLeastOne} from 'type-fest';

type company = {
  link?: string;
  size: string;
  /** account for removing the company name if asked. */
} & RequireAtLeastOne<{
  name: string;
  quickOverview: string;
}>

type role = {
  title: string;
  time: {
    start: Date;
    /** set to "present" on undefined */
    end?: Date;
  };
  overview: string;
}

type project = {
  title: string;
  overview: string;
  growth: {
    point: string;
    details: string;
  }[];
}

export const myExperience: {
  company: company;
  role: role;
  projects: project[];
}[] =
[{
  company: {
    name: `Hotel Engine`,
    link: `https://www.hotelengine.com/about-us/`,
    quickOverview: 'A hotel booking platform and lodging performance network.',
    size: 'Series B Scaleup/unicorn - 400 employees',
  },
  role: {
    title: 'Software Engineer',
    time: {
      start: new Date('2021-07-07'),
    },
    overview: `
        Hotel Engine is a hotel booking platform and lodging performance network.
        I have been incredibly fortunate to have been surrounded by truly competent engineeers 
        with a wide variety of experience, walks of life, and ideologies.
        This company is wonderful to work for and, being a scaleup, each week is different from the last.
  
        The folks I work with I think of as a friends, I am able to make a 
        meaningful impact on the quality of the product, and I feel like I am growing as an engineer.
    `,
  },
  projects: [
    {
      title: `ACH integration`,
      overview: `Adding the FE piece of an ACH integration.`,
      growth: [
        {
          point: `The source of truth is the source.`,
          details: `
              Being able to dive into someone's code and understand it is an invaluable skill.

              Documentation can be a luxury. The source of truth is the source and, by extension, its behavior. 
              During implementation we quickly realized contradictions in the third party's 
              documentation and stated behavior of their SDK.
              The backend dev (a truly impressive engineer) working on this submitted feedback to the third party, 
              commmunicated that workaround to me, and I dug into the source of the 
              FE SDK rather than work off their docs.

          `,
        },
        {
          point: `Working in a narrower scope of an application`,
          details: `
              Previously, I had been pretty self-reliant/self-driven while working in a project. 
              The first epic I was given at this company required working solely 
              on the frontend piece of a large-scale integration. Communicating what was best to meet our 
              requirements and standards on the frontend didn't always align 1:1 with what the backend wanted to do. 
              Before, finding imperfect solutions that performed felt like compromise, 
              after this experience, I learned to think a little larger. 
              What's important for my slice of the codebase might not be best for another; 
              similarly what's best for the codebase ain't always 
              the best for the state of the product, or for the company.
            `,
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
          details: `
            Software Development is a unique blend of independent and collaborative work. 
            Being able to work given a wide range of requirements is a valuable skill in terms of 
            bridging any gaps on whatever feature, team, company you're working with. 
            In this case, I was given a very broad requirement - essentially,
            "get our application's use of cookies and our privacy policies CCPA compliant." 
            I broke this down into 
            \n1) Scoping out CCPA compliance, 
            \n2) Reaching out to the two folks who were SME in 
              compliance/accessibility for guidance to check the direction I was going.
            \n3) Feeding our interpretation of CCPA (and GDPR at this point) 
            compliance definitions to management and then legal.
            \n4) Write out test plan for manual QA, test cases for our unit testing.
            \n4) Getting the mechanics to work, and submitting rough draft of the copy & 
              UX to our product and design since they were lagging behind dev.
            \n5) Account for product & design feedback.
            \n6) Edit test plan if needed. Write out integration tests.
            \n7) QA & release.
            \nThis is a skill all of us do at some level. Being able, willing, curious, and confident 
            enough to broaden your responsibilities to meet the needs of a problem 
            or the organization goes a long way towards becoming a workplace multiplyer.
          `,
        },
        {
          point: `Consideration or implementation of accessibility and compliance can be a costly afterthought.`,
          details: `
              Compliance, accessibility, translation. 
              All of these can throw an incredibly heavy monkey-wrench in any frontend architecture.
              From the start, it is on devs as much as it is on product to stress that fact. 
              It will always be a cost-benefit analysis, but it is imperative that devs advocate/extoll the potential 
              costs of adding these after the fact in an enterprise-grade solution.
            `,
        },
      ],
    },
    {
      title: `Migrating class-based API calls to React-Query custom hooks`,
      overview: `Led an initiative to move our main product's API calls to React-Query custom hooks.`,
      growth: [
        {
          point: `
              Large-scale standard and pushes to pay down technical 
              debt within an active product on a team that is very rapidly scaling
              is only possible with patience, diligence, and, most importantly,
              by making it an improvement for the DX as much as it is for the performance or scalability of the product.
            `,
          details: `
              The trick to improving standard ain't identifying the issue and 
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
              to guide folks away from the deprecated API calls.
            `,
        },
      ],
    },
  ],
},
{
  company: {
    name: `Reynolds and Reynolds`,
    link: `https://www.reyrey.com/company`,
    quickOverview: 'An industry leader in automotive technology and digitization.',
    size: `Privately-held medium-size (4,300 employees) company`,
  },
  role: {
    title: 'Software Developer',
    time: {
      start: new Date('2019-02-04'),
      end: new Date('2021-06-21'),
    },
    overview: `I worked in a team that provided tools used by Dealerships in 
      their Finance and Insurance departments (commonly called backoffice or F&I). 
      `,
  },
  projects: [
    {
      title: 'Form Library Version Control',
      overview: `
          I began on an project moving an internal tool used for version control, deployment, and billing.
          This tool was written in visual basic, SQL and deployed to distributed systems where the installation 
          process was ran in PICK basic. We rewrote it to use a new CI/CD process 
          (previously was tape then FTP) in just COBOL and PICK basic.
        `,
      growth: [{
        point: `I ramp up quickly.`,
        details: `
            Two weeks after I started the lead quit without notice.
            I stepped up, took over her responsibilities in terms of designing the core 
            processes of version control & content delivery.
          `,
      }, {
        point: `
            When there are tough truths about the state of a project, I am able to 
            articulate the issue and be an advocatate for the codebase.
          `,
        details: `
            After diving into what the lead had sketched up and a lot of discussions 
            with as many senior folks I could bounce ideas off of, 
            we reached the conclusion the direction of the version control & distribution 
            would be problematic at scale. Building up support and laying out 
            the options to tackle our concerns was a great learning experience.
          `,
      }, {
        point: `
            Just like compliance or translation, 
            the costs to solve issues of scale increase over the lifespan of your product.
          `,
        details: `
            This project involved migrating from a 
            relational database to one that's document based.
            The SQL 2008 database we were migrating from was already having performance issues.
            Partly because of the 20 or so years of data sitting on it, partly because of neglect/feature creep.
            Those two facts plus having to switch to an archaic database language made this project quite the hat trick.
            \nThe approach was to:

            \n1. Revisit the problem this product was solving.
              \n• Do customers actually use X piece of this product or was 
                it a one-off asked by a customer long since gone?
              \n• If similar subdomains are used in similar ways, how do we bridge the gap between them?

            \n2. When dealing with some tables having records in the low 9 figures and in a stack where calls to the
              BE are always synchronous and the FE dumps after a call lasts longer than 15-20 seconds
              you can only do so much before you start relying on cron jobs and queues.
              We did what we could before reaching that point since maintaining cron jobs and
              queues can introduce bugs that are a bit more slack.

            \n3. Finally - negotiate retention with stakeholders and bake those
              into a post-process of the migration tests/staging data.
          `,
      }],
    },
    {
      title: `
          COBOL/PICK basic => React/NestJS/PICK basic proof of concept
        `,
      overview: `
          Having a product last for many years is a wonderful problem. 
          To research through and work on software that was used in batch processing 
          before I was born was a great learning experience. 
          Pushing for modernizing that and then having the weight of a pandemic push 
          create a greater need for web-based solutions developing the need for web-based solutions was great timing. 
          I was in a position to build proof of concepts, research 
          and provide options for library and architectural decisions very early in my career.
        `,
      growth: [{
        point: `Importance of well-defined schema through the application`,
        details: `
            One of the main things I did was built an ORM. This would 
            not have been close to possible had the pick "dictionary" files were not diligently maintained.
            Investment in a product's type/database definitions/schema 
            pay off in terms of the lifespan of the product; making it more resistant to emerging product requirements
            and framework modernizations.
          `,
      }],
    },
  ],
}];
