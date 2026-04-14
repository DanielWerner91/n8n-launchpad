import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("launch_tasks")
    .select("*")
    .eq("launch_id", id)
    .order("scheduled_date", { ascending: true })
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
