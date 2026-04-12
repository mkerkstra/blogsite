import type { StaticImageData } from "next/image";

import angelic from "../../../../public/ollie/angelic.jpeg";
import curledUp from "../../../../public/ollie/curled-up.jpeg";
import fancySweater from "../../../../public/ollie/fancy-sweater.jpeg";
import freshCroissant from "../../../../public/ollie/fresh-croissant.jpeg";
import hello from "../../../../public/ollie/hello.jpeg";
import isSheBack from "../../../../public/ollie/is-she-back.jpeg";
import justAdopted from "../../../../public/ollie/just-adopted.jpeg";
import mondays from "../../../../public/ollie/mondays.jpeg";
import pumpkinAlpaca from "../../../../public/ollie/pumpkin-alpaca.jpeg";
import stairsWereHard from "../../../../public/ollie/stairs-were-hard.jpeg";
import sundayVibes from "../../../../public/ollie/sunday-vibes.jpeg";
import tuckedIn from "../../../../public/ollie/tucked-in.jpeg";

export type OlliePic = {
  src: StaticImageData;
  alt: string;
  caption: string;
};

export const olliePics: OlliePic[] = [
  { src: angelic, alt: "Ollie looking angelic", caption: "looking innocent. don't trust it." },
  {
    src: curledUp,
    alt: "Ollie curled up in a ball",
    caption: "this page curled up and disappeared.",
  },
  {
    src: fancySweater,
    alt: "Ollie in a fancy sweater",
    caption: "dressed up with nowhere to go. like this url.",
  },
  {
    src: freshCroissant,
    alt: "Ollie next to a croissant",
    caption: "at least there's a croissant.",
  },
  { src: hello, alt: "Ollie saying hello", caption: "ollie says hi. the page does not." },
  { src: isSheBack, alt: "Ollie waiting by the door", caption: "ollie's waiting too." },
  {
    src: justAdopted,
    alt: "Ollie on adoption day",
    caption: "this page found a new home. not here.",
  },
  { src: mondays, alt: "Ollie looking tired", caption: "404 energy." },
  {
    src: pumpkinAlpaca,
    alt: "Ollie with a pumpkin and alpaca",
    caption: "wrong turn. but look at this alpaca.",
  },
  {
    src: stairsWereHard,
    alt: "Ollie exhausted after climbing stairs",
    caption: "this page couldn't make it up the stairs either.",
  },
  { src: sundayVibes, alt: "Ollie relaxing on Sunday", caption: "nothing here. that's the vibe." },
  {
    src: tuckedIn,
    alt: "Ollie tucked into a blanket",
    caption: "page not found. ollie doesn't care.",
  },
];

export const ollieBio = {
  name: "Ollie",
  breed: "Chihuahua and poodle, a.k.a. chipoodle",
  gotchaDay: "2018-08-05",
  origin: "Rescue",
  traits: [
    "Really clingy. Will find a nook and claim it.",
    "Likes blankets that match his fur color.",
    "Really doesn't like it when we leave the house.",
    "Dislikes big dogs and being jostled when he's settled in.",
    "Takes a pet like a champ.",
  ],
};
