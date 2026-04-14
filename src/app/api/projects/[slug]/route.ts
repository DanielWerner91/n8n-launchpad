import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("launchdeck_projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("launchdeck_projects")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity if stage changed
  if (body.stage) {
    const { data: project } = await supabase
      .from("launchdeck_projects")
      .select("id")
      .eq("slug", slug)
      .single();
    if (project) {
      await supabase.from("launchdeck_activity_log").insert({
        project_id: project.id,
        action: `Stage changed to ${body.stage}`,
        source: "web",
      });
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("launchdeck_projects")
    .delete()
    .eq("slug", slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
