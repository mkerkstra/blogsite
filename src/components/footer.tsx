import Socials from './socials';
import {Text} from '@chakra-ui/react';

const classes = {
  footer: `
    flex  flex-col
    relative h-[10%] 
    bottom-0
    items-center
    justify-center
    w-screen 
    border-t 
    dark:bg-black bg-white
  `,
  span: `flex items-center justify-center dark:text-white text-black`,
};

const Footer = () => {
  return (
    <footer className={classes.footer}>
      <Text className={classes.span}>matt kerkstra</Text>
      <Socials/>
    </footer>
  );
};

export default Footer;
