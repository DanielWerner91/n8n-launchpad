@AGENTS.md

# LaunchPad

Unified project management + launch execution platform. Kanban pipeline dashboard tracking all n8n-apps projects through their lifecycle, plus AI-powered GTM launch orchestration.

**Auth:** Google OAuth via Supabase. **Dashboard:** behind /dashboard/* middleware.

## Naming

- Folder: `~/n8n-apps/launchpad/`
- Package name: `launchpad`
- GitHub repo: `DanielWerner91/n8n-launchpad`
- Vercel project: `prj_mm5sGLVzgtPWmp7wbhPrHDmA46lC` (named "launchpad")
- Vercel URL: `launchpad-six-tau.vercel.app`

## Architecture

Standalone Next.js 16 app with Supabase backend. Absorbed LaunchDeck (archived 2026-04-12).

```
src/
├── app/
│   ├── page.tsx                         # Public landing page
│   ├── login/page.tsx                   # Google OAuth login
│   ├── privacy/page.tsx                 # Privacy policy
│   ├── terms/page.tsx                   # Terms of service
│   ├── dashboard/
│   │   ├── layout.tsx                   # Sidebar + main area
│   │   ├── page.tsx                     # Pipeline/Kanban board (main view)
│   │   ├── activity/page.tsx            # Global activity feed
│   │   ├── timeline/page.tsx            # Timeline view
│   │   ├── projects/
│   │   │   ├── new/page.tsx             # New project (template picker)
│   │   │   └── [slug]/page.tsx          # Project detail (checklist, audits, comments, activity)
│   │   └── launches/
│   │       ├── page.tsx                 # Launch plans list
│   │       ├── new/page.tsx             # New launch wizard (5 steps)
│   │       └── [id]/page.tsx            # Launch detail (tasks, timeline, readiness, analytics)
│   ├── auth/callback/route.ts           # OAuth callback
│   └── api/
│       ├── projects/                    # Project CRUD, checklist, comments, detail, milestones
│       ├── launches/                    # Launch CRUD, strategy, tasks, analytics
│       ├── activity/route.ts            # Global activity feed
│       ├── templates/route.ts           # Project templates
│       ├── brands/route.ts              # Content Flywheel brand logos
│       └── timeline/route.ts            # Cross-project timeline
├── components/
│   ├── layout/                          # Header, Footer, DashboardSidebar
│   ├── pipeline/                        # PipelineBoard, StageColumn, ProjectCard, ListView, QuickStats, HealthBadge, ProjectDetailModal
│   ├── launches/                        # PhaseTimeline, ReadinessScore, TaskCard, TodaysTasks
│   ├── notifications/                   # NotificationCenter
│   └── ui/                              # NumberTicker, shadcn base
└── lib/
    ├── supabase/                        # client.ts, server.ts, admin.ts
    ├── projects/types.ts                # Project, Checklist, Audit, Label, Priority types
    ├── launches/types.ts                # Launch, Task, lifecycle phase types
    ├── launches/task-generator.ts       # 80+ task lifecycle pipeline generator
    ├── launches/directories.ts          # Launch directory list
    ├── ai/launch-strategist.ts          # Claude API for GTM strategy
    └── utils.ts                         # cn() helper
```

## Database

Shared Supabase instance `dtabpbuqodditvhsbpur`. Tables:

**Project management (prefixed `launchdeck_`):**
- `launchdeck_projects` — id, slug, name, description, stage, health, health_score, icon_emoji, logo_url, labels, priority, due_date, cover_color, links, metadata
- `launchdeck_checklist_items` — id, project_id, category, label, is_completed, sort_order
- `launchdeck_audits` — id, project_id, audit_type, interval_days, last_completed_at, next_due_at
- `launchdeck_audit_runs` — id, audit_id, project_id, findings, source
- `launchdeck_activity_log` — id, project_id, action, details, source
- `launchdeck_templates` — id, slug, name, checklist (jsonb), audit_config (jsonb)
- `launchdeck_comments` — id, project_id, content, source

**Launch execution:**
- `launches` — id, user_id, product_name, niche, problem, differentiator, launch_date, strategy, status, metrics

## API Endpoints

### Projects
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/projects` | List all (filter: ?stage=&health=) |
| POST | `/api/projects` | Create project (with template) |
| GET | `/api/projects/[slug]` | Project detail |
| PATCH | `/api/projects/[slug]` | Update project fields |
| PATCH | `/api/projects/[slug]/checklist` | Toggle checklist item |
| GET/POST | `/api/projects/[slug]/comments` | Get/add comments |
| GET | `/api/projects/[slug]/detail` | Full detail (checklist + audits + activity) |

### Launches
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/launches` | List/create launches |
| GET/PATCH | `/api/launches/[id]` | Get/update launch |
| GET | `/api/launches/[id]/strategy` | Generate AI GTM strategy |
| GET/POST | `/api/launches/[id]/tasks` | List/create tasks |
| PATCH | `/api/launches/[id]/tasks/[taskId]` | Update task |
| GET | `/api/launches/[id]/analytics` | PostHog analytics |
| GET | `/api/launches/[id]/readiness` | Readiness score |

## Keyboard Shortcuts (dashboard)
- `/` — Focus search
- `f` — Toggle filters
- `1` — Board view
- `2` — List view
- `n` — New project

## Health Score

`score = (checklist_completion * 0.6 + audit_freshness * 0.4) * 100`
- Green (>=70), Yellow (40-69), Red (<40)

## Templates

- **SaaS App**: 24 checklist items, 4 audit types (security/ux/legal/performance)
- **Content Site**: 15 items, 3 audit types
- **Client Project**: 7 items, 2 audit types

## Launch Lifecycle Phases

1. **Validate** (W-8): Competitive research, domain check, MVP scope
2. **Build** (W-7 to W-6): Scaffold, GitHub, Vercel, Supabase, auth, payments, legal, PostHog, security audit
3. **Brand** (W-5): Content Flywheel brand, logo, voice, LinkedIn, newsletter, initial content
4. **Pre-Launch** (W-4 to W-1): Accounts, community, directories, content prep, outreach
5. **Launch** (W-0): Hour-by-hour playbook
6. **Growth** (W+1 to W+4): Results, analytics, Content Flywheel activation, newsletter, iteration

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=              # For launch strategy generation
```
