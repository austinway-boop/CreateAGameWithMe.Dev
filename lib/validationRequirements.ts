// ============================================
// Validation Requirements Checker
// Ensures users have completed key journey steps before Roblox validation
// ============================================

import { Project, GameLoopNode, GameQuestions, SkillTreeNode } from './types';

export interface ValidationRequirement {
  id: string;
  label: string;
  description: string;
  link: string;
  completed: boolean;
  priority: 'required' | 'recommended';
}

export interface ValidationReadiness {
  isReady: boolean;
  completionPercentage: number;
  requiredMissing: ValidationRequirement[];
  recommendedMissing: ValidationRequirement[];
  allRequirements: ValidationRequirement[];
}

/**
 * Check if game loop has meaningful content
 */
function hasValidGameLoop(gameLoop: GameLoopNode[]): boolean {
  if (!gameLoop || gameLoop.length < 3) return false;
  // Check for at least one action and one connection
  const hasAction = gameLoop.some(node => node.type === 'action');
  const hasConnection = gameLoop.some(node => node.connections.length > 0);
  return hasAction && hasConnection;
}

/**
 * Check if skill tree has meaningful content
 */
function hasValidSkillTree(skillTree: SkillTreeNode[]): boolean {
  return skillTree && skillTree.length >= 2;
}

/**
 * Check if game questions are sufficiently filled out
 */
function hasValidGameQuestions(questions: GameQuestions | null): boolean {
  if (!questions) return false;
  // Require at least the core fields
  return !!(
    questions.oneSentence &&
    questions.genre &&
    questions.targetPlayer &&
    questions.pricePoint
  );
}

/**
 * Check all validation requirements for a project
 */
export function checkValidationReadiness(project: Project | null): ValidationReadiness {
  if (!project) {
    return {
      isReady: false,
      completionPercentage: 0,
      requiredMissing: [],
      recommendedMissing: [],
      allRequirements: []
    };
  }

  const requirements: ValidationRequirement[] = [
    // REQUIRED - Must have these to validate
    {
      id: 'title',
      label: 'Game Title',
      description: 'Give your Roblox experience a working title',
      link: '/finalize',
      completed: !!(project.finalTitle && project.finalTitle.trim().length > 0),
      priority: 'required'
    },
    {
      id: 'concept',
      label: 'Game Concept',
      description: 'Write a clear description of your Roblox game',
      link: '/finalize',
      completed: !!(project.finalConcept && project.finalConcept.trim().length > 20),
      priority: 'required'
    },
    {
      id: 'teamSize',
      label: 'Team Size',
      description: 'Specify your team size',
      link: '/create',
      completed: !!(project.teamSize && project.teamSize.length > 0),
      priority: 'required'
    },
    {
      id: 'timeHorizon',
      label: 'Time Horizon',
      description: 'Set your development timeline',
      link: '/create',
      completed: !!(project.timeHorizon && project.timeHorizon.length > 0),
      priority: 'required'
    },
    
    // RECOMMENDED - Highly encouraged for better Roblox validation
    {
      id: 'gameLoop',
      label: 'Game Loop Diagram',
      description: 'Map out your core gameplay loop (action → challenge → reward)',
      link: '/gameloop',
      completed: hasValidGameLoop(project.gameLoop),
      priority: 'recommended'
    },
    {
      id: 'gameQuestions',
      label: 'Game Details',
      description: 'Answer key questions about your Roblox game (genre, target player)',
      link: '/questions',
      completed: hasValidGameQuestions(project.gameQuestions),
      priority: 'recommended'
    },
    {
      id: 'skillTree',
      label: 'Skill Tree',
      description: 'Define the skills players will develop',
      link: '/skilltree',
      completed: hasValidSkillTree(project.skillTree),
      priority: 'recommended'
    },
    {
      id: 'vibes',
      label: 'Game Vibes',
      description: 'Select the emotional tone of your experience',
      link: '/idea',
      completed: project.vibeChips && project.vibeChips.length >= 1,
      priority: 'recommended'
    }
  ];

  const requiredMissing = requirements.filter(r => r.priority === 'required' && !r.completed);
  const recommendedMissing = requirements.filter(r => r.priority === 'recommended' && !r.completed);
  const completedCount = requirements.filter(r => r.completed).length;
  const completionPercentage = Math.round((completedCount / requirements.length) * 100);

  return {
    isReady: requiredMissing.length === 0,
    completionPercentage,
    requiredMissing,
    recommendedMissing,
    allRequirements: requirements
  };
}

