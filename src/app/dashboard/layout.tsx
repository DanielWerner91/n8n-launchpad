import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { CommandPalette } from "@/components/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
          {children}
        </div>
      </main>
      <CommandPalette />
      <ShortcutsOverlay />
    </div>
  );
}
