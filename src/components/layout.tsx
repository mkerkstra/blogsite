import React from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

const classes = {
  layout: `
    h-full
    w-full
    fixed
  `,
  main: `flex 
    flex-col 
    overflow-y-auto
    h-[80%]
    p-4
    dark:bg-black bg-white
    dark:text-white
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
