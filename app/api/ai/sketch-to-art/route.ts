import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, hasActiveSubscription } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check subscription
    const hasSub = await hasActiveSubscription(userId);
    if (!hasSub) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    // Deduct credit (1 credit per generation)
    const creditResult = await deductCredits(userId, 1);
    if (!creditResult.success) {
      return NextResponse.json({
        error: `Not enough credits. You have ${creditResult.remaining} remaining.`,
      }, { status: 403 });
    }

    const {
      sketchBase64,
      description,
      fidelity = 'balanced',
      mode = 'scene',
      projectId,
    } = await request.json();

    if (!description || description.trim().length < 2) {
      return NextResponse.json({ error: 'Please describe what you drew' }, { status: 400 });
    }

    if (!sketchBase64 || sketchBase64.length < 100) {
      return NextResponse.json({ error: 'No sketch provided' }, { status: 400 });
    }

    // Build fidelity instructions
    const fidelityInstructions: Record<string, string> = {
      loose: `Use the sketch as INSPIRATION only - you have full creative freedom. Reimagine the composition, add elements, change proportions. Make it look like professional game concept art.`,
      balanced: `Keep the core subjects/elements the user drew and their approximate positions. You have creative freedom for HOW things look, their details, and atmosphere. Polish proportions to look natural and professional.`,
      close: `Match EVERY element in the sketch EXACTLY - position, size, proportion, shape. DO NOT add new objects. Your job is to apply beautiful color, shading, and lighting while keeping the same composition.`,
    };

    const modeInstructions = mode === 'item'
      ? `This sketch shows a SINGLE OBJECT/ITEM. Generate ONLY that item against a clean background. DO NOT add environment or other objects. Center the item in the frame.`
      : `This sketch shows a FULL SCENE or environment. Include background, ground, and all environmental elements. Create a complete, immersive game scene.`;

    const promptText = `You are transforming a user's sketch into polished game art.

The image attached is the user's sketch. Study it carefully and use it as your primary reference.

USER'S DESCRIPTION: "${description}"

MODE: ${modeInstructions}

INTERPRETATION LEVEL (${fidelity.toUpperCase()}): ${fidelityInstructions[fidelity]}

OUTPUT STYLE: Stylized game concept art, vibrant colors, professional quality, cinematic lighting. No text or logos.

Generate art that represents what is shown in the sketch, rendered beautifully.`;

    // Convert base64 to File for OpenAI images.edit
    const imageBuffer = Buffer.from(sketchBase64, 'base64');
    const imageFile = new File([imageBuffer], 'sketch.png', { type: 'image/png' });

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: promptText,
      size: '1024x1024',
    });

    const resultBase64 = response.data?.[0]?.b64_json;
    if (!resultBase64) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Save to database
    let savedId: string | undefined;
    try {
      const saved = await prisma.generatedArt.create({
        data: {
          userId,
          projectId: projectId || '',
          sketchBase64: sketchBase64.substring(0, 50000),
          resultBase64: resultBase64.substring(0, 500000),
          prompt: description,
          style: fidelity,
        },
      });
      savedId = saved.id;
    } catch (err) {
      console.error('Failed to save generated art:', err);
    }

    return NextResponse.json({
      image: {
        id: savedId || 'temp',
        base64: resultBase64,
        mimeType: 'image/png',
      },
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Sketch-to-art error:', error?.message || error);

    if (error?.status === 429) {
      return NextResponse.json({ error: 'AI is busy. Please wait and try again.' }, { status: 429 });
    }

    return NextResponse.json({
      error: error?.message || 'Failed to generate art. Please try again.',
    }, { status: 500 });
  }
}
