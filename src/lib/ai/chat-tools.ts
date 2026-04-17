import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

type Supa = SupabaseClient;

export type ToolExecutor = (supabase: Supa, input: Record<string, unknown>) => Promise<unknown>;

type ToolDef = {
  schema: Anthropic.Tool;
  execute: ToolExecutor;
};

function s(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

async function resolveProjectId(supabase: Supa, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("launchdeck_projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

export const CHAT_TOOLS: Record<string, ToolDef> = {
  list_projects: {
    schema: {
      name: "list_projects",
      description:
        "List the user's projects. Returns id, slug, name, description, stage, health, health_score, priority, labels, due_date, updated_at. Use to find a project by name or to survey the portfolio.",
      input_schema: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: ["idea", "research", "build", "deploy", "live", "scaling", "archived"],
            description: "Filter by stage. Omit to include all.",
          },
          health: {
            type: "string",
            enum: ["green", "yellow", "red"],
            description: "Filter by health status.",
          },
          limit: {
            type: "number",
            description: "Max rows (default 50).",
          },
        },
      },
    },
    async execute(supabase, input) {
      const stage = s(input.stage);
      const health = s(input.health);
      const limit = typeof input.limit === "number" ? Math.min(input.limit, 100) : 50;
      let q = supabase
        .from("launchdeck_projects")
        .select("id,slug,name,description,stage,health,health_score,priority,labels,due_date,updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (stage) q = q.eq("stage", stage);
      if (health) q = q.eq("health", health);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },

  get_project: {
    schema: {
      name: "get_project",
      description:
        "Get full detail for one project: metadata + checklist (with completion state) + features (by status) + audits + recent activity. Use when the user asks about a specific project.",
      input_schema: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string", description: "Project slug (kebab-case)." },
        },
      },
    },
    async execute(supabase, input) {
      const slug = s(input.slug);
      if (!slug) throw new Error("slug is required");
      const { data: project } = await supabase
        .from("launchdeck_projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!project) return { error: "Project not found" };
      const [checklist, features, audits, activity] = await Promise.all([
        supabase
          .from("launchdeck_checklist_items")
          .select("id,category,label,is_completed,stage,sort_order")
          .eq("project_id", project.id)
          .order("sort_order"),
        supabase
          .from("launchdeck_features")
          .select("id,title,description,status,priority,source,created_at")
          .eq("project_id", project.id)
          .order("status")
          .order("created_at", { ascending: false }),
        supabase
          .from("launchdeck_audits")
          .select("id,audit_type,last_completed_at,next_due_at,is_overdue")
          .eq("project_id", project.id),
        supabase
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

  list_features: {
    schema: {
      name: "list_features",
      description: "List features for a project. Filter by status (backlog, in_progress, done).",
      input_schema: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
          status: { type: "string", enum: ["backlog", "in_progress", "done"] },
        },
      },
    },
    async execute(supabase, input) {
      const slug = s(input.slug);
      const status = s(input.status);
      if (!slug) throw new Error("slug is required");
      const pid = await resolveProjectId(supabase, slug);
      if (!pid) return { error: "Project not found" };
      let q = supabase
        .from("launchdeck_features")
        .select("id,title,description,status,priority,source,sort_order,created_at")
        .eq("project_id", pid)
        .order("status")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },

  create_feature: {
    schema: {
      name: "create_feature",
      description:
        "Add a new feature to a project's backlog. Use when the user wants to capture an idea, improvement, or TODO. Always set source='claude'.",
      input_schema: {
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
    async execute(supabase, input) {
      const slug = s(input.slug);
      const title = s(input.title);
      if (!slug || !title) throw new Error("slug and title are required");
      const pid = await resolveProjectId(supabase, slug);
      if (!pid) return { error: "Project not found" };
      const row = {
        project_id: pid,
        title,
        description: s(input.description) ?? null,
        status: s(input.status) ?? "backlog",
        priority: s(input.priority) ?? null,
        source: "claude",
      };
      const { data, error } = await supabase
        .from("launchdeck_features")
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await supabase.from("launchdeck_activity_log").insert({
        project_id: pid,
        action: `Feature added: ${title}`,
        details: { title, via: "chat" },
        source: "claude",
      });
      return data;
    },
  },

  update_feature: {
    schema: {
      name: "update_feature",
      description:
        "Update a feature's status, priority, title, or description. Use to mark in_progress, mark done, re-prioritize.",
      input_schema: {
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
    async execute(supabase, input) {
      const featureId = s(input.feature_id);
      if (!featureId) throw new Error("feature_id is required");
      const patch: Record<string, unknown> = {};
      if (s(input.title)) patch.title = s(input.title);
      if (typeof input.description === "string") patch.description = input.description.trim() || null;
      if (s(input.status)) {
        patch.status = s(input.status);
        if (input.status === "done") patch.completed_at = new Date().toISOString();
      }
      if (s(input.priority)) patch.priority = s(input.priority);
      if (Object.keys(patch).length === 0) return { error: "No fields to update" };
      const { data, error } = await supabase
        .from("launchdeck_features")
        .update(patch)
        .eq("id", featureId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },

  toggle_checklist_item: {
    schema: {
      name: "toggle_checklist_item",
      description: "Mark a checklist item complete or incomplete by id.",
      input_schema: {
        type: "object",
        required: ["item_id", "is_completed"],
        properties: {
          item_id: { type: "string" },
          is_completed: { type: "boolean" },
        },
      },
    },
    async execute(supabase, input) {
      const itemId = s(input.item_id);
      if (!itemId) throw new Error("item_id is required");
      const is_completed = Boolean(input.is_completed);
      const patch = {
        is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
      };
      const { data, error } = await supabase
        .from("launchdeck_checklist_items")
        .update(patch)
        .eq("id", itemId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },

  update_project: {
    schema: {
      name: "update_project",
      description:
        "Update a project's stage, health, priority, or description. Use when the user says 'move X to build' or 'archive Y'.",
      input_schema: {
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
          due_date: { type: "string", description: "ISO date (YYYY-MM-DD) or null." },
        },
      },
    },
    async execute(supabase, input) {
      const slug = s(input.slug);
      if (!slug) throw new Error("slug is required");
      const patch: Record<string, unknown> = {};
      if (s(input.stage)) patch.stage = s(input.stage);
      if (s(input.health)) patch.health = s(input.health);
      if (s(input.priority)) patch.priority = s(input.priority);
      if (typeof input.description === "string") patch.description = input.description;
      if (typeof input.due_date === "string") patch.due_date = input.due_date || null;
      if (Object.keys(patch).length === 0) return { error: "No fields to update" };
      const { data, error } = await supabase
        .from("launchdeck_projects")
        .update(patch)
        .eq("slug", slug)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },

  list_launches: {
    schema: {
      name: "list_launches",
      description: "List the user's launch plans with status, target date, and product name.",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      },
    },
    async execute(supabase, input) {
      const limit = typeof input.limit === "number" ? Math.min(input.limit, 100) : 50;
      const { data, error } = await supabase
        .from("launches")
        .select("id,app_name,niche,status,launch_timeline,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
};

export function toolSchemas(): Anthropic.Tool[] {
  return Object.values(CHAT_TOOLS).map((t) => t.schema);
}

export async function runTool(
  supabase: Supa,
  name: string,
  input: Record<string, unknown>,
): Promise<{ ok: boolean; result: unknown }> {
  const tool = CHAT_TOOLS[name];
  if (!tool) return { ok: false, result: { error: `Unknown tool: ${name}` } };
  try {
    const result = await tool.execute(supabase, input);
    return { ok: true, result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tool execution failed";
    return { ok: false, result: { error: message } };
  }
}
