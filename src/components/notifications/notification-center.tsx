"use client";

import { AlertTriangle, Shield, Sparkles, Scale, Zap, Clock, X, CheckCircle } from "lucide-react";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects/types";

const auditIcons: Record<string, React.ElementType> = {
  security: Shield, ux: Sparkles, legal: Scale, performance: Zap,
};

interface Notification {
  id: string;
  type: "overdue_audit" | "due_soon" | "low_health" | "no_activity";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  project: { name: string; slug: string; emoji: string };
  icon: React.ElementType;
}

function generateNotifications(projects: Project[]): Notification[] {
  const notifications: Notification[] = [];

  for (const p of projects) {
    if (p.stage === "archived") continue;

    // Low health
    if (p.health === "red") {
      notifications.push({
        id: `health-${p.id}`,
        type: "low_health",
        severity: "critical",
        title: `${p.name} health is critical`,
        description: `Health score is ${p.health_score}. Check overdue audits and incomplete tasks.`,
        project: { name: p.name, slug: p.slug, emoji: p.icon_emoji },
        icon: AlertTriangle,
      });
    }

    // Due date approaching or overdue
    if (p.due_date) {
      const daysLeft = differenceInDays(new Date(p.due_date), new Date());
      if (isPast(new Date(p.due_date))) {
        notifications.push({
          id: `overdue-${p.id}`,
          type: "due_soon",
          severity: "critical",
          title: `${p.name} is past due`,
          description: `Due date was ${formatDistanceToNow(new Date(p.due_date))} ago.`,
          project: { name: p.name, slug: p.slug, emoji: p.icon_emoji },
          icon: Clock,
        });
      } else if (daysLeft <= 7) {
        notifications.push({
          id: `due-soon-${p.id}`,
          type: "due_soon",
          severity: "warning",
          title: `${p.name} due in ${daysLeft} days`,
          description: `Due date is coming up. Make sure all tasks are on track.`,
          project: { name: p.name, slug: p.slug, emoji: p.icon_emoji },
          icon: Clock,
        });
      }
    }

    // Low checklist completion for live projects
    const total = p._checklist_total ?? 0;
    const completed = p._checklist_completed ?? 0;
    if (total > 0 && (p.stage === "live" || p.stage === "scaling")) {
      const pct = Math.round((completed / total) * 100);
      if (pct < 50) {
        notifications.push({
          id: `checklist-${p.id}`,
          type: "no_activity",
          severity: "warning",
          title: `${p.name} checklist is ${pct}% complete`,
          description: `This project is live but has many incomplete setup tasks.`,
          project: { name: p.name, slug: p.slug, emoji: p.icon_emoji },
          icon: CheckCircle,
        });
      }
    }
  }

  return notifications.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

const severityStyles = {
  critical: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

const severityIconColors = {
  critical: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

export function NotificationCenter({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const notifications = generateNotifications(projects);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-[13px] font-semibold text-foreground">
          Notifications
          {notifications.length > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {notifications.length}
            </span>
          )}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle className="mx-auto size-8 text-emerald-400" />
          <p className="mt-2 text-[13px] text-muted-foreground">All clear. No issues found.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3", severityStyles[n.severity])}>
              <n.icon className={cn("size-4 mt-0.5 shrink-0", severityIconColors[n.severity])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
