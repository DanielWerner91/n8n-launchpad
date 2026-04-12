import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { TASK_CATEGORY_LABELS } from "@/lib/launches/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: tasks, error } = await supabase
    .from("launch_tasks")
    .select("category, status")
    .eq("launch_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ overall_score: 0, categories: [], total_tasks: 0, completed_tasks: 0 });
  }

  const categoryMap = new Map<string, { total: number; completed: number }>();
  let totalTasks = 0;
  let completedTasks = 0;

  for (const task of tasks) {
    totalTasks++;
    const isComplete = task.status === "completed" || task.status === "skipped";
    if (isComplete) completedTasks++;

    const cat = task.category || "admin";
    const existing = categoryMap.get(cat) || { total: 0, completed: 0 };
    existing.total++;
    if (isComplete) existing.completed++;
    categoryMap.set(cat, existing);
  }

  const categories = Array.from(categoryMap.entries()).map(([category, { total, completed }]) => ({
    category,
    label: TASK_CATEGORY_LABELS[category as keyof typeof TASK_CATEGORY_LABELS] || category,
    total,
    completed,
    score: total > 0 ? Math.round((completed / total) * 100) : 0,
  }));

  const overallScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Update the launch readiness score
  await supabase
    .from("launches")
    .update({ readiness_score: overallScore })
    .eq("id", id);

  return NextResponse.json({
    overall_score: overallScore,
    categories,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
  });
}
