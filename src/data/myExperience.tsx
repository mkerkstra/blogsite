/* eslint-disable max-len */
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
    details: string | JSX.Element;
  }[];
}

export const myExperience: {
  company: company;
  role: role;
  projects: project[];
}[] =
[{
  company: {
    name: `Paperspace`,
    link: `https://www.paperspace.com/`,
    quickOverview: 'MLOps as a service.',
    size: `Startup - ≈40 employees`,
  },
  role: {
    title: `Fullstack Software Engineer`,
    time: {
      start: new Date('2022-06-05'),
      end: new Date('2023-03-06'),
    },
    overview: `
      In my role as a Full Stack Engineer for the Customer Platform Team, 
      I provided support across a broad range of areas, spanning the core and gradient products. 
      Specifically, I focused on optimizing the billing engine, managing teams and accounts, mitigating fraud, 
      implementing authorization and authentication protocols, improving devops processes, and enhancing testing infrastructure.
    `,
  },
  projects: [
    {
      title: `Billing Engine`,
      overview: `Maintained a legacy codebase for billing operations.`,
      growth: [
        {
          point: `Complex billing cycles necessitate versatile staging and development environments.`,
          details: `To ensure safe delivery of changes, multiple environments should be employed, some offset and with the same billing frequency, and some with increased frequency for iteration.`,
        },
        {
          point: `Transparency is crucial.`,
          details: `Billing calculations should be performed twice: once in the backend as the source of truth, and once in front of the user for transparency.`,
        },
        {
          point: `Clever billing practices won't compensate for a poor product.`,
          details: `Short-term revenue gains from unconventional billing strategies may harm long-term success.`,
        },
      ],
    },
    {
      title: `Team & account management`,
      overview: `Scoped-out project for a new ABAC => RBAC authorization architecture`,
      growth: [
        {
          point: `Done correctly, RBAC should shake out to ABAC with extra steps.`,
          details: `Hypothetically, if we have have roles for members and owners for a resource, we are likely checking for those roles adjacent to the protected action. If the logic for that action should need to be dispersed, then that authorization will need to be checked twice. ABAC, on the other hand, allows us to take those same actions and colocate them. As the amount of actions and their complexity scales, ABAC outperforms RBAC. RBAC, however, is quite a bit more user-friendly. The best way to address this is to support roles on top of ABAC. A secondary benefit of doing this roles scale horizontally and can even be user-created (outside of internal permissions, ownership etc.)`,
        },
      ],
    },
    {
      title: `Fraud mitigation`,
      overview: `Reduced fraud by ≈40% by enhancing account lifecycle, tuning Cloudflare settings, and refining account signup/verification flows.`,
      growth: [
        {
          point: `Leverage passive and active defenses for large attack surfaces.`,
          details: `Incorporate passive mitigation strategies, such as rate limiting, DNS firewall tuning, and DDoS mitigation, in addition to active approaches`,
        },
        {
          point: `Access logs are vital for fraud mitigation.`,
          details: `Maintaining a record of user CRUD events helps identify compliance issues, security gaps, and UX pitfalls`,
        },
      ],
    },
    {
      title: `Infrastructure`,
      overview: `Devops for the main API`,
      growth: [
        {
          point: `Choose EKS over ELB for modern applications.`,
          details: `Despite the learning curve, containerizing and deploying to a managed Kubernetes service is ideal for enterprise-level applications.`,
        },
        {
          point: `Infrastructure as code is a powerful concept.`,
          details: `Tools like Terraform allow for infrastructure change tracking and reproducibility, making the change process less intimidating`,
        },
        {
          point: `Maximize caching.`,
          details: `With storage being cheaper than compute, always utilize caching when possible.`,
        },
      ],
    },
    {
      title: `Test suites`,
      overview: `Promoting a healthy codebase requires a cultural approach, acknowledging that no one is perfect.`,
      growth: [
        {
          point: `Manual tests ran in the staging environments are likely good automated test cases.`,
          details: `Treat manual testing as the last line of defense. 
            If manual testing is the norm, the test suite needs improvement. 
            Writing a test should be as easy or easier than manually testing a change on staging.`,
        },
        {
          point: `Codegen, OpenAPI specs, and mocking third-party integrations are complementary.`,
          details: `Utilize open API specs provided by third parties to minimize the risk of updating API versions, and periodically update mocked APIs based on whether they're floating or versioned integrations.`,
        },
      ],
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
      start: new Date('2021-07-07'),
      end: new Date('2022-06-07'),
    },
    overview: `
      I was fortunate to have worked alongside a team of competent engineers with diverse experiences, 
      walks of life, and ideologies during my time at Hotel Engine. 
      As a scaleup, the company provided me with the opportunity to tackle a range of evolving problems each week. 
      I had the pleasure of working with colleagues who had become friends, making a meaningful impact on the quality of the product, 
      and growing as an engineer.
    `,
  },
  projects: [
    {
      title: `ACH integration`,
      overview: `Individual contributor for the front-end portion of an automated clearing-house payment solution via a third party to our flagship application.`,
      growth: [
        {
          point: `The source of truth is the source.`,
          details: `
            Documentation can be a luxury. Diving into someone's code and understanding it is an invaluable skill. The source of truth is the source and, by extension, its behavior. 
            
            During implementation, we quickly realized contradictions in the third party's documentation and stated behavior of their SDK. The backend dev (a truly impressive engineer) working on this submitted feedback to the third party, communicated that workaround to me, and I dug into the source of the FE SDK rather than work off their docs.`,
        },
        {
          point: `Working in a narrower scope of an application.`,
          details: `
          Previously, I had been pretty self-reliant/self-driven while working on a project. My first epic at this company required focusing only on the frontend piece of a third-party integration. 

          Communicating what was best to meet our requirements and standards on the front end didn't always align 1:1 with what the backend wanted to do. What's critical for my slice of the codebase might not be best for another; similarly, what's best for the codebase isn't always the best for the state of the product or the company. 

          Before, finding imperfect solutions that performed felt like a compromise; after this experience, I learned to think a little larger.
          `,
        },
      ],
    },
    {
      title: `CCPA Compliance - cookie opt-out`,
      overview: `Brought our cookie opt-out up solution up to CCPA &  GDPR compliance and built it around utilities that baked cookie settings/definitions into the utility's types.`,
      growth: [
        {
          point: `I can take abstract requirements and scope out the work, so execution is accurate, precise, and efficient.`,
          details:
          <>
            Software Development is a unique blend of independent and collaborative work. Working given a wide range of requirements is a valuable skill in bridging any gaps in a team or company. In this case, I received relatively general specifications - essentially, &quot;get our application&apos;s use of cookies and our privacy policies CCPA compliant.&quot;

            I broke this down into:
            <br />
            <ol className='list-decimal indent-8'>
              <li>Scoping out CCPA compliance</li>
              <li>Reaching out to the two folks who were SME in compliance/accessibility for guidance to check the direction I was going.</li>
              <li>Feeding our interpretation of CCPA (and GDPR at this point) compliance definitions to management and then legal.</li>
              <li>Write out test plan for manual QA, test cases for our unit testing.</li>
              <li>Getting the mechanics to work, and submitting rough draft of the copy &
              UX to our product and design since they were lagging behind dev.</li>
              <li>Account for product & design feedback.</li>
              <li>Edit test plan if needed. Write out integration tests.</li>
              <li>QA & release.</li>
            </ol>
          </>,
        },
        {
          point: `Consideration or implementation of accessibility and compliance can be a costly afterthought.`,
          details: `
            Compliance, accessibility, translation; any of these can throw a heavy monkey-wrench in any frontend architecture. It is on devs as much as product to stress that fact from the start. It will always be a cost-benefit analysis, but devs advocate/must extoll the potential costs of adding these after the fact in an enterprise-grade solution.
            `,
        },
      ],
    },
    {
      title: `Migrating class-based API calls to React-Query custom hooks`,
      overview: `Led an initiative to move our flagship product's API calls to React-Query custom hooks.`,
      growth: [
        {
          point: `
              It takes patience, diligence, and an organization that understands a quality developer experience is critical for having a quality product.
            `,
          details: `
            Paying down tech debt is essential at a scale-up. Discussions of standards strategies for tackling outdated syntax and patterns are a weekly, if not daily, occurrence. 
            
            Making progress in paying down tech debt while simultaneously onboarding at the rate of a scale-up is tricky. The approach I've found works best is not with the usual cowboy coding approach from a startup, and it's not from the architectural committees and process-driven initiatives of a scaled company; it's in a beautiful gray area between these two.            The trick to improving standard ain't identifying the issue and 
            
            It starts with initial productive discourse between a few developers to own a particular niche or library (usually ambitious mids or seniors who are SMEs in that area). Once consensus is reached on the issue and recommended strategy, that discussion widens to include engineering managers associated with that product area. The new pattern or library usage is adopted with at least the initial case by the initiative owners. Tickets that are pretty darn perfect for onboarding are created and dispersed to fill in any feature works the organization may have. 
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
    overview: `
      I worked in a team that provided tools used by Dealerships in their Finance and Insurance departments (commonly called front office or F&I).
      I started as a Software Developer, then shortly after my onboarding period, I informally took on the responsibilities of a supervisor/lead developer after an abrupt exit on my team.
    `,
  },
  projects: [
    {
      title: 'Form Library Version Control',
      overview: `
        My initial project was migrating an internal tool responsible for version control, deployment, and billing across most of my product area's software. It was originally written in visual basic, SQL, and it deployed software to distributed systems where the installation process was run in PICK basic. We rewrote it to use a new CI/CD process in just COBOL and PICK basic.`,
      growth: [
        {
          point: `I am comfortable rising to the occasion.`,
          details: `
            Two weeks after I started, our supervisor/lead quit without notice. I stepped up took over her responsibilities designing the core processes of version control & content delivery.
          `,
        },
        {
          point: `
            When there are harsh truths about the state of a project, I can articulate the issue, work towards a strategy, and cultivate discussions that hone in on our best path forward.            `,
          details: `
            I started diving into where the lead left off, which, unfortunately, wasn't as far as we'd thought. Working in a waterfall product cycle on an internal developer tool - the only place I could think to start was back at the scope. I went called or met up with every engineer (at least those still at the company) who had worked on this product and those who used it daily. 
            
            The goal was to get these answered:
            • What were we trying to achieve?
            • How does the current solution work? 
            • What pitfalls or kludges exist within the current solution?
            • What do the product's stakeholders need it to do?
            • What do the product's stakeholders view as its shortcomings?
            
            Eventually, we identified a solid strategy that would keep the scale of the project in scope throughout its entirety—the migration and the fact that we were moving from an RDBMS to a proprietary document-based database would need to remain at the front of our minds. Many late nights, coffee, and diagrams later, our billing regression tests were clean, and our migrations were completed. All without a hitch and on the original schedule.            `,
        },
      ],
    },
    {
      title: `
          Modern stack with proprietary database proof of concept
        `,
      overview: `
          Having a product last for many years is a wonderful problem. 
        `,
      growth: [
        {
          point: `Importance of well-defined schema through the application`,
          details: `
              One of the main things I did was built an ORM. This would not have been close to possible had the pick "dictionary" files were not diligently maintained.
              
              Investment in a product's type/database definitions/schema pay off in terms of the lifespan of the product; making it more resistant to emerging product requirements and framework modernizations.
            `,
        },
        {
          point: `Personal technical growth is only achieved by working with problems that challenge you.`,
          details: `
            To research through and work on software that was used in batch processing before I was born was a great learning experience. 
            
            Pushing for modernizing that and then having the weight of a pandemic push create a greater need for web-based solutions developing the need for web-based solutions set me up to work on truly interesting problems. 
            
            I was in a position to build proof of concepts, research and provide options for library and architectural decisions very early in my career.
          `,
        },
      ],
    },
  ],
}];
