"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  CircleHelp,
  Disc3,
  Maximize,
  Minimize,
  SlidersHorizontal,
} from "lucide-react";

import { useCanvasRecorder, useFullscreen } from "@/features/lab/lib/use-lab-tools";

import { ControlDivider, Tool } from "./controls";
import { LabInfo } from "./lab-info";

/**
 * The standardized lab-local INPUT chrome: one baseline strip at the viewport
 * bottom owning identity (caption, left) · the lab's control groups (slotted
 * children, divider-separated) · and an auto "meta" cluster (how-it-works + the
 * fullscreen/record tools, right). It also owns the how-it-works disclosure and
 * the keyboard wiring.
 *
 * Responsive: the strip height is constant, so the bottom inset never moves.
 * When the control groups don't fit, the non-`sticky` ones fold (by priority,
 * not blind wrap) into a scented "controls" sheet; the sticky group (the primary
 * verb — transport) and the tools stay put. Field labels drop first via a
 * container query (see ControlGroup).
 *
 * Live OUTPUT (telemetry) is a separate concern — see <LabReadout>.
 */
export function LabChrome({
  identity,
  info,
  children,
}: {
  identity: { name: string; scent?: string };
  info?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const recorder = useCanvasRecorder();

  const stripRef = useRef<HTMLDivElement>(null);
  const foldRef = useRef<HTMLDivElement>(null);
  const collapseWidthRef = useRef(0);

  const closeInfo = useCallback(() => setInfoOpen(false), []);
  const toggleInfo = useCallback(() => setInfoOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "?") {
        e.preventDefault();
        toggleInfo();
      } else if (e.key === "Escape") {
        setInfoOpen(false);
        setSheetOpen(false);
      }
    };
    const onToggleEvent = () => toggleInfo();
    window.addEventListener("keydown", onKey);
    window.addEventListener("toggle-lab-info", onToggleEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("toggle-lab-info", onToggleEvent);
    };
  }, [toggleFullscreen, toggleInfo]);

  // Priority collapse: fold foldable groups into the sheet when the strip
  // overflows; re-inline only once there's clearly room again (hysteresis).
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const measure = () => {
      setCollapsed((c) => {
        if (!c) {
          // The foldable container has overflow-hidden + min-w-0, so the strip
          // never reports overflow itself — measure the foldable's own content.
          const fold = foldRef.current;
          if (fold && fold.scrollWidth > fold.clientWidth + 1) {
            collapseWidthRef.current = strip.clientWidth;
            return true;
          }
          return c;
        }
        if (strip.clientWidth >= collapseWidthRef.current + 80) {
          setSheetOpen(false);
          return false;
        }
        return c;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    return () => observer.disconnect();
  }, []);

  const groups = Children.toArray(children).filter(isValidElement);
  const sticky = groups.filter((g) => (g.props as { sticky?: boolean }).sticky);
  const foldable = groups.filter((g) => !(g.props as { sticky?: boolean }).sticky);

  const withDividers = (els: typeof groups) =>
    els.map((g, i) => (
      <Fragment key={i}>
        {i > 0 && <ControlDivider />}
        {g}
      </Fragment>
    ));

  return (
    <>
      <div
        ref={stripRef}
        className="fixed inset-x-0 bottom-0 z-10 flex h-12 items-center gap-3 border-t border-border bg-background/80 px-4 backdrop-blur-sm md:px-6"
      >
        {/* identity caption */}
        <div className="flex shrink-0 flex-col justify-center gap-1 border-l-2 border-accent pl-2.5">
          <span className="font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-foreground/80">
            {identity.name}
          </span>
          {identity.scent && (
            <span className="hidden font-mono text-[8px] uppercase leading-none tracking-[0.1em] text-foreground/35 sm:block">
              {identity.scent}
            </span>
          )}
        </div>

        {/* foldable control groups — inline, or behind a "controls" sheet when tight */}
        {foldable.length > 0 && <ControlDivider />}
        {collapsed && foldable.length > 0 ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSheetOpen((v) => !v)}
              aria-expanded={sheetOpen}
              aria-label="Controls"
              className="inline-flex h-8 items-center gap-1.5 rounded px-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">controls</span>
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            {sheetOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  onClick={() => setSheetOpen(false)}
                />
                <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 flex flex-col gap-3 rounded border border-border bg-background/95 p-3 backdrop-blur-sm">
                  {foldable}
                </div>
              </>
            )}
          </div>
        ) : (
          <div ref={foldRef} className="flex min-w-0 items-center gap-3 overflow-hidden">
            {withDividers(foldable)}
          </div>
        )}

        {/* sticky groups (the primary verb) — always inline */}
        {sticky.length > 0 && (
          <div className="flex shrink-0 items-center gap-3">
            <ControlDivider />
            {withDividers(sticky)}
          </div>
        )}

        {/* meta cluster — how-it-works + tools */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {info && (
            <>
              <button
                type="button"
                onClick={toggleInfo}
                aria-label="How it works"
                aria-expanded={infoOpen}
                aria-controls="lab-info-panel"
                title="How it works (?)"
                className="inline-flex h-8 items-center gap-1.5 rounded px-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent"
              >
                <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">how it works</span>
              </button>
              <ControlDivider />
            </>
          )}
          <Tool
            label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title="Fullscreen (F)"
            onClick={toggleFullscreen}
            icon={
              isFullscreen ? (
                <Minimize className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Maximize className="h-3.5 w-3.5" aria-hidden="true" />
              )
            }
          />
          <Tool
            label={
              recorder.isRecording
                ? `rec ${recorder.seconds}s · stop recording`
                : "Record canvas to WebM"
            }
            title="Record canvas to WebM"
            onClick={recorder.toggle}
            pressed={recorder.isRecording}
            active={recorder.isRecording}
            icon={
              recorder.isRecording ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
                  <span className="font-mono text-[9px] tabular-nums">{recorder.seconds}s</span>
                </span>
              ) : (
                <Disc3 className="h-3.5 w-3.5" aria-hidden="true" />
              )
            }
          />
        </div>
      </div>

      {info && (
        <LabInfo open={infoOpen} onClose={closeInfo}>
          {info}
        </LabInfo>
      )}
    </>
  );
}
