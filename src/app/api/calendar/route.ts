import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "audit" | "milestone" | "project_due" | "content" | "launch";
  project_id: string | null;
  project_name: string | null;
  project_slug: string | null;
  project_emoji: string | null;
  project_logo: string | null;
  is_completed: boolean;
  is_overdue: boolean;
  meta?: Record<string, unknown>;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start"); // YYYY-MM-DD
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 });
  }

  const [
    { data: projects },
    { data: audits },
    { data: milestones },
  ] = await Promise.all([
    supabase.from("launchdeck_projects").select("id, slug, name, icon_emoji, logo_url, due_date").neq("stage", "archived"),
    supabase.from("launchdeck_audits").select("*").gte("next_due_at", start).lte("next_due_at", end),
    supabase.from("launchdeck_milestones").select("*").gte("target_date", start).lte("target_date", end),
  ]);

  const projectMap = new Map((projects || []).map((p) => [p.id, p]));
  const now = new Date();
  const events: CalendarEvent[] = [];

  // Audits
  for (const audit of audits || []) {
    const p = projectMap.get(audit.project_id);
    if (!p) continue;
    const dueDate = new Date(audit.next_due_at);
    events.push({
      id: `audit_${audit.id}`,
      date: audit.next_due_at.split("T")[0],
      title: `${audit.audit_type} audit`,
      type: "audit",
      project_id: p.id,
      project_name: p.name,
      project_slug: p.slug,
      project_emoji: p.icon_emoji,
      project_logo: p.logo_url,
      is_completed: false,
      is_overdue: dueDate < now,
      meta: { audit_type: audit.audit_type, interval_days: audit.interval_days },
    });
  }

  // Milestones
  for (const ms of milestones || []) {
    const p = projectMap.get(ms.project_id);
    if (!p) continue;
    const dueDate = new Date(ms.target_date);
    events.push({
      id: `milestone_${ms.id}`,
      date: ms.target_date,
      title: ms.title,
      type: "milestone",
      project_id: p.id,
      project_name: p.name,
      project_slug: p.slug,
      project_emoji: p.icon_emoji,
      project_logo: p.logo_url,
      is_completed: !!ms.completed_at,
      is_overdue: !ms.completed_at && dueDate < now,
      meta: { milestone_id: ms.id },
    });
  }

  // Project due dates
  for (const p of projects || []) {
    if (!p.due_date) continue;
    if (p.due_date < start || p.due_date > end) continue;
    const dueDate = new Date(p.due_date);
    events.push({
      id: `project_${p.id}`,
      date: p.due_date,
      title: `${p.name} due`,
      type: "project_due",
      project_id: p.id,
      project_name: p.name,
      project_slug: p.slug,
      project_emoji: p.icon_emoji,
      project_logo: p.logo_url,
      is_completed: false,
      is_overdue: dueDate < now,
    });
  }

  return NextResponse.json(events);
}
