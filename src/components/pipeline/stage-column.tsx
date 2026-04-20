"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";
import type { Project, ProjectStage } from "@/lib/projects/types";
import { STAGES } from "@/lib/projects/types";

export function StageColumn({
  stage,
  label,
  projects,
  index,
  onCardClick,
}: {
  stage: ProjectStage;
  label: string;
  projects: Project[];
  index: number;
  onCardClick?: (project: Project) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const dot = STAGES.find((s) => s.value === stage)?.dot || "bg-muted-foreground";
  const isEmpty = projects.length === 0;

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.04 }}
        ref={setNodeRef}
        title={`${label} (empty — drop here)`}
        className={cn(
          "group flex min-h-[300px] w-9 shrink-0 flex-col items-center gap-2 rounded-xl border border-dashed py-3 transition-all duration-200",
          isOver
            ? "w-[180px] border-accent/40 bg-accent/5 shadow-inner"
            : "border-border/60 bg-muted/20 hover:bg-muted/40"
        )}
      >
        <span className={cn("size-2 shrink-0 rounded-full", dot)} />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 [writing-mode:vertical-rl] rotate-180">
          {label}
        </h3>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      ref={setNodeRef}
      className={cn(
        "flex min-h-[300px] min-w-[180px] flex-1 flex-col rounded-xl border transition-all duration-200",
        isOver ? "border-accent/40 bg-accent/5 shadow-inner" : "border-border bg-muted/40"
      )}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border/50">
        <span className={cn("size-2 rounded-full", dot)} />
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
        <span className="ml-auto rounded-md bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
          {projects.length}
        </span>
      </div>

      <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 + i * 0.05 }}
            >
              <ProjectCard project={project} onCardClick={onCardClick} />
            </motion.div>
          ))}
        </div>
      </SortableContext>
    </motion.div>
  );
}
