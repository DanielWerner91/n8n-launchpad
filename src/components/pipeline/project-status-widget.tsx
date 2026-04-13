"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, GitCommit, GitPullRequest, Loader2, Cloud } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface StatusData {
  vercel: { status: string; url: string; updatedAt: string } | null;
  github: { lastCommit: string; lastCommitMessage: string; openPRs: number } | null;
}

const vercelStatusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  READY: { icon: CheckCircle, label: "Deployed", color: "text-emerald-600" },
  ERROR: { icon: XCircle, label: "Failed", color: "text-red-600" },
  BUILDING: { icon: Clock, label: "Building", color: "text-amber-600" },
  QUEUED: { icon: Clock, label: "Queued", color: "text-blue-600" },
};

export function ProjectStatusWidget({ slug }: { slug: string }) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${slug}/status`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Loading status...
      </div>
    );
  }

  if (!status || (!status.vercel && !status.github)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Vercel deployment status */}
      {status.vercel && (() => {
        const config = vercelStatusConfig[status.vercel.status] || vercelStatusConfig.READY;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Cloud className="size-3 text-muted-foreground" />
            <Icon className={cn("size-3", config.color)} />
            <span className={cn("text-[11px] font-medium", config.color)}>{config.label}</span>
            {status.vercel.updatedAt && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(status.vercel.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        );
      })()}

      {/* GitHub last commit */}
      {status.github && (
        <>
          <div className="flex items-center gap-1.5">
            <GitCommit className="size-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {status.github.lastCommitMessage || "No commits"}
            </span>
            {status.github.lastCommit && (
              <span className="text-[10px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(status.github.lastCommit), { addSuffix: true })}
              </span>
            )}
          </div>

          {status.github.openPRs > 0 && (
            <div className="flex items-center gap-1.5">
              <GitPullRequest className="size-3 text-violet-500" />
              <span className="text-[11px] font-medium text-violet-600">
                {status.github.openPRs} open PR{status.github.openPRs > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
