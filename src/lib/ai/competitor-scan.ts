import Anthropic from "@anthropic-ai/sdk";

export type ScannedFeature = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  source_competitor?: string;
};

export type CompetitorScanInput = {
  projectName: string;
  description: string;
  links?: Record<string, string | null> | null;
  existingFeatures: string[];
};

const SYSTEM_PROMPT = `You are a product strategist embedded inside a founder's project dashboard. Your job: scan the web for real competitors of a given product and extract the 15-25 most valuable features the founder should consider building.

Rules:
- Use web search to find actual competing products. Prioritize well-known, live tools over vaporware.
- Each feature must be something a real competitor ships today. Name the competitor in source_competitor.
- Skip features the project already has (a list is provided).
- Return a mix of table-stakes (competitors all have it) and differentiators (only 1-2 have it, but highly valuable).
- Titles: under 10 words, concrete. Descriptions: 1-2 sentences, specific about what the feature does and why it matters.
- Priority: high = table-stakes gap or proven high-ROI differentiator. medium = nice-to-have table stakes. low = niche differentiator.
- Never use em dashes or en dashes. Use periods, colons, or restructure.
- Output STRICT JSON matching the schema. Do not wrap in markdown.

Schema:
{
  "features": [
    { "title": string, "description": string, "priority": "low" | "medium" | "high", "source_competitor": string }
  ]
}`;

function buildUserPrompt(input: CompetitorScanInput): string {
  const links = input.links
    ? Object.entries(input.links)
        .filter(([, v]) => !!v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "(none)";
  const existing = input.existingFeatures.length
    ? input.existingFeatures.slice(0, 40).map((t) => `- ${t}`).join("\n")
    : "(none)";

  return `PROJECT: ${input.projectName}

DESCRIPTION:
${input.description || "(no description)"}

LINKS: ${links}

EXISTING FEATURES (do not duplicate):
${existing}

Task:
1. Use web search to identify 5-10 real direct competitors of this product.
2. For each competitor, skim their homepage/features/pricing page.
3. Extract 15-25 distinct features worth considering. Tag each with source_competitor (the competitor you saw it on).
4. Skip anything already in the existing-features list.
5. Return the JSON. No commentary.`;
}

export async function runCompetitorScan(input: CompetitorScanInput): Promise<ScannedFeature[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 8,
      } as unknown as Anthropic.Tool,
    ],
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
  const joined = textBlocks.map((b) => b.text).join("\n").trim();
  const match = joined.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Competitor scan returned no JSON");
  const parsed = JSON.parse(match[0]) as { features?: unknown };
  if (!Array.isArray(parsed.features)) return [];

  return parsed.features
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => {
      const title = typeof f.title === "string" ? f.title.trim() : "";
      const description = typeof f.description === "string" ? f.description.trim() : "";
      const rawPriority = typeof f.priority === "string" ? f.priority.toLowerCase() : "medium";
      const priority: ScannedFeature["priority"] =
        rawPriority === "high" || rawPriority === "low" ? rawPriority : "medium";
      const source_competitor =
        typeof f.source_competitor === "string" ? f.source_competitor.trim() : undefined;
      return { title, description, priority, source_competitor };
    })
    .filter((f) => f.title && f.description);
}
