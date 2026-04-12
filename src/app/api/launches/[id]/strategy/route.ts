import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildEnhancedStrategyPrompt, getSystemPrompt } from "@/lib/ai/launch-strategist";
import { generateLaunchTasks } from "@/lib/launches/task-generator";
import type { LaunchIntake, EnhancedGTMStrategy } from "@/lib/launches/types";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    const { data: launch, error: fetchError } = await supabase
      .from("launches")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !launch) {
      return new Response(JSON.stringify({ error: "Launch not found" }), { status: 404 });
    }

    const intake: LaunchIntake = {
      app_name: launch.app_name,
      app_description: launch.app_description,
      niche: launch.niche,
      problem: launch.problem,
      monetization: launch.monetization,
      price: launch.price || "",
      differentiator: launch.differentiator,
      app_url: launch.app_url || "",
      launch_timeline: launch.launch_timeline,
      product_url: launch.product_url || undefined,
      product_status: launch.product_status || undefined,
      pricing_model: launch.pricing_model || undefined,
      budget: launch.budget || undefined,
      hours_per_week: launch.hours_per_week || undefined,
      has_audience: launch.has_audience || false,
      audience_details: launch.audience_details || undefined,
      launch_target_date: launch.launch_target_date || undefined,
    };

    const systemPrompt = getSystemPrompt();
    const userPrompt = buildEnhancedStrategyPrompt(intake);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    let fullText = "";
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullText += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }

          let strategy: EnhancedGTMStrategy | null = null;
          try {
            const match = fullText.match(/\{[\s\S]*\}/);
            if (match) {
              strategy = JSON.parse(match[0]) as EnhancedGTMStrategy;
              await supabase
                .from("launches")
                .update({
                  strategy,
                  status: launch.status === "draft" ? "planning" : launch.status,
                })
                .eq("id", id);
            }
          } catch {
            // Strategy parsing failed
          }

          if (strategy && launch.launch_target_date) {
            try {
              const result = await generateLaunchTasks(id, strategy, launch.launch_target_date, launch.niche, launch);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ tasks_generated: result.count })}\n\n`)
              );
            } catch {
              // Task generation failed silently
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError) {
          const msg = streamError instanceof Error ? streamError.message : "Stream error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
