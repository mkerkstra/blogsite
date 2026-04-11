import { ArrowUpRight, Lock } from "lucide-react";
import type { Metadata } from "next";

import { ContributionGraphView } from "@/features/now/components/contribution-graph";
import { nowState } from "@/features/now/data/now";
import { fetchContributionGraph } from "@/features/now/lib/github-contributions";
import { fetchRecentRepos } from "@/features/now/lib/github-repos";
import { SectionLabel } from "@/features/resume/components/section-label";

export const metadata: Metadata = {
  title: "Now",
  description:
    "What Matt Kerkstra is currently focused on — day job, side projects, open source, and recent GitHub activity.",
  alternates: { canonical: "/now" },
  openGraph: {
    title: "Now · kerkstra.dev",
    description:
      "What Matt Kerkstra is currently focused on — day job, side projects, open source, and recent GitHub activity.",
    url: "https://www.kerkstra.dev/now",
    type: "profile",
  },
};

// Refresh daily — the GitHub fetch is the only dynamic bit and we
// don't need it any fresher than that.
export const revalidate = 86400;

function timeSince(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}yr ago`;
}

export default async function NowPage() {
  const [repos, graph] = await Promise.all([fetchRecentRepos(), fetchContributionGraph()]);
  const updated = new Date(nowState.updatedOn).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-12">
      <header className="reveal flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          ↳ /now · last updated {updated}
        </p>
        <h1 className="display-name font-display text-[clamp(2.5rem,8vw,4.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground">
          what I&apos;m doing now.
        </h1>
      </header>

      {/* Focus blocks — static */}
      <section className="reveal reveal-1 flex flex-col gap-4">
        <SectionLabel index="01">Focus</SectionLabel>
        <div className="flex flex-col">
          {nowState.focus.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-1 gap-2 border-t border-border py-4 md:grid-cols-[7rem_1fr] md:gap-8"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
                {item.label}
              </div>
              <p className="text-[13px] leading-[1.7] text-foreground/90">{item.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub activity — derived */}
      <section className="reveal reveal-2 flex flex-col gap-4">
        <SectionLabel index="02">GitHub activity</SectionLabel>

        {graph ? (
          // Live, includes private contributions when GITHUB_TOKEN is set
          // and "Include private contributions on my profile" is on.
          <ContributionGraphView graph={graph} />
        ) : (
          // Fallback when no GITHUB_TOKEN is configured. Public contributions
          // only — won't show the videahealth/narrative private commits.
          // Setup instructions: see CLAUDE.md → "GitHub contribution graph (private)".
          <div className="flex flex-col gap-3 overflow-hidden rounded border border-border bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              public contributions only · GITHUB_TOKEN env var unset
            </p>
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="https://ghchart.rshah.org/d4ff00/mkerkstra"
              />
              <img
                src="https://ghchart.rshah.org/4d6d03/mkerkstra"
                alt="Matt Kerkstra's public GitHub contribution graph"
                className="w-full"
              />
            </picture>
          </div>
        )}

        {repos.length > 0 ? (
          <div className="flex flex-col">
            {repos.map((repo) => (
              <div
                key={repo.key}
                className="grid grid-cols-1 gap-2 border-t border-border py-3 md:grid-cols-[7rem_1fr] md:gap-8"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
                  {timeSince(repo.pushedAt)}
                </div>
                <div className="flex flex-col gap-1">
                  {repo.url ? (
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-baseline gap-1 self-start text-[14px] font-medium text-foreground no-underline transition-colors hover:text-accent"
                    >
                      {repo.displayName}
                      <ArrowUpRight className="h-3 w-3 opacity-50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <span className="inline-flex items-baseline gap-1.5 self-start text-[14px] font-medium text-foreground/70">
                      {repo.displayName}
                      <Lock
                        className="h-3 w-3 translate-y-0.5 opacity-50"
                        aria-label="private repository"
                      />
                    </span>
                  )}
                  {repo.description ? (
                    <p className="text-[12px] text-muted-foreground">{repo.description}</p>
                  ) : null}
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {repo.language ?? "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
