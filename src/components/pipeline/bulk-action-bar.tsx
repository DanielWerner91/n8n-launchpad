"use client";

import { useState } from "react";
import { X, Archive, Move, Tag, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STAGES, LABELS } from "@/lib/projects/types";
import type { Project, ProjectStage } from "@/lib/projects/types";

interface BulkActionBarProps {
  selectedIds: Set<string>;
  projects: Project[];
  onClear: () => void;
  onUpdate: () => void;
}

export function BulkActionBar({ selectedIds, projects, onClear, onUpdate }: BulkActionBarProps) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  if (selectedIds.size === 0) return null;

  const selectedProjects = projects.filter((p) => selectedIds.has(p.id));

  const bulkMoveToStage = async (stage: ProjectStage) => {
    setLoading(true);
    setShowStageMenu(false);
    try {
      await Promise.all(
        selectedProjects.map((p) =>
          fetch(`/api/projects/${p.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage }),
          })
        )
      );
      toast.success(`${selectedIds.size} project${selectedIds.size > 1 ? "s" : ""} moved to ${STAGES.find(s => s.value === stage)?.label}`);
      onUpdate();
      onClear();
    } catch {
      toast.error("Failed to move projects");
    } finally {
      setLoading(false);
    }
  };

  const bulkAddLabel = async (label: string) => {
    setLoading(true);
    setShowLabelMenu(false);
    try {
      await Promise.all(
        selectedProjects.map((p) => {
          const current = p.labels || [];
          const updated = current.includes(label) ? current : [...current, label];
          return fetch(`/api/projects/${p.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ labels: updated }),
          });
        })
      );
      toast.success(`Added "${LABELS.find(l => l.value === label)?.label}" label`);
      onUpdate();
    } catch {
      toast.error("Failed to add label");
    } finally {
      setLoading(false);
    }
  };

  const bulkArchive = async () => {
    if (!confirm(`Archive ${selectedIds.size} project${selectedIds.size > 1 ? "s" : ""}?`)) return;
    await bulkMoveToStage("archived");
  };

  return (
    <div className="sticky top-4 z-30 flex items-center gap-2 rounded-xl border border-foreground bg-foreground text-background shadow-2xl px-3 py-2 mx-auto w-fit">
      <span className="text-[13px] font-medium">
        {selectedIds.size} selected
      </span>

      <div className="h-5 w-px bg-background/20" />

      {/* Move to stage */}
      <div className="relative">
        <button
          onClick={() => { setShowStageMenu(!showStageMenu); setShowLabelMenu(false); }}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] hover:bg-background/10 transition-colors disabled:opacity-50"
        >
          <Move className="size-3.5" />
          Move to
        </button>
        {showStageMenu && (
          <div className="absolute top-full left-0 mt-1 rounded-lg border border-border bg-card shadow-xl min-w-[140px] py-1">
            {STAGES.map((s) => (
              <button
                key={s.value}
                onClick={() => bulkMoveToStage(s.value)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
              >
                <span className={cn("size-2 rounded-full", s.dot)} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add label */}
      <div className="relative">
        <button
          onClick={() => { setShowLabelMenu(!showLabelMenu); setShowStageMenu(false); }}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] hover:bg-background/10 transition-colors disabled:opacity-50"
        >
          <Tag className="size-3.5" />
          Add label
        </button>
        {showLabelMenu && (
          <div className="absolute top-full left-0 mt-1 rounded-lg border border-border bg-card shadow-xl min-w-[160px] py-1">
            {LABELS.map((l) => (
              <button
                key={l.value}
                onClick={() => bulkAddLabel(l.value)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
              >
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", l.color)}>
                  {l.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Archive */}
      <button
        onClick={bulkArchive}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] hover:bg-background/10 transition-colors disabled:opacity-50"
      >
        <Archive className="size-3.5" />
        Archive
      </button>

      <div className="h-5 w-px bg-background/20" />

      {/* Clear */}
      <button
        onClick={onClear}
        disabled={loading}
        className="flex items-center gap-1 rounded-md p-1 hover:bg-background/10 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      </button>
    </div>
  );
}
