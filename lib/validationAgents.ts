// ============================================
// Multi-Agent Validation System
// Uses specialized AI agents for comprehensive analysis
// ============================================

import { GameLoopNode } from './types';
import { analyzeRobloxMarket, getRobloxRetentionBenchmarks, getRobloxCCUBenchmarks } from './marketData';

export interface AgentResult {
  agent: string;
  analysis: Record<string, any>;
}

export interface ComprehensiveValidation {
  marketAnalysis: MarketAgentResult;
  loopAnalysis: LoopAgentResult;
  competitorAnalysis: CompetitorAgentResult;
  finalVerdict: FinalVerdictResult;
}

export interface MarketAgentResult {
  genre: string;
  subGenres: string[];
  marketSize: string;
  growthTrend: string;
  saturationLevel: string;
  opportunityWindows: string[];
  risks: string[];
  audienceProfile: {
    ageRange: string;
    interests: string[];
    spendingHabits: string;
    playPatterns: string;
  };
  score: number;
}

export interface LoopAgentResult {
  coreMechanics: string[];
  loopStrength: string;
  retentionDrivers: string[];
  retentionRisks: string[];
  sessionFlowAnalysis: string;
  progressionDepth: string;
  socialIntegration: string;
  missingElements: string[];
  suggestions: string[];
  score: number;
}

export interface CompetitorAgentResult {
  directCompetitors: Array<{
    name: string;
    visits: string;
    whatTheyDoWell: string;
    weakness: string;
  }>;
  indirectCompetitors: string[];
  differentiationAnalysis: string;
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
  marketPositioning: string;
  score: number;
}

export interface FinalVerdictResult {
  overallScore: number;
  verdict: 'strong' | 'promising' | 'needs_work' | 'rethink';
  summary: string;
  hardTruth: string;
  topStrengths: string[];
  criticalIssues: string[];
  dealbreakers: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reasoning: string;
  }>;
  buildRecommendation: string;
  pivotSuggestions: string[];
}

// ============================================
// AGENT PROMPTS
// ============================================

export function buildMarketAgentPrompt(
  title: string,
  concept: string,
  vibes: string[],
  userGenre: string,
  teamSize: string,
  journeySummary: string
): string {
  const marketData = analyzeRobloxMarket(concept, title, vibes, teamSize, userGenre);
  const genreInfo = marketData.genreInfo;
  
  return `You are a ROBLOX MARKET RESEARCH SPECIALIST. Analyze this game concept's market fit.

=== GAME ===
Title: "${title}"
Concept: ${concept}
User-stated Genre: ${userGenre || 'Not specified'}
Vibes: ${vibes.join(', ') || 'None'}
Team: ${teamSize}

=== DETECTED MARKET DATA ===
Primary Genre: ${genreInfo?.name || 'Unknown'}
Competition Level: ${genreInfo?.competitionLevel || 'Unknown'}
Growth Trend: ${genreInfo?.growthTrend || 'Unknown'}
Hot Genre: ${genreInfo?.isHotGenre ? 'YES' : 'No'}
Warning: ${genreInfo?.warning ? 'OVERSATURATED' : 'None'}
Top Games: ${genreInfo?.topGames.map(g => g.name).join(', ') || 'Unknown'}

=== USER'S DESIGN CONTEXT ===
${journeySummary}

=== YOUR TASK ===
Provide DEEP market analysis. Be specific about Roblox, not generic game dev.

Output JSON:
{
  "genre": "Primary Roblox genre",
  "subGenres": ["Secondary genre elements"],
  "marketSize": "Description of market size on Roblox",
  "growthTrend": "rising_fast/rising/stable/declining with explanation",
  "saturationLevel": "extreme/high/moderate/low with context",
  "opportunityWindows": ["Specific opportunities in this space"],
  "risks": ["Market-specific risks"],
  "audienceProfile": {
    "ageRange": "Specific age range on Roblox",
    "interests": ["What this audience likes"],
    "spendingHabits": "How they spend Robux",
    "playPatterns": "When/how they play"
  },
  "score": <1-10>
}

Be brutally honest. Output only valid JSON.`;
}

