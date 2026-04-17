import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const KEY_PREFIX = "lp_";

export function generateApiKey(): { full: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString("base64url");
  const full = `${KEY_PREFIX}${raw}`;
  const hash = createHash("sha256").update(full).digest("hex");
  const prefix = full.slice(0, 10);
  return { full, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export type BearerContext = {
  userId: string;
  keyId: string;
};

export async function authenticateBearer(
  req: Request,
): Promise<{ ok: true; ctx: BearerContext } | { ok: false; response: Response }> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing or malformed Authorization header. Expected: Bearer <key>" },
        { status: 401 },
      ),
    };
  }

  const key = header.slice(7).trim();
  if (!key.startsWith(KEY_PREFIX)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid API key format" }, { status: 401 }),
    };
  }

  const hash = hashApiKey(key);
  const supabase = createAdminClient();
  const { data: record, error } = await supabase
    .from("launchdeck_api_keys")
    .select("id,user_id,revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !record) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }
  if (record.revoked_at) {
    return {
      ok: false,
      response: NextResponse.json({ error: "API key has been revoked" }, { status: 401 }),
    };
  }

  void supabase
    .from("launchdeck_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", record.id)
    .then(() => {});

  return { ok: true, ctx: { userId: record.user_id, keyId: record.id } };
}
