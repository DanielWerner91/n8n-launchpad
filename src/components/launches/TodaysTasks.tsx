"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import type { LaunchTask } from "@/lib/launches/types";

interface TodaysTasksProps {
  launchId: string;
}

export function TodaysTasks({ launchId }: TodaysTasksProps) {
  const [tasks, setTasks] = useState<LaunchTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<LaunchTask[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/launches/${launchId}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const allTasks: LaunchTask[] = await res.json();

      const todayTasks = allTasks.filter((t) => t.scheduled_date === today);

      if (todayTasks.length === 0) {
        const futureTasks = allTasks
          .filter((t) => t.scheduled_date && t.scheduled_date > today && t.status !== "completed" && t.status !== "skipped")
          .sort((a, b) => (a.scheduled_date || "").localeCompare(b.scheduled_date || ""));
        const nextDate = futureTasks[0]?.scheduled_date;
        if (nextDate) {
          setUpcomingTasks(futureTasks.filter((t) => t.scheduled_date === nextDate));
        }
      } else {
        const nextDays = allTasks
          .filter((t) => t.scheduled_date && t.scheduled_date > today && t.status !== "completed" && t.status !== "skipped")
          .sort((a, b) => (a.scheduled_date || "").localeCompare(b.scheduled_date || ""))
          .slice(0, 5);
        setUpcomingTasks(nextDays);
      }

      setTasks(todayTasks);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [launchId, today]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (taskId: string, newStatus: "completed" | "pending") => {
    try {
      const res = await fetch(`/api/launches/${launchId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      await fetchTasks();
    } catch {
      toast.error("Failed to update task");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalToday = tasks.length;
  const completedToday = tasks.filter((t) => t.status === "completed" || t.status === "skipped").length;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const aCompleted = a.status === "completed" || a.status === "skipped";
    const bCompleted = b.status === "completed" || b.status === "skipped";
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    return (priorityOrder[a.priority || "low"] || 3) - (priorityOrder[b.priority || "low"] || 3);
  });

  return (
    <div className="space-y-6">
      {totalToday > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Today&apos;s Progress</h3>
            </div>
            <span className="text-sm font-medium text-foreground">
              {completedToday}/{totalToday} done
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className={cn("h-3 rounded-full transition-all duration-500", progressPct === 100 ? "bg-emerald-500" : "bg-accent")}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {progressPct === 100 && totalToday > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" />
              All done for today!
            </div>
          )}
        </div>
      )}

      {totalToday > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Today ({new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })})
          </h3>
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center">
          <Calendar className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tasks scheduled for today</p>
        </div>
      )}

      {upcomingTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {totalToday === 0 ? "Next Up" : "Coming Up"}
            {upcomingTasks[0]?.scheduled_date && (
              <span className="ml-1 font-normal">
                ({new Date(upcomingTasks[0].scheduled_date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })})
              </span>
            )}
          </h3>
          {upcomingTasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
