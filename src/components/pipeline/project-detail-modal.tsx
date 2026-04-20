"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, ExternalLink, Code, Globe, Database,
  Clock, AlertCircle, Shield, Sparkles, Scale, Zap,
  Loader2, CheckCircle, Tag, Flag, Lightbulb, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { HealthBadge } from "./health-badge";
import type { Project, ChecklistItem, Audit, ActivityLogEntry, ChecklistCategory, HealthStatus, Feature } from "@/lib/projects/types";
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

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onProjectUpdate: (updated: Project) => void;
}

export function ProjectDetailModal({ project, onClose, onProjectUpdate }: ProjectDetailModalProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "features" | "audits" | "activity">("checklist");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Fetch detail data when project changes
  useEffect(() => {
    if (!project) return;
    setLoading(true);
    setActiveTab("checklist");
    setEditing(null);

    async function loadDetail() {
      try {
        const [detailRes, featuresRes] = await Promise.all([
          fetch(`/api/projects/${project!.slug}/detail`),
          fetch(`/api/projects/${project!.slug}/features`),
        ]);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setChecklist(detail.checklist_items || []);
          setAudits((detail.audits || []).map((a: Audit & { next_due_at: string | null }) => ({
            ...a,
            is_overdue: a.next_due_at ? new Date(a.next_due_at) < new Date() : false,
          })));
          setActivity(detail.activity || []);
        }
        if (featuresRes.ok) {
          setFeatures(await featuresRes.json());
        }
      } catch {
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [project?.id]);

  // Close on Escape
  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [project, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [project]);

  const toggleChecklist = useCallback(async (item: ChecklistItem) => {
    if (!project) return;
    const newValue = !item.is_completed;
    setChecklist((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_completed: newValue } : i))
    );
    try {
      await fetch(`/api/projects/${project.slug}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, is_completed: newValue }),
      });
    } catch {
      setChecklist((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: !newValue } : i))
      );
    }
  }, [project]);

  const updateField = useCallback(async (field: string, value: unknown) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        onProjectUpdate(updated);
        toast.success("Updated");
      }
    } catch {
      toast.error("Failed to update");
    }
    setEditing(null);
  }, [project, onProjectUpdate]);

  const toggleLabel = useCallback((label: string) => {
    if (!project) return;
    const current = project.labels || [];
    const updated = current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label];
    updateField("labels", updated);
  }, [project, updateField]);

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
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-background border-l border-border shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Cover color bar */}
            {project.cover_color && (
              <div className={cn("h-1.5 w-full", project.cover_color)} />
            )}

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="pr-8">
                <div className="flex items-start gap-4">
                  {project.logo_url ? (
                    <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                      <Image src={project.logo_url} alt={project.name} width={48} height={48} className="size-12 object-contain" unoptimized />
                    </div>
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                      {project.icon_emoji}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {editing === "name" ? (
                      <input
                        autoFocus
                        className="text-xl font-semibold bg-transparent border-b-2 border-accent outline-none w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => updateField("name", editValue)}
                        onKeyDown={(e) => e.key === "Enter" && updateField("name", editValue)}
                      />
                    ) : (
                      <h2
                        className="text-xl font-semibold text-foreground cursor-pointer hover:text-accent transition-colors"
                        onClick={() => { setEditing("name"); setEditValue(project.name); }}
                      >
                        {project.name}
                      </h2>
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
                        className="mt-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => { setEditing("description"); setEditValue(project.description || ""); }}
                      >
                        {project.description || "Click to add description..."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Health badge + full detail link */}
                <div className="mt-3 flex items-center gap-3">
                  <HealthBadge health={project.health as HealthStatus} score={project.health_score} />
                  <Link
                    href={`/dashboard/projects/${project.slug}`}
                    className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-accent hover:bg-accent/10"
                  >
                    Open full details
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>

              {/* Stage + Priority selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={project.stage}
                  onChange={(e) => updateField("stage", e.target.value)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <select
                  value={project.priority || ""}
                  onChange={(e) => updateField("priority", e.target.value || null)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium"
                >
                  <option value="">No priority</option>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>

                {project.due_date && (
                  <span className="flex items-center gap-1 text-[12px] text-muted-foreground ml-auto">
                    <Clock className="size-3" />
                    Due {format(new Date(project.due_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>

              {/* Labels */}
              <div className="flex items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {LABELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => toggleLabel(l.value)}
                      className={cn(
                        "rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                        project.labels?.includes(l.value)
                          ? cn(l.color, "ring-1 ring-current/20")
                          : "bg-muted text-muted-foreground/50 hover:text-muted-foreground"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">{pct}%</span>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap items-center gap-1">
                {project.links?.live_url && (
                  <a href={project.links.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Globe className="size-3.5" />Live
                  </a>
                )}
                {project.links?.github_url && (
                  <a href={project.links.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Code className="size-3.5" />Code
                  </a>
                )}
                {project.links?.vercel_url && (
                  <a href={project.links.vercel_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ExternalLink className="size-3.5" />Vercel
                  </a>
                )}
                {project.links?.supabase_url && (
                  <a href={project.links.supabase_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Database className="size-3.5" />DB
                  </a>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border">
                {(["checklist", "features", "audits", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px",
                      activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "checklist" ? `Checklist (${completedCount}/${totalCount})`
                      : tab === "features" ? `Features (${features.filter((f) => f.status !== "done").length}/${features.length})`
                      : tab === "audits" ? `Audits (${audits.length})`
                      : `Activity (${activity.length})`}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {activeTab === "checklist" && (
                    <div className="space-y-4">
                      {Object.entries(grouped).map(([category, items]) => (
                        <div key={category} className="rounded-xl border border-border bg-card p-4">
                          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {categoryLabels[category as ChecklistCategory] || category}
                          </h3>
                          <ul className="space-y-0.5">
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
                        <p className="text-center py-8 text-muted-foreground text-sm">No checklist items yet.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "features" && (
                    <div className="space-y-3">
                      {features.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card py-10 text-center">
                          <Lightbulb className="mx-auto size-7 text-muted-foreground/20" />
                          <p className="mt-2 text-[13px] text-muted-foreground">No features yet.</p>
                          <Link
                            href={`/dashboard/projects/${project.slug}`}
                            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                          >
                            Add in full details
                            <ArrowUpRight className="size-3" />
                          </Link>
                        </div>
                      ) : (
                        FEATURE_STATUSES.map((status) => {
                          const items = features.filter((f) => f.status === status.value);
                          if (items.length === 0) return null;
                          return (
                            <div key={status.value} className="rounded-xl border border-border bg-card p-4">
                              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <span className={cn("size-2 rounded-full", status.dot)} />
                                {status.label} ({items.length})
                              </h3>
                              <ul className="space-y-0.5">
                                {items.map((f) => {
                                  const priority = PRIORITIES.find((p) => p.value === f.priority);
                                  return (
                                    <li key={f.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
                                      <span className={cn(
                                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                                        f.status === "done" ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-card"
                                      )}>
                                        {f.status === "done" && <Check className="size-3" />}
                                      </span>
                                      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
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
                                          <p className="text-[12px] text-muted-foreground line-clamp-2">{f.description}</p>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })
                      )}
                      {features.length > 0 && (
                        <Link
                          href={`/dashboard/projects/${project.slug}`}
                          className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Manage features in full details
                          <ArrowUpRight className="size-3" />
                        </Link>
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
                        <p className="text-center py-8 text-muted-foreground text-sm">No audit schedule configured.</p>
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
                        <p className="text-center py-8 text-muted-foreground text-sm">No activity yet.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
