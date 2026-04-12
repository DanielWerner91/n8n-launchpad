"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { QuickStats } from "@/components/pipeline/quick-stats";
import type { Project } from "@/lib/projects/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();

        // Fetch checklist counts for each project
        const withCounts = await Promise.all(
          (data || []).map(async (project: Project) => {
            try {
              const detailRes = await fetch(`/api/projects/${project.slug}`);
              if (detailRes.ok) {
                const detail = await detailRes.json();
                return { ...project, ...detail };
              }
            } catch { /* silent */ }
            return project;
          })
        );

        setProjects(withCounts);

        // Count overdue audits
        const overdue = withCounts.reduce((count: number, p: Project) => {
          return count + (p.health === "red" ? 1 : 0);
        }, 0);
        setOverdueCount(overdue);
      } catch {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Track your apps through every stage</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/launches"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Launch Plans
          </Link>
          <Link
            href="/dashboard/launches/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            New Launch
          </Link>
        </div>
      </div>

      <QuickStats projects={projects} overdueCount={overdueCount} />
      <PipelineBoard initialProjects={projects} />
    </div>
  );
}
