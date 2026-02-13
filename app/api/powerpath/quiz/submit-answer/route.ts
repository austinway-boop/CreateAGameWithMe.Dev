import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStudentByEmail, submitAnswer } from '@/lib/powerpath';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

/**
 * PUT /api/powerpath/quiz/submit-answer
 *
 * Submit an answer to a quiz question.
 *
 * Body: {
 *   lessonId: string,      // courseComponentResource sourcedId
 *   questionId: string,     // question item ID
 *   response: string        // "A", "B", "C", or "D"
 * }
 */
export async function PUT(request: NextRequest) {
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
    const { lessonId, questionId, response } = body;

    if (!lessonId || !questionId || !response) {
      return NextResponse.json(
        { error: 'lessonId, questionId, and response are required' },
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

    // --- Submit answer ---
    // NOTE: PowerPath expects "question" not "questionId" in the payload
    const result = await submitAnswer({
      student: student.studentSourcedId,
      lesson: lessonId,
      question: questionId,
      response,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('PowerPath submit-answer error:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
