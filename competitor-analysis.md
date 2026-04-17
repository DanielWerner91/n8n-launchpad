# Competitor Analysis — LaunchPad

**Date:** 2026-04-17
**Depth:** deep
**Roster:** 20 competitors
**Scope:** Dual-audience — personal solo-founder tool now, future SaaS for indie hackers / small teams later
**Strategic question:** None specified — general scan (balanced across gaps, table stakes, UX, AI, pricing)

---

## Executive Summary

1. **LaunchPad occupies a genuine white-space quadrant.** On a 2x2 of "solo-founder-first ↔ team-first" × "horizontal PM ↔ launch-lifecycle-specific," LaunchPad is the only tool in the solo-founder + launch-specific quadrant. Every other competitor is either horizontal (generic PM) or team-first (Asana/Linear/ClickUp) or both.

2. **"Launch lifecycle as a first-class primitive" is defensible.** Only Asana has a serious launch angle (Product Launch templates + Launch Planner AI Teammate, priced at $25+/seat Advanced). ClickUp has launch checklists but not staged pipelines. Nobody has LaunchPad's explicit validate→build→brand→pre_launch→launch→growth structure with integrated audits, health score, and PostHog analytics per product.

3. **Biggest attack-vector risk: Operately.** Open-source Apache-2.0, flat pricing, already ships goals + projects + kanban + check-ins with quarterly cadence. Adding a "launch lifecycle" template is a two-week sprint for them. LaunchPad's defense: indie-founder UX + launch-specific phases + PostHog analytics + Content Flywheel integration.

4. **AI agent delegation is now table-stakes.** In 2026, every serious PM tool ships autonomous agents: Linear Agent (Mar 2026), Notion Custom Agents (Feb 2026), Asana AI Teammates (Mar 2026), ClickUp Super Agents (Dec 2025), Dart AI Chat+Agents, Airtable Omni + Field Agents. LaunchPad's Claude-only strategy generation is thin. Must ship autonomous launch-task agents in the next 90 days.

5. **Height's shutdown (Sept 2025) is the cautionary tale.** $18.3M raised from Redpoint/Matrix/Lightspeed + Naval. Pioneered "autonomous PM." Couldn't convert tech into sustainable GTM. LaunchPad must not pick the same path (invent category, no distribution).

6. **The WIP opportunity.** WIP.co (3,694 makers, 5,171 projects, solo-founder Marc Köhlbrugge) owns the exact target audience but has no real PM. A plausible path: partner with WIP (or undercut it on "ship log + kanban + launch plan + analytics"). Indie-founder brand is the moat neither Asana nor Linear can buy.

7. **Pricing anchor.** Dart AI at $8/mo (annual) sets the floor. ClickUp Business $12 + AI $9 = $21. Notion Business $20. Operately $82/mo flat for 50 users. For LaunchPad SaaS pivot, $12-15/mo per founder (flat, all features) is the right price band — undercuts per-seat incumbents, premium vs Dart, defensible vs Operately.

---

## Roster

| # | Name | Category | Founded | Team | Funding | Rating | URL |
|---|------|----------|---------|------|---------|--------|-----|
| 1 | Linear | incumbent | 2019 | 203 | $134M Series C ($1.25B val) | G2 4.5 | linear.app |
| 2 | Notion | incumbent | 2013 | 1,200 | $343M ($11B val) | G2 4.6 | notion.so |
| 3 | Asana | incumbent | 2008 | — | Public (NYSE:ASAN) | G2 4.3 | asana.com |
| 4 | Trello | incumbent | 2011 | — | Acquired by Atlassian ($425M) | G2 4.4 | trello.com |
| 5 | ClickUp | incumbent | 2017 | 1,800 | $537.5M Series C ($4B val) | G2 4.7 | clickup.com |
| 6 | Airtable | incumbent | 2012 | 927 | $1.35B Series F ($4B val) | G2 4.6 | airtable.com |
| 7 | Dart AI | ai-native | 2022 | 10 | $500K YC seed | G2 4.4 | dartai.com |
| 8 | Height | ai-native | 2018 | — | $18.3M (DEFUNCT Sep 2025) | — | height.app |
| 9 | Tana | ai-native | 2020 | — | $25M Series A ($100M val) | — | tana.inc |
| 10 | Superthread | ai-native | 2020 | 12 | Seed (undisclosed) | — | superthread.com |
| 11 | Plane | ai-native | 2022 | — | $4M seed | G2 (14 reviews) | plane.so |
| 12 | workstreams.ai | ai-native | 2018 | 12 | Bootstrapped ($1.3M ARR) | — | workstreams.ai |
| 13 | Taskade | ai-native | 2017 | — | $5M seed | G2 4.5 | taskade.com |
| 14 | Vibe Kanban | ai-native | 2021 | 10 | YC (via BloopAI) | 25.2K GH stars | vibekanban.com |
| 15 | Chordio | ai-native | 2022 | 4 | YC S22 | — | chordio.com |
| 16 | Motion | ai-native | 2019 | 115 | $102M Series C ($550M val) | G2 4.5 | usemotion.com |
| 17 | WIP | adjacent | 2016 | 1 | Bootstrapped | — | wip.co |
| 18 | Sunsama | adjacent | 2017 | 9 | $2.75M ($1.5M ARR, 300K users) | Capterra 4.7 | sunsama.com |
| 19 | Capacities | adjacent | 2021 | 4 | Bootstrapped ($440K ARR) | — | capacities.io |
| 20 | Operately | adjacent | 2024 | — | Bootstrapped | 442 GH stars | operately.com |

Full per-competitor profiles are in [`.competitor-analysis-wip/`](.competitor-analysis-wip/) (YAML, 5 batch files). Highlights below.

---

## Competitor Profiles (Key Findings)

