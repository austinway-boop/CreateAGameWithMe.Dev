import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, hasActiveSubscription } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const userId = session.user.id;

    const hasSub = await hasActiveSubscription(userId);
    if (!hasSub) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    const creditResult = await deductCredits(userId, 1);
    if (!creditResult.success) {
      return NextResponse.json({
        error: `Not enough credits. You have ${creditResult.remaining} remaining.`,
      }, { status: 403 });
    }

    const { projectId } = await request.json();

    // Load project data
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const prompt = `You are a game development project planner. Based on the following game project details, create a detailed development calendar/roadmap.

PROJECT DETAILS:
- Title: ${project.finalTitle || 'Untitled Game'}
- Concept: ${project.finalConcept || project.ideaDescription || 'No concept provided'}
- Platform: ${project.platform || 'Not specified'}
- Team Size: ${project.teamSize || 'Solo'}
- Time Horizon: ${project.timeHorizon || '3 months'}
- Game Loop: ${JSON.stringify(project.gameLoop || []).substring(0, 500)}
- Skills Required: ${JSON.stringify(project.skillTree || []).substring(0, 500)}

Create a structured development plan with:
1. Phases (e.g., Pre-production, Prototype, Alpha, Beta, Polish, Launch)
2. Each phase has milestones with estimated dates
3. Each milestone has specific tasks

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "phases": [
    {
      "name": "Phase Name",
      "startWeek": 1,
      "endWeek": 4,
      "color": "#hex",
      "milestones": [
        {
          "name": "Milestone Name",
          "week": 2,
          "tasks": ["Task 1", "Task 2"]
        }
      ]
    }
  ],
  "totalWeeks": 12,
  "tips": ["Tip 1", "Tip 2"]
}

Use these colors for phases: #58cc02 (green), #1cb0f6 (blue), #a560e8 (purple), #ff9600 (orange), #ff4b4b (red), #ffc800 (yellow).
Make the plan realistic for the team size and time horizon. Be specific about game development tasks.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI error:', response.status);
      return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON from response (strip markdown code fences if present)
    let calendarData;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      calendarData = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse calendar JSON:', content.substring(0, 200));
      return NextResponse.json({ error: 'Failed to parse calendar data' }, { status: 500 });
    }

    // Save to database
    let savedId: string | undefined;
    try {
      const saved = await prisma.calendarPlan.create({
        data: {
          userId,
          projectId,
          calendarData,
        },
      });
      savedId = saved.id;
    } catch (err) {
      console.error('Failed to save calendar:', err);
    }

    return NextResponse.json({
      id: savedId,
      calendarData,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Calendar generation error:', error);
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
  }
}
