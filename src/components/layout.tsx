import React from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

const classes = {
  layout: `
    grid col-auto
    min-h-screen
    min-w-screen
    relative
    box-border
    backdrop-opacity-20 bg-gradient-to-r from-cyan-500/30 to-blue-500/30
    dark:border-slate-200 border-slate-900
    dark:bg-slate-900 bg-slate-200
    dark:text-white text-slate-900
  `,
  background: `
    dark:bg-slate-900 bg-slate-200
    w-full
    md:w-3/4
    mx-auto
    sm:my-0
    md:my-4
    opacity-90
    shadow-md dark:shadow-stone-400/50 shadow-stone-600/50 
  `,
  main: `
    container
    flex 
    flex-col 
    p-4
    md:p-6
    overflow-y-auto
    w-full
    mx-auto
    block
  `,
};

const Layout = (props: { children?: React.ReactNode }) => {
  return (
    <div className={classes.layout}>
      <Head>
        <title>Matt Kerkstra</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Navbar />
      <div className={classes.background}>
        <main className={classes.main}>
          {props?.children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
