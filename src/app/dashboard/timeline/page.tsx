"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  CalendarDays, ChevronLeft, ChevronRight, Diamond,
  Loader2, Plus, X, Check, Trash2, GripHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth,
  differenceInDays, differenceInCalendarWeeks, isSameDay, isToday,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  isPast, isBefore, isAfter, min as dateMin, max as dateMax,
} from "date-fns";
import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/projects/types";
import type { Project, Milestone, HealthStatus } from "@/lib/projects/types";

type ZoomLevel = "week" | "month" | "quarter";
type TimelineProject = Project & {
  _checklist_total: number;
  _checklist_completed: number;
  _milestones: Milestone[];
};

const ZOOM_CONFIG: Record<ZoomLevel, { colWidth: number; label: string; unitDays: number }> = {
  week: { colWidth: 40, label: "Week", unitDays: 1 },
  month: { colWidth: 20, label: "Month", unitDays: 1 },
  quarter: { colWidth: 6, label: "Quarter", unitDays: 1 },
};

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 56;
const HEALTH_COLORS: Record<string, string> = {
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
};

export default function TimelinePage() {
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    projectSlug: string;
    edge: "start" | "end";
    startX: number;
    originalDate: string;
  } | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch("/api/timeline");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Compute time range from project data
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (projects.length === 0) {
      const now = new Date();
      const start = addDays(now, -30);
      const end = addDays(now, 90);
      return { timelineStart: start, timelineEnd: end, totalDays: 120 };
    }

    const dates: Date[] = [];
    for (const p of projects) {
      if (p.start_date) dates.push(new Date(p.start_date));
      if (p.due_date) dates.push(new Date(p.due_date));
      if (p.created_at) dates.push(new Date(p.created_at));
      for (const m of p._milestones) {
        dates.push(new Date(m.target_date));
      }
    }
    dates.push(new Date()); // always include today

    const earliest = dateMin(dates);
    const latest = dateMax(dates);
    const start = addDays(startOfWeek(earliest), -14);
    const end = addDays(latest, 42);
    const days = differenceInDays(end, start);

    return { timelineStart: start, timelineEnd: end, totalDays: Math.max(days, 90) };
  }, [projects]);

  const colWidth = ZOOM_CONFIG[zoom].colWidth;
  const chartWidth = totalDays * colWidth;

  // Scroll to today on load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayOffset = differenceInDays(new Date(), timelineStart) * colWidth;
      scrollRef.current.scrollLeft = Math.max(0, todayOffset - 300);
    }
  }, [loading, timelineStart, colWidth]);

  // Generate header cells
  const headerCells = useMemo(() => {
    const cells: { label: string; x: number; width: number }[] = [];
    if (zoom === "week") {
      const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });
      for (const day of days) {
        const offset = differenceInDays(day, timelineStart);
        cells.push({
          label: format(day, "d"),
          x: offset * colWidth,
          width: colWidth,
        });
      }
    } else if (zoom === "month") {
      const weeks = eachWeekOfInterval({ start: timelineStart, end: timelineEnd });
      for (const week of weeks) {
        const offset = differenceInDays(week, timelineStart);
        cells.push({
          label: format(week, "MMM d"),
          x: offset * colWidth,
          width: 7 * colWidth,
        });
      }
    } else {
      const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
      for (const month of months) {
        const offset = differenceInDays(month, timelineStart);
        const daysInMonth = differenceInDays(
          addMonths(month, 1),
          month
        );
        cells.push({
          label: format(month, "MMM yyyy"),
          x: offset * colWidth,
          width: daysInMonth * colWidth,
        });
      }
    }
    return cells;
  }, [zoom, timelineStart, timelineEnd, colWidth]);

  // Top-level month labels for week zoom
  const monthLabels = useMemo(() => {
    if (zoom !== "week") return [];
    const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    return months.map((month) => {
      const offset = differenceInDays(month, timelineStart);
      const daysInMonth = differenceInDays(addMonths(month, 1), month);
      return {
        label: format(month, "MMMM yyyy"),
        x: offset * colWidth,
        width: daysInMonth * colWidth,
      };
    });
  }, [zoom, timelineStart, timelineEnd, colWidth]);

  const todayOffset = differenceInDays(new Date(), timelineStart) * colWidth;

  // Bar position helpers
  const getBarX = (dateStr: string | null, fallbackStr: string) => {
    const d = dateStr ? new Date(dateStr) : new Date(fallbackStr);
    return differenceInDays(d, timelineStart) * colWidth;
  };

  const getBarWidth = (startStr: string | null, endStr: string | null, createdAt: string) => {
    const s = startStr ? new Date(startStr) : new Date(createdAt);
    const e = endStr ? new Date(endStr) : addDays(new Date(), 30);
    const days = Math.max(differenceInDays(e, s), 7);
    return days * colWidth;
  };

  // Drag handlers for resizing bars
  const handleMouseDown = (e: React.MouseEvent, projectSlug: string, edge: "start" | "end", originalDate: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({ projectSlug, edge, startX: e.clientX, originalDate });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const daysDelta = Math.round(dx / colWidth);
      if (daysDelta === 0) return;

      const newDate = format(addDays(new Date(dragging.originalDate), daysDelta), "yyyy-MM-dd");
      setProjects((prev) =>
        prev.map((p) => {
          if (p.slug !== dragging.projectSlug) return p;
          if (dragging.edge === "start") return { ...p, start_date: newDate };
          return { ...p, due_date: newDate };
        })
      );
    };

    const handleMouseUp = async () => {
      const project = projects.find((p) => p.slug === dragging.projectSlug);
      if (project) {
        const field = dragging.edge === "start" ? "start_date" : "due_date";
        const value = dragging.edge === "start" ? project.start_date : project.due_date;
        try {
          await fetch(`/api/projects/${project.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
          toast.success(`Updated ${field === "start_date" ? "start" : "due"} date`);
        } catch {
          toast.error("Failed to save");
          fetchTimeline();
        }
      }
      setDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, colWidth, projects, fetchTimeline]);

  const addMilestone = async (projectSlug: string) => {
    if (!milestoneTitle || !milestoneDate) return;
    try {
      await fetch(`/api/projects/${projectSlug}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: milestoneTitle, target_date: milestoneDate }),
      });
      toast.success("Milestone added");
      setAddingMilestone(null);
      setMilestoneTitle("");
      setMilestoneDate("");
      fetchTimeline();
    } catch {
      toast.error("Failed to add milestone");
    }
  };

  const deleteMilestone = async (projectSlug: string, milestoneId: string) => {
    try {
      await fetch(`/api/projects/${projectSlug}/milestones?id=${milestoneId}`, { method: "DELETE" });
      toast.success("Milestone removed");
      fetchTimeline();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleMilestoneComplete = async (projectSlug: string, milestone: Milestone) => {
    const completed_at = milestone.completed_at ? null : new Date().toISOString();
    try {
      await fetch(`/api/projects/${projectSlug}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestone.id, completed_at }),
      });
      fetchTimeline();
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground">{projects.length} active projects</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          {(["week", "month", "quarter"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                zoom === z ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {ZOOM_CONFIG[z].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex">
          {/* Left sidebar: project names */}
          <div className="w-[220px] flex-shrink-0 border-r border-border bg-muted/30 z-10">
            <div className="h-[56px] flex items-center px-4 border-b border-border">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</span>
            </div>
            {projects.map((project, i) => {
              const stageInfo = STAGES.find((s) => s.value === project.stage);
              const pct = project._checklist_total > 0
                ? Math.round((project._checklist_completed / project._checklist_total) * 100)
                : 0;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="group flex items-center gap-2.5 px-4 border-b border-border/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {project.logo_url ? (
                    <div className="size-6 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                      <Image src={project.logo_url} alt="" width={24} height={24} className="size-6 object-contain" unoptimized />
                    </div>
                  ) : (
                    <span className="text-sm shrink-0">{project.icon_emoji}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-medium text-foreground">{project.name}</span>
                      <span className={cn("size-1.5 rounded-full shrink-0", stageInfo?.dot)} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: HEALTH_COLORS[project.health] || "#94a3b8" }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAddingMilestone(addingMilestone === project.slug ? null : project.slug);
                      setMilestoneDate(format(new Date(), "yyyy-MM-dd"));
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground transition-all"
                    title="Add milestone"
                  >
                    <Diamond className="size-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Right: scrollable chart area */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
            <div style={{ width: chartWidth, position: "relative" }}>
              {/* Month labels row (week zoom only) */}
              {zoom === "week" && (
                <div className="flex border-b border-border/30" style={{ height: 24 }}>
                  {monthLabels.map((cell, i) => (
                    <div
                      key={i}
                      className="text-[10px] font-semibold text-muted-foreground px-2 flex items-center border-r border-border/20"
                      style={{ position: "absolute", left: cell.x, width: cell.width }}
                    >
                      {cell.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Header row */}
              <div
                className="flex border-b border-border relative"
                style={{ height: zoom === "week" ? HEADER_HEIGHT - 24 : HEADER_HEIGHT }}
              >
                {headerCells.map((cell, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground/70 px-1 flex items-end pb-1.5 border-r border-border/10 shrink-0"
                    style={{ position: "absolute", left: cell.x, width: cell.width }}
                  >
                    {cell.label}
                  </div>
                ))}
              </div>

              {/* Project rows */}
              {projects.map((project, rowIndex) => {
                const barX = getBarX(project.start_date, project.created_at);
                const barW = getBarWidth(project.start_date, project.due_date, project.created_at);
                const pct = project._checklist_total > 0
                  ? Math.round((project._checklist_completed / project._checklist_total) * 100)
                  : 0;
                const healthColor = HEALTH_COLORS[project.health] || "#94a3b8";
                const isOverdue = project.due_date && isPast(new Date(project.due_date));

                return (
                  <div
                    key={project.id}
                    className="relative border-b border-border/30"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Background grid lines for weekends */}
                    {zoom === "week" &&
                      eachDayOfInterval({ start: timelineStart, end: timelineEnd })
                        .filter((d) => d.getDay() === 0 || d.getDay() === 6)
                        .map((d, i) => (
                          <div
                            key={i}
                            className="absolute inset-y-0 bg-muted/30"
                            style={{
                              left: differenceInDays(d, timelineStart) * colWidth,
                              width: colWidth,
                            }}
                          />
                        ))}

                    {/* Project bar */}
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.3 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.4, delay: rowIndex * 0.05 }}
                      className={cn(
                        "absolute top-2 group/bar rounded-md border cursor-default",
                        isOverdue ? "border-red-300" : "border-transparent"
                      )}
                      style={{
                        left: barX,
                        width: Math.max(barW, 28),
                        height: ROW_HEIGHT - 16,
                        backgroundColor: `${healthColor}18`,
                        transformOrigin: "left",
                      }}
                    >
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-l-md transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: `${healthColor}35`,
                        }}
                      />

                      {/* Bar label */}
                      {barW > 80 && (
                        <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-foreground/70 truncate">
                          {project.name}
                        </span>
                      )}

                      {/* Drag handles */}
                      <div
                        className="absolute inset-y-0 left-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 flex items-center justify-center rounded-l-md hover:bg-foreground/10 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, project.slug, "start", project.start_date || project.created_at)}
                      >
                        <GripHorizontal className="size-2.5 text-muted-foreground/60" />
                      </div>
                      <div
                        className="absolute inset-y-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 flex items-center justify-center rounded-r-md hover:bg-foreground/10 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, project.slug, "end", project.due_date || format(addDays(new Date(), 30), "yyyy-MM-dd"))}
                      >
                        <GripHorizontal className="size-2.5 text-muted-foreground/60" />
                      </div>
                    </motion.div>

                    {/* Milestones */}
                    {project._milestones.map((ms) => {
                      const msX = differenceInDays(new Date(ms.target_date), timelineStart) * colWidth;
                      return (
                        <div
                          key={ms.id}
                          className="absolute top-1 group/ms z-10"
                          style={{ left: msX - 7 }}
                        >
                          <button
                            onClick={() => toggleMilestoneComplete(project.slug, ms)}
                            className={cn(
                              "flex items-center justify-center size-5 rotate-45 rounded-sm border-2 transition-colors",
                              ms.completed_at
                                ? "border-emerald-500 bg-emerald-500"
                                : isPast(new Date(ms.target_date))
                                  ? "border-red-400 bg-red-50"
                                  : "border-violet-400 bg-violet-50"
                            )}
                          >
                            {ms.completed_at && <Check className="size-3 text-white -rotate-45" />}
                          </button>
                          {/* Tooltip */}
                          <div className="absolute left-1/2 -translate-x-1/2 top-7 hidden group-hover/ms:block z-20">
                            <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                              <p className="text-[11px] font-medium text-foreground">{ms.title}</p>
                              <p className="text-[10px] text-muted-foreground">{format(new Date(ms.target_date), "MMM d, yyyy")}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteMilestone(project.slug, ms.id); }}
                                className="mt-1 flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="size-2.5" /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add milestone inline form */}
                    {addingMilestone === project.slug && (
                      <div className="absolute top-1 right-4 z-20 flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 shadow-lg">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Milestone name"
                          value={milestoneTitle}
                          onChange={(e) => setMilestoneTitle(e.target.value)}
                          className="w-28 bg-transparent text-[11px] outline-none text-foreground placeholder:text-muted-foreground"
                          onKeyDown={(e) => e.key === "Enter" && addMilestone(project.slug)}
                        />
                        <input
                          type="date"
                          value={milestoneDate}
                          onChange={(e) => setMilestoneDate(e.target.value)}
                          className="bg-transparent text-[11px] outline-none text-foreground"
                        />
                        <button onClick={() => addMilestone(project.slug)} className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50">
                          <Check className="size-3" />
                        </button>
                        <button onClick={() => setAddingMilestone(null)} className="rounded p-0.5 text-muted-foreground hover:bg-muted">
                          <X className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 w-px bg-accent z-20 pointer-events-none"
                style={{ left: todayOffset }}
              >
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b-md bg-accent px-1.5 py-0.5">
                  <span className="text-[9px] font-bold text-background">TODAY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: `${HEALTH_COLORS.green}35` }} />
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: `${HEALTH_COLORS.yellow}35` }} />
          <span>At Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: `${HEALTH_COLORS.red}35` }} />
          <span>Behind</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Diamond className="size-3 text-violet-500 fill-violet-100" />
          <span>Milestone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Diamond className="size-3 text-emerald-500 fill-emerald-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-px h-3 bg-accent" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
