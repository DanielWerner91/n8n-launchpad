"use client";

import { useEffect, useState } from "react";
import { Compass, AlertOctagon, ListChecks, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "high" | "medium" | "low";

type CoachItem = {
  title: string;
  detail: string;
  severity: Severity;
  action?: string;
};

type CoachReport = {
  blockers: CoachItem[];
  next_actions: CoachItem[];
  risk_flags: CoachItem[];
  generated_at: string;
};

const severityBadge: Record<Severity, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
};

export function LaunchCoach({ slug }: { slug: string }) {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load(false);
  }, [slug]);

  async function load(force: boolean) {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${slug}/coach${force ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load coach");
        return;
      }
      setReport(data.report);
      setCached(!!data.cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Analyzing project...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] text-red-700">
        Coach unavailable: {error}
      </div>
    );
  }

  if (!report) return null;

  const total = report.blockers.length + report.next_actions.length + report.risk_flags.length;
  if (total === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-foreground">
            <Compass className="size-4 text-emerald-600" />
            Coach found nothing urgent. Project looks healthy.
          </div>
          <RefreshButton onClick={() => load(true)} refreshing={refreshing} />
        </div>
      </div>
    );
  }

  const generated = new Date(report.generated_at);
  const mins = Math.floor((Date.now() - generated.getTime()) / 60000);
  const freshness =
    mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-accent/10">
            <Compass className="size-3.5 text-accent" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              Launch Coach
            </div>
            <div className="text-[10px] text-muted-foreground">
              {cached ? "Cached" : "Fresh"} · {freshness}
            </div>
          </div>
        </div>
        <RefreshButton onClick={() => load(true)} refreshing={refreshing} />
      </div>

      <Section
        icon={AlertOctagon}
        iconClass="text-red-600"
        label="Blockers"
        items={report.blockers}
      />
      <Section
        icon={ListChecks}
        iconClass="text-blue-600"
        label="Next Actions"
        items={report.next_actions}
      />
      <Section
        icon={AlertTriangle}
        iconClass="text-amber-600"
        label="Risk Flags"
        items={report.risk_flags}
      />
    </div>
  );
}

function RefreshButton({
  onClick,
  refreshing,
}: {
  onClick: () => void;
  refreshing: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <RefreshCw className={cn("size-3", refreshing && "animate-spin")} />
      {refreshing ? "Analyzing" : "Refresh"}
    </button>
  );
}

function Section({
  icon: Icon,
  iconClass,
  label,
  items,
}: {
  icon: typeof AlertOctagon;
  iconClass: string;
  label: string;
  items: CoachItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("size-3", iconClass)} />
        {label} ({items.length})
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13px] font-medium text-foreground">{item.title}</div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                  severityBadge[item.severity],
                )}
              >
                {item.severity}
              </span>
            </div>
            {item.detail && (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            )}
            {item.action && (
              <div className="mt-1 text-[11px] font-medium text-accent">{item.action}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
