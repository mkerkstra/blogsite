"use client";

import Image from "next/image";
import { useState } from "react";

import asciiPic from "../../../../public/profile/ascii.jpeg";
import editorialPic from "../../../../public/profile/editorial.jpeg";
import ghibliPic from "../../../../public/profile/ghibli.jpeg";
import profilePic from "../../../../public/profile/profilePic.jpg";

/**
 * Hero portrait that cycles through stylized versions on click
 * (photo → ASCII → editorial hedcut → Ghibli watercolor). All images
 * render simultaneously, stacked and toggled via opacity so the swap
 * is instant after first paint.
 */
const PORTRAITS = [
  { src: profilePic, label: "photo", alt: "Matt Kerkstra — photo portrait" },
  { src: asciiPic, label: "ascii", alt: "Matt Kerkstra — ASCII art portrait" },
  { src: editorialPic, label: "editorial", alt: "Matt Kerkstra — pen-and-ink portrait" },
  { src: ghibliPic, label: "ghibli", alt: "Matt Kerkstra — watercolor portrait" },
] as const;

export function CyclingPortrait() {
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => (i + 1) % PORTRAITS.length);
  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Portrait style: ${PORTRAITS[index].label}. Click to cycle.`}
      className="group relative mt-1 hidden h-[92px] w-[92px] shrink-0 cursor-pointer sm:block"
    >
      {PORTRAITS.map((p, i) => (
        <Image
          key={p.label}
          src={p.src}
          alt={p.alt}
          placeholder="blur"
          priority={i === 0}
          width={92}
          height={92}
          className={`absolute inset-0 h-[92px] w-[92px] object-cover transition-opacity duration-200 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <span className="pointer-events-none absolute inset-0 ring-1 ring-foreground/20 transition-all group-hover:ring-accent" />
    </button>
  );
}
