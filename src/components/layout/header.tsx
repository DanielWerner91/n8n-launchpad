"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header({ user }: { user?: { email?: string } | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <Image src="/logo-launchpad.png" alt="LaunchPad" width={28} height={28} className="size-7 rounded-lg" />
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              LaunchPad
            </span>
          </Link>

          {user ? (
            <>
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                    pathname === "/dashboard"
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  Pipeline
                </Link>
                <Link
                  href="/dashboard/launches"
                  className={cn(
                    "px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                    pathname.startsWith("/dashboard/launches")
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  Launches
                </Link>
                <div className="ml-3 flex items-center gap-2 border-l border-border pl-3">
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </nav>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-md"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-1.5 text-[13px] font-medium rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && user && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-muted"
            >
              Pipeline
            </Link>
            <Link
              href="/dashboard/launches"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-muted"
            >
              Launches
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground rounded-lg hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
