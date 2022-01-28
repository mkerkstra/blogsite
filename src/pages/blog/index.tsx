type blogEntry = {
  title: string;
  content: JSX.Element | string;
  meta: {
    date: Date;
    tags: string[];
    slug: string;
  }
}

const classes = {
  container: `flex flex-col 
    items-center justify-center 
    py-2`,
};

export default function blog() {
  return (
    <div className={classes.container}>
      <h1 className='text-6xl font-bold'>mah blog</h1>
      <h1 className='mt-3 text-2xl'>bloggerino</h1>
    </div>
  );
}
