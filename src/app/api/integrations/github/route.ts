import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

type ActivityEntry = {
  project_id: string;
  action: string;
  details: Record<string, unknown>;
  source: string;
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function repoFullName(payload: Record<string, unknown>): string | null {
  const repo = payload.repository as { full_name?: string } | undefined;
  return repo?.full_name ?? null;
}

function normalizeGithubUrl(url: string): string {
  return url.toLowerCase().replace(/\.git$/, "").replace(/\/$/, "");
}

async function findProjectByRepo(
  admin: ReturnType<typeof createAdminClient>,
  fullName: string,
): Promise<{ id: string; slug: string } | null> {
  const candidates = [
    `https://github.com/${fullName}`,
    `https://github.com/${fullName}.git`,
    `git@github.com:${fullName}.git`,
  ].map(normalizeGithubUrl);

  const { data } = await admin
    .from("launchdeck_projects")
    .select("id, slug, links");

  if (!data) return null;

  for (const project of data) {
    const links = (project.links ?? {}) as Record<string, unknown>;
    for (const key of ["github_url", "repo_url"]) {
      const raw = links[key];
      if (typeof raw !== "string") continue;
      if (candidates.includes(normalizeGithubUrl(raw))) {
        return { id: project.id as string, slug: project.slug as string };
      }
    }
  }
  return null;
}

function buildPushEntries(
  projectId: string,
  payload: Record<string, unknown>,
): ActivityEntry[] {
  const ref = typeof payload.ref === "string" ? payload.ref : "";
  const commits = Array.isArray(payload.commits)
    ? (payload.commits as Array<{ id?: string; message?: string; url?: string; author?: { name?: string } }>)
    : [];
  if (commits.length === 0) return [];
  const branch = ref.replace(/^refs\/heads\//, "");

  return [
    {
      project_id: projectId,
      action: "github_push",
      source: "github",
      details: {
        branch,
        commit_count: commits.length,
        commits: commits.slice(0, 5).map((c) => ({
          sha: typeof c.id === "string" ? c.id.slice(0, 7) : undefined,
          message: (c.message ?? "").split("\n", 1)[0].slice(0, 140),
          author: c.author?.name ?? null,
          url: c.url ?? null,
        })),
      },
    },
  ];
}

function buildPullRequestEntries(
  projectId: string,
  payload: Record<string, unknown>,
): ActivityEntry[] {
  const action = typeof payload.action === "string" ? payload.action : "";
  const pr = payload.pull_request as
    | {
        number?: number;
        title?: string;
        html_url?: string;
        merged?: boolean;
        user?: { login?: string };
      }
    | undefined;
  if (!pr) return [];

  let verb: string;
  if (action === "opened") verb = "github_pr_opened";
  else if (action === "closed") verb = pr.merged ? "github_pr_merged" : "github_pr_closed";
  else if (action === "reopened") verb = "github_pr_reopened";
  else return [];

  return [
    {
      project_id: projectId,
      action: verb,
      source: "github",
      details: {
        number: pr.number,
        title: (pr.title ?? "").slice(0, 200),
        url: pr.html_url ?? null,
        author: pr.user?.login ?? null,
      },
    },
  ];
}

function buildReleaseEntries(
  projectId: string,
  payload: Record<string, unknown>,
): ActivityEntry[] {
  if (payload.action !== "published") return [];
  const release = payload.release as
    | { tag_name?: string; name?: string; html_url?: string; prerelease?: boolean }
    | undefined;
  if (!release) return [];

  return [
    {
      project_id: projectId,
      action: "github_release_published",
      source: "github",
      details: {
        tag: release.tag_name ?? null,
        name: (release.name ?? release.tag_name ?? "").slice(0, 200),
        url: release.html_url ?? null,
        prerelease: !!release.prerelease,
      },
    },
  ];
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  const delivery = req.headers.get("x-github-delivery") ?? "";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event === "ping") {
    return NextResponse.json({ ok: true, pong: true, delivery });
  }

  const fullName = repoFullName(payload);
  if (!fullName) {
    return NextResponse.json({ ok: true, skipped: "no_repository" });
  }

  const admin = createAdminClient();
  const project = await findProjectByRepo(admin, fullName);
  if (!project) {
    return NextResponse.json({
      ok: true,
      skipped: "no_matching_project",
      repo: fullName,
    });
  }

  let entries: ActivityEntry[] = [];
  if (event === "push") entries = buildPushEntries(project.id, payload);
  else if (event === "pull_request")
    entries = buildPullRequestEntries(project.id, payload);
  else if (event === "release") entries = buildReleaseEntries(project.id, payload);
  else {
    return NextResponse.json({
      ok: true,
      skipped: "event_not_tracked",
      event,
    });
  }

  if (entries.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no_actionable_entries", event });
  }

  const { error } = await admin.from("launchdeck_activity_log").insert(entries);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    project_slug: project.slug,
    event,
    written: entries.length,
  });
}
