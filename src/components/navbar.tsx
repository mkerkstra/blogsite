import {useRouter} from 'next/router';
import DarkModeSwitch from './darkModeSwitch';
import Link from './link';

const routes = {
  home: '/',
} as const;

const classes = {
  nav: `
    opacity-[98.5%]
    sticky top-0 h-16
    grid grid-cols-2 justify-around place-items-center
    border-b
    dark:border-slate-200 border-slate-800
    z-10
    bg-inherit
  `,
  links: `
    w-full h-full
    hover:underline
    disabled:no-underline
    drop-shadow-none
    dark:shadow-stone-200/50 shadow-stone-600/20
    disabled:drop-shadow-2xl
  `,
};

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className={classes.nav}>
      <Link
        disabled={router.pathname === routes.home}
        href={routes.home}
        className={classes.links}
      >
        about me
      </Link>
      <div className=''>
        <DarkModeSwitch/>
      </div>
    </nav>
  );
};

export default Navbar;
