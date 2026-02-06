import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { validationRunId, section, reportType, comment } = await request.json();

    if (!validationRunId || !section || !reportType) {
      return NextResponse.json(
        { message: 'validationRunId, section, and reportType are required' },
        { status: 400 }
      );
    }

    if (!['inaccurate', 'unhelpful'].includes(reportType)) {
      return NextResponse.json(
        { message: 'reportType must be "inaccurate" or "unhelpful"' },
        { status: 400 }
      );
    }

    // Verify the validation run exists and belongs to this user
    const validationRun = await prisma.validationRun.findUnique({
      where: { id: validationRunId },
    });

    if (!validationRun) {
      return NextResponse.json(
        { message: 'Validation run not found' },
        { status: 404 }
      );
    }

    if (validationRun.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const report = await prisma.feedbackReport.create({
      data: {
        validationRunId,
        userId: session.user.id,
        section,
        reportType,
        comment: comment || null,
      },
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (error) {
    console.error('Report feedback error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
