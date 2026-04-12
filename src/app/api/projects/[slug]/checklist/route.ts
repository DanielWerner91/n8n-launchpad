import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const body = await req.json();

  const { item_id, is_completed } = body;
  if (!item_id || typeof is_completed !== "boolean") {
    return NextResponse.json({ error: "item_id and is_completed required" }, { status: 400 });
  }

  const update: Record<string, unknown> = { is_completed };
  if (is_completed) {
    update.completed_at = new Date().toISOString();
  } else {
    update.completed_at = null;
  }

  const { data, error } = await supabase
    .from("launchdeck_checklist_items")
    .update(update)
    .eq("id", item_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
