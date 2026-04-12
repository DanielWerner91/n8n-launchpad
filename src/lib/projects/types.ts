export type ProjectStage = "idea" | "research" | "build" | "deploy" | "live" | "scaling" | "archived";
export type HealthStatus = "green" | "yellow" | "red";
export type AuditType = "security" | "ux" | "legal" | "performance";
export type ActivitySource = "web" | "claude" | "cron";

export const STAGES: { value: ProjectStage; label: string; dot: string }[] = [
  { value: "idea", label: "Idea", dot: "bg-neutral-400" },
  { value: "research", label: "Research", dot: "bg-blue-500" },
  { value: "build", label: "Build", dot: "bg-violet-500" },
  { value: "deploy", label: "Deploy", dot: "bg-orange-500" },
  { value: "live", label: "Live", dot: "bg-emerald-500" },
  { value: "scaling", label: "Scaling", dot: "bg-indigo-500" },
  { value: "archived", label: "Archived", dot: "bg-neutral-300" },
];

export const CHECKLIST_CATEGORIES = [
  "infrastructure", "auth", "payments", "deployment", "design", "automation", "marketing", "legal",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

export type Priority = "low" | "medium" | "high" | "urgent";

export const LABELS: { value: string; label: string; color: string }[] = [
  { value: "saas", label: "SaaS", color: "bg-blue-100 text-blue-700" },
  { value: "content", label: "Content", color: "bg-purple-100 text-purple-700" },
  { value: "client", label: "Client", color: "bg-amber-100 text-amber-700" },
  { value: "internal", label: "Internal", color: "bg-slate-100 text-slate-700" },
  { value: "revenue", label: "Revenue", color: "bg-emerald-100 text-emerald-700" },
  { value: "experiment", label: "Experiment", color: "bg-pink-100 text-pink-700" },
];

export const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
  { value: "low", label: "Low", color: "text-slate-500", dot: "bg-slate-400" },
  { value: "medium", label: "Medium", color: "text-blue-600", dot: "bg-blue-500" },
  { value: "high", label: "High", color: "text-orange-600", dot: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-600", dot: "bg-red-500" },
];

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  stage: ProjectStage;
  health: HealthStatus;
  health_score: number;
  icon_emoji: string;
  logo_url: string | null;
  template_slug: string | null;
  links: ProjectLinks;
  labels: string[];
  priority: Priority | null;
  due_date: string | null;
  cover_color: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
  _checklist_total?: number;
  _checklist_completed?: number;
}

export interface ProjectLinks {
  github_url?: string;
  vercel_url?: string;
  supabase_url?: string;
  live_url?: string;
  n8n_workflow_ids?: string[];
}

export interface ChecklistItem {
  id: string;
  project_id: string;
  category: ChecklistCategory;
  label: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string;
  sort_order: number;
  created_at: string;
}

export interface Audit {
  id: string;
  project_id: string;
  audit_type: AuditType;
  interval_days: number;
  last_completed_at: string | null;
  next_due_at: string | null;
  is_overdue: boolean;
  notes: string;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  project_id: string | null;
  action: string;
  details: Record<string, unknown>;
  source: ActivitySource;
  created_at: string;
  project?: Pick<Project, "name" | "slug" | "icon_emoji">;
}

export function calculateHealthScore(
  checklistItems: ChecklistItem[],
  audits: Audit[],
): { score: number; status: HealthStatus } {
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter((i) => i.is_completed).length;
  const checklistScore = totalItems > 0 ? (completedItems / totalItems) * 100 : 100;
  const overdueAudits = audits.filter((a) => a.is_overdue).length;
  const auditScore = Math.max(0, 100 - overdueAudits * 25);
  const score = Math.round(checklistScore * 0.6 + auditScore * 0.4);
  let status: HealthStatus = "green";
  if (score < 40) status = "red";
  else if (score < 70) status = "yellow";
  return { score, status };
}
