import { createClient } from "@/lib/supabase/server";
import { requireAuthWithProfile } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
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
  const auth = await requireAuthWithProfile();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const body = await req.json();

  // Create the project
  const { data: project, error } = await supabase
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
      user_id: auth.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If a template was selected, create checklist items from it
  if (body.template_slug) {
    const { data: template } = await supabase
      .from("launchdeck_templates")
      .select("checklist")
      .eq("slug", body.template_slug)
      .single();

    if (template?.checklist && Array.isArray(template.checklist)) {
      const profile = auth.profile;
      const checklistItems = template.checklist.map((item: {
        label: string;
        category: string;
        sort_order: number;
        stage?: string;
        guidance?: Record<string, unknown>;
      }) => ({
        project_id: project.id,
        label: item.label,
        category: item.category,
        sort_order: item.sort_order,
        stage: item.stage || "build",
        is_completed: false,
        notes: "",
        guidance: profile ? substituteGuidance(item.guidance || {}, profile) : (item.guidance || {}),
      }));

      await supabase.from("launchdeck_checklist_items").insert(checklistItems);
    }
  }

  return NextResponse.json(project, { status: 201 });
}

function substituteGuidance(
  guidance: Record<string, unknown>,
  profile: { github_username: string | null; default_supabase_project_id: string | null; vercel_team_id: string | null; apps_directory: string }
): Record<string, unknown> {
  const vars: Record<string, string> = {
    "{{github_username}}": profile.github_username || "YOUR_GITHUB_USERNAME",
    "{{supabase_project_id}}": profile.default_supabase_project_id || "YOUR_SUPABASE_PROJECT",
    "{{vercel_team_id}}": profile.vercel_team_id || "YOUR_VERCEL_TEAM",
    "{{apps_directory}}": profile.apps_directory || "~/projects/",
  };

  const replaceVars = (text: string): string => {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(key, value);
    }
    return result;
  };

  const result = { ...guidance };
  if (typeof result.approach === "string") result.approach = replaceVars(result.approach);
  if (typeof result.done_when === "string") result.done_when = replaceVars(result.done_when);
  return result;
}
