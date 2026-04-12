import { Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Rocket className="size-3" />
            </div>
            <span className="text-sm font-semibold text-foreground">LaunchPad</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LaunchPad
          </p>
        </div>
      </div>
    </footer>
  );
}
