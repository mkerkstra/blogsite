# Lab experiments

Interactive Canvas2D/WebGL visualizations at `/lab`. Each experiment is a `"use client"` component mounted fullscreen under `src/app/lab/[slug]/page.tsx`.

## File layout

```
src/
  app/lab/
    page.tsx                        # index — uses SectionLabel, links to all experiments
    [slug]/page.tsx                 # per-experiment: metadata + component + LabInfoPanel
  features/lab/
    components/
      lab-info-panel.tsx            # slide-out "how it works" panel (shift+? hotkey)
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

## Rules for every experiment

1. **Interesting on load.** No blank canvases, no "draw something" prompts, no empty grids. Seed initial data, auto-run algorithms, enable physics, or pre-populate structures so the visitor sees something compelling within the first frame.

2. **How-it-works panel.** Every experiment page includes a `<LabInfoPanel>` with:
   - 3-4 paragraphs explaining the algorithm/technique at a level an interested engineer can follow
   - `<Term>` tooltips wrapping domain-specific jargon (definitions in `glossary.ts`)
   - Citation links at the bottom (`hover:text-accent`, `border-t border-border pt-2`)
   - Body text uses `font-sans` (not mono) inside the panel

3. **Use shared utilities.** Don't duplicate:
   - `getTheme()` / `prefersReducedMotion()` — import from `lib/env.ts`
   - `compileShader` / `linkProgram` / `FULLSCREEN_VERT` — import from `lib/webgl.ts`
   - `PALETTE` / `TRAIL_PALETTE` — import from `lib/palette.ts`
   - Button/control styling — import from `lib/control-styles.ts`

4. **Viewport and layout.** Experiments render fullscreen (`fixed inset-0`) with the site navbar/footer visible on top. Canvas fills the viewport. Control bars are `fixed bottom-16 left-1/2 -translate-x-1/2` with `bg-background/80 backdrop-blur-sm`. Bottom-left label shows experiment name + interaction hint in mono uppercase.

5. **Theme support.** Read `getTheme()` inside the frame loop (not just at mount) so live theme switches work. Use the site's two-tone palette: ink `#0a0a0a` / cream `#f5f1e8` with lime `#d4ff00` accent (dark) or green `#2a8a0e` accent (light).

6. **Responsiveness.** Canvas sizing uses `getBoundingClientRect()` and handles DPR. Control bars use `flex-wrap` on small screens. Touch events (`pointer*`) work alongside mouse. Interaction radii scale by DPR where applicable.

7. **Reduced motion.** Check `prefersReducedMotion()` at mount. When true, reduce simulation speed/substeps but still render the static state. Never skip rendering entirely.

8. **No libraries.** Raw Canvas2D or WebGL2. No Three.js, no p5, no D3. This is the point.

9. **Command palette.** Experiment pages register a "How it works" entry in the command palette that dispatches a `toggle-lab-info` custom event.

10. **Glossary terms.** Add definitions to `glossary.ts`, wrap jargon with `<Term id="...">`. Keep definitions under ~25 words. Use explicit `{" "}` spacers around `<Term>` when adjacent text crosses JSX line breaks.
