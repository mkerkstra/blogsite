import '../styles/globals.css';
import type {AppProps} from 'next/app';
import Layout from '../components/layout';
import {DarkModeProvider} from '../utilities/useDarkMode';

export default function MyApp({Component, pageProps}: AppProps) {
  return (
    <DarkModeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </DarkModeProvider>
  );
}
