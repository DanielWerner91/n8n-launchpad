"use client";

import Image from "next/image";
import { formatDistanceToNow, isPast } from "date-fns";
import { ArrowUpDown, ArrowUpRight, ExternalLink, Code, Clock, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { HealthBadge } from "./health-badge";
import type { Project, HealthStatus, ProjectStage } from "@/lib/projects/types";
import { STAGES, LABELS, PRIORITIES } from "@/lib/projects/types";

type SortField = "name" | "stage" | "health_score" | "priority" | "due_date" | "updated_at";
type SortDir = "asc" | "desc";

const stageOrder: Record<ProjectStage, number> = {
  idea: 0, research: 1, build: 2, deploy: 3, live: 4, scaling: 5, archived: 6,
};
const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const STAGE_MAP = new Map(STAGES.map((s) => [s.value, s]));
const LABEL_MAP = new Map(LABELS.map((l) => [l.value, l]));
const PRIORITY_MAP = new Map(PRIORITIES.map((p) => [p.value, p]));

function sortProjects(projects: Project[], field: SortField, dir: SortDir): Project[] {
  return [...projects].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "stage": cmp = stageOrder[a.stage] - stageOrder[b.stage]; break;
      case "health_score": cmp = a.health_score - b.health_score; break;
      case "priority": cmp = (priorityOrder[a.priority || "low"] ?? 4) - (priorityOrder[b.priority || "low"] ?? 4); break;
      case "due_date": {
        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        cmp = ad - bd; break;
      }
      case "updated_at": cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(); break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export function ListView({ projects, onCardClick, selectedIds, onToggleSelect }: {
  projects: Project[];
  onCardClick?: (p: Project) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("stage");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const hasSelection = !!onToggleSelect;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => sortProjects(projects, sortField, sortDir), [projects, sortField, sortDir]);

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn("flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors", className)}
    >
      {label}
      <ArrowUpDown className={cn("size-3", sortField === field ? "text-foreground" : "text-muted-foreground/30")} />
    </button>
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className={cn(
        "grid gap-4 px-4 py-2.5 border-b border-border bg-muted/30",
        hasSelection ? "grid-cols-[24px_1fr_100px_80px_80px_100px_100px]" : "grid-cols-[1fr_100px_80px_80px_100px_100px]"
      )}>
        {hasSelection && (
          <input
            type="checkbox"
            checked={selectedIds && projects.length > 0 && projects.every((p) => selectedIds.has(p.id))}
            onChange={(e) => {
              projects.forEach((p) => {
                const isSelected = selectedIds?.has(p.id);
                if (e.target.checked && !isSelected) onToggleSelect?.(p.id, false);
                if (!e.target.checked && isSelected) onToggleSelect?.(p.id, false);
              });
            }}
            className="size-3.5 rounded border-border"
          />
        )}
        <SortHeader field="name" label="Project" />
        <SortHeader field="stage" label="Stage" />
        <SortHeader field="health_score" label="Health" />
        <SortHeader field="priority" label="Priority" />
        <SortHeader field="due_date" label="Due" />
        <SortHeader field="updated_at" label="Updated" />
      </div>

      {/* Rows */}
      {sorted.map((project) => {
        const stageInfo = STAGE_MAP.get(project.stage);
        const priorityInfo = project.priority ? PRIORITY_MAP.get(project.priority) : null;
        const isOverdue = project.due_date ? isPast(new Date(project.due_date)) : false;
        const completedCount = project._checklist_completed ?? 0;
        const totalCount = project._checklist_total ?? 0;
        const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const isSelected = selectedIds?.has(project.id);
        return (
          <div
            key={project.id}
            onClick={(e) => {
              if (hasSelection && (e.metaKey || e.ctrlKey || e.shiftKey)) {
                onToggleSelect?.(project.id, e.shiftKey);
              } else {
                onCardClick?.(project);
              }
            }}
            className={cn(
              "grid gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group",
              hasSelection ? "grid-cols-[24px_1fr_100px_80px_80px_100px_100px]" : "grid-cols-[1fr_100px_80px_80px_100px_100px]",
              isSelected && "bg-accent/5"
            )}
          >
            {hasSelection && (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={(e) => onToggleSelect?.(project.id, (e.nativeEvent as MouseEvent).shiftKey)}
                  className="size-3.5 rounded border-border cursor-pointer"
                />
              </div>
            )}

            {/* Name + logo + labels + progress */}
            <div className="flex items-center gap-3 min-w-0">
              {project.logo_url ? (
                <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                  <Image src={project.logo_url} alt="" width={32} height={32} className="size-8 object-contain" unoptimized />
                </div>
              ) : (
                <span className="text-xl shrink-0">{project.icon_emoji}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-foreground group-hover:text-accent">
                    {project.name}
                  </span>
                  <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {project.labels?.map((label) => {
                    const info = LABEL_MAP.get(label);
                    return (
                      <span key={label} className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold", info?.color || "bg-muted text-muted-foreground")}>
                        {info?.label || label}
                      </span>
                    );
                  })}
                </div>
                {totalCount > 0 && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                  </div>
                )}
              </div>
              {/* Quick links */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                {project.links?.github_url && (
                  <a href={project.links.github_url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground/40 hover:text-muted-foreground">
                    <Code className="size-3.5" />
                  </a>
                )}
                {project.links?.live_url && (
                  <a href={project.links.live_url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground/40 hover:text-muted-foreground">
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Stage */}
            <div className="flex items-center">
              <span className={cn("flex items-center gap-1.5 text-[12px] font-medium")}>
                <span className={cn("size-2 rounded-full", stageInfo?.dot)} />
                {stageInfo?.label}
              </span>
            </div>

            {/* Health */}
            <div className="flex items-center">
              <HealthBadge health={project.health as HealthStatus} score={project.health_score} />
            </div>

            {/* Priority */}
            <div className="flex items-center">
              {priorityInfo ? (
                <span className={cn("flex items-center gap-1 text-[11px] font-medium", priorityInfo.color)}>
                  <span className={cn("size-1.5 rounded-full", priorityInfo.dot)} />
                  {priorityInfo.label}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/40">--</span>
              )}
            </div>

            {/* Due date */}
            <div className="flex items-center">
              {project.due_date ? (
                <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                  {isOverdue ? <AlertCircle className="size-3" /> : <Clock className="size-3" />}
                  {formatDistanceToNow(new Date(project.due_date), { addSuffix: true })}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/40">--</span>
              )}
            </div>

            {/* Updated */}
            <div className="flex items-center">
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">No projects match your filters.</div>
      )}
    </div>
  );
}
