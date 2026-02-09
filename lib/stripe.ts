import Stripe from 'stripe';

// Re-export plans for server-side convenience
export { PLANS, type PlanKey } from './plans';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});
