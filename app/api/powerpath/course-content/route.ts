import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStudentByEmail, getCourseContent } from '@/lib/powerpath';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

/**
 * GET /api/powerpath/course-content?courseId=USHI23-v1
 *
 * Returns the course content and line items (assessmentLineItemSourcedId per resource).
 * The student is resolved from the authenticated user's email.
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

    // --- Parse params ---
    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId query parameter is required' },
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

    // --- Fetch course content ---
    const content = await getCourseContent(courseId, student.studentSourcedId);

    return NextResponse.json(content);
  } catch (error) {
    console.error('PowerPath course-content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course content' },
      { status: 500 }
    );
  }
}
