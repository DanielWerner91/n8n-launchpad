import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runCompetitorScan } from "@/lib/ai/competitor-scan";

export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("launchdeck_projects")
    .select("id, name, description, links")
    .eq("slug", slug)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("launchdeck_features")
    .select("title")
    .eq("project_id", project.id);

  try {
    const scanned = await runCompetitorScan({
      projectName: project.name,
      description: project.description || "",
      links: (project.links as Record<string, string | null> | null) || null,
      existingFeatures: (existing || []).map((f) => f.title),
    });

    if (scanned.length === 0) {
      return NextResponse.json(
        { error: "No features extracted from scan. Try again with a richer project description." },
        { status: 422 }
      );
    }

    const rows = scanned.map((f) => ({
      project_id: project.id,
      title: f.title,
      description: f.source_competitor
        ? `${f.description}\n\nSource: ${f.source_competitor}`
        : f.description,
      status: "backlog" as const,
      priority: f.priority,
      source: "claude",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("launchdeck_features")
      .insert(rows)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from("launchdeck_activity_log").insert({
      project_id: project.id,
      action: `Competitor scan added ${rows.length} features`,
      details: {
        count: rows.length,
        competitors: Array.from(
          new Set(scanned.map((f) => f.source_competitor).filter(Boolean))
        ),
      },
      source: "claude",
    });

    return NextResponse.json({ features: inserted, count: rows.length }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Scan failed: ${message}` }, { status: 500 });
  }
}
