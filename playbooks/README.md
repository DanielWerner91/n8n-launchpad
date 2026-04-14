# LaunchPad Playbook System

A complete, granular runbook for taking a project from "I have an idea" to "fully launched and growing." Each phase is a markdown file with specific checklist items, commands, and completion criteria.

## How It Works

1. **Playbook files** define every phase of the pipeline with exact steps
2. **Templates** in `launchdeck_templates` reference playbook items with full `guidance` JSONB
3. **Project creation** auto-populates checklist items with guidance from the template
4. **Each checklist item** has a `stage` field mapping it to the pipeline stage where it's relevant

## Pipeline Stages → Playbook Phases

| Stage | Playbook Phases | Focus |
|-------|----------------|-------|
| idea | 00-idea | Validation, naming, domain |
| research | 01-research | Competitive analysis, MVP scope, data model |
| build | 02-scaffold, 03-design, 04-auth, 05-payments, 06-core-features, 07-legal, 08-quality | All construction |
| deploy | 09-seo, 10-content-brand, 11-landing-page | Pre-launch prep |
| live | 12-distribution | Launch and initial distribution |
| scaling | 13-growth | Analytics, iteration, scaling |

## Checklist Categories

Each item belongs to a category for grouping in the UI:

- `validation` — Idea-phase items (problem, users, naming)
- `research` — Research-phase items (competitive analysis, tech decisions, data model)
- `infrastructure` — Supabase, env vars, domain
- `deployment` — GitHub, Vercel, CI/CD
- `design` — Frontend design, responsive, logo
- `auth` — Google OAuth, RLS, middleware
- `payments` — Lemon Squeezy, webhooks, gating
- `automation` — n8n workflows, cron jobs
- `legal` — Privacy, terms, cookies
- `quality` — Security audit, quality audit, testing
- `seo` — Meta tags, sitemap, OG images
- `content` — Content Flywheel brand, brand voice, content pipeline
- `marketing` — Landing page, social accounts
- `distribution` — LinkedIn, newsletter, social distribution
- `growth` — Analytics, iteration, scaling

## Conventions

- **App folder:** `{{apps_directory}}<app-name>/`
- **Repo naming:** `{{github_username}}/<repo-name>` (usually `n8n-<app-name>` or just `<app-name>`)
- **Shared Supabase:** `{{supabase_project_id}}`
- **Vercel team:** `{{vercel_team_id}}`
- **Skills** are Claude Code slash commands (e.g., `/frontend-vibe`, `/saas-setup`)

## For Claude Code

When starting work on a project, read the relevant playbook phase for the project's current stage. The `guidance.playbook` field on each checklist item points to the specific section.
