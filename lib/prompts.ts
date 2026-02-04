// ============================================
// AI Prompt Templates
// Roblox-Focused Validation
// ============================================

import { IkigaiChip, RemixConstraints, IdeaSpark, GameLoopNode } from './types';
import { buildRobloxMarketContext, analyzeRobloxMarket, generateRobloxPivotSuggestions, getRobloxRetentionBenchmarks, getRobloxCCUBenchmarks } from './marketData';

export function buildStructureIdeaPrompt(
  ideaDescription: string,
  vibes: string[],
  platform: string,
  teamSize: string,
  timeHorizon: string
): string {
  return `You are a game design assistant. The user has described their game idea. Your job is to help structure it, NOT to change it or add new features.

USER'S IDEA:
${ideaDescription}

CONTEXT:
- Platform: ${platform || 'Not specified'}
- Team size: ${teamSize || 'Not specified'}
- Time horizon: ${timeHorizon || 'Not specified'}
- Vibes/Tone: ${vibes.length > 0 ? vibes.join(', ') : 'Not specified'}

TASK:
Create a structured concept card that captures the essence of their idea. Do NOT add features or change the core concept.

Respond in this exact JSON format:
{
  "title": "A catchy 2-4 word title for the game",
  "conceptParagraph": "A single paragraph (2-3 sentences) that clearly explains the game concept, maintaining the user's original vision",
  "coreVerbs": ["verb1", "verb2", "verb3"],
  "loopHook": "One sentence describing the core loop: action → challenge → reward"
}

Only output valid JSON. No markdown, no explanation.`;
}

export function buildGenerateSparksPrompt(
  ikigaiChips: IkigaiChip[],
  platform: string,
  teamSize: string,
  timeHorizon: string,
  previousRounds?: IdeaSpark[],
  constraints?: RemixConstraints,
  additionalContext?: string
): string {
  const overlapChips = ikigaiChips.filter(c => c.categories.length >= 2);
  const loveChips = ikigaiChips.filter(c => c.categories.includes('love'));
  const goodChips = ikigaiChips.filter(c => c.categories.includes('good'));
  const shipChips = ikigaiChips.filter(c => c.categories.includes('ship'));
  const wantChips = ikigaiChips.filter(c => c.categories.includes('want'));

  let prompt = `You are a veteran game designer and creative director. Generate 10 original game concepts that are easy to prototype, based on the user's Ikigai profile.

IKIGAI PROFILE (use this to personalize ideas):
- Things they LOVE: ${loveChips.map(c => c.text).join(', ') || 'None specified'}
- Things they're GOOD AT: ${goodChips.map(c => c.text).join(', ') || 'None specified'}
- Things they can SHIP: ${shipChips.map(c => c.text).join(', ') || 'None specified'}
- Things PLAYERS WANT: ${wantChips.map(c => c.text).join(', ') || 'None specified'}
- SWEET SPOTS (overlap items - prioritize these!): ${overlapChips.map(c => c.text).join(', ') || 'None'}

USER CONSTRAINTS:
- Preferred platform: ${platform || 'Any'}
- Team size: ${teamSize || 'Any'}
- Time horizon: ${timeHorizon || 'Any'}

`;

  if (additionalContext && additionalContext.trim()) {
    prompt += `ADDITIONAL DIRECTION FROM USER:
"${additionalContext.trim()}"

`;
  }

  if (constraints) {
    prompt += `REMIX CONSTRAINTS:
- User disliked: ${constraints.dislikeReason}
`;
    if (constraints.scamperMode) {
      prompt += `- Using SCAMPER method: ${constraints.scamperMode.toUpperCase()}\n`;
    }
    if (constraints.matrixSelections) {
      prompt += `- Matrix selections: ${JSON.stringify(constraints.matrixSelections)}\n`;
    }
    prompt += '\n';
  }

  if (previousRounds && previousRounds.length > 0) {
    prompt += `PREVIOUS IDEAS (generate DIFFERENT ones):
${previousRounds.map(s => `- ${s.title}: ${s.hook}`).join('\n')}

`;
  }

  prompt += `RULES:
- Avoid generic clones and vague descriptions
- Keep mechanics concrete and testable
- Make each idea distinct in genre and feel
- Prefer ideas that can be built by 1-2 people quickly
- Prioritize ideas that combine multiple Ikigai overlap items
- VARY the game formats across the 10 ideas. Include a mix of:
  * Open World / Sandbox (player-driven exploration)
  * Linear Story / Narrative (guided experience)
  * Roguelike / Run-based (repeatable sessions with progression)
  * Endless / Arcade (score-chasing, no end state)
  * Puzzle / Level-based (discrete challenges)
  * Simulation / Management (systems and optimization)
  * Multiplayer / Party (social interaction focus)

Respond with exactly 10 concepts in this JSON format:
{
  "sparks": [
    {
      "title": "2-4 word catchy title",
      "hook": "One sentence hook that sells the concept",
      "coreLoop": "What the player does every minute (be specific)",
      "uniqueMechanic": "What makes this different from similar games",
      "winLoseCondition": "How players progress, win, or lose",
      "targetPlatform": "mobile/PC/console/web/tabletop",
      "scopeLevel": "tiny prototype / small indie / medium",
      "whyFun": ["reason 1", "reason 2", "reason 3"],
      "prototypePlan": "How to test this in 1-3 days"
    }
  ]
}

Only output valid JSON. No markdown, no extra text.`;

  return prompt;
}

