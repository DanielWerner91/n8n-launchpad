"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Wrench, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TextBlock = { type: "text"; text: string };
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: unknown };
type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

type WireMessage =
  | { role: "user"; content: string | ContentBlock[] }
  | { role: "assistant"; content: ContentBlock[] };

const SUGGESTIONS = [
  "What's at risk across my portfolio?",
  "Show me the top 3 backlog features on LaunchPad",
  "Add a feature to LaunchPad: weekly digest email",
  "What launches are coming up?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<WireMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);

    const nextMessages: WireMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        setLoading(false);
        return;
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages as WireMessage[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const visible = messages.filter((m) => {
    if (m.role === "user" && Array.isArray(m.content)) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-foreground" />
        <div className="text-[13px] font-semibold text-foreground">Copilot</div>
        <div className="ml-auto text-[11px] text-muted-foreground">
          Ask about projects, features, launches
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {visible.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {visible.map((m, idx) => (
              <MessageRow key={idx} message={m} />
            ))}
            {loading && <ThinkingRow />}
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          <AlertCircle className="size-3.5" />
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border p-3"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask me anything about your projects..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
        <Sparkles className="size-5 text-foreground" />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-foreground">How can I help?</div>
        <div className="mt-1 text-[13px] text-muted-foreground">
          I can read and update your projects, features, checklists, and launches.
        </div>
      </div>
      <div className="grid w-full gap-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-muted"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: WireMessage }) {
  if (message.role === "user") {
    const text = typeof message.content === "string" ? message.content : "";
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-[13px] text-background">
          {text}
        </div>
      </div>
    );
  }

  const blocks = message.content;
  const textBlocks = blocks.filter((b): b is TextBlock => b.type === "text");
  const toolBlocks = blocks.filter((b): b is ToolUseBlock => b.type === "tool_use");

  return (
    <div className="flex flex-col gap-2">
      {toolBlocks.map((b) => (
        <ToolCallCard key={b.id} name={b.name} input={b.input} />
      ))}
      {textBlocks.map((b, i) => (
        <div key={i} className="flex">
          <div className="max-w-[85%] whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
            {b.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolCallCard({ name, input }: { name: string; input: unknown }) {
  const [open, setOpen] = useState(false);
  const preview =
    input && typeof input === "object"
      ? Object.entries(input as Record<string, unknown>)
          .slice(0, 2)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(", ")
      : "";
  return (
    <div className="inline-flex max-w-fit flex-col rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[11px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Wrench className="size-3" />
        <span className="font-mono">{name}</span>
        {preview && !open && <span className="text-muted-foreground">· {preview}</span>}
      </button>
      {open && (
        <pre className="mt-1.5 max-w-md overflow-x-auto rounded bg-background p-2 font-mono text-[10px] text-foreground">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <div className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
      thinking...
    </div>
  );
}
