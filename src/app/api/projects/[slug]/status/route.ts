import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("launchdeck_projects")
    .select("links")
    .eq("slug", slug)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result: {
    vercel: { status: string; url: string; updatedAt: string } | null;
    github: { lastCommit: string; lastCommitMessage: string; openPRs: number } | null;
  } = { vercel: null, github: null };

  // Fetch Vercel deployment status
  if (VERCEL_TOKEN && project.links?.vercel_url) {
    try {
      // Extract project name from vercel URL
      const vercelUrl = project.links.vercel_url as string;
      const projectName = vercelUrl.split("/").pop() || slug;

      const res = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${projectName}&limit=1&target=production&teamId=${VERCEL_TEAM_ID}`,
        { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }, next: { revalidate: 300 } }
      );

      if (res.ok) {
        const data = await res.json();
        const deployment = data.deployments?.[0];
        if (deployment) {
          result.vercel = {
            status: deployment.readyState || deployment.state || "unknown",
            url: `https://${deployment.url}`,
            updatedAt: deployment.createdAt ? new Date(deployment.createdAt).toISOString() : "",
          };
        }
      }
    } catch { /* silent */ }
  }

  // Fetch GitHub last commit
  if (GITHUB_TOKEN && project.links?.github_url) {
    try {
      const githubUrl = project.links.github_url as string;
      const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match) {
        const repo = match[1];

        // Last commit
        const commitRes = await fetch(
          `https://api.github.com/repos/${repo}/commits?per_page=1`,
          { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }, next: { revalidate: 300 } }
        );

        if (commitRes.ok) {
          const commits = await commitRes.json();
          if (commits[0]) {
            result.github = {
              lastCommit: commits[0].commit?.committer?.date || "",
              lastCommitMessage: commits[0].commit?.message?.split("\n")[0] || "",
              openPRs: 0,
            };
          }
        }

        // Open PRs
        const prRes = await fetch(
          `https://api.github.com/repos/${repo}/pulls?state=open&per_page=1`,
          { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }, next: { revalidate: 300 } }
        );

        if (prRes.ok && result.github) {
          // GitHub returns Link header with total count
          const linkHeader = prRes.headers.get("link");
          const prs = await prRes.json();
          result.github.openPRs = prs.length;
        }
      }
    } catch { /* silent */ }
  }

  return NextResponse.json(result);
}
