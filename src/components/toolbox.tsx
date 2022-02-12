import React from 'react';
import {myToolbox} from '../data/myToolbox';
import MoreInformation from './moreInformation';

const classes = {
  container: `
    flex
    flex-wrap
    my-4
  `,
  skillCard: `
    flex
    flex-col
    h-1/4
    rounded
    w-full
    md:w-auto
    outline outline-offset-2 outline-2
    m-4
    p-2
    pb-0
    shadow-inner dark:shadow-stone-200/50 shadow-stone-600/20 
  `,
  nameContainer: `
    flex flex-nowrap
  `,
  name: ` 
    text-2xl
    font-bold
  `,
  detailedInfo: `
    p-2
    mt-1
  `,
  iconButton: `
    inline-flex
    p-0.5
    mt-2
    mb-1
    -mr-1 
    ml-auto
    no-ssr
    rounded-full
    border-1
    bg-gray-600
    text-white
    dark:bg-white
    dark:text-black
  `,
};

const TechnicalSkillCard = ({
  skill,
}: {
  skill: typeof myToolbox[number] & {kind: 'technical'}
}) =>
  <div
    className={classes.skillCard}
  >
    <div className={classes.nameContainer}>
      <h1 className={classes.name}>{skill.name}</h1>
      <a
        href={skill.link}
        target='_blank'
        rel='noopener noreferrer'
      >
        <ion-icon name="open-outline" size="small" color="inherit"/>
      </a>
    </div>
    <MoreInformation>
      <p>
        {skill.description}
      </p>
    </MoreInformation>
  </div>;

const SoftSkillCard = ({
  skill,
}: {
  skill: typeof myToolbox[number] & {kind: 'soft'}
}) =>
  <div className={classes.skillCard}>
    <h1 className={classes.name}>{skill.name}</h1>
    <MoreInformation>
      <section>
        <p>{skill.description}</p>
      </section>
    </MoreInformation>
  </div>;

const Toolbox = () =>
  <div className={classes.container}>
    {myToolbox.map((skill) => skill.kind === 'technical' ?
      <TechnicalSkillCard key={skill.name} skill={skill}/> :
      <SoftSkillCard key={skill.name} skill={skill}/>
    )}
  </div>;

export default Toolbox;
