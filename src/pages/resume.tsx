import React from 'react';
import AboutMe from '../components/aboutMe';
import Experience from '../components/experience';
import Toolbox from '../components/toolbox';

const classes = {
  container: `max-w-full mx-auto grid grid-cols-1`,
  section: `w-full relative mx-auto my-4`,
  header: `
    text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200
  `,
};

export default function Resume() {
  return (
    <div className={classes.container}>
      <section className={classes.section}><div><AboutMe/></div></section>
      <section className={`
        ${classes.section}`
      }>
        <h2 className={classes.header}>Where I&apos;ve worked</h2>
        <div className={``}>
          <Experience/>
        </div>
      </section>
      <section className={`
        ${classes.section}`
      }>
        <h2 className={classes.header}>Tools I like to work with</h2>
        <Toolbox/>
      </section>
      <section className={`${classes.section}`}>
        <h2 className={classes.header}>People I like to learn from</h2>
      </section>
    </div>
  );
}
