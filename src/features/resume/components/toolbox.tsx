import { toolbox, type Tool, type ToolGroup } from "../data/toolbox";

function ToolChip({ tool, groupLabel }: { tool: Tool; groupLabel: string }) {
  const className =
    "group inline-flex items-center gap-1 border border-border bg-transparent px-1.5 py-0.5 text-[12px] font-medium text-foreground/80 transition-all duration-150 hover:border-accent hover:bg-accent/10 hover:text-foreground";
  if (tool.link) {
    return (
      <a
        href={tool.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} no-underline`}
      >
        {tool.name}
        {/* Visually hidden suffix — keeps accessible name + textContent
            descriptive enough to pass Lighthouse's link-text audit
            (which blacklists short generic words like "go"). */}
        <span className="sr-only">, {groupLabel}</span>
      </a>
    );
  }
  return <span className={className}>{tool.name}</span>;
}

function ToolGroupSection({ group }: { group: ToolGroup }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-border py-4 md:grid-cols-[7rem_1fr] md:gap-8">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
        {group.label}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {group.tools.map((tool) => (
          <ToolChip key={tool.name} tool={tool} groupLabel={group.label} />
        ))}
      </div>
    </div>
  );
}

export function Toolbox() {
  return (
    <div className="flex flex-col">
      {toolbox.map((group) => (
        <ToolGroupSection key={group.id} group={group} />
      ))}
    </div>
  );
}
