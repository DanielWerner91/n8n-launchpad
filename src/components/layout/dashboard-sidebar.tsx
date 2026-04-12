"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Rocket, Activity, Plus, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Pipeline", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/launches", label: "Launch Plans", icon: Rocket, exact: false },
  { href: "/dashboard/activity", label: "Activity", icon: Activity, exact: true },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-foreground">
          <FolderKanban className="size-3.5 text-background" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-foreground">LaunchPad</span>
      </div>

      <nav className="flex-1 px-2 py-1">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1.5 p-3">
        <Link
          href="/dashboard/projects/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-3.5" />
          New Project
        </Link>
        <Link
          href="/dashboard/launches/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
        >
          <Rocket className="size-3.5" />
          New Launch
        </Link>
      </div>
    </aside>
  );
}
