/* eslint-disable max-len */
import React from 'react';
import {Tabs, TabList, TabPanels, Tab, TabPanel, Container, Text, Table, Tbody, Td, Tr} from '@chakra-ui/react';

/**
 * Discussions I love to have.
 */
type growthPoints = {
    type: 'cultural' | 'technical';
    point: string;
    details: string;
};
/**
 * @param {args} args - Array of professional experience, broken into company information, role, growth, and accolades.
 * @param {args.company} args.company - includes name, a url to the about section of the company's website, and a quick overview that'll be rendered in a tooltip.
 * @param {args.role} args.role - this is what my role was at the company, how long I was there and a short overview of my responsibilities.
 * @param {args.growth} args.growth - a list of what I learned, either cultural or technical, during my time at the company.
 * @param {args.accolades} args.accolades - a list of accolades earned while
 * @return {JSX.Element} a section summarizing experience at a company.
 */
const professionalExperience = (args: {
  company: {
    name?: string;
    link?: string;
    quickOverview?: string;
    size?: string;
  }
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
    growth: growthPoints[];
  }[],
  growth: growthPoints[];
  accolades: {
    name: string;
    description: string;
  }[];
}[]): JSX.Element => {
  return (
    <Container centerContent isFitted maxW='container.lg' className={`mt-2`}>
      {args.map(({company, role, projects, growth, accolades}, index) => (
        <Tabs key={index}>
          <TabList>
            {Object.keys(args[0]).map((key) => (
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
                  <Td></Td>
                </Tbody>
              </Table>
            </TabPanel>
            <TabPanel>
              <span>{role.title}</span>
              <span>{role.time.start}/{role.time.end || `present`}</span>
              <span>{role.overview}</span>
            </TabPanel>
            <TabPanel>
              <Tabs>
                <TabList>
                  {projects.map(({title}) => (
                    <Tab key={title}>{title}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {projects.map(({title, overview, growth: projectGrowth}) => (
                    <TabPanel key={title}>
                      <span>{title}</span>
                      <span>{overview}</span>
                      <Tabs>
                        <TabList>
                          {Object.keys(projectGrowth[0]).map((key) => (
                            <Tab key={key}>{key}</Tab>
                          ))}
                        </TabList>
                        <TabPanels>
                          {projectGrowth.map(({type, point, details}, index) => (
                            <TabPanel key={index}>
                              <span>{type}</span>
                              <span>{point}</span>
                              <span>{details}</span>
                            </TabPanel>
                          ))}
                        </TabPanels>
                      </Tabs>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </TabPanel>
          </TabPanels>
        </Tabs>
      ))}
    </Container>
  );
};

// <Tab.Group key={company.name}>
//   <Tab.List>
//     <Tab>tab 1
//       <Tab.Panels>
//         <Tab.Panel>panel</Tab.Panel>
//       </Tab.Panels>
//     </Tab>
//     <Tab>tab 2</Tab>
//     <Tab>tab 3</Tab>
//   </Tab.List>
// </Tab.Group>
// <li key={company.name}>
//   <h3>{company.name}</h3>
//   <h4>{role.title} | {role.time.start}/{role.time.end ?? 'current'}</h4>
//   <p>{role.overview}</p>
//   <ol>
//     {growth.map((growth, index) => (
//       <li key={`${company.name}_growth${index}`}>
//         <section>
//           <h4>{growth.point}</h4>
//           <p>{growth.details}</p>
//         </section>
//       </li>
//     ))}
//   </ol>
//   <ol>
//     {accolades.map((accolade, index) => (
//       <li key={`${company.name}_accolade${index}`}>
//         <section>
//           <h4>{accolade.name}</h4>
//           <p>{accolade.description}</p>
//         </section>
//       </li>
//     ))}
//   </ol>
// </li>


const myExperience = professionalExperience([{
  company: {
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
        point: 'When there are tough truths about the state of a project, I am able to articulate the issue and be an advocatate for the codebase.',
        details: `After diving into what the lead had sketched up and a lot of discussions with as many senior folks I could bounce ideas off of, 
          we reached the conclusion the direction of the version control & distribution would be problematic at scale. Building up support and laying out 
          the options to tackle our concerns was a great learning experience.`,
      }],
    },
  ],
  growth: [
    {
      type: 'cultural',
      point: 'I rise to the challenge.',
      details: `Two weeks after I got out of onboarding, the lead on the application I was working on quit.`,
    }, {
      type: 'technical',
      point: 'Migrations',
      details: ``,
    },
    {
      type: 'cultural',
      point: `Work finds a way.`,
      details: ``,
    },
  ],
  accolades: [
    {
      name: 'Rising Star',
      description: `Earned for accepting responsibilities as a technical lead on a challenging project soon after onboarding.`,
    },
    {
      name: 'Employee',
      description: `Earned for accepting responsibilities as a technical lead on a challenging project soon after onboarding.`,
    },
  ],
},
{
  company: {
    quickOverview: 'A hotel booking platform and lodging performance network.',
    size: 'Series B Scaleup/unicorn - 400 employees',
  },
  role: {
    title: 'Software Engineer',
    time: {
      start: '07/2021',
    },
    overview: '',
  },
  projects: [
    {
      title: ``,
      overview: ``,
      growth: [
        {
          type: 'cultural',
          point: ``,
          details: ``,
        },
      ],
    },
  ],
  growth: [{
    type: 'cultural',
    point: '',
    details: ``,
  },
  {
    type: 'technical',
    point: '',
    details: ``,
  }],
  accolades: [
    {
      name: 'Tech team member of the month',
      description: '',
    }],
}]);
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

const classes = {
  header: `
    inline-block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200
  `,
};

export default function Resume() {
  return (
    <div className='max-w-3xl mx-auto'>
      <section className='h-full w-full relative'>
        <h2 className={classes.header}>Where I&apos;ve Worked</h2>
        {myExperience}
      </section>
      <section className='relative'>
        <h2 className={classes.header}>Tools I Love to Work With</h2>
        {devToolbox([{
          name: 'TypeScript',
          kind: 'technical',
          tool: 'language',
          link: 'https://www.typescriptlang.org/',
          experience: '',
          why: '',
        }, {
          name: 'GraphQL',
          kind: 'technical',
          tool: 'standard',
          link: 'https://graphql.org/',
          experience: '',
          why: '',
        }, {
          name: 'Research',
          kind: 'soft',
          trait: '',
          anecdote: '',
        }, {
          name: 'Leadership',
          kind: 'soft',
          trait: '',
          anecdote: '',
        }])}
      </section>
      <section>
        <h2 className={classes.header}>People I love to learn from:</h2>
      </section>
    </div>
  );
}
