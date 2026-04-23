import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

function verify(req: NextRequest): boolean {
  const h = req.headers.get("authorization");
  return !!h && h === `Bearer ${process.env.CRON_SECRET}`;
}

type Project = {
  id: string;
  slug: string;
  name: string;
  icon_emoji: string | null;
  stage: string;
  health: string | null;
};

type Feature = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

type Launch = {
  id: string;
  product_name: string;
  launch_date: string | null;
  status: string | null;
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function formatTelegram(payload: {
  date: string;
  projects: Project[];
  shipped: Array<Feature & { project: Project }>;
  inProgress: Array<Feature & { project: Project }>;
  upNext: Array<Feature & { project: Project }>;
  launches: Launch[];
}): string {
  const { date, projects, shipped, inProgress, upNext, launches } = payload;
  const lines: string[] = [];

  lines.push(`<b>Weekly digest — ${date}</b>`);

  const active = projects.filter(
    (p) => !["archived", "shipped", "killed"].includes(p.stage),
  );
  const green = active.filter((p) => p.health === "green").length;
  const yellow = active.filter((p) => p.health === "yellow").length;
  const red = active.filter((p) => p.health === "red").length;
  const chips: string[] = [`${active.length} active`];
  if (green) chips.push(`${green} green`);
  if (yellow) chips.push(`${yellow} yellow`);
  if (red) chips.push(`${red} red`);
  lines.push(`<i>${chips.join(" · ")}</i>`);
  lines.push("");

  if (shipped.length > 0) {
    lines.push(`<b>🚀 Shipped this week (${shipped.length})</b>`);
    shipped.slice(0, 10).forEach((f) => {
      const emoji = f.project.icon_emoji ?? "·";
      lines.push(`${emoji} <b>${esc(f.project.name)}:</b> ${esc(f.title)}`);
    });
    if (shipped.length > 10) {
      lines.push(`<i>…and ${shipped.length - 10} more</i>`);
    }
    lines.push("");
  }

  if (inProgress.length > 0) {
    lines.push(`<b>⚙️ In progress</b>`);
    inProgress.slice(0, 5).forEach((f) => {
      const emoji = f.project.icon_emoji ?? "·";
      lines.push(`${emoji} <b>${esc(f.project.name)}:</b> ${esc(f.title)}`);
    });
    lines.push("");
  }

  if (upNext.length > 0) {
    lines.push(`<b>🎯 Up next (high priority)</b>`);
    upNext.slice(0, 5).forEach((f) => {
      const emoji = f.project.icon_emoji ?? "·";
      lines.push(`${emoji} <b>${esc(f.project.name)}:</b> ${esc(f.title)}`);
    });
    lines.push("");
  }

  const upcomingLaunches = launches
    .filter((l) => l.launch_date && daysUntil(l.launch_date) >= -1 && daysUntil(l.launch_date) <= 14)
    .sort((a, b) => a.launch_date!.localeCompare(b.launch_date!));
  if (upcomingLaunches.length > 0) {
    lines.push(`<b>📅 Launches in the next 2 weeks</b>`);
    upcomingLaunches.forEach((l) => {
      const days = daysUntil(l.launch_date!);
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`;
      lines.push(`• <b>${esc(l.product_name)}</b> (${when})`);
    });
    lines.push("");
  }

  if (shipped.length === 0 && inProgress.length === 0 && upNext.length === 0) {
    lines.push("No activity on public work this week.");
    lines.push("");
  }

  lines.push("Open: https://launchpad-six-tau.vercel.app/dashboard");
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!verify(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const weekAgoIso = new Date(now.getTime() - 7 * 86400000).toISOString();
  const date = now.toISOString().slice(0, 10);

  const [projectsRes, shippedRes, inProgressRes, upNextRes, launchesRes] =
    await Promise.all([
      admin
        .from("launchdeck_projects")
        .select("id,slug,name,icon_emoji,stage,health"),
      admin
        .from("launchdeck_features")
        .select("id,project_id,title,status,priority,completed_at,updated_at")
        .eq("status", "done")
        .gte("completed_at", weekAgoIso)
        .order("completed_at", { ascending: false })
        .limit(40),
      admin
        .from("launchdeck_features")
        .select("id,project_id,title,status,priority,completed_at,updated_at")
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(20),
      admin
        .from("launchdeck_features")
        .select("id,project_id,title,status,priority,completed_at,updated_at")
        .eq("status", "backlog")
        .eq("priority", "high")
        .order("updated_at", { ascending: false })
        .limit(20),
      admin
        .from("launches")
        .select("id,product_name,launch_date,status")
        .limit(50),
    ]);

  const projects: Project[] = (projectsRes.data ?? []) as Project[];
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const activeIds = new Set(
    projects
      .filter((p) => !["archived", "shipped", "killed"].includes(p.stage))
      .map((p) => p.id),
  );

  function attach(list: Feature[]): Array<Feature & { project: Project }> {
    return list
      .filter((f) => activeIds.has(f.project_id))
      .map((f) => {
        const project = projectById.get(f.project_id);
        if (!project) return null;
        return { ...f, project };
      })
      .filter((x): x is Feature & { project: Project } => x !== null);
  }

  const shipped = attach((shippedRes.data ?? []) as Feature[]);
  const inProgress = attach((inProgressRes.data ?? []) as Feature[]);
  const upNext = attach((upNextRes.data ?? []) as Feature[]);
  const launches = (launchesRes.data ?? []) as Launch[];

  const text = formatTelegram({
    date,
    projects,
    shipped,
    inProgress,
    upNext,
    launches,
  });

  const chatId =
    process.env.WEEKLY_DIGEST_TELEGRAM_CHAT_ID ||
    process.env.MORNING_BRIEF_TELEGRAM_CHAT_ID;

  let telegram_message_id: number | undefined;
  let telegram_error: string | undefined;
  if (chatId) {
    const result = await sendTelegramMessage({
      chatId,
      text,
      parseMode: "HTML",
    });
    if (result.ok) telegram_message_id = result.message_id;
    else telegram_error = result.error;
  }

  return NextResponse.json({
    ok: true,
    date,
    stats: {
      active: activeIds.size,
      shipped: shipped.length,
      in_progress: inProgress.length,
      up_next: upNext.length,
      launches_upcoming: launches.filter(
        (l) =>
          l.launch_date &&
          daysUntil(l.launch_date) >= -1 &&
          daysUntil(l.launch_date) <= 14,
      ).length,
    },
    telegram_message_id,
    telegram_error,
  });
}
