"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ExternalLink, Code, ArrowUpRight } from "lucide-react";
import { HealthBadge } from "./health-badge";
import { cn } from "@/lib/utils";
import type { Project, HealthStatus } from "@/lib/projects/types";

const progressColors: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
};

export function ProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { project },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedCount = project._checklist_completed ?? 0;
  const totalCount = project._checklist_total ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card transition-all duration-200",
        isDragging
          ? "border-accent/40 shadow-lg ring-1 ring-accent/20 scale-[1.02]"
          : "border-border hover:border-accent/30 hover:shadow-sm"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-y-0 left-0 flex w-5 cursor-grab items-center justify-center rounded-l-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-3 text-muted-foreground/40" />
      </div>

      <div className="p-3 pl-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg leading-none shrink-0">{project.icon_emoji}</span>
            <Link href={`/dashboard/projects/${project.slug}`} className="group/link flex items-center gap-1 min-w-0">
              <span className="truncate text-[13px] font-semibold text-foreground group-hover/link:text-accent">
                {project.name}
              </span>
              <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:text-accent" />
            </Link>
          </div>
          <HealthBadge health={project.health as HealthStatus} score={project.health_score} />
        </div>

        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">{completedCount} of {totalCount}</span>
              <span className="text-[11px] font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColors[project.health] || "bg-muted-foreground/30")}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {(project.links?.github_url || project.links?.live_url) && (
          <div className="mt-2.5 flex items-center gap-1 border-t border-border pt-2.5">
            {project.links.github_url && (
              <a href={project.links.github_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground">
                <Code className="size-3.5" />
              </a>
            )}
            {project.links.live_url && (
              <a href={project.links.live_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
