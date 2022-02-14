import {useRouter} from 'next/router';
import DarkModeSwitch from './darkModeSwitch';
import Link from './link';

const routes = {
  home: '/',
  thoughts: '/thoughts',
} as const;

const classes = {
  nav: `
    opacity-[98.5%]
    sticky top-0 h-16
    grid grid-cols-3 justify-around place-items-center
    border-b
    dark:border-slate-200 border-slate-800
    z-10
    bg-inherit
  `,
  links: `
    w-full h-full
    hover:underline
    disabled:no-underline
    bg-inherit
    disabled:shadow-inner
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
      <Link
        disabled={router.pathname === routes.thoughts}
        href={routes.thoughts}
        className={classes.links}
      >
        thoughts
      </Link>
      <div className=''>
        <DarkModeSwitch/>
      </div>
    </nav>
  );
};

export default Navbar;
