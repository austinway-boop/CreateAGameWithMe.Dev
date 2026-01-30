// ============================================
// Core Project Type
// ============================================

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Onboarding (Screen 1)
  hasIdea: boolean | null;
  platform: string;
  teamSize: string;
  timeHorizon: string;
  
  // Idea Path - Screen 2A
  ideaDescription: string;
  vibeChips: string[];
  structuredIdea: StructuredIdea | null;
  
  // No-Idea Path - Screen 2B
  ikigai: IkigaiData;
  sparkRounds: SparkRound[];
  selectedSpark: IdeaSpark | null;
  
  // Sparks context loop
  additionalContext: string;
  regenerationAttempts: { timestamp: string }[];
  
  // Final - Screen 4
  finalTitle: string;
  finalConcept: string;
  
  // Game Loop Diagram
  gameLoop: GameLoopNode[];
  
  // Questions about the game
  gameQuestions: GameQuestions | null;
  
  // Skill Dependency Tree
  skillTree: SkillTreeNode[];
  
  // Concept Card
  conceptImage: string;
  hasConceptCard: boolean;
  conceptCardCreatedAt: string;
  
  // Progress tracking
  currentPage: string;  // e.g., 'create', 'idea', 'finalize', 'gameloop', 'card'
}

// ============================================
// Game Loop Diagram
// ============================================

export type GameLoopNodeType = 'action' | 'challenge' | 'reward' | 'decision' | 'repeat';
export type LoopType = 'main' | 'sub';

export interface GameLoopNode {
  id: string;
  type: GameLoopNodeType;
  label: string;
  x: number;
  y: number;
  connections: string[]; // IDs of connected nodes
  loopType: LoopType;    // Whether this is part of main loop or a sub-loop
  loopName?: string;     // Name of the sub-loop (e.g., "Mining", "Combat")
}

// ============================================
// Game Questions
// ============================================

export interface GameQuestions {
  oneSentence: string;
  genre: string;
  genreSuccessRate: string;
  emotions: string[];
  targetPlayer: string;
  playerGames: string[];
  pricePoint: string;
  priceReason: string;
  biggestRisk: string;
  notFor: string;
  memorableThing: string;
}

// ============================================
// Skill Dependency Tree
// ============================================

export type SkillLevel = 'core' | 'advanced' | 'expert';

export interface SkillTreeNode {
  id: string;
  label: string;
  level: SkillLevel;
  x: number;
  y: number;
  dependencies: string[]; // IDs of skills this depends on
}

// ============================================
// Structured Idea (AI-assisted)
// ============================================

export interface StructuredIdea {
  title: string;
  conceptParagraph: string;
  coreVerbs: string[];
  loopHook: string;
}

// ============================================
// Ikigai Data (Screen 2B)
// ============================================

export type IkigaiCategory = 'love' | 'good' | 'ship' | 'want';

export interface IkigaiChip {
  id: string;
  text: string;
  categories: IkigaiCategory[];
  // Position within diagram (0-100 relative coordinates)
  x?: number;
  y?: number;
}

export interface IkigaiData {
  chips: IkigaiChip[];
}

// ============================================
// Idea Sparks (Screen 3B)
// ============================================

export interface IdeaSpark {
  id: string;
  title: string;
  hook: string;
  coreLoop: string;
  uniqueMechanic: string;
  winLoseCondition: string;
  targetPlatform: string;
  scopeLevel: string;
  whyFun: string[];
  prototypePlan: string;
  likedParts: string[];
  isSelected: boolean;
}

export interface SparkRound {
  id: string;
  timestamp: string;
  sparks: IdeaSpark[];
  constraints: RemixConstraints | null;
}

// ============================================
// Remix Constraints (Screen 3C)
// ============================================

export interface RemixConstraints {
  likedSparkIds: string[];
  dislikeReason: string;
  scamperMode: ScamperMode | null;
  matrixSelections: MatrixSelections | null;
}

export type ScamperMode = 
  | 'substitute'
  | 'combine'
  | 'adapt'
  | 'modify'
  | 'put-to-use'
  | 'eliminate'
  | 'reverse';

export interface MatrixSelections {
  coreVerb: string;
  setting: string;
  progression: string;
  playerMotivation: string;
  sessionLength: string;
  twist: string;
}

// ============================================
// Constants
// ============================================

