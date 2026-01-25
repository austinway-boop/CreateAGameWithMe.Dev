import { NextRequest, NextResponse } from 'next/server';
import { buildStructureIdeaPrompt } from '@/lib/prompts';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { ideaDescription, vibes, platform, teamSize, timeHorizon } = await request.json();

    if (!ideaDescription || typeof ideaDescription !== 'string') {
      return NextResponse.json(
        { message: 'Idea description is required' },
        { status: 400 }
      );
    }

    const prompt = buildStructureIdeaPrompt(
      ideaDescription,
      vibes || [],
      platform || '',
      teamSize || '',
      timeHorizon || ''
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
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { message: 'Failed to process with AI' },
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
      const structured = JSON.parse(content);
      return NextResponse.json(structured);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { message: 'Invalid AI response format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Structure idea error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
