import {useRouter} from 'next/router';
import DarkModeSwitch from './DarkModeSwitch';
import AriaLink from '../components/ariaLink';

const classes = {
  nav: `
  relative w-screen h-[10%] py-5 flex items-center place-content-around
  border-b  
  dark:bg-black bg-white
  dark:text-white text-black`,
  links: `
    my-auto
  `,
};

const routes = {
  home: '/',
  blog: '/blog',
  resume: '/resume',
} as const;

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className={classes.nav}>
      <AriaLink
        disabled={router.pathname === routes.home}
        href={routes.home}
        className={`${classes.links} ${router.pathname === routes.home && 'text-gray-700 opacity-50'}`}
      >
        home
      </AriaLink>
      <AriaLink
        disabled={router.pathname === routes.blog}
        href={routes.blog}
        className={`${classes.links} ${router.pathname === routes.blog && 'text-gray-700 opacity-50'}`}
      >
        blog
      </AriaLink>
      <AriaLink
        disabled={router.pathname === routes.resume}
        href={routes.resume}
        className={`${classes.links} ${router.pathname === routes.resume && 'text-gray-700'}`}
      >
        resume
      </AriaLink>
      <div className=''>
        <DarkModeSwitch/>
      </div>
    </nav>
  );
};

export default Navbar;
