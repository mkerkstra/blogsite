import {useRouter} from 'next/router';
import DarkModeSwitch from './DarkModeSwitch';
import AriaLink from '../components/ariaLink';

const classes = {
  nav: `relative w-screen h-[10%] py-5 flex items-center place-content-around
 border-b 
  dark:bg-[#FFFFFF] bg-[#2C2C40] 
  dark:text-black text-white`,
  links: `
    my-auto
  `,
};

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className={classes.nav}>
      <AriaLink
        disabled={router.pathname === '/'}
        href='/'
        className={classes.links}
      >
        home
      </AriaLink>
      <AriaLink
        disabled={router.pathname === '/blog'}
        href='/blog'
        className={classes.links}
      >
        blog
      </AriaLink>
      <AriaLink
        disabled={router.pathname === '/resume'}
        href='/resume'
        className={classes.links}
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
