import {myExperience} from '../data/myExperience';

const CompanyCard = ({company, role, projects}: typeof myExperience[number]) => (
  <section>
    <h1 className={`
      inline-block
      text-2xl sm:text-3xl font-extrabold
    `}>
      <a
        href={company.link}
        target='_blank'
        rel='noopener noreferrer'
      >
        <p className={`whitespace-pre-line`}>{company.name || company.quickOverview}</p>
        <ion-icon name="open-outline" size="small" color="inherit"/>
      </a>
    </h1>
  </section>
);

const classes = {
  container: ``,
};

export default function Experience() {
  return (
    <div className={classes.container}>
      <CompanyCard {...myExperience[0]}/>
    </div>
  );
}

