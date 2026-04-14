# Phase 13: Growth

> Pipeline stage: scaling
> Prerequisites: Phase 12 (Distribution) complete, app is live
> Skills: /app-improver, /linkedin-strategy
> Estimated items: 3 checklist items

## Overview

Analyze what's working, iterate on the product, and scale what drives growth. This is an ongoing phase that runs as long as the app is active.

## Checklist Items

### [growth] Analytics reviewed and acting on data
**Approach:** Check PostHog analytics weekly:
1. **Traffic:** Page views, unique visitors, traffic sources (where are users coming from?)
2. **Conversion:** Sign up rate, free-to-paid conversion (if payments enabled)
3. **Engagement:** Feature usage, session duration, return rate
4. **Drop-off:** Where do users abandon? (Signup form? Onboarding? Pricing page?)

Set up PostHog dashboards for each metric group. Create alerts for significant drops.

Use the LaunchPad analytics tab (PostHog integration) to monitor from the dashboard.
**Skill:** null
**Done when:** PostHog dashboards are set up for traffic, conversion, engagement, and drop-off. Checked weekly. First insights documented as project comments.
**References:** ["https://posthog.com/docs/product-analytics"]
**Depends on:** PostHog analytics integrated

### [growth] User feedback loop
**Approach:** Set up channels to collect user feedback:
1. In-app feedback widget (simple text input that creates a project comment or posts to a Supabase table)
2. Monitor LinkedIn comments on app-related posts
3. Direct outreach to early users (ask what's working and what's not)

Use `/app-improver` to triage feedback into categories (UX Polish, Feature Gap, Responsive, Data Filtering, Missing Action, Broken Flow) and systematically fix issues.
**Skill:** `/app-improver`
**Done when:** At least one feedback channel is active. First round of user feedback has been collected and triaged.
**References:** []
**Depends on:** App is live with real users

### [growth] Content pipeline active
**Approach:** Maintain a consistent content cadence:
1. **LinkedIn:** 3-5 posts per week following `/linkedin-strategy` rules
2. **Newsletter:** Weekly or bi-weekly editions via `/newsletter-builder`
3. **Carousels:** 2 per week (Tue + Thu) via `/carousel-generator`
4. **Infographics:** 1-2 per month for data-driven content

Content should cover:
- Product updates and new features
- Industry insights related to the app's niche
- User stories and case studies
- Behind-the-scenes of building
- Thought leadership in the domain

Use Content Flywheel to manage the pipeline. Schedule content in advance.
**Skill:** `/linkedin-strategy`, `/carousel-generator`, `/newsletter-builder`
**Done when:** Content calendar is established. At least 2 weeks of content is scheduled. Pipeline is sustainable.
**References:** []
**Depends on:** LinkedIn launch content, Beehiiv newsletter set up

## Decision Points

- What's the north star metric? (Usually active users or revenue)
- When to add more features vs. optimize existing ones?
- When is the app ready to move from "scaling" to "archived"?

## Common Pitfalls

- **Not checking analytics.** Data is useless if you don't look at it.
- **Reacting to every piece of feedback.** Prioritize feedback that aligns with the north star metric.
- **Content burnout.** Batch content creation. Use Content Flywheel to automate as much as possible.
- **Premature scaling.** Fix retention before driving more traffic.
