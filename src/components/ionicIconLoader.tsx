import Script from 'next/script';
import React from 'react';
import {defineCustomElements, JSX as LocalJSX} from '@ionic/core/loader';
import {JSX as IoniconsJSX} from 'ionicons';

export const IonicIconLoader = () => {
  React.useEffect(() => {
    void defineCustomElements(window);
  });
  return (
    <>
      <Script
        strategy='beforeInteractive'
        type="module"
        src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"
      />
      <Script
        strategy='beforeInteractive'
        noModule
        src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"
      />
    </>
  );
};

type ToReact<T> = {
  [P in keyof T]?: T[P] & Omit<React.HTMLAttributes<Element>, 'className'> & {
    class?: string;
    key?: React.ReactText;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements extends ToReact<LocalJSX.IntrinsicElements & IoniconsJSX.IntrinsicElements> {}
  }
}
