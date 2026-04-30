# kerkstra.dev

Personal site for [Matt Kerkstra](https://www.kerkstra.dev/): resume, small blog-ish garden, visual lab, reading list, build notes, and a few self-indulgent corners. This repo exists to run the site, keep the resume honest, and give experiments somewhere to live.

## What Is Here

- `/` - resume-first homepage with experience, projects, tools, education, structured metadata, and a generated `resume.pdf`.
- `/now` - current focus, recent GitHub activity, and the "what am I actually doing lately" page.
- `/reading` - books that keep showing up in my working set.
- `/lab` - interactive visual experiments across GPU shaders, simulations, math, algorithms, ML explainers, and data structures.
- `/colophon` - how the site is built: stack, typography, color tokens, accessibility choices, and Lighthouse scores.
- `/ollie` - unindexed personal side quest, because the domain has room.
- `/api/resume.json` - machine-readable resume data for anything that wants to consume it.

The lab is the biggest current surface area. It includes raw WebGL and Canvas2D experiments for things like reaction diffusion, ray marching, flow fields, cloth, boids, Fourier drawing, pathfinding, attention, KV cache behavior, token sampling, wavelet trees, XOR filters, and learned indexes.

## Stack

- **Next.js 16** App Router with Turbopack
- **React 19** and **TypeScript 6**
- **Tailwind CSS 4** with HSL CSS variables and a small local design system
- `next-themes`, `lucide-react`, `cmdk`, Vercel Analytics, and Speed Insights
- Google fonts via `next/font`: Newsreader, Hanken Grotesk, and JetBrains Mono
- **oxlint + oxfmt** for lint/format
- **vitest + happy-dom** for tests
- Custom scripts for resume PDF generation, lab thumbnails, embeddings, HTML post-processing, and Lighthouse auditing

## Local

Requires Node 24+ and pnpm 10.

```sh
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Useful one-offs:

```sh
pnpm build:pdf          # regenerate public/resume.pdf
pnpm build:lab-thumbs   # regenerate lab preview images
pnpm build:embeddings   # rebuild lab/search embedding data
pnpm audit:lighthouse   # refresh Lighthouse audit data locally
```

## Lighthouse Scores

`pnpm build` does not update Lighthouse data. The `Lighthouse` GitHub Action runs after pushes to `main`, audits `https://www.kerkstra.dev`, and commits changes to `src/features/colophon/data/lighthouse.json` when the scores move. That workflow ignores commits that only touch the generated Lighthouse JSON, and the bot commit also uses `[skip ci]`.

## Code Map

```txt
src/
  app/                    # App Router pages, metadata, sitemap, robots, OG image, API route
  components/             # shared UI like command palette, theme toggle, widget frame
  features/
    resume/               # resume data, homepage sections, PDF/schema helpers
    lab/                  # experiment registry, shared lab helpers, visual experiments
    now/                  # current-focus data and GitHub activity fetchers
    reading/              # reading list data
    colophon/             # stack, design-token, Lighthouse, and craft-note content
    ollie/                # tiny personal gallery
  lib/                    # shared utilities
scripts/                  # build-time generators, post-processing, audits
public/                   # profile images, lab previews, resume PDF, static media
```

Most resume content lives in `src/features/resume/data/*`. Lab entries are registered in `src/features/lab/data/experiments.ts` and implemented under `src/features/lab/components/*` with matching routes under `src/app/lab/*`.

