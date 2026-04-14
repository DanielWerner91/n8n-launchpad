"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Loader2, GitFork, Cloud, Database, FolderOpen, Wrench, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function SetupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const [githubUsername, setGitForkUsername] = useState("");
  const [vercelTeamId, setVercelTeamId] = useState("");
  const [supabaseProjectId, setSupabaseProjectId] = useState("");
  const [appsDirectory, setAppsDirectory] = useState("~/projects/");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

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

  const handleSubmit = async () => {
    if (!githubUsername.trim()) {
      toast.error("GitHub username is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_username: githubUsername.trim(),
          vercel_team_id: vercelTeamId.trim() || null,
          default_supabase_project_id: supabaseProjectId.trim() || null,
          apps_directory: appsDirectory.trim() || "~/projects/",
          available_skills: selectedSkills,
          tool_preferences: {
            services: selectedServices,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }
      toast.success("Profile created! Welcome to LaunchPad.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  const steps = [
    {
      title: "Infrastructure",
      subtitle: "Where your projects live",
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <GitFork className="size-3.5" />
              GitHub Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGitForkUsername(e.target.value)}
              placeholder="octocat"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground">Used for repo creation and project status checks</p>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <Cloud className="size-3.5" />
              Vercel Team ID
            </label>
            <input
              type="text"
              value={vercelTeamId}
              onChange={(e) => setVercelTeamId(e.target.value)}
              placeholder="team_..."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground">Optional. Find in Vercel dashboard under team settings.</p>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <Database className="size-3.5" />
              Default Supabase Project ID
            </label>
            <input
              type="text"
              value={supabaseProjectId}
              onChange={(e) => setSupabaseProjectId(e.target.value)}
              placeholder="abcdefghijklmnop"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground">Optional. Shared Supabase instance for your apps.</p>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <FolderOpen className="size-3.5" />
              Apps Directory
            </label>
            <input
              type="text"
              value={appsDirectory}
              onChange={(e) => setAppsDirectory(e.target.value)}
              placeholder="~/projects/"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground">Local folder where your app projects live</p>
          </div>
        </div>
      ),
    },
    {
      title: "Claude Code Skills",
      subtitle: "Which skills do you have installed?",
      content: (
        <div className="space-y-2">
          <p className="text-[12px] text-muted-foreground mb-3">
            Skills are Claude Code slash commands that automate parts of the build process.
            Select the ones you have installed. You can always add more later.
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {AVAILABLE_SKILLS.map((skill) => {
              const selected = selectedSkills.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                    selected
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border bg-card hover:border-accent/30"
                  )}
                >
                  <span className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selected ? "border-accent bg-accent text-white" : "border-border"
                  )}>
                    {selected && <Check className="size-3" />}
                  </span>
                  <div>
                    <span className="text-[12px] font-mono font-medium text-foreground">{skill.label}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">{skill.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: "Services",
      subtitle: "Which services do you use?",
      content: (
        <div className="space-y-2">
          <p className="text-[12px] text-muted-foreground mb-3">
            The playbook includes guidance for these services. Select the ones you use or plan to use.
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {SERVICE_OPTIONS.map((service) => {
              const selected = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                    selected
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border bg-card hover:border-accent/30"
                  )}
                >
                  <span className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selected ? "border-accent bg-accent text-white" : "border-border"
                  )}>
                    {selected && <Check className="size-3" />}
                  </span>
                  <div>
                    <span className="text-[12px] font-medium text-foreground">{service.label}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">{service.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
          <Rocket className="size-6 text-accent" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Welcome to LaunchPad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s set up your profile so the playbook works for your stack.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              step === i
                ? "bg-foreground text-background"
                : i < step
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {i < step ? <Check className="size-3" /> : <span>{i + 1}</span>}
            {s.title}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-[14px] font-semibold text-foreground">{steps[step].title}</h2>
          <p className="text-[12px] text-muted-foreground">{steps[step].subtitle}</p>
        </div>

        {steps[step].content}

        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !githubUsername.trim()}
              className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !githubUsername.trim()}
              className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="size-4 animate-spin" />Saving...</>
              ) : (
                <><Rocket className="size-4" />Complete Setup</>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        You can change these settings anytime from the Settings page.
      </p>
    </div>
  );
}
