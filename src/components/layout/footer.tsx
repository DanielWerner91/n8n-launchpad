import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-launchpad.png" alt="LaunchPad" width={24} height={24} className="size-6 rounded-md" />
            <span className="text-sm font-semibold text-foreground">LaunchPad</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/changelog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Changelog
            </Link>
            <Link href="/roadmap" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Roadmap
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} LaunchPad
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