export interface ValidationResult {
  overallScore: number; // 1-10
  verdict: 'strong' | 'promising' | 'needs_work' | 'rethink';
  summary: string;
  hardTruth: string; // The one thing they need to hear
  strengths: string[];
  concerns: string[];
  dealbreakers: string[]; // Critical issues that must be addressed
  suggestions: string[];
  questions: string[];
  marketFit: {
    score: number;
    reasoning: string;
    targetAudience: string;
    competitorCount: 'none' | 'few' | 'moderate' | 'saturated';
    discoverabilityRisk: string;
  };
  scopeAssessment: {
    score: number;
    reasoning: string;
    timeEstimate: string;
    biggestRisks: string[];
    mvpSuggestion: string;
  };
  uniqueness: {
    score: number;
    reasoning: string;
    similarGames: string[];
    differentiator: string | null;
    isGimmickOrCore: 'gimmick' | 'core' | 'unclear';
  };
  loopAnalysis: {
    score: number;
    reasoning: string;
    missingElements: string[];
    retentionPrediction: 'high' | 'medium' | 'low' | 'unclear';
    sessionLength: string;
  };
  prototypeTest: {
    canTestIn48Hours: boolean;
    whatToTest: string;
    successMetric: string;
  };
  // Roblox-specific fields
  genreAnalysis?: {
    detectedGenre: string;
    competitionLevel: string;
    lifecyclePhase: string;
    isHotGenre: boolean;
    trend: string;
    topCompetitors: string[];
  };
  retentionAnalysis?: {
    predictedD1: string;
    predictedD7: string;
    sessionTimePrediction: string;
    reasoning: string;
  };
  viralPotential?: {
    score: number;
    reasoning: string;
    streamerAppeal: 'high' | 'medium' | 'low';
    socialFeatures: string;
  };
  monetizationAnalysis?: {
    suggestedMethods: string[];
    reasoning: string;
    potentialLevel: 'excellent' | 'good' | 'moderate' | 'low';
  };
  pivotSuggestions?: string[];
}

