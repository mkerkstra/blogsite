import React from 'react';
import {
  Container, Text,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Table, Tbody, Td, Tr,
  Drawer, DrawerCloseButton, DrawerHeader, DrawerContent,
} from '@chakra-ui/react';
import {RequireAtLeastOne} from 'type-fest';

/**
 * @param {args} args - Array of professional experience, broken into company information, role, growth, and accolades.
 * @param {args.company} args.company - includes name, a url to the
 *  about section of the company's website, and a quick overview that'll be rendered in a tooltip.
 * @param {args.role} args.role - this is what my role was at the company,
 *  how long I was there and a short overview of my responsibilities.
 * @param {args.growth} args.growth - a list of what I learned,
 *  either cultural or technical, during my time at the company.
 * @param {args.accolades} args.accolades - a list of accolades earned while
 * @return {JSX.Element} a section summarizing experience at a company.
 */
const professionalExperience = (args: {
  company: {
    link?: string;
    size?: string;
  } & RequireAtLeastOne<{
    name?: string;
    quickOverview?: string;
  }>
  role: {
    title: string;
    time: {
      start: `${number}/${number}`;
      /** set to "present" on undefined */
      end?: `${number}/${number}`;
    };
    overview: string;
  }
  projects: {
    title: string;
    overview: string;
    growth: {
      type: 'cultural' | 'technical';
      point: string;
      details: string;
    }[];
  }[],
  accolades: {
    shortName: string;
    description: string;
  }[];
}[]): JSX.Element => {
  return (
    <Container centerContent isFitted maxW='container.lg' className={`mt-2`}>
      <Tabs variant='solid-rounded' orientation='vertical' size='lg' colorScheme='gray'>
        <TabList>
          {args.map(({company}) => (
            <Tab key={company?.name ?? company.quickOverview}>{company?.name ?? company.quickOverview}</Tab>
          ))}
          <TabPanels>
            {args.map(({company, role, projects, accolades}, index) => (
              <TabPanel key={index}>
                <Tabs key={index} size='md'>
                  <TabList>
                    {Object.keys(args[index]).map((key) => (
                      <Tab key={key}>{key}</Tab>
                    ))}
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Table>
                        <Tbody>
                          <Tr>
                            <Td><Text>name: </Text></Td>
                            <Td><Text>size: </Text></Td>
                            <Td><Text>overview: </Text></Td>
                          </Tr>
                          <Tr>
                            <Td><Text>{company.name}</Text></Td>
                            <Td><Text>{company.size}</Text></Td>
                            <Td><Text>{company.quickOverview}</Text></Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TabPanel>
                    <TabPanel>
                      <Text>{role.title}</Text>
                      <Text>{role.time.start}/{role.time.end || `present`}</Text>
                      <Text>{role.overview}</Text>
                    </TabPanel>
                    <TabPanel>
                      <Tabs size='md'>
                        <TabList>
                          {projects.map(({title}) => (
                            <Tab key={title}>{title}</Tab>
                          ))}
                        </TabList>
                        <TabPanels>
                          {projects.map(({title, overview, growth: projectGrowth}) => (
                            <TabPanel key={title}>
                              <Text>{title}</Text>
                              <Text>{overview}</Text>
                              <Tabs size='sm'>
                                <TabList>
                                  {Object.entries(projectGrowth).map(([key, value]) => (
                                    <Tab key={key}>{value.point}</Tab>
                                  ))}
                                </TabList>
                                <TabPanels>
                                  {projectGrowth.map(({type, point, details}, index) => (
                                    <TabPanel key={index}>
                                      <Text>{type}</Text>
                                      <Text>{point}</Text>
                                      <Text>{details}</Text>
                                    </TabPanel>
                                  ))}
                                </TabPanels>
                              </Tabs>
                            </TabPanel>
                          ))}
                        </TabPanels>
                      </Tabs>
                    </TabPanel>
                    <TabPanel>
                      <Table>
                        {accolades.map(({shortName, description}) => (
                          <>
                            <Tr>
                              <Td><Text>name: </Text></Td>
                              <Td><Text>description: </Text></Td>
                            </Tr>
                            <Tr>
                              <Td><Text>{shortName}</Text></Td>
                              <Td><Text>{description}</Text></Td>
                            </Tr>
                          </>
                        ))}
                      </Table>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </TabPanel>
            ))}
          </TabPanels>
        </TabList>
      </Tabs>
    </Container>
  );
};

/**
 * @param {args} args - An array of soft and technical tools I consider vital to my job performance.
 * @return {JSX.Element} a section summarizing my development toolbox.
 */
