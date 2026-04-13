"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  RefreshCw,
  Rocket,
  FileText,
  Zap,
  Calendar as CalendarIcon,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Launch, LaunchIntake, EnhancedGTMStrategy } from "@/lib/launches/types";
import { useStreaming } from "@/lib/launches/use-streaming";

const STEPS = [
  { label: "Details", icon: FileText },
  { label: "Infra", icon: Wrench },
  { label: "Date", icon: CalendarIcon },
  { label: "Strategy", icon: Zap },
  { label: "Review", icon: Rocket },
] as const;

const MONETIZATION_OPTIONS = [
  { value: "freemium", label: "Freemium" },
  { value: "one-time", label: "One-time purchase" },
  { value: "subscription", label: "Subscription" },
  { value: "ads", label: "Ad-supported" },
  { value: "marketplace", label: "Marketplace" },
];

const PRODUCT_STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "mvp", label: "MVP" },
  { value: "beta", label: "Beta" },
  { value: "live", label: "Live" },
];

export default function NewLaunchPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [intake, setIntake] = useState<LaunchIntake>({
    app_name: "",
    app_description: "",
    niche: "",
    problem: "",
    monetization: "",
    price: "",
    differentiator: "",
    app_url: "",
    launch_timeline: "",
    product_url: "",
    product_status: "",
    pricing_model: "",
    budget: "",
    hours_per_week: "",
    has_audience: false,
    audience_details: "",
    launch_target_date: "",
    github_repo: "",
    domain: "",
    needs_payments: true,
    needs_auth: true,
    needs_newsletter: false,
    needs_mobile: false,
  });

  const [launchId, setLaunchId] = useState<string | null>(null);

  const {
    text: strategyText,
    isStreaming: strategyStreaming,
    stream: streamStrategy,
  } = useStreaming();
  const [strategySummary, setStrategySummary] = useState<EnhancedGTMStrategy | null>(null);
  const [strategyDone, setStrategyDone] = useState(false);
  const [tasksGenerated, setTasksGenerated] = useState<number | null>(null);

  const updateIntake = useCallback(
    (field: keyof LaunchIntake, value: string | boolean) => {
      setIntake((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const intakeValid =
    intake.app_name.trim() !== "" &&
    intake.app_description.trim() !== "" &&
    intake.niche.trim() !== "" &&
    intake.problem.trim() !== "" &&
    intake.monetization !== "" &&
    intake.differentiator.trim() !== "";

  async function saveLaunch() {
    setSaving(true);
    try {
      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...intake,
          launch_target_date: intake.launch_target_date || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create launch");
      const launch: Launch = await res.json();
      setLaunchId(launch.id);
      toast.success("Launch created");
      setStep(3);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function generateStrategy() {
    if (!launchId) return;
    setStrategyDone(false);
    setStrategySummary(null);
    setTasksGenerated(null);
    try {
      const fullText = await streamStrategy(`/api/launches/${launchId}/strategy`, {});
      try {
        const match = fullText.match(/\{[\s\S]*\}/);
        if (match) setStrategySummary(JSON.parse(match[0]) as EnhancedGTMStrategy);
      } catch { /* not pure JSON */ }
      const tasksMatch = fullText.match(/"tasks_generated":\s*(\d+)/);
      if (tasksMatch) setTasksGenerated(parseInt(tasksMatch[1]));
      setStrategyDone(true);
      toast.success("Strategy generated");
    } catch {
      toast.error("Strategy generation failed");
    }
  }

  function getPhasePreview() {
    if (!intake.launch_target_date) return null;
    const launch = new Date(intake.launch_target_date);
    return [
      { week: -4, label: "Account Setup", start: new Date(launch.getTime() - 28 * 86400000) },
      { week: -3, label: "Community Entry", start: new Date(launch.getTime() - 21 * 86400000) },
      { week: -2, label: "Content Seeding", start: new Date(launch.getTime() - 14 * 86400000) },
      { week: -1, label: "Final Prep & Directories", start: new Date(launch.getTime() - 7 * 86400000) },
      { week: 0, label: "Launch Week", start: launch },
      { week: 1, label: "Post-Launch Momentum", start: new Date(launch.getTime() + 7 * 86400000) },
      { week: 2, label: "Follow Up & SEO", start: new Date(launch.getTime() + 14 * 86400000) },
    ];
  }

  function handleNext() {
    if (step === 0) {
      if (!intakeValid) { toast.error("Please fill in all required fields"); return; }
      setStep(1);
      return;
    }
    if (step === 1) { setStep(2); return; } // Infra -> Date
    if (step === 2) { saveLaunch(); return; } // Date -> creates launch, jumps to strategy
    setStep((s) => Math.min(s + 1, 4));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Launch</h1>
        <p className="mt-1 text-sm text-muted-foreground">Full launch orchestration: strategy, tasks, content, and timeline.</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all", isActive && "border-accent bg-accent text-accent-foreground shadow-md", isDone && "border-accent bg-accent/10 text-accent", !isActive && !isDone && "border-border bg-card text-muted-foreground")}>
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={cn("text-xs font-medium", isActive && "text-accent", isDone && "text-foreground", !isActive && !isDone && "text-muted-foreground")}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", i < step ? "bg-accent" : "bg-border")} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Launch details</h2>
            <p className="text-sm text-muted-foreground mb-6">Tell us about your product for a comprehensive launch strategy.</p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">App name <span className="text-destructive">*</span></label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="e.g. ChessMind" value={intake.app_name} onChange={(e) => updateIntake("app_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Product status</label>
                  <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" value={intake.product_status} onChange={(e) => updateIntake("product_status", e.target.value)}>
                    <option value="">Select status</option>
                    {PRODUCT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description <span className="text-destructive">*</span></label>
                <textarea className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none" rows={3} placeholder="What your app does in 2-3 sentences" value={intake.app_description} onChange={(e) => updateIntake("app_description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Niche / Category <span className="text-destructive">*</span></label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="e.g. AI-powered chess training" value={intake.niche} onChange={(e) => updateIntake("niche", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Product URL</label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="https://your-app.com" value={intake.product_url} onChange={(e) => updateIntake("product_url", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">What problem does it solve? <span className="text-destructive">*</span></label>
                <textarea className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none" rows={2} placeholder="The pain point your product addresses" value={intake.problem} onChange={(e) => updateIntake("problem", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">What makes it different? <span className="text-destructive">*</span></label>
                <textarea className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none" rows={2} placeholder="Your unique angle vs existing solutions" value={intake.differentiator} onChange={(e) => updateIntake("differentiator", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Monetization <span className="text-destructive">*</span></label>
                  <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" value={intake.monetization} onChange={(e) => updateIntake("monetization", e.target.value)}>
                    <option value="">Select</option>
                    {MONETIZATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Price</label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="e.g. $9/mo" value={intake.price} onChange={(e) => updateIntake("price", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">App URL</label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="https://..." value={intake.app_url} onChange={(e) => updateIntake("app_url", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Infrastructure</h2>
            <p className="text-sm text-muted-foreground mb-6">Configure what your app needs. This shapes the full lifecycle task list.</p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">GitHub repo name</label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="n8n-my-app" value={intake.github_repo} onChange={(e) => updateIntake("github_repo", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Custom domain</label>
                  <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20" placeholder="myapp.com" value={intake.domain} onChange={(e) => updateIntake("domain", e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">What does this app need?</p>
                {[
                  { key: "needs_auth" as const, label: "Google Authentication (Supabase Auth)", desc: "OAuth login, session management, route protection" },
                  { key: "needs_payments" as const, label: "Payments (Lemon Squeezy)", desc: "Subscription checkout, webhook handler, subscription gating" },
                  { key: "needs_newsletter" as const, label: "Newsletter (Beehiiv + Content Flywheel)", desc: "Email publication, automated content digests" },
                  { key: "needs_mobile" as const, label: "Mobile App (Expo + App Store)", desc: "iOS + Android native app, push notifications, in-app purchases (RevenueCat)" },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-start gap-3">
                    <button
                      onClick={() => updateIntake(opt.key, !intake[opt.key])}
                      className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", intake[opt.key] ? "border-accent bg-accent" : "border-border")}
                    >
                      {intake[opt.key] && <Check className="h-3 w-3 text-accent-foreground" />}
                    </button>
                    <div>
                      <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => updateIntake(opt.key, !intake[opt.key])}>{opt.label}</label>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Launch date</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick your target launch date. We'll calculate a full 8-week timeline.</p>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Target launch date</label>
                <input type="date" className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" value={intake.launch_target_date} onChange={(e) => updateIntake("launch_target_date", e.target.value)} min={new Date().toISOString().split("T")[0]} />
                <p className="text-xs text-muted-foreground">Recommended: at least 4 weeks from today. Tue-Thu launches work best.</p>
              </div>
              {intake.launch_target_date && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Phase Preview</h3>
                  <div className="space-y-2">
                    {getPhasePreview()?.map((phase) => (
                      <div key={phase.week} className="flex items-center gap-3">
                        <div className={cn("w-14 text-center text-xs font-mono font-semibold py-1 rounded", phase.week === 0 ? "bg-accent text-accent-foreground" : phase.week < 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                          {phase.week === 0 ? "Launch" : `W${phase.week > 0 ? "+" : ""}${phase.week}`}
                        </div>
                        <span className="text-sm text-foreground">{phase.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {phase.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">GTM Strategy</h2>
            <p className="text-sm text-muted-foreground mb-6">Comprehensive go-to-market strategy with market analysis, channel playbooks, and timeline.</p>
            {!strategyText && !strategyStreaming && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-sm">Generate an elite launch strategy with market analysis, community playbooks, and an hour-by-hour launch day plan.</p>
                <button onClick={generateStrategy} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
                  <Sparkles className="h-4 w-4" /> Generate Strategy
                </button>
              </div>
            )}
            {(strategyStreaming || strategyText) && (
              <div className="space-y-4">
                {strategyStreaming && (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating comprehensive strategy...
                  </div>
                )}
                <pre className="max-h-96 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4 text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {strategyText}
                  {strategyStreaming && <span className="inline-block h-4 w-0.5 animate-pulse bg-accent ml-0.5" />}
                </pre>
                {strategyDone && strategySummary && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Positioning</p>
                      <p className="text-sm font-semibold text-foreground line-clamp-2">{strategySummary.positioning?.headline || "N/A"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Primary ICP</p>
                      <p className="text-sm font-semibold text-foreground line-clamp-2">{strategySummary.icp?.primary_user || "N/A"}</p>
                    </div>
                  </div>
                )}
                {tasksGenerated !== null && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm text-emerald-700"><Check className="inline mr-1 size-4" />{tasksGenerated} launch tasks generated and scheduled</p>
                  </div>
                )}
                {strategyDone && (
                  <button onClick={generateStrategy} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors mt-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Review & Launch</h2>
            <p className="text-sm text-muted-foreground mb-6">Your launch is set up. Head to the command center to start executing.</p>
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Product:</span> <span className="text-foreground font-medium">{intake.app_name}</span></div>
                {intake.launch_target_date && <div><span className="text-muted-foreground">Launch:</span> <span className="text-foreground font-medium">{new Date(intake.launch_target_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span></div>}
                <div><span className="text-muted-foreground">Strategy:</span> <span className={strategyDone ? "text-emerald-600 font-medium" : "text-amber-600"}>{strategyDone ? "Generated" : "Not generated"}</span></div>
                {tasksGenerated !== null && <div><span className="text-muted-foreground">Tasks:</span> <span className="text-emerald-600 font-medium">{tasksGenerated} scheduled</span></div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} className={cn("inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors", step === 0 && "invisible")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < 4 ? (
          <button onClick={handleNext} disabled={(step === 0 && !intakeValid) || saving || (step === 3 && strategyStreaming)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <>{step === 2 ? "Create Launch" : "Next"} <ArrowRight className="h-4 w-4" /></>}
          </button>
        ) : (
          <button onClick={() => launchId ? router.push(`/dashboard/launches/${launchId}`) : router.push("/dashboard/launches")} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
            <Rocket className="h-4 w-4" /> Open Command Center
          </button>
        )}
      </div>
    </div>
  );
}
