import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  // RLS ensures user only sees activity for their own projects
  const { data, error } = await supabase
    .from("launchdeck_activity_log")
    .select("*, project:launchdeck_projects(name, slug, icon_emoji, logo_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
