import Socials from './socials';

const classes = {
  footer: `
    mt-auto
    z-10
    relative
    flex flex-col
    h-20
    w-full
    bottom-0
    p-4
    items-center
    justify-center
    border-t
    dark:border-slate-200 border-slate-800
    bg-inherit
    opacity-[98.5%]
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
