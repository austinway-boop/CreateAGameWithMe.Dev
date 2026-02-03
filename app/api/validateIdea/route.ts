import { NextRequest, NextResponse } from 'next/server';
import { buildValidationPrompt, ValidationResult } from '@/lib/prompts';
import { buildJourneySummary } from '@/lib/validationRequirements';
import { Project } from '@/lib/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    
    // Support both old format (individual fields) and new format (full project)
    const project = body.project as Project | undefined;
    
    const title = project?.finalTitle || body.title;
    const concept = project?.finalConcept || body.concept;
    const platform = project?.platform || body.platform || '';
    const teamSize = project?.teamSize || body.teamSize || '';
    const timeHorizon = project?.timeHorizon || body.timeHorizon || '';
    const gameLoop = project?.gameLoop || body.gameLoop || [];
    const vibes = project?.vibeChips || body.vibes || [];

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json(
        { message: 'Concept is required' },
        { status: 400 }
      );
    }

    // Build journey summary if we have the full project
    const journeySummary = project ? buildJourneySummary(project) : null;

    const prompt = buildValidationPrompt(
      title,
      concept,
      platform,
      teamSize,
      timeHorizon,
      gameLoop,
      vibes,
      journeySummary
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
        max_tokens: 2000,
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
      const validation: ValidationResult = JSON.parse(content);
      return NextResponse.json(validation);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { message: 'Invalid AI response format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Validate idea error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
