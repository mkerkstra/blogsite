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
    dark:border-slate-200 border-slate-900
    dark:bg-slate-900 bg-slate-200
    dark:text-white text-slate-900
  `,
  main: `flex 
    flex-col 
    p-4
    overflow-y-auto
    w-full
    md:w-3/4
    lg:w-1/2
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
      <main className={classes.main}>
        {props?.children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
