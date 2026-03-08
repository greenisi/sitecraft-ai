import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Innovated Marketing - AI Website Builder',
  description: 'Exclusive beta pricing for AI-powered website generation. Start free or lock in early adopter rates forever. No credit card required.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
