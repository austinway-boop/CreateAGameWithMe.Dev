import { NextRequest, NextResponse } from 'next/server';
import { buildGenerateSparksPrompt } from '@/lib/prompts';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { ikigaiChips, platform, teamSize, timeHorizon, previousRounds, constraints, additionalContext } = await request.json();

    if (!ikigaiChips || !Array.isArray(ikigaiChips)) {
      return NextResponse.json(
        { message: 'Ikigai chips are required' },
        { status: 400 }
      );
    }

    const prompt = buildGenerateSparksPrompt(
      ikigaiChips,
      platform || '',
      teamSize || '',
      timeHorizon || '',
      previousRounds,
      constraints,
      additionalContext
    );

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { message: 'Failed to generate sparks' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { message: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      // Add IDs to sparks
      const sparksWithIds = parsed.sparks.map((spark: Record<string, unknown>) => ({
        ...spark,
        id: crypto.randomUUID(),
        likedParts: [],
        isSelected: false,
      }));
      return NextResponse.json({ sparks: sparksWithIds });
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { message: 'Invalid AI response format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate sparks error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
