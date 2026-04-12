"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Image from "next/image";
import { toast } from "sonner";
import { StageColumn } from "./stage-column";
import { HealthBadge } from "./health-badge";
import { ProjectDetailModal } from "./project-detail-modal";
import { STAGES } from "@/lib/projects/types";
import type { Project, ProjectStage, HealthStatus } from "@/lib/projects/types";

export function PipelineBoard({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Sync with parent when filters change
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const projectsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.value] = projects.filter((p) => p.stage === stage.value);
      return acc;
    },
    {} as Record<ProjectStage, Project[]>
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    if (project) setActiveProject(project);
  }, [projects]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveProject(null);
      const { active, over } = event;
      if (!over) return;

      const projectId = active.id as string;
      const targetStage = over.id as ProjectStage;
      if (!STAGES.find((s) => s.value === targetStage)) return;

      const project = projects.find((p) => p.id === projectId);
      if (!project || project.stage === targetStage) return;

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, stage: targetStage } : p))
      );

      try {
        const res = await fetch(`/api/projects/${project.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: targetStage }),
        });
        if (!res.ok) throw new Error();
        const stageLabel = STAGES.find((s) => s.value === targetStage)?.label;
        toast.success(`${project.icon_emoji} ${project.name} moved to ${stageLabel}`);
      } catch {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, stage: project.stage } : p))
        );
        toast.error("Failed to move project");
      }
    },
    [projects]
  );

  const handleCardClick = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleProjectUpdate = useCallback((updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...updated, _checklist_total: p._checklist_total, _checklist_completed: p._checklist_completed } : p)));
    setSelectedProject(updated);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-6">
        {STAGES.map((stage, i) => (
          <StageColumn
            key={stage.value}
            stage={stage.value}
            label={stage.label}
            projects={projectsByStage[stage.value] || []}
            index={i}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onProjectUpdate={handleProjectUpdate}
      />

      <DragOverlay>
        {activeProject && (
          <div className="w-[264px] rounded-lg border border-accent/30 bg-card p-3 pl-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activeProject.logo_url ? (
                  <div className="size-7 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                    <Image src={activeProject.logo_url} alt="" width={28} height={28} className="size-7 object-contain" unoptimized />
                  </div>
                ) : (
                  <span className="text-lg">{activeProject.icon_emoji}</span>
                )}
                <span className="text-[13px] font-semibold">{activeProject.name}</span>
              </div>
              <HealthBadge health={activeProject.health as HealthStatus} score={activeProject.health_score} />
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
