import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runTool, toolSchemas } from "@/lib/ai/chat-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are LaunchPad's project copilot. You help a solo founder manage projects, launches, checklists, and features inside LaunchPad.

Core behaviors:
- Use tools to look up data before answering. Never guess project slugs or feature ids. If the user refers to a project by name, call list_projects first and pick the closest slug match.
- When the user asks to add / update / archive / move / complete something, take the action with tools. Don't just describe what you'd do.
- Be concise. Founders are busy. Short, scannable responses. No preamble, no "I'll go ahead and...", no corporate fluff.
- Never use em dashes or en dashes. Use periods, colons, or restructure sentences.
- When you perform a write action, confirm in one short sentence what you changed.
- If the user asks something you can't determine from the tools, say so directly instead of speculating.
- Dates: today is ${new Date().toISOString().slice(0, 10)}.

Common patterns:
- "What's on the backlog for X?" → list_projects (find slug), then list_features with status=backlog.
- "Add a feature to Y: ..." → list_projects (find slug), create_feature.
- "Mark Z done" → if it's a feature, find its id via list_features, then update_feature.
- "How's project X doing?" → get_project, then a 2 sentence status + the top 2-3 things to do next.`;

type ChatMessage = Anthropic.MessageParam;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { messages?: ChatMessage[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
  const tools = toolSchemas();

  const messages: ChatMessage[] = [...incoming];
  const trace: { tool: string; input: unknown; result: unknown; ok: boolean }[] = [];

  const MAX_TURNS = 8;
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.create({
        model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Model request failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
      const text = textBlocks.map((b) => b.text).join("\n").trim();
      return NextResponse.json({ text, trace, messages });
    }

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const { ok, result } = await runTool(supabase, tu.name, (tu.input ?? {}) as Record<string, unknown>);
      trace.push({ tool: tu.name, input: tu.input, result, ok });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(result),
        is_error: !ok,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return NextResponse.json(
    { error: "Max tool-use turns exceeded", trace, messages },
    { status: 500 },
  );
}
