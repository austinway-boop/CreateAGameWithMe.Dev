import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // In development/staging without a real webhook secret, we can be more lenient
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== 'whsec_placeholder') {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For development: parse the event directly (not secure for production)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          await prisma.subscription.create({
            data: {
              userId,
              stripeCustomerId: session.customer as string || null,
              stripeSubscriptionId: session.subscription as string || null,
              plan,
              status: 'active',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubId },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: stripeSubId },
            data: {
              status: subscription.status === 'active' ? 'active' :
                      subscription.status === 'past_due' ? 'past_due' : 'cancelled',
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubId },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: stripeSubId },
            data: { status: 'cancelled' },
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
