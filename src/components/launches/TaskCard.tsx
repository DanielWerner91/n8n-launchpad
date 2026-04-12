"use client";

import { useState } from "react";
import {
  CheckSquare,
  Square,
  Clock,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LaunchTask, TaskPriority } from "@/lib/launches/types";
import { PLATFORM_COLORS, TASK_CATEGORY_COLORS } from "@/lib/launches/types";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

interface TaskCardProps {
  task: LaunchTask;
  onToggle: (taskId: string, newStatus: "completed" | "pending") => Promise<void>;
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const [toggling, setToggling] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === "completed";
  const isSkipped = task.status === "skipped";

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(task.id, isCompleted ? "pending" : "completed");
    } finally {
      setToggling(false);
    }
  };

  const platformColor = task.platform
    ? PLATFORM_COLORS[task.platform] || PLATFORM_COLORS.general
    : PLATFORM_COLORS.general;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-all",
        isCompleted && "border-emerald-200 bg-emerald-50/30",
        isSkipped && "border-border bg-muted/50 opacity-60",
        !isCompleted && !isSkipped && "border-border hover:border-accent/30"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={handleToggle}
          disabled={toggling || isSkipped}
          className="mt-0.5 shrink-0"
        >
          {toggling ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : isCompleted ? (
            <CheckSquare className="size-4 text-emerald-500" />
          ) : (
            <Square className="size-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm font-medium leading-tight",
                isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {task.title}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {task.priority && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    PRIORITY_STYLES[task.priority as TaskPriority]
                  )}
                >
                  {task.priority}
                </span>
              )}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {task.platform && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: platformColor }}>
                <span className="size-1.5 rounded-full" style={{ backgroundColor: platformColor }} />
                {task.platform.replace("_", " ")}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                {task.estimated_minutes}m
              </span>
            )}
            {task.category && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                  TASK_CATEGORY_COLORS[task.category as keyof typeof TASK_CATEGORY_COLORS] ||
                    "bg-muted text-muted-foreground"
                )}
              >
                {task.category.replace("_", " ")}
              </span>
            )}
          </div>

          {task.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? "Less" : "Details"}
            </button>
          )}

          {expanded && task.description && (
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {task.url && !isCompleted && (
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors"
            title="Open"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
