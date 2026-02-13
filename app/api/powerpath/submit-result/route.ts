import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStudentByEmail, submitResult } from '@/lib/powerpath';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

/**
 * POST /api/powerpath/submit-result
 *
 * Submit a video or article completion to the OneRoster Gradebook.
 *
 * Body: {
 *   assessmentLineItemSourcedId: string,
 *   stepType: "Video" | "Article",
 *   comment: string,
 *   courseTitle: string,
 *   lessonTitle: string,
 *   enrollmentId: string,
 *   total?: number,     // question count (articles with embedded questions)
 *   correct?: number    // correct count (match total for 100%)
 * }
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
    const {
      assessmentLineItemSourcedId,
      stepType,
      comment,
      courseTitle,
      lessonTitle,
      enrollmentId,
      total = 0,
      correct = 0,
    } = body;

    if (!assessmentLineItemSourcedId || !stepType) {
      return NextResponse.json(
        { error: 'assessmentLineItemSourcedId and stepType are required' },
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

    // --- Submit result ---
    const result = await submitResult({
      assessmentLineItemSourcedId,
      studentSourcedId: student.studentSourcedId,
      score: 100,
      scoreStatus: 'fully graded',
      comment: comment || `${lessonTitle} - ${stepType} completed`,
      metadata: {
        'timeback.xp': 0,
        'timeback.total': total,
        'timeback.passed': true,
        'timeback.correct': correct,
        'timeback.stepType': stepType,
        'timeback.courseTitle': courseTitle || '',
        'timeback.lessonTitle': lessonTitle || '',
        'timeback.enrollmentId': enrollmentId || '',
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('PowerPath submit-result error:', error);
    return NextResponse.json(
      { error: 'Failed to submit result' },
      { status: 500 }
    );
  }
}
