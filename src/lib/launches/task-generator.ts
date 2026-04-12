import { createAdminClient } from "@/lib/supabase/admin";
import type { EnhancedGTMStrategy, TaskCategory, TaskPriority, LifecyclePhase, Launch } from "./types";
import { getRelevantDirectories } from "./directories";

interface TaskInput {
  title: string;
  description?: string;
  platform?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_minutes?: number;
  lifecycle_phase: LifecyclePhase;
  week_number: number;
  day_offset: number;
  automated?: boolean;
  automation_type?: string;
  url?: string;
  /** If true, this is a Claude-executable task with machine instructions in description */
  claude_executable?: boolean;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDayLabel(date: Date): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
}

function calculateDate(launchDate: Date, weekNumber: number, dayOffset: number): Date {
  const weekStart = addDays(launchDate, weekNumber * 7);
  return addDays(weekStart, dayOffset);
}

/**
 * Generate the full lifecycle task set for a launch.
 * Phases 0-2 (validate/build/brand) use weeks -8 to -5.
 * Phases 3-5 (pre_launch/launch/grow) use weeks -4 to +4 (original timeline).
 */
export async function generateLaunchTasks(
  launchId: string,
  strategy: EnhancedGTMStrategy,
  launchTargetDate: string,
  niche: string,
  launch?: Launch,
): Promise<{ count: number; error?: string }> {
  const supabase = createAdminClient();
  const launchDate = new Date(launchTargetDate);
  const isAI = niche.toLowerCase().includes("ai");
  const needsPayments = launch?.needs_payments ?? true;
  const needsAuth = launch?.needs_auth ?? true;
  const needsNewsletter = launch?.needs_newsletter ?? false;
  const appName = launch?.app_name || "the app";
  const githubRepo = launch?.github_repo || `n8n-${appName.toLowerCase().replace(/\s+/g, "-")}`;

  // Delete existing tasks and phases
  await supabase.from("launch_tasks").delete().eq("launch_id", launchId);
  await supabase.from("launch_phases").delete().eq("launch_id", launchId);

  // Create phases spanning weeks -8 to +4
  const phases = [
    { phase: "validate", week_number: -8 },
    { phase: "build", week_number: -7 },
    { phase: "build", week_number: -6 },
    { phase: "brand", week_number: -5 },
    { phase: "pre_launch", week_number: -4 },
    { phase: "pre_launch", week_number: -3 },
    { phase: "pre_launch", week_number: -2 },
    { phase: "pre_launch", week_number: -1 },
    { phase: "launch_week", week_number: 0 },
    { phase: "post_launch", week_number: 1 },
    { phase: "post_launch", week_number: 2 },
    { phase: "post_launch", week_number: 3 },
    { phase: "post_launch", week_number: 4 },
  ];

  const { data: createdPhases, error: phaseError } = await supabase
    .from("launch_phases")
    .insert(phases.map((p) => ({ launch_id: launchId, ...p, status: "pending" })))
    .select();

  if (phaseError) return { count: 0, error: phaseError.message };

  const phaseMap = new Map<number, string>();
  for (const p of createdPhases || []) phaseMap.set(p.week_number, p.id);

  const allTasks: TaskInput[] = [];

  // ============================================================
  // PHASE 0: VALIDATE & PLAN (Week -8)
  // ============================================================
  allTasks.push(
    {
      title: "Run competitive research",
      description: "Search for 5+ direct competitors. Document their pricing, features, strengths, and weaknesses. Check Product Hunt, G2, and Capterra for existing solutions in this niche.",
      category: "validate", priority: "critical", estimated_minutes: 60,
      lifecycle_phase: "validate", week_number: -8, day_offset: 0,
    },
    {
      title: "Check domain availability",
      description: "Search for domains on Namecheap or Cloudflare. Try: appname.com, appname.io, appname.ai, appname.app. Also check if the name is taken on GitHub, Twitter, and Product Hunt.",
      category: "validate", priority: "high", estimated_minutes: 15,
      lifecycle_phase: "validate", week_number: -8, day_offset: 0,
    },
    {
      title: "Define MVP scope",
      description: "Write a one-page spec: core features (3-5 max), what's out of scope, target user persona, and success metrics for launch week. Keep it ruthlessly minimal.",
      category: "validate", priority: "critical", estimated_minutes: 45,
      lifecycle_phase: "validate", week_number: -8, day_offset: 1,
    },
    {
      title: "Finalize app name and domain",
      description: "Purchase the domain. Register the name on GitHub (create empty repo). Confirm the name works for SEO and is easy to spell/say aloud.",
      category: "validate", priority: "high", estimated_minutes: 20,
      lifecycle_phase: "validate", week_number: -8, day_offset: 2,
    },
  );

  // ============================================================
  // PHASE 1: BUILD (Weeks -7 to -6)
  // ============================================================

  // Week -7: Scaffold & infrastructure
  allTasks.push(
    {
      title: "Scaffold Next.js app",
      description: `Run: npx create-next-app@latest ${githubRepo} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm. Stack: Next.js 16, React 19, TypeScript, Tailwind v4.`,
      category: "scaffold", priority: "critical", estimated_minutes: 10,
      lifecycle_phase: "build", week_number: -7, day_offset: 0, claude_executable: true,
    },
    {
      title: "Create GitHub repo and push initial scaffold",
      description: `Create repo DanielWerner91/${githubRepo} via GitHub MCP. Push initial commit. Convention: n8n-<app-name>.`,
      category: "scaffold", priority: "critical", estimated_minutes: 5,
      lifecycle_phase: "build", week_number: -7, day_offset: 0, claude_executable: true,
      url: "https://github.com/new",
    },
    {
      title: "Deploy to Vercel and connect GitHub repo",
      description: "Connect the GitHub repo to Vercel for auto-deploy. Set up the project. Note the Vercel project ID for env vars management later.",
      category: "infrastructure", priority: "critical", estimated_minutes: 10,
      lifecycle_phase: "build", week_number: -7, day_offset: 0,
      url: "https://vercel.com/new",
    },
    {
      title: "Set up Supabase schema (tables, RLS, triggers)",
      description: "Use the shared Supabase instance (dtabpbuqodditvhsbpur). Create app-specific tables. Add RLS policies. Create auto-profile trigger for auth users. Run via Supabase MCP execute_sql.",
      category: "infrastructure", priority: "critical", estimated_minutes: 30,
      lifecycle_phase: "build", week_number: -7, day_offset: 1, claude_executable: true,
    },
    {
      title: "Set up Google OAuth (Supabase Auth)",
      description: "Configure Google OAuth provider in Supabase dashboard. Add OAuth callback URL. Create middleware.ts for session refresh and route protection. Create /login page with Google sign-in button and /auth/callback route.",
      category: "infrastructure", priority: "critical", estimated_minutes: 30,
      lifecycle_phase: "build", week_number: -7, day_offset: 1, claude_executable: true,
    },
    {
      title: "Set up environment variables on Vercel",
      description: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and ANTHROPIC_API_KEY via Vercel API or dashboard.",
      category: "infrastructure", priority: "critical", estimated_minutes: 10,
      lifecycle_phase: "build", week_number: -7, day_offset: 2, claude_executable: true,
    },
    {
      title: "Set up PostHog analytics",
      description: "Install posthog-js and posthog-node. Create PostHogProvider component. Add app_name property to all events for portfolio-analytics tracking. Wrap app in provider.",
      category: "analytics", priority: "high", estimated_minutes: 20,
      lifecycle_phase: "build", week_number: -7, day_offset: 2, claude_executable: true,
    },
  );

  // Conditional: payments
  if (needsPayments) {
    allTasks.push(
      {
        title: "Set up Lemon Squeezy store, product, and variant",
        description: "Create product and variant in Lemon Squeezy dashboard. Note store_id and variant_id. Set up checkout URL generation. Configure webhook URL pointing to /api/webhooks/lemonsqueezy.",
        category: "infrastructure", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "build", week_number: -7, day_offset: 3,
        url: "https://app.lemonsqueezy.com",
      },
      {
        title: "Build webhook handler with HMAC verification",
        description: "Create /api/webhooks/lemonsqueezy route. Verify HMAC signature. Handle subscription_created, subscription_updated, subscription_cancelled events. Update user profile subscription_status. Add idempotency check.",
        category: "infrastructure", priority: "high", estimated_minutes: 45,
        lifecycle_phase: "build", week_number: -7, day_offset: 3, claude_executable: true,
      },
      {
        title: "Build subscription gating (useSubscription hook + ProGate component)",
        description: "Create useSubscription hook that reads profile.subscription_status. Create <ProGate> wrapper component that shows upgrade CTA for free users. Gate premium features.",
        category: "infrastructure", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "build", week_number: -7, day_offset: 4, claude_executable: true,
      },
    );
  }

  // Week -6: Build core features + polish
  allTasks.push(
    {
      title: "Build core app features (MVP)",
      description: "Implement the 3-5 core features defined in the MVP scope. Focus on the golden path. Ship working functionality before polish.",
      category: "scaffold", priority: "critical", estimated_minutes: 480,
      lifecycle_phase: "build", week_number: -6, day_offset: 0,
    },
    {
      title: "Set up legal pages (Termly privacy policy + terms)",
      description: "Create Termly account if needed. Generate privacy policy and terms of service. Create /privacy and /terms pages that embed the Termly scripts. Add footer links.",
      category: "admin", priority: "high", estimated_minutes: 30,
      lifecycle_phase: "build", week_number: -6, day_offset: 3,
      url: "https://app.termly.io",
    },
    {
      title: "Set up custom domain on Vercel",
      description: "Add the purchased domain to Vercel project. Configure DNS records (A record or CNAME). Verify SSL. Add www redirect.",
      category: "infrastructure", priority: "high", estimated_minutes: 15,
      lifecycle_phase: "build", week_number: -6, day_offset: 3,
    },
    {
      title: "Run security audit",
      description: "Run /security-audit skill. Check for: exposed secrets in code, API key leaks, SQL injection, XSS, CSRF, insecure headers, open redirects. Fix all critical and high findings.",
      category: "security", priority: "critical", estimated_minutes: 60,
      lifecycle_phase: "build", week_number: -6, day_offset: 4, claude_executable: true,
    },
    {
      title: "Register project in LaunchPad pipeline",
      description: "Create a new project in LaunchPad via its API. Set stage to 'building'. This tracks the app through its full lifecycle in the portfolio kanban.",
      category: "admin", priority: "medium", estimated_minutes: 5,
      lifecycle_phase: "build", week_number: -6, day_offset: 4, claude_executable: true,
    },
    {
      title: "Register app in Portfolio Analytics",
      description: "Add the app to KNOWN_APPS in portfolio-analytics/src/lib/posthog.ts and APP_META with title, URL, and description. This enables the daily analytics dashboard to track the new app.",
      category: "analytics", priority: "high", estimated_minutes: 10,
      lifecycle_phase: "build", week_number: -6, day_offset: 4, claude_executable: true,
    },
  );

  // ============================================================
  // PHASE 2: BRAND & CONTENT (Week -5)
  // ============================================================
  allTasks.push(
    {
      title: "Create brand in Content Flywheel",
      description: "Use Content Flywheel's brand onboarding wizard at /brands/new. Fill in: brand name, website URL, tagline, content pillars, target audience. This creates the brand_voice and design_system entries.",
      category: "brand_setup", priority: "critical", estimated_minutes: 30,
      lifecycle_phase: "brand", week_number: -5, day_offset: 0,
      url: "https://content-flywheel.com/brands/new",
    },
    {
      title: "Upload logo and run auto-detect design system",
      description: "Upload the app logo to Content Flywheel via /brands/[slug]/design. Click 'Detect from Logo' to auto-generate the full design system (colors, typography, visual identity, infographic styles) from the logo using Claude Vision.",
      category: "brand_setup", priority: "high", estimated_minutes: 15,
      lifecycle_phase: "brand", week_number: -5, day_offset: 0,
    },
    {
      title: "Configure brand voice",
      description: "Edit the brand voice at /brands/[slug]/voice. Set personality archetype, tone spectrum (formality/seriousness/authority), writing rules (dos/donts), vocabulary (preferred terms, banned words), and example posts. This drives ALL AI-generated content.",
      category: "brand_setup", priority: "high", estimated_minutes: 30,
      lifecycle_phase: "brand", week_number: -5, day_offset: 1,
    },
    {
      title: "Connect LinkedIn publishing via Make.com",
      description: "Set up a Make.com scenario that receives a webhook and publishes to LinkedIn. Note the webhook URL and organization URN. Configure in Content Flywheel's platform accounts.",
      category: "brand_setup", priority: "medium", estimated_minutes: 30,
      lifecycle_phase: "brand", week_number: -5, day_offset: 2,
    },
  );

  if (needsNewsletter) {
    allTasks.push(
      {
        title: "Set up Beehiiv newsletter publication",
        description: "Create a new publication on Beehiiv (free tier: 2,500 subs). Configure the brand's newsletter_config in Content Flywheel: frequency, send_day, min_articles, newsletter_api_url. Enable the cron/newsletter job.",
        category: "newsletter", priority: "medium", estimated_minutes: 30,
        lifecycle_phase: "brand", week_number: -5, day_offset: 3,
        url: "https://app.beehiiv.com",
      },
    );
  }

  allTasks.push(
    {
      title: "Generate initial content batch in Content Flywheel",
      description: "Use Content Flywheel to generate 5-10 pieces of teaser/build-in-public content for the pre-launch phase. Queue them for review and scheduling.",
      category: "content", priority: "high", estimated_minutes: 30,
      lifecycle_phase: "brand", week_number: -5, day_offset: 3,
    },
    {
      title: "Set up content calendar for launch period",
      description: "In Content Flywheel's calendar, schedule: 1 teaser post/week for weeks -4 to -1, launch day announcement, and 3 follow-up posts for week +1. Align with LinkedIn best practices (Tue-Thu 9-11AM, no hashtags).",
      category: "content", priority: "medium", estimated_minutes: 20,
      lifecycle_phase: "brand", week_number: -5, day_offset: 4,
    },
  );

  // ============================================================
  // PHASE 3: PRE-LAUNCH (Weeks -4 to -1) — original marketing timeline
  // ============================================================

  // Week -4: Account Setup
  allTasks.push(
    { title: "Create/optimize Product Hunt account", platform: "product_hunt", category: "account_setup", priority: "critical", estimated_minutes: 20, lifecycle_phase: "pre_launch", week_number: -4, day_offset: 0, url: "https://www.producthunt.com/join" },
    { title: "Create/optimize Reddit account", platform: "reddit", category: "account_setup", priority: "critical", estimated_minutes: 15, lifecycle_phase: "pre_launch", week_number: -4, day_offset: 0, url: "https://www.reddit.com/register/" },
    { title: "Create Hacker News account", platform: "hacker_news", category: "account_setup", priority: "high", estimated_minutes: 10, lifecycle_phase: "pre_launch", week_number: -4, day_offset: 0, url: "https://news.ycombinator.com/login" },
    { title: "Create Indie Hackers profile", platform: "indie_hackers", category: "account_setup", priority: "high", estimated_minutes: 15, lifecycle_phase: "pre_launch", week_number: -4, day_offset: 1 },
    { title: "Optimize LinkedIn profile for launch", platform: "linkedin", category: "account_setup", priority: "medium", estimated_minutes: 20, lifecycle_phase: "pre_launch", week_number: -4, day_offset: 1 },
    { title: "Set up email list (Beehiiv/Mailchimp)", platform: "email", category: "account_setup", priority: "high", estimated_minutes: 45, lifecycle_phase: "pre_launch", week_number: -4, day_offset: 2 },
  );

  // Community seeding weeks -3 to -1
  for (const week of [-3, -2, -1]) {
    allTasks.push(
      { title: `Reddit: Post 3-5 helpful comments (Week ${week})`, platform: "reddit", category: "community_seeding", priority: "high", estimated_minutes: 20, lifecycle_phase: "pre_launch", week_number: week, day_offset: 0 },
      { title: `Reddit: Continue participation (Week ${week})`, platform: "reddit", category: "community_seeding", priority: "medium", estimated_minutes: 20, lifecycle_phase: "pre_launch", week_number: week, day_offset: 3 },
    );
    if (week >= -2) {
      allTasks.push({ title: `LinkedIn: Build-in-public teaser (Week ${week})`, platform: "linkedin", category: "community_seeding", priority: "medium", estimated_minutes: 20, lifecycle_phase: "pre_launch", week_number: week, day_offset: 1 });
    }
  }

  // Week -1: Directory submissions
  const directories = getRelevantDirectories(niche, isAI);
  for (let i = 0; i < directories.length; i++) {
    const dir = directories[i];
    allTasks.push({
      title: `Submit to ${dir.name}`,
      description: `Format: ${dir.description_format}. Max: ${dir.max_description_length} chars. Review: ${dir.review_time}.`,
      platform: "general", category: "directory", priority: i < 5 ? "high" : "medium",
      estimated_minutes: 15, lifecycle_phase: "pre_launch", week_number: -1,
      day_offset: Math.min(Math.floor(i / 6), 4), url: dir.submission_url,
    });
  }

  // Week -1: Content preparation
  allTasks.push(
    { title: "Write Product Hunt tagline, description, and first comment", platform: "product_hunt", category: "content", priority: "critical", estimated_minutes: 60, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 0, automated: true },
    { title: "Write Reddit launch post", platform: "reddit", category: "content", priority: "critical", estimated_minutes: 45, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 1, automated: true },
    { title: "Write LinkedIn launch announcement", platform: "linkedin", category: "content", priority: "high", estimated_minutes: 30, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 2, automated: true },
    { title: "Write email launch sequence (4 emails)", platform: "email", category: "content", priority: "high", estimated_minutes: 60, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 3, automated: true },
    { title: "Review and finalize all launch content", platform: "general", category: "content", priority: "critical", estimated_minutes: 60, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 5 },
    { title: "Personal outreach to 50 potential supporters", platform: "general", category: "outreach", priority: "critical", estimated_minutes: 120, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 4 },
    { title: "Landing page final check", platform: "general", category: "admin", priority: "critical", estimated_minutes: 30, lifecycle_phase: "pre_launch", week_number: -1, day_offset: 5 },
  );

  // ============================================================
  // PHASE 4: LAUNCH (Week 0)
  // ============================================================
  if (strategy.launch_timeline?.launch_day_playbook?.hour_by_hour?.length) {
    for (const hourTask of strategy.launch_timeline.launch_day_playbook.hour_by_hour) {
      allTasks.push({
        title: `${hourTask.time}: ${hourTask.action}`,
        description: hourTask.details,
        platform: hourTask.platform || "general",
        category: "launch_day", priority: "critical", estimated_minutes: 15,
        lifecycle_phase: "launch", week_number: 0, day_offset: 0,
      });
    }
  } else {
    allTasks.push(
      { title: "12:01 AM PST: Submit to Product Hunt", platform: "product_hunt", category: "launch_day", priority: "critical", estimated_minutes: 15, lifecycle_phase: "launch", week_number: 0, day_offset: 0 },
      { title: "6:00 AM: Post on Reddit", platform: "reddit", category: "launch_day", priority: "critical", estimated_minutes: 15, lifecycle_phase: "launch", week_number: 0, day_offset: 0 },
      { title: "7:00 AM: Send launch email", platform: "email", category: "launch_day", priority: "critical", estimated_minutes: 10, lifecycle_phase: "launch", week_number: 0, day_offset: 0 },
      { title: "9:00 AM: Post LinkedIn announcement", platform: "linkedin", category: "launch_day", priority: "high", estimated_minutes: 10, lifecycle_phase: "launch", week_number: 0, day_offset: 0 },
      { title: "Every 30 min: Respond to PH comments", platform: "product_hunt", category: "launch_day", priority: "critical", estimated_minutes: 120, lifecycle_phase: "launch", week_number: 0, day_offset: 0 },
      { title: "5:00 PM: Share first metrics publicly", platform: "general", category: "launch_day", priority: "high", estimated_minutes: 15, lifecycle_phase: "launch", week_number: 0, day_offset: 0 },
    );
  }

  allTasks.push(
    { title: "Send recap email with social proof", platform: "email", category: "launch_day", priority: "high", estimated_minutes: 20, lifecycle_phase: "launch", week_number: 0, day_offset: 1 },
    { title: "Day 3: Send 'last chance' email for launch offer", platform: "email", category: "launch_day", priority: "high", estimated_minutes: 15, lifecycle_phase: "launch", week_number: 0, day_offset: 3 },
  );

  // ============================================================
  // PHASE 5: POST-LAUNCH & GROWTH (Weeks +1 to +4)
  // ============================================================
  allTasks.push(
    { title: "Post launch results on Indie Hackers", platform: "indie_hackers", category: "post_launch", priority: "high", estimated_minutes: 60, lifecycle_phase: "grow", week_number: 1, day_offset: 0 },
    { title: "LinkedIn: Share launch results", platform: "linkedin", category: "post_launch", priority: "medium", estimated_minutes: 20, lifecycle_phase: "grow", week_number: 1, day_offset: 1 },
    {
      title: "Review PostHog analytics dashboard",
      description: "Check Portfolio Analytics for the new app. Review: 7-day pageviews, top pages, referrer sources, device breakdown. Identify which launch channels drove the most traffic. Compare against other portfolio apps.",
      category: "analytics", priority: "high", estimated_minutes: 20,
      lifecycle_phase: "grow", week_number: 1, day_offset: 2,
    },
    { title: "Review launch metrics and identify top channel", platform: "general", category: "post_launch", priority: "high", estimated_minutes: 30, lifecycle_phase: "grow", week_number: 1, day_offset: 4 },
    { title: "Week 2: Follow up with outreach contacts", platform: "general", category: "post_launch", priority: "medium", estimated_minutes: 60, lifecycle_phase: "grow", week_number: 2, day_offset: 2 },
    {
      title: "Week 2: Check PostHog for conversion funnel",
      description: "Analyze the signup funnel in PostHog: landing page → signup → first action → payment. Identify drop-off points. Create an insight for ongoing monitoring.",
      category: "analytics", priority: "high", estimated_minutes: 30,
      lifecycle_phase: "grow", week_number: 2, day_offset: 0,
    },
    {
      title: "Week 2: Activate Content Flywheel ongoing content",
      description: "Enable Content Flywheel's automated content generation for this brand. Configure: cron/plan (daily 6AM), cron/generate (daily 7AM), cron/publish (every 30min). This creates a self-sustaining content pipeline.",
      category: "content", priority: "high", estimated_minutes: 20,
      lifecycle_phase: "grow", week_number: 2, day_offset: 1,
    },
    {
      title: "Week 2: Enable Content Flywheel engagement discovery",
      description: "Configure the engagement discovery cron for this brand. This scans LinkedIn for relevant posts in the niche and generates AI comments for community engagement.",
      category: "content", priority: "medium", estimated_minutes: 15,
      lifecycle_phase: "grow", week_number: 2, day_offset: 1,
    },
    { title: "Week 3: Iterate based on user feedback", platform: "general", category: "post_launch", priority: "high", estimated_minutes: 60, lifecycle_phase: "grow", week_number: 3, day_offset: 0 },
    {
      title: "Week 3: Weekly analytics review",
      description: "Check Portfolio Analytics: week-over-week traffic trend, new vs returning visitors, exception count. Compare referrer sources to see which launch channels have lasting impact.",
      category: "analytics", priority: "medium", estimated_minutes: 15,
      lifecycle_phase: "grow", week_number: 3, day_offset: 0,
    },
    { title: "Week 4: Plan next growth phase", platform: "general", category: "post_launch", priority: "medium", estimated_minutes: 60, lifecycle_phase: "grow", week_number: 4, day_offset: 0 },
    {
      title: "Week 4: Set up weekly analytics check-in",
      description: "The new app should now appear in your daily Portfolio Analytics dashboard. Verify the app shows in the overview with correct traffic numbers. Bookmark the app detail page for ongoing monitoring.",
      category: "analytics", priority: "medium", estimated_minutes: 10,
      lifecycle_phase: "grow", week_number: 4, day_offset: 0,
    },
  );

  if (needsNewsletter) {
    allTasks.push(
      {
        title: "Week 2: Launch first newsletter edition",
        description: "Trigger the first newsletter generation via Content Flywheel. Review the generated edition. If using Beehiiv free tier, copy the HTML and paste into Beehiiv editor. Send to subscribers.",
        category: "newsletter", priority: "medium", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 2, day_offset: 3,
      },
    );
  }

  // Convert to database rows
  const rows = allTasks.map((task) => {
    const date = calculateDate(launchDate, task.week_number, task.day_offset);
    return {
      launch_id: launchId,
      phase_id: phaseMap.get(task.week_number) || null,
      title: task.title,
      description: task.description || null,
      platform: task.platform || null,
      category: task.category,
      priority: task.priority,
      estimated_minutes: task.estimated_minutes || null,
      scheduled_date: formatDate(date),
      week_number: task.week_number,
      day_label: getDayLabel(date),
      status: "pending" as const,
      automated: task.automated || false,
      automation_type: task.automation_type || null,
      url: task.url || null,
    };
  });

  const { error: insertError } = await supabase.from("launch_tasks").insert(rows);
  if (insertError) return { count: 0, error: insertError.message };

  await supabase
    .from("launches")
    .update({ current_phase: "validate", lifecycle_phase: "validate", status: "planning" })
    .eq("id", launchId);

  return { count: rows.length };
}
