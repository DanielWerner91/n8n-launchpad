import type { LaunchIntake } from "@/lib/launches/types";

const ENHANCED_SYSTEM_PROMPT = `You are an elite growth marketer and launch strategist with 15 years of experience launching 200+ indie SaaS products. You've personally coached founders to #1 Product Hunt launches, viral Reddit campaigns, and $10K+ launch weeks. You understand the exact mechanics of what makes launches succeed or fail because you've seen it hundreds of times.

You write in a direct, human, builder voice. Never corporate, never hype. You know that the best early-stage launches happen through authentic community participation, not advertising. You understand Reddit culture deeply: promotional posts get downvoted while genuine insight posts drive signups. You write content that sounds like a real person who built something useful and wants honest feedback, because that is what converts.

IMPORTANT CONSTRAINTS:
- Never use "game-changing", "revolutionary", "disruptive", "I'm excited to announce", or any corporate launch cliches.
- Never use em dashes or en dashes. Use periods, colons, or restructure sentences instead.
- Be extremely specific to the niche. Generic advice is useless and the founder will know it immediately.
- All suggestions must be actionable and concrete. Name specific subreddits, specific directories, specific time slots.
- Include real-world numbers: target karma levels, expected engagement rates, time estimates in minutes.
- When recommending communities, include specific subreddit names (with r/ prefix), not generic categories.`;

function appContext(intake: LaunchIntake): string {
  let ctx = `APP DETAILS:
- Name: ${intake.app_name}
- Description: ${intake.app_description}
- Target niche: ${intake.niche}
- Problem it solves: ${intake.problem}
- Monetization: ${intake.monetization}
- Price: ${intake.price || "Not set yet"}
- Key differentiator: ${intake.differentiator}
- App URL: ${intake.app_url || "Not live yet"}
- Launch timeline: ${intake.launch_timeline}`;

  if (intake.product_url) ctx += `\n- Product URL: ${intake.product_url}`;
  if (intake.product_status) ctx += `\n- Product status: ${intake.product_status}`;
  if (intake.pricing_model) ctx += `\n- Pricing model: ${intake.pricing_model}`;
  if (intake.budget) ctx += `\n- Budget: ${intake.budget}`;
  if (intake.hours_per_week) ctx += `\n- Available hours/week: ${intake.hours_per_week}`;
  if (intake.has_audience) ctx += `\n- Has existing audience: Yes`;
  if (intake.audience_details) ctx += `\n- Audience details: ${intake.audience_details}`;
  if (intake.launch_target_date) ctx += `\n- Target launch date: ${intake.launch_target_date}`;

  return ctx;
}

export function buildEnhancedStrategyPrompt(intake: LaunchIntake): string {
  let prompt = `Generate a comprehensive, elite-level go-to-market launch strategy for this product. Your strategy must be the kind that a $500/hr launch consultant would produce. Every recommendation must be specific, actionable, and time-bound.

${appContext(intake)}

Return a JSON object with this EXACT structure (no additional keys, no missing keys):

{
  "market_analysis": {
    "market_size_estimate": "TAM/SAM/SOM estimate for this niche",
    "competitor_landscape": {
      "direct_competitors": [{"name": "...", "url": "...", "strengths": "...", "weakness": "...", "pricing": "..."}],
      "indirect_competitors": [{"name": "...", "overlap": "..."}]
    },
    "differentiation_matrix": "How this product differs from each competitor",
    "market_timing": "Why now is the right time for this product"
  },
  "positioning": {
    "headline": "Under 12 words, punchy, specific",
    "subheadline": "One sentence, outcome-focused",
    "elevator_pitch_30s": "30-second verbal pitch script",
    "elevator_pitch_60s": "60-second verbal pitch script with more detail",
    "value_props": ["Specific benefit 1", "Specific benefit 2", "Specific benefit 3"],
    "differentiator": "Key differentiator statement",
    "anti_positioning": "What this product is NOT",
    "social_proof_strategy": "Specific plan to build credibility fast pre-launch",
    "pricing_recommendation": {
      "model": "freemium/free trial/paid/lifetime deal",
      "suggested_price": "Specific price or price range",
      "rationale": "Why this pricing works for the niche",
      "launch_offer": "Specific launch day offer to create urgency"
    }
  },
  "icp": {
    "primary_user": "Specific description of the ideal user",
    "secondary_users": ["Secondary user persona 1", "Secondary user persona 2"],
    "pain_points": ["Specific pain 1", "Specific pain 2", "Specific pain 3"],
    "pain_language": ["Exact words/phrases these people use to describe their problem"],
    "communities": [{"platform": "reddit", "name": "r/specific_subreddit", "url": "...", "size": "...", "relevance_score": 9, "rules_summary": "...", "best_post_format": "..."}],
    "failed_alternatives": ["What they've tried before"],
    "buying_triggers": ["Events that make them actively search for a solution"]
  },
  "channel_scores": [{"channel": "Channel name", "score": 8, "rationale": "...", "effort_level": "low/medium/high", "expected_impact": "low/medium/high", "timing": "...", "specific_playbook": "..."}],
  "pre_launch_plan": {
    "accounts_to_create": [{"platform": "...", "url": "...", "why": "...", "when": "...", "setup_instructions": "...", "estimated_time": "..."}],
    "community_seeding": [{"platform": "reddit", "community": "r/...", "url": "...", "join_when": "Week -4", "warmup_activities": ["..."], "karma_target": 100, "content_ideas": ["..."]}],
    "beta_testing": {"how_to_recruit": ["..."], "ideal_beta_size": 20, "feedback_collection": "...", "timeline": "..."},
    "landing_page_checklist": ["..."],
    "waitlist_strategy": "...",
    "teaser_content": [{"platform": "linkedin", "content_type": "...", "content": "...", "post_when": "..."}]
  },
  "launch_timeline": {
    "weeks": [{"week_number": -4, "label": "Week -4", "theme": "...", "daily_tasks": [{"day": "Monday", "tasks": [{"task": "...", "platform": "...", "priority": "critical/high/medium/low", "estimated_time": "...", "automated": false, "details": "..."}]}]}],
    "launch_day_playbook": {"hour_by_hour": [{"time": "12:01 AM PST", "action": "...", "platform": "...", "details": "..."}], "contingency_plans": ["..."]}
  },
  "directory_strategy": [{"directory": "Product Hunt", "url": "...", "submission_type": "free", "cost": "$0", "when_to_submit": "...", "submission_requirements": "...", "tailored_description": "...", "expected_impact": "..."}],
  "post_launch_plan": {
    "week1": ["..."], "week2": ["..."], "week3_4": ["..."],
    "metrics_to_track": [{"metric": "...", "target": "...", "how_to_measure": "..."}],
    "iteration_triggers": ["..."]
  },
  "risks": [{"risk": "...", "likelihood": "low/medium/high", "impact": "low/medium/high", "mitigation": "..."}]
}

REQUIREMENTS:
1. At least 3 direct competitors with real URLs
2. At least 5-8 specific communities with real subreddit names
3. At least 8 channel scores
4. Timeline MUST cover weeks -4 through +2
5. Launch day playbook must have at least 8 entries
6. At least 10 directory entries
7. All teaser_content must include actual draft copy
8. Every community must have a specific URL
9. At least 5 accounts_to_create entries
10. At least 5 risk entries

Return ONLY valid JSON, no markdown formatting, no code fences.`;

  return prompt;
}

export function getSystemPrompt(): string {
  return ENHANCED_SYSTEM_PROMPT;
}
