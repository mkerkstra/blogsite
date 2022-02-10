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
    dark:bg-black bg-white
    dark:text-white
  `,
  main: `flex 
    flex-col 
    overflow-y-auto
    sm:w-full
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
