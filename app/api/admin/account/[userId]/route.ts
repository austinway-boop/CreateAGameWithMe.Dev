import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      projects: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          finalTitle: true,
          finalConcept: true,
          platform: true,
          teamSize: true,
          timeHorizon: true,
          ideaDescription: true,
          vibeChips: true,
          gameLoop: true,
          gameQuestions: true,
          skillTree: true,
          currentPage: true,
          createdAt: true,
          updatedAt: true,
          validationRuns: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              result: true,
              createdAt: true,
              feedbackReports: {
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  section: true,
                  reportType: true,
                  comment: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
