"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Globe, Lock, Copy, Check, ExternalLink } from "lucide-react";

type Props = {
  slug: string;
  initialIsPublic: boolean;
  initialTagline: string | null;
};

export function PublishToggle({ slug, initialIsPublic, initialTagline }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [tagline, setTagline] = useState(initialTagline || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [taglineSaving, setTaglineSaving] = useState(false);

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/p/${slug}` : `/p/${slug}`;

  async function toggle() {
    const next = !isPublic;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: next }),
      });
      if (!res.ok) {
        toast.error("Failed to update visibility");
        return;
      }
      setIsPublic(next);
      toast.success(next ? "Project is now public" : "Project is now private");
    } finally {
      setSaving(false);
    }
  }

  async function saveTagline() {
    setTaglineSaving(true);
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_tagline: tagline.trim() || null }),
      });
      if (!res.ok) {
        toast.error("Failed to save tagline");
        return;
      }
      toast.success("Tagline saved");
    } finally {
      setTaglineSaving(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-6 items-center justify-center rounded-md bg-muted">
            {isPublic ? (
              <Globe className="size-3.5 text-emerald-600" />
            ) : (
              <Lock className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-foreground">
              {isPublic ? "Public ship log" : "Private"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isPublic
                ? "Anyone with the link can see shipped features and activity."
                : "Only you can see this project."}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={
            "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 " +
            (isPublic
              ? "border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-border bg-background text-foreground hover:bg-muted")
          }
        >
          {saving ? "Saving..." : isPublic ? "Public" : "Publish"}
        </button>
      </div>

      {isPublic && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-[11px]">
              {publicUrl}
            </code>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] hover:bg-muted"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={`/p/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] hover:bg-muted"
            >
              <ExternalLink className="size-3" />
              Open
            </a>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              Public tagline (shown at the top of the public page)
            </label>
            <div className="flex gap-2">
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Building the Notion for indie founders"
                className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] focus:border-foreground/30 focus:outline-none"
              />
              <button
                onClick={saveTagline}
                disabled={taglineSaving}
                className="rounded-md bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {taglineSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
