import { formatDuration, intervalToDuration } from "date-fns";
import { ArrowUpRight } from "lucide-react";

import { experience, type Job } from "../data/experience";
import { renderBold } from "../lib/render-bold";

function calculateDuration(start: Date, end: Date) {
  return formatDuration(intervalToDuration({ start, end }), {
    format: ["years", "months"],
  });
}

function formatYear(d: Date) {
  return d.getFullYear().toString();
}

function formatMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function JobBlock({ job }: { job: Job }) {
  const end = job.role.time.end ?? new Date();
  const duration = calculateDuration(job.role.time.start, end);
  const isPresent = !job.role.time.end;
  return (
    <article className="grid grid-cols-1 gap-4 border-t border-border py-6 md:grid-cols-[7rem_1fr] md:gap-8">
      {/* Left rail — date / location */}
      <div className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:text-right">
        <div className="font-mono text-foreground">
          {formatYear(job.role.time.start)}
          <span className="mx-1 opacity-60">→</span>
          {isPresent ? "now" : formatYear(end)}
        </div>
        <div className="font-mono">{duration}</div>
        <div className="font-mono opacity-70">{job.role.location}</div>
      </div>

      {/* Right column — role + highlights */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-medium leading-tight text-foreground">
            {job.company.link ? (
              <a
                href={job.company.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 no-underline transition-colors hover:text-accent"
              >
                {job.company.name}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </a>
            ) : (
              job.company.name
            )}
            <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
              · {job.company.blurb}
            </span>
          </h3>
          <div className="font-mono text-[11px] text-muted-foreground">
            {job.role.title}
            <span className="mx-2 opacity-50">·</span>
            {formatMonthYear(job.role.time.start)} — {isPresent ? "Present" : formatMonthYear(end)}
          </div>
        </div>
        {job.role.overview ? (
          <p className="font-mono text-[12px] italic text-muted-foreground">{job.role.overview}</p>
        ) : null}
        <ul className="flex flex-col gap-2.5 text-[12.5px] leading-[1.65]">
          {job.highlights.map((h, i) => (
            <li key={h} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-[3px] shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground/90">{renderBold(h)}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Experience() {
  return (
    <div className="flex flex-col">
      {experience.map((job) => (
        <JobBlock key={job.company.name} job={job} />
      ))}
    </div>
  );
}
