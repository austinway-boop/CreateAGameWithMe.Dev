import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface CommissionRequest {
  skillType: string;
  experienceLevel: string;
  projectComplexity: string;
  estimatedHours: number;
  platform: string;
  additionalContext?: string;
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { message: 'Anthropic API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body: CommissionRequest = await request.json();
    const { skillType, experienceLevel, projectComplexity, estimatedHours, platform, additionalContext } = body;

    if (!skillType || !experienceLevel || !projectComplexity || !estimatedHours || !platform) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert consultant helping determine fair commission pricing for game development work. Based on the following details, provide a fair and competitive pricing recommendation.

**Project Details:**
- Skill Type: ${skillType}
- Experience Level: ${experienceLevel}
- Project Complexity: ${projectComplexity}
- Estimated Hours: ${estimatedHours}
- Platform: ${platform}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}

Please analyze this and provide a JSON response with the following structure:
{
  "hourlyRateLow": <number - low end of fair hourly rate in USD>,
  "hourlyRateHigh": <number - high end of fair hourly rate in USD>,
  "recommendedHourlyRate": <number - your recommended hourly rate in USD>,
  "totalEstimateLow": <number - total project cost low estimate>,
  "totalEstimateHigh": <number - total project cost high estimate>,
  "recommendedTotal": <number - recommended total project cost>,
  "rationale": "<string - brief explanation of the pricing rationale>",
  "marketInsights": "<string - brief market insights for this skill type>",
  "negotiationTips": ["<tip1>", "<tip2>", "<tip3>"]
}

Consider these factors:
1. Current market rates for ${skillType} work in game development
2. Experience level premium (beginner vs expert)
3. Platform-specific complexity (${platform} development)
4. Project complexity overhead
5. Industry standards and fair compensation

Respond ONLY with valid JSON, no additional text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return NextResponse.json(
        { message: 'Failed to calculate commission pricing' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim();

    if (!content) {
      return NextResponse.json(
        { message: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { message: 'Invalid AI response format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Calculate commission error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
