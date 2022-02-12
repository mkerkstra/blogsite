import React from 'react';

const darkModeContext = React.createContext<
  [boolean, React.DispatchWithoutAction]
>([
  true,
  () => {},
]);

const toggleDarkMode = (flipOn: boolean) =>
  flipOn ? (
    document.body['className'] = 'dark',
    localStorage.setItem('dark', 'true'),
    true
  ) : (
    document.body['className'] = '',
    localStorage.removeItem('dark'),
    false
  );

export const useDarkMode = () => React.useContext(darkModeContext);

export function DarkModeProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  const [darkMode, dispatchDarkMode] = React.useReducer(
      (state: boolean, action: boolean) => {
        return action ? toggleDarkMode(action) : toggleDarkMode(!state);
      }, true);

  React.useEffect(() => {
    dispatchDarkMode(Boolean(JSON.parse(
        globalThis.window?.localStorage.getItem('dark') || 'false') ||
    globalThis.window?.document.body['className'] === 'dark' ||
    false));
  }, []);

  const MemoForContext: [typeof darkMode,
    React.DispatchWithoutAction] =
    React.useMemo(() =>
      [darkMode, dispatchDarkMode as React.DispatchWithoutAction],
    [darkMode, dispatchDarkMode]);

  return (
    <darkModeContext.Provider value={MemoForContext}>
      {children}
    </darkModeContext.Provider>
  );
}
