import { NextRequest, NextResponse } from 'next/server';
import { buildJourneySummary } from '@/lib/validationRequirements';
import { Project } from '@/lib/types';
import {
  buildMarketAgentPrompt,
  buildLoopAgentPrompt,
  buildCompetitorAgentPrompt,
  buildFinalVerdictPrompt,
  parseAIResponse,
  MarketAgentResult,
  LoopAgentResult,
  CompetitorAgentResult,
  FinalVerdictResult,
  ComprehensiveValidation,
} from '@/lib/validationAgents';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callAgent<T>(prompt: string, agentName: string): Promise<T> {
  console.log(`[${agentName}] Starting...`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `You are a specialized Roblox game analyst. Output only valid JSON. Be specific and brutally honest.` },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`[${agentName}] API Error:`, error);
    throw new Error(`${agentName} failed: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  
  if (!content) {
    throw new Error(`${agentName} returned empty response`);
  }

  console.log(`[${agentName}] Complete`);
  return parseAIResponse<T>(content);
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const project = body.project as Project | undefined;

    const title = project?.finalTitle || body.title;
    const concept = project?.finalConcept || body.concept;
    const teamSize = project?.teamSize || body.teamSize || 'Solo';
    const timeHorizon = project?.timeHorizon || body.timeHorizon || 'Not specified';
    const gameLoop = project?.gameLoop || body.gameLoop || [];
    const vibes = project?.vibeChips || body.vibes || [];
    const userGenre = project?.gameQuestions?.genre || '';

    if (!title || !concept) {
      return NextResponse.json(
        { message: 'Title and concept are required' },
        { status: 400 }
      );
    }

    const journeySummary = project ? buildJourneySummary(project) : '';

    console.log('=== COMPREHENSIVE VALIDATION START ===');
    console.log('Title:', title);
    console.log('Genre:', userGenre);

    // Run first 3 agents in PARALLEL for speed
    const [marketAnalysis, loopAnalysis, competitorAnalysis] = await Promise.all([
      callAgent<MarketAgentResult>(
        buildMarketAgentPrompt(title, concept, vibes, userGenre, teamSize, journeySummary),
        'MarketAgent'
      ),
      callAgent<LoopAgentResult>(
        buildLoopAgentPrompt(title, concept, gameLoop, journeySummary),
        'LoopAgent'
      ),
      callAgent<CompetitorAgentResult>(
        buildCompetitorAgentPrompt(title, concept, vibes, userGenre, teamSize, journeySummary),
        'CompetitorAgent'
      ),
    ]);

    console.log('Agent scores:', {
      market: marketAnalysis.score,
      loop: loopAnalysis.score,
      competitor: competitorAnalysis.score,
    });

    // Run final synthesis agent with all research
    const finalVerdict = await callAgent<FinalVerdictResult>(
      buildFinalVerdictPrompt(
        title,
        concept,
        teamSize,
        timeHorizon,
        marketAnalysis,
        loopAnalysis,
        competitorAnalysis,
        journeySummary
      ),
      'FinalVerdictAgent'
    );

    console.log('=== COMPREHENSIVE VALIDATION COMPLETE ===');
    console.log('Final score:', finalVerdict.overallScore);
    console.log('Verdict:', finalVerdict.verdict);

    const result: ComprehensiveValidation = {
      marketAnalysis,
      loopAnalysis,
      competitorAnalysis,
      finalVerdict,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Comprehensive validation error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
