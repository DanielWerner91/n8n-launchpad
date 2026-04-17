import { createHmac, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const WEBHOOK_EVENTS = [
  "project.created",
  "project.updated",
  "project.stage_changed",
  "feature.created",
  "feature.updated",
  "launch.created",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

function sign(secret: string, body: string, timestamp: string): string {
  const h = createHmac("sha256", secret);
  h.update(`${timestamp}.${body}`);
  return h.digest("hex");
}

export async function emitWebhook(
  userId: string,
  event: WebhookEvent,
  data: unknown,
): Promise<void> {
  const supabase = createAdminClient();
  const { data: hooks } = await supabase
    .from("launchdeck_webhooks")
    .select("id,url,secret,events,is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!hooks || hooks.length === 0) return;

  const matches = hooks.filter((h) => {
    const evts: string[] = Array.isArray(h.events) ? h.events : [];
    return evts.length === 0 || evts.includes(event) || evts.includes("*");
  });

  if (matches.length === 0) return;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = {
    id: randomBytes(12).toString("base64url"),
    event,
    created_at: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    matches.map(async (hook) => {
      const signature = sign(hook.secret, body, timestamp);
      try {
        const res = await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "LaunchPad-Webhooks/1.0",
            "X-LaunchPad-Event": event,
            "X-LaunchPad-Timestamp": timestamp,
            "X-LaunchPad-Signature": `sha256=${signature}`,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
        await supabase
          .from("launchdeck_webhooks")
          .update({
            last_delivered_at: new Date().toISOString(),
            last_status: res.status,
            failure_count: res.ok ? 0 : (hook as { failure_count?: number }).failure_count ?? 0 + 1,
          })
          .eq("id", hook.id);
      } catch {
        await supabase
          .from("launchdeck_webhooks")
          .update({
            last_delivered_at: new Date().toISOString(),
            last_status: 0,
          })
          .eq("id", hook.id);
      }
    }),
  );
}

export async function deliverTestWebhook(
  url: string,
  secret: string,
): Promise<{ status: number; ok: boolean; error?: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({
    id: randomBytes(12).toString("base64url"),
    event: "webhook.test",
    created_at: new Date().toISOString(),
    data: { message: "This is a test webhook from LaunchPad." },
  });
  const signature = sign(secret, body, timestamp);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LaunchPad-Webhooks/1.0",
        "X-LaunchPad-Event": "webhook.test",
        "X-LaunchPad-Timestamp": timestamp,
        "X-LaunchPad-Signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return {
      status: 0,
      ok: false,
      error: e instanceof Error ? e.message : "Delivery failed",
    };
  }
}
