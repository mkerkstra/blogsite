# CLAUDE.md

Project conventions for Claude Code working in this repo. Mirrors `~/projects/narrative-nexus/apps/web` standards.

## What this is

Single-page resume site for Matt Kerkstra → kerkstra.dev. Flat repo (not a monorepo). Source-of-truth for resume _content_ is `~/projects/videa/resume.md`. The web and PDF render off the same data files in `src/features/resume/data/`.

## Stack

- **Next 16** (App Router, Turbopack) · **React 19** · **TypeScript 5.7+**
- TS config: `bundler` resolution, ES2017 target, `react-jsx`, `@/*` → `./src/*` alias
- **Tailwind 3.4** with shadcn-style HSL CSS variables in `src/app/globals.css`
- `next-themes` for light/dark · `lucide-react` for all icons (no other icon libs)
- `next/font/google` — **Instrument Serif** (display, italic) + **JetBrains Mono** (everything else)
- `@vercel/analytics` (don't swap to PostHog without explicit ask)
- **oxlint + oxfmt** for lint/format (NOT eslint/prettier — they were intentionally removed)
- **vitest + happy-dom + @testing-library/react** for tests
- **`@react-pdf/renderer`** + tsx for build-time PDF generation
- Node ≥24 · pnpm 10.x via `packageManager` field

## Commands

```sh
pnpm dev        # next dev --turbopack on :3000 — assume always running
pnpm build      # runs build:pdf first, then next build
pnpm build:pdf  # tsx scripts/build-resume-pdf.tsx → public/resume.pdf
pnpm lint       # oxfmt --check && oxlint
pnpm lint:fix   # autoformat + autofix
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest run
```

The dev server is always running. Don't check it, don't start it.

## File layout

```
src/
  app/                          # App Router
    layout.tsx                  # fonts + providers + grain + skip link
    page.tsx                    # the resume page
    providers.tsx               # next-themes wrapper
    globals.css                 # HSL tokens + grain + reveal anims + view-transition + print
    icon.svg                    # favicon (>_ glyph in lime)
    opengraph-image.tsx         # OG image (next/og)
    not-found.tsx               # on-brand 404
    now/page.tsx                # /now — current focus + GitHub heatmap
    reading/page.tsx            # /reading — book list
    lab/page.tsx                # /lab — experiment index
    lab/[slug]/page.tsx         # per-experiment pages (28 experiments)
    api/resume.json/route.ts    # jsonresume v1 schema endpoint
  components/
    command-palette.tsx         # ⌘K palette (cmdk)
    command-palette-hint.tsx    # navbar ⌘K button
    theme-toggle.tsx            # next-themes Sun/Moon button
  features/resume/
    components/                 # AboutMe, Experience, Toolbox, Education, Projects, Navbar, Footer, Socials, SectionLabel
    data/                       # about-me, experience, toolbox, education, projects — content lives here
    lib/
      dates.ts                  # shared date formatters (UTC-safe)
      render-bold.tsx           # **bold** → underlined span renderer (web)
  features/now/
    components/contribution-graph.tsx  # editorial-style heatmap renderer
    data/now.ts                 # static "currently focused on" prose
    lib/github-contributions.ts # GraphQL fetcher + parser
  features/lab/
    components/                 # lab-info-panel, term, + one component per experiment
    data/experiments.ts         # section groupings for index page
    data/glossary.ts            # centralized <Term> tooltip definitions
    lib/                        # webgl.ts, env.ts, palette.ts, control-styles.ts
  features/reading/
    data/reading.ts             # book list
  lib/utils.ts                  # cn() helper
scripts/
  build-resume-pdf.tsx          # @react-pdf/renderer build script
  lib/pdf-text.ts               # pure text helpers (clean, splitName, splitLede, stripBold)
```

## Aesthetic

"Engineer's editorial." Italic Instrument Serif display name juxtaposed against dense JetBrains Mono body. Two-tone (ink #0a0a0a / cream #f5f1e8) plus a single electric lime (#d4ff00) accent. SVG fractal-noise grain overlay. `[01]`-numbered section labels with hairline rules. Don't introduce new fonts, new accent colors, or card-style chrome without an explicit ask — the design is intentional.

## Conventions

- **Data is source of truth.** Resume content lives in `src/features/resume/data/*` and mirrors `videa/resume.md`. The PDF renderer reads from the same files. If you update content, update the data file — don't hand-write strings into components.
- **Both renderers must work.** When changing data shapes, update `scripts/build-resume-pdf.tsx` alongside the components, and run `pnpm build:pdf` to verify the PDF still renders cleanly.
- **PDF unicode caveat.** Built-in PDF fonts (Helvetica/Times/Courier) only support Latin-1. The `pdf()` helper in the build script substitutes `→`, `↳`, etc. — add new substitutions there if you introduce new unicode in data files.
- **Formatting.** oxfmt enforces double quotes + trailing semis. Don't fight it.
- **No new shadcn primitives** unless needed. The original `Card`/`Button`/`Collapsible` were removed because they didn't carry weight in the editorial design.
- **Animations are CSS-only.** No motion library. Reveals are `.reveal` + `.reveal-N` utilities in `globals.css`.
- **Server components by default.** Only mark `'use client'` for components that need state, theme, or event handlers (currently: `theme-toggle`, `providers`).

## GitHub contribution graph (private)

The /now page renders a contribution heatmap. By default it falls back to the public-only `ghchart.rshah.org` SVG. To get the full heatmap (including private VideaHealth/narrative-nexus contributions), three things must all be true:

1. **`GITHUB_TOKEN` env var is set** — fine-grained PAT or classic token with `read:user`. In Vercel: Project → Settings → Environment Variables → add `GITHUB_TOKEN` to Production + Preview. Locally: `.env.local` (gitignored).
2. **GitHub profile setting "Include private contributions on my profile" is enabled** — github.com/settings/profile → Contributions section. The GraphQL API respects this flag and strips private counts when it's off, even when querying with the user's own token.
3. **The token belongs to mkerkstra** — the GraphQL `contributionsCollection` field returns full counts only when the authenticated user matches the queried user.

If any of those is missing, the page falls back gracefully to ghchart. The fetcher logic lives in `src/features/now/lib/github-contributions.ts`.

## Pre-commit hooks (lefthook)

`lefthook.yml` defines pre-commit (`lint` + `typecheck` + `test`) and pre-push (`build`) hooks. Lefthook is opt-in — it doesn't auto-install. After cloning, run once:

```sh
pnpm exec lefthook install
```

That writes the git hooks under `.git/hooks/`. Subsequent commits run the hooks automatically. To bypass (rarely), use `git commit --no-verify` — but only when you have a reason; the hooks exist to prevent regressions.

## Lab experiments (`/lab`)

The lab section hosts interactive Canvas2D/WebGL visualizations at `src/features/lab/`. Each experiment is a `"use client"` component mounted fullscreen under `src/app/lab/[slug]/page.tsx`.

### File layout

```
src/
  app/lab/
    page.tsx                        # index — uses SectionLabel, links to all experiments
    [slug]/page.tsx                 # per-experiment: metadata + component + LabInfoPanel
  features/lab/
    components/
      lab-info-panel.tsx            # slide-out "how it works" panel (⇧? hotkey)
      term.tsx                      # inline glossary tooltip via data-tip + CSS ::after
      [experiment].tsx              # one component per experiment
    data/
      experiments.ts                # section groupings + slugs for the index page
      glossary.ts                   # centralized term definitions for <Term> tooltips
    lib/
      webgl.ts                      # compileShader, linkProgram, FULLSCREEN_VERT constants
      env.ts                        # getTheme(), prefersReducedMotion()
      palette.ts                    # shared PALETTE (bg/fg/accent) and TRAIL_PALETTE
      control-styles.ts             # btnBase, btnActive, btnInactive, controlBar class strings
```

### Rules for every experiment

1. **Interesting on load.** Every experiment must start in a visually engaging state. No blank canvases, no "draw something" prompts, no empty grids. Seed initial data, auto-run algorithms, enable physics, or pre-populate structures so the visitor sees something compelling within the first frame.

2. **How-it-works panel.** Every experiment page must include a `<LabInfoPanel>` with:
   - 3-4 paragraphs explaining the algorithm/technique at a level an interested engineer can follow
   - `<Term>` tooltips wrapping domain-specific jargon (definitions in `glossary.ts`)
   - Citation links at the bottom (`hover:text-accent`, `border-t border-border pt-2`)
   - Use `font-sans` body text (not mono) inside the panel

3. **Use shared utilities.** Don't duplicate:
   - `getTheme()` / `prefersReducedMotion()` — import from `lib/env.ts`
   - `compileShader` / `linkProgram` / `FULLSCREEN_VERT` — import from `lib/webgl.ts`
   - `PALETTE` / `TRAIL_PALETTE` — import from `lib/palette.ts`
   - Button/control styling — import from `lib/control-styles.ts`

4. **Viewport and layout.** Experiments render fullscreen (`fixed inset-0`) with the site navbar/footer visible on top. The canvas fills the viewport. Control bars are `fixed bottom-16 left-1/2 -translate-x-1/2` with `bg-background/80 backdrop-blur-sm`. The bottom-left label shows experiment name + interaction hint in mono uppercase.

5. **Theme support.** Every experiment must render correctly in both light and dark themes. Read `getTheme()` inside the frame loop (not just at mount) so live theme switches work. Use the site's two-tone palette: ink `#0a0a0a` / cream `#f5f1e8` with lime `#d4ff00` accent (dark) or green `#2a8a0e` accent (light).

6. **Responsiveness.** Experiments must work on mobile viewports. Canvas sizing uses `getBoundingClientRect()` and handles DPR. Control bars use `flex-wrap` to avoid horizontal overflow on small screens. Touch events (`pointer*`) work alongside mouse. Interaction radii scale by DPR where applicable.

7. **Reduced motion.** Check `prefersReducedMotion()` at mount. When true, reduce simulation speed/substeps but still render the static state. Never skip rendering entirely.

8. **No libraries.** All experiments are raw Canvas2D or WebGL2. No Three.js, no p5, no D3. This is the point.

9. **Command palette integration.** Experiment pages register a "How it works" entry in the command palette (`⌘K`) that dispatches a `toggle-lab-info` custom event.

10. **Glossary terms.** When adding new domain-specific jargon to a how-it-works panel, add the definition to `glossary.ts` and wrap the term with `<Term id="...">`. Keep definitions under ~25 words. Watch for JSX whitespace collapsing around `<Term>` — use explicit `{" "}` spacers when a term is adjacent to other text across line breaks.

## Don'ts

- Don't add eslint/prettier back. oxlint+oxfmt are intentional.
- Don't reintroduce husky/lint-staged. lefthook is the modern replacement and is already configured.
- Don't add MDX, jest, ionicons, or @headlessui/react. They were removed for reasons.
- Don't restructure into a monorepo. Flat is intentional for this size of project.
- Don't commit unless explicitly asked.
