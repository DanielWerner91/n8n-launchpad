# Phase 7: Legal

> Pipeline stage: build
> Prerequisites: Phase 2 (Scaffold) complete
> Skills: /saas-setup
> Estimated items: 3 checklist items

## Overview

Add privacy policy, terms of service, and cookie consent. Use Termly for all three. This is required before any public launch and especially before collecting user data or processing payments.

## Checklist Items

### [legal] Privacy policy
**Approach:** Use `/saas-setup` or manually:
1. Create a Termly account at termly.io
2. Generate a Privacy Policy using the wizard (specify: data collected, third parties, cookies)
3. Create `src/app/privacy/page.tsx` that embeds the Termly privacy policy
4. Embedding approach: use the Termly embed script or copy the HTML content
5. Link to the privacy policy from the app footer and login page

Simpler alternative: create a static privacy page with standard clauses covering: data collection, data usage, third-party services (Supabase, Google OAuth, Lemon Squeezy, PostHog), data retention, user rights (access, deletion), and contact info.
**Skill:** `/saas-setup`
**Done when:** Privacy policy is accessible at `/privacy`. Linked from footer and login page.
**References:** ["https://termly.io"]
**Depends on:** Next.js app scaffolded

### [legal] Terms of service
**Approach:** Same process as privacy policy:
1. Generate Terms of Service using Termly wizard
2. Create `src/app/terms/page.tsx`
3. Link from footer and login page

Cover: acceptable use, intellectual property, limitation of liability, termination, governing law.
**Skill:** `/saas-setup`
**Done when:** Terms of service accessible at `/terms`. Linked from footer and login page.
**References:** ["https://termly.io"]
**Depends on:** Next.js app scaffolded

### [legal] Cookie consent (Termly)
**Approach:** Add Termly's cookie consent banner:
1. Get the Termly consent script from your Termly dashboard
2. Add to `src/app/layout.tsx` or a dedicated `<CookieConsent>` component
3. Ensure it blocks analytics cookies (PostHog) until consent is given

Alternative: if the app only uses essential cookies (session), a simple banner with "We use essential cookies" and a link to the privacy policy is sufficient.
**Skill:** `/saas-setup`
**Done when:** Cookie consent banner appears on first visit. Dismissible. Links to privacy policy.
**References:** ["https://termly.io/products/consent-management/"]
**Depends on:** Privacy policy

## Decision Points

- Full Termly integration or static legal pages? (Termly is easier to maintain)
- GDPR compliance needed? (Yes if EU users are expected)

## Common Pitfalls

- **Launching without legal pages.** Always have privacy + terms before going live, especially with auth/payments.
- **Not mentioning all third-party services.** List every service that processes user data: Supabase, Google, Lemon Squeezy, PostHog, Anthropic, etc.
