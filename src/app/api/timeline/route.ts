import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Category groups for the segmented timeline
const CATEGORY_GROUPS = {
  build: ["validation", "research", "infrastructure", "deployment", "design", "auth", "payments", "automation", "quality"],
  marketing: ["marketing", "seo", "legal"],
  distribution: ["content", "distribution", "growth"],
} as const;

// Key milestone items to auto-detect (matched by substring in label)
const KEY_MILESTONES = [
  { match: "brand voice reviewed", label: "Brand Voice Approved", group: "distribution", icon: "voice" },
  { match: "linkedin company page", label: "LinkedIn Page Created", group: "distribution", icon: "linkedin" },
  { match: "linkedin page connected", label: "Connected to Content Flywheel", group: "distribution", icon: "pipeline" },
  { match: "sample posts approved", label: "Content Quality Approved", group: "distribution", icon: "content" },
  { match: "content scheduled", label: "First Content Scheduled", group: "distribution", icon: "schedule" },
  { match: "publishing pipeline tested", label: "Publishing Pipeline Live", group: "distribution", icon: "pipeline" },
  { match: "daily posting active", label: "Daily Posting Active", group: "distribution", icon: "rocket" },
  { match: "engagement strategy", label: "Engagement Running", group: "distribution", icon: "engage" },
  { match: "first 100 linkedin", label: "First 100 Followers", group: "distribution", icon: "milestone" },
  { match: "first 500 linkedin", label: "500 Followers", group: "distribution", icon: "milestone" },
  { match: "first paying customer", label: "First Paying Customer", group: "distribution", icon: "revenue" },
  { match: "first 100 registered", label: "100 Organic Signups", group: "distribution", icon: "milestone" },
  { match: "newsletter", label: "Newsletter Active", group: "marketing", icon: "newsletter" },
  { match: "landing page live", label: "Landing Page Live", group: "marketing", icon: "launch" },
  { match: "social media accounts", label: "Social Accounts Set Up", group: "marketing", icon: "social" },
];

export async function GET() {
  const supabase = await createClient();

  const { data: projects, error: projError } = await supabase
    .from("launchdeck_projects")
    .select("*")
    .neq("stage", "archived")
    .order("sort_order")
    .order("created_at");

  if (projError) return NextResponse.json({ error: projError.message }, { status: 500 });

  const projectIds = (projects || []).map((p) => p.id);
  if (projectIds.length === 0) return NextResponse.json([]);

  const [{ data: allItems, error: itemsError }, { data: milestones, error: msError }] = await Promise.all([
    supabase
      .from("launchdeck_checklist_items")
      .select("*")
      .in("project_id", projectIds)
      .order("sort_order"),
    supabase
      .from("launchdeck_milestones")
      .select("*")
      .in("project_id", projectIds)
      .order("target_date"),
  ]);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  if (msError) return NextResponse.json({ error: msError.message }, { status: 500 });

  const timelineProjects = (projects || []).map((p) => {
    const items = (allItems || []).filter((i) => i.project_id === p.id);

    // Group by category group
    const groups: Record<string, { total: number; completed: number; categories: Record<string, { total: number; completed: number }> }> = {};
    for (const [groupName, cats] of Object.entries(CATEGORY_GROUPS)) {
      const groupItems = items.filter((i) => (cats as readonly string[]).includes(i.category));
      const catMap: Record<string, { total: number; completed: number }> = {};
      for (const cat of cats) {
        const catItems = groupItems.filter((i) => i.category === cat);
        if (catItems.length > 0) {
          catMap[cat] = {
            total: catItems.length,
            completed: catItems.filter((i) => i.is_completed).length,
          };
        }
      }
      groups[groupName] = {
        total: groupItems.length,
        completed: groupItems.filter((i) => i.is_completed).length,
        categories: catMap,
      };
    }

    // Auto-detect key milestones from checklist items
    const autoMilestones = KEY_MILESTONES.map((km) => {
      const item = items.find((i) => i.label.toLowerCase().includes(km.match));
      if (!item) return null;
      return {
        id: `auto_${item.id}`,
        label: km.label,
        group: km.group,
        icon: km.icon,
        is_completed: item.is_completed,
        completed_at: item.completed_at,
        checklist_item_id: item.id,
      };
    }).filter(Boolean);

    // Overall totals
    const total = items.length;
    const completed = items.filter((i) => i.is_completed).length;

    return {
      ...p,
      _checklist_total: total,
      _checklist_completed: completed,
      _groups: groups,
      _auto_milestones: autoMilestones,
      _milestones: (milestones || []).filter((m) => m.project_id === p.id),
    };
  });

  return NextResponse.json(timelineProjects);
}
