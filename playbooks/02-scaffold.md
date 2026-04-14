# Phase 2: Scaffold

> Pipeline stage: build
> Prerequisites: Phase 1 (Research) complete
> Skills: none
> Estimated items: 5 checklist items

## Overview

Set up the project skeleton: Next.js app, GitHub repo, Vercel project, Supabase tables, and environment variables. Exit this phase with a running local dev server and a deployed (empty) app on Vercel.

## Checklist Items

### [infrastructure] Next.js app scaffolded
**Approach:** Run from `{{apps_directory}}`:
```bash
npx create-next-app@latest <app-name> --typescript --tailwind --app --src-dir --import-alias "@/*"
cd <app-name>
```
Then install standard dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr sonner date-fns lucide-react
npm install -D @types/node
```
Create `CLAUDE.md` in the project root with: app name, repo, Vercel project ID, Supabase project, stack, and architecture overview. This is the app's source of truth for Claude Code.
**Skill:** null
**Done when:** `npm run dev` starts without errors. `CLAUDE.md` exists with project metadata.
**References:** ["https://nextjs.org/docs/getting-started/installation"]
**Depends on:** App name and slug decided

### [infrastructure] Supabase tables created
**Approach:** Using the Supabase MCP or dashboard, create all tables from the data model designed in Phase 1. Run the SQL directly:
```sql
CREATE TABLE <app>_<table> (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ...
  created_at timestamptz DEFAULT now() NOT NULL
);
```
Enable RLS on all tables: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
Add basic policies later in the auth phase.
**Skill:** null
**Done when:** All tables from the data model exist in Supabase with RLS enabled. Can verify via Supabase dashboard or `\dt` in SQL editor.
**References:** ["https://supabase.com/docs/guides/database/tables"]
**Depends on:** Data model designed

### [infrastructure] Environment variables configured
**Approach:** Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://{{supabase_project_id}}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
```
Add any app-specific keys (API keys, webhook URLs). Create Supabase client helpers:
- `src/lib/supabase/client.ts` (browser client)
- `src/lib/supabase/server.ts` (server component client)
- `src/lib/supabase/admin.ts` (service role client for API routes)

Copy these from an existing app (e.g., `{{apps_directory}}launchpad/src/lib/supabase/`).
**Skill:** null
**Done when:** `.env.local` exists with all required keys. Supabase clients work (test with a simple query in a server component).
**References:** ["https://supabase.com/docs/guides/getting-started/quickstarts/nextjs"]
**Depends on:** Next.js app scaffolded, Supabase tables created

### [deployment] GitHub repo created
**Approach:** Initialize git and create the repo using GitHub MCP or CLI:
```bash
cd {{apps_directory}}<app-name>
git init
git add -A
git commit -m "Initial scaffold"
gh repo create {{github_username}}/<repo-name> --public --source=. --remote=origin --push
```
Repo naming: use the app name directly (e.g., `procure-index`) or prefix with `n8n-` (e.g., `n8n-chessmind`).
**Skill:** null
**Done when:** Repo exists at `github.com/{{github_username}}/<repo-name>` with initial commit pushed.
**References:** []
**Depends on:** Next.js app scaffolded

### [deployment] Vercel project connected
**Approach:** Deploy to Vercel using CLI:
```bash
cd {{apps_directory}}<app-name>
npx vercel --prod
```
On first run, link to the Vercel team `{{vercel_team_id}}`. Set environment variables in Vercel dashboard or via API:
```bash
curl -X POST "https://api.vercel.com/v10/projects/<project-id>/env?teamId={{vercel_team_id}}" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_SUPABASE_URL","value":"...","type":"plain","target":["production","preview"]}'
```
Record the Vercel project ID in `CLAUDE.md` and LaunchPad project links.
**Skill:** null
**Done when:** App is accessible at `<project>.vercel.app`. Environment variables are set in Vercel. Project ID is recorded.
**References:** ["https://vercel.com/docs/cli"]
**Depends on:** GitHub repo created, Environment variables configured

## Decision Points

- Public or private GitHub repo?
- Custom domain now or later? (Later is fine, just Vercel URL for now)

## Common Pitfalls

- **Forgetting `.env.local` in `.gitignore`.** `create-next-app` handles this, but verify.
- **Using wrong Supabase keys.** `NEXT_PUBLIC_` prefix means it's exposed to the client. Only the anon key should be public.
- **Not setting Vercel env vars.** The deploy will work but the app will fail at runtime without Supabase keys.
