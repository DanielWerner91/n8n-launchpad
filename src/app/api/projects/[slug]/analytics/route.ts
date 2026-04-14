import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const POSTHOG_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT = process.env.POSTHOG_PROJECT_ID || "371592";
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.posthog.com";

async function hogql<T = unknown[]>(sql: string): Promise<T[]> {
  if (!POSTHOG_KEY) return [];
  try {
    const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: sql } }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? []) as T[];
  } catch {
    return [];
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Verify user owns this project (RLS handles it)
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id, slug, metadata")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Use slug as app_name (matches PostHog event convention)
  // Allow override via metadata.posthog_app_name
  const appName = ((project.metadata as { posthog_app_name?: string })?.posthog_app_name) || slug;

  // Fetch last 30 days of daily pageviews
  const daily = await hogql<[string, number, number]>(`
    SELECT
      toString(toDate(timestamp)) AS day,
      count() AS views,
      count(DISTINCT distinct_id) AS visitors
    FROM events
    WHERE event = '$pageview'
      AND properties.app_name = '${appName.replace(/'/g, "''")}'
      AND timestamp >= now() - INTERVAL 30 DAY
    GROUP BY day
    ORDER BY day ASC
  `);

  // Totals
  const [totals] = await hogql<[number, number, number]>(`
    SELECT
      count() AS views_30d,
      count(DISTINCT distinct_id) AS visitors_30d,
      count(DISTINCT session_id) AS sessions_30d
    FROM events
    WHERE event = '$pageview'
      AND properties.app_name = '${appName.replace(/'/g, "''")}'
      AND timestamp >= now() - INTERVAL 30 DAY
  `) || [[0, 0, 0]];

  // 7-day view for sparkline
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
