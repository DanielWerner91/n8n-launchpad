"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, Zap, Copy, Check } from "lucide-react";

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  last_delivered_at: string | null;
  last_status: number | null;
  failure_count: number;
  created_at: string;
};

const EVENTS = [
  "project.created",
  "project.updated",
  "project.stage_changed",
  "feature.created",
  "feature.updated",
  "launch.created",
];

export function WebhooksCard() {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [justCreatedSecret, setJustCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/webhooks");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          events: newEvents,
          description: newDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create webhook");
        return;
      }
      setJustCreatedSecret(data.secret);
      setNewUrl("");
      setNewEvents([]);
      setNewDescription("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this webhook?")) return;
    const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Webhook deleted");
    await load();
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: active }),
    });
    if (!res.ok) {
      toast.error("Failed to update");
      return;
    }
    await load();
  }

  async function test(id: string) {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      toast.success(`Test delivered (HTTP ${data.status})`);
    } else {
      toast.error(`Test failed: ${data.error || `HTTP ${data.status}`}`);
    }
    await load();
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleEvent(evt: string) {
    setNewEvents((prev) => (prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Webhook className="size-4 text-foreground" />
          <h2 className="text-[13px] font-semibold text-foreground">Webhooks</h2>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Receive HMAC-signed event POSTs. Empty events list = all events.
        </p>
      </div>

      {justCreatedSecret && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            Save this signing secret. It will not be shown again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1.5 font-mono text-[12px] text-amber-900">
              {justCreatedSecret}
            </code>
            <button
              onClick={() => copy(justCreatedSecret)}
              className="flex items-center gap-1 rounded-md bg-amber-900 px-2 py-1.5 text-[11px] text-white hover:opacity-90"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setJustCreatedSecret(null)}
            className="text-[11px] text-amber-900 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={create} className="space-y-3 rounded-lg border border-border bg-background p-3">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://your-endpoint.com/webhook"
          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] focus:border-foreground/30 focus:outline-none"
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] focus:border-foreground/30 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {EVENTS.map((evt) => {
            const active = newEvents.includes(evt);
            return (
              <button
                key={evt}
                type="button"
                onClick={() => toggleEvent(evt)}
                className={
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors " +
                  (active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30")
                }
              >
                {evt}
              </button>
            );
          })}
        </div>
        <button
          type="submit"
          disabled={creating || !newUrl.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Add webhook
        </button>
      </form>

      <div className="space-y-2">
        {loading ? (
          <div className="text-[12px] text-muted-foreground">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-[12px] text-muted-foreground">No webhooks yet.</div>
        ) : (
          rows.map((w) => (
            <div key={w.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="truncate font-mono text-[12px] text-foreground">{w.url}</code>
                    {!w.is_active && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Paused
                      </span>
                    )}
                  </div>
                  {w.description && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{w.description}</div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(w.events.length === 0 ? ["*"] : w.events).map((e) => (
                      <span
                        key={e}
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    Last delivery:{" "}
                    {w.last_delivered_at
                      ? `${new Date(w.last_delivered_at).toLocaleString()} · HTTP ${w.last_status ?? "?"}`
                      : "never"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => test(w.id)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                  >
                    <Zap className="size-3" /> Test
                  </button>
                  <button
                    onClick={() => toggle(w.id, !w.is_active)}
                    className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                  >
                    {w.is_active ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => remove(w.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
