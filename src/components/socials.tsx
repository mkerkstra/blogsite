import Image from 'next/image';
import React from 'react';
import {useDarkMode} from '../utilities/useDarkMode';
import GhDark from '../../public/socials/ghDark.png';
import GhLight from '../../public/socials/ghLight.png';
import LinkedIn from '../../public/socials/LinkedIn.png';
import TwitterDark from '../../public/socials/twitterDark.svg';
import TwitterLight from '../../public/socials/twitterLight.svg';
import DiscordDark from '../../public/socials/discordDark.svg';
import DiscordLight from '../../public/socials/discordLight.svg';
import YtDark from '../../public/socials/ytDark.png';
import YtLight from '../../public/socials/ytLight.png';

const classes = {
  container: `
    inline-flex 
  `,
  socialLink: `
    w-8
    m-auto
  `,
};

const Socials = () => {
  const [darkMode] = useDarkMode();
  return (
    <div className={classes.container}>
      <a
        href='https://github.com/mkerkstra'
        target='_blank'
        rel='noopener noreferrer'
        className={classes.socialLink}
      >
        <Image
          src={darkMode ? GhDark : GhLight}
          alt="GitHub"
        />
        <span className='sr-only'>github</span>
      </a>
      <a
        href='https://twitter.com/MatthewKerkstra'
        target='_blank'
        rel='noopener noreferrer'
        className={classes.socialLink}
      >
        <Image
          src={darkMode ? TwitterDark : TwitterLight}
          alt="twitter"
        />
        <span className='sr-only'>twitter</span>
      </a>
      <a
        href='https://www.linkedin.com/in/matthew-kerkstra-9333873b/'
        target='_blank'
        rel='noopener noreferrer'
        className={classes.socialLink}
      >
        <Image
          src={LinkedIn}
          alt="LinkedIn"
        />
        <span className='sr-only'>linked in</span>
      </a>
      <a
        href='https://www.youtube.com/user/MattKerkstra'
        target='_blank'
        rel='noopener noreferrer'
        className={classes.socialLink}
      >
        <Image
          src={darkMode ? YtDark : YtLight}
          alt="YouTube"
        />
        <span className='sr-only'>youtube</span>
      </a>
      <a
        href='https://discordapp.com/users/256593622428942336'
        target='_blank'
        rel='noopener noreferrer'
        className={classes.socialLink}
      >
        <Image
          src={darkMode ? DiscordDark : DiscordLight}
          alt="Discord"
        />
        <span className='sr-only'>discord</span>
      </a>
    </div>
  );
};

export default Socials;
