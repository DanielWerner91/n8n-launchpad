# Phase 8: Quality

> Pipeline stage: build
> Prerequisites: Phase 6 (Core Features) substantially complete
> Skills: /quality-audit, /security-audit
> Estimated items: 3 checklist items

## Overview

Run security and quality audits before going live. Fix all critical and high-severity findings. This is the gate between "built" and "ready to deploy."

## Checklist Items

### [quality] Security audit passed
**Approach:** Run `/security-audit` which covers 6 phases:
1. Project discovery
2. Secret/credential exposure scan
3. API and backend security review
4. Data and user safety check
5. Infrastructure and deployment review
6. Final report with severity-rated findings

Fix all Critical and High findings before proceeding. Medium findings are acceptable for launch but should be tracked.

Common things to check manually:
- No API keys or secrets in client-side code
- No hardcoded webhook URLs
- RLS policies are correct and tested
- Webhook endpoints verify signatures
- No SQL injection vectors (using Supabase client, not raw SQL)
- CORS headers are appropriate
**Skill:** `/security-audit`
**Done when:** Security audit report shows zero Critical or High findings. Report is saved as a project comment.
**References:** []
**Depends on:** Core features built

### [quality] Quality audit passed
**Approach:** Run `/quality-audit` which covers:
1. Functional testing (all features work end-to-end)
2. Data integrity (no orphaned records, cascading deletes work)
3. UX/design review (consistent spacing, colors, typography)
4. Performance (Lighthouse score > 80, no memory leaks, reasonable load times)
5. API validation (all endpoints return correct status codes, handle errors)
6. Code quality (no unused imports, no console.logs, types are correct)
7. Production readiness (env vars set, build succeeds, no dev-only code)

Fix all findings before proceeding.
**Skill:** `/quality-audit`
**Done when:** Quality audit report shows the app is production-ready. Build succeeds with `npm run build`. No TypeScript errors.
**References:** []
**Depends on:** Core features built

### [quality] PostHog analytics integrated
**Approach:** Install PostHog:
```bash
npm install posthog-js
```
Create `src/lib/posthog.ts` with initialization. Add the PostHog provider to `src/app/layout.tsx`. Track key events:
- Page views (automatic with PostHog)
- Sign ups
- Feature usage (track each core feature interaction)
- Subscription conversions (if payments enabled)

Set up in PostHog dashboard: create the project, get the API key, add to env vars as `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.
**Skill:** null
**Done when:** PostHog dashboard shows real page view events from the live app. Key custom events are being tracked.
**References:** ["https://posthog.com/docs/libraries/next-js"]
**Depends on:** Next.js app scaffolded

## Decision Points

- What's the minimum Lighthouse score? (80 is reasonable for MVP)
- Are there performance-critical features that need special attention?

## Common Pitfalls

- **Skipping the security audit.** Never launch without one. `/security-audit` catches real issues.
- **Not testing on production.** Dev mode hides issues. Always verify with `npm run build && npm start`.
- **PostHog blocking.** Some ad blockers block PostHog. Consider using a reverse proxy or PostHog's EU cloud.
