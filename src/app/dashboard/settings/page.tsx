"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, GitFork, Cloud, Database, FolderOpen, Check, Terminal, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/projects/types";

const AVAILABLE_SKILLS = [
  { id: "saas-setup", label: "/saas-setup", description: "Auth, payments, legal pages" },
  { id: "frontend-vibe", label: "/frontend-vibe", description: "Design system, 21st.dev components" },
  { id: "logo-generator", label: "/logo-generator", description: "Brand logo generation" },
  { id: "landing-page", label: "/landing-page", description: "Conversion-optimized landing pages" },
  { id: "linkedin-strategy", label: "/linkedin-strategy", description: "LinkedIn content strategy" },
  { id: "carousel-generator", label: "/carousel-generator", description: "Branded carousels" },
  { id: "newsletter-builder", label: "/newsletter-builder", description: "TLDR newsletter pipeline" },
  { id: "security-audit", label: "/security-audit", description: "Security vulnerability scan" },
  { id: "quality-audit", label: "/quality-audit", description: "Quality and performance audit" },
  { id: "app-improver", label: "/app-improver", description: "Continuous improvement pipeline" },
  { id: "mobile-app", label: "/mobile-app", description: "Expo React Native conversion" },
];

const SERVICE_OPTIONS = [
  { id: "lemon_squeezy", label: "Lemon Squeezy", description: "Subscription payments" },
  { id: "termly", label: "Termly", description: "Privacy, terms, cookie consent" },
  { id: "posthog", label: "PostHog", description: "Product analytics" },
  { id: "beehiiv", label: "Beehiiv", description: "Newsletter platform" },
  { id: "content_flywheel", label: "Content Flywheel", description: "Brand voice & content" },
  { id: "n8n", label: "n8n", description: "Workflow automation" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [githubUsername, setGitForkUsername] = useState("");
  const [vercelTeamId, setVercelTeamId] = useState("");
  const [supabaseProjectId, setSupabaseProjectId] = useState("");
  const [appsDirectory, setAppsDirectory] = useState("~/projects/");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((profile: UserProfile) => {
        setDisplayName(profile.display_name || "");
        setGitForkUsername(profile.github_username || "");
        setVercelTeamId(profile.vercel_team_id || "");
        setSupabaseProjectId(profile.default_supabase_project_id || "");
        setAppsDirectory(profile.apps_directory || "~/projects/");
        setSelectedSkills(profile.available_skills || []);
        setSelectedServices(
          (profile.tool_preferences as { services?: string[] })?.services || []
        );
      })
      .catch(() => {
        toast.error("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!githubUsername.trim()) {
      toast.error("GitHub username is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          github_username: githubUsername.trim(),
          vercel_team_id: vercelTeamId.trim() || null,
          default_supabase_project_id: supabaseProjectId.trim() || null,
          apps_directory: appsDirectory.trim() || "~/projects/",
          available_skills: selectedSkills,
          tool_preferences: { services: selectedServices },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Pipeline
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your infrastructure and tools for the playbook system.
        </p>
      </div>

      {/* Infrastructure */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-[13px] font-semibold text-foreground">Infrastructure</h2>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <GitFork className="size-3" />
            GitHub Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGitForkUsername(e.target.value)}
            placeholder="octocat"
            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Cloud className="size-3" />
            Vercel Team ID
          </label>
          <input
            type="text"
            value={vercelTeamId}
            onChange={(e) => setVercelTeamId(e.target.value)}
            placeholder="team_..."
            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Database className="size-3" />
            Default Supabase Project ID
          </label>
          <input
            type="text"
            value={supabaseProjectId}
            onChange={(e) => setSupabaseProjectId(e.target.value)}
            placeholder="abcdefghijklmnop"
            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <FolderOpen className="size-3" />
            Apps Directory
          </label>
          <input
            type="text"
            value={appsDirectory}
            onChange={(e) => setAppsDirectory(e.target.value)}
            placeholder="~/projects/"
            className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-[13px] font-semibold text-foreground">Claude Code Skills</h2>
        <p className="text-[11px] text-muted-foreground">
          Select the skills you have installed. Guidance will adapt to show manual steps for skills you don&apos;t have.
        </p>
        <div className="grid grid-cols-1 gap-1">
          {AVAILABLE_SKILLS.map((skill) => {
            const selected = selectedSkills.includes(skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
                  selected
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:border-accent/30"
                )}
              >
                <span className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                  selected ? "border-accent bg-accent text-white" : "border-border"
                )}>
                  {selected && <Check className="size-2.5" />}
                </span>
                <span className="text-[11px] font-mono font-medium text-foreground">{skill.label}</span>
                <span className="text-[10px] text-muted-foreground">{skill.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-[13px] font-semibold text-foreground">Preferred Services</h2>
        <div className="grid grid-cols-1 gap-1">
          {SERVICE_OPTIONS.map((service) => {
            const selected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
                  selected
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:border-accent/30"
                )}
              >
                <span className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                  selected ? "border-accent bg-accent text-white" : "border-border"
                )}>
                  {selected && <Check className="size-2.5" />}
                </span>
                <span className="text-[11px] font-medium text-foreground">{service.label}</span>
                <span className="text-[10px] text-muted-foreground">{service.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Developer settings link */}
      <Link
        href="/dashboard/settings/developer"
        className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-3">
          <Terminal className="size-4 text-foreground" />
          <div>
            <div className="text-[13px] font-semibold text-foreground">Developer</div>
            <div className="text-[11px] text-muted-foreground">API keys and webhooks</div>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !githubUsername.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <><Loader2 className="size-4 animate-spin" />Saving...</>
        ) : (
          <><Save className="size-4" />Save Settings</>
        )}
      </button>
    </div>
  );
}
