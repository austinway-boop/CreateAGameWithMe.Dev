import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStudentByEmail, resetAttempt } from '@/lib/powerpath';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

/**
 * POST /api/powerpath/quiz/reset
 *
 * Reset the quiz attempt for a lesson (starts a fresh attempt).
 *
 * Body: { lessonId: string }
 */
export async function POST(request: NextRequest) {
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

    // --- Parse body ---
    const body = await request.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
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

    // --- Reset attempt ---
    await resetAttempt(student.studentSourcedId, lessonId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PowerPath quiz reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset quiz attempt' },
      { status: 500 }
    );
  }
}
