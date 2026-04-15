import { createClient } from "@/lib/supabase/server";
import { hogql, escapeHogQL } from "@/lib/posthog/hogql";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id, slug, metadata")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Use slug as app_name by default. Override via metadata.posthog_app_name
  // for apps where the PostHog app_name property differs from the project slug.
  const appName = ((project.metadata as { posthog_app_name?: string })?.posthog_app_name) || slug;
  const safeName = escapeHogQL(appName);

  const daily = await hogql<[string, number, number]>(`
    SELECT
      toString(toDate(timestamp)) AS day,
      count() AS views,
      count(DISTINCT distinct_id) AS visitors
    FROM events
    WHERE event = '$pageview'
      AND properties.app_name = '${safeName}'
      AND timestamp >= now() - INTERVAL 30 DAY
    GROUP BY day
    ORDER BY day ASC
  `);

  const totalRows = await hogql<[number, number, number]>(`
    SELECT
      count() AS views_30d,
      count(DISTINCT distinct_id) AS visitors_30d,
      count(DISTINCT session_id) AS sessions_30d
    FROM events
    WHERE event = '$pageview'
      AND properties.app_name = '${safeName}'
      AND timestamp >= now() - INTERVAL 30 DAY
  `);
  const totals = totalRows[0];

  const sparkline = daily.slice(-7).map((row) => ({
    day: row[0],
    views: Number(row[1]) || 0,
  }));

  return NextResponse.json({
    app_name: appName,
    totals: {
      views_30d: Number(totals?.[0]) || 0,
      visitors_30d: Number(totals?.[1]) || 0,
      sessions_30d: Number(totals?.[2]) || 0,
    },
    daily: daily.map((row) => ({
      day: row[0],
      views: Number(row[1]) || 0,
      visitors: Number(row[2]) || 0,
    })),
    sparkline,
  });
}
