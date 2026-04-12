import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { projects } from "../data/projects";
import { Widget } from "./widgets";

export function Projects() {
  return (
    <div className="flex flex-col">
      {projects.map((project) => (
        <div
          key={project.name}
          className={cn(
            "grid gap-2 border-t border-border py-4 md:gap-8",
            project.widget
              ? "grid-cols-1 md:grid-cols-[7rem_1fr_200px]"
              : "grid-cols-1 md:grid-cols-[7rem_1fr]",
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
            {project.url}
          </div>
          <div className="flex flex-col gap-1">
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-baseline gap-1 self-start text-[15px] font-medium text-foreground no-underline transition-colors hover:text-accent"
            >
              {project.name}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </a>
            <p className="text-[12.5px] text-muted-foreground">{project.blurb}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{project.role}</p>
          </div>
          {project.widget ? <Widget id={project.widget} /> : null}
        </div>
      ))}
    </div>
  );
}
