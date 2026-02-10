import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripeServer } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;

    if (USE_MOCK_AUTH) {
      userId = MOCK_USER_ID;
    } else {
      const session = await auth();
      userId = session?.user?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe to verify payment
    const checkoutSession = await getStripeServer().checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const plan = checkoutSession.metadata?.plan || 'starter';

    // Check if we already created a subscription for this session
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeSubscriptionId: checkoutSession.subscription as string,
      },
    });

    if (!existing) {
      await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: (checkoutSession.customer as string) || null,
          stripeSubscriptionId: (checkoutSession.subscription as string) || null,
          plan,
          status: 'active',
        },
      });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
