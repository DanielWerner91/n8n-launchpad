import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateBearer } from "@/lib/api/bearer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
  const status = searchParams.get("status");

  const supabase = createAdminClient();
  let q = supabase
    .from("launches")
    .select("id,app_name,niche,status,launch_timeline,created_at,updated_at")
    .eq("user_id", auth.ctx.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
