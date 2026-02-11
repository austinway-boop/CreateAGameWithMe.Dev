import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Load the latest calendar plan for a project
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const plan = await prisma.calendarPlan.findFirst({
      where: { userId: session.user.id, projectId },
      orderBy: { generatedAt: 'desc' },
    });

    if (!plan) {
      return NextResponse.json({ calendarData: null });
    }

    return NextResponse.json({
      id: plan.id,
      calendarData: plan.calendarData,
    });
  } catch (error) {
    console.error('Load calendar error:', error);
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 500 });
  }
}

// PATCH - Toggle a goal's completion status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calendarId, goalId, completed } = await request.json();

    if (!calendarId || !goalId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const plan = await prisma.calendarPlan.findFirst({
      where: { id: calendarId, userId: session.user.id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    const data = plan.calendarData as any;

    // Find and update the specific goal
    let found = false;
    for (const week of data.weeks || []) {
      for (const day of week.days || []) {
        for (const goal of day.goals || []) {
          if (goal.id === goalId) {
            goal.completed = completed;
            found = true;
          }
        }
      }
    }

    if (!found) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.calendarPlan.update({
      where: { id: calendarId },
      data: { calendarData: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
