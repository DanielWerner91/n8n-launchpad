"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CalendarDays, Diamond, Loader2, Plus, X, Check, Trash2,
  Megaphone, Share2, Wrench, ChevronDown, ChevronRight,
  AlertTriangle, Rocket, CheckCircle2, Circle, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/projects/types";
import type { Project, Milestone, HealthStatus } from "@/lib/projects/types";

interface CategoryData {
  total: number;
  completed: number;
  categories: Record<string, { total: number; completed: number }>;
}

interface AutoMilestone {
  id: string;
  label: string;
  group: string;
  icon: string;
  is_completed: boolean;
  completed_at: string | null;
  checklist_item_id: string;
}

type TimelineProject = Project & {
  _checklist_total: number;
  _checklist_completed: number;
  _groups: Record<string, CategoryData>;
  _auto_milestones: AutoMilestone[];
  _milestones: Milestone[];
};

const GROUP_CONFIG = {
  build: { label: "Build", icon: Wrench, color: "bg-violet-500", lightColor: "bg-violet-100", textColor: "text-violet-700", trackColor: "bg-violet-200" },
  marketing: { label: "Marketing", icon: Megaphone, color: "bg-amber-500", lightColor: "bg-amber-100", textColor: "text-amber-700", trackColor: "bg-amber-200" },
  distribution: { label: "Distribution", icon: Share2, color: "bg-emerald-500", lightColor: "bg-emerald-100", textColor: "text-emerald-700", trackColor: "bg-emerald-200" },
};

const HEALTH_COLORS: Record<string, string> = {
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
};

const MILESTONE_ICONS: Record<string, string> = {
  voice: "🎙️", linkedin: "💼", pipeline: "🔗", content: "📝",
  schedule: "📅", rocket: "🚀", engage: "💬", milestone: "🏆",
  revenue: "💰", newsletter: "📧", launch: "🌐", social: "📱",
};

function SegmentBar({ group, data }: { group: string; data: CategoryData }) {
  const config = GROUP_CONFIG[group as keyof typeof GROUP_CONFIG];
  if (!config || data.total === 0) return null;
  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 w-[90px] shrink-0">
        <config.icon className="size-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">{config.label}</span>
      </div>
      <div className={cn("h-2.5 flex-1 rounded-full overflow-hidden", config.trackColor)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", config.color)}
        />
      </div>
      <span className={cn("text-[10px] font-bold w-[32px] text-right tabular-nums", pct === 100 ? "text-emerald-600" : "text-muted-foreground")}>
        {pct}%
      </span>
    </div>
  );
}