/**
 * Build a comprehensive journey summary for the AI (Roblox-focused)
 */
export function buildJourneySummary(project: Project): string {
  let summary = '';

  // Basic info - Roblox focused
  summary += `=== ROBLOX PROJECT DETAILS ===\n`;
  summary += `Title: ${project.finalTitle || 'Not set'}\n`;
  summary += `Platform: Roblox\n`;
  summary += `Team Size: ${project.teamSize || 'Not set'}\n`;
  summary += `Time Horizon: ${project.timeHorizon || 'Not set'}\n`;
  summary += `Vibes: ${project.vibeChips?.length > 0 ? project.vibeChips.join(', ') : 'Not set'}\n\n`;

  // Concept
  summary += `=== GAME CONCEPT ===\n`;
  summary += `${project.finalConcept || 'Not written'}\n\n`;

  // Structured idea if available
  if (project.structuredIdea) {
    summary += `=== STRUCTURED IDEA ===\n`;
    summary += `Core Verbs: ${project.structuredIdea.coreVerbs?.join(', ') || 'Not set'}\n`;
    summary += `Loop Hook: ${project.structuredIdea.loopHook || 'Not set'}\n\n`;
  }

  // Game Questions
  if (project.gameQuestions) {
    const q = project.gameQuestions;
    summary += `=== GAME DETAILS (from questionnaire) ===\n`;
    if (q.oneSentence) summary += `One-Sentence Pitch: ${q.oneSentence}\n`;
    if (q.genre) summary += `Genre: ${q.genre}\n`;
    if (q.genreSuccessRate) summary += `Genre Success Rate: ${q.genreSuccessRate}\n`;
    if (q.emotions?.length > 0) summary += `Target Emotions: ${q.emotions.join(', ')}\n`;
    if (q.targetPlayer) summary += `Target Player: ${q.targetPlayer}\n`;
    if (q.playerGames?.length > 0) summary += `Games This Player Enjoys: ${q.playerGames.join(', ')}\n`;
    if (q.pricePoint) summary += `Price Point: ${q.pricePoint}\n`;
    if (q.priceReason) summary += `Price Reasoning: ${q.priceReason}\n`;
    if (q.biggestRisk) summary += `Biggest Risk (self-identified): ${q.biggestRisk}\n`;
    if (q.notFor) summary += `This Game is NOT For: ${q.notFor}\n`;
    if (q.memorableThing) summary += `Most Memorable Thing: ${q.memorableThing}\n`;
    summary += '\n';
  }

  // Game Loop
  if (project.gameLoop && project.gameLoop.length > 0) {
    summary += `=== GAME LOOP DIAGRAM ===\n`;
    summary += `Total Nodes: ${project.gameLoop.length}\n`;
    
    // Group by loop type
    const mainLoop = project.gameLoop.filter(n => n.loopType === 'main');
    const subLoops = project.gameLoop.filter(n => n.loopType === 'sub');
    
    if (mainLoop.length > 0) {
      summary += `\nMain Loop (${mainLoop.length} nodes):\n`;
      mainLoop.forEach(node => {
        const connections = node.connections
          .map(connId => project.gameLoop.find(n => n.id === connId)?.label || 'unknown')
          .filter(Boolean);
        summary += `  - ${node.type.toUpperCase()}: "${node.label}"`;
        if (connections.length > 0) {
          summary += ` → ${connections.join(', ')}`;
        }
        summary += '\n';
      });
    }
    
    if (subLoops.length > 0) {
      // Group sub-loops by name
      const subLoopNames = Array.from(new Set(subLoops.map(n => n.loopName).filter(Boolean))) as string[];
      subLoopNames.forEach(loopName => {
        const nodesInLoop = subLoops.filter(n => n.loopName === loopName);
        summary += `\nSub-Loop "${loopName}" (${nodesInLoop.length} nodes):\n`;
        nodesInLoop.forEach(node => {
          const connections = node.connections
            .map(connId => project.gameLoop.find(n => n.id === connId)?.label || 'unknown')
            .filter(Boolean);
          summary += `  - ${node.type.toUpperCase()}: "${node.label}"`;
          if (connections.length > 0) {
            summary += ` → ${connections.join(', ')}`;
          }
          summary += '\n';
        });
      });
    }
    
    // Check for issues
    const hasConnections = project.gameLoop.some(n => n.connections.length > 0);
    if (!hasConnections) {
      summary += `\n⚠️ WARNING: No connections between nodes - loop may be incomplete\n`;
    }
    
    const nodeTypes = project.gameLoop.map(n => n.type);
    const hasAction = nodeTypes.includes('action');
    const hasChallenge = nodeTypes.includes('challenge');
    const hasReward = nodeTypes.includes('reward');
    
    if (!hasAction || !hasChallenge || !hasReward) {
      summary += `⚠️ WARNING: Missing core loop elements (`;
      const missing = [];
      if (!hasAction) missing.push('action');
      if (!hasChallenge) missing.push('challenge');
      if (!hasReward) missing.push('reward');
      summary += missing.join(', ') + ')\n';
    }
    
    summary += '\n';
  } else {
    summary += `=== GAME LOOP DIAGRAM ===\n`;
    summary += `⚠️ Not yet created\n\n`;
  }

  // Skill Tree
  if (project.skillTree && project.skillTree.length > 0) {
    summary += `=== SKILL TREE ===\n`;
    summary += `Total Skills: ${project.skillTree.length}\n`;
    
    // Group by level
    const core = project.skillTree.filter(s => s.level === 'core');
    const advanced = project.skillTree.filter(s => s.level === 'advanced');
    const expert = project.skillTree.filter(s => s.level === 'expert');
    
    if (core.length > 0) {
      summary += `Core Skills: ${core.map(s => s.label).join(', ')}\n`;
    }
    if (advanced.length > 0) {
      summary += `Advanced Skills: ${advanced.map(s => s.label).join(', ')}\n`;
    }
    if (expert.length > 0) {
      summary += `Expert Skills: ${expert.map(s => s.label).join(', ')}\n`;
    }
    summary += '\n';
  }

  // Ikigai (if used no-idea path)
  if (project.ikigai?.chips && project.ikigai.chips.length > 0) {
    summary += `=== IKIGAI PROFILE ===\n`;
    const chips = project.ikigai.chips;
    const love = chips.filter(c => c.categories.includes('love')).map(c => c.text);
    const good = chips.filter(c => c.categories.includes('good')).map(c => c.text);
    const ship = chips.filter(c => c.categories.includes('ship')).map(c => c.text);
    const want = chips.filter(c => c.categories.includes('want')).map(c => c.text);
    const overlap = chips.filter(c => c.categories.length >= 2).map(c => c.text);
    
    if (love.length > 0) summary += `Things They Love: ${love.join(', ')}\n`;
    if (good.length > 0) summary += `Things They're Good At: ${good.join(', ')}\n`;
    if (ship.length > 0) summary += `Things They Can Ship: ${ship.join(', ')}\n`;
    if (want.length > 0) summary += `Things Players Want: ${want.join(', ')}\n`;
    if (overlap.length > 0) summary += `Sweet Spots (overlap): ${overlap.join(', ')}\n`;
    summary += '\n';
  }

  // Selected Spark (if used no-idea path)
  if (project.selectedSpark) {
    summary += `=== SELECTED SPARK ===\n`;
    const spark = project.selectedSpark;
    summary += `Original Title: ${spark.title}\n`;
    summary += `Hook: ${spark.hook}\n`;
    summary += `Core Loop: ${spark.coreLoop}\n`;
    summary += `Unique Mechanic: ${spark.uniqueMechanic}\n`;
    summary += `Win/Lose Condition: ${spark.winLoseCondition}\n`;
    summary += `Scope Level: ${spark.scopeLevel}\n`;
    if (spark.whyFun?.length > 0) {
      summary += `Why It's Fun: ${spark.whyFun.join('; ')}\n`;
    }
    summary += '\n';
  }

  return summary;
}
