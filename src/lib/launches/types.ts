// Launch Mode V2 types — comprehensive launch orchestration system

// ---- V1 types (kept for backward compatibility) ----

export interface LaunchIntake {
  app_name: string;
  app_description: string;
  niche: string;
  problem: string;
  monetization: string;
  price: string;
  differentiator: string;
  app_url: string;
  launch_timeline: string;
  // V2 additions
  product_url?: string;
  product_status?: string;
  pricing_model?: string;
  budget?: string;
  hours_per_week?: string;
  has_audience?: boolean;
  audience_details?: string;
  launch_target_date?: string;
}

export interface ChannelScore {
  channel: string;
  score: number;
  rationale: string;
}

export interface TimelineDay {
  day: number;
  title: string;
  tasks: string[];
  checked?: boolean[];
}

export interface GTMStrategy {
  positioning: {
    headline: string;
    subheadline: string;
    value_props: string[];
    differentiator: string;
    anti_icp: string;
  };
  icp: {
    primary_user: string;
    communities: string[];
    pain_language: string[];
    failed_alternatives: string[];
  };
  timeline: TimelineDay[];
  channel_scores: ChannelScore[];
}

// ---- V2 Enhanced types ----

export interface EnhancedGTMStrategy {
  market_analysis: {
    market_size_estimate: string;
    competitor_landscape: {
      direct_competitors: Array<{
        name: string;
        url: string;
        strengths: string;
        weakness: string;
        pricing: string;
      }>;
      indirect_competitors: Array<{ name: string; overlap: string }>;
    };
    differentiation_matrix: string;
    market_timing: string;
  };

  positioning: {
    headline: string;
    subheadline: string;
    elevator_pitch_30s: string;
    elevator_pitch_60s: string;
    value_props: string[];
    differentiator: string;
    anti_positioning: string;
    social_proof_strategy: string;
    pricing_recommendation: {
      model: string;
      suggested_price: string;
      rationale: string;
      launch_offer: string;
    };
  };

  icp: {
    primary_user: string;
    secondary_users: string[];
    pain_points: string[];
    pain_language: string[];
    communities: Array<{
      platform: string;
      name: string;
      url: string;
      size: string;
      relevance_score: number;
      rules_summary: string;
      best_post_format: string;
    }>;
    failed_alternatives: string[];
    buying_triggers: string[];
  };

  channel_scores: Array<{
    channel: string;
    score: number;
    rationale: string;
    effort_level: "low" | "medium" | "high";
    expected_impact: "low" | "medium" | "high";
    timing: string;
    specific_playbook: string;
  }>;

  pre_launch_plan: {
    accounts_to_create: Array<{
      platform: string;
      url: string;
      why: string;
      when: string;
      setup_instructions: string;
      estimated_time: string;
    }>;
    community_seeding: Array<{
      platform: string;
      community: string;
      url: string;
      join_when: string;
      warmup_activities: string[];
      karma_target: number;
      content_ideas: string[];
    }>;
    beta_testing: {
      how_to_recruit: string[];
      ideal_beta_size: number;
      feedback_collection: string;
      timeline: string;
    };
    landing_page_checklist: string[];
    waitlist_strategy: string;
    teaser_content: Array<{
      platform: string;
      content_type: string;
      content: string;
      post_when: string;
    }>;
  };

  launch_timeline: {
    weeks: Array<{
      week_number: number;
      label: string;
      theme: string;
      daily_tasks: Array<{
        day: string;
        tasks: Array<{
          task: string;
          platform: string;
          priority: "critical" | "high" | "medium" | "low";
          estimated_time: string;
          automated: boolean;
          details: string;
        }>;
      }>;
    }>;
    launch_day_playbook: {
      hour_by_hour: Array<{
        time: string;
        action: string;
        platform: string;
        details: string;
      }>;
      contingency_plans: string[];
    };
  };

  directory_strategy: Array<{
    directory: string;
    url: string;
    submission_type: "free" | "paid" | "expedited";
    cost: string;
    when_to_submit: string;
    submission_requirements: string;
    tailored_description: string;
    expected_impact: string;
  }>;

  post_launch_plan: {
    week1: string[];
    week2: string[];
    week3_4: string[];
    metrics_to_track: Array<{
      metric: string;
      target: string;
      how_to_measure: string;
    }>;
    iteration_triggers: string[];
  };

  risks: Array<{
    risk: string;
    likelihood: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    mitigation: string;
  }>;
}

// ---- Launch Phase & Task ----

export type LaunchPhaseType =
  | "pre_launch"
  | "launch_week"
  | "launch_day"
  | "post_launch";