const devToolbox = (args: ({
  name: string;
} & ({
  kind: 'soft';
  /** what quality or trait of this soft skill provides value? */
  trait: string;
  /** occurence/anecdote demonstrating posession of quality/trait and how it benefited your team */
  anecdote: string;
} | {
  kind: 'technical';
  /**  */
  tool: 'language' | 'framework' | 'library' | 'database' | 'platform' | 'ide' | 'standard';
  link: string;
  experience: string;
  why: string;
}))[]): JSX.Element => {
  return (
    <ul>
      {args.map((tool) => (
        <li key={tool.name}>
          <h3>{tool.name}</h3>
          {tool.kind === 'soft' && (
            <>
              <p>{tool.trait}</p>
              <p>{tool.trait}</p>
            </>
          )}
          {tool.kind === 'technical' && (
            <>
              <a href={tool.link}
                target='_blank'
                rel='noopener noreferrer'
              >
            More information
              </a>
              <p>{tool.experience}</p>
              <p>{tool.why}</p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

const myExperience = professionalExperience([{
  company: {
    name: `Reynolds and Reynolds`,
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
        type: 'cultural',
        point: `I ramp up quickly.`,
        details: `Two weeks after I started the lead quit without notice. 
          I stepped up, took over her responsibilities in terms of designing the core 
          processes of version control & content delivery.`,
      }, {
        type: 'technical',
        point: `When there are tough truths about the state of a project, I am able to 
          articulate the issue and be an advocatate for the codebase.`,
        details: `After diving into what the lead had sketched up and a lot of discussions 
          with as many senior folks I could bounce ideas off of, 
          we reached the conclusion the direction of the version control & distribution 
          would be problematic at scale. Building up support and laying out 
          the options to tackle our concerns was a great learning experience.`,
      }],
    },
    {
      title: 'COBOL/PICK basic => React/NestJS/PICK basic proof of concept ',
      overview: `.`,
      growth: [{
        type: 'technical',
        point: `Type.`,
        details: `Two weeks after I started the lead quit without notice. 
          I stepped up, took over her responsibilities in terms of designing the core 
          processes of version control & content delivery.`,
      }, {
        type: 'technical',
        point: `When there are tough truths about the state of a project, I am able 
        to articulate the issue and be an advocatate for the codebase.`,
        details: `After diving into what the lead had sketched up and a lot of discussions 
          with as many senior folks I could bounce ideas off of, 
          we reached the conclusion the direction of the version control & distribution would 
          be problematic at scale. Building up support and laying out 
          the options to tackle our concerns was a great learning experience.`,
      }],
    },
  ],
  accolades: [
    {
      shortName: 'Rising Star',
      description: `Earned for accepting responsibilities as a technical 
        lead on a challenging project soon after onboarding.`,
    },
    {
      shortName: 'Employee',
      description: `Earned for accepting responsibilities as a 
        technical lead on a challenging project soon after onboarding.`,
    },
  ],
},
{
  company: {
    name: `Hotel Engine`,
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
    I have been incredibly lucky to have been surrounded by truly competent engineeers 
    with a wide variety of experience, walks of life, ideologies; not any one of them alike.

    The amount of growth I have seen personally and professionally while in this role 
    has been equal parts exhausting and awe-inspiring. 
    My point being, know that I do not apply to any job lightly.`,
  },
  projects: [
    {
      title: `ACH integration with Plaid`,
      overview: `Adding the FE piece of an ACH integration with Plaid.`,
      growth: [
        {
          type: 'technical',
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
          type: 'cultural',
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
          type: 'technical',
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
          type: 'cultural',
          point: `Consideration or implementation of accessibility and compliance can be a costly afterthought.`,
          details: `Compliance, accessibility, translation. 
          All of these can throw an incredibly heavy monkey-wrench in any frontend architecture.
          From the start, it is on devs as much as it is on product to stress that fact. 
          It will always be a cost-benefit analysis, but it is imperative that devs advocate/extoll the potential 
          costs of adding these after the fact in an enterprise-grade solution.`,
        },
      ],
    },
  ],
  accolades: [
    {
      shortName: 'Tech team member of the month',
      description: `This was earned in a month where we had a 
        perfect storm of newly onboarded folks and the impending exit of the 
        key techncial voices in the frontend piece of the stack. 
        I wound up spending the month onboarding, 
        acting as a technical PM for some tech debt, and jumping into critical issues.`,
    },
    {
      shortName: 'Company-wide "Kudos"',
      description: `Most of these revolved around me filling in the void between 
      dev and a technical PM to build support and strategies around paying 
      down some of our more critical technical debt. 
      Some for diving into the FE piece of ACH integration as my first epic`,
    },
  ],
}]);

function Outline() {
  return (
    <Drawer
      isOpen={true}
      onClose={() => null}
    >
      <DrawerContent>
        <DrawerCloseButton/>
        <DrawerHeader>Create your account</DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

const classes = {
  container: `max-w-3xl mx-auto`,
  section: `w-full relative`,
  header: `
    inline-block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200
  `,
};

export default function Resume() {
  return (
    <div className={classes.container}>
      {Outline}
      <section className={classes.section}>
        <h2 className={classes.header}>Where I&apos;ve Worked</h2>
        {myExperience}
      </section>
      <section className={classes.section}>
        <h2 className={classes.header}>Tools I Love to Work With</h2>
        {devToolbox([{
          name: 'TypeScript',
          kind: 'technical',
          tool: 'language',
          link: 'https://www.typescriptlang.org/',
          experience: 'JS - 2012, TS - 2019',
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
        }])}
      </section>
      <section>
        <h2 className={classes.header}>People I love to learn from:</h2>
      </section>
    </div>
  );
}
