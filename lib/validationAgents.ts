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
  // Core Loop Analysis
  coreMechanics: string[];
  primaryLoop: string;
  secondaryLoops: string[];
  loopStrength: string;
  
  // Moment-to-Moment Feel
  momentToMoment: {
    coreVerb: string;
    feeling: string;
    satisfactionSource: string;
    frustrationRisks: string[];
  };
  
  // First Session Experience
  firstSession: {
    hookMoment: string;
    timeToFun: string;
    tutorialRisk: string;
    ahaMoment: string;
  };
  
  // Retention Analysis
  retention: {
    whyComeBackToday: string;
    whyComeBackTomorrow: string;
    whyComeBackNextWeek: string;
    dailyHooks: string[];
    weeklyHooks: string[];
    retentionKillers: string[];
  };
  
  // Session Structure
  sessionStructure: {
    idealLength: string;
    naturalBreakPoints: string[];
    oneMoreRoundFactor: string;
    sessionFlow: string;
  };
  
  // Progression Systems
  progression: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    masteryDepth: string;
    contentVelocity: string;
  };
  
  // Social & Multiplayer
  social: {
    integrationLevel: string;
    coopElements: string[];
    competitiveElements: string[];
    socialHooks: string[];
    viralMoments: string[];
  };
  
  // Skill & Mastery
  skillCurve: {
    floorDescription: string;
    ceilingDescription: string;
    skillExpression: string[];
    learningMoments: string[];
  };
  
  // Problems & Solutions
  missingElements: string[];
  criticalFlaws: string[];
  suggestions: string[];
  quickWins: string[];
  
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
  // Build detailed loop description with connections
  let loopDescription = 'No game loop defined';
  if (gameLoop.length > 0) {
    const mainLoop = gameLoop.filter(n => n.loopType === 'main');
    const subLoops = gameLoop.filter(n => n.loopType === 'sub');
    
    let desc = `MAIN LOOP (${mainLoop.length} nodes):\n`;
    mainLoop.forEach(node => {
      const connections = node.connections
        .map(id => gameLoop.find(n => n.id === id)?.label || '?')
        .join(', ');
      desc += `  ${node.type.toUpperCase()}: "${node.label}" → [${connections || 'end'}]\n`;
    });
    
    if (subLoops.length > 0) {
      const subLoopNames = Array.from(new Set(subLoops.map(n => n.loopName).filter(Boolean))) as string[];
      subLoopNames.forEach(name => {
        const nodes = subLoops.filter(n => n.loopName === name);
        desc += `\nSUB-LOOP "${name}" (${nodes.length} nodes):\n`;
        nodes.forEach(node => {
          const connections = node.connections
            .map(id => gameLoop.find(n => n.id === id)?.label || '?')
            .join(', ');
          desc += `  ${node.type.toUpperCase()}: "${node.label}" → [${connections || 'end'}]\n`;
        });
      });
    }
    loopDescription = desc;
  }

  return `You are an EXPERT GAME LOOP & PLAYABILITY ANALYST specializing in Roblox. Your job is to deeply analyze game loops, moment-to-moment gameplay feel, retention mechanics, and player psychology.

=== GAME TO ANALYZE ===
Title: "${title}"
Concept: ${concept}

=== GAME LOOP DIAGRAM ===
${loopDescription}

=== COMPLETE DESIGN CONTEXT ===
${journeySummary}

=== ROBLOX PLAYER BEHAVIOR DATA ===
Session Benchmarks:
- Top 10% games: 30+ min average session, 45%+ D1 retention
- Successful games: 15+ min average session, 35%+ D1 retention
- Struggling games: <8 min sessions, <25% D1 retention

Critical Moments:
- First 30 seconds: Player decides if they'll stay
- First 2 minutes: "Aha moment" must happen or they leave
- First 5 minutes: Core loop should be clear and fun
- 10-15 minutes: Natural session break point

Roblox-Specific:
- Players often play in short bursts (school breaks, etc)
- Mobile = 55% of players (touch controls matter)
- Social features dramatically increase retention
- Daily rewards/streaks are expected
- Players want to show off progress to friends

=== DEEP ANALYSIS REQUIRED ===

Analyze EVERYTHING about this game's loop and playability:

1. MOMENT-TO-MOMENT FEEL
   - What is the actual core verb? (jump, click, shoot, build, etc)
   - Is that verb inherently satisfying?
   - Where does "juice" come from? (feedback, effects, sounds)
   - What could cause frustration?

2. FIRST SESSION EXPERIENCE
   - What hooks them in the first 30 seconds?
   - When is the "aha moment"?
   - How long until they feel competent?
   - What might make them quit early?

3. RETENTION MECHANICS
   - Why come back THIS session? (unfinished goal)
   - Why come back TOMORROW? (daily rewards, progress)
   - Why come back NEXT WEEK? (events, new content, social)
   - What are the retention KILLERS?

4. SESSION STRUCTURE
   - How long is the ideal session?
   - Where are natural break points?
   - What creates "one more round" syndrome?
   - How does a 15-minute session flow?

5. PROGRESSION SYSTEMS
   - Short-term: What do I earn THIS session?
   - Medium-term: What am I working toward THIS WEEK?
   - Long-term: What's my end-game goal?
   - How deep is mastery?

6. SOCIAL INTEGRATION
   - Can I play with friends meaningfully?
   - Can I show off to friends?
   - Are there viral/shareable moments?
   - What drives word-of-mouth?

7. SKILL & MASTERY
   - How easy to learn? (skill floor)
   - How hard to master? (skill ceiling)
   - How can skilled players express skill?
   - What are the learning milestones?

=== OUTPUT FORMAT ===

{
  "coreMechanics": ["Primary verb/action", "Secondary verb", "etc"],
  "primaryLoop": "The core loop in one sentence: Do X → Get Y → Use Y to Z",
  "secondaryLoops": ["Supporting loops that add depth"],
  "loopStrength": "strong/moderate/weak - detailed explanation of WHY",
  
  "momentToMoment": {
    "coreVerb": "The single most common action",
    "feeling": "How does doing this action FEEL?",
    "satisfactionSource": "Where does the dopamine come from?",
    "frustrationRisks": ["Things that could feel bad"]
  },
  
  "firstSession": {
    "hookMoment": "What grabs them immediately?",
    "timeToFun": "How many seconds/minutes until fun starts?",
    "tutorialRisk": "Is the tutorial too long/boring?",
    "ahaMoment": "When do they 'get it'?"
  },
  
  "retention": {
    "whyComeBackToday": "Reason to continue THIS session",
    "whyComeBackTomorrow": "Reason to return tomorrow",
    "whyComeBackNextWeek": "Reason for long-term engagement",
    "dailyHooks": ["Daily reward", "streak", "etc"],
    "weeklyHooks": ["Events", "new content", "etc"],
    "retentionKillers": ["Things that will make players quit forever"]
  },
  
  "sessionStructure": {
    "idealLength": "X-Y minutes and why",
    "naturalBreakPoints": ["After completing X", "After Y happens"],
    "oneMoreRoundFactor": "What makes them say 'one more'?",
    "sessionFlow": "Narrative of a typical session"
  },
  
  "progression": {
    "shortTerm": "This session's goals",
    "mediumTerm": "This week's goals", 
    "longTerm": "End-game aspirations",
    "masteryDepth": "shallow/moderate/deep - explanation",
    "contentVelocity": "How fast will players consume content?"
  },
  
  "social": {
    "integrationLevel": "none/minimal/moderate/core",
    "coopElements": ["Ways to cooperate"],
    "competitiveElements": ["Ways to compete"],
    "socialHooks": ["What makes players invite friends"],
    "viralMoments": ["Shareable/streamable moments"]
  },
  
  "skillCurve": {
    "floorDescription": "How easy for a new player",
    "ceilingDescription": "How much room for mastery",
    "skillExpression": ["Ways skilled players stand out"],
    "learningMoments": ["Key skill milestones"]
  },
  
  "missingElements": ["Critical things NOT in the design"],
  "criticalFlaws": ["Fundamental problems with the loop"],
  "suggestions": ["Specific improvements with reasoning"],
  "quickWins": ["Easy changes that would help immediately"],
  
  "score": <1-10>
}

SCORING GUIDE:
- 9-10: Exceptional loop with clear retention drivers, social hooks, and deep mastery
- 7-8: Solid loop, minor gaps, good potential
- 5-6: Functional but missing key retention/social elements
- 3-4: Weak loop, unclear progression, retention risks
- 1-2: Broken or missing core loop

BE BRUTALLY SPECIFIC. Reference the actual game elements. Output only valid JSON.`;
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
Primary Loop: ${loopAnalysis.primaryLoop}
Mechanics: ${loopAnalysis.coreMechanics.join(', ')}
Loop Strength: ${loopAnalysis.loopStrength}
Core Feel: ${loopAnalysis.momentToMoment?.feeling || 'N/A'}
Time to Fun: ${loopAnalysis.firstSession?.timeToFun || 'N/A'}
Retention Today: ${loopAnalysis.retention?.whyComeBackToday || 'N/A'}
Retention Tomorrow: ${loopAnalysis.retention?.whyComeBackTomorrow || 'N/A'}
Retention Killers: ${loopAnalysis.retention?.retentionKillers?.join('; ') || 'None identified'}
Social Level: ${loopAnalysis.social?.integrationLevel || 'N/A'}
Critical Flaws: ${loopAnalysis.criticalFlaws?.join('; ') || 'None'}
Missing Elements: ${loopAnalysis.missingElements?.join('; ') || 'None'}

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
