import type { Metadata } from "next";
import Link from "next/link";
import { Check, Rocket } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Recently shipped features across projects built in public with LaunchPad.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "LaunchPad Changelog",
    description:
      "Recently shipped features across projects built in public with LaunchPad.",
    type: "website",
  },
};

type ShippedFeature = {
  id: string;
  title: string;
  description: string | null;
  completed_at: string | null;
  created_at: string;
  priority: string | null;
  project: {
    slug: string;
    name: string;
    icon_emoji: string | null;
  };
};

type MonthGroup = {
  key: string;
  label: string;
  items: ShippedFeature[];
};

async function loadShipped(): Promise<ShippedFeature[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("launchdeck_features")
    .select(
      "id,title,description,completed_at,created_at,priority,status,launchdeck_projects!inner(slug,name,icon_emoji,is_public)",
    )
    .eq("status", "done")
    .eq("launchdeck_projects.is_public", true)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(300);

  if (!data) return [];

  return data.map((row) => {
    const proj = row.launchdeck_projects as unknown as {
      slug: string;
      name: string;
      icon_emoji: string | null;
    };
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed_at: row.completed_at,
      created_at: row.created_at,
      priority: row.priority,
      project: proj,
    };
  });
}

function groupByMonth(items: ShippedFeature[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const item of items) {
    const iso = item.completed_at || item.created_at;
    const d = new Date(iso);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    groups.get(key)!.items.push(item);
  }
  return Array.from(groups.values()).sort((a, b) => (a.key > b.key ? -1 : 1));
}

export default async function ChangelogPage() {
  const shipped = await loadShipped();
  const months = groupByMonth(shipped);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LaunchPad Changelog",
    description:
      "Recently shipped features across projects built in public with LaunchPad.",
    hasPart: shipped.slice(0, 50).map((f) => ({
      "@type": "CreativeWork",
      name: f.title,
      about: f.project.name,
      datePublished: f.completed_at || f.created_at,
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
              <Rocket className="size-3" />
              Changelog
            </div>
            <h1 className="text-[32px] font-semibold tracking-tight">
              What shipped
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Recently shipped features across projects built in public with LaunchPad.{" "}
              <Link href="/roadmap" className="font-medium text-foreground underline-offset-2 hover:underline">
                See what&apos;s coming next →
              </Link>
            </p>
          </div>

          {months.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="text-[14px] font-medium">No public ship log yet</div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Public changelog entries appear here when a project is marked public and features are shipped.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {months.map((group) => (
                <section key={group.key}>
                  <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h2>
                  <ul className="space-y-3">
                    {group.items.map((f) => (
                      <li
                        key={f.id}
                        className="rounded-lg border border-border bg-card p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-[14px] font-medium">{f.title}</span>
                              <Link
                                href={`/p/${f.project.slug}`}
                                className="text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                {f.project.icon_emoji || "🚀"} {f.project.name}
                              </Link>
                            </div>
                            {f.description && (
                              <p className="mt-1 text-[13px] text-muted-foreground">
                                {f.description}
                              </p>
                            )}
                            {(f.completed_at || f.created_at) && (
                              <time
                                dateTime={f.completed_at || f.created_at}
                                className="mt-1.5 block text-[11px] text-muted-foreground"
                              >
                                {new Date(
                                  f.completed_at || f.created_at,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  timeZone: "UTC",
                                })}
                              </time>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
