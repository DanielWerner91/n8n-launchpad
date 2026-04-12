import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Get project ID
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch all related data in parallel
  const [checklistResult, auditsResult, activityResult] = await Promise.all([
    supabase
      .from("launchdeck_checklist_items")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order"),
    supabase
      .from("launchdeck_audits")
      .select("*")
      .eq("project_id", project.id)
      .order("audit_type"),
    supabase
      .from("launchdeck_activity_log")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return NextResponse.json({
    checklist_items: checklistResult.data || [],
    audits: auditsResult.data || [],
    activity: activityResult.data || [],
  });
}