export interface LaunchPhase {
  id: string;
  launch_id: string;
  phase: LaunchPhaseType;
  week_number: number;
  status: "pending" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskCategory =
  | "account_setup"
  | "community_seeding"
  | "content"
  | "directory"
  | "outreach"
  | "admin"
  | "launch_day"
  | "post_launch";

export interface LaunchTask {
  id: string;
  launch_id: string;
  phase_id: string | null;
  title: string;
  description: string | null;
  platform: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_minutes: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  week_number: number | null;
  day_label: string | null;
  status: TaskStatus;
  completed_at: string | null;
  automated: boolean;
  automation_type: string | null;
  automation_data: Record<string, unknown> | null;
  url: string | null;
  content_item_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Directory ----

export interface DirectoryInfo {
  name: string;
  url: string;
  submission_url: string;
  submission_type: "free" | "paid" | "expedited";
  cost: string;
  category: string;
  description_format: string;
  max_description_length: number;
  best_for: string;
  review_time: string;
}

// ---- Content types ----

export interface GeneratedContent {
  reddit?: {
    trojan_horse_post: { title: string; body: string; target_subreddit: string };
    launch_post: { title: string; body: string; target_subreddit: string };
    dm_template: string;
  };
  product_hunt?: {
    tagline: string;
    description: string;
    first_comment: string;
    gallery_descriptions: string[];
  };
  indie_hackers?: { launch_post: string; postmortem_template: string };
  email?: {
    launch_email: { subject: string; body: string };
    followup_email: { subject: string; body: string };
  };
  linkedin?: { launch_post: string; teaser_post: string; results_post: string };
  twitter?: { launch_thread: string[]; single_tweet: string };
}

export interface LaunchMetrics {
  signups_day1?: number;
  signups_week1?: number;
  conversion_rate?: number;
  top_channel?: string;
  reddit_upvotes?: number;
  reddit_comments?: number;
  ph_ranking?: number;
  email_open_rate?: number;
  notes?: string;
}

export type LaunchStatus =
  | "draft"
  | "planning"
  | "pre_launch"
  | "launch_day"
  | "post_launch"
  | "completed";

export interface Launch {
  id: string;
  user_id: string;
  brand_id: string | null;
  app_name: string;
  app_description: string;
  app_url: string | null;
  niche: string;
  problem: string;
  monetization: string;
  price: string | null;
  differentiator: string;
  launch_timeline: string;
  strategy: GTMStrategy | EnhancedGTMStrategy | null;
  status: LaunchStatus;
  launch_date: string | null;
  metrics: LaunchMetrics | null;
  readiness_score: number | null;
  current_phase: string | null;
  launch_target_date: string | null;
  budget: string | null;
  hours_per_week: string | null;
  product_status: string | null;
  has_audience: boolean;
  audience_details: string | null;
  pricing_model: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string;
}

export type LaunchContentChannel =
  | "reddit"
  | "product_hunt"
  | "indie_hackers"
  | "email"
  | "linkedin"
  | "twitter";

export const LAUNCH_CHANNEL_LABELS: Record<LaunchContentChannel, string> = {
  reddit: "Reddit",
  product_hunt: "Product Hunt",
  indie_hackers: "Indie Hackers",
  email: "Email",
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
};

export const LAUNCH_STATUS_LABELS: Record<LaunchStatus, string> = {
  draft: "Draft",
  planning: "Planning",
  pre_launch: "Pre-Launch",
  launch_day: "Launch Day",
  post_launch: "Post-Launch",
  completed: "Completed",
};

export const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  product_hunt: "#DA552F",
  indie_hackers: "#1F6FEB",
  email: "#10B981",
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  hacker_news: "#FF6600",
  betalist: "#1E293B",
  devhunt: "#7C3AED",
  blog: "#6366F1",
  youtube: "#FF0000",
  discord: "#5865F2",
  general: "#64748B",
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  account_setup: "Account Setup",
  community_seeding: "Community Seeding",
  content: "Content",
  directory: "Directory",
  outreach: "Outreach",
  admin: "Admin",
  launch_day: "Launch Day",
  post_launch: "Post-Launch",
};

export const TASK_CATEGORY_COLORS: Record<TaskCategory, string> = {
  account_setup: "bg-blue-100 text-blue-700 border-blue-200",
  community_seeding: "bg-green-100 text-green-700 border-green-200",
  content: "bg-purple-100 text-purple-700 border-purple-200",
  directory: "bg-amber-100 text-amber-700 border-amber-200",
  outreach: "bg-pink-100 text-pink-700 border-pink-200",
  admin: "bg-slate-100 text-slate-700 border-slate-200",
  launch_day: "bg-emerald-100 text-emerald-700 border-emerald-200",
  post_launch: "bg-violet-100 text-violet-700 border-violet-200",
};
