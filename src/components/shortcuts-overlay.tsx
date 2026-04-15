"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["?"], label: "Show keyboard shortcuts" },
    { keys: ["/"], label: "Focus search" },
    { keys: ["Esc"], label: "Close overlay / clear selection" },
  ]},
  { category: "Views", items: [
    { keys: ["1"], label: "Board view" },
    { keys: ["2"], label: "List view" },
    { keys: ["f"], label: "Toggle filters" },
  ]},
  { category: "Actions", items: [
    { keys: ["n"], label: "New project" },
    { keys: ["Shift", "N"], label: "New launch" },
    { keys: ["Cmd", "Enter"], label: "Submit comment" },
  ]},
  { category: "Selection", items: [
    { keys: ["Click"], label: "Open project details" },
    { keys: ["Cmd", "Click"], label: "Toggle selection" },
    { keys: ["Shift", "Click"], label: "Range select (list view)" },
  ]},
];

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen((v) => v ? false : v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="size-4 text-muted-foreground" />
            <h2 className="text-[14px] font-semibold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[13px] text-foreground">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground">
                            {key}
                          </kbd>
                          {j < item.keys.length - 1 && <span className="text-muted-foreground text-[10px]">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 border-t border-border bg-muted/30 px-5 py-2 text-[10px] text-muted-foreground text-center">
          Press <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono">?</kbd> anytime to show this
        </div>
      </div>
    </div>
  );
}
