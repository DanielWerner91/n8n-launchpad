"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityEntry {
  id: string;
  action: string;
  details: Record<string, string>;
  source: string;
  created_at: string;
  project?: { name: string; slug: string; icon_emoji: string; logo_url: string | null } | null;
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Recent activity across all projects</p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {entries.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No activity yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
              {entry.project?.logo_url ? (
                <div className="mt-0.5 size-6 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                  <Image src={entry.project.logo_url} alt="" width={24} height={24} className="size-6 object-contain" unoptimized />
                </div>
              ) : (
                <span className="mt-0.5 text-sm shrink-0">{entry.project?.icon_emoji || "📋"}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-foreground">
                  {entry.project && (
                    <Link href={`/dashboard/projects/${entry.project.slug}`} className="font-medium hover:text-accent">
                      {entry.project.name}
                    </Link>
                  )}
                  {" "}{entry.action}
                  {entry.details?.stage_from && entry.details?.stage_to && (
                    <span className="text-muted-foreground"> {entry.details.stage_from} &rarr; {entry.details.stage_to}</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  {entry.source !== "web" && (
                    <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-medium">{entry.source}</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
