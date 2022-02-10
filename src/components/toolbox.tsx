import React from 'react';
import {myToolbox} from '../data/myToolbox';
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
    outline outline-offset-2 outline-2
    m-4
    p-2
    pb-0
  `,
  name: ` 
    text-4xl
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
} as const;

const TechnicalSkillCard = ({skill}: {skill: typeof myToolbox[number] & {kind: 'technical'}}) => {
  const [expanded, setExpanded] = React.useState(false);
  const detailedStyle = expanded ? classes.detailedInfo : 'hidden';
  return (
    <div
      className={`${classes.skillCard} ${!expanded ? 'truncate ...' : ''}`}
    >
      <div className={`flex flex-nowrap`}>
        <h1 className={classes.name}>{skill.name}</h1>
        <a
          href={skill.link}
          target='_blank'
          rel='noopener noreferrer'
        >
          <ion-icon name="open-outline" size="small" color="inherit"/>
        </a>
      </div>
      <p className={detailedStyle}>
        {skill.why}
      </p>
      <button
        className={classes.iconButton}
        aria-hidden
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ion-icon name="chevron-up-outline" />:
        <ion-icon name="chevron-down-outline"/>
        }
      </button>
    </div>
  );
};

const SoftSkillCard = ({skill}: {skill: typeof myToolbox[number] & {kind: 'soft'}}) => {
  const [expanded, setExpanded] = React.useState(false);
  const detailedStyle = expanded ? classes.detailedInfo : 'hidden';
  return (
    <div className={classes.skillCard}
      onClick={() => setExpanded(!expanded)}
    >
      <h1 className={classes.name}>{skill.name}</h1>
      <p className={detailedStyle}>{skill.trait}</p>
      <p className={detailedStyle}>{skill.anecdote}</p>
      <button
        className={classes.iconButton}
        aria-hidden
      >
        {expanded ? <ion-icon name="chevron-up-outline" />:
        <ion-icon name="chevron-down-outline"/>
        }
      </button>
    </div>
  );
};

export default function Toolbox() {
  return (
    <div className={classes.container}>
      {myToolbox.map((skill) => skill.kind === 'technical' ?
      <TechnicalSkillCard key={skill.name} skill={skill}/> :
      <SoftSkillCard key={skill.name} skill={skill}/>
      )}
    </div>
  );
}
