# Prompt: Build LaunchPad Playbook System

## Context

LaunchPad (`~/n8n-apps/launchpad/`) is my unified project management app that tracks all my projects through a pipeline: idea > research > build > deploy > live > scaling. It lives at `launchpad-six-tau.vercel.app` and uses Supabase (`dtabpbuqodditvhsbpur`).

I plan to launch 100+ projects through this pipeline. Each project is a Next.js app in `~/n8n-apps/<app-name>/` deployed on Vercel with Supabase backend. The checklist system needs to be a complete, granular runbook that both Claude Code and a human can follow autonomously from "I have an idea" to "fully launched and growing."

### Current State

The checklist today has 8 categories (infrastructure, auth, payments, deployment, design, automation, marketing, legal) plus a "distribution" category added recently. Each item has a `guidance` JSONB field with `approach`, `skill`, `done_when`, `references`. But:

1. **No idea/research phase** -- the pipeline jumps straight to infrastructure. There's nothing for idea validation, naming, competitive analysis, MVP scoping, or tech decisions.
2. **No sequencing** -- items are a flat list with no dependencies or stage-gating. You don't know which items to do at which pipeline stage.
3. **Guidance lives in DB JSONB** -- hard to version, review, or iterate. Can't be read by Claude Code as a runbook before starting work.
4. **Templates don't include guidance** -- new projects created from templates get empty `guidance: {}`.
5. **No scaffolding automation** -- "GitHub repo created" doesn't explain the exact `create-next-app` command, folder conventions, or initial setup steps.

### Tech Stack (every project follows this)

- **Framework:** Next.js (latest, App Router), TypeScript, Tailwind CSS v4
- **Backend:** Supabase (shared instance `dtabpbuqodditvhsbpur` or dedicated for larger apps)
- **Auth:** Google OAuth via Supabase Auth, middleware-protected routes
- **Payments:** Lemon Squeezy (store, subscription webhooks, Pro/Free gating)
- **Hosting:** Vercel (auto-deploy or CLI deploy from GitHub)
- **Design:** `/frontend-vibe` skill (21st.dev components, heavy animations)
- **Logo:** `/logo-generator` skill (4 variants, minimalist)
- **Legal:** Termly (privacy, terms, cookie consent)
- **Content:** Content Flywheel (`content-flywheel.com`) for brand voice, content generation, LinkedIn publishing
- **Analytics:** PostHog
- **Newsletters:** Beehiiv + `/newsletter-builder` skill
- **LinkedIn:** `/linkedin-strategy` skill (the bible -- zero hashtags, carousels king, etc.)
- **n8n:** Cloud instance for workflow automation
- **Security:** `/security-audit` skill
- **Quality:** `/quality-audit` skill
- **Landing pages:** `/landing-page` skill

### Database Tables

Checklist items are in `launchdeck_checklist_items`:
- `id`, `project_id`, `category` (varchar), `label` (varchar), `is_completed` (bool), `completed_at`, `notes` (text), `guidance` (jsonb), `sort_order` (int), `created_at`

Templates are in `launchdeck_templates`:
- `id`, `slug`, `name`, `checklist` (jsonb array), `audit_config` (jsonb)

Current templates: `saas-app` (24 items), `content-site` (15 items), `client-project` (7 items).

Project stages: `idea`, `research`, `build`, `deploy`, `live`, `scaling`, `archived`.

## What to Build

### 1. Playbook markdown files at `~/n8n-apps/launchpad/playbooks/`

Create versioned, granular runbook files that define every phase of the pipeline:

