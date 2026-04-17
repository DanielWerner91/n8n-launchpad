import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hogql, escapeHogQL } from "@/lib/posthog/hogql";

export const runtime = "nodejs";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  icon_emoji: string;
  stage: string;
  health: string;
  metadata: Record<string, unknown> | null;
};

type DailyRow = {
  day: string;
  views: number;
  visitors: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: projects } = await supabase
    .from("launchdeck_projects")
    .select("id,slug,name,icon_emoji,stage,health,metadata")
    .eq("user_id", user.id)
    .neq("stage", "archived")
    .order("updated_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return NextResponse.json({
      totals: { views: 0, visitors: 0, sessions: 0 },
      daily_combined: [],
      projects: [],
      has_data: false,
    });
  }

  const appNameMap = new Map<string, ProjectRow>();
  for (const p of projects as ProjectRow[]) {
    const appName =
      ((p.metadata as { posthog_app_name?: string } | null)?.posthog_app_name) || p.slug;
    appNameMap.set(appName, p);
  }
  const appNames = Array.from(appNameMap.keys());
  const inList = appNames.map((n) => `'${escapeHogQL(n)}'`).join(",");

  const perProjectDaily = await hogql<[string, string, number, number]>(`
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
  `);

  const totalsRows = await hogql<[number, number, number]>(`
    SELECT
      count() AS views,
      count(DISTINCT distinct_id) AS visitors,
      count(DISTINCT session_id) AS sessions
    FROM events
    WHERE event = '$pageview'
      AND properties.app_name IN (${inList})
      AND timestamp >= now() - INTERVAL 30 DAY
  `);
  const totalsRow = totalsRows[0];

  const perProject = new Map<string, DailyRow[]>();
  for (const row of perProjectDaily) {
    const [app, day, views, visitors] = row;
    if (!perProject.has(app)) perProject.set(app, []);
    perProject.get(app)!.push({
      day,
      views: Number(views) || 0,
      visitors: Number(visitors) || 0,
    });
  }

  const dailyCombinedMap = new Map<string, { views: number; visitors: number }>();
  for (const [, daily] of perProject) {
    for (const d of daily) {
      const existing = dailyCombinedMap.get(d.day) || { views: 0, visitors: 0 };
      existing.views += d.views;
      existing.visitors += d.visitors;
      dailyCombinedMap.set(d.day, existing);
    }
  }
  const daily_combined = Array.from(dailyCombinedMap.entries())
    .map(([day, v]) => ({ day, views: v.views, visitors: v.visitors }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const projectCards = Array.from(appNameMap.entries()).map(([appName, p]) => {
    const daily = perProject.get(appName) || [];
    const totalViews = daily.reduce((sum, d) => sum + d.views, 0);
    const totalVisitors = daily.reduce((sum, d) => sum + d.visitors, 0);
    const last7Views = daily.slice(-7).reduce((sum, d) => sum + d.views, 0);
    const prev7Views = daily.slice(-14, -7).reduce((sum, d) => sum + d.views, 0);
    const weekChange = prev7Views > 0 ? ((last7Views - prev7Views) / prev7Views) * 100 : null;
    const sparkline = daily.slice(-14).map((d) => d.views);
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
      sparkline,
    };
  });

  projectCards.sort((a, b) => b.totals.views - a.totals.views);

  return NextResponse.json({
    totals: {
      views: Number(totalsRow?.[0]) || 0,
      visitors: Number(totalsRow?.[1]) || 0,
      sessions: Number(totalsRow?.[2]) || 0,
    },
    daily_combined,
    projects: projectCards,
    has_data: daily_combined.length > 0,
  });
}
