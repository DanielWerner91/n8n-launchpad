import { createAdminClient } from "@/lib/supabase/admin";
import type { EnhancedGTMStrategy, TaskCategory, TaskPriority } from "./types";
import { getRelevantDirectories } from "./directories";

interface TaskInput {
  title: string;
  description?: string;
  platform?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_minutes?: number;
  week_number: number;
  day_offset: number;
  automated?: boolean;
  automation_type?: string;
  url?: string;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDayLabel(date: Date): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
}

function calculateDate(launchDate: Date, weekNumber: number, dayOffset: number): Date {
  const weekStart = addDays(launchDate, weekNumber * 7);
  return addDays(weekStart, dayOffset);
}

export async function generateLaunchTasks(
  launchId: string,
  strategy: EnhancedGTMStrategy,
  launchTargetDate: string,
  niche: string,
): Promise<{ count: number; error?: string }> {
  const supabase = createAdminClient();
  const launchDate = new Date(launchTargetDate);
  const isAI = niche.toLowerCase().includes("ai");

  await supabase.from("launch_tasks").delete().eq("launch_id", launchId);
  await supabase.from("launch_phases").delete().eq("launch_id", launchId);

  const phases = [
    { phase: "pre_launch", week_number: -4 },
    { phase: "pre_launch", week_number: -3 },
    { phase: "pre_launch", week_number: -2 },
    { phase: "pre_launch", week_number: -1 },
    { phase: "launch_week", week_number: 0 },
    { phase: "post_launch", week_number: 1 },
    { phase: "post_launch", week_number: 2 },
    { phase: "post_launch", week_number: 3 },
    { phase: "post_launch", week_number: 4 },
  ];

  const { data: createdPhases, error: phaseError } = await supabase
    .from("launch_phases")
    .insert(phases.map((p) => ({ launch_id: launchId, ...p, status: "pending" })))
    .select();

  if (phaseError) return { count: 0, error: phaseError.message };

  const phaseMap = new Map<number, string>();
  for (const p of createdPhases || []) phaseMap.set(p.week_number, p.id);

  const allTasks: TaskInput[] = [];

  // Week -4: Account Setup
  allTasks.push(
    { title: "Create/optimize Product Hunt account", platform: "product_hunt", category: "account_setup", priority: "critical", estimated_minutes: 20, week_number: -4, day_offset: 0, url: "https://www.producthunt.com/join" },
    { title: "Create/optimize Reddit account", platform: "reddit", category: "account_setup", priority: "critical", estimated_minutes: 15, week_number: -4, day_offset: 0, url: "https://www.reddit.com/register/" },
    { title: "Create Hacker News account", platform: "hacker_news", category: "account_setup", priority: "high", estimated_minutes: 10, week_number: -4, day_offset: 0, url: "https://news.ycombinator.com/login" },
    { title: "Create Indie Hackers profile", platform: "indie_hackers", category: "account_setup", priority: "high", estimated_minutes: 15, week_number: -4, day_offset: 1 },
    { title: "Optimize LinkedIn profile for launch", platform: "linkedin", category: "account_setup", priority: "medium", estimated_minutes: 20, week_number: -4, day_offset: 1 },
    { title: "Set up email list (Beehiiv/Mailchimp)", platform: "email", category: "account_setup", priority: "high", estimated_minutes: 45, week_number: -4, day_offset: 2 },
    { title: "Set up analytics", platform: "general", category: "admin", priority: "high", estimated_minutes: 30, week_number: -4, day_offset: 2 },
    { title: "Verify payment processor is ready", platform: "general", category: "admin", priority: "critical", estimated_minutes: 30, week_number: -4, day_offset: 3 },
  );

  // Community seeding weeks -4 to -1
  for (const week of [-3, -2, -1]) {
    allTasks.push(
      { title: `Reddit: Post 3-5 helpful comments (Week ${week})`, platform: "reddit", category: "community_seeding", priority: "high", estimated_minutes: 20, week_number: week, day_offset: 0 },
      { title: `Reddit: Continue participation (Week ${week})`, platform: "reddit", category: "community_seeding", priority: "medium", estimated_minutes: 20, week_number: week, day_offset: 3 },
    );
    if (week >= -2) {
      allTasks.push({ title: `LinkedIn: Build-in-public teaser (Week ${week})`, platform: "linkedin", category: "community_seeding", priority: "medium", estimated_minutes: 20, week_number: week, day_offset: 1 });
    }
  }

  // Week -1: Directory submissions
  const directories = getRelevantDirectories(niche, isAI);
  for (let i = 0; i < directories.length; i++) {
    const dir = directories[i];
    allTasks.push({
      title: `Submit to ${dir.name}`,
      description: `Format: ${dir.description_format}. Max: ${dir.max_description_length} chars. Review: ${dir.review_time}.`,
      platform: "general",
      category: "directory",
      priority: i < 5 ? "high" : "medium",
      estimated_minutes: 15,
      week_number: -1,
      day_offset: Math.min(Math.floor(i / 6), 4),
      url: dir.submission_url,
    });
  }

  // Week -1: Content preparation
  allTasks.push(
    { title: "Write Product Hunt tagline, description, and first comment", platform: "product_hunt", category: "content", priority: "critical", estimated_minutes: 60, week_number: -1, day_offset: 0, automated: true },
    { title: "Write Reddit launch post", platform: "reddit", category: "content", priority: "critical", estimated_minutes: 45, week_number: -1, day_offset: 1, automated: true },
    { title: "Write LinkedIn launch announcement", platform: "linkedin", category: "content", priority: "high", estimated_minutes: 30, week_number: -1, day_offset: 2, automated: true },
    { title: "Write email launch sequence (4 emails)", platform: "email", category: "content", priority: "high", estimated_minutes: 60, week_number: -1, day_offset: 3, automated: true },
    { title: "Review and finalize all launch content", platform: "general", category: "content", priority: "critical", estimated_minutes: 60, week_number: -1, day_offset: 5 },
    { title: "Personal outreach to 50 potential supporters", platform: "general", category: "outreach", priority: "critical", estimated_minutes: 120, week_number: -1, day_offset: 4 },
    { title: "Landing page final check", platform: "general", category: "admin", priority: "critical", estimated_minutes: 30, week_number: -1, day_offset: 5 },
  );

  // Week 0: Launch Day
  if (strategy.launch_timeline?.launch_day_playbook?.hour_by_hour?.length) {
    for (const hourTask of strategy.launch_timeline.launch_day_playbook.hour_by_hour) {
      allTasks.push({
        title: `${hourTask.time}: ${hourTask.action}`,
        description: hourTask.details,
        platform: hourTask.platform || "general",
        category: "launch_day",
        priority: "critical",
        estimated_minutes: 15,
        week_number: 0,
        day_offset: 0,
      });
    }
  } else {
    allTasks.push(
      { title: "12:01 AM PST: Submit to Product Hunt", platform: "product_hunt", category: "launch_day", priority: "critical", estimated_minutes: 15, week_number: 0, day_offset: 0 },
      { title: "6:00 AM: Post on Reddit", platform: "reddit", category: "launch_day", priority: "critical", estimated_minutes: 15, week_number: 0, day_offset: 0 },
      { title: "7:00 AM: Send launch email", platform: "email", category: "launch_day", priority: "critical", estimated_minutes: 10, week_number: 0, day_offset: 0 },
      { title: "9:00 AM: Post LinkedIn announcement", platform: "linkedin", category: "launch_day", priority: "high", estimated_minutes: 10, week_number: 0, day_offset: 0 },
      { title: "Every 30 min: Respond to PH comments", platform: "product_hunt", category: "launch_day", priority: "critical", estimated_minutes: 120, week_number: 0, day_offset: 0 },
      { title: "5:00 PM: Share first metrics publicly", platform: "general", category: "launch_day", priority: "high", estimated_minutes: 15, week_number: 0, day_offset: 0 },
    );
  }

  // Post-launch
  allTasks.push(
    { title: "Send recap email with social proof", platform: "email", category: "launch_day", priority: "high", estimated_minutes: 20, week_number: 0, day_offset: 1 },
    { title: "Day 3: Send 'last chance' email for launch offer", platform: "email", category: "launch_day", priority: "high", estimated_minutes: 15, week_number: 0, day_offset: 3 },
    { title: "Post launch results on Indie Hackers", platform: "indie_hackers", category: "post_launch", priority: "high", estimated_minutes: 60, week_number: 1, day_offset: 0 },
    { title: "LinkedIn: Share launch results", platform: "linkedin", category: "post_launch", priority: "medium", estimated_minutes: 20, week_number: 1, day_offset: 1 },
    { title: "Review launch metrics and identify top channel", platform: "general", category: "post_launch", priority: "high", estimated_minutes: 30, week_number: 1, day_offset: 4 },
    { title: "Week 2: Follow up with outreach contacts", platform: "general", category: "post_launch", priority: "medium", estimated_minutes: 60, week_number: 2, day_offset: 2 },
    { title: "Week 3: Iterate based on user feedback", platform: "general", category: "post_launch", priority: "high", estimated_minutes: 60, week_number: 3, day_offset: 0 },
    { title: "Week 4: Plan next growth phase", platform: "general", category: "post_launch", priority: "medium", estimated_minutes: 60, week_number: 4, day_offset: 0 },
  );

  const rows = allTasks.map((task) => {
    const date = calculateDate(launchDate, task.week_number, task.day_offset);
    return {
      launch_id: launchId,
      phase_id: phaseMap.get(task.week_number) || null,
      title: task.title,
      description: task.description || null,
      platform: task.platform || null,
      category: task.category,
      priority: task.priority,
      estimated_minutes: task.estimated_minutes || null,
      scheduled_date: formatDate(date),
      week_number: task.week_number,
      day_label: getDayLabel(date),
      status: "pending" as const,
      automated: task.automated || false,
      automation_type: task.automation_type || null,
      url: task.url || null,
    };
  });

  const { error: insertError } = await supabase.from("launch_tasks").insert(rows);
  if (insertError) return { count: 0, error: insertError.message };

  await supabase
    .from("launches")
    .update({ current_phase: "pre_launch", status: "pre_launch" })
    .eq("id", launchId);

  return { count: rows.length };
}
