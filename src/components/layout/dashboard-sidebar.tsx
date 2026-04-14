"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Rocket, Activity, Plus, CalendarDays, Calendar, Menu, X, Settings } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Pipeline", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar, exact: true },
  { href: "/dashboard/timeline", label: "Timeline", icon: CalendarDays, exact: true },
  { href: "/dashboard/launches", label: "Launch Plans", icon: Rocket, exact: false },
  { href: "/dashboard/activity", label: "Activity", icon: Activity, exact: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: true },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo-launchpad.png" alt="LaunchPad" width={28} height={28} className="size-7 rounded-lg" />
          <span className="text-[14px] font-semibold tracking-tight text-foreground">LaunchPad</span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-muted-foreground hover:text-foreground rounded-md"
        >
          <X className="size-5" />
        </button>
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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo-launchpad.png" alt="LaunchPad" width={24} height={24} className="size-6 rounded-lg" />
          <span className="text-[14px] font-semibold tracking-tight text-foreground">LaunchPad</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: hidden on mobile, shown as overlay when open */}
      <aside
        className={cn(
          "flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-card",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl max-md:transition-transform max-md:duration-200",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
