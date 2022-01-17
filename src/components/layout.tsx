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
  items-center 
  justify-center 
  overflow-auto
  w-full 
  h-[80%]
  px-3
  bg-[#FFFFFF] 
  dark:bg-[#2C2C40] 
  dark:text-white
`};

const Layout = (props: { children?: React.ReactNode }) => {
  return (
    <div className={classes.layout}>
      <Navbar />
      <main className={classes.main}>{props?.children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
