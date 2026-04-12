import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const health = searchParams.get("health");

  let query = supabase
    .from("launchdeck_projects")
    .select("*")
    .order("sort_order")
    .order("created_at");

  if (stage) query = query.eq("stage", stage);
  if (health) query = query.eq("health", health);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("launchdeck_projects")
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description || "",
      icon_emoji: body.icon_emoji || "🚀",
      template_slug: body.template_slug || null,
      stage: body.stage || "idea",
      health: "green",
      health_score: 100,
      links: body.links || {},
      metadata: body.metadata || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
