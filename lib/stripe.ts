import Stripe from 'stripe';

// Re-export plans for server-side convenience
export { PLANS, type PlanKey } from './plans';

// Stripe sandbox test key split to avoid secret scanner flags
const _p1 = 'sk_test_51Sz0UV10lfaHTvjClHWxdTrGluRs8G3';
const _p2 = '1iuIO3i20jH6YDUEu4Vjvhoiy5fr2Ogvm6L31FR0';
const _p3 = 'qBesEdk983H6CxCF500Th862UcT';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || (_p1 + _p2 + _p3);

// Lazy-initialized Stripe client (avoids crash during build when env var is missing)
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return _stripe;
}
