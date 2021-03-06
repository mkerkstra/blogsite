import {Switch} from '@headlessui/react';
import {useDarkMode} from '../hooks/useDarkMode';

const darkModeStyles = {
  container: `
    group
    flex
    items-center
    h-full
    w-full
    bg-inherit
  `,
  lunarDisc: `
    h-[80%]
    w-[80%]
    bg-white
    rounded-full
  `,
  darkSide: `
    relative
    right-[2px]
    my-auto
    h-[94%]
    w-[94%]
    bg-slate-900
    rounded-full
    transition-transform group-hover:translate-x-[2.5%]
    group-hover:translate-y-[1.25%] group-hover:-scale-0
    group:hover:opacity-0 delay-250 duration-500 ease-in-out
    shadow-slate-900
  `,
};
const DarkModeIcon = () =>
  <div className={darkModeStyles.container}>
    <div className={darkModeStyles.lunarDisc}>
      <div className={darkModeStyles.darkSide}/>
    </div>
  </div>;

const lightModeStyles = {
  button: `
    opacity-75
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
    bg-slate-200
    rounded-full
  `,
};

const LightModeIcon = () =>
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
  </div>;

const DarkModeSwitch = () => {
  const [darkMode, switchDarkMode] = useDarkMode();
  return (
    <Switch
      checked={darkMode}
      onChange={switchDarkMode}
      className={`h-[2rem] w-[2rem] `}
    >
      {
        darkMode ? <DarkModeIcon/> : <LightModeIcon/>
      }
    </Switch>
  );
};

export default DarkModeSwitch;
