"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  ChevronRight,
  Loader2,
  Rocket,
  Clock,
  LineChart,
  ListChecks,
  Gauge,
  FolderOpen,
  Save,
  Calendar,
} from "lucide-react";
import type {
  Launch,
  GTMStrategy,
  EnhancedGTMStrategy,
  LaunchMetrics,
  LaunchStatus,
  LaunchPhase,
  LaunchTask,
} from "@/lib/launches/types";
import { LAUNCH_STATUS_LABELS } from "@/lib/launches/types";
import { TodaysTasks } from "@/components/launches/TodaysTasks";
import { PhaseTimeline } from "@/components/launches/PhaseTimeline";
import { TaskCard } from "@/components/launches/TaskCard";
import { ReadinessScore } from "@/components/launches/ReadinessScore";

const STATUS_COLORS: Record<LaunchStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  planning: "bg-blue-50 text-blue-700 border-blue-200",
  pre_launch: "bg-amber-50 text-amber-700 border-amber-200",
  launch_day: "bg-emerald-50 text-emerald-700 border-emerald-200",
  post_launch: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-muted text-muted-foreground border-border",
};

const STATUS_ORDER: LaunchStatus[] = ["draft", "planning", "pre_launch", "launch_day", "post_launch", "completed"];

function nextStatus(current: LaunchStatus): LaunchStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

function isEnhancedStrategy(strategy: GTMStrategy | EnhancedGTMStrategy | null): strategy is EnhancedGTMStrategy {
  if (!strategy) return false;
  return "market_analysis" in strategy || "pre_launch_plan" in strategy;
}

type Tab = "tasks" | "timeline" | "readiness" | "metrics";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "tasks", label: "Today's Tasks", icon: ListChecks },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "readiness", label: "Readiness", icon: Gauge },
  { id: "metrics", label: "Metrics", icon: LineChart },
];

