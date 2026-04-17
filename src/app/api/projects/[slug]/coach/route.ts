import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCoachReport, COACH_CACHE_TTL_MS, type CoachReport } from "@/lib/ai/launch-coach";

export const runtime = "nodejs";
export const maxDuration = 60;

type Metadata = Record<string, unknown> & { coach_cache?: CoachReport };

function isFresh(report: CoachReport | undefined): report is CoachReport {
  if (!report?.generated_at) return false;
  const age = Date.now() - new Date(report.generated_at).getTime();
  return age < COACH_CACHE_TTL_MS;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("refresh") === "1";

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const metadata = (project.metadata || {}) as Metadata;
  if (!force && isFresh(metadata.coach_cache)) {
    return NextResponse.json({ report: metadata.coach_cache, cached: true });
  }

  const [checklistResult, featuresResult, auditsResult, activityResult] = await Promise.all([
    supabase
      .from("launchdeck_checklist_items")
      .select("category,label,is_completed,stage")
      .eq("project_id", project.id),
    supabase
      .from("launchdeck_features")
      .select("title,status,priority")
      .eq("project_id", project.id)
      .order("priority", { nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("launchdeck_audits")
      .select("audit_type,is_overdue,next_due_at")
      .eq("project_id", project.id),
    supabase
      .from("launchdeck_activity_log")
      .select("action,created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  try {
    const report = await generateCoachReport({
      project: {
        name: project.name,
        slug: project.slug,
        description: project.description || "",
        stage: project.stage,
        health: project.health,
        health_score: project.health_score,
        priority: project.priority,
        due_date: project.due_date,
        updated_at: project.updated_at,
      },
      checklist: checklistResult.data ?? [],
      features: featuresResult.data ?? [],
      audits: auditsResult.data ?? [],
      recent_activity: activityResult.data ?? [],
    });

    const nextMetadata: Metadata = { ...metadata, coach_cache: report };
    await supabase
      .from("launchdeck_projects")
      .update({ metadata: nextMetadata })
      .eq("id", project.id);

    return NextResponse.json({ report, cached: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Coach generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
