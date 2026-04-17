import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Terminal } from "lucide-react";
import { ApiKeysCard } from "@/components/settings/api-keys-card";
import { WebhooksCard } from "@/components/settings/webhooks-card";

export const metadata: Metadata = {
  title: "Developer | LaunchPad",
};

export default function DeveloperSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Settings
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <Terminal className="size-5 text-foreground" />
          <h1 className="text-lg font-semibold text-foreground">Developer</h1>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          API keys and webhooks for integrating LaunchPad with external tools (Zapier, Make, GitHub Actions, custom scripts).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-[12px] text-muted-foreground">
        <div className="font-semibold text-foreground">REST API</div>
        <pre className="mt-2 overflow-x-auto rounded bg-background p-2 font-mono text-[11px] text-foreground">
{`curl https://launchpad-six-tau.vercel.app/api/v1/projects \\
  -H "Authorization: Bearer lp_..."`}
        </pre>
        <div className="mt-2">
          Full endpoint list:{" "}
          <Link href="/api/v1" className="underline hover:text-foreground">
            /api/v1
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-[12px] text-muted-foreground">
        <div className="font-semibold text-foreground">Model Context Protocol (MCP)</div>
        <p className="mt-1">
          Expose LaunchPad projects, features, and checklists to Claude Desktop or Claude Code as MCP tools.
        </p>
        <div className="mt-2 text-foreground">Add to your Claude Desktop config (<code className="rounded bg-background px-1">~/Library/Application Support/Claude/claude_desktop_config.json</code>):</div>
        <pre className="mt-2 overflow-x-auto rounded bg-background p-2 font-mono text-[11px] text-foreground">
{`{
  "mcpServers": {
    "launchpad": {
      "type": "http",
      "url": "https://launchpad-six-tau.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer lp_..." }
    }
  }
}`}
        </pre>
        <div className="mt-2">
          Details:{" "}
          <Link href="/api/mcp" className="underline hover:text-foreground">
            /api/mcp
          </Link>
        </div>
      </div>

      <ApiKeysCard />
      <WebhooksCard />
    </div>
  );
}