export const PLATFORMS = [
  'PC',
  'Console',
  'Mobile',
  'Roblox',
  'Minecraft',
  'Web',
  'VR',
] as const;

export const TEAM_SIZES = [
  'Solo',
  '2–5',
  '6–15',
  '16+',
] as const;

export const TIME_HORIZONS = [
  '1 week',
  '1 month',
  '3 months',
  '6 months',
] as const;

export const VIBE_OPTIONS = [
  'Cozy',
  'Competitive',
  'Horror',
  'Chill',
  'Action',
  'Puzzle',
  'Story-driven',
  'Social',
  'Creative',
  'Strategic',
  'Fast-paced',
  'Relaxing',
] as const;

export const IKIGAI_CATEGORIES: { id: IkigaiCategory; label: string; color: string }[] = [
  { id: 'love', label: 'I Love', color: 'rose' },
  { id: 'good', label: "I'm Good At", color: 'blue' },
  { id: 'ship', label: 'I Can Ship', color: 'green' },
  { id: 'want', label: 'Players Want', color: 'amber' },
];

export const SCAMPER_PROMPTS: Record<ScamperMode, { label: string; prompt: string }> = {
  substitute: {
    label: 'Substitute',
    prompt: 'What can you replace? Swap the setting, protagonist, or core resource.',
  },
  combine: {
    label: 'Combine',
    prompt: 'Merge two ideas. What if you combined the best parts?',
  },
  adapt: {
    label: 'Adapt',
    prompt: 'Borrow from another genre. What would this look like as a different type of game?',
  },
  modify: {
    label: 'Modify',
    prompt: 'Exaggerate or minimize. Make it 10x bigger, smaller, faster, slower.',
  },
  'put-to-use': {
    label: 'Put to Other Use',
    prompt: 'Repurpose the mechanic. What else could this core loop achieve?',
  },
  eliminate: {
    label: 'Eliminate',
    prompt: 'Remove something essential. What if there was no combat? No progression?',
  },
  reverse: {
    label: 'Reverse',
    prompt: 'Flip the premise. Play as the enemy, go backwards, start at the end.',
  },
};

export const MATRIX_OPTIONS = {
  coreVerb: ['Build', 'Explore', 'Fight', 'Solve', 'Collect', 'Trade', 'Escape', 'Protect', 'Create', 'Survive'],
  setting: ['Fantasy', 'Sci-Fi', 'Modern', 'Historical', 'Abstract', 'Nature', 'Urban', 'Space', 'Underwater', 'Post-Apocalyptic'],
  progression: ['Unlock areas', 'Level up', 'Story beats', 'Skill mastery', 'Resource accumulation', 'Relationship building', 'Base building', 'Achievement hunting'],
  playerMotivation: ['Mastery', 'Completion', 'Discovery', 'Social', 'Relaxation', 'Expression', 'Competition', 'Escapism'],
  sessionLength: ['30 seconds', '5 minutes', '15 minutes', '30 minutes', '1 hour', '2+ hours'],
  twist: ['Time loop', 'Procedural', 'Multiplayer twist', 'Meta narrative', 'Real-world integration', 'Asymmetric roles', 'No fail state', 'Permanent consequences'],
};

export const LIKED_PARTS_OPTIONS = [
  'Theme',
  'Core Verb',
  'Setting',
  'Progression',
  'Tone',
  'Twist',
];

// ============================================
// Helper Functions
// ============================================

export function createEmptyProject(): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    hasIdea: null,
    platform: '',
    teamSize: '',
    timeHorizon: '',
    ideaDescription: '',
    vibeChips: [],
    structuredIdea: null,
    ikigai: { chips: [] },
    sparkRounds: [],
    selectedSpark: null,
    additionalContext: '',
    regenerationAttempts: [],
    finalTitle: '',
    finalConcept: '',
    gameLoop: [],
    gameQuestions: null,
    skillTree: [],
    conceptImage: '',
    hasConceptCard: false,
    conceptCardCreatedAt: '',
    currentPage: 'create',
  };
}

export function getOverlapChips(chips: IkigaiChip[]): IkigaiChip[] {
  return chips.filter(chip => chip.categories.length >= 2);
}

export function isIkigaiComplete(ikigai: IkigaiData): boolean {
  const totalChips = ikigai.chips.length;
  const overlapChips = getOverlapChips(ikigai.chips).length;
  return totalChips >= 8 && overlapChips >= 3;
}
