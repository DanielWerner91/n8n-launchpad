"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Rocket, FileText, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Template {
  slug: string;
  name: string;
  description: string;
  checklist: unknown[];
}

const templateIcons: Record<string, React.ElementType> = {
  "saas-app": Rocket,
  "content-site": FileText,
  "client-project": Briefcase,
};

export default function NewProjectPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleCreate = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, template_slug: selectedTemplate, icon_emoji: emoji }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed"); }
      toast.success("Project created");
      router.push(`/dashboard/projects/${slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />Pipeline
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-foreground">New Project</h1>
        <p className="text-sm text-muted-foreground">Choose a template to get started with a pre-built checklist</p>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-3 gap-3">
        {templates.map((t) => {
          const Icon = templateIcons[t.slug] || Rocket;
          const selected = selectedTemplate === t.slug;
          return (
            <button
              key={t.slug}
              onClick={() => setSelectedTemplate(selected ? null : t.slug)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                selected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-card hover:border-accent/30"
              )}
            >
              <Icon className={cn("size-6", selected ? "text-accent" : "text-muted-foreground")} />
              <div>
                <p className="text-[13px] font-medium text-foreground">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.checklist.length} tasks</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Emoji</label>
            <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 rounded-lg border border-border bg-card px-2 py-1.5 text-center text-lg" maxLength={4} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Name</label>
            <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="My Awesome App" className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:border-accent focus:outline-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-awesome-app" className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:border-accent focus:outline-none" />
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || !name || !slug}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {creating ? <><Loader2 className="size-4 animate-spin" />Creating...</> : <><Rocket className="size-4" />Create Project</>}
        </button>
      </div>
    </div>
  );
}
