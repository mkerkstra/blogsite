import Socials from './socials';

const classes = {
  footer: `
    static
    flex  flex-col
    h-[10%] 
    bottom-0
    p-4
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
      <Socials/>
    </footer>
  );
};

export default Footer;
