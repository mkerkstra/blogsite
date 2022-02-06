const classes = {
  container: `flex flex-col 
    items-center justify-center text-center
    py-2`,
};
export default function AboutMe() {
  return (
    <div className={classes.container}>
      <h1 className='text-6xl font-bold'>matt kerkstra</h1>
      <h1 className='mt-3 text-2xl'>senior software engineer</h1>
    </div>
  );
}
