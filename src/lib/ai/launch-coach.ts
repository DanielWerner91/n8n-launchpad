import Anthropic from "@anthropic-ai/sdk";

export type CoachSeverity = "high" | "medium" | "low";

export type CoachItem = {
  title: string;
  detail: string;
  severity: CoachSeverity;
  action?: string;
};

export type CoachReport = {
  blockers: CoachItem[];
  next_actions: CoachItem[];
  risk_flags: CoachItem[];
  generated_at: string;
};

export const COACH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CoachInput = {
  project: {
    name: string;
    slug: string;
    description: string;
    stage: string;
    health: string;
    health_score: number;
    priority: string | null;
    due_date: string | null;
    updated_at: string;
  };
  checklist: { category: string; label: string; is_completed: boolean; stage: string }[];
  features: { title: string; status: string; priority: string | null }[];
  audits: { audit_type: string; is_overdue: boolean; next_due_at: string | null }[];
  recent_activity: { action: string; created_at: string }[];
};

const SYSTEM_PROMPT = `You are an elite launch coach embedded in a solo founder's project dashboard. You review a single project's state and surface the 3-6 highest-leverage observations, structured as blockers, next actions, and risk flags.

Voice:
- Direct, specific, builder-to-builder. No corporate fluff.
- Short. Each title under 8 words. Each detail under 25 words.
- Name the concrete artifact when possible (checklist item, audit type, feature title).
- Suggest an action when the item is actionable.
- Never use em dashes or en dashes. Use periods, colons, or restructure sentences.

Severity:
- high: actively blocking shipping or putting the project at risk
- medium: should be addressed within a week
- low: nice to have, would improve quality

Return ONLY a JSON object with this exact shape (no markdown, no code fences):
{
  "blockers": [{"title": "...", "detail": "...", "severity": "high|medium|low", "action": "..."}],
  "next_actions": [{"title": "...", "detail": "...", "severity": "high|medium|low", "action": "..."}],
  "risk_flags": [{"title": "...", "detail": "...", "severity": "high|medium|low", "action": "..."}]
}

Blockers: things preventing the next stage transition.
Next actions: the 2-4 most impactful things to do this week.
Risk flags: hidden risks, staleness, compliance gaps, things that will bite later if ignored.

Each section can be empty if there's nothing to say. Better 2 sharp observations than 6 generic ones. Never fabricate tasks or audits that were not in the input.`;

function buildUserPrompt(input: CoachInput): string {
  const p = input.project;
  const completed = input.checklist.filter((c) => c.is_completed).length;
  const total = input.checklist.length;
  const pending = input.checklist
    .filter((c) => !c.is_completed)
    .slice(0, 20)
    .map((c) => `- [${c.stage}/${c.category}] ${c.label}`)
    .join("\n") || "(none)";
  const backlog = input.features
    .filter((f) => f.status === "backlog")
    .slice(0, 15)
    .map((f) => `- ${f.priority ? `(${f.priority}) ` : ""}${f.title}`)
    .join("\n") || "(none)";
  const inProgress = input.features.filter((f) => f.status === "in_progress").map((f) => `- ${f.title}`).join("\n") || "(none)";
  const audits = input.audits
    .map((a) => `- ${a.audit_type}: ${a.is_overdue ? "OVERDUE" : `due ${a.next_due_at ?? "n/a"}`}`)
    .join("\n") || "(no audits configured)";
  const activity = input.recent_activity
    .slice(0, 8)
    .map((a) => `- ${a.action} (${a.created_at.slice(0, 10)})`)
    .join("\n") || "(no recent activity)";
  const daysSinceUpdate = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000);

  return `PROJECT
Name: ${p.name}
Slug: ${p.slug}
Description: ${p.description || "(none)"}
Stage: ${p.stage}
Health: ${p.health} (${p.health_score}/100)
Priority: ${p.priority || "unset"}
Due date: ${p.due_date || "none"}
Days since last update: ${daysSinceUpdate}

CHECKLIST ${completed}/${total} complete. Pending items:
${pending}

FEATURES in progress:
${inProgress}

FEATURES backlog (top 15):
${backlog}

AUDITS:
${audits}

RECENT ACTIVITY:
${activity}

Return the JSON coach report now.`;
}

export async function generateCoachReport(input: CoachInput): Promise<CoachReport> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Coach returned no text");
  }
  const text = textBlock.text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Coach returned invalid JSON");
  const parsed = JSON.parse(match[0]) as Omit<CoachReport, "generated_at">;

  return {
    blockers: normalize(parsed.blockers),
    next_actions: normalize(parsed.next_actions),
    risk_flags: normalize(parsed.risk_flags),
    generated_at: new Date().toISOString(),
  };
}

function normalize(items: unknown): CoachItem[] {
  if (!Array.isArray(items)) return [];
  const out: CoachItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!title) continue;
    const detail = typeof o.detail === "string" ? o.detail.trim() : "";
    const severity: CoachSeverity =
      o.severity === "high" || o.severity === "medium" || o.severity === "low"
        ? o.severity
        : "medium";
    const action = typeof o.action === "string" && o.action.trim() ? o.action.trim() : undefined;
    out.push({ title, detail, severity, action });
    if (out.length >= 8) break;
  }
  return out;
}