export function buildLoopAgentPrompt(
  title: string,
  concept: string,
  gameLoop: GameLoopNode[],
  journeySummary: string
): string {
  const loopDescription = gameLoop.length > 0
    ? gameLoop.map(node => {
        const type = node.type.toUpperCase();
        const loop = node.loopType === 'sub' ? ` [${node.loopName || 'sub'}]` : ' [main]';
        return `- ${type}${loop}: "${node.label}"`;
      }).join('\n')
    : 'No game loop defined';

  return `You are a ROBLOX GAME LOOP SPECIALIST. Analyze this game's core loop for retention.

=== GAME ===
Title: "${title}"
Concept: ${concept}

=== GAME LOOP DIAGRAM ===
${loopDescription}

=== FULL DESIGN CONTEXT ===
${journeySummary}

=== ROBLOX RETENTION BENCHMARKS ===
- Top 10% games: 45%+ D1, 20%+ D7, 30+ min sessions
- Successful games: 35%+ D1, 15%+ D7, 15+ min sessions
- The "aha moment" must happen in first 2-3 minutes
- Players need a reason to return DAILY (not just "more levels")

=== YOUR TASK ===
Analyze the game loop deeply. Consider:
1. Is the core loop actually fun moment-to-moment?
2. What drives SHORT-TERM retention (this session)?
3. What drives LONG-TERM retention (coming back tomorrow)?
4. How does progression work?
5. What social elements exist?

Output JSON:
{
  "coreMechanics": ["The actual verbs/actions players do"],
  "loopStrength": "strong/moderate/weak - with explanation",
  "retentionDrivers": ["What will keep players coming back"],
  "retentionRisks": ["What might cause players to leave"],
  "sessionFlowAnalysis": "How a typical 15-min session would feel",
  "progressionDepth": "shallow/moderate/deep - explanation",
  "socialIntegration": "none/weak/moderate/strong - explanation",
  "missingElements": ["Critical elements missing from the loop"],
  "suggestions": ["Specific improvements to the loop"],
  "score": <1-10>
}

Be specific to Roblox. Output only valid JSON.`;
}

export function buildCompetitorAgentPrompt(
  title: string,
  concept: string,
  vibes: string[],
  userGenre: string,
  teamSize: string,
  journeySummary: string
): string {
  const marketData = analyzeRobloxMarket(concept, title, vibes, teamSize, userGenre);
  const competitors = marketData.competitorGames.slice(0, 5);
  
  return `You are a ROBLOX COMPETITIVE ANALYST. Analyze the competitive landscape.

=== GAME ===
Title: "${title}"
Concept: ${concept}
Genre: ${userGenre || marketData.genreInfo?.name || 'Unknown'}

=== TOP COMPETITORS IN THIS SPACE ===
${competitors.map((c, i) => `${i + 1}. ${c.name} - ${c.visits} visits, ${c.monthly_revenue_estimate}/mo`).join('\n') || 'Unknown competitors'}

=== USER'S DESIGN CONTEXT ===
${journeySummary}

=== YOUR TASK ===
Deep competitive analysis. Research what makes the top games successful and how this game compares.

Output JSON:
{
  "directCompetitors": [
    {
      "name": "Competitor name",
      "visits": "Visit count",
      "whatTheyDoWell": "Their key strength",
      "weakness": "Gap this game could exploit"
    }
  ],
  "indirectCompetitors": ["Games competing for same audience but different genre"],
  "differentiationAnalysis": "How does this game stand out? Be honest if it doesn't.",
  "competitiveAdvantages": ["Real advantages over competitors"],
  "competitiveDisadvantages": ["Where competitors beat this concept"],
  "marketPositioning": "Where this fits in the competitive landscape",
  "score": <1-10>
}

Be brutally honest about differentiation. Output only valid JSON.`;
}

