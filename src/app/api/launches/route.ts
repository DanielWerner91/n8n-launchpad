import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("launches")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("launches")
    .insert({
      app_name: body.app_name,
      app_description: body.app_description || "",
      app_url: body.app_url || null,
      niche: body.niche || "",
      problem: body.problem || "",
      monetization: body.monetization || "",
      price: body.price || null,
      differentiator: body.differentiator || "",
      launch_timeline: body.launch_timeline || "this_week",
      brand_id: body.brand_id || null,
      status: body.status || "draft",
      strategy: body.strategy || null,
      metrics: body.metrics || null,
      product_url: body.product_url || null,
      product_status: body.product_status || null,
      pricing_model: body.pricing_model || null,
      budget: body.budget || null,
      hours_per_week: body.hours_per_week || null,
      has_audience: body.has_audience || false,
      audience_details: body.audience_details || null,
      launch_target_date: body.launch_target_date || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
