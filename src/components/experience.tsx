import {myExperience} from '../data/myExperience';
import {ToolTip} from './tooltip';

const CompanyCard = ({company, role, projects}: typeof myExperience[number]) => (
  <section>
    <h1 className={`
      inline-block
      text-2xl sm:text-3xl font-extrabold
    `}>
      <ToolTip className={`
          inline-block ml-2
        `} panel={company.quickOverview}>
        <a
          href={company.link}
          target='_blank'
          rel='noopener noreferrer'
        >
          {company.name || company.quickOverview}
          <ion-icon name="open-outline" size="small" color="inherit"/>
        </a></ToolTip>
    </h1>
  </section>
);

const classes = {
  container: ``,
};

export const Experience = () => {
  return (
    <div className={classes.container}>
      <CompanyCard {...myExperience[0]}/>
    </div>
  );
};
