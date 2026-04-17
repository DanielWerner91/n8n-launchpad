import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let query = supabase
    .from("launchdeck_features")
    .select("*")
    .eq("project_id", project.id)
    .order("status")
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

type FeatureInput = {
  title?: string;
  description?: string | null;
  status?: "backlog" | "in_progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent" | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const source: string = body.source || "web";

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rawFeatures: FeatureInput[] = Array.isArray(body.features)
    ? body.features
    : body.title
      ? [{ title: body.title, description: body.description, status: body.status, priority: body.priority }]
      : [];

  const rows = rawFeatures
    .map((f) => (typeof f === "string" ? { title: f } : f))
    .filter((f): f is FeatureInput & { title: string } => !!f.title?.trim())
    .map((f) => ({
      project_id: project.id,
      title: f.title.trim(),
      description: f.description?.toString().trim() || null,
      status: f.status || "backlog",
      priority: f.priority || null,
      source,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No features provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("launchdeck_features")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("launchdeck_activity_log").insert({
    project_id: project.id,
    action: rows.length === 1 ? `Feature added: ${rows[0].title}` : `${rows.length} features added`,
    details: { titles: rows.map((r) => r.title) },
    source,
  });

  return NextResponse.json(data, { status: 201 });
}
