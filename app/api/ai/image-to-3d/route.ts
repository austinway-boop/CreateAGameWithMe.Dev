import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, hasActiveSubscription } from '@/lib/credits';
import { createImageTo3DTask } from '@/lib/ai/meshy';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const hasSub = await hasActiveSubscription(userId);
    if (!hasSub) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    // Deduct 3 credits for 3D generation
    const creditResult = await deductCredits(userId, 3);
    if (!creditResult.success) {
      return NextResponse.json({
        error: `Not enough credits. You need 3, but have ${creditResult.remaining}.`,
      }, { status: 403 });
    }

    const { imageBase64, projectId } = await request.json();

    if (!imageBase64 || imageBase64.length < 100) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const result = await createImageTo3DTask(imageBase64);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Save to database
    const model = await prisma.model3D.create({
      data: {
        userId,
        projectId,
        meshyTaskId: result.taskId,
        status: 'PENDING',
        progress: 0,
        sourceImageBase64: imageBase64.substring(0, 50000),
      },
    });

    return NextResponse.json({
      id: model.id,
      meshyTaskId: result.taskId,
      status: 'PENDING',
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Image-to-3D error:', error);
    return NextResponse.json({ error: 'Failed to start 3D generation' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');

    const models = await prisma.model3D.findMany({
      where: {
        userId: session.user.id,
        ...(projectId && { projectId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error('List 3D models error:', error);
    return NextResponse.json({ error: 'Failed to list models' }, { status: 500 });
  }
}
