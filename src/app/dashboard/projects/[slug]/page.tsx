"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Check, ExternalLink, Code, Globe, Database,
  Clock, AlertCircle, Shield, Sparkles, Scale, Zap,
  Loader2, CheckCircle, Tag, Flag, MessageSquare, Send,
  ChevronDown, ChevronRight, Terminal, BookOpen, CircleCheck,
  Plus, Trash2, Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProjectStatusWidget } from "@/components/pipeline/project-status-widget";
import { AISummaryWidget } from "@/components/pipeline/ai-summary-widget";
import { AnalyticsWidget } from "@/components/pipeline/analytics-widget";
import type { Project, ChecklistItem, Audit, ActivityLogEntry, ChecklistCategory, Feature, FeatureStatus } from "@/lib/projects/types";
import { STAGES, LABELS, PRIORITIES, FEATURE_STATUSES } from "@/lib/projects/types";

const categoryLabels: Record<ChecklistCategory, string> = {
  validation: "Idea Validation",
  research: "Research & Planning",
  infrastructure: "Infrastructure",
  deployment: "Deployment",
  design: "Design",
  auth: "Authentication",
  payments: "Payments",
  automation: "Automation",
  legal: "Legal & Compliance",
  quality: "Quality & Security",
  seo: "SEO",
  content: "Content & Brand",
  marketing: "Marketing",
  distribution: "Distribution",
  growth: "Growth",
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
  const [features, setFeatures] = useState<Feature[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [submittingFeature, setSubmittingFeature] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "features" | "audits" | "comments" | "activity">("checklist");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

        // Fetch features
        const featuresRes = await fetch(`/api/projects/${slug}/features`);
        if (featuresRes.ok) {
          setFeatures(await featuresRes.json());
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

  const addFeature = async () => {
    const lines = newFeature.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setSubmittingFeature(true);
    try {
      const res = await fetch(`/api/projects/${slug}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: lines.map((title) => ({ title })) }),
      });
      if (res.ok) {
        const created: Feature[] = await res.json();
        setFeatures((prev) => [...created, ...prev]);
        setNewFeature("");
        toast.success(created.length === 1 ? "Feature added" : `${created.length} features added`);
      } else {
        toast.error("Failed to add feature");
      }
    } catch {
      toast.error("Failed to add feature");
    } finally {
      setSubmittingFeature(false);
    }
  };

  const updateFeature = async (id: string, patch: Partial<Feature>) => {
    const prev = features;
    setFeatures((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    try {
      const res = await fetch(`/api/projects/${slug}/features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setFeatures((list) => list.map((f) => (f.id === id ? updated : f)));
    } catch {
      setFeatures(prev);
      toast.error("Failed to update feature");
    }
  };

  const deleteFeature = async (id: string) => {
    const prev = features;
    setFeatures((list) => list.filter((f) => f.id !== id));
    try {
      const res = await fetch(`/api/projects/${slug}/features/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setFeatures(prev);
      toast.error("Failed to delete feature");
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

      {/* AI Summary + Smart Nudges */}
      <AISummaryWidget slug={slug} />

      {/* Live status */}
      {(project.links?.github_url || project.links?.vercel_url) && (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <ProjectStatusWidget slug={slug} />
        </div>
      )}

      {/* PostHog Analytics */}
      {project.links?.live_url && (project.stage === "live" || project.stage === "scaling") && (
        <AnalyticsWidget slug={slug} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["checklist", "features", "audits", "comments", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "checklist"
              ? `Checklist (${completedCount}/${totalCount})`
              : tab === "features"
                ? `Features (${features.filter((f) => f.status !== "done").length}/${features.length})`
                : tab === "audits"
                  ? `Audits (${audits.length})`
                  : tab === "comments"
                    ? `Comments (${comments.length})`
                    : `Activity (${activity.length})`}
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
                {items.sort((a, b) => a.sort_order - b.sort_order).map((item) => {
                  const hasGuidance = item.guidance && (item.guidance.approach || item.guidance.skill || item.guidance.done_when);
                  const isExpanded = expandedItems.has(item.id);
                  return (
                    <li key={item.id}>
                      <div className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted">
                        <button onClick={() => toggleChecklist(item)} className="flex shrink-0 items-center">
                          <span className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                            item.is_completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-card"
                          )}>
                            {item.is_completed && <Check className="size-3" />}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            if (!hasGuidance) return;
                            setExpandedItems((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                          }}
                          className={cn("flex flex-1 items-center gap-1.5", hasGuidance && "cursor-pointer")}
                        >
                          <span className={cn("text-[13px]", item.is_completed ? "text-muted-foreground line-through" : "text-foreground")}>
                            {item.label}
                          </span>
                          {hasGuidance && (
                            isExpanded
                              ? <ChevronDown className="size-3 text-muted-foreground" />
                              : <ChevronRight className="size-3 text-muted-foreground" />
                          )}
                          {item.guidance?.skill && (
                            <span className="ml-auto rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent">
                              {item.guidance.skill}
                            </span>
                          )}
                        </button>
                      </div>
                      {hasGuidance && isExpanded && (
                        <div className="ml-8 mr-2 mb-2 rounded-lg border border-border/50 bg-muted/50 p-3 space-y-2">
                          {item.guidance.approach && (
                            <div className="flex gap-2">
                              <Terminal className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                              <p className="text-[12px] text-foreground">{item.guidance.approach}</p>
                            </div>
                          )}
                          {item.guidance.done_when && (
                            <div className="flex gap-2">
                              <CircleCheck className="size-3.5 mt-0.5 shrink-0 text-emerald-500" />
                              <p className="text-[12px] text-muted-foreground">{item.guidance.done_when}</p>
                            </div>
                          )}
                          {item.guidance.references && item.guidance.references.length > 0 && (
                            <div className="flex gap-2">
                              <BookOpen className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                              <div className="flex flex-wrap gap-2">
                                {item.guidance.references.map((ref, i) => (
                                  <a key={i} href={ref} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:underline truncate max-w-[300px]">
                                    {ref.replace(/^https?:\/\//, '')}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No checklist items. Create from a template to populate.</p>
          )}
        </div>
      )}

      {activeTab === "features" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <textarea
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Dump features here. One per line — bulk adds supported."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) addFeature(); }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/50">Cmd+Enter to add (one per line)</span>
              <button
                onClick={addFeature}
                disabled={submittingFeature || !newFeature.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Plus className="size-3" />
                {submittingFeature ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          {features.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-12 text-center">
              <Lightbulb className="mx-auto size-8 text-muted-foreground/20" />
              <p className="mt-2 text-[13px] text-muted-foreground">No features yet. Add ideas above or ask Claude to dump some.</p>
            </div>
          ) : (
            FEATURE_STATUSES.map((status) => {
              const items = features.filter((f) => f.status === status.value);
              if (items.length === 0) return null;
              return (
                <div key={status.value} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className={cn("size-2 rounded-full", status.dot)} />
                    {status.label} ({items.length})
                  </h3>
                  <ul className="space-y-1">
                    {items.map((f) => {
                      const priority = PRIORITIES.find((p) => p.value === f.priority);
                      return (
                        <li key={f.id} className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted">
                          <button
                            onClick={() => updateFeature(f.id, { status: f.status === "done" ? "backlog" : "done" })}
                            className="mt-0.5 flex shrink-0 items-center"
                            title={f.status === "done" ? "Mark as backlog" : "Mark as done"}
                          >
                            <span className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                              f.status === "done" ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-card"
                            )}>
                              {f.status === "done" && <Check className="size-3" />}
                            </span>
                          </button>
                          <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[13px] flex-1 truncate",
                                f.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                              )}>
                                {f.title}
                              </span>
                              {f.source !== "web" && (
                                <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">{f.source}</span>
                              )}
                              {priority && (
                                <span className={cn("flex items-center gap-1 text-[11px]", priority.color)}>
                                  <Flag className="size-3" />{priority.label}
                                </span>
                              )}
                            </div>
                            {f.description && (
                              <p className="text-[12px] text-muted-foreground whitespace-pre-wrap">{f.description}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              value={f.status}
                              onChange={(e) => updateFeature(f.id, { status: e.target.value as FeatureStatus })}
                              className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px]"
                            >
                              {FEATURE_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <select
                              value={f.priority || ""}
                              onChange={(e) => updateFeature(f.id, { priority: (e.target.value || null) as Feature["priority"] })}
                              className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px]"
                            >
                              <option value="">—</option>
                              {PRIORITIES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteFeature(f.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
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
