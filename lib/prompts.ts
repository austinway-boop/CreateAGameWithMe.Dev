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
  journeySummary?: string | null
): string {
  // Build a readable game loop description
  const loopDescription = gameLoop.length > 0
    ? gameLoop.map(node => {
        const connections = node.connections
          .map(connId => gameLoop.find(n => n.id === connId)?.label || 'unknown')
          .filter(Boolean);
        return `- ${node.type.toUpperCase()}: "${node.label}"${connections.length > 0 ? ` → connects to: ${connections.join(', ')}` : ''}`;
      }).join('\n')
    : 'No game loop defined yet';

  const nodeCount = gameLoop.length;
  const hasConnections = gameLoop.some(n => n.connections.length > 0);

  // Get Roblox market data context
  const marketContext = buildRobloxMarketContext(concept, title, vibes, teamSize);
  
  // Get market analysis for pivot suggestions
  const marketAnalysis = analyzeRobloxMarket(concept, title, vibes, teamSize);
  const pivotSuggestions = generateRobloxPivotSuggestions(marketAnalysis.matchedGenres);
  const retentionBenchmarks = getRobloxRetentionBenchmarks();
  const ccuBenchmarks = getRobloxCCUBenchmarks();
  
  // Include journey summary if available
  const journeySection = journeySummary ? `
=== FULL JOURNEY CONTEXT (User's complete design journey) ===

${journeySummary}

Use this complete context to provide more accurate validation. Pay attention to:
- Their self-identified risks and target audience
- The skill tree they've defined (complexity indicator)
- What they say the game is NOT for
- The emotions they want to evoke
- Similar games they mentioned

` : '';

  return `You are a BRUTALLY HONEST Roblox game design consultant who has shipped 20+ experiences and helped developers reach 10K+ CCU. Your job is to give real, actionable validation for ROBLOX games — not generic advice.

YOUR MINDSET:
- Roblox has 40+ million experiences but only a tiny fraction get consistent players
- Success on Roblox = sustained 1,000+ CCU and profitable through DevEx
- Roblox players (primarily ages 9-15) have different expectations than Steam/PC gamers
- Roblox players expect WEEKLY updates from games they play regularly
- Social/multiplayer features are CRITICAL - this is not a single-player platform
- Mobile (55% of players) must work well - small screens, touch controls
- BE SPECIFIC about Roblox mechanics, not generic game design advice

${journeySection}${marketContext}

GAME CONCEPT TO VALIDATE (FOR ROBLOX):

Title: "${title}"

Concept:
${concept}

Context:
- Platform: Roblox
- Team Size: ${teamSize || 'Solo (assumed)'}  
- Time Horizon: ${timeHorizon || 'Not specified'}
- Desired Vibes: ${vibes.length > 0 ? vibes.join(', ') : 'Not specified'}

Game Loop (${nodeCount} nodes defined${!hasConnections && nodeCount > 0 ? ', WARNING: no connections between nodes' : ''}):
${loopDescription}

=== ROBLOX SUCCESS SCORING ===

Score 9-10: Exceptional. Hot genre + clear differentiator + achievable scope + social features. Ready to build.
Score 7-8: Strong. Good genre choice, clear loop, minor gaps. Prototype immediately.
Score 5-6: Promising but risky. Has potential but missing key Roblox success factors.
Score 3-4: Major concerns. Oversaturated genre, no social features, or scope issues.
Score 1-2: Rethink entirely. Would be lost among 40M+ experiences.

=== ROBLOX-SPECIFIC RED FLAGS ===

INSTANT CONCERNS (call out explicitly):
- No social/multiplayer features (Roblox is inherently social)
- "It's like [top Roblox game] but better" with no specific differentiator
- Scope too large for team size (compare to similar successful games)
- No clear progression or collection mechanics
- Single-player focused design (rarely works on Roblox)
- Tutorial longer than 2 minutes (D1 retention killer)
- No monetization plan (Game Passes, Developer Products, etc.)
- Building in oversaturated genre (obby) without exceptional twist
- Expecting success without weekly update cadence

ROBLOX SCOPE REALITIES:
- Simulators typically take 2-6 months
- Roleplay/lifesim games need 6-12 months for content
- Horror can succeed in 1-4 months (jank is acceptable)
- Tower Defense in 3-6 months
- First-time devs should target 1-3 month scope MAX
- Solo devs need simple visual style or use asset toolbox

=== ROBLOX VALIDATION DIMENSIONS ===

1. ROBLOX MARKET FIT
- Compare directly to the TOP COMPETITORS listed in market data
- Is this genre hot (Horror, Anime RPG, Social Co-opetition, Open World Action, Sports)?
- Is this genre oversaturated (Obby/Platformer)?
- What's the competition level and lifecycle phase?
- Would Roblox's algorithm recommend this to players?

2. RETENTION PREDICTION (Critical for Roblox)
- Target benchmarks: D1 ${retentionBenchmarks.target_for_success.d1_minimum}%+, D7 ${retentionBenchmarks.target_for_success.d7_minimum}%+
- Will players get to "the fun" in first 5 minutes? (First session must be 8+ minutes)
- Is there a reason to come back tomorrow? (Daily rewards, progression, social)
- What's the "one more round" hook?

3. SOCIAL & VIRAL POTENTIAL (Roblox-specific)
- Can friends play together meaningfully?
- Would streamers/YouTubers want to play this? (Horror and social games spread fastest)
- Are there shareable moments? (Funny fails, achievements, competitive plays)
- Does this leverage Roblox's friends-playing notification system?

4. MONETIZATION FIT
- Game Passes: What permanent unlocks make sense?
- Developer Products: What consumables/currency work?
- Private Servers: Does this game benefit from private play?
- Does monetization enhance fun rather than gate it?

5. UPDATE SUSTAINABILITY
- Can this game be updated weekly?
- Is there a clear content roadmap?
- What seasonal events could work?

=== OUTPUT FORMAT ===

{
  "overallScore": 5,
  "verdict": "needs_work",
  "summary": "2-3 sentences about Roblox market fit. Reference the competitor games and benchmarks.",
  "hardTruth": "The ONE thing that will determine success or failure on Roblox.",
  "strengths": ["Genuine strengths for Roblox specifically. 2-4 max."],
  "concerns": ["Roblox-specific concerns. Reference market data."],
  "dealbreakers": ["Issues that will prevent success on Roblox. Be specific."],
  "suggestions": ["Specific Roblox advice. Reference successful Roblox games."],
  "questions": ["Questions about their Roblox strategy."],
  "marketFit": {
    "score": 5,
    "reasoning": "Compare to Roblox competitors listed in market data",
    "targetAudience": "Specific Roblox demographic (ages, interests)",
    "competitorCount": "saturated",
    "discoverabilityRisk": "How hard to get noticed among 40M+ experiences"
  },
  "scopeAssessment": {
    "score": 4,
    "reasoning": "Compare to dev time benchmarks for this Roblox genre",
    "timeEstimate": "Based on Roblox-specific benchmarks",
    "biggestRisks": ["Team size vs genre requirements", "Content velocity risk"],
    "mvpSuggestion": "Minimum version to test on Roblox and get real player data"
  },
  "uniqueness": {
    "score": 3,
    "reasoning": "Compare to the Roblox top games in this genre",
    "similarGames": ["Roblox competitors from market data"],
    "differentiator": "What makes this different ON ROBLOX",
    "isGimmickOrCore": "gimmick"
  },
  "loopAnalysis": {
    "score": 6,
    "reasoning": "Roblox-style loop analysis",
    "missingElements": ["Social features", "Collection/progression"],
    "retentionPrediction": "low",
    "sessionLength": "Predicted session (target: ${retentionBenchmarks.top_10_percent ? '30+' : '10+'} min for success)"
  },
  "prototypeTest": {
    "canTestIn48Hours": true,
    "whatToTest": "The core Roblox mechanic to validate",
    "successMetric": "Roblox-specific KPI (D1 retention, session time, etc.)"
  },
  "genreAnalysis": {
    "detectedGenre": "Primary Roblox genre",
    "competitionLevel": "extreme/very_high/high/moderate/low",
    "lifecyclePhase": "proto/variant_window/mature/oversaturated",
    "isHotGenre": false,
    "trend": "rising_fast/rising/stable/declining",
    "topCompetitors": ["Top 3 Roblox games in this genre"]
  },
  "retentionAnalysis": {
    "predictedD1": "X% (target: ${retentionBenchmarks.target_for_success.d1_minimum}%+)",
    "predictedD7": "X% (target: ${retentionBenchmarks.target_for_success.d7_minimum}%+)",
    "sessionTimePrediction": "X minutes (target: 30+ for top tier)",
    "reasoning": "Why this retention prediction"
  },
  "viralPotential": {
    "score": 5,
    "reasoning": "Roblox viral mechanics assessment",
    "streamerAppeal": "low",
    "socialFeatures": "What social features exist or are needed"
  },
  "monetizationAnalysis": {
    "suggestedMethods": ["Game Passes for X", "Developer Products for Y"],
    "reasoning": "Based on similar Roblox games",
    "potentialLevel": "good"
  },
  "pivotSuggestions": ${JSON.stringify(pivotSuggestions)}
}

VERDICT THRESHOLDS (Roblox-specific):
- "strong" (8-10): Hot genre + clear hook + social features + achievable scope. Build it.
- "promising" (6-7): Good genre, clear loop, some gaps but worth prototyping on Roblox.
- "needs_work" (4-5): Missing key Roblox success factors. Iterate on design first.
- "rethink" (1-3): Oversaturated genre, no social features, or fundamentally not suited for Roblox.

CCU TARGETS TO REFERENCE:
- Breakout: ${ccuBenchmarks.breakout_hit.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.breakout_hit.monthly_revenue_estimate}/mo)
- Successful: ${ccuBenchmarks.successful.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.successful.monthly_revenue_estimate}/mo)
- Viable: ${ccuBenchmarks.viable.ccu.toLocaleString()}+ CCU (${ccuBenchmarks.viable.monthly_revenue_estimate}/mo)

REMEMBER: A realistic 4 is more valuable than a hopeful 7. Help them succeed on ROBLOX specifically.

Only output valid JSON. No markdown, no explanation outside the JSON.`;
}
