import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateBearer } from "@/lib/api/bearer";
import { emitWebhook } from "@/lib/webhooks/emit";

export const runtime = "nodejs";

const PROJECT_COLUMNS =
  "id,slug,name,description,stage,health,health_score,priority,labels,icon_emoji,logo_url,due_date,start_date,links,created_at,updated_at";

export async function GET(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const health = searchParams.get("health");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  const supabase = createAdminClient();
  let q = supabase
    .from("launchdeck_projects")
    .select(PROJECT_COLUMNS)
    .eq("user_id", auth.ctx.userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (stage) q = q.eq("stage", stage);
  if (health) q = q.eq("health", health);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("launchdeck_projects")
    .insert({
      user_id: auth.ctx.userId,
      name,
      slug,
      description: typeof body.description === "string" ? body.description : "",
      icon_emoji: typeof body.icon_emoji === "string" ? body.icon_emoji : "🚀",
      stage: typeof body.stage === "string" ? body.stage : "idea",
      health: "green",
      health_score: 100,
      priority: typeof body.priority === "string" ? body.priority : null,
      links: typeof body.links === "object" && body.links ? body.links : {},
      metadata: {},
      labels: Array.isArray(body.labels) ? body.labels : [],
    })
    .select(PROJECT_COLUMNS)
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  void emitWebhook(auth.ctx.userId, "project.created", data);
  return NextResponse.json({ data }, { status: 201 });
}
