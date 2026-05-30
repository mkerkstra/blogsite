"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the site footer on immersive lab detail pages (`/lab/<slug>`).
 *
 * Those pages render a full-bleed `fixed inset-0` canvas plus their own bottom
 * chrome (experiment label at `bottom-6 left-5`, control bar at `bottom-16`).
 * The document footer would float over the canvas in that same bottom strip and
 * collide with the lab's chrome — worst for long experiment names. The navbar
 * stays (it hosts the lab's fullscreen/record/info controls); the footer is
 * content-page chrome and is omitted here rather than fought with per-lab offsets.
 *
 * The `/lab` index is a normal content page, so it keeps the footer.
 */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (/^\/lab\/[^/]+/.test(pathname ?? "")) return null;
  return <>{children}</>;
}
