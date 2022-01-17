import React from 'react';

export const darkModeContext =React.createContext<
  [boolean, React.DispatchWithoutAction]
>([
  false,
  () => {},
]);

export const useDarkMode = () => React.useContext(darkModeContext);

const toggleDarkMode = (flipOn: boolean) => flipOn ? (
    document.body['className'] = 'dark',
    localStorage.setItem('dark', 'true'),
    true
) : (
  document.body['className'] = '',
  localStorage.removeItem('dark'),
  false
);

export const DarkModeProvider = (props: { children?: React.ReactNode }) => {
  const [darkMode, dispatchDarkMode] = React.useReducer(
      (state: boolean, action: boolean) => {
        return action ? toggleDarkMode(action) : toggleDarkMode(!state);
      }, true);

  React.useEffect(() => {
    dispatchDarkMode(Boolean(JSON.parse(
        globalThis.window?.localStorage.getItem('dark') || 'false') ||
    globalThis.window?.document.body['className'] == 'dark' ||
    false));
  }, []);

  const MemoForContext: [typeof darkMode,
    React.DispatchWithoutAction] =
    React.useMemo(() =>
      [darkMode, dispatchDarkMode as React.DispatchWithoutAction],
    [darkMode, dispatchDarkMode]);

  return (
    <darkModeContext.Provider value={MemoForContext}>
      {props.children}
    </darkModeContext.Provider>
  );
};
