-- Additive columns so the existing `products` + `orders` tables can carry
-- Stripe-Connect metadata. The existing routes keep working unchanged.
--
-- Why these columns:
--   products.stripe_product_id / stripe_price_id — cached per-merchant Stripe
--     objects, created lazily on first checkout. Cleared when price/currency
--     changes (Stripe Prices are immutable once set).
--   orders.stripe_session_id — primary key from Stripe's side, lets the
--     webhook find the order to mark paid. UNIQUE so duplicate webhook fires
--     can't double-create.
--   orders.stripe_account_id — which connected merchant account the payment
--     ran through. Lets us route refunds + queries correctly.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_product_id  TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id    TEXT,
  ADD COLUMN IF NOT EXISTS stripe_synced_at   TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_session_id  TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_id  TEXT,
  ADD COLUMN IF NOT EXISTS fulfilled_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at        TIMESTAMPTZ;

-- UNIQUE for webhook idempotency. CREATE UNIQUE INDEX (not constraint) so we
-- can include WHERE clause if needed later.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session
  ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
