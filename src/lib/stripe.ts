import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience alias
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as Record<string | symbol, unknown>)[prop];
  },
});

// Price IDs from your Stripe Dashboard
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  CREDITS_10: process.env.STRIPE_CREDITS_10_PRICE_ID || '',
  CREDITS_50: process.env.STRIPE_CREDITS_50_PRICE_ID || '',
} as const;

// Plan details
export const PLANS = {
  free: {
    name: 'Free',
    credits: 0,
    features: ['View templates', 'Preview websites'],
  },
  beta: {
    name: 'Beta',
    credits: 25,
    features: ['25 generation credits', 'AI chat editing', 'Visual editor', 'Export & publish'],
  },
  pro: {
    name: 'Pro',
    credits: -1, // unlimited
    features: ['Unlimited generations', 'Priority support', 'Custom domains', 'All templates'],
  },
} as const;

export type PlanType = keyof typeof PLANS;
