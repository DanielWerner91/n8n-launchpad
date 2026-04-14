"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Eye, Users, Activity, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Analytics {
  totals: { views_30d: number; visitors_30d: number; sessions_30d: number };
  sparkline: { day: string; views: number }[];
  daily: { day: string; views: number; visitors: number }[];
}

function Sparkline({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const step = width / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#spark-gradient)" className="text-accent" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="text-accent" />
    </svg>
  );
}

export function AnalyticsWidget({ slug }: { slug: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${slug}/analytics`)
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Loading analytics...
      </div>
    );
  }

  if (!data || (!data.totals.views_30d && !data.totals.visitors_30d)) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Activity className="size-3.5" />
          No PostHog events found. Make sure the app sends events with `app_name` property set to the project slug.
        </div>
      </div>
    );
  }

  const sparkValues = data.sparkline.map((d) => d.views);
  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">Analytics</span>
          <span className="text-[10px] text-muted-foreground">Last 30 days</span>
        </div>
        <Sparkline data={sparkValues} width={100} height={28} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Eye className="size-3" />
            Pageviews
          </div>
          <div className="text-[20px] font-bold tabular-nums text-foreground">{formatNum(data.totals.views_30d)}</div>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="size-3" />
            Visitors
          </div>
          <div className="text-[20px] font-bold tabular-nums text-foreground">{formatNum(data.totals.visitors_30d)}</div>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Activity className="size-3" />
            Sessions
          </div>
          <div className="text-[20px] font-bold tabular-nums text-foreground">{formatNum(data.totals.sessions_30d)}</div>
        </div>
      </div>
    </div>
  );
}
