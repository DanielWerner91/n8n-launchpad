"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Launch, LaunchStatus } from "@/lib/launches/types";
import { LAUNCH_STATUS_LABELS } from "@/lib/launches/types";

const STATUS_COLORS: Record<LaunchStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  planning: "bg-blue-100 text-blue-700",
  pre_launch: "bg-amber-100 text-amber-700",
  launch_day: "bg-emerald-100 text-emerald-700",
  post_launch: "bg-violet-100 text-violet-700",
  completed: "bg-muted text-muted-foreground",
};

const CHANNEL_COLORS = ["#0000fe", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

const ALL_STATUSES: Array<"all" | LaunchStatus> = [
  "all", "draft", "planning", "pre_launch", "launch_day", "post_launch", "completed",
];

function ChannelScoresBar({ scores }: { scores: { channel: string; score: number }[] }) {
  const maxScore = Math.max(...scores.map((s) => s.score), 1);
  return (
    <div className="flex items-center gap-1">
      {scores.map((s, i) => (
        <div
          key={s.channel}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: `${Math.max((s.score / maxScore) * 32, 6)}px`,
            backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
            opacity: 0.6 + (s.score / maxScore) * 0.4,
          }}
          title={`${s.channel}: ${s.score}/10`}
        />
      ))}
    </div>
  );
}

function LaunchCard({ launch }: { launch: Launch }) {
  return (
    <Link href={`/dashboard/${launch.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/30">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
            {launch.app_name}
          </h3>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
              STATUS_COLORS[launch.status]
            )}
          >
            {LAUNCH_STATUS_LABELS[launch.status]}
          </span>
        </div>

        <p className="mt-1.5 truncate text-xs text-muted-foreground">{launch.niche}</p>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">
            {new Date(launch.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {launch.strategy?.channel_scores && launch.strategy.channel_scores.length > 0 && (
            <ChannelScoresBar scores={launch.strategy.channel_scores} />
          )}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | LaunchStatus>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/launches");
        if (!res.ok) throw new Error("Failed to fetch launches");
        const data = await res.json();
        setLaunches(Array.isArray(data) ? data : data.launches ?? []);
      } catch {
        toast.error("Failed to load launches");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredLaunches = useMemo(() => {
    return launches.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      return true;
    });
  }, [launches, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: launches.length };
    for (const l of launches) {
      counts[l.status] = (counts[l.status] || 0) + 1;
    }
    return counts;
  }, [launches]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Launches</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Plan, execute, and track your product launches across every channel.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          New Launch
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALL_STATUSES.map((status) => {
          const label = status === "all" ? "All" : LAUNCH_STATUS_LABELS[status];
          const count = statusCounts[status] || 0;
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
                    isActive ? "bg-white/20 text-accent-foreground" : "bg-border text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLaunches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLaunches.map((launch) => (
            <LaunchCard key={launch.id} launch={launch} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Rocket className="size-6 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                {statusFilter !== "all" ? "No launches match your filters" : "No launches yet"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? "Try adjusting your filters or create a new launch."
                  : "Create your first launch to start planning your go-to-market strategy."}
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-accent/90"
            >
              <Plus className="size-4" />
              New Launch
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
