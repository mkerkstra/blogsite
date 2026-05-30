# Lab experiments

Interactive Canvas2D/WebGL visualizations at `/lab`. Each experiment is a `"use client"` component mounted fullscreen under `src/app/lab/[slug]/page.tsx`.

## File layout

```
src/
  app/lab/
    page.tsx                        # index — uses SectionLabel, links to all experiments
    [slug]/page.tsx                 # per-experiment: metadata + LabHead + <Component info={…} />
  features/lab/
    components/
      chrome/                       # the shared lab chrome design system (see #13)
        lab-chrome.tsx              # bottom INPUT strip: identity · control groups · tools + how-it-works disclosure
        lab-readout.tsx             # top OUTPUT HUD (live telemetry), pinned clear of the strip
        controls.tsx               # ControlGroup, Transport, LabSlider, LabSelect, Segmented, Stepper, Toggle, Tool
        gauges.tsx                  # Gauge, ProgressGauge, BarGauge, FormulaGauge, LiveDot
        lab-info.tsx                # "how it works" disclosure that rises from the strip (owned by LabChrome)
      term.tsx                      # inline glossary tooltip via data-tip + CSS ::after
      [experiment].tsx              # one component per experiment (takes an `info` prop)
    data/
      experiments.ts                # section groupings + slugs for the index page
      glossary.ts                   # centralized term definitions for <Term> tooltips
    lib/
      webgl.ts                      # compileShader, linkProgram, FULLSCREEN_VERT constants
      env.ts                        # getTheme(), prefersReducedMotion()
      palette.ts                    # shared PALETTE (bg/fg/accent) and TRAIL_PALETTE
      layout.ts                     # LAB_INSETS + labBounds() — safe content rect (clears navbar + strip)
      use-lab-canvas.ts             # LAB_CANVAS_CLASS + useLabCanvas() (full-bleed canvas + DPR sizing)
      use-lab-tools.ts              # useFullscreen() + useCanvasRecorder() (used by LabChrome)
```

## Rules for every experiment

1. **Interesting on load.** No blank canvases, no "draw something" prompts, no empty grids. Seed initial data, auto-run algorithms, enable physics, or pre-populate structures so the visitor sees something compelling within the first frame.

2. **How-it-works content.** Every experiment passes an `info` prop (a `ReactNode`) to its
   component; `LabChrome` renders it as the "how it works" disclosure (the `?` / ⌘K trigger). The
   page owns the content — it lives in the `info={<>…</>}` prop, NOT a `<LabInfoPanel>` (removed):
   - 3-4 paragraphs explaining the algorithm/technique at a level an interested engineer can follow
   - `<Term>` tooltips wrapping domain-specific jargon (definitions in `glossary.ts`)
   - Citation links at the bottom (`hover:text-accent`, `border-t border-border pt-2`)
   - Body text uses `font-sans` (not mono) inside the panel

