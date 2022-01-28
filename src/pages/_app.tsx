import {ChakraProvider} from '@chakra-ui/react';
import type {AppProps} from 'next/app';
import '../styles/globals.css';
import Layout from '../components/layout';
import {DarkModeProvider} from '../utilities/useDarkMode';

export default function MyApp({Component, pageProps}: AppProps) {
  return (
    <ChakraProvider>
      <DarkModeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </DarkModeProvider>
    </ChakraProvider>
  );
}
