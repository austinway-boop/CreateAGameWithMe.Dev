import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripeServer, PLANS, PlanKey } from '@/lib/stripe';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

export async function POST(request: NextRequest) {
  try {
    // Stripe key is either from env or hardcoded fallback in lib/stripe.ts

    // Get user ID
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (USE_MOCK_AUTH) {
      userId = MOCK_USER_ID;
      userEmail = 'dev@test.com';
    } else {
      const session = await auth();
      userId = session?.user?.id || null;
      userEmail = session?.user?.email || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body as { plan: PlanKey };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe Checkout Session using existing Stripe price IDs
    const checkoutSession = await getStripeServer().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      metadata: {
        userId,
        plan,
      },
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/subscribe?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe?cancelled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
