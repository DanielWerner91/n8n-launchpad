import { createClient } from "@/lib/supabase/server";

export async function requireAuth(): Promise<{ userId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id };
}
