"use client";

import { cn } from "@/lib/utils";
import type { LaunchPhase, LaunchTask } from "@/lib/launches/types";

interface PhaseTimelineProps {
  phases: LaunchPhase[];
  tasks: LaunchTask[];
  currentWeek: number | null;
  onWeekSelect: (weekNumber: number) => void;
  selectedWeek: number | null;
}

const WEEK_LABELS: Record<number, string> = {
  "-8": "Plan",
  "-7": "Build",
  "-6": "Polish",
  "-5": "Brand",
  "-4": "W-4",
  "-3": "W-3",
  "-2": "W-2",
  "-1": "W-1",
  "0": "Launch",
  "1": "W+1",
  "2": "W+2",
  "3": "W+3",
  "4": "W+4",
};

const WEEK_THEMES: Record<number, string> = {
  "-8": "Validate & Plan",
  "-7": "Scaffold & Infra",
  "-6": "Build & Security",
  "-5": "Brand & Content",
  "-4": "Account Setup",
  "-3": "Community Entry",
  "-2": "Content Seeding",
  "-1": "Final Prep",
  "0": "Launch Week",
  "1": "Momentum",
  "2": "Follow Up",
  "3": "Iterate",
  "4": "Growth Plan",
};

export function PhaseTimeline({
  phases,
  tasks,
  currentWeek,
  onWeekSelect,
  selectedWeek,
}: PhaseTimelineProps) {
  const weekNumbers = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4];

  const weekProgress = new Map<number, { total: number; completed: number }>();
  for (const wn of weekNumbers) {
    const weekTasks = tasks.filter((t) => t.week_number === wn);
    const completed = weekTasks.filter(
      (t) => t.status === "completed" || t.status === "skipped"
    ).length;
    weekProgress.set(wn, { total: weekTasks.length, completed });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4">Phase Timeline</h3>

      <div className="overflow-x-auto -mx-5 px-5">
        <div className="flex items-start gap-1 min-w-[640px]">
          {weekNumbers.map((wn, i) => {
            const progress = weekProgress.get(wn) || { total: 0, completed: 0 };
            const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            const isSelected = selectedWeek === wn;
            const isCurrent = currentWeek === wn;
            const isLaunch = wn === 0;
            const isPast = currentWeek !== null && wn < currentWeek;

            return (
              <div key={wn} className="flex items-start flex-1">
                <button
                  onClick={() => onWeekSelect(wn)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 w-full transition-all",
                    isSelected && "bg-accent/5 ring-1 ring-accent/20",
                    !isSelected && "hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                      isLaunch && "bg-accent text-accent-foreground",
                      isCurrent && !isLaunch && "bg-amber-500 text-white",
                      isPast && pct === 100 && !isLaunch && "bg-emerald-500 text-white",
                      isPast && pct < 100 && !isLaunch && "bg-muted-foreground/30 text-white",
                      !isPast && !isCurrent && !isLaunch && "bg-muted text-muted-foreground"
                    )}
                  >
                    {pct === 100 && progress.total > 0 ? "\u2713" : WEEK_LABELS[wn]}
                  </div>

                  <span className={cn(
                    "text-[10px] font-medium text-center leading-tight",
                    isSelected ? "text-accent" : "text-muted-foreground"
                  )}>
                    {WEEK_THEMES[wn]}
                  </span>

                  {progress.total > 0 && (
                    <div className="w-full h-1 rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-1 rounded-full transition-all",
                          pct === 100 ? "bg-emerald-500" : "bg-accent"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  <span className="text-[10px] text-muted-foreground">
                    {progress.completed}/{progress.total}
                  </span>
                </button>

                {i < weekNumbers.length - 1 && (
                  <div className="mt-3 h-px w-1 bg-border shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
