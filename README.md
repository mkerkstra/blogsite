# kerkstra.dev

A single-page resume site for [Matt Kerkstra](https://www.kerkstra.dev/). Built as an "engineer's editorial" — Instrument Serif display name juxtaposed against a dense JetBrains Mono body, dark by default, with a single electric lime accent.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5.7+** (`bundler` resolution, `@/*` alias)
- **Tailwind 3.4** with shadcn-style HSL CSS variables
- `next-themes` for light/dark · `lucide-react` for icons
- `next/font/google` — Instrument Serif + JetBrains Mono
- **oxlint + oxfmt** for lint/format · **vitest + happy-dom** for tests
- `@vercel/analytics`

## Local

```sh
pnpm install
pnpm dev      # next dev --turbopack on :3000
pnpm build
pnpm lint     # oxfmt + oxlint
pnpm typecheck
```

Requires Node ≥24, pnpm ≥10.

## Layout

```
src/
  app/                    # App Router root + globals
  components/
    theme-toggle.tsx
  features/resume/
    components/           # AboutMe, Experience, Toolbox, Navbar, Footer, Socials, SectionLabel
    data/                 # about-me, experience, toolbox (resume content)
    lib/                  # render-bold helper
  lib/utils.ts            # cn helper
```

Resume content lives in `src/features/resume/data/*` and mirrors `~/projects/videa/resume.md`.

## License

MIT.
