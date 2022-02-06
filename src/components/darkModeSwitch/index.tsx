import {Switch} from '@headlessui/react';
import {useDarkMode} from '../../hooks/useDarkMode';
import {darkModeIcon, lightModeIcon} from './icons';

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