export function buildValidationPrompt(
  title: string,
  concept: string,
  platform: string,
  teamSize: string,
  timeHorizon: string,
  gameLoop: GameLoopNode[],
  vibes: string[],
  journeySummary?: string | null,
  userSpecifiedGenre?: string
): string {
  // Get Roblox market data - use user-specified genre if provided for better accuracy
  const marketAnalysis = analyzeRobloxMarket(concept, title, vibes, teamSize, userSpecifiedGenre || '');
  const pivotSuggestions = generateRobloxPivotSuggestions(marketAnalysis.matchedGenres);
  const retentionBenchmarks = getRobloxRetentionBenchmarks();
  const ccuBenchmarks = getRobloxCCUBenchmarks();
  
  // Build competitor string
  const competitorInfo = marketAnalysis.genreInfo 
    ? marketAnalysis.genreInfo.topGames.map(g => `${g.name} (${g.visits} visits, ~${g.monthly_revenue_estimate}/mo)`).join(', ')
    : 'Unknown genre - could not match to Roblox categories';
  
  // Detected genre summary
  const genreInfo = marketAnalysis.genreInfo;
  const genreSummary = genreInfo 
    ? `DETECTED GENRE: ${genreInfo.name}
- Competition: ${genreInfo.competitionLevel} 
- Trend: ${genreInfo.growthTrend}
- Phase: ${genreInfo.lifecyclePhase}
- ${genreInfo.warning ? '⚠️ OVERSATURATED - needs exceptional twist' : genreInfo.isHotGenre ? '🔥 HOT GENRE' : 'Normal competition'}
- Top competitors: ${competitorInfo}
- Retention targets: D1=${genreInfo.retentionBenchmarks.d1}%, D7=${genreInfo.retentionBenchmarks.d7}%
- Typical dev time: ${genreInfo.devTime}
- Min team: ${genreInfo.teamSizeMin}+`
    : 'Could not detect Roblox genre from description';

  return `You are a BRUTALLY HONEST Roblox consultant. Analyze this game idea and return JSON.

=== THE GAME ===
Title: "${title}"
Concept: ${concept}
Team: ${teamSize || 'Solo'} | Timeline: ${timeHorizon || 'Unknown'}
Vibes: ${vibes.join(', ') || 'None specified'}

=== ROBLOX GENRE ANALYSIS ===
${genreSummary}

=== USER'S COMPLETE DESIGN CONTEXT ===
${journeySummary || 'No additional context provided'}

=== YOUR TASK ===
1. Use the DETECTED GENRE above as the primary genre (don't re-detect it)
2. Compare to the TOP COMPETITORS listed above
3. Read the USER'S DESIGN CONTEXT carefully - they've told you:
   - Their game loop (action → challenge → reward flow)
   - Their target player and what games they play
   - Their self-identified risks
   - Their monetization plan
   - What the game is NOT for
4. Score HONESTLY: 8+ means "build now", 4-5 means "needs work", 1-3 means "rethink"

=== SCORING GUIDE ===
9-10: Hot genre + clear differentiator + social features + right scope
7-8: Good genre, solid loop, minor gaps - prototype now
5-6: Potential but missing Roblox success factors
3-4: Oversaturated/no social features/scope issues
1-2: Would be lost among 40M experiences

=== ROBLOX KILLERS (must flag) ===
- Solo-only gameplay (Roblox is social)
- Obby without exceptional twist
- "Like [game] but better" with no differentiator
- Scope > team capacity
- No daily reason to return
- Mobile won't work (55% of players)

=== OUTPUT JSON ===
{
  "overallScore": <1-10>,
  "verdict": "strong|promising|needs_work|rethink",
  "summary": "<2-3 sentences. Reference competitors: ${marketAnalysis.competitorGames.slice(0,2).map(g=>g.name).join(', ') || 'top games in genre'}. Be specific about market position.>",
  "hardTruth": "<ONE brutal truth that determines success/failure>",
  "strengths": ["<Genuine Roblox strengths, max 4>"],
  "concerns": ["<Specific concerns with references to competitor games>"],
  "dealbreakers": ["<Critical blockers, or empty if none>"],
  "suggestions": ["<Specific advice referencing successful Roblox games>"],
  "questions": ["<Strategic questions about their Roblox approach>"],
  "marketFit": {
    "score": <1-10>,
    "reasoning": "<Compare to: ${competitorInfo}>",
    "targetAudience": "<Age range + interests on Roblox>",
    "competitorCount": "none|few|moderate|saturated",
    "discoverabilityRisk": "<How hard to get noticed>"
  },
  "scopeAssessment": {
    "score": <1-10>,
    "reasoning": "<${genreInfo?.devTime || 'Unknown dev time'} typical for this genre>",
    "timeEstimate": "<Realistic estimate for this team>",
    "biggestRisks": ["<Scope risks>"],
    "mvpSuggestion": "<Minimum testable version>"
  },
  "uniqueness": {
    "score": <1-10>,
    "reasoning": "<What differentiates from ${marketAnalysis.competitorGames[0]?.name || 'competitors'}>",
    "similarGames": ["<Roblox games this competes with>"],
    "differentiator": "<Core unique value or null>",
    "isGimmickOrCore": "gimmick|core|unclear"
  },
  "loopAnalysis": {
    "score": <1-10>,
    "reasoning": "<Analyze their game loop from the design context>",
    "missingElements": ["<What's missing from the loop>"],
    "retentionPrediction": "high|medium|low|unclear",
    "sessionLength": "<Expected minutes per session>"
  },
  "prototypeTest": {
    "canTestIn48Hours": <true|false>,
    "whatToTest": "<Core mechanic to validate>",
    "successMetric": "<How to measure if it works>"
  },
  "genreAnalysis": {
    "detectedGenre": "${genreInfo?.name || 'Unknown'}",
    "competitionLevel": "${genreInfo?.competitionLevel || 'unknown'}",
    "lifecyclePhase": "${genreInfo?.lifecyclePhase || 'unknown'}",
    "isHotGenre": ${genreInfo?.isHotGenre || false},
    "trend": "${genreInfo?.growthTrend || 'unknown'}",
    "topCompetitors": [${marketAnalysis.competitorGames.slice(0,3).map(g => `"${g.name}"`).join(', ') || '"Unknown"'}]
  },
  "retentionAnalysis": {
    "predictedD1": "<X%> (target: ${retentionBenchmarks.target_for_success.d1_minimum}%+)",
    "predictedD7": "<X%> (target: ${retentionBenchmarks.target_for_success.d7_minimum}%+)",
    "sessionTimePrediction": "<X minutes>",
    "reasoning": "<Why this retention prediction>"
  },
  "viralPotential": {
    "score": <1-10>,
    "reasoning": "<Streamability, shareable moments>",
    "streamerAppeal": "high|medium|low",
    "socialFeatures": "<Existing or needed social features>"
  },
  "monetizationAnalysis": {
    "suggestedMethods": ["<Game Pass ideas>", "<Dev Product ideas>"],
    "reasoning": "<Based on their stated price point and similar games>",
    "potentialLevel": "excellent|good|moderate|low"
  },
  "pivotSuggestions": ${JSON.stringify(pivotSuggestions)}
}

Output ONLY valid JSON. No markdown. No text before/after.`;
}