function MilestoneTrack({ milestones, group }: { milestones: AutoMilestone[]; group: string }) {
  const config = GROUP_CONFIG[group as keyof typeof GROUP_CONFIG];
  const groupMs = milestones.filter((m) => m.group === group);
  if (groupMs.length === 0) return null;

  const completed = groupMs.filter((m) => m.is_completed);
  const next = groupMs.find((m) => !m.is_completed);

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        {groupMs.map((ms, i) => (
          <div key={ms.id} className="flex items-center gap-0.5">
            {i > 0 && <ArrowRight className="size-2 text-muted-foreground/30 mx-0.5" />}
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium transition-all",
                ms.is_completed
                  ? "bg-emerald-100 text-emerald-700"
                  : ms === next
                    ? cn(config?.lightColor, config?.textColor, "ring-1 ring-current/20")
                    : "bg-muted text-muted-foreground/50"
              )}
            >
              {ms.is_completed ? (
                <CheckCircle2 className="size-2.5" />
              ) : ms === next ? (
                <Circle className="size-2.5" />
              ) : (
                <Circle className="size-2.5 opacity-40" />
              )}
              <span className="hidden sm:inline">{MILESTONE_ICONS[ms.icon] || "◆"}</span>
              <span className="truncate max-w-[100px]">{ms.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectRow({ project, isExpanded, onToggle }: {
  project: TimelineProject;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const stageInfo = STAGES.find((s) => s.value === project.stage);
  const overallPct = project._checklist_total > 0
    ? Math.round((project._checklist_completed / project._checklist_total) * 100)
    : 0;
  const healthColor = HEALTH_COLORS[project.health] || "#94a3b8";

  const buildData = project._groups.build;
  const marketingData = project._groups.marketing;
  const distData = project._groups.distribution;

  // Determine what needs attention
  const buildPct = buildData?.total > 0 ? Math.round((buildData.completed / buildData.total) * 100) : 100;
  const marketingPct = marketingData?.total > 0 ? Math.round((marketingData.completed / marketingData.total) * 100) : 100;
  const distPct = distData?.total > 0 ? Math.round((distData.completed / distData.total) * 100) : 100;

  const isStalled = buildPct > 70 && distPct < 10; // tech done but distribution not started
  const nextMilestone = project._auto_milestones.find((m) => !m.is_completed);

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isStalled ? "border-amber-200 bg-amber-50/30" : "border-border bg-card"
    )}>
      {/* Main row */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        {/* Left: project info */}
        <div className="flex items-center gap-3 w-[180px] shrink-0">
          <button className="text-muted-foreground/50 hover:text-muted-foreground">
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
          {project.logo_url ? (
            <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              <Image src={project.logo_url} alt="" width={32} height={32} className="size-8 object-contain" unoptimized />
            </div>
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
              {project.icon_emoji}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-foreground truncate">{project.name}</span>
              <span className={cn("size-1.5 rounded-full shrink-0", stageInfo?.dot)} />
            </div>
            <span className="text-[10px] text-muted-foreground">{stageInfo?.label}</span>
          </div>
        </div>

        {/* Center: segment bars */}
        <div className="flex-1 min-w-0 space-y-1">
          <SegmentBar group="build" data={buildData || { total: 0, completed: 0, categories: {} }} />
          <SegmentBar group="marketing" data={marketingData || { total: 0, completed: 0, categories: {} }} />
          <SegmentBar group="distribution" data={distData || { total: 0, completed: 0, categories: {} }} />
        </div>

        {/* Right: overall + status */}
        <div className="w-[120px] shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%`, backgroundColor: healthColor }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: healthColor }}>{overallPct}%</span>
          </div>

          {isStalled && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
              <AlertTriangle className="size-3" />
              Distribution stalled
            </span>
          )}

          {nextMilestone && !isStalled && (
            <span className="text-[10px] text-muted-foreground truncate max-w-full">
              Next: {nextMilestone.label}
            </span>
          )}

          {overallPct === 100 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <CheckCircle2 className="size-3" />
              Complete
            </span>
          )}
        </div>
      </div>

      {/* Expanded: milestone tracks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 ml-[180px] space-y-3 border-t border-border/50 pt-3">
              {/* Category detail for each group */}
              {(["build", "marketing", "distribution"] as const).map((groupKey) => {
                const data = project._groups[groupKey];
                const config = GROUP_CONFIG[groupKey];
                if (!data || data.total === 0) return null;

                return (
                  <div key={groupKey}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <config.icon className={cn("size-3.5", config.textColor)} />
                      <span className={cn("text-[11px] font-semibold", config.textColor)}>{config.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {data.completed}/{data.total} items
                      </span>
                    </div>

                    {/* Category breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 ml-5">
                      {Object.entries(data.categories).map(([cat, catData]) => {
                        const catPct = Math.round((catData.completed / catData.total) * 100);
                        return (
                          <div key={cat} className="flex items-center gap-1.5">
                            {catPct === 100 ? (
                              <CheckCircle2 className="size-3 text-emerald-500" />
                            ) : catPct > 0 ? (
                              <div className="size-3 rounded-full border-2 border-amber-400" />
                            ) : (
                              <Circle className="size-3 text-muted-foreground/30" />
                            )}
                            <span className={cn(
                              "text-[10px] capitalize",
                              catPct === 100 ? "text-emerald-600 line-through" : catPct > 0 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {cat.replace(/_/g, " ")}
                            </span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{catData.completed}/{catData.total}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Milestone track for this group */}
                    <MilestoneTrack milestones={project._auto_milestones} group={groupKey} />
                  </div>
                );
              })}

              {/* Manual milestones */}
              {project._milestones.length > 0 && (
                <div className="pt-2 border-t border-border/30">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Custom Milestones</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {project._milestones.map((ms) => (
                      <span
                        key={ms.id}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          ms.completed_at ? "bg-emerald-100 text-emerald-700" : "bg-muted text-foreground"
                        )}
                      >
                        <Diamond className="size-2.5" />
                        {ms.title}
                        {ms.target_date && (
                          <span className="text-muted-foreground ml-0.5">{format(new Date(ms.target_date), "MMM d")}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TimelinePage() {
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "stalled" | "distribution">("all");

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch("/api/timeline");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch {
      toast.error("Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(projects.map((p) => p.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // Filtered + sorted projects
  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (filter === "stalled") {
      list = list.filter((p) => {
        const buildPct = p._groups.build?.total > 0 ? (p._groups.build.completed / p._groups.build.total) : 1;
        const distPct = p._groups.distribution?.total > 0 ? (p._groups.distribution.completed / p._groups.distribution.total) : 1;
        return buildPct > 0.7 && distPct < 0.1;
      });
    } else if (filter === "distribution") {
      list = list.filter((p) => (p._groups.distribution?.total || 0) > 0);
      list.sort((a, b) => {
        const aPct = a._groups.distribution?.total > 0 ? (a._groups.distribution.completed / a._groups.distribution.total) : 1;
        const bPct = b._groups.distribution?.total > 0 ? (b._groups.distribution.completed / b._groups.distribution.total) : 1;
        return aPct - bPct;
      });
    }
    return list;
  }, [projects, filter]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDist = projects.reduce((s, p) => s + (p._groups.distribution?.total || 0), 0);
    const doneDist = projects.reduce((s, p) => s + (p._groups.distribution?.completed || 0), 0);
    const stalledCount = projects.filter((p) => {
      const buildPct = p._groups.build?.total > 0 ? (p._groups.build.completed / p._groups.build.total) : 1;
      const distPct = p._groups.distribution?.total > 0 ? (p._groups.distribution.completed / p._groups.distribution.total) : 1;
      return buildPct > 0.7 && distPct < 0.1;
    }).length;
    const nextMilestones = projects
      .map((p) => ({ project: p.name, emoji: p.icon_emoji, ms: p._auto_milestones.find((m) => !m.is_completed) }))
      .filter((x) => x.ms);

    return { totalDist, doneDist, stalledCount, nextMilestones };
  }, [projects]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground">{projects.length} active projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandedIds.size > 0 ? collapseAll : expandAll}
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {expandedIds.size > 0 ? "Collapse All" : "Expand All"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Wrench className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Build</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {projects.filter((p) => {
              const g = p._groups.build;
              return g && g.total > 0 && g.completed === g.total;
            }).length}/{projects.length}
          </div>
          <span className="text-[10px] text-muted-foreground">projects fully built</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Megaphone className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Marketing</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {projects.filter((p) => {
              const g = p._groups.marketing;
              return g && g.total > 0 && g.completed === g.total;
            }).length}/{projects.length}
          </div>
          <span className="text-[10px] text-muted-foreground">marketing complete</span>
        </div>

        <div className={cn("rounded-xl border p-3.5", stats.doneDist === 0 ? "border-amber-200 bg-amber-50/50" : "border-border bg-card")}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Share2 className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Distribution</span>
          </div>
          <div className={cn("text-lg font-bold", stats.doneDist === 0 ? "text-amber-600" : "text-foreground")}>
            {stats.totalDist > 0 ? Math.round((stats.doneDist / stats.totalDist) * 100) : 0}%
          </div>
          <span className="text-[10px] text-muted-foreground">{stats.doneDist}/{stats.totalDist} items done</span>
        </div>

        <div className={cn("rounded-xl border p-3.5", stats.stalledCount > 0 ? "border-red-200 bg-red-50/50" : "border-border bg-card")}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <AlertTriangle className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Stalled</span>
          </div>
          <div className={cn("text-lg font-bold", stats.stalledCount > 0 ? "text-red-600" : "text-foreground")}>
            {stats.stalledCount}
          </div>
          <span className="text-[10px] text-muted-foreground">built but not distributing</span>
        </div>
      </div>

      {/* Next milestones strip */}
      {stats.nextMilestones.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next milestones to hit</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.nextMilestones.map((x) => (
              <div key={x.project} className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
                <span className="text-sm">{x.emoji}</span>
                <span className="text-[11px] font-medium text-foreground">{x.project}</span>
                <ArrowRight className="size-3 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground">{x.ms!.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "all", label: `All (${projects.length})` },
          { key: "distribution", label: "Distribution Focus" },
          { key: "stalled", label: `Stalled (${stats.stalledCount})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "px-4 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-px",
              filter === tab.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project rows */}
      <div className="space-y-2">
        {filteredProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <ProjectRow
              project={project}
              isExpanded={expandedIds.has(project.id)}
              onToggle={() => toggleExpanded(project.id)}
            />
          </motion.div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No projects match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
