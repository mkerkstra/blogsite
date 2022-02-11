import React from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

const classes = {
  layout: `
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
    shadow-lg dark:shadow-stone-200/50 shadow-stone-600/50 
  `,
  main: `flex 
    flex-col 
    p-12
    sm:p-4
    md:p-8
    overflow-y-auto
    w-full
    mx-auto
    block
    min-h-[80vh]
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
