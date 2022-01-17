import Head from 'next/head';

const classes = {
  container: `flex flex-col 
    items-center justify-center text-center
    py-2`,
};
export default function Home() {
  return (
    <div className={classes.container}>
      <Head>
        <title>Matt Kerkstra</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <h1 className='text-6xl font-bold'>matt kerkstra</h1>
      <h1 className='mt-3 text-2xl'>senior software engineer</h1>
    </div>
  );
}
