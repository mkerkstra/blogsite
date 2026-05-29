# Static SEO routes

kerkstra.dev is a **fully static / ISR site**. There is no auth, no
middleware, and no dynamic route segments. Every public page should be
prerendered so crawlers (and the CDN) get cached HTML instead of a
cold serverless render on every hit.

This document is the contract for keeping it that way. The verification
tool is the `next build` route table.

## The rule

Every page route must build as **`○ (Static)`** or **`◐ (Partial Prerender)`**.
**No public page may be `ƒ (Dynamic)`.**

```sh
pnpm exec next build
```

```
Route (app)
┌ ○ /                      ← static (homepage)
├ ○ /lab                   ← static (lab index)
├ ○ /lab/kirigami          ← static (one per experiment)
├ ○ /now                   ← ISR (revalidate 1d; GitHub fetch is cached)
├ ○ /reading               ← ISR
├ ○ /colophon              ← static
├ ○ /sitemap.xml           ← static
└ ○ /robots.txt            ← static
```

If any page shows `ƒ`, something opted the render into dynamic mode.
Find it before shipping.

## Why this matters (the incident)

A single `await headers()` in `src/app/not-found.tsx` — added to
randomize the 404 Ollie pic per request — deopted the **entire app**
to `ƒ Dynamic`. The root `not-found` renders inside the root layout for
every route, so reading a request API there poisons every page.

The blast radius was bigger than caching:

- Every page served `cache-control: private, no-cache, no-store` with
  `x-vercel-cache: MISS` — a cold render per crawler hit.
- `next build` emitted no `.html` files (dynamic pages aren't
  prerendered), so `scripts/post-process-html.ts` silently no-opped:
  - the homepage **Person JSON-LD was never injected**, and
  - **twitter:\* tags leaked site-wide** (the strip step had no files
    to strip — Matt is off X, so this violated a hard rule).

The fix was to make the 404 random pic a client component
(`src/features/ollie/components/ollie-404.tsx`) so `not-found.tsx`
stays static. One line, whole-site impact.

## What forces a page dynamic — keep these out of static routes

Anything that reads per-request state during render:

- `headers()`, `cookies()`, `draftMode()`, `connection()` from `next/headers`
- `unstable_noStore()` / `noStore()`
- `await searchParams` / `await params` used to branch render
- `fetch(..., { cache: "no-store" })` (or `next: { revalidate: 0 }`)
- segment config `export const dynamic = "force-dynamic"`

Special files (`not-found.tsx`, `error.tsx`, `global-error.tsx`,
`loading.tsx`, `layout.tsx`) are the most dangerous place to do any of
this, because they render in **every** route's tree. Push per-request
or client-only behavior into a `"use client"` child instead.

Note: `new Date()` / `Date.now()` at render do **not** force dynamic
rendering under the default (non-`cacheComponents`) model — they
evaluate at build time. They're only a concern if `cacheComponents` is
ever enabled.

## Allowed dynamic data — via ISR, not per-request rendering

`/now` fetches GitHub activity. It stays static by:

- `export const revalidate = 86400` on the page, and
- cached fetches (`next: { revalidate: 86400 }`) in the fetchers.

The page prerenders at build and re-renders at most once a day. The
GitHub token is read from `process.env` (build-time), which is not a
dynamic API.

## Why not `cacheComponents` / PPR

The narrative-nexus playbook adopts `cacheComponents: true` + PPR. That
site needed it: it has auth-gated chrome and per-entry dynamic routes
that must stay crawlable. **This site does not.** It has no auth, no
middleware, and no dynamic segments — it's static by nature. The
dynamic rendering here was a _bug_ (one `headers()` call), not an
architecture that needed PPR.

Enabling `cacheComponents` would force tearing out the working
`export const revalidate` / `force-static` ISR setup in favor of
`'use cache'` + `cacheLife` for zero crawlability gain. So we
deliberately **do not** enable it. Revisit only if a route is added
that genuinely needs per-request dynamic data on an otherwise static
page.

## Structured data + metadata

- JSON-LD is injected post-build by `scripts/post-process-html.ts`
  (homepage Person, lab CollectionPage/CreativeWork, BreadcrumbList) —
  not rendered in the React tree (avoids a hydration warning that costs
  Lighthouse best-practices points). This requires the routes to be
  static so the `.html` files exist.
- Per-lab metadata (title, description, canonical, OG) comes from
  `labMetadata()` in `src/features/lab/lib/metadata.ts`.
- The sitemap (`src/app/sitemap.ts`) generates lab URLs from the
  `experiments.ts` registry. `/ollie` is excluded (it's `noindex`).
- `sitemap.xml` / `robots.txt` get explicit long-lived `Cache-Control`
  via `next.config.ts` `headers()`.
