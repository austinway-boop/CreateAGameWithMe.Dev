import { NextRequest, NextResponse } from 'next/server';

const AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!AI_ENABLED) {
    return NextResponse.json(
      { message: 'AI features are disabled' },
      { status: 403 }
    );
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { title, concept, vibes } = await request.json();

    if (!title || !concept) {
      return NextResponse.json(
        { message: 'Title and concept are required' },
        { status: 400 }
      );
    }

    // Build a prompt for game concept art
    const vibeString = vibes?.length > 0 ? vibes.join(', ') : 'stylized, modern';
    const prompt = `Create game concept art for a video game called "${title}". 
The game is about: ${concept.slice(0, 300)}
Style: ${vibeString}, game key art, cinematic, vibrant colors, professional quality, no text or logos.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI Image API error:', error);
      return NextResponse.json(
        { message: 'Failed to generate image' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // gpt-image-1 returns base64 by default
    const imageData = data.data?.[0]?.b64_json || data.data?.[0]?.url;
    
    if (!imageData) {
      return NextResponse.json(
        { message: 'No image generated' },
        { status: 500 }
      );
    }

    // Return as base64 data URL if it's base64, or URL if it's a URL
    const isBase64 = !imageData.startsWith('http');
    const imageUrl = isBase64 ? `data:image/png;base64,${imageData}` : imageData;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
