"use client";

import { useState, useRef } from "react";
import { MoreHorizontal, ExternalLink, Archive, Copy, Trash2, Move, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { STAGES } from "@/lib/projects/types";
import type { Project, ProjectStage } from "@/lib/projects/types";

export function ProjectQuickActions({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => { setOpen(false); setShowMove(false); }, open);

  const update = async (body: Record<string, unknown>, successMsg: string) => {
    try {
      const res = await fetch(`/api/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(successMsg);
        onUpdate?.();
      }
    } catch {
      toast.error("Failed to update");
    }
    setOpen(false);
    setShowMove(false);
  };

  const copyId = () => {
    navigator.clipboard.writeText(project.slug);
    toast.success("Slug copied");
    setOpen(false);
  };

  const deleteProject = async () => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${project.slug}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Project deleted");
        onUpdate?.();
      }
    } catch {
      toast.error("Failed to delete");
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-muted hover:text-muted-foreground group-hover:opacity-100"
        aria-label="Actions"
      >
        <MoreHorizontal className="size-3.5" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border bg-card shadow-xl py-1"
        >
          <button
            onClick={() => update({ is_starred: !project.is_starred }, project.is_starred ? "Unstarred" : "Starred")}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
          >
            <Star className={cn("size-3.5", project.is_starred && "fill-current text-amber-400")} />
            {project.is_starred ? "Unstar" : "Star"}
          </button>

          {/* Move submenu */}
          <button
            onClick={() => setShowMove(!showMove)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <Move className="size-3.5" />
              Move to stage
            </span>
            <span className="text-muted-foreground">›</span>
          </button>

          {showMove && (
            <div className="border-t border-border py-1 bg-muted/30">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => update({ stage: s.value }, `Moved to ${s.label}`)}
                  className={cn(
                    "flex w-full items-center gap-2 px-5 py-1 text-[12px] hover:bg-muted",
                    project.stage === s.value ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <span className={cn("size-2 rounded-full", s.dot)} />
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {project.links?.live_url && (
            <a
              href={project.links.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              Open live site
            </a>
          )}

          <button
            onClick={copyId}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
          >
            <Copy className="size-3.5" />
            Copy slug
          </button>

          <div className="my-1 border-t border-border" />

          {project.stage !== "archived" && (
            <button
              onClick={() => update({ stage: "archived" as ProjectStage }, "Archived")}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
            >
              <Archive className="size-3.5" />
              Archive
            </button>
          )}

          <button
            onClick={deleteProject}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
