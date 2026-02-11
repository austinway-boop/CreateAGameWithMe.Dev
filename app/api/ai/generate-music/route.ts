import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, hasActiveSubscription } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

const LOUDLY_API_KEY = process.env.LOUDLY_API_KEY;

// GET - Load saved generated music tracks
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tracks = await prisma.generatedMusic.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        duration: true,
        musicFileUrl: true,
        bpm: true,
        prompt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Load music error:', error);
    return NextResponse.json({ error: 'Failed to load music' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!LOUDLY_API_KEY) {
      return NextResponse.json({ error: 'LOUDLY_API_KEY not configured' }, { status: 500 });
    }

    const userId = session.user.id;

    const hasSub = await hasActiveSubscription(userId);
    if (!hasSub) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    // Deduct 1 credit
    const creditResult = await deductCredits(userId, 1);
    if (!creditResult.success) {
      return NextResponse.json({
        error: `Not enough credits. You have ${creditResult.remaining} remaining.`,
      }, { status: 403 });
    }

    const { prompt, projectId } = await request.json();

    if (!prompt || prompt.trim().length < 2) {
      return NextResponse.json({ error: 'Please provide a music prompt' }, { status: 400 });
    }

    // Call Loudly API
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('duration', '');
    formData.append('test', '');
    formData.append('structure_id', '');

    const res = await fetch('https://soundtracks.loudly.com/api/ai/prompt/songs', {
      method: 'POST',
      headers: {
        'API-KEY': LOUDLY_API_KEY,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Loudly API error:', res.status, errText);
      return NextResponse.json({ error: 'Failed to generate music' }, { status: 500 });
    }

    const song = await res.json();

    // Save to database
    let savedId: string | undefined;
    try {
      const saved = await prisma.generatedMusic.create({
        data: {
          userId,
          projectId: projectId || '',
          loudlyId: song.id || '',
          title: song.title || 'AI Generated Track',
          duration: song.duration || 0,
          musicFileUrl: song.music_file_path || '',
          waveformUrl: song.wave_form_file_path || '',
          prompt,
          bpm: song.bpm || null,
        },
      });
      savedId = saved.id;
    } catch (err) {
      console.error('Failed to save music:', err);
    }

    return NextResponse.json({
      id: savedId || song.id,
      title: song.title || 'AI Generated Track',
      duration: song.duration || 0,
      musicFileUrl: song.music_file_path || '',
      waveformUrl: song.wave_form_file_path || '',
      bpm: song.bpm || null,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Music generation error:', error);
    return NextResponse.json({ error: 'Failed to generate music' }, { status: 500 });
  }
}
