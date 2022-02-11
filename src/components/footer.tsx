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
    border-t
    dark:border-slate-200 border-slate-800
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
