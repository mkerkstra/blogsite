import Image from 'next/image';
import profilePic from '../../public/profilePic.jpg';
import {myAboutMe} from '../data/myAboutMe';

const classes = {
  name: `text-2xl sm:text-3xl font-extrabold`,
  location: ``,
  profilePicContainer: `
    inset-0
    overflow-hidden
    rounded-full
    absolute
    max-h-full
    z-10
  `,
};

export default function AboutMe() {
  return (
    <section>
      <div className={`flex items-center m-2`}>
        <div className={`flex justify-center items-center h-16 w-16 mr-4`}>
          <Image
            src={profilePic}
            alt={'profile pic'}
            className={`z-0 rounded-full`}
          />
        </div>
        <div className={``}>
          <h1 className={classes.name}>{myAboutMe.name}</h1>
          <p>{myAboutMe.title} - {myAboutMe.stack}</p>
          <p>{myAboutMe.location}</p>
        </div>
      </div>
      <p>{myAboutMe.blurb}</p>
    </section>)
  ;
}
