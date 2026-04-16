# Phase 5: Payments

> Pipeline stage: build
> Prerequisites: Phase 4 (Auth) complete
> Skills: /pricing-design (strategy), /saas-setup (implementation)
> Estimated items: 5 checklist items

## Overview

Design pricing strategy, then implement Lemon Squeezy subscriptions with webhooks and Pro/Free gating. Skip this phase entirely if the app doesn't need payments (mark items as N/A).

**Order matters:** `/pricing-design` produces `pricing-spec.md` at project root. `/saas-setup` reads that spec to wire up the right variants, trial config, and paywall copy. Skipping the design step is how you end up with a "Start Free Trial" button that has no actual trial behind it (the ChessMind bug).

## Checklist Items

### [payments] Pricing strategy decided
**Approach:** Run `/pricing-design`. The skill walks through 5 phases (Discovery → Competitive Anchor → Plan Structure → Price + Trial Decisions → Paywall Copy) and produces `pricing-spec.md` at the project root.

The spec covers:
- Free vs Pro tier boundaries (mapped to JTBD outcomes, not feature lists)
- Monthly + annual prices with discount %
- Trial decision (none / 7d / 14d / 30d / $0.50 nominal) with rationale
- Paywall headline, value stack, social proof, trust copy, CTA label
- Lemon Squeezy variant requirements that `/saas-setup` will create

**Skill:** `/pricing-design`
**Done when:** `pricing-spec.md` exists at project root with all sections filled. No "deferred decisions" that block implementation.
**References:** ["~/.claude/memory/saas-setup/paywall-patterns.md (25 researched paywall patterns)"]
**Depends on:** Nothing — can run before or in parallel with auth setup

### [payments] Lemon Squeezy store configured
**Approach:** Use `/saas-setup` or manually:
1. Create a product in Lemon Squeezy dashboard (app.lemonsqueezy.com)
2. Create a subscription variant (e.g., "Pro Monthly" at $X/mo)
3. Note the Store ID and Variant ID
4. Create a webhook in Lemon Squeezy pointing to `https://<your-domain>/api/webhooks/lemonsqueezy`
5. Subscribe to events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
6. Copy the webhook signing secret

Add to `.env.local` and Vercel:
```
LEMONSQUEEZY_WEBHOOK_SECRET=<signing-secret>
LEMONSQUEEZY_STORE_ID=<store-id>
LEMONSQUEEZY_VARIANT_ID=<variant-id>
```
**Skill:** `/saas-setup`
**Done when:** Product and variant exist in Lemon Squeezy. Webhook is configured pointing to the app's API route. Environment variables are set.
**References:** ["https://docs.lemonsqueezy.com"]
**Depends on:** Vercel project connected (need a live URL for webhooks)

### [payments] Subscription webhooks working
**Approach:** Create `src/app/api/webhooks/lemonsqueezy/route.ts`:
1. Verify webhook signature using the signing secret
2. Parse the event type from the payload
3. On `subscription_created`: store subscription data in a `subscriptions` table (user_id, lemon_squeezy_id, status, variant_id, current_period_end)
4. On `subscription_updated`/`subscription_cancelled`/`subscription_expired`: update the subscription status

Create the subscriptions table:
```sql
CREATE TABLE <app>_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lemon_squeezy_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  variant_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE <app>_subscriptions ENABLE ROW LEVEL SECURITY;
```
**Skill:** `/saas-setup`
**Done when:** Test webhook (use Lemon Squeezy test mode): create a test subscription, verify it appears in the database. Cancel it, verify status updates.
**References:** ["https://docs.lemonsqueezy.com/api/webhooks"]
**Depends on:** Lemon Squeezy store configured, Supabase tables created

### [payments] Paywall copy matches pricing-spec
**Approach:** When implementing `<ProOnly>` fallback, upgrade banners, and the pricing page, use the headline / value stack / CTA / trust copy verbatim from `pricing-spec.md`. Do not write generic "Unlock Premium Features" copy — the spec exists specifically to prevent that.

**Anti-pattern check:** Search for "Start Free Trial" / "Start Trial" CTAs across the codebase. If any exist, verify there's a real trial in the Lemon Squeezy variant config. If not, either configure the trial OR change the CTA to "Start Pro." (This was the ChessMind bug: trial CTA with no trial behind it = trust-killer + likely refund requests.)

**Skill:** `/saas-setup`
**Done when:** Paywall copy in code matches `pricing-spec.md`. No false-trial CTAs. JTBD outcome headline (not feature list). Annual default with monthly behind a link if the spec calls for it.
**References:** ["pricing-spec.md", "~/.claude/memory/saas-setup/paywall-patterns.md"]
**Depends on:** Pricing strategy decided, Pro/Free gating implemented

### [payments] Pro/Free gating implemented
**Approach:** Create a `useSubscription` hook that checks the user's subscription status:
```typescript
async function getSubscription(userId: string) {
  const { data } = await supabase
    .from('<app>_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return data
}
```
Create a `<ProOnly>` component that conditionally renders children based on subscription status. For free users, show an upgrade CTA with the Lemon Squeezy checkout URL.
**Skill:** `/saas-setup`
**Done when:** Free users see upgrade prompts on Pro features. Pro users see the full feature. Subscription status is checked on every protected action.
**References:** []
**Depends on:** Subscription webhooks working

## Decision Points

All of these belong in `pricing-spec.md` (produced by `/pricing-design`), not made ad-hoc during implementation:

- Does this app need payments at all?
- Monthly + annual pricing decision (default annual with monthly behind link unless spec says otherwise)
- Free vs Pro tier boundaries — what specifically unlocks?
- Trial yes/no/length — and if yes, real trial in Lemon Squeezy or it's a lie

## Common Pitfalls

- **Not verifying webhook signatures.** Anyone can POST to your webhook URL. Always verify.
- **Hardcoding Lemon Squeezy URLs.** Use environment variables for store/variant IDs.
- **Forgetting to handle subscription expiry.** Users who cancel still have access until the period ends.
- **"Start Free Trial" CTA with no trial config.** The ChessMind bug. If the UI promises a trial, the LS variant must have one configured, OR the CTA must be changed.
- **Generic feature-list paywall copy.** "Unlock Premium Features" converts ~70% worse than JTBD outcome copy (SmartTales pattern, +72% install-to-paid). Use the spec.
- **Skipping `/pricing-design` to "save time".** You will pay it back 5x in conversion and refund handling. Run the strategy skill first.
