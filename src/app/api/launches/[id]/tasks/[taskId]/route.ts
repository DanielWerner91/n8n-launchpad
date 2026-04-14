import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const update: Record<string, unknown> = { status: body.status };
  if (body.status === "completed") {
    update.completed_at = new Date().toISOString();
  } else {
    update.completed_at = null;
  }

  const { data, error } = await supabase
    .from("launch_tasks")
    .update(update)
    .eq("id", taskId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
