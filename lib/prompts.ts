// ============================================
// AI Prompt Templates
// ============================================

import { IkigaiChip, RemixConstraints, IdeaSpark, GameLoopNode } from './types';
import { buildMarketContext, analyzeMarket, generatePivotSuggestions, getPriceInsights } from './marketData';

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
  // New fields from market data integration
  genreAnalysis?: {
    detectedGenre: string;
    successRate: string;
    lifecyclePhase: string;
    isGreatConjunction: boolean;
    trend: string;
  };
  viralPotential?: {
    score: number;
    reasoning: string;
    streamerAppeal: 'high' | 'medium' | 'low';
    clipWorthiness: string;
  };
  pricingAnalysis?: {
    suggestedRange: string;
    reasoning: string;
    priceZone: 'impulse' | 'uncanny_valley' | 'premium';
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

  // Get real market data context
  const marketContext = buildMarketContext(concept, title, vibes, platform, teamSize);
  
  // Get market analysis for pivot suggestions
  const marketAnalysis = analyzeMarket(concept, title, vibes, platform, teamSize);
  const pivotSuggestions = generatePivotSuggestions(marketAnalysis.matchedGenres);
  
  // Include journey summary if available
  const journeySection = journeySummary ? `
=== FULL JOURNEY CONTEXT (User's complete design journey) ===

${journeySummary}

Use this complete context to provide more accurate validation. Pay attention to:
- Their self-identified risks and target audience
- The skill tree they've defined (complexity indicator)
- Their price point reasoning
- What they say the game is NOT for
- The emotions they want to evoke
- Similar games they mentioned

` : '';

  return `You are a BRUTALLY HONEST game design consultant who has shipped 20+ games and seen hundreds of indie projects fail. Your job is to give real, actionable validation — not encouragement theater.

YOUR MINDSET:
- Only 3% of Steam games achieve 1000+ reviews (success threshold). Your job is to help this one reach that bar.
- Vague ideas kill projects. Push for specificity.
- "Interesting" is not enough. Games need to be COMPELLING.
- Be the friend who tells them their fly is down, not the one who lets them walk into a meeting.
- If something is genuinely good, say so. But don't inflate praise.
- USE THE REAL MARKET DATA BELOW to inform your analysis. Don't make up statistics.
- Use the FULL JOURNEY CONTEXT to understand what the user has already thought through.

${journeySection}${marketContext}

GAME CONCEPT TO VALIDATE:

Title: "${title}"

Concept:
${concept}

Context:
- Platform: ${platform || 'Not specified'}
- Team Size: ${teamSize || 'Solo (assumed)'}  
- Time Horizon: ${timeHorizon || 'Not specified'}
- Desired Vibes: ${vibes.length > 0 ? vibes.join(', ') : 'Not specified'}

Game Loop (${nodeCount} nodes defined${!hasConnections && nodeCount > 0 ? ', WARNING: no connections between nodes' : ''}):
${loopDescription}

=== STRICT SCORING CRITERIA (informed by real data) ===

Score 9-10: Exceptional. In a Great Conjunction genre OR clear hook with proven demand. Achievable scope. Rare.
Score 7-8: Solid. Good genre choice (>3% success rate), minor gaps, ready for prototyping.
Score 5-6: Promising but flawed. Has potential but genre concerns OR missing key elements.
Score 3-4: Significant problems. In a warning genre (<1% success rate) OR fundamental issues.
Score 1-2: Back to drawing board. Genre is dead, concept too vague, or impossible scope.

=== RED FLAGS TO WATCH FOR ===

INSTANT CONCERNS (call these out explicitly):
- "It's like X but better" with no concrete differentiator
- Requiring AI/procedural generation to be "fun" (crutch, not feature)
- Needing multiplayer for a solo dev with no networking experience
- Open world/sandbox with no clear goals
- "Players create their own fun" (lazy design)
- Story-driven with no mention of gameplay
- No clear win/lose/progress condition
- Mechanic soup (too many systems, no focus)
- "It'll be fun because I like this genre" (not market validation)
- Building in a "dead" or "oversaturated" genre without exceptional differentiation

SCOPE DELUSIONS (be realistic):
- 3D for solo devs = 2-3x time multiplier minimum
- Multiplayer = requires dedicated servers, anti-cheat, matchmaking
- "Procedural" anything = needs heavy content design anyway
- Mobile = needs 10x more polish for discoverability
- VR = 0.27% success rate, tiny market, hardware barriers
- 2D Platformer = 0.18% success rate, median revenue $467 - extreme caution
- Multi-year first games have 95% failure rate

=== VALIDATION DIMENSIONS ===

1. MARKET FIT (use the real data above)
- Reference the actual success rates and revenue data provided
- WHO specifically would play this? Compare to the similar games listed
- Is this in a Great Conjunction (demand > supply) or an oversaturated market?
- Would this get lost among the 20,000+ games released on Steam this year?

2. SCOPE REALITY CHECK
- Compare their timeline to the "typical dev time" for this genre
- What's the MINIMUM viable version that tests the core fun?
- What features could be cut and still have a game?
- Does their team size match the minimum required for this genre?

3. UNIQUENESS (brutal honesty)
- Reference the similar games/examples provided in the market data
- What EXACTLY makes this different from those examples?
- Is the "unique" part actually the fun part, or is it a gimmick?
- Would anyone choose this over established competitors?

4. LOOP ANALYSIS (mechanical)
- What does the player DO every 30 seconds? (not story, not vibes — ACTIONS)
- What's the "one more turn" hook? If none exists, this will fail.
- Where's the skill expression or meaningful choice?
- Is there progression? What makes hour 10 different from hour 1?

5. VIRAL POTENTIAL (new dimension)
- Is this streamable? Would it create clip-worthy moments?
- Does it have "friend-slop" potential (co-op chaos)?
- Horror games accept jank and have 3x the success rate of platformers

=== OUTPUT FORMAT ===

{
  "overallScore": 5,
  "verdict": "needs_work",
  "summary": "2-3 sentences referencing the actual market data. Be direct.",
  "hardTruth": "The ONE thing they most need to hear. Reference real statistics if relevant.",
  "strengths": ["Only genuine strengths. 2-4 max. Don't pad this list."],
  "concerns": ["Real concerns with data backing. Be specific."],
  "dealbreakers": ["Issues that MUST be addressed or project will fail. Include genre warnings if applicable."],
  "suggestions": ["Specific, actionable. Reference successful examples."],
  "questions": ["Questions that expose gaps in their thinking."],
  "marketFit": {
    "score": 5,
    "reasoning": "Reference the real success rates and market data provided",
    "targetAudience": "Specific demographic, compare to similar game audiences",
    "competitorCount": "saturated",
    "discoverabilityRisk": "Reference the games released vs success rate stats"
  },
  "scopeAssessment": {
    "score": 4,
    "reasoning": "Compare to typical dev time for this genre",
    "timeEstimate": "Realistic range based on genre benchmarks",
    "biggestRisks": ["Risk based on team size vs genre requirements", "Content risk"],
    "mvpSuggestion": "The smallest possible version that proves the concept works"
  },
  "uniqueness": {
    "score": 3,
    "reasoning": "Compare to the similar games listed in market data",
    "similarGames": ["Use the examples from market data", "Plus any others you know"],
    "differentiator": "The ONE thing that's actually different, or null if nothing",
    "isGimmickOrCore": "gimmick"
  },
  "loopAnalysis": {
    "score": 6,
    "reasoning": "Analysis of moment-to-moment gameplay",
    "missingElements": ["Clear rewards", "Meaningful progression"],
    "retentionPrediction": "low",
    "sessionLength": "Predicted session length"
  },
  "prototypeTest": {
    "canTestIn48Hours": true,
    "whatToTest": "The ONE core mechanic to validate first",
    "successMetric": "How they'll know if it's working"
  },
  "genreAnalysis": {
    "detectedGenre": "The primary genre detected from the concept",
    "successRate": "The actual success rate from market data",
    "lifecyclePhase": "proto/definer/variant_window/mature/oligopoly/dead",
    "isGreatConjunction": false,
    "trend": "rising/stable/declining"
  },
  "viralPotential": {
    "score": 5,
    "reasoning": "Assessment of streamability and viral mechanics",
    "streamerAppeal": "low",
    "clipWorthiness": "What moments would be shareable?"
  },
  "pricingAnalysis": {
    "suggestedRange": "$X-$Y based on genre and scope",
    "reasoning": "Reference price psychology data (impulse zone vs uncanny valley)",
    "priceZone": "impulse"
  },
  "pivotSuggestions": ${JSON.stringify(pivotSuggestions)}
}

VERDICT THRESHOLDS (be strict, use data):
- "strong" (8-10): In Great Conjunction OR >5% genre success rate with clear differentiation. Clear path to success.
- "promising" (6-7): Decent genre (2-5% success rate), good bones, worth prototyping.
- "needs_work" (4-5): Genre concerns OR missing key elements. Needs rethinking before building.
- "rethink" (1-3): In a "dead" genre (<0.5% success) OR fundamental issues. Pivot strongly recommended.

REMEMBER: A kind 4 is more valuable than a dishonest 7. Your job is to save them months of wasted effort. Use the real data to back up your assessment.

Only output valid JSON. No markdown, no explanation outside the JSON.`;
}
