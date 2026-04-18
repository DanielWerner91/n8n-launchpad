import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Rocket, Activity as ActivityIcon, Check, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

type PublicProject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  logo_url: string | null;
  stage: string;
  health: string;
  health_score: number;
  public_tagline: string | null;
  created_at: string;
  updated_at: string;
  labels: string[];
  links: { github_url?: string; vercel_url?: string; live_url?: string };
};

async function loadPublicProject(slug: string) {
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select(
      "id,slug,name,description,icon_emoji,logo_url,stage,health,health_score,public_tagline,created_at,updated_at,labels,links",
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (!project) return null;

  const p = project as PublicProject;

  const [features, checklist, activity] = await Promise.all([
    supabase
      .from("launchdeck_features")
      .select("id,title,description,status,priority,completed_at")
      .eq("project_id", p.id)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("launchdeck_checklist_items")
      .select("is_completed")
      .eq("project_id", p.id),
    supabase
      .from("launchdeck_activity_log")
      .select("action,created_at,source")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const checklistTotal = checklist.data?.length ?? 0;
  const checklistDone = checklist.data?.filter((c) => c.is_completed).length ?? 0;

  return {
    project: p,
    features: features.data ?? [],
    activity: activity.data ?? [],
    checklist: { total: checklistTotal, done: checklistDone },
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const payload = await loadPublicProject(slug);
  if (!payload) return { title: "Not found" };
  const p = payload.project;
  const title = `${p.name} — building in public`;
  const desc = p.public_tagline || p.description || `${p.name}: currently in ${p.stage}.`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    twitter: { title, description: desc, card: "summary_large_image" },
    alternates: { canonical: `/p/${slug}` },
  };
}

const stageLabel: Record<string, string> = {
  idea: "Idea",
  research: "Research",
  build: "Building",
  deploy: "Deploying",
  live: "Live",
  scaling: "Scaling",
  archived: "Archived",
};

const stageDot: Record<string, string> = {
  idea: "bg-neutral-400",
  research: "bg-blue-500",
  build: "bg-violet-500",
  deploy: "bg-orange-500",
  live: "bg-emerald-500",
  scaling: "bg-indigo-500",
  archived: "bg-neutral-300",
};

const healthClass: Record<string, string> = {
  green: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-red-600",
};

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await loadPublicProject(slug);
  if (!payload) notFound();

  const { project, features, activity, checklist } = payload;
  const done = features.filter((f) => f.status === "done");
  const inProgress = features.filter((f) => f.status === "in_progress");
  const backlog = features.filter((f) => f.status === "backlog");

  const daysBuilding = Math.floor(
    (Date.now() - new Date(project.created_at).getTime()) / 86400000,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
            <Rocket className="size-4" /> LaunchPad
          </Link>
          <div className="text-[11px] text-muted-foreground">Building in public</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10">
        <section>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{project.icon_emoji || "🚀"}</div>
            <div className="flex-1">
              <h1 className="text-[28px] font-semibold tracking-tight">{project.name}</h1>
              {project.public_tagline && (
                <p className="mt-1 text-[15px] text-muted-foreground">{project.public_tagline}</p>
              )}
              {project.description && (
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${stageDot[project.stage] ?? "bg-neutral-400"}`} />
              <span className="font-medium">{stageLabel[project.stage] ?? project.stage}</span>
            </div>
            <div className={`font-medium ${healthClass[project.health] ?? "text-muted-foreground"}`}>
              Health {project.health_score}/100
            </div>
            <div className="text-muted-foreground">
              Day {daysBuilding} of building
            </div>
            {checklist.total > 0 && (
              <div className="text-muted-foreground">
                {checklist.done} / {checklist.total} checklist complete
              </div>
            )}
          </div>

          {(project.links?.live_url || project.links?.github_url) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.links?.live_url && (
                <a
                  href={project.links.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90"
                >
                  Visit live site
                </a>
              )}
              {project.links?.github_url && (
                <a
                  href={project.links.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-muted"
                >
                  GitHub
                </a>
              )}
            </div>
          )}
        </section>

        {(done.length > 0 || inProgress.length > 0) && (
          <section className="space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              What has shipped
            </h2>
            {inProgress.length > 0 && (
              <div className="space-y-2">
                {inProgress.map((f) => (
                  <div key={f.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3">
                    <Clock className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                    <div>
                      <div className="text-[13px] font-medium">{f.title}</div>
                      {f.description && (
                        <div className="mt-0.5 text-[12px] text-muted-foreground">{f.description}</div>
                      )}
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-blue-600">In progress</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {done.length > 0 && (
              <ul className="space-y-1.5">
                {done.slice(0, 15).map((f) => (
                  <li key={f.id} className="flex items-start gap-2 text-[13px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>{f.title}</span>
                  </li>
                ))}
                {done.length > 15 && (
                  <li className="pl-5 text-[11px] text-muted-foreground">
                    and {done.length - 15} more
                  </li>
                )}
              </ul>
            )}
          </section>
        )}

        {backlog.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Coming next ({backlog.length})
            </h2>
            <ul className="space-y-1 text-[13px]">
              {backlog.slice(0, 10).map((f) => (
                <li key={f.id} className="text-muted-foreground">• {f.title}</li>
              ))}
            </ul>
          </section>
        )}

        {activity.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ActivityIcon className="size-3" />
              Activity feed
            </h2>
            <ul className="space-y-2">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-[12px]">
                  <span className="text-foreground">{a.action}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-6 text-[11px] text-muted-foreground">
          Ship log powered by{" "}
          <Link href="/" className="font-medium text-foreground hover:underline">
            LaunchPad
          </Link>
          . Last updated {new Date(project.updated_at).toLocaleDateString()}.
        </div>
      </footer>
    </div>
  );
}
