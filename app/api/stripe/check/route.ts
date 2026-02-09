import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

export async function GET() {
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

    // Check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check for video unlock
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasVideoUnlock: true },
    });

    const hasAccess = !!(subscription || user?.hasVideoUnlock);

    return NextResponse.json({
      hasAccess,
      hasVideoUnlock: user?.hasVideoUnlock || false,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            createdAt: subscription.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
