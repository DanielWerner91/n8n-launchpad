"use client";

import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, Info, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISummary {
  summary: string;
  nudges: { severity: "info" | "warning" | "critical"; message: string }[];
  stats: { completedCount: number; totalCount: number; overdueAudits: number; daysSinceUpdate: number };
}

const severityStyles = {
  critical: { bg: "bg-red-50 border-red-200", icon: AlertCircle, iconColor: "text-red-600" },
  warning: { bg: "bg-amber-50 border-amber-200", icon: AlertTriangle, iconColor: "text-amber-600" },
  info: { bg: "bg-blue-50 border-blue-200", icon: Info, iconColor: "text-blue-600" },
};

export function AISummaryWidget({ slug }: { slug: string }) {
  const [data, setData] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${slug}/ai-summary`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-transparent p-4">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Generating AI insights...
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-transparent p-4 space-y-3">
      {/* AI Summary */}
      <div className="flex items-start gap-2.5">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/10">
          <Sparkles className="size-3.5 text-accent" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-1">AI Status</div>
          <p className="text-[13px] leading-relaxed text-foreground">{data.summary}</p>
        </div>
      </div>

      {/* Nudges */}
      {data.nudges.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recommendations ({data.nudges.length})
          </div>
          {data.nudges.map((nudge, i) => {
            const config = severityStyles[nudge.severity];
            const Icon = config.icon;
            return (
              <div key={i} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2", config.bg)}>
                <Icon className={cn("size-3.5 mt-0.5 shrink-0", config.iconColor)} />
                <p className="text-[12px] text-foreground leading-relaxed">{nudge.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
