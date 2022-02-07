import {useRouter} from 'next/router';
import DarkModeSwitch from './darkModeSwitch';
import Link from './link';

const classes = {
  nav: `
  relative w-screen h-[10%] py-5 flex items-center place-content-around
  border-b  
  dark:bg-black bg-white
  dark:text-white text-black`,
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
        resume
      </Link>
      <div className=''>
        <DarkModeSwitch/>
      </div>
    </nav>
  );
};

export default Navbar;
