import Stripe from 'stripe';

// Re-export plans for server-side convenience
export { PLANS, type PlanKey } from './plans';

// Lazy-initialized Stripe client (avoids crash during build when env var is missing)
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}
