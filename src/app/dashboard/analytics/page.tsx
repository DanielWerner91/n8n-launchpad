import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hogql, escapeHogQL } from "@/lib/posthog/hogql";
import { BarChart3, TrendingUp, TrendingDown, Eye, Users, Activity, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/analytics/sparkline";

export const metadata: Metadata = {
  title: "Portfolio Analytics | LaunchPad",
};

export const dynamic = "force-dynamic";

type ProjectCard = {
  slug: string;
  name: string;
  icon_emoji: string;
  stage: string;
  health: string;
  app_name: string;
  totals: { views: number; visitors: number };
  last_7d_views: number;
  week_change_pct: number | null;
  sparkline: number[];
};

type PortfolioData = {
  totals: { views: number; visitors: number; sessions: number };
  daily_combined: { day: string; views: number; visitors: number }[];
  projects: ProjectCard[];
  has_data: boolean;
};

async function loadPortfolioAnalytics(): Promise<PortfolioData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: projects } = await supabase
    .from("launchdeck_projects")
    .select("id,slug,name,icon_emoji,stage,health,metadata")
    .eq("user_id", user.id)
    .neq("stage", "archived")
    .order("updated_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return { totals: { views: 0, visitors: 0, sessions: 0 }, daily_combined: [], projects: [], has_data: false };
  }

  const appNameMap = new Map<string, (typeof projects)[number]>();
  for (const p of projects) {
    const appName =
      ((p.metadata as { posthog_app_name?: string } | null)?.posthog_app_name) || p.slug;
    appNameMap.set(appName, p);
  }
  const appNames = Array.from(appNameMap.keys());
  const inList = appNames.map((n) => `'${escapeHogQL(n)}'`).join(",");

  const [daily, totalsRows] = await Promise.all([
    hogql<[string, string, number, number]>(`
      SELECT
        properties.app_name AS app_name,
        toString(toDate(timestamp)) AS day,
        count() AS views,
        count(DISTINCT distinct_id) AS visitors
      FROM events
      WHERE event = '$pageview'
        AND properties.app_name IN (${inList})
        AND timestamp >= now() - INTERVAL 30 DAY
      GROUP BY app_name, day
      ORDER BY day ASC
    `),
    hogql<[number, number, number]>(`
      SELECT
        count() AS views,
        count(DISTINCT distinct_id) AS visitors,
        count(DISTINCT session_id) AS sessions
      FROM events
      WHERE event = '$pageview'
        AND properties.app_name IN (${inList})
        AND timestamp >= now() - INTERVAL 30 DAY
    `),
  ]);

  const totalsRow = totalsRows[0];
  const perProject = new Map<string, { day: string; views: number; visitors: number }[]>();
  for (const row of daily) {
    const [app, day, views, visitors] = row;
    if (!perProject.has(app)) perProject.set(app, []);
    perProject.get(app)!.push({
      day,
      views: Number(views) || 0,
      visitors: Number(visitors) || 0,
    });
  }

  const combinedMap = new Map<string, { views: number; visitors: number }>();
  for (const [, series] of perProject) {
    for (const d of series) {
      const ex = combinedMap.get(d.day) || { views: 0, visitors: 0 };
      ex.views += d.views;
      ex.visitors += d.visitors;
      combinedMap.set(d.day, ex);
    }
  }

  const daily_combined = Array.from(combinedMap.entries())
    .map(([day, v]) => ({ day, views: v.views, visitors: v.visitors }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const projectCards: ProjectCard[] = Array.from(appNameMap.entries()).map(([appName, p]) => {
    const series = perProject.get(appName) || [];
    const totalViews = series.reduce((sum, d) => sum + d.views, 0);
    const totalVisitors = series.reduce((sum, d) => sum + d.visitors, 0);
    const last7Views = series.slice(-7).reduce((sum, d) => sum + d.views, 0);
    const prev7Views = series.slice(-14, -7).reduce((sum, d) => sum + d.views, 0);
    const weekChange = prev7Views > 0 ? ((last7Views - prev7Views) / prev7Views) * 100 : null;
    return {
      slug: p.slug,
      name: p.name,
      icon_emoji: p.icon_emoji,
      stage: p.stage,
      health: p.health,
      app_name: appName,
      totals: { views: totalViews, visitors: totalVisitors },
      last_7d_views: last7Views,
      week_change_pct: weekChange,
      sparkline: series.slice(-14).map((d) => d.views),
    };
  });

  projectCards.sort((a, b) => b.totals.views - a.totals.views);

  return {
    totals: {
      views: Number(totalsRow?.[0]) || 0,
      visitors: Number(totalsRow?.[1]) || 0,
      sessions: Number(totalsRow?.[2]) || 0,
    },
    daily_combined,
    projects: projectCards,
    has_data: daily_combined.length > 0,
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function healthDot(h: string): string {
  if (h === "green") return "bg-emerald-500";
  if (h === "yellow") return "bg-amber-500";
  if (h === "red") return "bg-red-500";
  return "bg-muted-foreground/40";
}

export default async function AnalyticsPage() {
  const data = await loadPortfolioAnalytics();

  if (!data) {
    return <div className="text-[13px] text-muted-foreground">Please sign in to view analytics.</div>;
  }

  const combinedSparkline = data.daily_combined.slice(-30).map((d) => d.views);
  const top = data.projects[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-foreground" />
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">Portfolio Analytics</h1>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Last 30 days across {data.projects.length} active projects. Sourced from PostHog.
          </p>
        </div>
      </div>

      {!data.has_data ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="text-[13px] font-medium text-foreground">No analytics data yet</div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Emit PostHog <code className="rounded bg-muted px-1 text-[11px]">$pageview</code> events with an{" "}
            <code className="rounded bg-muted px-1 text-[11px]">app_name</code> property matching your project slugs, or set a{" "}
            <code className="rounded bg-muted px-1 text-[11px]">metadata.posthog_app_name</code> override on each project.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TotalCard icon={Eye} label="Pageviews" value={data.totals.views} accentClass="text-blue-600" />
            <TotalCard icon={Users} label="Visitors" value={data.totals.visitors} accentClass="text-violet-600" />
            <TotalCard icon={Activity} label="Sessions" value={data.totals.sessions} accentClass="text-emerald-600" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Combined Pageviews, Last 30 Days
              </div>
              {top && (
                <div className="text-[11px] text-muted-foreground">
                  Top: <span className="font-medium text-foreground">{top.name}</span> ({formatNumber(top.totals.views)})
                </div>
              )}
            </div>
            <div className="mt-2 text-foreground">
              <Sparkline
                data={combinedSparkline}
                width={900}
                height={120}
                stroke="currentColor"
                fill="currentColor"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Per-project breakdown
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.projects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/dashboard/projects/${p.slug}`}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">{p.icon_emoji || "🚀"}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`size-1.5 rounded-full ${healthDot(p.health)}`} />
                          <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.stage}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[20px] font-semibold leading-none text-foreground">
                        {formatNumber(p.totals.views)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatNumber(p.totals.visitors)} visitors · 30d
                      </div>
                      {p.week_change_pct !== null && (
                        <div
                          className={`mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium ${
                            p.week_change_pct >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {p.week_change_pct >= 0 ? (
                            <TrendingUp className="size-3" />
                          ) : (
                            <TrendingDown className="size-3" />
                          )}
                          {Math.abs(p.week_change_pct).toFixed(0)}% wow
                        </div>
                      )}
                    </div>
                    <div className="text-blue-600">
                      <Sparkline data={p.sparkline} width={110} height={36} fill="currentColor" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TotalCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className={`size-3.5 ${accentClass}`} />
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-2 text-[24px] font-semibold leading-none tracking-tight text-foreground">
        {formatNumber(value)}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">last 30 days</div>
    </div>
  );
}
