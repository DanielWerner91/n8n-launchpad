import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  // Fetch all non-archived projects with their milestones
  const { data: projects, error: projError } = await supabase
    .from("launchdeck_projects")
    .select("*")
    .neq("stage", "archived")
    .order("sort_order")
    .order("created_at");

  if (projError) return NextResponse.json({ error: projError.message }, { status: 500 });

  const projectIds = (projects || []).map((p) => p.id);

  // Fetch milestones for all projects
  const { data: milestones, error: msError } = await supabase
    .from("launchdeck_milestones")
    .select("*")
    .in("project_id", projectIds.length > 0 ? projectIds : ["none"])
    .order("target_date");

  if (msError) return NextResponse.json({ error: msError.message }, { status: 500 });

  // Fetch checklist completion counts
  const { data: checklistCounts, error: clError } = await supabase
    .from("launchdeck_checklist_items")
    .select("project_id, is_completed")
    .in("project_id", projectIds.length > 0 ? projectIds : ["none"]);

  if (clError) return NextResponse.json({ error: clError.message }, { status: 500 });

  // Aggregate checklist counts per project
  const checklistMap: Record<string, { total: number; completed: number }> = {};
  for (const item of checklistCounts || []) {
    if (!checklistMap[item.project_id]) checklistMap[item.project_id] = { total: 0, completed: 0 };
    checklistMap[item.project_id].total++;
    if (item.is_completed) checklistMap[item.project_id].completed++;
  }

  // Build timeline data
  const timelineProjects = (projects || []).map((p) => ({
    ...p,
    _checklist_total: checklistMap[p.id]?.total ?? 0,
    _checklist_completed: checklistMap[p.id]?.completed ?? 0,
    _milestones: (milestones || []).filter((m) => m.project_id === p.id),
  }));

  return NextResponse.json(timelineProjects);
}
