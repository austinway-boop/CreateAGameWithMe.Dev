import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

export async function GET(request: NextRequest) {
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

    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    // Get the most recent validation run for this project
    const latestRun = await prisma.validationRun.findFirst({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRun) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      validationRunId: latestRun.id,
      result: latestRun.result,
      createdAt: latestRun.createdAt,
    });
  } catch (error) {
    console.error('Fetch validation run error:', error);
    return NextResponse.json({ error: 'Failed to fetch validation' }, { status: 500 });
  }
}
