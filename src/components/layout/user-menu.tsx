"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string; avatar?: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
        });
      }
    });
  }, []);

  useClickOutside(ref, () => setOpen(false), open);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (!user) return null;

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted",
          open && "bg-muted"
        )}
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name || user.email}
            className="size-7 shrink-0 rounded-full ring-1 ring-border"
          />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent ring-1 ring-border">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-foreground">
            {user.name || user.email.split("@")[0]}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
        </div>
        <ChevronUp
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            !open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted"
          >
            <Settings className="size-3.5 text-muted-foreground" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-[12px] text-foreground hover:bg-muted"
          >
            <LogOut className="size-3.5 text-muted-foreground" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
