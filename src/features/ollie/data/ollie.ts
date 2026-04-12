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
  {
    src: angelic,
    alt: "Ollie looking angelic",
    caption: "sorry we couldn't find that page - here's a little angel instead",
  },
  {
    src: curledUp,
    alt: "Ollie curled up in a ball",
    caption: "couldn't find that page - here's ollie recovering after a bath.",
  },
  {
    src: fancySweater,
    alt: "Ollie in a fancy sweater",
    caption: "dressed up with nowhere to go. like this url.",
  },
  {
    src: freshCroissant,
    alt: "Ollie next to a croissant",
    caption: "No page? at least there's a croissant.",
  },
  { src: hello, alt: "Ollie saying hello", caption: "ollie saying hello (unlike this page)." },
  { src: isSheBack, alt: "Ollie hearing my wife's home", caption: "What's that? Page not found?" },
  {
    src: justAdopted,
    alt: "Ollie on adoption day",
    caption: "this page found a new home.",
  },
  { src: mondays, alt: "Ollie looking tired", caption: "404 energy." },
  {
    src: pumpkinAlpaca,
    alt: "Ollie with a pumpkin and alpaca",
    caption: "wrong turn. but look at this little pumpkin and his alpaca.",
  },
  {
    src: stairsWereHard,
    alt: "Ollie exhausted after climbing stairs",
    caption: "stairs are scary - so are 404s.",
  },
  { src: sundayVibes, alt: "Ollie relaxing on Sunday", caption: "nothing here. that's the vibe." },
  {
    src: tuckedIn,
    alt: "Ollie tucked into a blanket",
    caption: "page not found - here's a tucked-in little pup.",
  },
];

export const ollieBio = {
  name: "Ollie",
  breed: "Our little chihuahua / poodle, a.k.a. chipoodle",
  gotchaDay: "2018-08-05",
  origin: "Little Rescue Pup",
  traits: [
    "Really clingy. Will find a nook and claim it.",
    "Likes blankets that match his fur color.",
    "Really doesn't like it when we leave the house.",
    "Dislikes big dogs and being jostled when he's settled in.",
    "Takes a pet like a champ.",
  ],
};