### Incumbents

**Linear** — $100M ARR, $1.25B valuation, dev-team gold standard. Launched Linear Agent (Mar 2026) with CEO declaration "issue tracking is dead." Strengths: speed, keyboard UX, codebase-aware agent tasks. Weakness for LaunchPad's space: developer-centric, no launch pipeline, AI gated at $16/seat.

**Notion** — 100M users, 4M paying, $600M ARR, Notion 3.3 Custom Agents (Feb 2026), 20-min autonomous runs. Strength: flexible DBs could model launch pipelines. Weakness: performance degrades >5K rows, no native launch stages, credits-based AI after May 2026 adds unpredictability.

**Asana** — Public company ($790M revenue), Winter 2026 release shipped 21 prebuilt AI Teammates including **Launch Planner** — the most direct feature overlap with LaunchPad. Strength: portfolio + goals + launch templates. Weakness: heavy for solo founders, slow at scale, per-seat $25+ Advanced.

**Trello** — 50M+ users, Atlassian Intelligence + Butler AI rules. Lowest barrier to entry. Weakness: no multi-project roll-up, boards get cluttered at scale, AI limited to Premium+, no autonomous agents.

**ClickUp** — $300M revenue, 20M users, ClickUp 4.0 redesign + Super Agents (Dec 2025). Best template library: Product Launch Checklist, Go-to-Market Strategy, Product Roadmap. Weakness: kitchen-sink UX, AI gated $9-28/seat add-on.

**Airtable** — $478M ARR, ProductCentral supports launch-day management (asset tracker, run-of-show), DeepSky AI acquisition Oct 2025, David Azose (ex-OpenAI) as CTO. Weakness: expensive at scale, not native PM, must build launch schemas yourself.

### AI-native

**Dart AI** — Only $500K raised but **closest direct competitor for solo founders**: chat-first AI as primary UX, generous free tier (4 teammates + unlimited tasks + AI agents), $8/mo annual entry price, full PM parity (Gantt/sprints/roadmaps). Weakness: no portfolio/launch pipeline, no mobile, SOC2 uncertified.

**Height (DEFUNCT)** — Shut down Sep 24, 2025 after raising $18.3M. Pioneered "autonomous PM" category but couldn't convert tech to GTM. LaunchPad cautionary tale.

**Tana** — $25M Series A, $100M valuation, pivoted Mar 2026 to "meetings that ship" agentic positioning. Supertags are genuinely novel. Weakness: steep curve (days to weeks), mobile 2.15/5, no launch workflows.

**Superthread** — Tiny 12-person team with novel pay-what-you-want pricing ($3-$67/mo). Closest to LaunchPad's "unified workspace" spirit. Weakness: no launch pipeline, no portfolio, <10 integrations, no SOC2.

**Plane** — 48K GitHub stars, #1 OSS PM tool, SOC2/ISO 27001/GDPR/CCPA, AGPL-3.0, MCP server (2026). Only $4M raised but most mature feature set. Engineering-team positioned, not solo founders.

**workstreams.ai** — Bootstrapped $1.3M ARR, Slack-native Kanban. Niche but narrow. M&A signal April 2025 raises wind-down risk.

**Taskade** — Genesis prompt-to-app + unlimited AI agents at flat team pricing ($19/mo for 10 users on Pro). Heavy pivot noise (docs → AI agents → Living Software). No launch pipeline, no PostHog analytics.

**Vibe Kanban** — 25.2K GitHub stars. **Highly relevant to LaunchPad audience** (solo founders using Claude Code). Strictly dev-agent-orchestration: no launch, no portfolio, no non-code workflows. Best treated as **integration partner**, not competitor.

**Chordio** — YC S22, 4-person team, Claude-Code-native enterprise prototyping. Narrow ICP (enterprise PMs/designers). Low overlap with LaunchPad.

**Motion** — $102M raised, $550M valuation, 115 employees. Best-in-class AI auto-scheduler + "AI Employees" agentic rebrand. Per-seat $19-29 (3-4x Taskade). Weakness: mobile 2.7/5, multiple price increases in 12 months, no portfolio-of-apps view.

### Adjacent / Wildcard

**WIP** — Solo-founder Marc Köhlbrugge, 3,694 makers, 5,171 projects. **Owns the exact target audience** LaunchPad wants. Pure social accountability tracker — no kanban, no phases, no AI. Either partner with or undercut.

**Sunsama** — $1.5M ARR profitable, "calm productivity" daily-planning mindshare. 300K users, Capterra 4.7. Not a PM tool — execution cockpit. Low threat, possible integration.

**Capacities** — Bootstrapped $440K ARR, 10K+ users, object-based PKM with kanban + tasks. Thinker/researcher audience. Could expand but audience mismatch.

**Operately** — **Highest attack-vector risk.** Open-source Apache-2.0, flat pricing ($82/mo for 50 users, not per-seat), goals + projects + kanban + check-ins + AI coach "Alfred," v1.5 shipped Apr 2026 (quarterly cadence). 442 GitHub stars is thin but trajectory is real.

---

## Frameworks

### Porter's Five Forces (Category: Launch-Lifecycle PM for Solo Founders)

