import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebhookSecret, WEBHOOK_EVENTS } from "@/lib/webhooks/emit";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("launchdeck_webhooks")
    .select("id,url,events,is_active,description,last_delivered_at,last_status,failure_count,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { url?: string; events?: string[]; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "url must be a valid http(s) URL" }, { status: 400 });
  }

  const events = Array.isArray(body.events)
    ? body.events.filter((e) => WEBHOOK_EVENTS.includes(e as typeof WEBHOOK_EVENTS[number]) || e === "*")
    : [];

  const secret = generateWebhookSecret();

  const { data, error } = await supabase
    .from("launchdeck_webhooks")
    .insert({
      user_id: user.id,
      url,
      secret,
      events,
      description: body.description?.trim() || null,
      is_active: true,
    })
    .select("id,url,events,is_active,description,last_delivered_at,last_status,failure_count,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...data, secret }, { status: 201 });
}
