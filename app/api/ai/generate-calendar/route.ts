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
    const maxTokens = Math.min(8000, 2500 + totalWeeks * daysPerWeek * 60);

    // Extract rich project data
    const gameQuestions = project.gameQuestions as any;
    const structuredIdea = project.structuredIdea as any;
    const selectedSpark = project.selectedSpark as any;
    const vibeChips = (project.vibeChips || []) as string[];

    // Build a rich context block from all available project data
    let projectContext = `GAME PROJECT:
- Title: ${project.finalTitle || 'Untitled Game'}
- Concept: ${project.finalConcept || project.ideaDescription || 'Not specified'}
- Platform: ${project.platform || 'Not specified'}
- Team Size: ${project.teamSize || 'Solo'}
- Timeline: ${project.timeHorizon || '3 months'} (${totalWeeks} weeks)`;

    if (gameQuestions) {
      projectContext += `\n\nGAME IDENTITY:`;
      if (gameQuestions.oneSentence) projectContext += `\n- Pitch: ${gameQuestions.oneSentence}`;
      if (gameQuestions.genre) projectContext += `\n- Genre: ${gameQuestions.genre}`;
      if (gameQuestions.targetPlayer) projectContext += `\n- Target Player: ${gameQuestions.targetPlayer}`;
      if (gameQuestions.emotions?.length) projectContext += `\n- Emotions: ${gameQuestions.emotions.join(', ')}`;
      if (gameQuestions.memorableThing) projectContext += `\n- Memorable Thing: ${gameQuestions.memorableThing}`;
      if (gameQuestions.biggestRisk) projectContext += `\n- Biggest Risk: ${gameQuestions.biggestRisk}`;
      if (gameQuestions.pricePoint) projectContext += `\n- Price Point: ${gameQuestions.pricePoint}`;
    }

    if (structuredIdea) {
      if (structuredIdea.coreVerbs?.length) projectContext += `\n\nCORE VERBS: ${structuredIdea.coreVerbs.join(', ')}`;
      if (structuredIdea.loopHook) projectContext += `\nLOOP HOOK: ${structuredIdea.loopHook}`;
    }

    if (selectedSpark) {
      if (selectedSpark.uniqueMechanic) projectContext += `\nUNIQUE MECHANIC: ${selectedSpark.uniqueMechanic}`;
      if (selectedSpark.prototypePlan) projectContext += `\nPROTOTYPE PLAN: ${selectedSpark.prototypePlan}`;
      if (selectedSpark.coreLoop) projectContext += `\nCORE LOOP: ${selectedSpark.coreLoop}`;
    }

    if (vibeChips.length > 0) {
      projectContext += `\nVIBE: ${vibeChips.join(', ')}`;
    }

    const gameLoopStr = JSON.stringify(project.gameLoop || []).substring(0, 500);
    if (gameLoopStr !== '[]') {
      projectContext += `\n\nGAME LOOP DIAGRAM: ${gameLoopStr}`;
    }

    const skillTreeStr = JSON.stringify(project.skillTree || []).substring(0, 500);
    if (skillTreeStr !== '[]') {
      projectContext += `\nSKILL TREE: ${skillTreeStr}`;
    }

    // Determine appropriate game dev phases based on timeline
    let phasesGuidance: string;
    if (totalWeeks <= 1) {
      phasesGuidance = `Phases for a 1-week jam: Quick Design (day 1), Build Core (days 2-4), Polish & Ship (day 5+)`;
    } else if (totalWeeks <= 4) {
      phasesGuidance = `Phases: Pre-Production (week 1), Prototype (week 2), Content & Polish (week 3), Testing & Launch (week 4)`;
    } else if (totalWeeks <= 13) {
      phasesGuidance = `Phases: Pre-Production (weeks 1-2), Prototype (weeks 3-4), Vertical Slice (weeks 5-6), Alpha (weeks 7-9), Beta (weeks 10-11), Polish & Launch (weeks 12-13)`;
    } else {
      phasesGuidance = `Phases: Pre-Production (weeks 1-3), Prototype (weeks 4-6), Vertical Slice (weeks 7-10), Alpha (weeks 11-16), Beta (weeks 17-21), Polish (weeks 22-24), Launch Prep (weeks 25-26)`;
    }

    const prompt = `You are an expert game development schedule planner. Create a realistic daily work schedule that follows real game dev methodology.

${projectContext}

SCHEDULE PARAMETERS:
- ${hoursPerDay} hours per working day
- ${daysPerWeek} working days per week
- ${totalWeeks} weeks total

PHASE STRUCTURE:
${phasesGuidance}

CRITICAL RULES:
1. Each week has EXACTLY ${daysPerWeek} days
2. Each day has 2-3 goals that sum to EXACTLY ${hoursPerDay} hours
3. Categories: planning, design, art, code, audio, testing, polish
4. Task titles must be SPECIFIC to THIS game (reference the actual mechanics, genre, platform)
5. Each goal has a brief "why" explaining its purpose
6. Each week has a "deliverable" — the tangible thing you should have by end of week
7. Tasks progress through real game dev phases (design before code, code before test)
8. Hours: 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, or 8 only
9. IDs: w{week}d{day}g{goal} pattern (e.g. w1d1g1)
10. Address the game's biggest risk early in the schedule

Return ONLY valid JSON (no markdown, no explanation):
{
  "weeks": [
    {
      "week": 1,
      "focus": "Phase: Focus Area",
      "deliverable": "Tangible thing you have by end of this week",
      "days": [
        {
          "day": 1,
          "goals": [
            { "id": "w1d1g1", "title": "Game-specific task name", "why": "Brief reason this matters now", "hours": 2, "category": "design" }
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
      deliverable: week.deliverable || '',
      milestone: week.milestone || '',
      days: (week.days || []).slice(0, daysPerWeek).map((day: any, di: number) => ({
        ...day,
        day: di + 1,
        goals: (day.goals || []).map((goal: any, gi: number) => ({
          ...goal,
          id: goal.id || `w${wi + 1}d${di + 1}g${gi + 1}`,
          title: goal.title || 'Task',
          why: goal.why || '',
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
