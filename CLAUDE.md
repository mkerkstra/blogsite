# CLAUDE.md

Project conventions for Claude Code working in this repo. Mirrors `~/projects/narrative-nexus/apps/web` standards.

## What this is

Personal site for Matt Kerkstra → kerkstra.dev. Resume home page plus `/now`, `/reading`, `/lab` (interactive experiments), `/colophon`, `/ai-engineer`, and machine-readable surfaces (`/api/resume.json`, `/api/ai-profile.json`, `/llms.txt`). Flat repo (not a monorepo). Source-of-truth for resume _content_ is `~/projects/videa/resume.md`. The web page, PDF, and agent-facing endpoints all render off the same data files in `src/features/resume/data/`.

## Stack

- **Next 16** (App Router, Turbopack) · **React 19** · **TypeScript 7** (native `tsc`)
- TS config: `bundler` resolution, ES2017 target, `react-jsx`, `@/*` → `./src/*` alias
- **Tailwind 4** via `@tailwindcss/postcss`. No `tailwind.config.*`: tokens are shadcn-style HSL CSS variables in `src/app/globals.css`, bridged with `@theme inline`; dark mode is `@custom-variant dark`.
- Hand-rolled theme provider in `src/app/theme-provider.tsx` (no `next-themes`; the inline init script in `layout.tsx` prevents FOUC) · `lucide-react` for UI icons; brand glyphs live in `src/components/brand-icons.tsx` (no other icon libs)
- `next/font/google` — **Hanken Grotesk** (`font-sans`, body/headings) + **Newsreader** italic (`font-display`) + **JetBrains Mono** (`font-mono`, labels/chips/metadata)
- `@vercel/analytics` + `@vercel/speed-insights` (don't swap to PostHog without explicit ask)
- `cmdk` + `@radix-ui/react-dialog` for the ⌘K palette · `date-fns` behind `features/resume/lib/dates.ts`
- **oxlint + oxfmt** for lint/format (NOT eslint/prettier — they were intentionally removed). oxlint config is `oxlintrc.json` and only lints `src/`.
- **vitest + happy-dom + @testing-library/react + jest-dom** for tests (colocated `*.test.ts(x)` under `src/` and `scripts/`)
- **`@react-pdf/renderer`** + tsx for build-time PDF generation
- Node 24 (`.nvmrc`, CI, Vercel) · pnpm 10.x via `packageManager`; `pnpm-workspace.yaml` sets `minimumReleaseAge` to 8 days (matches dependabot's cooldown), so brand-new versions won't resolve

## Commands

```sh
pnpm dev               # next dev --turbopack on :3000 — assume always running
pnpm build             # runs build:pdf first, then next build
pnpm build:pdf         # tsx scripts/build-resume-pdf.tsx → public/resume.pdf (skips when public/resume.pdf.hash matches inputs)
pnpm build:embeddings  # regenerate features/lab/data/embedding-data.ts (transformers.js + umap-js)
pnpm build:lab-thumbs  # screenshot lab previews → public/lab-previews/ (needs dev server)
pnpm audit:lighthouse  # Lighthouse sweep → features/colophon/data/lighthouse.json
pnpm submit:indexnow   # ping IndexNow with changed URLs (normally run by CI)
pnpm lint              # oxfmt --check && oxlint --config oxlintrc.json src/
pnpm lint:fix          # autoformat + autofix
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest run
```

The dev server is always running. Don't check it, don't start it.

## File layout

```
src/
  app/                          # App Router
    layout.tsx                  # fonts + theme init script + providers + grain + skip link + analytics
    page.tsx                    # the resume page
    theme-provider.tsx          # light/dark provider ('use client')
    globals.css                 # Tailwind import + HSL tokens + grain + reveal anims + view-transition + print
    icon.svg                    # favicon (>_ glyph in lime)
    og/route.tsx                # OG image (next/og) — NOT an opengraph-image convention file, see SEO below
    not-found.tsx               # on-brand 404 (Ollie)
    robots.ts · sitemap.ts      # sitemap must list every public route, including each lab
    now/ · reading/ · colophon/ · ai-engineer/ · ollie/
    lab/                        # /lab — see src/features/lab/CLAUDE.md
    api/resume.json/route.ts    # jsonresume v1 schema endpoint
    api/ai-profile.json/route.ts
    llms.txt/route.ts
  components/
    command-palette*.tsx        # ⌘K palette (cmdk), lazy loader, navbar hint button
    theme-toggle.tsx            # Sun/Moon button
    json-ld.tsx · social-meta.tsx · breadcrumbs.tsx   # in-tree SEO
    widget-frame.tsx · brand-icons.tsx
  lib/
    site.ts                     # SITE_URL and site constants
    seo-schema.ts               # JSON-LD builders
    utils.ts                    # cn() helper
  features/resume/
    components/                 # AboutMe, Experience, Toolbox, Education, Projects, Navbar, Footer, FooterGate, Socials, SectionLabel, CyclingPortrait, widgets/
    data/                       # about-me, experience, toolbox, education, projects, positioning, widget-id — content lives here
    lib/
      dates.ts                  # shared date formatters (UTC-safe)
      render-bold.tsx           # **bold** → underlined span renderer (web)
      person-schema.ts          # Person JSON-LD from resume data
  features/now/
    components/contribution-graph.tsx  # editorial-style heatmap renderer
    data/now.ts                 # static "currently focused on" prose
    lib/github-contributions.ts # GraphQL fetcher + parser
    lib/github-repos.ts
  features/colophon/            # colophon widgets + data (stack, tokens, craft notes, lighthouse.json)
  features/ollie/               # the dog (404 + /ollie)
  features/reading/data/reading.ts
  features/lab/                 # see features/lab/CLAUDE.md
scripts/
  build-resume-pdf.tsx          # @react-pdf/renderer build script
  build-embeddings.ts · build-lab-thumbnails.ts · audit-lighthouse.ts · submit-indexnow.mjs
  lib/pdf-text.ts               # pure text helpers (clean, splitName, splitLede, stripBold)
  lib/indexnow-url-mapper.mjs   # changed files → URLs for IndexNow
docs/architecture/static-seo-routes.md   # why SEO meta renders in-tree (read before touching metadata)
```

## Aesthetic

"Engineer's editorial." Italic Newsreader display name against Hanken Grotesk body, with dense JetBrains Mono for labels, chips, and metadata. Two-tone (ink #0a0a0a / cream #f5f1e8) plus a single accent: electric lime (#d4ff00) in dark, green (#2a8a0e) in light. SVG fractal-noise grain overlay. `[01]`-numbered section labels with hairline rules. Don't introduce new fonts, new accent colors, or card-style chrome without an explicit ask — the design is intentional.

## Conventions

- **Data is source of truth.** Resume content lives in `src/features/resume/data/*` and mirrors `videa/resume.md`. The PDF, `/api/resume.json`, `/api/ai-profile.json`, `/llms.txt`, and `/ai-engineer` all read the same files. If you update content, update the data file — don't hand-write strings into components or routes.
- **Both renderers must work.** When changing data shapes, update `scripts/build-resume-pdf.tsx` alongside the components, and run `pnpm build:pdf` to verify the PDF still renders cleanly (delete `public/resume.pdf.hash` to force a render when only code changed).
- **PDF unicode caveat.** Built-in PDF fonts (Helvetica/Times/Courier) only support Latin-1. `clean()` in `scripts/lib/pdf-text.ts` substitutes `→`, `↳`, `✕`, `✓` — add new substitutions there if you introduce new unicode in data files.
- **Static SEO, no X/Twitter.** Never add `openGraph` to `metadata` or an `opengraph-image`/`twitter-image` file: Next derives `twitter:*` tags from them, and Matt is off X. OG tags and JSON-LD render in-tree via `<SocialMeta>`, `<JsonLd>`, and (for labs) `<LabHead>`. Post-build edits to `.next` don't reach Vercel. See `docs/architecture/static-seo-routes.md`.
- **Copy style.** No em-dashes in user-facing site copy (use periods or commas). Don't name-drop specific employers' internal projects or orgs without an explicit go-ahead.
- **Formatting.** oxfmt enforces double quotes + trailing semis. Don't fight it. After an inline element like `<Term>` followed by text across a JSX line break, use `&nbsp;`, not `{" "}` (oxfmt collapses it).
- **No new shadcn primitives** unless needed. The original `Card`/`Button`/`Collapsible` were removed because they didn't carry weight in the editorial design.
- **Animations are CSS-only** on the site chrome. No motion library. Reveals are `.reveal` + `.reveal-N` utilities in `globals.css`. (Lab experiments use raw Canvas2D/WebGL; see the lab doc.)
- **Server components by default.** Only mark `'use client'` for components that need state, theme, or event handlers (theme provider/toggle, command palette, cycling portrait, footer gate, Ollie 404, and the lab experiments).
- **Lighthouse 100s.** Desktop + mobile across the site and every lab. CI re-audits after each deploy and commits `lighthouse.json` (`Update Lighthouse scores [skip ci]` commits are expected).

## GitHub contribution graph (private)

The /now page renders a contribution heatmap. By default it falls back to the public-only `ghchart.rshah.org` SVG. To get the full heatmap (including private VideaHealth/narrative-nexus contributions), three things must all be true:

1. **`GITHUB_TOKEN` env var is set** — fine-grained PAT or classic token with `read:user`. In Vercel: Project → Settings → Environment Variables → add `GITHUB_TOKEN` to Production + Preview. Locally: `.env.local` (gitignored).
2. **GitHub profile setting "Include private contributions on my profile" is enabled** — github.com/settings/profile → Contributions section. The GraphQL API respects this flag and strips private counts when it's off, even when querying with the user's own token.
3. **The token belongs to mkerkstra** — the GraphQL `contributionsCollection` field returns full counts only when the authenticated user matches the queried user.

If any of those is missing, the page falls back gracefully to ghchart. The fetcher logic lives in `src/features/now/lib/github-contributions.ts`.

## CI, deploy, dependencies

- `.github/workflows/ci.yml` — lint, typecheck, build, test on Node 24.
- `.github/workflows/lighthouse.yml` — Lighthouse audit on each successful production deploy, commits scores.
- `.github/workflows/indexnow.yml` — submits changed URLs after each deploy.
- **Vercel** pins pnpm by project creation date, so `vercel.json` overrides `installCommand`/`buildCommand` with `npx -y pnpm@<ver>`. Keep that version in lockstep with `packageManager` in `package.json` whenever pnpm is bumped.
- **Dependabot** groups minor+patch weekly with an 8-day cooldown; majors get their own PRs. `@types/node` majors are ignored: it tracks the Node 24 runtime, bump it with the runtime.

## Pre-commit hooks (lefthook)

`lefthook.yml` defines pre-commit (`lint` + `typecheck` + `test`, triggered by staged `src/**` files) and pre-push (`build`) hooks. Lefthook is opt-in — it doesn't auto-install. After cloning, run once:

```sh
pnpm exec lefthook install
```

That writes the git hooks under `.git/hooks/`. Subsequent commits run the hooks automatically. To bypass (rarely), use `git commit --no-verify` — but only when you have a reason; the hooks exist to prevent regressions.

## Don'ts

- Don't add eslint/prettier back. oxlint+oxfmt are intentional.
- Don't reintroduce husky/lint-staged. lefthook is the modern replacement and is already configured.
- Don't add MDX, jest, ionicons, or @headlessui/react. They were removed for reasons.
- Don't restructure into a monorepo. Flat is intentional for this size of project.
- Don't add Twitter/X anywhere (links, cards, metadata, icons).
- Don't commit unless explicitly asked.
