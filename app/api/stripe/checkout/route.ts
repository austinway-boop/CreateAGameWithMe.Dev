import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, PLANS, PlanKey } from '@/lib/stripe';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

export async function POST(request: NextRequest) {
  try {
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

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      metadata: {
        userId,
        plan,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planConfig.name} Plan`,
              description: `${planConfig.credits} AI credits per month. Includes AI music, image, video, and 3D generation, automated calendar, and gamified goals.`,
            },
            unit_amount: planConfig.price,
            recurring: {
              interval: planConfig.interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/subscribe?success=true`,
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
