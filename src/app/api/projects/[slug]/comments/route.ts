import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_comments")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const body = await req.json();

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_comments")
    .insert({
      project_id: project.id,
      content: body.content.trim(),
      source: body.source || "web",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.from("launchdeck_activity_log").insert({
    project_id: project.id,
    action: "Comment added",
    details: { preview: body.content.trim().slice(0, 100) },
    source: body.source || "web",
  });

  return NextResponse.json(data, { status: 201 });
}
