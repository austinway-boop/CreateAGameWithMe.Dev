import { prisma } from './prisma';
import { PLANS, PlanKey } from './plans';

export type CreditInfo = {
  total: number;
  used: number;
  remaining: number;
  plan: string | null;
  hasSubscription: boolean;
};

/**
 * Get the user's current credit balance and subscription info.
 * Resets credits automatically if the billing cycle has rolled over.
 */
export async function getUserCredits(userId: string): Promise<CreditInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    return { total: 0, used: 0, remaining: 0, plan: null, hasSubscription: false };
  }

  const activeSub = user.subscriptions[0];

  if (!activeSub) {
    return { total: 0, used: user.aiCreditsUsed, remaining: 0, plan: null, hasSubscription: false };
  }

  const planKey = activeSub.plan as PlanKey;
  const planConfig = PLANS[planKey];
  const totalCredits = planConfig?.credits ?? 0;

  // Check if credits need to be reset (monthly cycle)
  await resetCreditsIfNeeded(userId, user.aiCreditsResetAt);

  // Re-read after potential reset
  const freshUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCreditsUsed: true },
  });

  const used = freshUser?.aiCreditsUsed ?? 0;
  const remaining = Math.max(0, totalCredits - used);

  return {
    total: totalCredits,
    used,
    remaining,
    plan: activeSub.plan,
    hasSubscription: true,
  };
}

/**
 * Reset credits if the billing cycle has rolled over (30-day cycle).
 */
async function resetCreditsIfNeeded(userId: string, resetAt: Date | null): Promise<void> {
  const now = new Date();

  if (!resetAt || now >= resetAt) {
    // Set next reset to 30 days from now
    const nextReset = new Date();
    nextReset.setDate(nextReset.getDate() + 30);

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCreditsUsed: 0,
        aiCreditsResetAt: nextReset,
      },
    });
  }
}

/**
 * Deduct credits from a user's balance. Returns true if successful, false if insufficient credits.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; remaining: number }> {
  const credits = await getUserCredits(userId);

  if (credits.remaining < amount) {
    return { success: false, remaining: credits.remaining };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { aiCreditsUsed: { increment: amount } },
    select: { aiCreditsUsed: true },
  });

  const planKey = credits.plan as PlanKey;
  const totalCredits = PLANS[planKey]?.credits ?? 0;

  return {
    success: true,
    remaining: Math.max(0, totalCredits - updated.aiCreditsUsed),
  };
}

/**
 * Check if a user has an active subscription (required for AI tools).
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
  });
  return !!sub;
}

/**
 * Check if a user has any access (subscription or video unlock).
 */
export async function hasAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasVideoUnlock: true },
  });

  if (user?.hasVideoUnlock) return true;

  return hasActiveSubscription(userId);
}
