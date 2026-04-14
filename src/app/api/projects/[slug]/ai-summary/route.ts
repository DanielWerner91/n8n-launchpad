import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch project + checklist + audits + recent activity (RLS scoped to user)
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [checklistResult, auditsResult, activityResult] = await Promise.all([
    supabase.from("launchdeck_checklist_items").select("*").eq("project_id", project.id),
    supabase.from("launchdeck_audits").select("*").eq("project_id", project.id),
    supabase.from("launchdeck_activity_log").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const checklist = checklistResult.data || [];
  const audits = auditsResult.data || [];
  const activity = activityResult.data || [];

  const completedCount = checklist.filter((i: { is_completed: boolean }) => i.is_completed).length;
  const totalCount = checklist.length;
  const overdueAudits = audits.filter((a: { next_due_at: string | null }) =>
    a.next_due_at ? new Date(a.next_due_at) < new Date() : false
  );
  const daysSinceUpdate = Math.floor((Date.now() - new Date(project.updated_at).getTime()) / 86400000);

  // Generate nudges (deterministic, no AI needed)
  const nudges: { severity: "info" | "warning" | "critical"; message: string }[] = [];

  for (const audit of overdueAudits) {
    const daysOverdue = Math.floor((Date.now() - new Date(audit.next_due_at).getTime()) / 86400000);
    nudges.push({
      severity: daysOverdue > 14 ? "critical" : "warning",
      message: `${audit.audit_type} audit is ${daysOverdue} days overdue. Run /${audit.audit_type === "security" ? "security-audit" : audit.audit_type === "ux" ? "app-improver" : "audit"}.`,
    });
  }

  if (project.due_date && new Date(project.due_date) < new Date()) {
    nudges.push({ severity: "critical", message: `Due date has passed. Update timeline or mark complete.` });
  }

  if (daysSinceUpdate > 21 && project.stage !== "archived" && project.stage !== "live") {
    nudges.push({ severity: "warning", message: `No updates in ${daysSinceUpdate} days. Is this project still active?` });
  }

  if (totalCount > 0 && (project.stage === "live" || project.stage === "scaling")) {
    const pct = Math.round((completedCount / totalCount) * 100);
    if (pct < 80) {
      nudges.push({ severity: "warning", message: `${pct}% checklist complete on a ${project.stage} project. Close out remaining tasks.` });
    }
  }

  if (project.stage === "idea" && daysSinceUpdate > 30) {
    nudges.push({ severity: "info", message: `Still an idea after ${daysSinceUpdate} days. Validate or archive to reduce portfolio noise.` });
  }

  // AI summary via Claude (cached in KV would be ideal, but simple for now)
  let summary = "";
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Write a 2-sentence status summary for this project. Be direct, specific, and actionable. No fluff.

Project: ${project.name}
Stage: ${project.stage}
Health: ${project.health} (${project.health_score}/100)
Description: ${project.description || "No description"}
Checklist: ${completedCount}/${totalCount} complete
Overdue audits: ${overdueAudits.length}
Last updated: ${daysSinceUpdate} days ago
Recent activity: ${activity.slice(0, 5).map((a: { action: string }) => a.action).join("; ") || "None"}

First sentence: current status. Second sentence: next concrete action to take.`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") summary = textBlock.text.trim();
  } catch {
    // Fall back to deterministic summary
    summary = `${project.name} is in the ${project.stage} stage with ${project.health} health. ${
      overdueAudits.length > 0
        ? `${overdueAudits.length} overdue audit${overdueAudits.length > 1 ? "s" : ""} need attention.`
        : completedCount < totalCount
        ? `${totalCount - completedCount} checklist items remaining.`
        : "On track."
    }`;
  }

  return NextResponse.json({ summary, nudges, stats: { completedCount, totalCount, overdueAudits: overdueAudits.length, daysSinceUpdate } });
}
