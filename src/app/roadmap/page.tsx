import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Circle, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What's coming next across projects built in public with LaunchPad.",
  alternates: { canonical: "/roadmap" },
  openGraph: {
    title: "LaunchPad Roadmap",
    description:
      "What's coming next across projects built in public with LaunchPad.",
    type: "website",
  },
};

type RoadmapFeature = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  project: {
    slug: string;
    name: string;
    icon_emoji: string | null;
  };
};

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

async function loadRoadmap(): Promise<RoadmapFeature[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("launchdeck_features")
    .select(
      "id,title,description,status,priority,sort_order,created_at,launchdeck_projects!inner(slug,name,icon_emoji,is_public)",
    )
    .in("status", ["in_progress", "backlog"])
    .eq("launchdeck_projects.is_public", true)
    .order("status", { ascending: true })
    .limit(400);

  if (!data) return [];

  const rows = data.map((row) => {
    const proj = row.launchdeck_projects as unknown as {
      slug: string;
      name: string;
      icon_emoji: string | null;
    };
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      project: proj,
    };
  });

  rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1;
    const pa = priorityRank[a.priority ?? ""] ?? 99;
    const pb = priorityRank[b.priority ?? ""] ?? 99;
    return pa - pb;
  });

  return rows;
}

export default async function RoadmapPage() {
  const features = await loadRoadmap();
  const inProgress = features.filter((f) => f.status === "in_progress");
  const next = features.filter((f) => f.status === "backlog" && f.priority === "high");
  const later = features.filter(
    (f) => f.status === "backlog" && f.priority !== "high",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LaunchPad Roadmap",
    description:
      "What's coming next across projects built in public with LaunchPad.",
    hasPart: features.slice(0, 50).map((f) => ({
      "@type": "CreativeWork",
      name: f.title,
      about: f.project.name,
      ...(f.description ? { description: f.description } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="mb-10">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3" />
              Roadmap
            </div>
            <h1 className="text-[32px] font-semibold tracking-tight">
              What&apos;s coming
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Work in progress and the next priorities across projects built in public.{" "}
              <Link
                href="/changelog"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                See what already shipped →
              </Link>
            </p>
          </div>

          {features.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="text-[14px] font-medium">No public roadmap yet</div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Roadmap items appear here when a project is marked public and work is in flight or planned.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {inProgress.length > 0 && (
                <Section
                  title="In progress"
                  count={inProgress.length}
                  items={inProgress}
                  icon="progress"
                />
              )}
              {next.length > 0 && (
                <Section
                  title="Up next"
                  count={next.length}
                  items={next}
                  icon="next"
                />
              )}
              {later.length > 0 && (
                <Section
                  title="Later"
                  count={later.length}
                  items={later}
                  icon="later"
                />
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({
  title,
  count,
  items,
  icon,
}: {
  title: string;
  count: number;
  items: RoadmapFeature[];
  icon: "progress" | "next" | "later";
}) {
  const Icon = icon === "progress" ? Clock : Circle;
  const iconClass =
    icon === "progress"
      ? "text-blue-600"
      : icon === "next"
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <span className="text-[11px] text-muted-foreground">{count}</span>
      </div>
      <ul className="space-y-3">
        {items.map((f) => (
          <li key={f.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[14px] font-medium">{f.title}</span>
                  <Link
                    href={`/p/${f.project.slug}`}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {f.project.icon_emoji || "🚀"} {f.project.name}
                  </Link>
                  {f.priority && (
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        f.priority === "high"
                          ? "text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      {f.priority}
                    </span>
                  )}
                </div>
                {f.description && (
                  <p className="mt-1 text-[13px] text-muted-foreground line-clamp-3">
                    {f.description}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
