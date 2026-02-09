import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

export async function POST() {
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

    await prisma.user.update({
      where: { id: userId },
      data: { hasVideoUnlock: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Video unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock' },
      { status: 500 }
    );
  }
}
