import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateBearer } from "@/lib/api/bearer";
import { emitWebhook } from "@/lib/webhooks/emit";

export const runtime = "nodejs";

const PROJECT_COLUMNS =
  "id,slug,name,description,stage,health,health_score,priority,labels,icon_emoji,logo_url,due_date,start_date,links,created_at,updated_at";

const UPDATABLE_FIELDS = [
  "name",
  "description",
  "stage",
  "health",
  "priority",
  "icon_emoji",
  "logo_url",
  "due_date",
  "start_date",
  "labels",
  "links",
] as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;
  const { slug } = await params;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("launchdeck_projects")
    .select(PROJECT_COLUMNS)
    .eq("user_id", auth.ctx.userId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;
  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in body) patch[field] = body[field];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("launchdeck_projects")
    .select("id,stage")
    .eq("user_id", auth.ctx.userId)
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_projects")
    .update(patch)
    .eq("id", existing.id)
    .select(PROJECT_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void emitWebhook(auth.ctx.userId, "project.updated", data);
  if (patch.stage && patch.stage !== existing.stage) {
    void emitWebhook(auth.ctx.userId, "project.stage_changed", {
      project: data,
      from: existing.stage,
      to: patch.stage,
    });
  }

  return NextResponse.json({ data });
}
