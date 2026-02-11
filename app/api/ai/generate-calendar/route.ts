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

    const { projectId, hoursPerDay, daysPerWeek, startDate } = await request.json();

    // Load project data
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate total weeks from time horizon
    const weeksMap: Record<string, number> = {
      '1 week': 1,
      '1 month': 4,
      '3 months': 13,
      '6 months': 26,
    };
    const totalWeeks = weeksMap[project.timeHorizon || '3 months'] || 13;
    const maxTokens = Math.min(8000, 2000 + totalWeeks * daysPerWeek * 50);

    const prompt = `You are a game development schedule planner. Create a daily work schedule for a game developer.

PROJECT:
- Title: ${project.finalTitle || 'Untitled Game'}
- Concept: ${project.finalConcept || project.ideaDescription || 'Not specified'}
- Platform: ${project.platform || 'Not specified'}
- Team: ${project.teamSize || 'Solo'}
- Timeline: ${project.timeHorizon || '3 months'} (${totalWeeks} weeks)
- Game Loop: ${JSON.stringify(project.gameLoop || []).substring(0, 300)}
- Skills: ${JSON.stringify(project.skillTree || []).substring(0, 300)}

SCHEDULE:
- ${hoursPerDay} hours per working day
- ${daysPerWeek} working days per week
- ${totalWeeks} weeks total

RULES:
1. Each week has EXACTLY ${daysPerWeek} days
2. Each day has 2-3 goals that sum to EXACTLY ${hoursPerDay} hours
3. Use ONLY these categories: planning, design, art, code, audio, testing, polish
4. Task titles: SHORT (5-8 words), SPECIFIC to this game
5. Tasks progress logically (design→code→test→polish)
6. Each week has a clear focus and milestone
7. Hours must be: 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, or 8
8. IDs follow pattern: w{week}d{day}g{goal} (e.g. w1d1g1)

Return ONLY valid JSON (no markdown, no explanation):
{
  "weeks": [
    {
      "week": 1,
      "focus": "Phase Focus Area",
      "days": [
        {
          "day": 1,
          "goals": [
            { "id": "w1d1g1", "title": "Short specific task name", "hours": 2, "category": "code" }
          ]
        }
      ],
      "milestone": "What is achieved by end of this week"
    }
  ]
}`;

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
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI error:', response.status);
      return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to parse schedule data' }, { status: 500 });
    }

    // Add metadata
    calendarData.hoursPerDay = hoursPerDay;
    calendarData.daysPerWeek = daysPerWeek;
    calendarData.totalWeeks = totalWeeks;
    calendarData.startDate = startDate || new Date().toISOString().split('T')[0];

    // Normalize and add completion tracking
    calendarData.weeks = (calendarData.weeks || []).map((week: any, wi: number) => ({
      ...week,
      week: wi + 1,
      focus: week.focus || `Week ${wi + 1}`,
      milestone: week.milestone || '',
      days: (week.days || []).slice(0, daysPerWeek).map((day: any, di: number) => ({
        ...day,
        day: di + 1,
        goals: (day.goals || []).map((goal: any, gi: number) => ({
          ...goal,
          id: goal.id || `w${wi + 1}d${di + 1}g${gi + 1}`,
          title: goal.title || 'Task',
          hours: goal.hours || 1,
          category: goal.category || 'planning',
          completed: false,
        })),
      })),
    }));

    // Delete old calendar plans for this project
    await prisma.calendarPlan.deleteMany({
      where: { userId, projectId },
    });

    // Save new calendar
    const saved = await prisma.calendarPlan.create({
      data: {
        userId,
        projectId,
        calendarData,
      },
    });

    return NextResponse.json({
      id: saved.id,
      calendarData,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    console.error('Calendar generation error:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
