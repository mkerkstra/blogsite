import React from 'react';

const classes = {
  container: ``,
  iconContainer: `
    inline-flex
    p-2
    rounded-full
    bg-slate-900
    dark:bg-slate-200
  `,
  socialLink: `
    w-8
    m-2
    dark:text-slate-900
    text-slate-200
  `,
};

const socials: Parameters<typeof SocialLink>[0][] = [
  {
    name: 'GitHub',
    link: 'https://github.com/mkerkstra',
    iconName: 'logo-github',
  },
  {
    name: 'Twitter',
    link: 'https://twitter.com/MatthewKerkstra',
    iconName: 'logo-twitter',
  },
  {
    name: 'discord',
    link: 'https://discordapp.com/users/256593622428942336',
    iconName: 'logo-discord',
  },
  {
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/in/matthew-kerkstra-9333873b/',
    iconName: 'logo-linkedin',
  },
  {
    name: 'Email',
    link: 'mailto:mattkerkstra@gmail.com',
    iconName: 'mail-outline',
  },
];

const SocialLink = ({name, link, iconName}: {name: string, link: string, iconName: string}) => (
  <a
    href={link}
    target='_blank'
    rel='noopener noreferrer'
    className={classes.socialLink}
  >
    <div className={classes.iconContainer}>
      <ion-icon name={iconName} size="large"/>
    </div>
    <span className='sr-only'>{name}</span>
  </a>
);

const Socials = () =>
  <div className={classes.container}>
    {socials.map((social) => <SocialLink key={social.name} {...social}/>)}
  </div>;

export default Socials;
