"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isToday, isSameDay, addMonths, subMonths,
  isAfter, isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects/types";

interface CalendarEvent {
  date: Date;
  type: "due_date" | "audit" | "launch";
  project: { name: string; slug: string; emoji: string; logo_url: string | null };
  label: string;
  severity: "critical" | "warning" | "normal";
}

export default function CalendarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [audits, setAudits] = useState<{ id: string; next_due_at: string; audit_type: string; project_id: string }[]>([]);
  const [launches, setLaunches] = useState<{ id: string; product_name: string; launch_date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, auditsRes, launchesRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/timeline"), // has audits + launches
          fetch("/api/launches"),
        ]);

        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (auditsRes.ok) {
          const data = await auditsRes.json();
          setAudits(data.audits || []);
        }
        if (launchesRes.ok) {
          const data = await launchesRes.json();
          setLaunches(Array.isArray(data) ? data : []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const events = useMemo(() => {
    const evs: CalendarEvent[] = [];

    // Project due dates
    for (const p of projects) {
      if (p.due_date && p.stage !== "archived") {
        const date = new Date(p.due_date);
        evs.push({
          date,
          type: "due_date",
          project: { name: p.name, slug: p.slug, emoji: p.icon_emoji, logo_url: p.logo_url },
          label: "Due",
          severity: isBefore(date, new Date()) ? "critical" : "normal",
        });
      }
    }

    // Audits
    for (const a of audits) {
      if (a.next_due_at) {
        const date = new Date(a.next_due_at);
        const project = projects.find((p) => p.id === a.project_id);
        if (project) {
          evs.push({
            date,
            type: "audit",
            project: { name: project.name, slug: project.slug, emoji: project.icon_emoji, logo_url: project.logo_url },
            label: `${a.audit_type} audit`,
            severity: isBefore(date, new Date()) ? "critical" : "warning",
          });
        }
      }
    }

    // Launches
    for (const l of launches) {
      if (l.launch_date) {
        evs.push({
          date: new Date(l.launch_date),
          type: "launch",
          project: { name: l.product_name, slug: `launches/${l.id}`, emoji: "🚀", logo_url: null },
          label: "Launch",
          severity: "normal",
        });
      }
    }

    return evs;
  }, [projects, audits, launches]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">Due dates, audits, and launches</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Current month */}
      <h2 className="text-xl font-semibold text-foreground">
        {format(currentMonth, "MMMM yyyy")}
      </h2>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {weekdays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = eventsForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-1.5 last:border-r-0",
                  !inMonth && "bg-muted/20",
                  today && "bg-accent/5"
                )}
              >
                <div className={cn(
                  "flex size-6 items-center justify-center rounded-md text-[11px] font-semibold",
                  today ? "bg-accent text-accent-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/40"
                )}>
                  {format(day, "d")}
                </div>

                {/* Events */}
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <Link
                      key={idx}
                      href={`/dashboard/projects/${event.project.slug.startsWith("launches") ? event.project.slug.replace("launches/", "launches/") : event.project.slug}`}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate transition-colors",
                        event.severity === "critical" ? "bg-red-50 text-red-700 hover:bg-red-100" :
                        event.severity === "warning" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" :
                        event.type === "launch" ? "bg-accent/10 text-accent hover:bg-accent/20" :
                        "bg-muted text-foreground hover:bg-muted/80"
                      )}
                    >
                      {event.project.logo_url ? (
                        <Image src={event.project.logo_url} alt="" width={10} height={10} className="size-2.5 rounded-sm object-contain shrink-0" unoptimized />
                      ) : (
                        <span className="text-[9px] shrink-0">{event.project.emoji}</span>
                      )}
                      <span className="truncate font-medium">{event.project.name}</span>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-red-500" />
          Overdue
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-amber-500" />
          Audit
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-accent" />
          Launch
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-neutral-400" />
          Due date
        </div>
      </div>

      {/* Upcoming list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold text-foreground">Upcoming</h3>
          <CalendarIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {events
            .filter((e) => isAfter(e.date, new Date()) || isToday(e.date))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 10)
            .map((event, i) => (
              <Link
                key={i}
                href={`/dashboard/projects/${event.project.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="shrink-0 text-center w-10">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {format(event.date, "MMM")}
                  </div>
                  <div className="text-[16px] font-semibold text-foreground leading-none">
                    {format(event.date, "d")}
                  </div>
                </div>
                {event.project.logo_url ? (
                  <div className="size-6 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                    <Image src={event.project.logo_url} alt="" width={24} height={24} className="size-6 object-contain" unoptimized />
                  </div>
                ) : (
                  <span className="text-base">{event.project.emoji}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">{event.project.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{event.label}</div>
                </div>
              </Link>
            ))}
          {events.filter((e) => isAfter(e.date, new Date()) || isToday(e.date)).length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">No upcoming events.</p>
          )}
        </div>
      </div>
    </div>
  );
}
