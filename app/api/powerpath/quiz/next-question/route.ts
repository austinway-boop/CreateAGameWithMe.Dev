import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getStudentByEmail,
  getNextQuestion,
} from '@/lib/powerpath';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

/**
 * GET /api/powerpath/quiz/next-question?lessonId=USHI23-l48-r104178-v1
 *
 * Returns the next quiz question. The correct answer is NOT included in the
 * response so that students cannot see it before answering.
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

    // --- Get next question ---
    const data = await getNextQuestion(student.studentSourcedId, lessonId);

    // Strip the correct answer from the QTI XML so it is not exposed to the client
    const content = { ...data.question.content };
    if (content.rawXml) {
      content.rawXml = (content.rawXml as string).replace(
        /<qti-correct-response>\s*<qti-value>[A-D]<\/qti-value>\s*<\/qti-correct-response>/g,
        ''
      );
    }

    return NextResponse.json({
      score: data.score,
      question: {
        id: data.question.id,
        content,
      },
    });
  } catch (error) {
    console.error('PowerPath next-question error:', error);
    return NextResponse.json(
      { error: 'Failed to get next question' },
      { status: 500 }
    );
  }
}
