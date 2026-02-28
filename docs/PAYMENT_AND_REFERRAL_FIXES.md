# Payment and Referral System Bug Fixes

This document details the fixes implemented for the 4 critical bugs in the SiteCraft AI payment and referral system.

## Summary of Changes

### FIX 1: Prevent Double Credit Fulfillment

**Problem:** Both the webhook handler and verify-session endpoint were adding credits, causing users to receive 2x credits.

**Solution:**
- Created a `processed_stripe_sessions` table to track which Stripe sessions have been fulfilled
- Both webhook and verify-session now check this table before processing
- The first handler to process a session marks it as processed using a database insert with unique constraint
- Concurrent requests are handled gracefully via the unique constraint on `session_id`

**Files Modified:**
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/verify-session/route.ts`
- `supabase/migrations/20260228_payment_and_referral_fixes.sql`

### FIX 2: Configure Main Payment Webhook

**Problem:** No webhook was configured in Stripe for checkout.session.completed events.

**Solution:**
- Created a script to programmatically configure the Stripe webhook
- The webhook is subscribed to the following events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

**Files Created:**
- `scripts/configure-stripe-webhook.ts`

**Usage:**
```bash
# Set your Stripe secret key and base URL
export STRIPE_SECRET_KEY=sk_live_xxx
export BASE_URL=https://app.innovated.marketing

# Run the script
npx ts-node scripts/configure-stripe-webhook.ts
```

### FIX 3: Fix Referral Tracking

**Problem:** The `ref` parameter wasn't being captured during signup, so referrals weren't tracked.

**Initial Issues (now fixed):**
1. Click tracking used async `fetch()` in middleware that silently failed - the request completed before the fetch could finish
2. Email/password signup (`/api/auth/signup`) never processed referrals - only OAuth callback did
3. Since `referred_by` was never set, conversion tracking in webhook couldn't work

**Solution:**
- Added referral tracking columns to the `profiles` table (`referral_code`, `referred_by`)
- Created `referral_stats` and `referral_events` tables for statistics tracking
- Updated middleware to:
  - Capture the `ref` parameter and store it in a cookie
  - Track clicks **directly via database** (not internal fetch) for reliability
- Updated email/password signup API to process referrals:
  - Reads the `referral_code` cookie
  - Links new user to referrer (`referred_by`)
  - Records signup event
  - Updates referral stats
- OAuth callback also handles referrals (for social login)
- Webhook tracks conversions when referred users make purchases

**Files Modified/Created:**
- `middleware.ts` - Captures `ref` param and tracks clicks directly via DB
- `src/app/api/auth/signup/route.ts` - **NEW**: Processes referrals for email/password signups
- `src/app/api/auth/callback/route.ts` - Processes referrals for OAuth signups
- `src/app/api/referral/track-click/route.ts` - Tracks referral link clicks (fallback)
- `src/app/api/referral/stats/route.ts` - Returns referral statistics
- `supabase/migrations/20260228_payment_and_referral_fixes.sql`

### FIX 4: Fix Pro Subscription Credit Logic

**Problem:** Upgrading to Pro set credits to 100 instead of adding 100 to existing balance.

**Solution:**
- Modified webhook handler to fetch current credits and add 100 instead of setting to 100
- Modified verify-session endpoint with the same logic
- Subscription renewals already correctly added credits (no change needed)

**Files Modified:**
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/verify-session/route.ts`

---

## Database Migration

Before deploying, run the SQL migration in your Supabase SQL Editor:

```sql
-- See: supabase/migrations/20260228_payment_and_referral_fixes.sql
```

This creates:
1. `processed_stripe_sessions` table - Prevents double credit fulfillment
2. `referral_stats` table - Stores aggregated referral statistics
3. `referral_events` table - Stores individual referral events
4. New columns on `profiles`: `referral_code`, `referred_by`
5. Trigger to auto-generate referral codes for new users

---

## Testing Checklist

### Test 1: Double Fulfillment Prevention
1. Make a test credit purchase
2. Check `processed_stripe_sessions` table for the session entry
3. Verify credits were added only once
4. Try calling verify-session endpoint manually - should return "already_fulfilled"

### Test 2: Webhook Configuration
1. Run the configure script and note the webhook secret
2. Add `STRIPE_WEBHOOK_SECRET` to Vercel environment variables
3. Make a test purchase and verify webhook is received (check Stripe Dashboard > Webhooks)

### Test 3: Referral Tracking
1. Create a test user and get their referral code from the database
2. Open an incognito window and visit: `https://app.innovated.marketing?ref=CODE`
3. Check that a `referral_events` entry with `event_type='click'` was created
4. Sign up as a new user
5. Verify the new user's `referred_by` column points to the referrer
6. Check `referral_events` for a `signup` event
7. Make a purchase with the referred account
8. Verify a `conversion` event was created and `referral_stats` updated

### Test 4: Pro Subscription Credits
1. Create a user with 50 credits
2. Upgrade to Pro subscription
3. Verify the user now has 150 credits (50 + 100), not 100

---

## Environment Variables Required

```env
# Existing
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# New (after running configure script)
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional
NEXT_PUBLIC_APP_URL=https://app.innovated.marketing
```

---

## Deployment Steps

1. Run the database migration in Supabase SQL Editor
2. Run the Stripe webhook configuration script
3. Add the webhook secret to Vercel environment variables
4. Commit and push all changes to trigger auto-deploy
5. Test all functionality after deployment
