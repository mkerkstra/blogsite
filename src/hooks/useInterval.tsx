import {useEffect, useRef} from 'react';

/**
 * @see https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * @param {callback} callback - The function to call every interval
 * @param {delay} delay - The interval in milliseconds
 */
export function useInterval(callback: () => unknown, delay?: number) {
  const savedCallback = useRef<typeof callback>(() => {});

  // stash off the last callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay || 250);
      return () => clearInterval(id);
    }
  }, [delay]);
}
