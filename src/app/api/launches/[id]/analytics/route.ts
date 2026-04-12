import { NextResponse } from "next/server";

const POSTHOG_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "371592";
const HOST = process.env.POSTHOG_HOST || "https://us.posthog.com";

async function hogql<T = unknown[]>(sql: string): Promise<T[]> {
  if (!POSTHOG_KEY) return [];
  const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
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
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const appName = searchParams.get("app_name");

  if (!appName) {
    return NextResponse.json({ error: "app_name query param required" }, { status: 400 });
  }

  if (!POSTHOG_KEY) {
    return NextResponse.json({ error: "PostHog not configured", stats: null });
  }

  const safe = appName.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    const [statsRows, topPagesRows, referrerRows, timeseriesRows] = await Promise.all([
      hogql<[number, number, number, number, number]>(`
        SELECT
          countIf(timestamp >= now() - INTERVAL 7 DAY) AS pv7,
          countIf(timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) AS pv_prev,
          count(DISTINCT if(timestamp >= now() - INTERVAL 7 DAY, person_id, NULL)) AS visitors7,
          count(DISTINCT if(timestamp >= now() - INTERVAL 7 DAY, properties.$session_id, NULL)) AS sessions7,
          countIf(timestamp >= now() - INTERVAL 30 DAY) AS pv30
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
          AND properties.app_name = '${safe}'
      `),
      hogql<[string, number]>(`
        SELECT properties.$pathname AS path, count() AS views
        FROM events
        WHERE event = '$pageview'
          AND properties.app_name = '${safe}'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY path ORDER BY views DESC LIMIT 5
      `),
      hogql<[string, number]>(`
        SELECT properties.$referring_domain AS ref, count(DISTINCT properties.$session_id) AS sessions
        FROM events
        WHERE event = '$pageview'
          AND properties.app_name = '${safe}'
          AND timestamp >= now() - INTERVAL 30 DAY
          AND properties.$referring_domain IS NOT NULL
          AND properties.$referring_domain != ''
          AND properties.$referring_domain != '$direct'
        GROUP BY ref ORDER BY sessions DESC LIMIT 5
      `),
      hogql<[string, number]>(`
        SELECT toDate(timestamp) AS date, count() AS pv
        FROM events
        WHERE event = '$pageview'
          AND properties.app_name = '${safe}'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY date ORDER BY date ASC
      `),
    ]);

    const s = statsRows[0] || [0, 0, 0, 0, 0];
    const stats = {
      pv7d: Number(s[0] ?? 0),
      pv_prev: Number(s[1] ?? 0),
      visitors_7d: Number(s[2] ?? 0),
      sessions_7d: Number(s[3] ?? 0),
      pv_30d: Number(s[4] ?? 0),
      delta_pct: s[1] && Number(s[1]) > 0
        ? Math.round(((Number(s[0]) - Number(s[1])) / Number(s[1])) * 100)
        : null,
    };

    return NextResponse.json({
      stats,
      topPages: topPagesRows.map((r) => ({ path: r[0], views: Number(r[1]) })),
      topReferrers: referrerRows.map((r) => ({ referrer: r[0], sessions: Number(r[1]) })),
      timeseries: timeseriesRows.map((r) => ({ date: String(r[0]).slice(0, 10), pageviews: Number(r[1]) })),
    });
  } catch (error) {
    return NextResponse.json({ error: "PostHog query failed", stats: null });
  }
}
