import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/projects/types";

const styles: Record<HealthStatus, string> = {
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
};

const dots: Record<HealthStatus, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
};

export function HealthBadge({ health, score }: { health: HealthStatus; score: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium", styles[health])}>
      <span className={cn("size-1.5 rounded-full", dots[health])} />
      {score}
    </span>
  );
}
