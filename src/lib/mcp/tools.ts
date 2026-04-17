import { createAdminClient } from "@/lib/supabase/admin";

type Supa = ReturnType<typeof createAdminClient>;

type Ctx = { supabase: Supa; userId: string };

export type McpTool = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

type Executor = (ctx: Ctx, input: Record<string, unknown>) => Promise<unknown>;

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t : undefined;
}

async function getProjectId(ctx: Ctx, slug: string): Promise<string | null> {
  const { data } = await ctx.supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

const TOOLS: Array<{ tool: McpTool; execute: Executor }> = [
  {
    tool: {
      name: "list_projects",
      description:
        "List the authenticated user's LaunchPad projects with stage, health, priority, and slug. Use to survey the portfolio or find a project by name.",
      inputSchema: {
        type: "object",
        properties: {
          stage: { type: "string", enum: ["idea", "research", "build", "deploy", "live", "scaling", "archived"] },
          health: { type: "string", enum: ["green", "yellow", "red"] },
          limit: { type: "number" },
        },
      },
    },
    async execute(ctx, input) {
      const stage = str(input.stage);
      const health = str(input.health);
      const limit = typeof input.limit === "number" ? Math.min(input.limit, 200) : 100;
      let q = ctx.supabase
        .from("launchdeck_projects")
        .select(
          "id,slug,name,description,stage,health,health_score,priority,labels,due_date,updated_at",
        )
        .eq("user_id", ctx.userId)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (stage) q = q.eq("stage", stage);
      if (health) q = q.eq("health", health);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
  {
    tool: {
      name: "get_project",
      description:
        "Get full detail for one LaunchPad project: metadata + checklist + features + audits + recent activity.",
      inputSchema: {
        type: "object",
        required: ["slug"],
        properties: { slug: { type: "string" } },
      },
    },
    async execute(ctx, input) {
      const slug = str(input.slug);
      if (!slug) throw new Error("slug is required");
      const { data: project } = await ctx.supabase
        .from("launchdeck_projects")
        .select("*")
        .eq("user_id", ctx.userId)
        .eq("slug", slug)
        .maybeSingle();
      if (!project) return { error: "Project not found" };
      const [checklist, features, audits, activity] = await Promise.all([
        ctx.supabase
          .from("launchdeck_checklist_items")
          .select("id,category,label,is_completed,stage,sort_order")
          .eq("project_id", project.id)
          .order("sort_order"),
        ctx.supabase
          .from("launchdeck_features")
          .select("id,title,description,status,priority,source,created_at")
          .eq("project_id", project.id)
          .order("status")
          .order("created_at", { ascending: false }),
        ctx.supabase
          .from("launchdeck_audits")
          .select("id,audit_type,last_completed_at,next_due_at,is_overdue")
          .eq("project_id", project.id),
        ctx.supabase
          .from("launchdeck_activity_log")
          .select("action,source,created_at")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      return {
        project,
        checklist: checklist.data ?? [],
        features: features.data ?? [],
        audits: audits.data ?? [],
        recent_activity: activity.data ?? [],
      };
    },
  },
  {
    tool: {
      name: "list_features",
      description:
        "List features for a project. Filter by status (backlog, in_progress, done).",
      inputSchema: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
          status: { type: "string", enum: ["backlog", "in_progress", "done"] },
        },
      },
    },
    async execute(ctx, input) {
      const slug = str(input.slug);
      if (!slug) throw new Error("slug is required");
      const pid = await getProjectId(ctx, slug);
      if (!pid) return { error: "Project not found" };
      let q = ctx.supabase
        .from("launchdeck_features")
        .select("id,title,description,status,priority,source,sort_order,created_at")
        .eq("project_id", pid)
        .order("status")
        .order("sort_order")
        .order("created_at", { ascending: false });
      const status = str(input.status);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
  {
    tool: {
      name: "create_feature",
      description:
        "Add a feature to a project's backlog. Captures ideas, improvements, or TODOs. Sets source='mcp'.",
      inputSchema: {
        type: "object",
        required: ["slug", "title"],
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          status: { type: "string", enum: ["backlog", "in_progress", "done"] },
        },
      },
    },
    async execute(ctx, input) {
      const slug = str(input.slug);
      const title = str(input.title);
      if (!slug || !title) throw new Error("slug and title are required");
      const pid = await getProjectId(ctx, slug);
      if (!pid) return { error: "Project not found" };
      const { data, error } = await ctx.supabase
        .from("launchdeck_features")
        .insert({
          project_id: pid,
          title,
          description: str(input.description) ?? null,
          status: str(input.status) ?? "backlog",
          priority: str(input.priority) ?? null,
          source: "mcp",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await ctx.supabase.from("launchdeck_activity_log").insert({
        project_id: pid,
        action: `Feature added: ${title}`,
        details: { title, via: "mcp" },
        source: "mcp",
      });
      return data;
    },
  },
  {
    tool: {
      name: "update_feature",
      description:
        "Update a feature's status, priority, title, or description by feature_id.",
      inputSchema: {
        type: "object",
        required: ["feature_id"],
        properties: {
          feature_id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["backlog", "in_progress", "done"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        },
      },
    },
    async execute(ctx, input) {
      const featureId = str(input.feature_id);
      if (!featureId) throw new Error("feature_id is required");
      const { data: feature } = await ctx.supabase
        .from("launchdeck_features")
        .select("id,project_id")
        .eq("id", featureId)
        .maybeSingle();
      if (!feature) return { error: "Feature not found" };
      const { data: proj } = await ctx.supabase
        .from("launchdeck_projects")
        .select("user_id")
        .eq("id", feature.project_id)
        .maybeSingle();
      if (!proj || proj.user_id !== ctx.userId) return { error: "Forbidden" };
      const patch: Record<string, unknown> = {};
      if (str(input.title)) patch.title = str(input.title);
      if (typeof input.description === "string") patch.description = input.description.trim() || null;
      if (str(input.status)) {
        patch.status = str(input.status);
        if (input.status === "done") patch.completed_at = new Date().toISOString();
      }
      if (str(input.priority)) patch.priority = str(input.priority);
      if (Object.keys(patch).length === 0) return { error: "No fields to update" };
      const { data, error } = await ctx.supabase
        .from("launchdeck_features")
        .update(patch)
        .eq("id", featureId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    tool: {
      name: "update_project",
      description:
        "Update a project's stage, health, priority, description, or due date.",
      inputSchema: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
          stage: {
            type: "string",
            enum: ["idea", "research", "build", "deploy", "live", "scaling", "archived"],
          },
          health: { type: "string", enum: ["green", "yellow", "red"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          description: { type: "string" },
          due_date: { type: "string", description: "ISO date YYYY-MM-DD or empty string to clear." },
        },
      },
    },
    async execute(ctx, input) {
      const slug = str(input.slug);
      if (!slug) throw new Error("slug is required");
      const patch: Record<string, unknown> = {};
      if (str(input.stage)) patch.stage = str(input.stage);
      if (str(input.health)) patch.health = str(input.health);
      if (str(input.priority)) patch.priority = str(input.priority);
      if (typeof input.description === "string") patch.description = input.description;
      if (typeof input.due_date === "string") patch.due_date = input.due_date || null;
      if (Object.keys(patch).length === 0) return { error: "No fields to update" };
      const { data, error } = await ctx.supabase
        .from("launchdeck_projects")
        .update(patch)
        .eq("user_id", ctx.userId)
        .eq("slug", slug)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    tool: {
      name: "toggle_checklist_item",
      description: "Mark a checklist item complete or incomplete by item_id.",
      inputSchema: {
        type: "object",
        required: ["item_id", "is_completed"],
        properties: {
          item_id: { type: "string" },
          is_completed: { type: "boolean" },
        },
      },
    },
    async execute(ctx, input) {
      const itemId = str(input.item_id);
      if (!itemId) throw new Error("item_id is required");
      const { data: item } = await ctx.supabase
        .from("launchdeck_checklist_items")
        .select("id,project_id")
        .eq("id", itemId)
        .maybeSingle();
      if (!item) return { error: "Checklist item not found" };
      const { data: proj } = await ctx.supabase
        .from("launchdeck_projects")
        .select("user_id")
        .eq("id", item.project_id)
        .maybeSingle();
      if (!proj || proj.user_id !== ctx.userId) return { error: "Forbidden" };

      const is_completed = Boolean(input.is_completed);
      const patch = {
        is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
      };
      const { data, error } = await ctx.supabase
        .from("launchdeck_checklist_items")
        .update(patch)
        .eq("id", itemId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    tool: {
      name: "list_launches",
      description:
        "List the user's launch plans (product_name, niche, status, launch_timeline).",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
    },
    async execute(ctx, input) {
      const limit = typeof input.limit === "number" ? Math.min(input.limit, 200) : 100;
      const { data, error } = await ctx.supabase
        .from("launches")
        .select("id,app_name,niche,status,launch_timeline,created_at")
        .eq("user_id", ctx.userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
];

export function listMcpTools(): McpTool[] {
  return TOOLS.map((t) => t.tool);
}

export async function callMcpTool(
  userId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> {
  const entry = TOOLS.find((t) => t.tool.name === name);
  if (!entry) return { ok: false, error: `Unknown tool: ${name}` };
  try {
    const ctx: Ctx = { supabase: createAdminClient(), userId };
    const result = await entry.execute(ctx, input);
    return { ok: true, result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Tool execution failed",
    };
  }
}
