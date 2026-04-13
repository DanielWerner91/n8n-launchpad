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
  const needsMobile = launch?.needs_mobile ?? false;
  const appName = launch?.app_name || "the app";
  const appSlug = appName.toLowerCase().replace(/\s+/g, "-");
  const githubRepo = launch?.github_repo || `n8n-${appSlug}`;

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
    {
      title: "Build user account menu (avatar dropdown + sign out)",
      description: "Add a <UserMenu /> component in the header (top-right). Show user avatar/initials from Google profile, name, and email. Include Sign Out button (Supabase signOut). If app has payments, link to billing/subscription info. Add 'Delete account' option for GDPR compliance. This is required for every authenticated app.",
      category: "infrastructure", priority: "high", estimated_minutes: 30,
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

  // Conditional: mobile app
  if (needsMobile) {
    allTasks.push(
      {
        title: "Set up Apple Developer account ($99/yr)",
        description: "Enroll at developer.apple.com. Complete identity verification (can take 24-48hrs). Note your Team ID.",
        category: "infrastructure", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "build", week_number: -7, day_offset: 3,
        url: "https://developer.apple.com/programs/enroll/",
      },
      {
        title: "Set up Google Play Developer account ($25)",
        description: "Register at play.google.com/console. Complete identity verification. Accept Developer Distribution Agreement.",
        category: "infrastructure", priority: "high", estimated_minutes: 20,
        lifecycle_phase: "build", week_number: -7, day_offset: 3,
        url: "https://play.google.com/console/signup",
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

  // Conditional: mobile app build
  if (needsMobile) {
    allTasks.push(
      {
        title: "Scaffold Expo mobile app",
        description: `Run /mobile-app skill Phase 2. Creates ~/n8n-apps/${appSlug}-mobile/ with Expo Router, NativeWind v4, Supabase Auth (SecureStore), React Query. Bundle ID: com.danielwerner.${appSlug.replace(/-/g, "")}. GitHub repo: DanielWerner91/${appSlug}-mobile.`,
        category: "scaffold", priority: "critical", estimated_minutes: 60,
        lifecycle_phase: "brand", week_number: -5, day_offset: 0, claude_executable: true,
      },
      {
        title: "Build mobile auth flow (Google + Apple Sign-In)",
        description: "Run /mobile-app skill Phase 3. Set up Supabase Auth with expo-secure-store, Google OAuth via expo-auth-session, Apple Sign-In via expo-apple-authentication. Add iOS + Android OAuth client IDs in Google Cloud Console.",
        category: "infrastructure", priority: "critical", estimated_minutes: 90,
        lifecycle_phase: "brand", week_number: -5, day_offset: 1, claude_executable: true,
      },
      {
        title: "Convert web screens to mobile (all tabs)",
        description: "Run /mobile-app skill Phase 4. Convert each web page to mobile screens using NativeWind. Map (app)/layout.tsx tabs to Expo Router Tabs. Replace HTML elements with RN primitives, framer-motion with reanimated, shadcn/ui with RN equivalents.",
        category: "scaffold", priority: "critical", estimated_minutes: 240,
        lifecycle_phase: "brand", week_number: -5, day_offset: 2, claude_executable: true,
      },
      {
        title: "Set up mobile API layer + shared types",
        description: "Run /mobile-app skill Phase 5. Copy TypeScript types from web app. Set up Supabase queries and React Query hooks. Configure API client for Vercel-hosted routes.",
        category: "scaffold", priority: "high", estimated_minutes: 60,
        lifecycle_phase: "brand", week_number: -5, day_offset: 3, claude_executable: true,
      },
    );

    if (needsPayments) {
      allTasks.push({
        title: "Set up RevenueCat in-app purchases",
        description: "Run /mobile-app skill Phase 6. Install react-native-purchases. Create RevenueCat account, configure iOS + Android products matching Lemon Squeezy tiers. Build paywall screen, useSubscription hook, and RevenueCat webhook handler on web app.",
        category: "infrastructure", priority: "high", estimated_minutes: 120,
        lifecycle_phase: "brand", week_number: -5, day_offset: 4,
      });
    }

    // --- Week -4: Push notifications, app icon, deep linking ---
    allTasks.push(
      {
        title: "Set up push notifications",
        description: "Run /mobile-app skill Phase 7. Install expo-notifications. Add expo_push_token column to Supabase profiles. Configure APNs key (iOS) and FCM key (Android) via eas credentials.",
        category: "infrastructure", priority: "medium", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -4, day_offset: 3, claude_executable: true,
      },
      {
        title: "Create app icon (1024x1024)",
        description: "Generate from web app's logo. Must be PNG, no transparency, no rounded corners (stores apply their own). Test at small sizes (29px, 60px, 120px) to ensure legibility. Match web app branding exactly.",
        category: "brand_setup", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -4, day_offset: 4,
      },
      {
        title: "Create adaptive icon (Android) + splash screen",
        description: "Adaptive icon: 1024x1024 foreground layer, keep content in center 66% safe zone. Splash screen: app logo centered on brand background color. Place all in assets/images/.",
        category: "brand_setup", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -4, day_offset: 4,
      },
      {
        title: "Configure deep linking and universal links",
        description: "Set up scheme in app.config.ts for deep links (<appname>://). Configure ios.associatedDomains for universal links (applinks:<domain>). Add android.intentFilters for app links. Test with: npx uri-scheme open <appname>://dashboard.",
        category: "infrastructure", priority: "medium", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -4, day_offset: 5, claude_executable: true,
      },
    );

    // --- Week -3: First build, thorough device testing ---
    allTasks.push(
      {
        title: "Configure EAS Build + first preview build",
        description: "Run /mobile-app skill Phase 8. Create eas.json with dev/preview/production profiles. Add EAS secrets (Supabase keys, OAuth client IDs, RevenueCat keys). Run: eas build --platform all --profile preview.",
        category: "infrastructure", priority: "critical", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 0, claude_executable: true,
      },
      {
        title: "Test: Auth flow on physical devices",
        description: "Install preview build. Test Google Sign-In on both iOS and Android. Test Apple Sign-In on iOS. Verify session persists after app close/reopen. Test sign out and re-sign-in. Test expired token refresh.",
        category: "security", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 1,
      },
      {
        title: "Test: All screens, navigation, and data loading",
        description: "Walk through every tab and screen. Verify data loads correctly from Supabase. Test pull-to-refresh on all lists. Check empty states. Verify pro-gated content shows paywall for free users.",
        category: "security", priority: "critical", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 1,
      },
      {
        title: "Test: Forms, keyboard, and input handling",
        description: "Test every input field. Verify KeyboardAvoidingView works on both platforms. Check text is not covered by keyboard. Test form validation and error states. Test paste, autocomplete.",
        category: "security", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 2,
      },
      {
        title: "Test: Edge cases and error states",
        description: "Test with airplane mode (offline graceful?). Test with slow connection. Test session expiry mid-use. Test background/foreground cycling. Test push notification tap navigation. Check no crashes in any flow.",
        category: "security", priority: "high", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 2,
      },
      {
        title: "Test: Visual polish on multiple devices",
        description: "Check on iPhone SE (small screen), iPhone 15 Pro Max (large), iPad (if supported), and at least one Android device. Verify safe areas, notch handling, home indicator, status bar. Check dark mode if supported.",
        category: "security", priority: "high", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 3,
      },
      {
        title: "Fix all issues found during testing",
        description: "Address every bug, visual glitch, and UX issue discovered during device testing. Rebuild preview and re-verify fixes.",
        category: "scaffold", priority: "critical", estimated_minutes: 120,
        lifecycle_phase: "pre_launch", week_number: -3, day_offset: 4, claude_executable: true,
      },
    );

    // --- Week -2: Screenshots, video, ASO copy, store listing ---
    allTasks.push(
      {
        title: "Research competitor App Store keywords",
        description: "Search App Store/Play Store for 5+ competitor apps. Note their titles, subtitles, keywords. Use AppTweak or Sensor Tower free tier to check keyword difficulty and volume. Build a keyword list of 20+ target terms.",
        category: "validate", priority: "high", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 0,
      },
      {
        title: "Create App Store screenshots (iPhone 6.7\" + 6.5\")",
        description: "Required sizes: 1290x2796 (6.7\" - iPhone 14 Pro Max / 15 Pro Max) and 1284x2778 (6.5\" - iPhone 11 Pro Max). Take 6-8 screenshots. Rules: (1) First 2 screenshots are what users see before tapping 'more' - they must show the core value prop. (2) Add short captions/headlines on each. (3) Show the app with real data, never empty states. (4) Use device frames (Rotato, screenshots.pro, or Fastlane Frameit). (5) Include diverse screens: dashboard, key features, settings.",
        category: "content", priority: "critical", estimated_minutes: 120,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 0,
      },
      {
        title: "Create iPad screenshots (if app supports tablet)",
        description: "iPad Pro 12.9\" (2048x2732). Required if supportsTablet is true. Same screenshot strategy as iPhone. Show how the app takes advantage of larger screen.",
        category: "content", priority: "high", estimated_minutes: 60,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 1,
      },
      {
        title: "Create Google Play screenshots + feature graphic",
        description: "Phone screenshots: min 2, max 8 (min 320px, max 3840px any dimension). Match iPhone screenshots. Feature graphic: 1024x500 PNG/JPEG with app name, tagline, and a clear visual of the app. 7\" tablet screenshots recommended for broader reach.",
        category: "content", priority: "critical", estimated_minutes: 60,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 1,
      },
      {
        title: "Create App Store preview video (15-30s)",
        description: "High conversion impact: listings with video get 20%+ more downloads. Record 15-30s showing the app in action. Show the 'aha moment' in first 5 seconds. iOS sizes: 886x1920 (6.5\") or 1290x2796 (6.7\"). Android: 30 seconds max. Use screen recording + caption overlays. No licensed music (use royalty-free or no music). Captions should highlight benefits, not features.",
        category: "content", priority: "high", estimated_minutes: 120,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 2,
      },
      {
        title: "Write App Store listing copy (ASO-optimized)",
        description: "Title (30 chars max): include primary keyword, e.g. 'ChessMind - AI Chess Coach'. Subtitle (30 chars max): secondary keyword, e.g. 'Personalized Training Plans'. Keywords (100 chars): comma-separated, NO spaces after commas, use all 100 chars, avoid duplicating words in title/subtitle, include misspellings and synonyms. Description (4000 chars): first 3 lines visible without 'more' - lead with strongest value prop. Include social proof if available. Promotional text (170 chars): update anytime without review, use for launches/sales.",
        category: "content", priority: "critical", estimated_minutes: 60,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 3,
      },
      {
        title: "Write Google Play listing copy (ASO-optimized)",
        description: "Title (30 chars): primary keyword. Short description (80 chars): this is the highest ASO-weight field on Play Store, must be compelling and keyword-rich. Full description (4000 chars): include keywords naturally (Google indexes the full text unlike Apple). Use bullet points for readability.",
        category: "content", priority: "critical", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 3,
      },
      {
        title: "Localize App Store listing (at minimum EN-US + EN-GB)",
        description: "Localize title, subtitle, keywords, description, and screenshots for target markets. EN-US and EN-GB are minimum. Consider adding: DE, FR, ES, JA if the app has international appeal. Different keywords per locale.",
        category: "content", priority: "medium", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 4,
      },
      {
        title: "Choose App Store category and secondary category",
        description: "Pick primary category (determines which charts you appear on) and secondary category. Research which categories competitors use. Less competitive categories = easier to rank. Both stores let you pick primary + secondary.",
        category: "admin", priority: "high", estimated_minutes: 15,
        lifecycle_phase: "pre_launch", week_number: -2, day_offset: 4,
      },
    );

    // --- Week -1: Compliance, final build, submission ---
    allTasks.push(
      {
        title: "Complete iOS privacy nutrition labels",
        description: "In App Store Connect > App Privacy. Declare all data types: (1) Contact Info (name, email from Google/Apple OAuth), (2) Identifiers (user ID), (3) Usage Data (product interaction from PostHog), (4) Diagnostics (crash data). Mark data as 'Linked to User' where applicable. Mark 'Used for Analytics'. Link to privacy policy URL.",
        category: "admin", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 0,
      },
      {
        title: "Complete Google Play data safety section",
        description: "In Play Console > App content > Data safety. Declare: data collected (account info, app activity), data shared (none if not sharing with third parties), security practices (data encrypted in transit, data can be deleted). Link to privacy policy.",
        category: "admin", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 0,
      },
      {
        title: "Complete Google Play content rating questionnaire",
        description: "In Play Console > App content > Content rating. Answer IARC questionnaire honestly. Most SaaS apps qualify for 'Everyone' or 'Parental Guidance'. This is required before publishing.",
        category: "admin", priority: "high", estimated_minutes: 15,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 0,
      },
      {
        title: "Set up App Store review information",
        description: "In App Store Connect > App Review Information. Provide: (1) Demo account credentials (create a test user with pro subscription). (2) Notes explaining app purpose and how to test. (3) Contact info (phone + email). Without demo account, Apple WILL reject.",
        category: "admin", priority: "critical", estimated_minutes: 20,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 1,
      },
      {
        title: "Verify App Store compliance checklist",
        description: "Check: (1) Sign in with Apple exists (required if any social login). (2) In-app purchases used for digital goods (not web checkout links in iOS). (3) No placeholder/coming-soon content. (4) Privacy policy URL loads. (5) Support URL works. (6) Export compliance answered (NO if just using HTTPS). (7) Age rating set. (8) App does not mention Android on iOS or vice versa.",
        category: "admin", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 1,
      },
      {
        title: "Build production iOS + Android binaries",
        description: "Run: eas build --platform all --profile production. Wait for builds to complete (10-30 min each). Download and do a final sanity check on both binaries before submission.",
        category: "infrastructure", priority: "critical", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 2,
      },
      {
        title: "Submit iOS app to App Store Connect",
        description: "Run: eas submit --platform ios. Then in App Store Connect: select the build, verify all metadata (screenshots, description, keywords, privacy labels, review info), submit for review. Review takes 24-48 hours typically. Set release to 'Manual' if you want to coordinate with web launch.",
        category: "infrastructure", priority: "critical", estimated_minutes: 20,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 2,
      },
      {
        title: "Submit Android app to Google Play Console",
        description: "Run: eas submit --platform android. Then in Play Console: create a release in the Production track (or Internal testing first), upload the AAB, add release notes, set rollout percentage (100% or staged). Review takes 1-7 days. Set managed publishing if coordinating with web launch.",
        category: "infrastructure", priority: "critical", estimated_minutes: 20,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 2,
      },
      {
        title: "Prepare App Store launch day announcement content",
        description: "Draft LinkedIn carousel: 'We're now on the App Store!' with screenshots. Draft email to subscribers. Draft Reddit/IH post about mobile launch. Align with web launch content calendar. Include download links (App Store + Play Store).",
        category: "content", priority: "high", estimated_minutes: 45,
        lifecycle_phase: "pre_launch", week_number: -1, day_offset: 3,
      },
    );
  }

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

  if (needsMobile) {
    allTasks.push(
      {
        title: "Week 1: Monitor App Store review status + handle rejection",
        description: "Check App Store Connect and Google Play Console for review status. Apple: 24-48 hours, Google: 1-7 days. If rejected: read the rejection reason carefully, fix the exact issue cited, add a note to reviewers explaining the fix, resubmit. Common rejection reasons: missing demo account, Sign in with Apple missing, web checkout links in iOS, placeholder content.",
        category: "admin", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 1, day_offset: 0,
      },
      {
        title: "Week 1: Release app once approved + announce",
        description: "Once approved, release the app (if set to manual release). Post the prepared launch announcement on LinkedIn, email list, Reddit/IH. Share App Store and Play Store links everywhere. Add download badges to the web app's landing page and footer.",
        category: "launch_day", priority: "critical", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 1, day_offset: 1,
      },
      {
        title: "Week 1: Add 'Download the App' CTAs to web app",
        description: "Add App Store and Google Play download badges to: (1) web app landing page hero section, (2) web app footer, (3) post-signup email, (4) web app settings/about page. Use official badge assets from Apple and Google.",
        category: "content", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 1, day_offset: 2, claude_executable: true,
      },
      {
        title: "Week 1: Respond to all app store reviews",
        description: "Monitor and respond to every review within 24 hours. Thanking positive reviewers and addressing negative ones boosts App Store ranking (engagement signal). For negative reviews: acknowledge the issue, explain if fixed, invite them to try the update.",
        category: "post_launch", priority: "high", estimated_minutes: 20,
        lifecycle_phase: "grow", week_number: 1, day_offset: 3,
      },
      {
        title: "Week 1: Request ratings from early users",
        description: "Add in-app rating prompt using expo StoreReview API. Trigger after a positive moment (e.g., completing a key action, 3rd session). Don't prompt on first use. iOS: SKStoreReviewController (max 3 prompts/year). Android: In-App Review API.",
        category: "post_launch", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 1, day_offset: 4, claude_executable: true,
      },
      {
        title: "Week 2: Review App Store Connect analytics",
        description: "Check: impressions (how many people see the listing), product page views, conversion rate (views to downloads), download sources (search vs browse vs referral). Benchmark: healthy conversion rate is 25-40%. If below 20%, screenshots and first impression need work.",
        category: "analytics", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 2, day_offset: 0,
      },
      {
        title: "Week 2: Review Google Play Console vitals + analytics",
        description: "Check: crash rate (target <1%), ANR rate (target <0.5%), install/uninstall ratio, acquisition reports (organic vs search vs explore). Check user retention (Day 1, Day 7, Day 30). Fix any crashes immediately with EAS Update if JS-only.",
        category: "analytics", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 2, day_offset: 0,
      },
      {
        title: "Week 2: Compare mobile vs web analytics in PostHog",
        description: "Check PostHog for mobile-specific events. Compare: session duration, feature usage, conversion funnel (signup > first action > payment) between web and mobile users. Identify if mobile users have different behavior patterns.",
        category: "analytics", priority: "medium", estimated_minutes: 20,
        lifecycle_phase: "grow", week_number: 2, day_offset: 2,
      },
      {
        title: "Week 2: Push first OTA update via EAS Update",
        description: "If any JS-only fixes needed (bugs, copy, styling), push an over-the-air update: eas update --branch production --message 'Fix X'. This updates the app without going through store review. Only works for JS changes, not native module changes.",
        category: "infrastructure", priority: "medium", estimated_minutes: 15,
        lifecycle_phase: "grow", week_number: 2, day_offset: 3,
      },
      {
        title: "Week 3: A/B test App Store screenshots and listing copy",
        description: "Apple: use Product Page Optimization (up to 3 treatments). Google: use Store Listing Experiments. Test: (1) different screenshot order, (2) different first screenshot, (3) different captions/headlines, (4) with/without device frames, (5) short description variants. Run for 7+ days. Target: improve conversion rate by 10%+.",
        category: "content", priority: "high", estimated_minutes: 45,
        lifecycle_phase: "grow", week_number: 3, day_offset: 0,
      },
      {
        title: "Week 3: Analyze keyword rankings + adjust ASO",
        description: "Use AppTweak, Sensor Tower, or App Radar (free tiers available). Check: which keywords are you ranking for? What position? Which have volume but you're not ranking? Actions: replace low-performing keywords, add competitor brand names as keywords (allowed), update description to include more keyword-rich content. Track week-over-week changes.",
        category: "content", priority: "high", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 3, day_offset: 2,
      },
      {
        title: "Week 3: Respond to all new reviews + request more ratings",
        description: "Continue responding to every review. If you have fewer than 10 ratings, actively seek more: add subtle prompts in the app, ask in email/social. Ratings count heavily in App Store search ranking. Aim for 4.5+ average.",
        category: "post_launch", priority: "medium", estimated_minutes: 20,
        lifecycle_phase: "grow", week_number: 3, day_offset: 3,
      },
      {
        title: "Week 4: Update screenshots if A/B test has a winner",
        description: "If screenshot A/B test showed a statistically significant winner, apply the winning variant as default. Update in both App Store Connect and Play Console. Also update any screenshots that show outdated UI if you shipped changes.",
        category: "content", priority: "medium", estimated_minutes: 30,
        lifecycle_phase: "grow", week_number: 4, day_offset: 0,
      },
      {
        title: "Week 4: Plan mobile-specific feature roadmap",
        description: "Review user feedback from app reviews, support requests, and analytics. Identify mobile-specific opportunities: widgets, shortcuts, Watch app, share extensions, offline mode. Prioritize based on user demand and competitive landscape. Plan next mobile update.",
        category: "post_launch", priority: "medium", estimated_minutes: 45,
        lifecycle_phase: "grow", week_number: 4, day_offset: 2,
      },
      {
        title: "Week 4: Set up ongoing mobile monitoring cadence",
        description: "Establish weekly check: (1) App Store Connect analytics (conversion rate, impressions), (2) Play Console vitals (crashes, ANRs), (3) PostHog mobile events, (4) Review responses, (5) Keyword rankings. Add to your weekly review routine. Set up crash alerts if available.",
        category: "analytics", priority: "medium", estimated_minutes: 15,
        lifecycle_phase: "grow", week_number: 4, day_offset: 3,
      },
    );
  }

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
