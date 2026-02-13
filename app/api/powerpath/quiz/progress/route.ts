import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStudentByEmail, getAssessmentProgress } from '@/lib/powerpath';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

/**
 * GET /api/powerpath/quiz/progress?lessonId=USHI23-l48-r104178-v1
 *
 * Returns the current assessment progress (score, correct, total, accuracy, attempt).
 */
export async function GET(request: NextRequest) {
  try {
    // --- Authenticate ---
    let email: string | null = null;

    if (USE_MOCK_AUTH) {
      const mockUser = await prisma.user.findUnique({
        where: { id: MOCK_USER_ID },
        select: { email: true },
      });
      email = mockUser?.email || 'dev@example.com';
    } else {
      const session = await auth();
      email = session?.user?.email || null;
    }

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = request.nextUrl.searchParams.get('lessonId');
    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId query parameter is required' },
        { status: 400 }
      );
    }

    // --- Resolve student ---
    const student = await getStudentByEmail(email);
    if (!student) {
      return NextResponse.json(
        { error: 'Could not find PowerPath student for this email' },
        { status: 404 }
      );
    }

    // --- Fetch progress ---
    const progress = await getAssessmentProgress(
      student.studentSourcedId,
      lessonId
    );

    return NextResponse.json(progress);
  } catch (error) {
    console.error('PowerPath quiz progress error:', error);
    return NextResponse.json(
      { error: 'Failed to get quiz progress' },
      { status: 500 }
    );
  }
}
