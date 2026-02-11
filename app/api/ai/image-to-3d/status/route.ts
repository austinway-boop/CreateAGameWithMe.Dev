import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTaskStatus } from '@/lib/ai/meshy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = request.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    // Verify user owns this model
    const model = await prisma.model3D.findUnique({
      where: { meshyTaskId: taskId },
    });

    if (!model || model.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // If already succeeded, return from DB
    if (model.status === 'SUCCEEDED') {
      return NextResponse.json({
        id: model.id,
        status: model.status,
        progress: 100,
        glbUrl: model.glbUrl,
        fbxUrl: model.fbxUrl,
        objUrl: model.objUrl,
        usdzUrl: model.usdzUrl,
        thumbnailUrl: model.thumbnailUrl,
      });
    }

    // Poll Meshy API
    const status = await getTaskStatus(taskId);

    if ('error' in status) {
      return NextResponse.json({ error: status.error }, { status: 500 });
    }

    // Update database
    const updateData: any = {
      status: status.status,
      progress: status.progress,
    };

    if (status.status === 'SUCCEEDED') {
      updateData.glbUrl = status.model_urls?.glb || null;
      updateData.fbxUrl = status.model_urls?.fbx || null;
      updateData.objUrl = status.model_urls?.obj || null;
      updateData.usdzUrl = status.model_urls?.usdz || null;
      updateData.thumbnailUrl = status.thumbnail_url || null;
    }

    await prisma.model3D.update({
      where: { meshyTaskId: taskId },
      data: updateData,
    });

    return NextResponse.json({
      id: model.id,
      status: status.status,
      progress: status.progress,
      glbUrl: status.model_urls?.glb || null,
      fbxUrl: status.model_urls?.fbx || null,
      objUrl: status.model_urls?.obj || null,
      usdzUrl: status.model_urls?.usdz || null,
      thumbnailUrl: status.thumbnail_url || null,
      errorMessage: status.task_error?.message || null,
    });
  } catch (error) {
    console.error('3D status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
