import React from 'react';
import {Experience} from '../components/experience';
import {Toolbox} from '../components/toolbox';


const classes = {
  container: `max-w-3xl mx-auto`,
  section: `w-full relative mx-auto my-4`,
  header: `
    text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200
  `,
};

export default function Resume() {
  return (
    <div className={classes.container}>
      <section className={`
        ${classes.section}`
      }>
        <h2 className={classes.header}>Where I&apos;ve Worked</h2>
        <div className={`rounded border-2`}>
          <Experience/>
        </div>
      </section>
      <section className={`
        ${classes.section}`
      }>
        <h2 className={classes.header}>Tools I Love to Work With</h2>
        <Toolbox/>
      </section>
      <section className={`${classes.section}`}>
        <h2 className={classes.header}>People I love to learn from:</h2>
      </section>
    </div>
  );
}
