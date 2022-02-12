import Socials from './socials';

const styles = {
  footer: `
    relative
    md:sticky
    bottom-0
    z-10

    flex flex-col
    items-center
    justify-center

    h-20
    w-full

    mt-auto
    p-4

    opacity-[98.5%]

    bg-inherit
    border-t
    dark:border-slate-200 border-slate-800
  `,
};

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Socials/>
    </footer>
  );
};

export default Footer;
