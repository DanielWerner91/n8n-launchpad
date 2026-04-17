import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string; id: string }> };

async function resolveProjectId(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();
  return data?.id as string | undefined;
}

export async function PATCH(req: Request, { params }: Params) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const projectId = await resolveProjectId(supabase, slug);
  if (!projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["title", "description", "status", "priority", "sort_order"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("launchdeck_features")
    .update(update)
    .eq("id", id)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const projectId = await resolveProjectId(supabase, slug);
  if (!projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("launchdeck_features")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
