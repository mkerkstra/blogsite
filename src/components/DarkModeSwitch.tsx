import {Switch} from '@headlessui/react';
import {useDarkMode} from '../utilities/useDarkMode';

const darkModeIcon = () => (
  <div className={`
    group
    flex
    items-center
    h-full
    w-full
    bg-inherit
  `}>
    <div className={`
      h-[80%]
      w-[80%]
      bg-white
      rounded-full
    `}>
      <div className={`
        my-auto
        mr-[8%]
        center
        h-[95%]
        w-[95%]
        bg-black
        rounded-full
        transition-transform group-hover:translate-x-[2.5%]
        group-hover:translate-y-[1.25%] group-hover:-scale-0
        group:hover:opacity-0 delay-250 duration-500 ease-in-out
      `}/>
    </div>
  </div>
);

const lightModeStyles = {
  button: `
    relative h-full w-full
    hover:animate-[spin_2s_linear_infinite]
  `,
  rayContainer: `
      container
      absolute
      bottom-[40.5%]
  `,
  rays: `
    origin-center 
    border-black
  `,
  sun: `
    absolute
    border-2
    w-[60%]
    h-[60%]
    left-[20%]
    top-[20%]
    border-black
    bg-white
    rounded-full
  `,
};

const lightModeIcon = () => (
  <div className={lightModeStyles.button}>
    <div className={lightModeStyles.rayContainer}>
      <hr className={lightModeStyles.rays}/>
      <hr className={`
        ${lightModeStyles.rays}
        rotate-90`
      }/>
      <hr className={`
        ${lightModeStyles.rays}
        rotate-45
        -translate-y-[2.5px]
        -translate-x-[.5px]
      `}/>
      <hr className={`
        ${lightModeStyles.rays}
        -rotate-45
        -translate-y-[2.5px]
        -translate-x-[.5px]
      `}/>
    </div>
    <div className={lightModeStyles.sun}/>
  </div>
);

export default function DarkModeSwitch() {
  const [darkMode, switchDarkMode] = useDarkMode();
  return (
    <Switch
      checked={darkMode}
      onChange={switchDarkMode}
      className={`h-[2rem] w-[2rem] `}
    >
      {
        darkMode ? darkModeIcon() : lightModeIcon()
      }
    </Switch>
  );
}
