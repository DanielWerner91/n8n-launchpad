"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryScore {
  category: string;
  label: string;
  total: number;
  completed: number;
  score: number;
}

interface ReadinessData {
  overall_score: number;
  categories: CategoryScore[];
  total_tasks: number;
  completed_tasks: number;
}

interface ReadinessScoreProps {
  launchId: string;
}

export function ReadinessScore({ launchId }: ReadinessScoreProps) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReadiness() {
      try {
        const res = await fetch(`/api/launches/${launchId}/readiness`);
        if (res.ok) setData(await res.json());
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchReadiness();
  }, [launchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.total_tasks === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No tasks generated yet. Generate a strategy with a launch date first.</p>
      </div>
    );
  }

  const scoreColor = data.overall_score >= 80 ? "text-emerald-600" : data.overall_score >= 50 ? "text-amber-600" : "text-red-600";
  const ringColor = data.overall_score >= 80 ? "stroke-emerald-500" : data.overall_score >= 50 ? "stroke-amber-500" : "stroke-red-500";
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (data.overall_score / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
        <div className="relative">
          <svg width="160" height="160" className="-rotate-90">
            <circle cx="80" cy="80" r={radius} className="stroke-muted" strokeWidth="10" fill="none" />
            <circle cx="80" cy="80" r={radius} className={ringColor} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", scoreColor)}>{data.overall_score}%</span>
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {data.completed_tasks} of {data.total_tasks} tasks completed
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {data.categories.map((cat) => {
            const catColor = cat.score >= 80 ? "bg-emerald-500" : cat.score >= 50 ? "bg-amber-500" : cat.score > 0 ? "bg-red-500" : "bg-muted";
            return (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{cat.completed}/{cat.total}</span>
                    <span className="text-xs font-medium text-foreground">{cat.score}%</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className={cn("h-2 rounded-full transition-all", catColor)} style={{ width: `${cat.score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
