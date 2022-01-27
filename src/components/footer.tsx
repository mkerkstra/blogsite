import Socials from './socials';

const classes = {
  footer: `
    flex  flex-col
    relative h-[10%] 
    bottom-0
    items-center
    justify-center
    w-screen 
    border-t 
    dark:bg-black bg-white
  `,
  span: `flex items-center justify-center dark:text-white text-black`,
};

const Footer = () => {
  return (
    <footer className={classes.footer}>
      <span className={classes.span}>matt kerkstra</span>
      <Socials/>
    </footer>
  );
};

export default Footer;
