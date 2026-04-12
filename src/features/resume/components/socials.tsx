import { Mail } from "lucide-react";

import { Github, Linkedin } from "@/components/brand-icons";

type Social = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const socials: Social[] = [
  {
    name: "GitHub",
    href: "https://github.com/mkerkstra",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/matt-kerkstra",
    icon: Linkedin,
  },
  {
    name: "Email",
    href: "mailto:mattkerkstra@gmail.com",
    icon: Mail,
  },
];

export function Socials() {
  return (
    <nav className="flex items-center gap-1" aria-label="social links">
      {socials.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground no-underline transition-colors hover:text-accent"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </nav>
  );
}
