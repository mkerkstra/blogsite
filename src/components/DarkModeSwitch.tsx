import {Switch} from '@headlessui/react';
import {useDarkMode} from '../utilities/useDarkMode';

export default function DarkModeSwitch() {
  const [darkMode, switchDarkMode] = useDarkMode();
  return (
    <Switch
      checked={darkMode}
      onChange={switchDarkMode}
      className={`dark:bg-white dark:border-[#2C2C40]
          bg-[#2C2C40] border-white
          relative inline-flex flex-shrink-0 
          h-[1.68rem] w-[2.95rem] 
          border-2 
          rounded-full cursor-pointer 
          transition-colors ease-in-out duration-200 
          focus:outline-none focus-visible:ring-2  
          focus-visible:ring-[#a8a9ff8c] 
          focus-visible:ring-opacity-75`}
    >
      <span
        className={`
            dark:translate-x-0 dark:bg-[#2C2C40]
            translate-x-[1.25rem] bg-white
            pointer-events-none inline-block 
            h-[1.5rem] w-[1.5rem] rounded-full 
            shadow-lg 
            transform ring-0 transition ease-in-out duration-200`}/>
    </Switch>
  );
};

