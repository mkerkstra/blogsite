import React from 'react';
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
    m-4
    overflow-auto
    h-[80%]
    px-3
    dark:bg-black bg-white
    dark:text-white
  `,
};

const Layout = (props: { children?: React.ReactNode }) => {
  return (
    <div className={classes.layout}>
      <Navbar />
      <main className={classes.main}>
        {props?.children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
