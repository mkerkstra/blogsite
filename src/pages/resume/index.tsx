/* eslint-disable max-len */
import React from 'react';


const professionalExperienceClasses = {
  container: ``,
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
    name: string;
    link: string;
    quickOverview?: string;
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
  growthPoints: {
    type: 'cultural' | 'technical';
    point: string;
    details: string[];
  }[];
  accolades: {
    name: string;
    description: string;
  }[];
}[]): JSX.Element => {
  return (
    <ul className={professionalExperienceClasses.container}>
      {args.map(({company, role, growthPoints, accolades}) => (
        <li key={company.name}>
          <h3>{company.name}</h3>
          <h4>{role.title} | {role.time.start}/{role.time.end ?? 'current'}</h4>
          <p>{role.overview}</p>
          <ol>
            {growthPoints.map((growth, index) => (
              <li key={`${company.name}_growth${index}`}>
                <section>
                  <h4>{growth.point}</h4>
                  <p>{growth.details}</p>
                </section>
              </li>
            ))}
          </ol>
          <ol>
            {accolades.map((accolade, index) => (
              <li key={`${company.name}_accolade${index}`}>
                <section>
                  <h4>{accolade.name}</h4>
                  <p>{accolade.description}</p>
                </section>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ul>
  );
};

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

// const peopleMentioned = (args: {

// }[]): JSX.Element => {

// };

const classes = {
  header: `
    inline-block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200
  `,
};

export default function Resume() {
  return (
    <div className='h-100% overflow-auto'>
      <section>
        <h2 className={classes.header}>Where I&apos;ve Worked</h2>
        {professionalExperience([{
          company: {
            name: 'Reynolds and Reynolds',
            link: 'https://www.reyrey.com/company',
            quickOverview: 'Reynolds and Reynolds is an industry leader in automotive technology and digitization.',
          },
          role: {
            title: 'Software Developer',
            time: {
              start: '02/2019',
              end: '06/2021',
            },
            overview: '',
          },
          growthPoints: [{
            type: 'cultural',
            point: '',
            details: [''],
          }, {
            type: 'technical',
            point: '',
            details: [''],
          }],
          accolades: [{
            name: 'Rising Star',
            description: 'Earned for accepting responsibilities as a technical lead on a challenging project soon after onboarding.',
          }],
        }, {
          company: {
            name: 'Hotel Engine',
            link: 'https://www.hotelengine.com/about-us/',
            quickOverview: 'Hotel Engine is a hotel booking platform and lodging performance network.',
          },
          role: {
            title: 'Software Engineer',
            time: {
              start: '07/2021',
            },
            overview: '',
          },
          growthPoints: [{
            type: 'cultural',
            point: '',
            details: [''],
          },
          {
            type: 'technical',
            point: '',
            details: [''],
          }],
          accolades: [{
            name: 'Technical of the month',
            description: '',
          }],
        }])}
      </section>
      <section>
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
