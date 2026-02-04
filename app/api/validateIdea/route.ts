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
    // Extract user-specified genre from game questions if available
    const userSpecifiedGenre = project?.gameQuestions?.genre || '';

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
      journeySummary,
      userSpecifiedGenre
    );

    // Debug logging - remove after testing
    console.log('=== VALIDATION DEBUG ===');
    console.log('Title:', title);
    console.log('User Genre:', userSpecifiedGenre);
    console.log('Vibes:', vibes);
    console.log('GameLoop nodes:', gameLoop?.length || 0);
    console.log('Journey Summary length:', journeySummary?.length || 0);
    console.log('Prompt length:', prompt.length);
    console.log('=== PROMPT START ===');
    console.log(prompt.substring(0, 2000));
    console.log('=== PROMPT END (truncated) ===');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a Roblox game validation expert. Output only valid JSON. Be brutally honest and specific.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 3000,
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

    // Parse JSON response - handle markdown code blocks
    try {
      let jsonContent = content;
      
      // Strip markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to find JSON object if there's extra text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const validation: ValidationResult = JSON.parse(jsonContent);
      return NextResponse.json(validation);
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Raw content:', content);
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { message: 'Invalid AI response format', debug: content.substring(0, 500) },
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
