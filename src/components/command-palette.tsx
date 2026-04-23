"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  CalendarDays,
  Keyboard,
  LayoutDashboard,
  Plus,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";

type Project = {
  id: string;
  slug: string;
  name: string;
  stage: string;
  icon_emoji: string | null;
};

const navActions = [
  { label: "Go to Focus", href: "/dashboard/focus", icon: Target, keywords: "focus today" },
  { label: "Go to Pipeline", href: "/dashboard", icon: LayoutDashboard, keywords: "pipeline board kanban home" },
  { label: "Go to Copilot", href: "/dashboard/chat", icon: Sparkles, keywords: "copilot chat ai" },
  { label: "Go to Calendar", href: "/dashboard/calendar", icon: Calendar, keywords: "calendar" },
  { label: "Go to Timeline", href: "/dashboard/timeline", icon: CalendarDays, keywords: "timeline gantt" },
  { label: "Go to Launch Plans", href: "/dashboard/launches", icon: Rocket, keywords: "launch plans gtm" },
  { label: "Go to Analytics", href: "/dashboard/analytics", icon: BarChart3, keywords: "analytics metrics" },
  { label: "Go to Activity", href: "/dashboard/activity", icon: Activity, keywords: "activity feed" },
  { label: "Go to Settings", href: "/dashboard/settings", icon: Settings, keywords: "settings preferences" },
];

const createActions = [
  { label: "New Project", href: "/dashboard/projects/new", icon: Plus, keywords: "create project new" },
  { label: "New Launch", href: "/dashboard/launches/new", icon: Rocket, keywords: "create launch new gtm" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const fetchedRef = useRef(false);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Project[]) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" />
            <Command.Input
              placeholder="Jump to a project, page, or action..."
              className="flex-1 bg-transparent py-3 text-[14px] outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-1.5">
            <Command.Empty className="py-6 text-center text-[13px] text-muted-foreground">
              No results.
            </Command.Empty>

            {projects.length > 0 && (
              <Command.Group
                heading="Projects"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {projects.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.name} ${p.slug} ${p.stage}`}
                    onSelect={() => run(`/dashboard/projects/${p.slug}`)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[13px] aria-selected:bg-muted"
                  >
                    <span className="text-base leading-none">{p.icon_emoji || "🚀"}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.stage}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Create"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {createActions.map((a) => (
                <Command.Item
                  key={a.href}
                  value={`${a.label} ${a.keywords}`}
                  onSelect={() => run(a.href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[13px] aria-selected:bg-muted"
                >
                  <a.icon className="size-4 text-muted-foreground" />
                  <span>{a.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Navigate"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {navActions.map((a) => (
                <Command.Item
                  key={a.href}
                  value={`${a.label} ${a.keywords}`}
                  onSelect={() => run(a.href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-[13px] aria-selected:bg-muted"
                >
                  <a.icon className="size-4 text-muted-foreground" />
                  <span>{a.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Keyboard className="size-3" />
              <span>
                <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono">
                  ↑↓
                </kbd>{" "}
                navigate
              </span>
              <span>
                <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono">
                  ↵
                </kbd>{" "}
                select
              </span>
            </div>
            <span>
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono">
                ⌘K
              </kbd>{" "}
              to toggle
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
