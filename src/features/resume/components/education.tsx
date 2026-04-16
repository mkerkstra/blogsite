import { ArrowUpRight } from "lucide-react";

import { education } from "../data/education";

export function Education() {
  return (
    <div className="flex flex-col">
      {education.map((row) => (
        <div
          key={row.school}
          className="grid grid-cols-1 gap-2 border-t border-border py-4 md:grid-cols-[7rem_1fr] md:gap-8"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
            {row.year}
            {row.gpa ? <span className="ml-2">GPA {row.gpa}</span> : null}
          </div>
          <div className="flex items-baseline gap-2 text-[13px]">
            {row.schoolUrl ? (
              <a
                href={row.schoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 font-medium text-foreground no-underline transition-colors hover:text-accent"
              >
                {row.school}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </a>
            ) : (
              <span className="font-medium text-foreground">{row.school}</span>
            )}
            <span className="text-muted-foreground">· {row.degree}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
