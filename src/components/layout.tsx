import React from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

const styles = {
  layout: `
    relative

    grid

    min-h-screen
    min-w-screen
    max-w-full
    max-h-full

    box-border
    dark:border-slate-200 border-slate-900

    backdrop-opacity-20 bg-gradient-to-r from-cyan-500/30 to-blue-500/30
    dark:bg-slate-900 bg-slate-200

    dark:text-white text-slate-900
  `,
  background: `
    dark:bg-slate-900 bg-slate-200
    w-full
    sm:max-w-fit
    lg:max-w-3xl
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

const Layout = (props: { children?: React.ReactNode }) => (
  <div className={styles.layout}>
    <Head>
      <title>Matt Kerkstra</title>
      <link rel='icon' href='/favicon.ico' />
    </Head>
    <Navbar />
    <div className={styles.background}>
      <main className={styles.main}>
        {props?.children}
      </main>
    </div>
    <Footer />
  </div>
);

export default Layout;
