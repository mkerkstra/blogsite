import {useRouter} from 'next/router';
import DarkModeSwitch from './darkModeSwitch';
import Link from './link';

const classes = {
  nav: `
  opacity-[98.5%]
  sticky top-0 h-16 py-5 flex items-center place-content-around
  border-b  
  dark:border-slate-200 border-slate-800
  z-10
  bg-inherit
  `,
  links: `
    my-auto
    hover:underline
    disabled:opacity-50
    disabled:no-underline
  `,
};

const routes = {
  home: '/',
  resume: '/resume',
} as const;

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className={classes.nav}>
      <Link
        disabled={router.pathname === routes.home}
        href={routes.home}
        className={classes.links}
      >
        blog
      </Link>
      <Link
        disabled={router.pathname === routes.resume}
        href={routes.resume}
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
