"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ExternalLink, Code, ArrowUpRight, Clock, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { HealthBadge } from "./health-badge";
import { ProjectQuickActions } from "./project-quick-actions";
import { cn } from "@/lib/utils";
import type { Project, HealthStatus } from "@/lib/projects/types";
import { LABELS, PRIORITIES } from "@/lib/projects/types";

const progressColors: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
};

function ProjectIcon({ project }: { project: Project }) {
  if (project.logo_url) {
    return (
      <div className="relative size-7 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
        <Image src={project.logo_url} alt={project.name} width={28} height={28} className="size-7 object-contain" unoptimized />
      </div>
    );
  }
  return <span className="text-lg leading-none shrink-0">{project.icon_emoji}</span>;
}

export function ProjectCard({ project, onCardClick, onStarToggle }: {
  project: Project;
  onCardClick?: (project: Project) => void;
  onStarToggle?: (id: string, starred: boolean) => void;
}) {
  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !project.is_starred;
    onStarToggle?.(project.id, newValue);
    try {
      await fetch(`/api/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newValue }),
      });
    } catch {
      onStarToggle?.(project.id, !newValue);
      toast.error("Failed to update");
    }
  };

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
  const priorityInfo = project.priority ? PRIORITIES.find((p) => p.value === project.priority) : null;
  const isOverdue = project.due_date ? isPast(new Date(project.due_date)) : false;
  const daysUntilDue = project.due_date ? differenceInDays(new Date(project.due_date), new Date()) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card transition-all duration-200 overflow-hidden",
        isDragging
          ? "border-accent/40 shadow-lg ring-1 ring-accent/20 scale-[1.02]"
          : "border-border hover:border-accent/30 hover:shadow-sm"
      )}
    >
      {/* Cover color bar */}
      {project.cover_color && (
        <div className={cn("h-1 w-full", project.cover_color)} />
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-y-0 left-0 flex w-5 cursor-grab items-center justify-center rounded-l-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-3 text-muted-foreground/40" />
      </div>

      <div
        className="p-3 pl-5 cursor-pointer"
        onClick={() => onCardClick?.(project)}
      >
        {/* Labels */}
        {project.labels && project.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {project.labels.map((label) => {
              const info = LABELS.find((l) => l.value === label);
              return (
                <span
                  key={label}
                  className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", info?.color || "bg-muted text-muted-foreground")}
                >
                  {info?.label || label}
                </span>
              );
            })}
          </div>
        )}

        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <ProjectIcon project={project} />
            <div className="group/link flex items-center gap-1 min-w-0">
              <span className="truncate text-[13px] font-semibold text-foreground group-hover:text-accent">
                {project.name}
              </span>
              <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 group-hover:text-accent" />
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={toggleStar}
              className={cn(
                "rounded p-0.5 transition-all",
                project.is_starred
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-muted-foreground/20 opacity-0 group-hover:opacity-100 hover:text-amber-400"
              )}
              aria-label={project.is_starred ? "Unstar" : "Star"}
            >
              <Star className={cn("size-3.5", project.is_starred && "fill-current")} />
            </button>
            <ProjectQuickActions project={project} onUpdate={() => onStarToggle?.(project.id, project.is_starred)} />
            <HealthBadge health={project.health as HealthStatus} score={project.health_score} />
          </div>
        </div>

        {/* Description preview */}
        {project.description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2 pl-[38px]">
            {project.description}
          </p>
        )}

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mt-2.5">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">{completedCount} of {totalCount}</span>
              <span className="text-[10px] font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColors[project.health] || "bg-muted-foreground/30")}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: priority + due date + links */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-2">
            {/* Priority */}
            {priorityInfo && (
              <span className={cn("flex items-center gap-1 text-[10px] font-medium", priorityInfo.color)}>
                <span className={cn("size-1.5 rounded-full", priorityInfo.dot)} />
                {priorityInfo.label}
              </span>
            )}

            {/* Due date */}
            {project.due_date && (
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                isOverdue ? "text-red-600" : daysUntilDue !== null && daysUntilDue <= 7 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {isOverdue ? <AlertCircle className="size-3" /> : <Clock className="size-3" />}
                {isOverdue
                  ? `${formatDistanceToNow(new Date(project.due_date))} overdue`
                  : daysUntilDue !== null && daysUntilDue <= 7
                    ? `${daysUntilDue}d left`
                    : formatDistanceToNow(new Date(project.due_date), { addSuffix: true })
                }
              </span>
            )}
          </div>

          {/* Links */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {project.links?.github_url && (
              <a href={project.links.github_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground">
                <Code className="size-3" />
              </a>
            )}
            {project.links?.live_url && (
              <a href={project.links.live_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground">
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