| Force | Intensity | Justification |
|-------|-----------|---------------|
| **Rivalry among existing competitors** | HIGH | Linear, Notion, Asana, ClickUp, Airtable all shipped autonomous AI agents in 2025-2026. Dart, Plane, Operately compete on OSS / price / AI-depth. 20 credible players with overlapping surfaces. |
| **Threat of new entrants** | HIGH | AI lowered build cost dramatically — Operately shipped v1.0→v1.5 in 9 months; Vibe Kanban went from Show HN (July 2025) to 25K stars. Category is gettable. |
| **Threat of substitutes** | MEDIUM | Spreadsheets, Notion databases, Trello boards, and GitHub Projects all serve as substitutes for solo founders today. Custom Claude Code + markdown files is a real substitute for AI-forward founders. |
| **Buyer power (solo/SMB)** | HIGH | Race to generous free tiers (Dart, Plane, Capacities, Notion, Trello). Switching costs low. |
| **Buyer power (enterprise)** | LOW | SSO, audit logs, admin consoles create lock-in. Not LaunchPad's concern yet. |
| **Supplier power (AI APIs)** | MEDIUM | Anthropic/OpenAI/Gemini have pricing leverage; expect AI-credit compression (Notion, Asana, ClickUp all metered now). Infrastructure abundant (Vercel, Supabase). |

**Net read:** market is attractive because nobody has solved solo-founder launch-lifecycle specifically, but it is crowded in adjacent spaces and capital-poor new entrants can ship fast. LaunchPad's moat is audience + opinionated launch phases + integrated analytics — not technology.

### SWOT — Top 5 Most Strategically Relevant

#### 1. Asana (direct launch-feature overlap)

- **Strengths:** Product Launch + Campaign Management templates; Portfolios for multi-project; **AI Launch Planner Teammate** directly targets LaunchPad JTBD; 200+ integrations; enterprise trust.
- **Weaknesses:** Heavy for solo founders; per-seat $25+ Advanced; slow at scale; one-assignee-per-task; no PostHog-style analytics; opaque pricing.
- **Opportunities:** Could rebrand AI Teammates as "founder-grade" + simplify pricing; deepen AI Studio Pro.
- **Threats:** Linear Agent + Notion Custom Agents commoditize "AI PM teammate"; Dart undercuts on price.

#### 2. Operately (highest attack-vector risk)

- **Strengths:** Apache-2.0 OSS; flat pricing (no per-seat); founder pedigree (Semaphore CI); quarterly cadence; self-hostable.
- **Weaknesses:** Only 442 stars; no mobile; minimal integrations; Alfred AI in beta; no logos/case studies; solo founder not first-class.
- **Opportunities:** Add launch-lifecycle phase templates (2-week sprint); anyone can fork.
- **Threats:** Incumbents (Notion/Linear) adding goals+OKRs; bootstrapped capital risk.

#### 3. Dart AI (closest AI-native at solo-founder price)

- **Strengths:** Chat-first AI as primary UX (not bolted on); generous free tier (4 teammates + agents); $8/mo entry — cheapest of top; fast-shipping 10-person YC team; 4.4/5 G2.
- **Weaknesses:** Only $500K raised (funding risk); no SOC2 certified; API docs early-stage; no portfolio/launch pipeline; no mobile app.
- **Opportunities:** Add launch-specific workflows; partner with Vibe Kanban for dev agents.
- **Threats:** Linear/Notion/ClickUp copying AI-chat-first UX with their distribution; funding shortfall.

#### 4. Notion (horizontal workspace default)

- **Strengths:** 100M users, 4M paying; Notion 3.3 Custom Agents; flexible DBs can model any workflow; SOC2+ISO+BSI+HIPAA; thousands of integrations.
- **Weaknesses:** Performance degrades >5K rows; mobile UX weak; steep setup curve; no native launch pipeline (DBs-as-hack); credits-based AI unpredictable after May 2026.
- **Opportunities:** Ship launch-specific templates in marketplace; native PostHog embed.
- **Threats:** Linear eating PM, Plane/Operately eating OSS, AI cost compression.

#### 5. ClickUp (templates + depth)

