"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Loader2, Target, Share2,
  Megaphone, Wrench, CheckCircle2, Clock, Sparkles,
  TrendingUp, Flame, Coffee, Shield, Diamond, Flag,
} from "lucide-react";
import { format, parseISO, isToday, isPast, differenceInDays, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects/types";

interface AutoMilestone {
  id: string;
  label: string;
  group: string;
  icon: string;
  is_completed: boolean;
  completed_at: string | null;
  checklist_item_id: string;
}

interface CategoryData {
  total: number;
  completed: number;
  categories: Record<string, { total: number; completed: number }>;
}

interface TimelineProject extends Project {
  _checklist_total: number;
  _checklist_completed: number;
  _groups: Record<string, CategoryData>;
  _auto_milestones: AutoMilestone[];
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  project_id: string | null;
  project_name: string | null;
  project_slug: string | null;
  project_emoji: string | null;
  is_completed: boolean;
  is_overdue: boolean;
  meta?: Record<string, unknown>;
}

const MILESTONE_EMOJI: Record<string, string> = {
  voice: "🎙️", linkedin: "💼", pipeline: "🔗", content: "📝",
  schedule: "📅", rocket: "🚀", engage: "💬", milestone: "🏆",
  revenue: "💰", newsletter: "📧", launch: "🌐", social: "📱",
};

export default function FocusPage() {
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const in14 = format(addDays(new Date(), 14), "yyyy-MM-dd");
        const [pRes, eRes] = await Promise.all([
          fetch("/api/timeline"),
          fetch(`/api/calendar?start=${today}&end=${in14}`),
        ]);
        if (pRes.ok) setProjects(await pRes.json());
        if (eRes.ok) setEvents(await eRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Overdue events (highest priority)
  const overdue = useMemo(() =>
    events.filter((e) => e.is_overdue && !e.is_completed)
      .sort((a, b) => a.date.localeCompare(b.date))
  , [events]);

  // Today's events
  const todayEvents = useMemo(() =>
    events.filter((e) => {
      try { return isToday(parseISO(e.date)) && !e.is_completed; } catch { return false; }
    })
  , [events]);

  // This week
  const thisWeek = useMemo(() =>
    events.filter((e) => {
      try {
        const d = parseISO(e.date);
        return !isToday(d) && !isPast(d) && differenceInDays(d, new Date()) <= 7 && !e.is_completed;
      } catch { return false; }
    }).sort((a, b) => a.date.localeCompare(b.date))
  , [events]);

  // Stalled distribution projects (built but not distributing)
  const stalled = useMemo(() =>
    projects.filter((p) => {
      const b = p._groups.build;
      const d = p._groups.distribution;
      const bPct = b?.total > 0 ? b.completed / b.total : 1;
      const dPct = d?.total > 0 ? d.completed / d.total : 1;
      return bPct > 0.7 && dPct < 0.1 && (d?.total || 0) > 0;
    })
  , [projects]);

  // Next distribution milestone per project
  const distributionActions = useMemo(() =>
    projects
      .map((p) => {
        const next = p._auto_milestones.find((m) => !m.is_completed && m.group === "distribution");
        if (!next) return null;
        const distData = p._groups.distribution;
        const distPct = distData?.total > 0 ? Math.round((distData.completed / distData.total) * 100) : 0;
        return { project: p, milestone: next, distPct };
      })
      .filter((x): x is { project: TimelineProject; milestone: AutoMilestone; distPct: number } => x !== null)
      .sort((a, b) => a.distPct - b.distPct)
  , [projects]);

  // Project completion milestones (next step per project overall)
  const nextSteps = useMemo(() =>
    projects
      .map((p) => {
        const next = p._auto_milestones.find((m) => !m.is_completed);
        if (!next) return null;
        const overallPct = p._checklist_total > 0 ? Math.round((p._checklist_completed / p._checklist_total) * 100) : 0;
        return { project: p, milestone: next, overallPct };
      })
      .filter((x): x is { project: TimelineProject; milestone: AutoMilestone; overallPct: number } => x !== null)
  , [projects]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const totalActions = overdue.length + todayEvents.length + stalled.length;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coffee className="size-3.5" />
            <span className="text-[11px] font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{greeting}, Daniel.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalActions === 0
              ? "Nothing urgent. Focus on moving one project forward today."
              : `${totalActions} ${totalActions === 1 ? "thing needs" : "things need"} your attention across ${projects.length} projects.`}
          </p>
        </div>
      </div>

      {/* Overdue banner */}
      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-red-200 bg-red-50/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-red-600" />
            <span className="text-[13px] font-semibold text-red-900">
              {overdue.length} overdue {overdue.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="space-y-1.5">
            {overdue.slice(0, 5).map((e) => (
              <Link
                key={e.id}
                href={e.project_slug ? `/dashboard/projects/${e.project_slug}` : "#"}
                className="flex items-center gap-3 rounded-lg bg-white/60 hover:bg-white px-3 py-2 transition-colors"
              >
                <span className="text-sm">{e.project_emoji || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">{e.title}</span>
                    <span className="text-[10px] text-red-600 font-semibold uppercase">
                      {differenceInDays(new Date(), parseISO(e.date))}d overdue
                    </span>
                  </div>
                  {e.project_name && (
                    <span className="text-[11px] text-muted-foreground">{e.project_name}</span>
                  )}
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            ))}
            {overdue.length > 5 && (
              <Link href="/dashboard/calendar" className="block text-[11px] text-red-700 hover:underline pt-1">
                +{overdue.length - 5} more in calendar →
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Main columns */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Distribution priorities */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-emerald-50/30">
            <Share2 className="size-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Distribution Focus
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {distributionActions.length} {distributionActions.length === 1 ? "action" : "actions"}
            </span>
          </div>
          <div className="divide-y divide-border">
            {distributionActions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <CheckCircle2 className="size-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-[12px] text-muted-foreground">All distribution milestones hit.</p>
              </div>
            )}
            {distributionActions.slice(0, 6).map(({ project, milestone, distPct }, i) => (
              <Link
                key={milestone.id}
                href={`/dashboard/projects/${project.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-lg shrink-0">{project.icon_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground truncate">{project.name}</span>
                    {distPct === 0 && (
                      <span className="shrink-0 text-[9px] font-bold text-amber-600 uppercase bg-amber-100 rounded px-1.5 py-0.5">
                        Not Started
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{MILESTONE_EMOJI[milestone.icon] || "◆"}</span>
                    <span className="truncate">Next: {milestone.label}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${distPct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-7 text-right">{distPct}%</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Today + this week */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Target className="size-3.5 text-accent" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Today &amp; This Week
            </span>
          </div>
          <div className="divide-y divide-border">
            {/* Today */}
            {todayEvents.length > 0 && (
              <div className="p-3 bg-accent/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Today</span>
                </div>
                <div className="space-y-1.5">
                  {todayEvents.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}

            {/* This week */}
            {thisWeek.length > 0 && (
              <div className="p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Next 7 Days
                </span>
                <div className="space-y-1.5">
                  {thisWeek.slice(0, 8).map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}

            {todayEvents.length === 0 && thisWeek.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-muted-foreground">No scheduled events in the next 7 days.</p>
                <Link href="/dashboard/calendar" className="text-[11px] text-accent hover:underline mt-1 inline-block">
                  View full calendar →
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stalled projects */}
      {stalled.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="size-4 text-amber-600" />
            <span className="text-[13px] font-semibold text-amber-900">
              {stalled.length} stalled {stalled.length === 1 ? "project" : "projects"} — built but not distributing
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stalled.map((p) => {
              const next = p._auto_milestones.find((m) => !m.is_completed && m.group === "distribution");
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.slug}`}
                  className="rounded-lg bg-white hover:bg-white/80 ring-1 ring-amber-200 p-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{p.icon_emoji}</span>
                    <span className="text-[12px] font-semibold text-foreground truncate">{p.name}</span>
                  </div>
                  {next && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ArrowRight className="size-3 text-amber-600" />
                      <span className="truncate">{next.label}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Next steps overview */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <TrendingUp className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Next Step Per Project
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {nextSteps.map(({ project, milestone, overallPct }) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-accent/40 hover:bg-muted/30 transition-all"
            >
              {project.logo_url ? (
                <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                  <Image src={project.logo_url} alt="" width={36} height={36} className="size-9 object-contain" unoptimized />
                </div>
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                  {project.icon_emoji}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px] font-semibold text-foreground truncate">{project.name}</span>
                  <span className="text-[9px] font-bold tabular-nums text-muted-foreground bg-muted rounded px-1">
                    {overallPct}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className={cn(
                    "rounded px-1 text-[9px] font-semibold uppercase",
                    milestone.group === "distribution" && "bg-emerald-100 text-emerald-700",
                    milestone.group === "marketing" && "bg-amber-100 text-amber-700",
                    milestone.group === "build" && "bg-violet-100 text-violet-700",
                  )}>
                    {milestone.group}
                  </span>
                  <span className="truncate">{MILESTONE_EMOJI[milestone.icon] || "◆"} {milestone.label}</span>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground/30 group-hover:text-accent transition-colors" />
            </Link>
          ))}
          {nextSteps.length === 0 && (
            <div className="col-span-2 text-center py-8 rounded-xl border border-border bg-card">
              <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-foreground">All projects complete!</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Time to start a new one.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const Icon = event.type === "audit" ? Shield : event.type === "milestone" ? Diamond : event.type === "project_due" ? Flag : Sparkles;
  const date = parseISO(event.date);

  const inner = (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-foreground truncate">{event.title}</span>
        </div>
        {event.project_name && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {event.project_emoji && <span>{event.project_emoji}</span>}
            <span className="truncate">{event.project_name}</span>
          </div>
        )}
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
        {isToday(date) ? "Today" : format(date, "MMM d")}
      </span>
    </div>
  );

  return event.project_slug ? (
    <Link href={`/dashboard/projects/${event.project_slug}`}>{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}
