import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { message: 'Please describe the commission' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert consultant helping determine fair commission pricing for game development and creative work. A user is describing a commission they want to price fairly.

**Commission Description:**
${description}

Based on this description, analyze and provide a fair pricing recommendation. Consider:
1. The type of work (programming, art, animation, sound, etc.)
2. Estimated complexity and time required
3. Current market rates for this type of work
4. Experience level implied or mentioned
5. Platform-specific considerations if mentioned

Provide a JSON response with this structure:
{
  "hourlyRateLow": <number - low end of fair hourly rate in USD>,
  "hourlyRateHigh": <number - high end of fair hourly rate in USD>,
  "recommendedHourlyRate": <number - your recommended hourly rate in USD>,
  "estimatedHoursLow": <number - estimated hours low>,
  "estimatedHoursHigh": <number - estimated hours high>,
  "totalEstimateLow": <number - total project cost low estimate>,
  "totalEstimateHigh": <number - total project cost high estimate>,
  "recommendedTotal": <number - recommended total project cost>,
  "skillType": "<string - the type of skill/work identified>",
  "rationale": "<string - brief explanation of the pricing rationale>",
  "marketInsights": "<string - brief market insights for this type of work>",
  "tips": ["<tip1>", "<tip2>", "<tip3>"]
}

Respond ONLY with valid JSON, no additional text.`;

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
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { message: 'Failed to calculate commission pricing' },
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
