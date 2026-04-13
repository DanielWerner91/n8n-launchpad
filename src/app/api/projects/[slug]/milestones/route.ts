import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_milestones")
    .select("*")
    .eq("project_id", project.id)
    .order("target_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const body = await req.json();

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_milestones")
    .insert({
      project_id: project.id,
      title: body.title,
      target_date: body.target_date,
      color: body.color || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const body = await req.json();

  // Verify project ownership
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("launchdeck_milestones")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("project_id", project.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const milestoneId = searchParams.get("id");

  if (!milestoneId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("launchdeck_milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", project.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
