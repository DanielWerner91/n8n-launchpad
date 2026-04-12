"use client";

import { Rocket, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import type { Project } from "@/lib/projects/types";

export function QuickStats({ projects, overdueCount }: { projects: Project[]; overdueCount: number }) {
  const total = projects.length;
  const live = projects.filter((p) => p.stage === "live" || p.stage === "scaling").length;
  const healthy = projects.filter((p) => p.health === "green").length;

  const stats = [
    { label: "Total Projects", value: total, icon: Rocket, iconBg: "bg-muted", iconColor: "text-muted-foreground" },
    { label: "Live / Scaling", value: live, icon: CheckCircle, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Healthy", value: healthy, icon: BarChart3, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Overdue Audits", value: overdueCount, icon: AlertTriangle, iconBg: overdueCount > 0 ? "bg-amber-50" : "bg-muted", iconColor: overdueCount > 0 ? "text-amber-600" : "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-accent/20">
          <div className={`inline-flex rounded-lg p-2 ${stat.iconBg}`}>
            <stat.icon className={`size-4 ${stat.iconColor}`} />
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
