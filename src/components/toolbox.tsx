import React from 'react';
import {myToolbox} from '../data/myToolbox';
const classes = {
  container: `
    flex
    flex-wrap
    my-4
  `,
  skillCard: `
    w-1/4
    h-1/4
    rounded
    outline outline-offset-2 outline-2
    m-4
  `,
  name: `
    text-lg
    font-bold
  `,
} as const;

export const Toolbox = () =>
  <div className={classes.container}>
    {myToolbox.map((skill) => skill.kind === 'technical' ?
      <TechnicalSkillCard key={skill.name} skill={skill}/> :
      <SoftSkillCard key={skill.name} skill={skill}/>
    )}
  </div>;

const TechnicalSkillCard = ({skill}: {skill: typeof myToolbox[number] & {kind: 'technical'}}) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div
      className={`${classes.skillCard} ${!expanded ? 'truncate ...' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <h1 className={classes.name}>
        <a
          href={skill.link}
          target='_blank'
          rel='noopener noreferrer'
        >
          {skill.name} <ion-icon name="open-outline" size="small" color="inherit"/>
        </a>
      </h1>
      <p>{skill.experience}</p>
      {expanded && (
        <p>
          {skill.why}
        </p>
      )}
    </div>
  );
};

const SoftSkillCard = ({skill}: {skill: typeof myToolbox[number] & {kind: 'soft'}}) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className={classes.skillCard}
      onClick={() => setExpanded(!expanded)}
    >
      <h1 className={classes.name}>{skill.name}</h1>
      {expanded && (
        <>
          <p>{skill.trait}</p>
          <p>{skill.anecdote}</p>
        </>
      )}
    </div>
  );
};
