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
        group:hover:opacity-100 delay-250 duration-500 ease-in-out
      `}/>
    </div>
  </div>
);

const lightModeIcon = () => (
  <div className={`
    grid
    grid-rows-[100%]
    grid-cols-[100%]
    group
    h-full
    w-full
    bg-white;
  `}>
    <div className={`
      justify-self-center
      h-full
      w-full
      rotate-180
      border-t-2 border-black
    `}/>
    <div className={`
      justify-self-center
      h-full
      w-full
      border-t-2 border-black
      rotate-45
    `}/>
    <div className={`
      justify-self-center
      h-full
      w-full
      border-t-2 border-black
      rotate-225
    `}/>
    <div className={`
      justify-self-center
      right-1/2
      h-full
      w-full
      border-t-2 border-black
      rotate-90
    `}/>
    <div className={`
      justify-self-center
      background-color:white
      h-[60%]
      w-[60%]
      rounded-full
    `}/>
  </div>
);
// const switchContainer = `
//   dark:bg-white dark:border-[#494949]
//   bg-black border-white
//   focus:outline-none focus-visible:ring-2
//   focus-visible:ring-[#a8a9ff8c]
//   focus-visible:ring-opacity-75
//   relative inline-flex flex-shrink-0
//   h-[1.68rem] w-[2.95rem]
//   border-2
//   rounded-full cursor-pointer
//   transition-colors ease-in-out duration-200
// `;

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
      {/* <span
        className={`
            dark:translate-x-0 dark:bg-[#494949]
            translate-x-[1.25rem] bg-white
            pointer-events-none inline-block
            h-[1.5rem] w-[1.5rem] rounded-full
            shadow-lg
            transform ring-0 transition ease-in-out duration-200`}/> */}
    </Switch>
  );
};

