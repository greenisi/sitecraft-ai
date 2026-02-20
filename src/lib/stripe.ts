import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
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
