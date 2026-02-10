import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'NOT SET',
    hasPubKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    mockAuth: process.env.NEXT_PUBLIC_MOCK_AUTH,
    nodeEnv: process.env.NODE_ENV,
  });
}
