// ============================================
// AI Prompt Templates
// ============================================

import { IkigaiChip, RemixConstraints, IdeaSpark, GameLoopNode } from './types';

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
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  questions: string[];
  marketFit: {
    score: number;
    reasoning: string;
  };
  scopeAssessment: {
    score: number;
    reasoning: string;
    timeEstimate: string;
  };
  uniqueness: {
    score: number;
    reasoning: string;
    similarGames: string[];
  };
  loopAnalysis: {
    score: number;
    reasoning: string;
    missingElements: string[];
  };
}

export function buildValidationPrompt(
  title: string,
  concept: string,
  platform: string,
  teamSize: string,
  timeHorizon: string,
  gameLoop: GameLoopNode[],
  vibes: string[]
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

  return `You are an experienced game design consultant and indie game market analyst. Your job is to provide honest, constructive validation of a game concept.

Be critical but supportive — the goal is to help the creator make a better game, not to crush their dreams. Point out real issues while acknowledging potential.

GAME CONCEPT TO VALIDATE:

Title: "${title}"

Concept:
${concept}

Context:
- Platform: ${platform || 'Not specified'}
- Team Size: ${teamSize || 'Not specified'}  
- Time Horizon: ${timeHorizon || 'Not specified'}
- Desired Vibes: ${vibes.length > 0 ? vibes.join(', ') : 'Not specified'}

Game Loop:
${loopDescription}

VALIDATION CRITERIA:

1. MARKET FIT (1-10): Is there an audience for this? Would players actually want this?
   - Consider current trends, underserved niches, and player expectations
   - Think about discoverability and competition

2. SCOPE ASSESSMENT (1-10): Is this achievable with their constraints?
   - Be realistic about indie dev capabilities
   - Consider art, code, content, and polish requirements
   - Estimate time to a playable prototype vs full release

3. UNIQUENESS (1-10): Does this stand out? Is there a hook?
   - Identify 2-3 similar existing games
   - What would make someone choose THIS over alternatives?
   - Is the "twist" actually compelling?

4. LOOP ANALYSIS (1-10): Is the core loop clear and engaging?
   - Is the moment-to-moment gameplay defined?
   - What creates the "one more turn" feeling?
   - Are there missing elements (no clear reward, no progression, etc.)?

IMPORTANT GUIDELINES:
- Be specific — don't just say "needs more polish" — say what specifically needs work
- Ground feedback in real examples when possible
- Acknowledge what IS working before diving into problems
- Provide actionable suggestions, not just criticism
- Ask probing questions that help the creator think deeper
- Consider the dev's constraints (solo/small team, limited time)

Respond in this exact JSON format:
{
  "overallScore": 7,
  "verdict": "promising",
  "summary": "2-3 sentences summarizing the overall assessment",
  "strengths": ["Specific strength 1", "Specific strength 2", "..."],
  "concerns": ["Specific concern 1", "Specific concern 2", "..."],
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "..."],
  "questions": ["Probing question to help them think", "Another question", "..."],
  "marketFit": {
    "score": 7,
    "reasoning": "Explanation of market potential"
  },
  "scopeAssessment": {
    "score": 6,
    "reasoning": "Explanation of scope feasibility",
    "timeEstimate": "e.g., '2-3 months to prototype, 8-12 months to release'"
  },
  "uniqueness": {
    "score": 5,
    "reasoning": "How unique or differentiated this is",
    "similarGames": ["Game 1", "Game 2", "Game 3"]
  },
  "loopAnalysis": {
    "score": 8,
    "reasoning": "Analysis of the core gameplay loop",
    "missingElements": ["Missing element 1", "Missing element 2"]
  }
}

Verdict should be one of:
- "strong": Overall score 8-10, ready to prototype
- "promising": Overall score 6-7, good foundation but needs refinement
- "needs_work": Overall score 4-5, has potential but significant issues
- "rethink": Overall score 1-3, fundamental problems to address

Only output valid JSON. No markdown, no explanation outside the JSON.`;
}
