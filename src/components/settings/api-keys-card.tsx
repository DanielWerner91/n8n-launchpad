"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2, Check } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export function ApiKeysCard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    const res = await fetch("/api/keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create key");
        return;
      }
      setJustCreated(data.key);
      setNewKeyName("");
      await loadKeys();
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this key? It will stop working immediately.")) return;
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to revoke");
      return;
    }
    toast.success("Key revoked");
    await loadKeys();
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Key className="size-4 text-foreground" />
          <h2 className="text-[13px] font-semibold text-foreground">API Keys</h2>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Use these in the <code className="rounded bg-muted px-1">Authorization: Bearer</code> header to call{" "}
          <code className="rounded bg-muted px-1">/api/v1/*</code>.
        </p>
      </div>

      {justCreated && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            Save this key now. It will not be shown again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1.5 font-mono text-[12px] text-amber-900">
              {justCreated}
            </code>
            <button
              onClick={() => copyKey(justCreated)}
              className="flex items-center gap-1 rounded-md bg-amber-900 px-2 py-1.5 text-[11px] text-white hover:opacity-90"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setJustCreated(null)}
            className="text-[11px] text-amber-900 underline hover:no-underline"
          >
            I&apos;ve saved it, dismiss
          </button>
        </div>
      )}

      <form onSubmit={createKey} className="flex gap-2">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. Zapier, GitHub Actions)"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] focus:border-foreground/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating || !newKeyName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Generate
        </button>
      </form>

      <div className="space-y-2">
        {loading ? (
          <div className="text-[12px] text-muted-foreground">Loading...</div>
        ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
          <div className="text-[12px] text-muted-foreground">No API keys yet.</div>
        ) : (
          <>
            {activeKeys.map((k) => (
              <KeyRow key={k.id} k={k} onRevoke={() => revokeKey(k.id)} />
            ))}
            {revokedKeys.length > 0 && (
              <details className="pt-2">
                <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                  Revoked ({revokedKeys.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {revokedKeys.map((k) => (
                    <KeyRow key={k.id} k={k} onRevoke={null} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KeyRow({ k, onRevoke }: { k: ApiKey; onRevoke: (() => void) | null }) {
  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "never");
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground">{k.name}</span>
          {k.revoked_at && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
              Revoked
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <code className="font-mono">{k.key_prefix}...</code>
          <span>Created {formatDate(k.created_at)}</span>
          <span>Last used {formatDate(k.last_used_at)}</span>
        </div>
      </div>
      {onRevoke && (
        <button
          onClick={onRevoke}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
          title="Revoke"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
