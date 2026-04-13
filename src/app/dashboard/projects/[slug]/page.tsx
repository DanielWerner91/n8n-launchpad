"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Check, ExternalLink, Code, Globe, Database,
  Clock, AlertCircle, Shield, Sparkles, Scale, Zap,
  Loader2, CheckCircle, Tag, Flag, MessageSquare, Send,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project, ChecklistItem, Audit, ActivityLogEntry, ChecklistCategory } from "@/lib/projects/types";
import { STAGES, LABELS, PRIORITIES } from "@/lib/projects/types";

const categoryLabels: Record<ChecklistCategory, string> = {
  infrastructure: "Infrastructure",
  auth: "Authentication",
  payments: "Payments",
  deployment: "Deployment",
  design: "Design",
  automation: "Automation",
  marketing: "Marketing",
  legal: "Legal & Compliance",
};

const auditIcons: Record<string, React.ElementType> = {
  security: Shield, ux: Sparkles, legal: Scale, performance: Zap,
};

const auditLabels: Record<string, string> = {
  security: "Security", ux: "UX / Improvement", legal: "Legal / Compliance", performance: "Performance",
};

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ id: string; content: string; source: string; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "audits" | "comments" | "activity">("checklist");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProject(data);

        // Fetch checklist
        const checkRes = await fetch(`/api/projects/${slug}/detail`);
        if (checkRes.ok) {
          const detail = await checkRes.json();
          setChecklist(detail.checklist_items || []);
          setAudits((detail.audits || []).map((a: Audit & { next_due_at: string | null }) => ({
            ...a,
            is_overdue: a.next_due_at ? new Date(a.next_due_at) < new Date() : false,
          })));
          setActivity(detail.activity || []);
        }

        // Fetch comments
        const commentsRes = await fetch(`/api/projects/${slug}/comments`);
        if (commentsRes.ok) {
          setComments(await commentsRes.json());
        }
      } catch {
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/projects/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
        toast.success("Comment added");
      }
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleChecklist = async (item: ChecklistItem) => {
    const newValue = !item.is_completed;
    setChecklist((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_completed: newValue } : i))
    );
    try {
      await fetch(`/api/projects/${slug}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, is_completed: newValue }),
      });
    } catch {
      setChecklist((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: !newValue } : i))
      );
    }
  };

  const updateField = async (field: string, value: unknown) => {
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        toast.success("Updated");
      }
    } catch {
      toast.error("Failed to update");
    }
    setEditing(null);
  };

  const toggleLabel = (label: string) => {
    if (!project) return;
    const current = project.labels || [];
    const updated = current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label];
    updateField("labels", updated);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!project) {
    return <div className="text-center py-20 text-muted-foreground">Project not found</div>;
  }

  const stageInfo = STAGES.find((s) => s.value === project.stage);
  const completedCount = checklist.filter((i) => i.is_completed).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const grouped = checklist.reduce((acc, item) => {
    const cat = item.category as ChecklistCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<ChecklistCategory, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Pipeline
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {project.cover_color && <div className={cn("h-2 w-full", project.cover_color)} />}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {project.logo_url ? (
                <div className="size-12 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                  <Image src={project.logo_url} alt={project.name} width={48} height={48} className="size-12 object-contain" unoptimized />
                </div>
              ) : (
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-2xl">
                  {project.icon_emoji}
                </div>
              )}
              <div>
                {editing === "name" ? (
                  <input
                    autoFocus
                    className="text-xl font-semibold bg-transparent border-b-2 border-accent outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => updateField("name", editValue)}
                    onKeyDown={(e) => e.key === "Enter" && updateField("name", editValue)}
                  />
                ) : (
                  <h1
                    className="text-xl font-semibold text-foreground cursor-pointer hover:text-accent"
                    onClick={() => { setEditing("name"); setEditValue(project.name); }}
                  >
                    {project.name}
                  </h1>
                )}
                {editing === "description" ? (
                  <input
                    autoFocus
                    className="mt-1 text-sm text-muted-foreground bg-transparent border-b border-accent outline-none w-full"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => updateField("description", editValue)}
                    onKeyDown={(e) => e.key === "Enter" && updateField("description", editValue)}
                  />
                ) : (
                  <p
                    className="mt-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => { setEditing("description"); setEditValue(project.description || ""); }}
                  >
                    {project.description || "Click to add description..."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Stage selector */}
              <select
                value={project.stage}
                onChange={(e) => updateField("stage", e.target.value)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {/* Priority selector */}
              <select
                value={project.priority || ""}
                onChange={(e) => updateField("priority", e.target.value || null)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium"
              >
                <option value="">No priority</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="mt-4 flex items-center gap-2">
            <Tag className="size-3.5 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {LABELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => toggleLabel(l.value)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                    project.labels?.includes(l.value) ? cn(l.color, "ring-1 ring-current/20") : "bg-muted text-muted-foreground/50 hover:text-muted-foreground"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress + links bar */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-4">
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[12px] text-muted-foreground">{pct}%</span>
                </div>
              )}
              {project.due_date && (
                <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Clock className="size-3" />
                  Due {format(new Date(project.due_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {project.links?.live_url && (
                <a href={project.links.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Globe className="size-3.5" />Live
                </a>
              )}
              {project.links?.github_url && (
                <a href={project.links.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Code className="size-3.5" />Code
                </a>
              )}
              {project.links?.vercel_url && (
                <a href={project.links.vercel_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                  <ExternalLink className="size-3.5" />Vercel
                </a>
              )}
              {project.links?.supabase_url && (
                <a href={project.links.supabase_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Database className="size-3.5" />DB
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["checklist", "audits", "comments", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "checklist" ? `Checklist (${completedCount}/${totalCount})` : tab === "audits" ? `Audits (${audits.length})` : tab === "comments" ? `Comments (${comments.length})` : `Activity (${activity.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "checklist" && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabels[category as ChecklistCategory] || category}
              </h3>
              <ul className="space-y-1">
                {items.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleChecklist(item)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
                    >
                      <span className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        item.is_completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-card"
                      )}>
                        {item.is_completed && <Check className="size-3" />}
                      </span>
                      <span className={cn("text-[13px]", item.is_completed ? "text-muted-foreground line-through" : "text-foreground")}>
                        {item.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No checklist items. Create from a template to populate.</p>
          )}
        </div>
      )}

      {activeTab === "audits" && (
        <div className="space-y-2">
          {audits.map((audit) => {
            const Icon = auditIcons[audit.audit_type] || Shield;
            const isOverdue = audit.next_due_at ? new Date(audit.next_due_at) < new Date() : false;
            return (
              <div key={audit.id} className={cn(
                "flex items-center justify-between rounded-xl border p-4",
                isOverdue ? "border-amber-200 bg-amber-50" : "border-border bg-card"
              )}>
                <div className="flex items-center gap-3">
                  <Icon className={cn("size-4", isOverdue ? "text-amber-600" : "text-muted-foreground")} />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{auditLabels[audit.audit_type] || audit.audit_type}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Every {audit.interval_days} days
                      {audit.last_completed_at && <> &middot; Last: {formatDistanceToNow(new Date(audit.last_completed_at), { addSuffix: true })}</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOverdue && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                      <AlertCircle className="size-3" />Overdue
                    </span>
                  )}
                  <button className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-emerald-100 hover:text-emerald-700">
                    <CheckCircle className="size-3" />Complete
                  </button>
                </div>
              </div>
            );
          })}
          {audits.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No audit schedule configured.</p>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-4">
          {/* Comment input */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or note..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submitComment(); }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/50">Cmd+Enter to submit</span>
                  <button
                    onClick={submitComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Send className="size-3" />
                    {submittingComment ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-12 text-center">
              <MessageSquare className="mx-auto size-8 text-muted-foreground/20" />
              <p className="mt-2 text-[13px] text-muted-foreground">No comments yet. Add a note to track decisions and context.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {comments.map((comment) => (
                <div key={comment.id} className="px-4 py-3">
                  <p className="text-[13px] text-foreground whitespace-pre-wrap">{comment.content}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    {comment.source !== "web" && (
                      <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-medium">{comment.source}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/30" />
              <div>
                <p className="text-[13px] text-foreground">{entry.action}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  {entry.source !== "web" && (
                    <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-medium">{entry.source}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No activity yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