export function buildFinalVerdictPrompt(
  title: string,
  concept: string,
  teamSize: string,
  timeHorizon: string,
  marketAnalysis: MarketAgentResult,
  loopAnalysis: LoopAgentResult,
  competitorAnalysis: CompetitorAgentResult,
  journeySummary: string
): string {
  const retentionBenchmarks = getRobloxRetentionBenchmarks();
  const ccuBenchmarks = getRobloxCCUBenchmarks();

  return `You are the FINAL DECISION MAKER for Roblox game validation. Synthesize all research into a verdict.

=== GAME ===
Title: "${title}"
Concept: ${concept}
Team: ${teamSize}
Timeline: ${timeHorizon}

=== MARKET RESEARCH (Score: ${marketAnalysis.score}/10) ===
Genre: ${marketAnalysis.genre}
Market: ${marketAnalysis.marketSize}
Trend: ${marketAnalysis.growthTrend}
Saturation: ${marketAnalysis.saturationLevel}
Opportunities: ${marketAnalysis.opportunityWindows.join('; ')}
Risks: ${marketAnalysis.risks.join('; ')}
Audience: ${marketAnalysis.audienceProfile.ageRange}, ${marketAnalysis.audienceProfile.playPatterns}

=== GAME LOOP ANALYSIS (Score: ${loopAnalysis.score}/10) ===
Mechanics: ${loopAnalysis.coreMechanics.join(', ')}
Loop Strength: ${loopAnalysis.loopStrength}
Retention Drivers: ${loopAnalysis.retentionDrivers.join('; ')}
Retention Risks: ${loopAnalysis.retentionRisks.join('; ')}
Social: ${loopAnalysis.socialIntegration}
Missing: ${loopAnalysis.missingElements.join('; ')}

=== COMPETITOR ANALYSIS (Score: ${competitorAnalysis.score}/10) ===
Direct Competitors: ${competitorAnalysis.directCompetitors.map(c => c.name).join(', ')}
Differentiation: ${competitorAnalysis.differentiationAnalysis}
Advantages: ${competitorAnalysis.competitiveAdvantages.join('; ')}
Disadvantages: ${competitorAnalysis.competitiveDisadvantages.join('; ')}

=== USER'S OWN ASSESSMENT ===
${journeySummary}

=== SUCCESS BENCHMARKS ===
- Breakout hit: ${ccuBenchmarks.breakout_hit.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.breakout_hit.monthly_revenue_estimate}/mo)
- Successful: ${ccuBenchmarks.successful.ccu.toLocaleString()}+ CCU
- Viable: ${ccuBenchmarks.viable.ccu.toLocaleString()}+ CCU
- D1 target: ${retentionBenchmarks.target_for_success.d1_minimum}%+

=== YOUR TASK ===
Synthesize everything into a FINAL VERDICT. Be comprehensive but brutally honest.

Output JSON:
{
  "overallScore": <1-10>,
  "verdict": "strong|promising|needs_work|rethink",
  "summary": "2-3 sentence executive summary referencing specific competitors and market data",
  "hardTruth": "The ONE thing that will make or break this game",
  "topStrengths": ["Top 3-4 genuine strengths"],
  "criticalIssues": ["Issues that MUST be addressed"],
  "dealbreakers": ["Issues that would kill the game - empty if none"],
  "actionItems": [
    {
      "priority": "high|medium|low",
      "action": "Specific action to take",
      "reasoning": "Why this matters"
    }
  ],
  "buildRecommendation": "Clear recommendation: build now, prototype first, pivot, or abandon",
  "pivotSuggestions": ["If score < 6, suggest pivots that could work better"]
}

SCORING:
- 9-10: Exceptional - build immediately
- 7-8: Strong - prototype and validate
- 5-6: Potential but risky - significant changes needed
- 3-4: Major problems - consider pivoting
- 1-2: Fundamentally flawed - start over

Output only valid JSON.`;
}

// ============================================
// HELPER: Parse AI response
// ============================================

export function parseAIResponse<T>(content: string): T {
  let jsonContent = content;
  
  // Strip markdown code blocks
  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Find JSON object
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }
  
  return JSON.parse(jsonContent) as T;
}
