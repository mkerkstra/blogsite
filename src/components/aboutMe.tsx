import {myAboutMe} from '../data/myAboutMe';

const classees = {
  name: `text-2xl sm:text-3xl font-extrabold`,
  location: ``,
};

export default function AboutMe() {
  return (
    <section>
      <h1 className={classees.name}>{myAboutMe.name}</h1>
      <div>
        <p>{myAboutMe.title} - {myAboutMe.stack}</p>
        <p className={`
        sm
      `}>{myAboutMe.location}</p>
      </div>
      <p>{myAboutMe.blurb}</p>
    </section>)
  ;
}
