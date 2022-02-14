import {myExperience} from '../data/myExperience';
import {intervalToDuration, formatDuration} from 'date-fns';
import React from 'react';
import {useInterval} from '../hooks/useInterval';
import MoreInformation from './moreInformation';

const classes = {
  container: `
    grid grid-cols-1
  `,
  jobCard: `
    grid grid-cols-1
    gap-y-6
    rounded
    outline outline-offset-2 outline-2
    mx-4
    m-6
    p-6
    shadow-inner dark:shadow-stone-200/50 shadow-stone-600/20 
  `,
  companyCard: `
    pb-0
    tracking-wider
  `,
  roleCard: `
    p-2
    pt-0
  `,
};

const CompanyCard = ({
  name,
  quickOverview,
  link,
}:
  typeof myExperience[0]['company']
) =>
  <section
    className={classes.companyCard}
  >
    <h1 className={`
        flex flex-nowrap
        font-bold
        tracking-wider
      `}>
      <a
        href={link}
        target='_blank'
        rel='noopener noreferrer'
      >
        {name || quickOverview}
        <ion-icon name="open-outline" size="small" color="inherit"/>
      </a>
    </h1>
  </section>;

const Growth = ({
  point, details,
}:
  typeof myExperience[0]['projects'][0]['growth'][0]
) =>
  <section className={`text-sm p-2 my-2 mb-0 rounded border-2`}>
    <h4>{point}</h4>
    <p className={`pl-2`}>{details}</p>
  </section>;

const ProjectCard = ({
  title,
  overview,
  growth,
}:
  typeof myExperience[0]['projects'][0]
) =>
  <div className={`
    inline-block m-3 
  `}>
    <MoreInformation
      title={title}
    >
      <>
        <h4>{overview}</h4>
        {growth.map((args) => (
          <Growth
            key={args.point}
            {...args}
          />
        ))}</>
    </MoreInformation>
  </div>;

/**
 * This is overkill. Originally had this showing the
 * time down to the seconds but figured that looks insane.
 * Kept it around to show I know how to deal with datetime, closures,
 * react hooks (i.e. install a good package and rip off Dan Abramov like any decent FE dev)
 * @param {param0} start - The start date of the experience
 * @return {jsx} a duration string
 */
const Duration = ({
  start,
}: {
  start: Date
}) => {
  const [duration, setDuration] = React.useState(calculateDuration({start, end: new Date()}));
  useInterval(() => {
    setDuration(calculateDuration({start, end: new Date()}));
  }, 600000);
  return <span className={`text-md`}>{duration}</span>;
};
const calculateDuration = ({
  start,
  end,
}: {
  start: Date,
  end: Date
}) => formatDuration(
    intervalToDuration({start, end}), {format: ['years', 'months']}
);

const RoleCard = ({
  title,
  time,
  overview,
}:
  typeof myExperience[0]['role']
) =>
  <section className={classes.roleCard}>
    <h2 className={`
      font-bold
    `}>
      {`${title} - `}
      {time?.end ?
      <span className={`text-md`}>
        {calculateDuration({start: time.start, end: time.end})}
      </span>:
      <Duration start={time.start}/>}
    </h2>
    <p className={`
      p-2
      text-md
    `}>{overview}</p>
  </section>;

const Experience = () =>
  <div className={`${classes.container}`}>
    {myExperience.map(({company, role, projects}) => (
      <div key={`job_${company.name}`} className={classes.jobCard}>
        <CompanyCard key={`company_${company.name}`} {...company}/>
        <RoleCard key={`role_${role.title}`} {...role}/>
        {projects.map((project) => (
          <ProjectCard key={`project_${project.title}`} {...project}/>
        ))}
      </div>
    ))}
  </div>;

export default Experience;