3. **Use shared utilities.** Don't duplicate:
   - `getTheme()` / `prefersReducedMotion()` — import from `lib/env.ts`
   - `compileShader` / `linkProgram` / `FULLSCREEN_VERT` — import from `lib/webgl.ts`
   - `PALETTE` / `TRAIL_PALETTE` — import from `lib/palette.ts`
   - `LAB_CANVAS_CLASS` / `useLabCanvas()` — import from `lib/use-lab-canvas.ts`
   - `labBounds()` / `LAB_INSETS` — import from `lib/layout.ts`
   - Controls, gauges, and the chrome shell — import from `components/chrome/*` (see #13). Never
     hand-roll `<button>`/`<input>`/`<select>` for lab controls; the chrome primitives bake in the
     tap-target sizes and ARIA labels that keep Lighthouse a11y at 100.

4. **Viewport and layout.** Experiments render fullscreen (`fixed inset-0`, use `LAB_CANVAS_CLASS`) with the site navbar visible on top (~56px band). The **site footer is omitted on lab detail pages** (`FooterGate` in `features/resume/components/footer-gate.tsx`): the bottom belongs to the `LabChrome` strip (a fixed `h-12` bar at `bottom-0`), so the document footer isn't floated over the canvas. The navbar owns the top band, the chrome strip the bottom band; **meaningful canvas content (titles, axes, primary elements, stat text) must stay clear of both** — `labBounds(w,h,dpr)` from `lib/layout.ts` returns the safe device-px rect, and `LAB_INSETS` (top/bottom = 56) is the single source of truth for the band heights. Full-bleed shaders/particle fields with no edge-anchored meaning can bleed to every edge; the translucent chrome floats on top.

5. **Theme support.** Read `getTheme()` inside the frame loop (not just at mount) so live theme switches work. Use the site's two-tone palette: ink `#0a0a0a` / cream `#f5f1e8` with lime `#d4ff00` accent (dark) or green `#2a8a0e` accent (light).

6. **Responsiveness.** Canvas sizing uses `getBoundingClientRect()` and handles DPR. The `LabChrome` strip folds its control groups into a "controls" sheet when space is tight (see #13). Touch events (`pointer*`) work alongside mouse. Interaction radii scale by DPR where applicable.

7. **Reduced motion.** Check `prefersReducedMotion()` at mount. When true, reduce simulation speed/substeps but still render the static state. Never skip rendering entirely.

8. **No libraries.** Raw Canvas2D or WebGL2. No Three.js, no p5, no D3. This is the point.

9. **Command palette.** Experiment pages register a "How it works" entry in the command palette that dispatches a `toggle-lab-info` custom event.

10. **Glossary terms.** Add definitions to `glossary.ts`, wrap jargon with `<Term id="...">`. Keep definitions under ~25 words. Use explicit `{" "}` spacers around `<Term>` when adjacent text crosses JSX line breaks.

11. **Preview thumbnails.** After adding a lab, run `pnpm build:lab-thumbs` (dev server must be on :3000). The script captures both theme variants — `public/lab-previews/[slug].dark.png` and `[slug].light.png`. The dark variant doubles as the lab's OG image, referenced directly as `/lab-previews/[slug].dark.png` by `<LabHead>` — it is NOT copied into an `opengraph-image.png` convention file (that file convention makes Next emit `twitter:*` tags; Matt is off X). The index grid swaps the visible variant via the `theme-only-dark` / `theme-only-light` CSS classes (defined in `globals.css`). Override with `LAB_THUMBS_THEME=dark|light|both` and `LAB_THUMBS_ONLY=slug,slug` for partial regenerations.

12. **Per-lab metadata + head.** Use the `labMetadata(slug, title, description)` helper from `@/features/lab/lib/metadata` for `export const metadata` (sets title, description, canonical — no `openGraph`). Then render `<LabHead slug="..." />` (`@/features/lab/components/lab-head`) as the first child of the page so it emits `og:*` tags and CreativeWork + BreadcrumbList JSON-LD in-tree. Do NOT add `openGraph` to the metadata or an `opengraph-image` file — both make Next derive `twitter:*`. See `docs/architecture/static-seo-routes.md`.

13. **The chrome design system (`components/chrome/`).** Every lab wears the same chrome, split by
    Fitts/Gestalt into an INPUT zone (hands, bottom) and an OUTPUT zone (eyes, top):
    - **`<LabChrome identity={{name, scent}} info={info}>`** — the bottom `h-12` strip. It owns the
      identity caption (left), the lab's control groups (slotted children), the auto tools cluster
      (how-it-works · fullscreen `f` · record-WebM), the `f`/`?`/`Escape` keys, and the how-it-works
      disclosure (which renders the page's `info` prop). When the control groups don't fit, the
      non-`sticky` ones fold by priority into a "controls" sheet; the `sticky` group (the primary
      verb — usually `<Transport>`) and the tools stay put. Pass control groups as children:
      `<ControlGroup label="…" [sticky]>…</ControlGroup>` wrapping the primitives from `controls.tsx`
      (`Transport`, `LabSlider`, `LabSelect`, `Segmented`, `Stepper`, `Toggle`, `Tool`).
    - **`<LabReadout corner="left|right">`** — the top telemetry HUD (`pointer-events-none`). Lift
      live stats off the canvas into ≤4 gauges from `gauges.tsx` (`Gauge`/`ProgressGauge`/`BarGauge`/
      `FormulaGauge`), exactly one marked `primary`. **Pick the corner that lands on EMPTY canvas
      space** — labs that draw their own title/legend at top-left must use `corner="right"` (and vice
      versa), or the HUD overlaps the drawing. Omit `LabReadout` entirely if there's no live stat.
    - The recorder finds the largest `<canvas>` via `findLargestCanvas()` and downloads up to 30s of
      `video/webm` (vp9 when supported). The command palette's "How it works" entry dispatches a
      `toggle-lab-info` event that `LabChrome` listens for.

    **Tap targets.** The chrome primitives already bake in ≥24×24px tap targets (WCAG 2.5.8 /
    Lighthouse `target-size`), `<label>`-associated names for selects/sliders, and **native** range
    inputs (no `appearance-none` + `h-1` track, which collapses the target to 4px). This is the whole
    point of using them instead of hand-rolled controls. All 43 lab pages score 100 on Lighthouse
    desktop **and mobile** accessibility; keep it there.
