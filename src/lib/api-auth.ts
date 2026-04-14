import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/projects/types";

export async function requireAuth(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id };
}

export async function requireAuthWithProfile(): Promise<{ userId: string; profile: UserProfile | null } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { userId: user.id, profile };
}
