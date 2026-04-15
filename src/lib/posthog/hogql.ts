const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "371592";
const HOST = process.env.POSTHOG_HOST || "https://us.posthog.com";

export async function hogql<T = unknown[]>(sql: string): Promise<T[]> {
  if (!KEY) return [];
  try {
    const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: sql } }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? []) as T[];
  } catch {
    return [];
  }
}

export function escapeHogQL(value: string): string {
  return value.replace(/'/g, "''");
}