```
playbooks/
├── README.md              # How the playbook system works, how to use it
├── 00-idea.md             # Idea capture, validation, naming, domain check
├── 01-research.md         # Competitive analysis, tech decisions, MVP scope, data model
├── 02-scaffold.md         # create-next-app, GitHub repo, Vercel, Supabase, env vars, CLAUDE.md
├── 03-design.md           # /frontend-vibe, component selection, responsive
├── 04-auth.md             # Google OAuth, Supabase Auth, middleware, RLS, UserMenu
├── 05-payments.md         # Lemon Squeezy store, webhooks, subscription gating
├── 06-core-features.md    # Building the actual app features (this varies per project)
├── 07-legal.md            # Termly privacy/terms/cookies
├── 08-quality.md          # /quality-audit, /security-audit, testing, performance
├── 09-seo.md              # Meta, sitemap, robots, OG images
├── 10-content-brand.md    # Content Flywheel brand, brand voice, logo, design system
├── 11-landing-page.md     # /landing-page skill, conversion optimization
├── 12-distribution.md     # LinkedIn strategy, newsletter, social, content pipeline
└── 13-growth.md           # Analytics, iteration, scaling triggers
```

Each playbook file should follow this structure:

```markdown
# Phase N: [Name]

> Pipeline stage: idea | research | build | deploy | live
> Prerequisites: [list of phases that must be complete]
> Skills: [list of Claude Code skills used]
> Estimated items: N checklist items

## Overview
What this phase accomplishes and why it matters.

## Checklist Items

### [category] Item Label
**Approach:** Exact steps, commands, decisions. Be specific enough that Claude Code can execute autonomously.
**Skill:** `/skill-name` or null
**Done when:** Concrete, verifiable completion criteria.
**References:** Links to docs, tools, dashboards.
**Depends on:** [other items that must be done first, if any]

### [category] Next Item Label
...

## Decision Points
Questions that need human input before proceeding (e.g., "Does this app need payments?", "What's the domain name?").

## Common Pitfalls
Things that go wrong and how to avoid them.
```

### 2. Update templates to include guidance

Update the `launchdeck_templates` table so the `checklist` JSONB array includes guidance for each item. When a new project is created from a template, every item should have full guidance from day one.

The template checklist items should reference their playbook file:
```json
{
  "label": "GitHub repo created",
  "category": "deployment", 
  "sort_order": 8,
  "guidance": {
    "approach": "...",
    "skill": null,
    "done_when": "...",
    "references": ["..."],
    "playbook": "02-scaffold.md#github-repo"
  }
}
```

### 3. Update the project creation API

In `src/app/api/projects/route.ts` (POST handler), ensure that when checklist items are created from a template, the `guidance` field is populated from the template.

### 4. Add idea/research checklist items to templates

The SaaS and Content Site templates need new items for the idea and research phases. These should be the FIRST items (lowest sort_order) so they appear at the top.

Examples for idea phase:
- Problem statement defined
- Target user identified
- App name and slug decided
- Domain availability checked
- Competitive landscape reviewed
- MVP feature list scoped (max 3-5 features)

Examples for research phase:
- Data model designed
- API/integration requirements identified
- Tech decisions documented (needs auth? payments? what external APIs?)

### 5. Add stage field to checklist items

Consider adding a `stage` field to `launchdeck_checklist_items` (or at minimum document it in the playbook) so items can be filtered by which pipeline stage they belong to. This way, when a project is at "idea" stage, the UI can highlight which items are relevant NOW vs later.

## Quality Requirements

- Every checklist item must be specific enough that Claude Code can execute it without asking clarifying questions (except for items explicitly marked as "Decision Points" requiring human input)
- Commands should be exact (e.g., `npx create-next-app@latest <app-name> --typescript --tailwind --app --src-dir` not just "scaffold a Next.js app")
- Reference our actual conventions: folder at `~/n8n-apps/<app-name>/`, repo naming `DanielWerner91/<repo-name>`, shared Supabase `dtabpbuqodditvhsbpur`, Vercel team `team_nPnYMzmbJQDegaqdpMQAtnZh`
- Playbooks should be written for Claude Code as the primary reader, with human readability as secondary
- After building, deploy the updated LaunchPad to Vercel (use `npx vercel --prod` from the launchpad folder, NOT git push -- there's no auto-deploy configured)

## Do NOT

- Do not change the existing checklist UI (the expandable guidance panels are already built and working)
- Do not remove or rename existing checklist items that are already checked off on live projects
- Do not create a separate app or tool -- this is all within the existing LaunchPad codebase
- Do not over-engineer with complex abstractions -- markdown files + DB guidance is the right level