export default function LaunchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [deleting, setDeleting] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const fetchLaunch = useCallback(async () => {
    try {
      const res = await fetch(`/api/launches/${id}`);
      if (!res.ok) throw new Error("Failed to fetch launch");
      setLaunch(await res.json());
    } catch {
      toast.error("Failed to load launch");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLaunch(); }, [fetchLaunch]);

  const handleDelete = async () => {
    if (!confirm("Delete this launch? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/launches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Launch deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!launch) return;
    const next = nextStatus(launch.status);
    if (!next) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/launches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setLaunch((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success(`Status advanced to ${LAUNCH_STATUS_LABELS[next]}`);
    } catch {
      toast.error("Failed to advance status");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  if (!launch) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Launch not found</p>
      <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"><ArrowLeft className="size-4" /> Back</Link>
    </div>
  );

  const next = nextStatus(launch.status);
  const launchDateStr = launch.launch_target_date
    ? new Date(launch.launch_target_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Back to launches
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{launch.app_name}</h1>
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[launch.status])}>
              {LAUNCH_STATUS_LABELS[launch.status]}
            </span>
            {launch.readiness_score != null && launch.readiness_score > 0 && (
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", launch.readiness_score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : launch.readiness_score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200")}>
                {launch.readiness_score}% Ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-2xl">{launch.app_description}</p>
            {launchDateStr && <span className="text-xs text-muted-foreground flex items-center gap-1"><Rocket className="size-3" />Launch: {launchDateStr}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {next && (
            <button onClick={handleAdvanceStatus} disabled={advancing} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
              {advancing ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
              Advance to {LAUNCH_STATUS_LABELS[next]}
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all whitespace-nowrap", activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={activeTab}>
        {activeTab === "tasks" && <TodaysTasks launchId={id} />}
        {activeTab === "timeline" && <TimelineTab launchId={id} />}
        {activeTab === "readiness" && <ReadinessScore launchId={id} />}
        {activeTab === "metrics" && <MetricsTab launchId={id} metrics={launch.metrics} onRefresh={fetchLaunch} />}
      </div>
    </div>
  );
}

function TimelineTab({ launchId }: { launchId: string }) {
  const [tasks, setTasks] = useState<LaunchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/launches/${launchId}/tasks`);
      if (res.ok) {
        const allTasks: LaunchTask[] = await res.json();
        setTasks(allTasks);
        const incomplete = allTasks.find((t) => t.status !== "completed" && t.status !== "skipped" && t.week_number != null);
        if (incomplete?.week_number != null && selectedWeek === null) {
          setSelectedWeek(incomplete.week_number);
          setCurrentWeek(incomplete.week_number);
        } else if (selectedWeek === null) {
          setSelectedWeek(-4);
        }
      }
    } catch { toast.error("Failed to load timeline"); }
    finally { setLoading(false); }
  }, [launchId, selectedWeek]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (taskId: string, newStatus: "completed" | "pending") => {
    try {
      const res = await fetch(`/api/launches/${launchId}/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
    } catch { toast.error("Failed to update task"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  if (tasks.length === 0) return (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      <Calendar className="mx-auto mb-3 size-10 text-muted-foreground/30" />
      <p className="text-muted-foreground">No tasks generated yet. Generate a strategy with a launch date first.</p>
    </div>
  );

  const phases: LaunchPhase[] = Array.from(new Set(tasks.map((t) => t.week_number).filter((w) => w != null)))
    .sort((a, b) => (a as number) - (b as number))
    .map((wn) => ({ id: `week-${wn}`, launch_id: launchId, phase: (wn as number) < 0 ? "pre_launch" : (wn as number) === 0 ? "launch_week" : "post_launch", week_number: wn as number, status: "pending" as const, started_at: null, completed_at: null, created_at: "" }));

  const weekTasks = selectedWeek != null
    ? tasks.filter((t) => t.week_number === selectedWeek).sort((a, b) => {
        const dateA = a.scheduled_date || ""; const dateB = b.scheduled_date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (po[a.priority || "low"] || 3) - (po[b.priority || "low"] || 3);
      })
    : [];

  return (
    <div className="space-y-6">
      <PhaseTimeline phases={phases} tasks={tasks} currentWeek={currentWeek} onWeekSelect={setSelectedWeek} selectedWeek={selectedWeek} />
      {selectedWeek !== null && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {selectedWeek === 0 ? "Launch Week" : `Week ${selectedWeek > 0 ? "+" : ""}${selectedWeek}`} Tasks
            <span className="ml-2 text-muted-foreground font-normal">({weekTasks.filter((t) => t.status === "completed" || t.status === "skipped").length}/{weekTasks.length})</span>
          </h3>
          {weekTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center"><p className="text-sm text-muted-foreground">No tasks for this week</p></div>
          ) : (
            <div className="space-y-2">{weekTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={handleToggle} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricsTab({ launchId, metrics, onRefresh }: { launchId: string; metrics: LaunchMetrics | null; onRefresh: () => void }) {
  const [form, setForm] = useState<LaunchMetrics>({
    signups_day1: metrics?.signups_day1, signups_week1: metrics?.signups_week1, conversion_rate: metrics?.conversion_rate,
    top_channel: metrics?.top_channel, reddit_upvotes: metrics?.reddit_upvotes, ph_ranking: metrics?.ph_ranking, notes: metrics?.notes,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(form)) { if (v !== undefined && v !== "") cleaned[k] = v; }
      const res = await fetch(`/api/launches/${launchId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metrics: cleaned }) });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Metrics saved");
      onRefresh();
    } catch { toast.error("Failed to save metrics"); }
    finally { setSaving(false); }
  };

  const setField = (key: keyof LaunchMetrics, value: string) => {
    setForm((prev) => ({ ...prev, [key]: key === "top_channel" || key === "notes" ? value : value === "" ? undefined : Number(value) }));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Post-Launch Metrics</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[["Day 1 Signups", "signups_day1", "number"], ["Week 1 Signups", "signups_week1", "number"], ["Conversion Rate (%)", "conversion_rate", "number"], ["Top Channel", "top_channel", "text"], ["Reddit Upvotes", "reddit_upvotes", "number"], ["PH Ranking", "ph_ranking", "number"]].map(([label, key, type]) => (
          <div key={key} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <input type={type} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" value={String((form as Record<string, unknown>)[key as string] ?? "")} onChange={(e) => setField(key as keyof LaunchMetrics, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        <label className="text-sm font-medium text-foreground">Notes</label>
        <textarea className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground resize-none focus:border-accent focus:outline-none" rows={3} value={form.notes || ""} onChange={(e) => setField("notes", e.target.value)} />
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save Metrics
        </button>
      </div>
    </div>
  );
}
