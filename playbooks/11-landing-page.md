# Phase 11: Landing Page

> Pipeline stage: deploy
> Prerequisites: Phase 3 (Design) complete, Phase 6 (Core Features) complete
> Skills: /landing-page, /frontend-vibe
> Estimated items: 1 checklist item

## Overview

Build a high-conversion landing page. The `/landing-page` skill handles the full pipeline from strategy to implementation. This is the public face of the app and the primary conversion funnel.

## Checklist Items

### [marketing] Landing page live
**Approach:** Run `/landing-page` which executes a 7-phase pipeline:
1. **Context:** Gather app details, target user, value proposition
2. **Strategy:** Determine page structure, CTA strategy, social proof approach
3. **Copy:** Write all page sections using brand voice
4. **Component Sourcing:** Fetch real 21st.dev components via `/frontend-vibe`
5. **Build:** Assemble the page at `src/app/page.tsx`
6. **Optimize:** Review for conversion best practices
7. **Learn:** Document what worked for future pages

The landing page should follow proven section ordering:
Hero > Logos/Social Proof > Problem > Solution > Features > How It Works > Demo/Screenshots > Testimonials > Pricing > FAQ > Final CTA

Key conversion principles:
- One clear CTA (sign up / get started)
- Above-the-fold value proposition in < 10 words
- Social proof as early as possible
- Use real screenshots/demos, not stock photos
- Heavy animations via 21st.dev components
**Skill:** `/landing-page`
**Done when:** Landing page is live at the app's root URL (`/`). Has all key sections. CTA leads to signup. Mobile responsive. Animations working.
**References:** []
**Depends on:** Frontend design complete, Core features built (need screenshots)

## Decision Points

- Include pricing on the landing page? (Yes if payments are set up)
- Testimonials available? (If not, skip that section for now)
- Video demo or screenshots? (Screenshots are easier to start)

## Common Pitfalls

- **Too much text.** Landing pages should be scannable. Short paragraphs, bullet points, big headings.
- **Weak CTA.** "Get Started Free" converts better than "Sign Up." Be specific about what happens next.
- **No mobile optimization.** Over 50% of traffic is mobile. Test thoroughly.