- **Strengths:** Most breadth (replaces 10+ tools); best template library including Product Launch Checklist; Super Agents (Dec 2025); Portfolios + Goals for multi-project; SOC2/ISO/HIPAA; $300M revenue.
- **Weaknesses:** Kitchen-sink UX overwhelms solo founders; AI gated $9-28/seat add-on on top of seat; no native launch-pipeline stage tracking; no founder-focused analytics.
- **Opportunities:** Founder-simplified mode (they won't); VibeUp app builder could cannibalize PM.
- **Threats:** Dart undercuts on price; Linear ate eng mindshare; Notion ate knowledge.

#### Thematic SWOT (remaining 15)

- **Other incumbents (Linear, Trello, Airtable):** Strong compliance + ecosystems but not purpose-built for launch lifecycles. All three have AI now but none have launch-stage templates. Rivalry, not direct threat.
- **AI-native long tail (Tana, Superthread, Plane, workstreams.ai, Taskade, Motion, Vibe Kanban, Chordio):** Deep AI or niche focus; mostly capital-constrained; **none cover portfolio-of-apps-with-launch-stages**. Vibe Kanban is a partner not competitor.
- **Adjacent (WIP, Sunsama, Capacities):** Own partial niches (community, planning, PKM) but none have real PM + launch. WIP owns the audience; others don't.

### Value Proposition Canvas (Compressed)

| Competitor | Jobs addressed | Pains addressed | Gains delivered | What's missing |
|---|---|---|---|---|
| Linear | Build software fast | Bloat, admin | Speed, keyboard UX | Launch phases, portfolio, analytics |
| Notion | Centralize knowledge + work | Tool sprawl | Flexibility, AI agents | Launch pipeline, performance at scale |
| Asana | Coordinate cross-functional work | Missed launches | Launch Planner AI | Solo-founder UX, affordability |
| Trello | Visual task pipeline | Overwhelm | Simplicity | Dependencies, portfolio roll-up, AI depth |
| ClickUp | Replace 10 tools | Tool sprawl | Feature breadth | Simplicity, launch staging |
| Airtable | Build custom workflow apps | No-code bottleneck | Data flexibility, AI agents | Opinionated structure, price |
| Dart AI | Chat with AI to manage projects | PM overhead | AI-first UX, cheap entry | Portfolio, launch phases, mobile |
| Height | Autonomous PM | Ticket grooming | Reasoning engine | **DEAD** (shut down Sep 2025) |
| Tana | AI-native knowledge workspace | Tool switching | Supertags, meeting agent | Project/launch structure |
| Superthread | Unified tasks + docs + meeting AI | Context switching | PWYW pricing | Launch pipeline, integrations |
| Plane | OSS Jira alternative | Lock-in, cost | Self-host + AI | Solo-founder UX, launch phases |
| workstreams.ai | Slack-native Kanban | Chat tool switching | In-Slack execution | Portfolio, depth |
| Taskade | AI workspace + agents | Tool sprawl | Flat pricing, Genesis | Launch pipeline, analytics |
| Vibe Kanban | Orchestrate AI coding agents | Parallel agent conflicts | Git worktree isolation | Launch, portfolio, non-code |
| Chordio | Prototype in real product | Production-touching fear | Source-code handoff | Solo-founder fit, pricing |
| Motion | Auto-schedule deadlines | Manual time-blocking | AI scheduler, AI Employees | Launch phases, portfolio, analytics |
| WIP | Ship accountability | Isolation | Community, streaks | PM tooling, AI |
| Sunsama | Plan realistic day | Overwhelm | Calm rituals | Project/launch structure |
| Capacities | PKM with project bolt-on | Fragmented thinking | Object model, free tier | Launch/PM depth |
| Operately | Run goals + projects | Tool sprawl | OSS, flat pricing, Alfred AI | Launch phases, indie audience, mobile |
| **LaunchPad (us)** | **Launch multiple products** | **Fragmented launch workflows** | **Opinionated lifecycle + analytics** | **AI delegation, mobile, integrations** |

### Positioning Map — 2x2

**Axes:** X = Solo-founder-first ↔ Team-first × Y = Horizontal PM ↔ Launch-lifecycle-specific

```
                          Launch-lifecycle-specific
                                    │
                           Asana*   │
                          ClickUp*  │
                                    │      🎯 LaunchPad
                                    │         (empty quadrant)
                                    │
Team-first ─────────────────────────┼─────────────────────── Solo-founder-first
                                    │
  Linear  Notion  Airtable  Trello  │  WIP
  Motion  Plane  Taskade            │  Sunsama
  Tana  Superthread  Dart  Operately│  Capacities
  Vibe Kanban  Chordio  workstreams │
                                    │
                          Horizontal PM
```

*Asana and ClickUp have launch templates but are team-first, not solo-founder-first. ProductCentral (Airtable) is similar — team-first marketing/launch ops.

**Key insight:** The solo-founder + launch-lifecycle-specific quadrant is **empty**. LaunchPad owns it uncontested — for now. The threat vector is Operately (open source, team-first, could add launch templates) or WIP (owns audience, could add PM). Neither is built yet.

### Strategy Canvas (Blue Ocean Analysis)

Factors scored 0-10. Higher = more investment / stronger offering on this factor.

| Factor | Linear | Notion | Asana | ClickUp | Dart | Plane | Motion | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|
| Price (low = better = 10) | 5 | 6 | 3 | 4 | 9 | 8 | 4 | 7 | 10 | 9 |
| AI agent depth | 9 | 9 | 9 | 9 | 8 | 6 | 7 | 4 | 0 | 4 |
| **Launch-lifecycle structure** | 1 | 2 | 5 | 4 | 1 | 1 | 2 | 2 | 2 | **10** |
| **Multi-project portfolio view** | 4 | 5 | 6 | 6 | 2 | 4 | 4 | 5 | 3 | **9** |
| Solo-founder UX polish | 5 | 4 | 2 | 3 | 7 | 4 | 6 | 3 | 8 | **8** |
| Integration breadth | 8 | 9 | 9 | 10 | 5 | 6 | 6 | 2 | 1 | 3 |
| Enterprise trust (SOC2, SSO) | 9 | 10 | 10 | 9 | 3 | 9 | 6 | 4 | 0 | 2 |
| Shipping velocity | 8 | 9 | 7 | 8 | 7 | 8 | 7 | 7 | 3 | 8 |
| **Built-in product analytics** | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 2 | **9** |

**White space (low-scoring across all competitors):** Launch-lifecycle structure, built-in product analytics, solo-founder UX polish. **These are the three factors LaunchPad should double down on.**

**Where LaunchPad must raise scores:** AI agent depth (currently 4 vs 9 for leaders), integration breadth, enterprise trust (for SaaS pivot).

### JTBD Comparison

Jobs customers actually have when they reach for a tool in this space:

| Job | Linear | Notion | Asana | ClickUp | Dart | Motion | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|
| Track portfolio of side projects in one place | partial | partial | partial | partial | claims-misses | partial | partial | partial | **nails it** |
| Guide me through launching a product for the first time | doesn't address | claims-misses | partial | partial | doesn't | doesn't | doesn't | doesn't | **nails it** |
| Spot which project is at-risk | partial | partial | nails it | nails it | partial | partial | partial | doesn't | **nails it** (health score) |
| Show real-time analytics per launched product | doesn't | doesn't | doesn't | doesn't | doesn't | doesn't | doesn't | partial | **nails it** (PostHog) |
| Delegate tasks to AI agents autonomously | nails it | nails it | nails it | nails it | nails it | nails it | partial | doesn't | partial |
| Reuse launch playbooks across products | doesn't | partial | partial | partial | doesn't | doesn't | partial | doesn't | **nails it** (templates) |
| Keep me accountable to shipping (streaks, check-ins) | doesn't | doesn't | partial | partial | doesn't | doesn't | nails it | **nails it** | partial |
| Handoff work to Claude Code agent | doesn't | partial | doesn't | doesn't | partial | doesn't | partial | doesn't | **nails it** (features backlog pattern) |

**Reading:** LaunchPad "nails" 5 jobs uniquely, but is behind on "delegate tasks to AI agents autonomously" — the fastest-commoditizing table stake in 2026. Closing that gap is the single highest-leverage backlog item.

### Moat Assessment

| Competitor | Data | Network | Switching | Brand | Regulatory | Overall |
|---|---|---|---|---|---|---|
| Linear | medium | medium | strong | strong | medium | **strong** |
| Notion | strong | strong (100M users) | strong | strong | strong | **very strong** |
| Asana | medium | medium | strong | strong | strong | **strong** |
| Trello | weak | strong (50M users) | medium | strong | medium (via Atlassian) | **strong** |
| ClickUp | medium | medium | medium | medium | strong | **medium** |
| Airtable | medium | medium | strong (schemas) | medium | strong | **strong** |
| Dart AI | weak | weak | weak | weak | none | **weak** |
| Height | — | — | — | — | — | **DEFUNCT** |
| Tana | weak | medium (waitlist) | medium (supertags) | medium | weak | **medium** |
| Superthread | weak | weak | weak | weak | weak | **weak** |
| Plane | weak | strong (48K stars) | medium | medium (OSS) | strong | **medium** |
| workstreams.ai | weak | weak (Slack bound) | weak | weak | weak | **weak** |
| Taskade | weak | weak | weak | weak | weak | **weak** |
| Vibe Kanban | none | strong (25K stars) | weak | strong (niche) | none | **medium (niche)** |
| Chordio | none | none | weak | weak | weak | **weak** |
| Motion | weak | medium | medium | strong | medium | **medium** |
| WIP | weak | **strong (audience)** | weak | strong (indie) | none | **medium (niche)** |
| Sunsama | weak | weak | medium (rituals) | medium | weak | **weak-medium** |
| Capacities | weak | weak | medium (objects) | weak | weak | **weak** |
| Operately | none | weak | weak | weak | none | **weak** |
| **LaunchPad** | weak (aud logs) | none | weak | weak | none | **weak — must build moat** |

**Strategic read:** Most AI-native startups have weak-to-none moats across every dimension. That's the opportunity AND the risk — easy to enter, easy to be displaced. LaunchPad's moat must be built via: (a) audience (indie-founder brand), (b) switching cost (accumulated projects + analytics history), (c) ecosystem (Content Flywheel integration, Vibe Kanban bridge, Claude Code handoff).

---

## Feature Matrix

**Legend:** Y = has it, ~ = partial/limited, N = doesn't have.
**Tier:** TS = table-stakes (≥70% have it — missing is P0 risk), D = differentiator (1-3 have it), W = white-space (0 have it — opportunity).

### Onboarding & Setup

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Google OAuth sign-in | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | **Y** |
| Apple/Microsoft SSO | D | Y | Y | Y | Y | Y | ~ | Y | Y | N | N | **N** |
| Invite-link signup | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **N** |
| Template picker on new project | TS | Y | Y | Y | Y | ~ | Y | Y | Y | Y | N | **Y** (3 templates) |
| Import from Jira/Linear/Asana | TS | Y | Y | Y | Y | Y | Y | ~ | Y | N | N | **N** |

### Core Project Management

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kanban board | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | **Y** |
| List/table view | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Y** |
| Timeline/Gantt view | TS | Y | Y | Y | Y | Y | Y | Y | Y | N | N | **Y** (timeline) |
| Calendar view | TS | Y | Y | Y | Y | Y | Y | Y | Y | N | N | **N** |
| Custom fields | TS | Y | Y | Y | Y | Y | Y | Y | Y | ~ | N | **Y** (labels, priority) |
| Task dependencies | TS | Y | Y | Y | Y | Y | ~ | Y | Y | N | N | **N** |
| Sub-tasks | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Y** (features) |
| Milestones | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | **Y** (checklist) |
| Sprints / cycles | D | Y | ~ | ~ | Y | N | Y | ~ | Y | ~ | N | **N** |
| Recurring tasks | D | Y | Y | Y | Y | Y | Y | Y | Y | N | N | **N** |

### Portfolio & Multi-Project

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Multi-project portfolio view | TS | Y | ~ | Y | Y | ~ | ~ | ~ | Y | Y | Y | **Y** (pipeline board) |
| Cross-project timeline | D | Y | ~ | Y | Y | ~ | ~ | ~ | Y | ~ | N | **Y** (/timeline) |
| Cross-project health dashboard | D | ~ | ~ | Y | Y | ~ | N | ~ | ~ | Y | N | **Y** (quick stats + health) |
| Portfolio-level analytics (product metrics) | **W** | N | N | N | N | N | N | N | N | N | ~ | **Y** (PostHog per launch) |

### Launch-Specific

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Launch-lifecycle staged pipeline (validate→build→launch→grow) | **W** | N | N | ~ | N | N | N | N | N | N | N | **Y** (6 phases) |
| Launch readiness score | **W** | N | N | ~ | N | N | N | N | N | N | N | **Y** |
| Product-launch templates | D | N | ~ | Y | Y | ~ | N | N | N | N | N | **Y** (3 types) |
| Launch directory list (where to announce) | **W** | N | N | N | N | N | N | N | N | N | N | **Y** |
| Launch-day hour-by-hour playbook | **W** | N | N | N | N | N | N | N | N | N | N | **Y** (week-0) |
| Post-launch growth phase tracking | **W** | N | N | N | N | N | N | N | N | N | N | **Y** (W+1-W+4) |

### AI & Automation

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chat-with-AI interface | TS (2026) | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | **N** |
| Autonomous AI agents | TS (2026) | Y | Y | Y | Y | Y | Y | Y | ~ | ~ | N | **N** |
| AI task auto-fill / auto-generate subtasks | TS (2026) | Y | Y | Y | Y | Y | Y | Y | Y | N | N | **~** |
| AI planning / roadmap generation | D | Y | Y | Y | Y | Y | Y | ~ | Y | N | N | **Y** (strategy) |
| AI meeting transcription + action items | D | N | Y | ~ | Y | N | N | N | N | N | N | **N** |
| MCP server / protocol support | D | Y | Y | N | N | N | N | N | Y | N | N | **N** |
| Claude Code / coding-agent integration | **W** | ~ | ~ | N | N | N | ~ | N | ~ | N | N | **~** (features pattern) |
| AI health-check / operational coach | D | N | ~ | ~ | ~ | ~ | ~ | ~ | N | Y | N | **N** |

### Analytics & Measurement

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Task/issue dashboards | TS | Y | Y | Y | Y | Y | ~ | Y | Y | Y | N | **Y** |
| Built-in product analytics (PostHog-style) | **W** | N | N | N | N | N | N | N | N | N | N | **Y** |
| Revenue / MRR tracking per project | **W** | N | N | N | N | N | N | N | N | N | ~ | **N** |
| Build-in-public / shareable progress | **W** | N | ~ | N | N | N | N | N | N | N | Y | **N** |
| Session replay integration | **W** | N | N | N | N | N | N | N | N | N | N | **N** |

### Collaboration

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Real-time multi-player editing | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | **N** |
| Comments + @mentions | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Y** |
| Guest access / external sharing | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | **N** |
| Team seats / multi-user | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **N** |

### Integrations & API

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Public REST API | TS | Y | Y | Y | Y | Y | ~ | Y | Y | ~ | N | **N** |
| Webhooks | TS | Y | Y | Y | Y | Y | ~ | ~ | Y | N | N | **N** |
| Slack integration | TS | Y | Y | Y | Y | Y | Y | Y | Y | ~ | N | **N** |
| Discord / Telegram | D | ~ | ~ | ~ | ~ | ~ | Y | ~ | ~ | N | N | **N** |
| GitHub integration | TS | Y | Y | Y | Y | Y | Y | ~ | Y | N | N | **N** |
| Zapier / Make | TS | Y | Y | Y | Y | Y | Y | Y | N | N | N | **N** |
| MCP server | D (2026) | Y | Y | N | N | N | ~ | N | Y | N | N | **N** |

### Mobile & Platforms

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Native iOS app | TS | Y | Y | Y | Y | Y | N | Y | Y | N | N | **N** |
| Native Android app | TS | Y | Y | Y | Y | Y | N | Y | Y | N | N | **N** |
| Responsive web | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Y** |
| Offline mode | D | ~ | ~ | ~ | ~ | ~ | Y | ~ | ~ | N | N | **N** |
| Desktop app | D | Y | Y | Y | Y | N | N | Y | N | N | N | **N** |

### Admin & Trust

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SOC2 Type II | TS (for SaaS) | Y | Y | Y | Y | Y | ~ | ~ | Y | N | N | **N** |
| GDPR | TS | Y | Y | Y | Y | Y | ~ | Y | Y | N | N | **N** |
| SAML SSO | TS (enterprise) | Y | Y | Y | Y | Y | Y | ~ | Y | N | N | **N** |
| SCIM provisioning | D | Y | Y | Y | Y | Y | Y | N | Y | N | N | **N** |
| Audit logs | D | Y | Y | Y | Y | Y | ~ | ~ | Y | N | N | **Y** (activity log) |
| Self-host option | D | N | N | N | N | N | N | N | Y | Y | N | **N** |

### Content & Knowledge

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Docs/pages | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **N** |
| Wiki | D | Y | Y | Y | Y | Y | ~ | ~ | Y | ~ | N | **N** |
| Comments on docs | TS | Y | Y | Y | Y | Y | Y | Y | Y | Y | ~ | **Y** (project comments) |
| Version history | TS | Y | Y | Y | Y | Y | ~ | ~ | Y | N | N | **N** |
| Template marketplace | D | ~ | Y | Y | Y | ~ | ~ | ~ | ~ | N | N | **N** |

### Launch-Day Execution

| Feature | Tier | Linear | Notion | Asana | ClickUp | Airtable | Dart | Motion | Plane | Operately | WIP | **LaunchPad** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Brand/logo mgmt per product | **W** | N | N | ~ | ~ | ~ | N | N | N | N | N | **Y** (Content Flywheel) |
| Directory list (PH, BetaList, launch targets) | **W** | N | N | N | N | N | N | N | N | N | N | **Y** |
| Pre-launch audit sequence (security/legal/UX/perf) | **W** | N | N | N | N | N | N | N | N | N | N | **Y** (audits on intervals) |
| Hour-by-hour launch playbook | **W** | N | N | N | N | N | N | N | N | N | N | **Y** |
| Growth-phase checklist | **W** | N | N | N | N | N | N | N | N | N | N | **Y** |

**Totals / tier counts:**

- **Features in matrix:** 76 total across 11 categories
- **Table-stakes features LaunchPad is missing (P0 gaps):** 18 — including chat-with-AI, autonomous agents, native mobile, API/webhooks, real-time collab, SOC2, team seats, task dependencies, Zapier, calendar view
- **White-space features LaunchPad already has (moat):** 11 — launch-lifecycle pipeline, readiness score, PostHog analytics, launch directory, hour-by-hour playbook, growth tracking, brand mgmt, audit sequence, pre-built launch templates
- **Differentiators competitors have that LaunchPad should evaluate matching:** 12 — MCP support, offline mode, Claude Code integration (deeper), self-host, AI coach, sprints/cycles, template marketplace

---

## Gap Analysis

### 1. White-Space Features (nobody offers these)

1. **Launch-lifecycle as first-class primitive** — already owned by LaunchPad. Defend aggressively.
2. **Built-in product analytics per launched product** (PostHog integration) — owned by LaunchPad. Extend with revenue/MRR/replays.
3. **Build-in-public micro-site per project** — WIP has partial (ship log); nobody combines with PM. Huge solo-founder appeal.
4. **AI launch coach that reviews readiness + suggests next actions** — Operately's Alfred is closest; nobody has launch-specific coaching.
5. **Claude Code ↔ project features bridge** — LaunchPad has the pattern; nobody else has formalized it (Vibe Kanban is dev-only orchestration).
6. **Financial tracking per product** (MRR, runway, costs) — WIP touches it; none integrate with PM.
7. **Competitor auto-audit per project** (this very skill as recurring audit) — nobody.
8. **Session replay embed per launched product** (PostHog session replays) — nobody.

### 2. Under-Served JTBDs (everyone "partial" or worse)

1. **"Guide me through launching for the first time."** Only Asana partially addresses via templates. LaunchPad's explicit phase pipeline is unique.
2. **"Show real-time analytics per launched product."** Zero competitors do this natively. Only LaunchPad.
3. **"Handoff work to Claude Code agent."** Partial in Dart/Plane/Operately (via MCP); nobody has the feature-backlog pattern LaunchPad uses.
4. **"Keep me accountable to shipping."** Only Operately (check-ins) and WIP (streaks) nail it. LaunchPad should add streaks/check-ins.

### 3. Adjacent Markets LaunchPad Could Expand Into

- **Newsletter automation per product** (already has via Content Flywheel → procure.blog pattern).
- **Build-in-public community layer** (attack WIP directly).
- **Launch playbook library / marketplace** (monetize the IP).
- **AI-agent orchestration for non-code tasks** (bridging to Vibe Kanban-like territory, for marketing/content tasks).

### 4. Pricing / Packaging Gaps

- **Flat-rate pricing for solo founders** — Operately ($82/mo, 50 users), Taskade ($19/mo, 10 users). Per-seat models (Linear, Asana, Notion) are hostile to solo founders with VAs or contractors.
- **Generous free tier specifically sized for "all projects, 1 user"** — Dart nails it. LaunchPad's current "personal use only" is fine now but the SaaS pivot should replicate Dart's model.
- **"Builder" tier ($5/mo)** — between free and full paid, specifically for indie hackers shipping 5-10 projects. No incumbent offers this shape.

### 5. UX / Polish Gaps

- **Command palette (cmd+k)** — Linear, Notion, Height, Dart all have. LaunchPad has keyboard shortcuts but no palette.
- **Mobile app** — only Linear, Notion, Asana, ClickUp, Airtable, Motion, Plane have native. Non-negotiable for SaaS.
- **Command-K / universal search** — nice-to-have.
- **Public roadmap / changelog** — Linear, Plane, Operately, Capacities, Sunsama have. Trust signal.
- **Template marketplace** — Notion, Asana, ClickUp have. Network effect.

### 6. Integration Gaps

- **Slack / Discord / Telegram** notifications for launch-day — Asana/ClickUp have Slack deep; LaunchPad has none.
- **GitHub webhook** for commit-to-project activity — Linear/Plane have. LaunchPad's audience uses GitHub heavily.
- **Vercel integration** — nobody has this. LaunchPad's audience deploys to Vercel (this repo included).
- **Supabase integration** — nobody. Same story.
- **Zapier / Make** — all competitors have. LaunchPad has none.
- **MCP server** — Linear, Notion, Plane, Dart have. Exposing LaunchPad as MCP server enables "Claude talks to my portfolio."

### 7. AI Feature Gaps (deepest gap vs competitors)

- **Chat-with-AI interface** — every 2026 competitor has; LaunchPad has only strategy generation.
- **Autonomous AI agents for task execution** — table stakes. LaunchPad must ship in Q2 2026.
- **AI task auto-fill / generation** — Dart, Asana, Notion all have.
- **AI standups / summaries** — Dart has.
- **MCP server** — exposing LaunchPad projects to Claude Desktop / Claude Code.
- **AI validation agent** — run market scan + competitor audit + domain check on new project creation.
- **AI coach (Operately "Alfred" analog)** — proactive recommendations based on health score.

---

## Recommended Backlog (25 items)

Ranked. Full details + implementation hints in [`competitor-analysis.json`](competitor-analysis.json) `backlog[]` and in LaunchPad's `launchdeck_features` table (source=claude).

### HIGH priority (ship next 90 days)

1. **Chat-with-AI interface for all project + launch operations** (TS, closing AI gap)
2. **Autonomous AI agent delegation for launch tasks** (TS, closing AI gap)
3. **Cross-project portfolio analytics dashboard** (white-space, moat deepening)
4. **Native mobile app (Expo, read-mostly then interactive)** (TS)
5. **MCP server exposing LaunchPad to Claude Desktop / Code** (D, closing AI gap)
6. **Build-in-public public micro-site per project** (white-space, WIP attack)
7. **AI "launch coach" proactive recommendations from health score** (white-space, Operately-Alfred analog)
8. **Public REST API + webhooks** (TS)

### MEDIUM priority (ship Q3 2026)

9. **Slack / Discord / Telegram launch-day notifications** (integration gap)
10. **Template marketplace (users share launch playbooks)** (D, network effect)
11. **Command palette (cmd+k)** (polish, table-stake)
12. **Public roadmap + changelog page** (polish, trust signal)
13. **Zapier / Make integration** (integration, TS)
14. **GitHub webhook integration** (integration, LaunchPad audience uses GitHub)
15. **Vercel integration** (integration, unique to LaunchPad audience)
16. **Weekly digest email** (polish, reengagement)
17. **Goals / OKRs per project** (TS for 2026 PM)
18. **Task dependencies + blockers** (TS)
19. **Vibe Kanban bridge — show Claude Code session status per project** (integration, ecosystem)
20. **Financial tracking per project (MRR, revenue, runway)** (white-space)

### LOW priority (backlog)

21. **Export to markdown / PDF / CSV** (TS, data portability)
22. **Competitor auto-audit as recurring audit type** (white-space, meta)
23. **Archive vs Sunset distinction** (polish)
24. **Health score trend line chart** (polish)
25. **PostHog session replay embed** (polish, moat deepening)

---

## Sources

Grouped by competitor. Full detail in WIP YAML files ([`.competitor-analysis-wip/`](.competitor-analysis-wip/)).

**Linear:** linear.app/pricing, linear.app/changelog, linear.app/agents, linear.app/security, techcrunch.com/2025/06/10/atlassian-rival-linear-raises-82m-at-1-25b-valuation/, getlatka.com/companies/linear.app, g2.com/products/linear/reviews

**Notion:** notion.com/pricing, notion.com/product/ai, notion.com/releases/2026-02-24, notion.com/security, notion.com/blog/gic-sequoia-index-purchase-notion-shares, g2.com/products/notion/reviews, capterra.com/p/186596/Notion/reviews/

**Asana:** asana.com/pricing, asana.com/product/ai/ai-studio, asana.com/product/ai/ai-teammates, asana.com/templates/product-marketing-launch, asana.com/features/goals-reporting/portfolios, investors.asana.com/news-releases/news-release-details/asana-announces-fourth-quarter-and-fiscal-year-2026-results, asana.com/inside-asana/winter-release-2026

**Trello:** trello.com/pricing, support.atlassian.com/trello/docs/activate-atlassian-intelligence-for-your-trello-workspace/, atlassian.com/blog/trello/butler-power-up-trello-automation, atlassian.com/blog/trello/trello-new-year-board-builder, techcrunch.com/2017/01/09/atlassian-acquires-trello/

**ClickUp:** clickup.com/pricing, clickup.com/security, getlatka.com/blog/clickup-revenue/, feedback.clickup.com/changelog, clickup.com/templates/product-launch-checklist-t-176181385

**Airtable:** airtable.com/pricing, airtable.com/company/trust-and-security, sacra.com/c/airtable/, maginative.com/article/airtable-bets-big-on-ai-agents-with-omni-reboots-as-an-ai-native-app-platform/, airtable.com/newsroom/build-better-products-airtable-new-productcentral

**Dart AI:** dartai.com/pricing, dartai.com/features, ycombinator.com/companies/dart, crunchbase.com/organization/dart-08b6, g2.com/products/dart-2025-07-17/reviews, producthunt.com/products/dartai

**Height:** height.app/autonomous, businesswire.com/news/home/20241008197812/en, x.com/height_app/status/1903820182557999555, creativerly.com/height-app-is-shutting-down/, skywork.ai/skypage/en/Height-App-The-Rise-and-Sunset-of-an-AI-Project-Management-Pioneer/

**Tana:** techcrunch.com/2025/02/03/tana-snaps-up-25m-with-its-ai-powered-knowledge-graph-for-work, outliner.tana.inc/pricing, blog.saner.ai/tana-reviews/, outliner.tana.inc/articles/tana-current-march-2026

**Superthread:** superthread.com, superthread.com/pricing, crunchbase.com/organization/superthread, g2.com/products/superthread/reviews

**Plane:** github.com/makeplane/plane, plane.so/pricing, plane.so/self-hosted, plane.so/for-enterprise, techcrunch.com/2023/11/28/plane-takes-on-jira-with-open-source-project-management-tools-for-software-teams/

**workstreams.ai:** workstreams.ai, getlatka.com/companies/workstreams.ai, pitchbook.com/profiles/company/436268-62

**Taskade:** taskade.com/pricing, taskade.com/about, ycombinator.com/companies/taskade, crunchbase.com/organization/taskade, g2.com/products/taskade-taskade/reviews

**Vibe Kanban:** vibekanban.com, github.com/BloopAI/vibe-kanban, ycombinator.com/companies/vibe-kanban, news.ycombinator.com/item?id=44533004, virtuslab.com/blog/ai/vibe-kanban, vibekanban.com/release-notes

**Chordio:** ycombinator.com/companies/chordio, chordio.com, producthunt.com/products/chordio-workbench

**Motion:** usemotion.com/pricing, ycombinator.com/companies/motion, businesswire.com/news/home/20250905188051/en/Motion-Raises-$60M-at-$550M-Valuation, pitchbook.com/profiles/company/433410-40, crunchbase.com/organization/motion-f1df, g2.com/products/motionapp/reviews

**WIP:** wip.co, wip.co/about, wip.co/projects, wip.co/posts/wip-is-now-invite-only-and-free-c9wkua, hackernoon.com/founder-interviews-marc-kohlbrugge-of-wip-4f2d6d696d5c

**Sunsama:** sunsama.com, sunsama.com/pricing, crunchbase.com/organization/sunsama, ycombinator.com/companies/sunsama, getlatka.com/companies/sunsama, capterra.com/p/145616/Sunsama/reviews/

**Capacities:** capacities.io, capacities.io/pricing/, capacities.io/whats-new/release-54/, capacities.io/whats-new/release-57/, getlatka.com/companies/capacities.io/customers, nesslabs.com/capacities-featured-tool-update

**Operately:** operately.com, operately.com/pricing, operately.com/features/, operately.com/releases/, github.com/operately/operately, operately.com/releases/v140/
