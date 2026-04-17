import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateBearer } from "@/lib/api/bearer";
import { emitWebhook } from "@/lib/webhooks/emit";

export const runtime = "nodejs";

const FEATURE_COLUMNS =
  "id,project_id,title,description,status,priority,source,sort_order,created_at,updated_at,completed_at";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;
  const { slug } = await params;

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("user_id", auth.ctx.userId)
    .eq("slug", slug)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);

  let q = supabase
    .from("launchdeck_features")
    .select(FEATURE_COLUMNS)
    .eq("project_id", project.id)
    .order("status")
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("user_id", auth.ctx.userId)
    .eq("slug", slug)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_features")
    .insert({
      project_id: project.id,
      title,
      description: typeof body.description === "string" ? body.description : null,
      status: typeof body.status === "string" ? body.status : "backlog",
      priority: typeof body.priority === "string" ? body.priority : null,
      source: "api",
    })
    .select(FEATURE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void emitWebhook(auth.ctx.userId, "feature.created", data);
  return NextResponse.json({ data }, { status: 201 });
}
