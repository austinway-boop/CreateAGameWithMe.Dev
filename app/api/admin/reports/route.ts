import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const reports = await prisma.feedbackReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      validationRun: {
        select: {
          id: true,
          createdAt: true,
          result: true,
          project: {
            select: {
              id: true,
              finalTitle: true,
              finalConcept: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(reports);
}
