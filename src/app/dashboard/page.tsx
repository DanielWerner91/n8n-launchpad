"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, Search, Filter, X, LayoutGrid, List, Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { ListView } from "@/components/pipeline/list-view";
import { QuickStats } from "@/components/pipeline/quick-stats";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type { Project } from "@/lib/projects/types";
import { LABELS, PRIORITIES } from "@/lib/projects/types";

type ViewMode = "board" | "list";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();

        const withCounts = await Promise.all(
          (data || []).map(async (project: Project) => {
            try {
              const detailRes = await fetch(`/api/projects/${project.slug}`);
              if (detailRes.ok) {
                const detail = await detailRes.json();
                return { ...project, ...detail };
              }
            } catch { /* silent */ }
            return project;
          })
        );

        setProjects(withCounts);
        const overdue = withCounts.reduce((count: number, p: Project) => {
          return count + (p.health === "red" ? 1 : 0);
        }, 0);
        setOverdueCount(overdue);
      } catch {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "f": e.preventDefault(); setShowFilters((v) => !v); break;
        case "1": setViewMode("board"); break;
        case "2": setViewMode("list"); break;
        case "/": e.preventDefault(); document.querySelector<HTMLInputElement>('[data-search]')?.focus(); break;
        case "n": if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); window.location.href = "/dashboard/projects/new"; } break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLabel && (!p.labels || !p.labels.includes(filterLabel))) return false;
    if (filterPriority && p.priority !== filterPriority) return false;
    return true;
  });

  const hasActiveFilters = search || filterLabel || filterPriority;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtered)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="size-4" />
            {overdueCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {overdueCount}
              </span>
            )}
          </button>

          <Link
            href="/dashboard/launches"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            Launch Plans
          </Link>
          <Link
            href="/dashboard/launches/new"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            New Launch
          </Link>
        </div>
      </div>

      {/* Notification center */}
      {showNotifications && (
        <NotificationCenter projects={projects} onClose={() => setShowNotifications(false)} />
      )}

      <QuickStats projects={projects} overdueCount={overdueCount} />

      {/* Toolbar: search + filters + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            data-search
            type="text"
            placeholder="Search projects...  (/)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            showFilters || hasActiveFilters
              ? "border-accent bg-accent/5 text-accent"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Filter className="size-3.5" />
          Filter
          {hasActiveFilters && (
            <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
              {[filterLabel, filterPriority].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => { setSearch(""); setFilterLabel(null); setFilterPriority(null); }}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("board")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              viewMode === "board" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <LayoutGrid className="size-3.5" />
            Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <List className="size-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Label</p>
            <div className="flex flex-wrap gap-1">
              {LABELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setFilterLabel(filterLabel === l.value ? null : l.value)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                    filterLabel === l.value ? cn(l.color, "ring-1 ring-current/30") : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</p>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setFilterPriority(filterPriority === p.value ? null : p.value)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                    filterPriority === p.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", p.dot)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground/50">
            Shortcuts: <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">f</kbd> filter &middot; <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">1</kbd> board &middot; <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">2</kbd> list &middot; <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">/</kbd> search &middot; <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">n</kbd> new
          </div>
        </div>
      )}

      {/* Views */}
      {viewMode === "board" ? (
        <PipelineBoard initialProjects={filtered} />
      ) : (
        <ListView projects={filtered} />
      )}
    </div>
  );
}
