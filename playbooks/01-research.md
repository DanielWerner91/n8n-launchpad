# Phase 1: Research

> Pipeline stage: research
> Prerequisites: Phase 0 (Idea) complete
> Skills: none
> Estimated items: 3 checklist items

## Overview

Make all major technical and architectural decisions before writing code. Exit this phase with a data model, a list of external APIs/integrations, and documented tech decisions. This prevents mid-build pivots that waste time.

## Checklist Items

### [research] Data model designed
**Approach:** Design the Supabase tables for this app. For each table, define: name, columns (name, type, nullable, default), primary keys, foreign keys, and any JSONB fields. Use the shared Supabase instance `{{supabase_project_id}}` unless the app needs isolation. Follow conventions: table names are snake_case, prefix with app slug if using shared instance (e.g., `chessmind_games`). Document the schema as a project comment.
**Skill:** null
**Done when:** A comment exists with the full table schema (table name, all columns with types). Ready to run as SQL.
**References:** ["https://supabase.com/docs/guides/database"]
**Depends on:** MVP feature list scoped

### [research] API and integration requirements identified
**Approach:** List every external API or service the app will use. For each: name, purpose, auth method (API key, OAuth), pricing tier, and rate limits. Common integrations: Claude API (AI features), Supabase (database + auth), Lemon Squeezy (payments), PostHog (analytics), Content Flywheel (brand/content), n8n (workflow automation). Document as a project comment.
**Skill:** null
**Done when:** A comment lists all external services with auth method and pricing noted. No surprise integrations during build.
**References:** []
**Depends on:** MVP feature list scoped

### [research] Tech decisions documented
**Approach:** Answer these questions and store as a project comment: (1) Does this app need auth? → Yes for SaaS, maybe not for tools. (2) Does it need payments? → Yes if gating features behind Pro. (3) What external APIs? → From previous item. (4) Does it need n8n workflows? → Yes if async processing or scheduled tasks. (5) Does it need a mobile app? → Decide now, build later. (6) Does it need Content Flywheel integration? → Yes if content marketing is part of growth. (7) Shared or dedicated Supabase? → Shared unless data isolation needed.
**Skill:** null
**Done when:** A comment exists answering all 7 tech decision questions with clear yes/no and reasoning.
**References:** []
**Depends on:** MVP feature list scoped, API and integration requirements identified

## Decision Points

- Shared vs dedicated Supabase instance?
- Does this need real-time features (Supabase Realtime)?
- What's the auth model? (Google OAuth only, or also email/password?)
- Is there a data import/migration needed?

## Common Pitfalls

- **Designing the perfect schema.** Get the tables right for the MVP. You can always add columns later.
- **Over-architecting.** No microservices, no event sourcing, no message queues. It's a Next.js app with Supabase.
- **Forgetting rate limits.** External APIs have limits. Know them before you build.
