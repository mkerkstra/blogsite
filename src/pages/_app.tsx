import React from 'react';
import type {AppProps} from 'next/app';
import {Analytics} from '@vercel/analytics/react';

import '../styles/globals.css';

import {DarkModeProvider} from '../hooks/useDarkMode';
import Layout from '../components/layout';
import IonicIconLoader from '../components/ionicIconLoader';

export default function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
      <DarkModeProvider>
        <Layout>
          <Component {...pageProps} />
          <Analytics />
        </Layout>
      </DarkModeProvider>
      <IonicIconLoader/>
    </>
  );
}
