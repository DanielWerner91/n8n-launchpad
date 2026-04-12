import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Fetch brands from Content Flywheel's shared Supabase instance.
 * Returns brand names, slugs, logo URLs, and design system colors.
 * These are used for displaying app logos in the analytics dashboard.
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, website_url, design_system")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
