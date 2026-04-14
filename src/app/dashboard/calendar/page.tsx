"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon,
  Shield, Sparkles, Scale, Zap, Diamond, Flag, AlertCircle,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isToday, isSameDay, addMonths, subMonths,
  isAfter, parseISO, addDays,
} from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "audit" | "milestone" | "project_due" | "content" | "launch";
  project_id: string | null;
  project_name: string | null;
  project_slug: string | null;
  project_emoji: string | null;
  project_logo: string | null;
  is_completed: boolean;
  is_overdue: boolean;
  meta?: Record<string, unknown>;
}

const TYPE_CONFIG = {
  audit: { icon: Shield, color: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  milestone: { icon: Diamond, color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  project_due: { icon: Flag, color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  content: { icon: Sparkles, color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  launch: { icon: Zap, color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
};

const AUDIT_ICONS: Record<string, React.ElementType> = {
  security: Shield, ux: Sparkles, legal: Scale, performance: Zap,
};

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const start = format(days[0], "yyyy-MM-dd");
        const end = format(days[days.length - 1], "yyyy-MM-dd");
        const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
        if (res.ok) setEvents(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const stats = useMemo(() => {
    const overdue = events.filter((e) => e.is_overdue && !e.is_completed).length;
    const thisWeek = events.filter((e) => {
      const d = parseISO(e.date);
      return d >= new Date() && d <= addDays(new Date(), 7);
    }).length;
    const byType = events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { overdue, thisWeek, byType };
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        const d = parseISO(e.date);
        return (isAfter(d, now) || isToday(d)) && !e.is_completed;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [events]);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">Deadlines, audits, and milestones across all projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card">
            <button
              onClick={() => setCursor(subMonths(cursor, 1))}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-l-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 py-1 text-[13px] font-semibold text-foreground min-w-[140px] text-center">
              {format(cursor, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-r-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={cn("rounded-xl border p-3.5", stats.overdue > 0 ? "border-red-200 bg-red-50/50" : "border-border bg-card")}>
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <AlertCircle className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Overdue</span>
          </div>
          <div className={cn("text-lg font-bold", stats.overdue > 0 ? "text-red-600" : "text-foreground")}>{stats.overdue}</div>
          <span className="text-[10px] text-muted-foreground">needs attention</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <CalendarIcon className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">This Week</span>
          </div>
          <div className="text-lg font-bold text-foreground">{stats.thisWeek}</div>
          <span className="text-[10px] text-muted-foreground">events coming up</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Shield className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Audits</span>
          </div>
          <div className="text-lg font-bold text-foreground">{stats.byType.audit || 0}</div>
          <span className="text-[10px] text-muted-foreground">scheduled in view</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Diamond className="size-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Milestones</span>
          </div>
          <div className="text-lg font-bold text-foreground">{stats.byType.milestone || 0}</div>
          <span className="text-[10px] text-muted-foreground">targeted</span>
        </div>
      </div>

      {/* Calendar grid + sidebar */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Calendar grid */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {weekdays.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay[dayKey] || [];
              const inMonth = isSameMonth(day, cursor);
              const isTodayDay = isToday(day);

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "relative min-h-[100px] p-1.5 border-b border-r border-border/40 last:border-r-0 transition-colors",
                    !inMonth && "bg-muted/10",
                    isTodayDay && "bg-accent/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "flex items-center justify-center size-6 text-[11px] font-semibold rounded-full",
                      isTodayDay ? "bg-foreground text-background" : inMonth ? "text-foreground" : "text-muted-foreground/40"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => {
                      const config = TYPE_CONFIG[e.type];
                      const inner = (
                        <div
                          className={cn(
                            "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate border transition-colors",
                            e.is_overdue && !e.is_completed ? "bg-red-50 border-red-200 text-red-700" : config.color,
                            e.is_completed && "opacity-50 line-through"
                          )}
                          title={`${e.project_name}: ${e.title}`}
                        >
                          {e.project_emoji && <span className="text-[9px] shrink-0">{e.project_emoji}</span>}
                          <span className="truncate">{e.title}</span>
                        </div>
                      );
                      return e.project_slug ? (
                        <Link key={e.id} href={`/dashboard/projects/${e.project_slug}`}>
                          {inner}
                        </Link>
                      ) : (
                        <div key={e.id}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming list */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
              <CalendarIcon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {upcomingEvents.length === 0 && (
                <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">No upcoming events</p>
              )}
              {upcomingEvents.map((e) => {
                const config = TYPE_CONFIG[e.type];
                const Icon = e.type === "audit" && e.meta?.audit_type
                  ? AUDIT_ICONS[e.meta.audit_type as string] || config.icon
                  : config.icon;
                const date = parseISO(e.date);

                const inner = (
                  <div className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="shrink-0 text-center w-8">
                      <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        {format(date, "MMM")}
                      </div>
                      <div className="text-[14px] font-semibold text-foreground leading-none mt-0.5">
                        {format(date, "d")}
                      </div>
                    </div>
                    <Icon className={cn("size-3.5 mt-0.5 shrink-0", e.is_overdue ? "text-red-500" : "text-muted-foreground")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] font-medium text-foreground truncate">{e.title}</span>
                        {e.is_overdue && (
                          <span className="shrink-0 text-[8px] font-bold text-red-600 uppercase">Overdue</span>
                        )}
                      </div>
                      {e.project_name && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {e.project_emoji && <span>{e.project_emoji}</span>}
                          <span className="truncate">{e.project_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );

                return e.project_slug ? (
                  <Link key={e.id} href={`/dashboard/projects/${e.project_slug}`}>{inner}</Link>
                ) : (
                  <div key={e.id}>{inner}</div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Types</span>
            <div className="space-y-1.5">
              {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([type, config]) => {
                const count = stats.byType[type] || 0;
                return (
                  <div key={type} className="flex items-center gap-2 text-[11px]">
                    <span className={cn("size-2 rounded-full", config.dot)} />
                    <span className="capitalize text-foreground">{type.replace("_", " ")}</span>
                    <span className="ml-auto text-muted-foreground tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 shadow-lg">
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Loading…</span>
        </div>
      )}
    </div>
  );
}
