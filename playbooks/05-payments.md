# Phase 5: Payments

> Pipeline stage: build
> Prerequisites: Phase 4 (Auth) complete
> Skills: /saas-setup
> Estimated items: 3 checklist items

## Overview

Set up Lemon Squeezy for subscription payments with webhook handling and Pro/Free feature gating. Skip this phase entirely if the app doesn't need payments (mark items as N/A).

## Checklist Items

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

- Does this app need payments at all?
- Monthly vs annual pricing? (Start with monthly, add annual later)
- What features are gated behind Pro?
- Free trial period?

## Common Pitfalls

- **Not verifying webhook signatures.** Anyone can POST to your webhook URL. Always verify.
- **Hardcoding Lemon Squeezy URLs.** Use environment variables for store/variant IDs.
- **Forgetting to handle subscription expiry.** Users who cancel still have access until the period ends.
