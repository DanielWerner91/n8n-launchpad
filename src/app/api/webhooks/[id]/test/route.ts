import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deliverTestWebhook } from "@/lib/webhooks/emit";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: hook } = await supabase
    .from("launchdeck_webhooks")
    .select("id,url,secret")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await deliverTestWebhook(hook.url, hook.secret);

  await supabase
    .from("launchdeck_webhooks")
    .update({
      last_delivered_at: new Date().toISOString(),
      last_status: result.status,
    })
    .eq("id", hook.id);

  return NextResponse.json(result);
}
