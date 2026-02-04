'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, ChevronRight, Users, Eye, Zap, Target, Clock, AlertTriangle, Trophy, Gamepad2, DollarSign, TrendingUp } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CardSkeleton } from '@/components/LoadingScreen';
import { ComprehensiveValidation } from '@/lib/validationAgents';
import { checkValidationReadiness, ValidationReadiness } from '@/lib/validationRequirements';
import { Project } from '@/lib/types';

// Import Roblox data
import robloxGenreData from '@/lib/data/robloxGenreData.json';
import robloxBenchmarks from '@/lib/data/robloxBenchmarks.json';

type ValidationState = 'idle' | 'validating' | 'complete' | 'error' | 'incomplete';

// ============================================
// DEV TEST DATA - Complete with gameLoop and skillTree
// ============================================

const BAD_GAME_DATA: Partial<Project> = {
  hasIdea: true,
  platform: 'Roblox',
  teamSize: 'Solo',
  timeHorizon: '6 months',
  ideaDescription: 'An obby where you jump on platforms to reach the end. There are 100 levels and you can buy skips with Robux. Its like Tower of Hell but easier.',
  vibeChips: ['Action'],
  structuredIdea: {
    title: 'Super Jump Obby 2',
    conceptParagraph: 'A basic obby game where players jump across platforms to reach checkpoints. Each level gets progressively harder. Players can purchase level skips and speed boosts with Robux.',
    coreVerbs: ['Jump', 'Skip'],
    loopHook: 'Complete levels to unlock more levels',
  },
  finalTitle: 'Super Jump Obby 2',
  finalConcept: 'A 100-level obby where players jump across platforms to reach checkpoints. Features include level skips for Robux, speed boost game passes, and a leaderboard. Its basically Tower of Hell but with easier jumps and more levels. Solo experience - no multiplayer features. Planning to add 100 hand-crafted levels over 6 months.',
  gameLoop: [
    { id: '1', type: 'action', label: 'Jump on platform', x: 100, y: 100, connections: ['2'], loopType: 'main' },
    { id: '2', type: 'challenge', label: 'Avoid falling', x: 200, y: 100, connections: ['3'], loopType: 'main' },
    { id: '3', type: 'reward', label: 'Reach checkpoint', x: 300, y: 100, connections: ['1'], loopType: 'main' },
  ],
  skillTree: [
    { id: '1', label: 'Basic Jumping', level: 'core', x: 100, y: 100, dependencies: [] },
    { id: '2', label: 'Timing', level: 'core', x: 200, y: 100, dependencies: [] },
  ],
  gameQuestions: {
    oneSentence: 'Jump on platforms to beat 100 levels',
    genre: 'Obby',
    genreSuccessRate: 'Low - extremely saturated',
    emotions: ['Satisfaction'],
    targetPlayer: 'Anyone who likes obbies',
    playerGames: ['Tower of Hell', 'Escape Room'],
    pricePoint: 'Free with paid skips (50 Robux per skip)',
    priceReason: 'Everyone does it this way',
    biggestRisk: 'There are thousands of obbies already',
    notFor: 'People who hate jumping games',
    memorableThing: 'Completing level 100',
  },
  currentPage: 'validation',
};

const GOOD_GAME_DATA: Partial<Project> = {
  hasIdea: true,
  platform: 'Roblox',
  teamSize: '2–5',
  timeHorizon: '3 months',
  ideaDescription: 'A social horror game where 4 players explore a haunted school at night. One player secretly becomes possessed by a ghost and must sabotage the others without being caught. Features proximity voice chat, flickering lights, procedurally generated paranormal events, and dramatic reveal moments.',
  vibeChips: ['Horror', 'Social', 'Competitive'],
  structuredIdea: {
    title: 'Possessed Academy',
    conceptParagraph: 'A 4-player social horror experience set in a procedurally haunted school. Players must complete objectives (find keys, solve puzzles, restore power) while one secretly possessed player tries to eliminate others. Proximity voice chat creates tense moments - can you trust the voice in the dark? Streamable highlights include dramatic possession reveals, close escapes, and trust betrayals.',
    coreVerbs: ['Survive', 'Deceive', 'Investigate', 'Escape'],
    loopHook: 'Trust no one - your best friend might be possessed',
  },
  finalTitle: 'Possessed Academy',
  finalConcept: 'Among Us meets DOORS in a haunted school. 4 players spawn in a dark, abandoned school. One is secretly possessed by a ghost. Survivors must complete 5 objectives (find keys, restore power, solve ritual puzzles) to escape. The possessed player has ghost powers (teleport through walls, cause hallucinations, sabotage objectives) but must avoid being caught on security cameras or during group votes. Proximity voice chat means you can only hear nearby players. Rounds are 10-15 minutes. Monetization through cosmetic skins (ghost skins, survivor outfits), private servers for friend groups, and seasonal event passes.',
  gameLoop: [
    { id: '1', type: 'action', label: 'Explore school rooms', x: 100, y: 100, connections: ['2', '3'], loopType: 'main' },
    { id: '2', type: 'challenge', label: 'Complete objective', x: 200, y: 50, connections: ['4'], loopType: 'main' },
    { id: '3', type: 'challenge', label: 'Avoid possessed player', x: 200, y: 150, connections: ['5'], loopType: 'main' },
    { id: '4', type: 'reward', label: 'Progress toward escape', x: 300, y: 50, connections: ['1', '6'], loopType: 'main' },
    { id: '5', type: 'decision', label: 'Call emergency vote', x: 300, y: 150, connections: ['7'], loopType: 'main' },
    { id: '6', type: 'reward', label: 'Escape and win', x: 400, y: 100, connections: [], loopType: 'main' },
    { id: '7', type: 'action', label: 'Vote to exile player', x: 400, y: 150, connections: ['1'], loopType: 'main' },
    // Possessed player sub-loop
    { id: '8', type: 'action', label: 'Use ghost powers', x: 100, y: 250, connections: ['9'], loopType: 'sub', loopName: 'Possessed' },
    { id: '9', type: 'challenge', label: 'Sabotage without being seen', x: 200, y: 250, connections: ['10'], loopType: 'sub', loopName: 'Possessed' },
    { id: '10', type: 'reward', label: 'Eliminate survivor', x: 300, y: 250, connections: ['8'], loopType: 'sub', loopName: 'Possessed' },
  ],
  skillTree: [
    { id: '1', label: 'Map Awareness', level: 'core', x: 100, y: 100, dependencies: [] },
    { id: '2', label: 'Sound Cues', level: 'core', x: 200, y: 100, dependencies: [] },
    { id: '3', label: 'Reading Player Behavior', level: 'advanced', x: 150, y: 200, dependencies: ['1', '2'] },
    { id: '4', label: 'Efficient Pathing', level: 'advanced', x: 250, y: 200, dependencies: ['1'] },
    { id: '5', label: 'Deception (as possessed)', level: 'advanced', x: 350, y: 200, dependencies: ['3'] },
    { id: '6', label: 'Vote Manipulation', level: 'expert', x: 200, y: 300, dependencies: ['3', '5'] },
    { id: '7', label: 'Speed Running Objectives', level: 'expert', x: 300, y: 300, dependencies: ['4'] },
  ],
  gameQuestions: {
    oneSentence: 'Among Us meets DOORS - 4 players, one is secretly possessed, escape the haunted school',
    genre: 'Horror / Social Deduction',
    genreSuccessRate: 'High - horror is trending fast, social deduction proven (Among Us)',
    emotions: ['Fear', 'Suspicion', 'Relief', 'Excitement', 'Betrayal'],
    targetPlayer: 'Friend groups aged 13-18 who watch horror streams on YouTube/Twitch, play Among Us and DOORS, want games to play together on Discord calls',
    playerGames: ['DOORS', 'Piggy', 'Murder Mystery 2', 'Among Us', 'Phasmophobia'],
    pricePoint: 'Free with cosmetic skins (ghost effects, survivor outfits) and private servers',
    priceReason: 'Horror players love showing off status through rare skins. Private servers let friend groups play together without randoms.',
    biggestRisk: 'Requires exactly 4 players - need good matchmaking and private server support or it dies from empty lobbies',
    notFor: 'Solo players (requires 4), very young kids (horror themes), players who hate social deduction/betrayal mechanics',
    memorableThing: 'The moment you realize your best friend has been possessed the whole time and was playing you',
  },
  currentPage: 'validation',
};

// Global dev helpers
declare global {
  interface Window {
    devTestBadGame?: () => void;
    devTestGoodGame?: () => void;
    devClearGame?: () => void;
  }
}

// Helpers
function formatNumber(num: string | number): string {
  if (typeof num === 'string') return num;
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

function parsePercentage(str: string | undefined, fallback: number): number {
  if (!str) return fallback;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : fallback;
}

// Skeleton components for loading state
function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function ValidationSkeleton() {
  return (
    <div className="flex-1 overflow-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <SkeletonPulse className="w-16 h-8" />
          <SkeletonPulse className="w-32 h-6" />
          <SkeletonPulse className="w-8 h-8" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Agent Status */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border-2 border-pink-200">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-pink-700">Running AI Analysis...</span>
          </div>
          <div className="flex justify-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full animate-pulse">🎯 Market</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full animate-pulse">🔄 Loop</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full animate-pulse">⚔️ Competitor</span>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full animate-pulse">✅ Verdict</span>
          </div>
        </div>

        {/* Verdict Skeleton */}
        <div className="bg-white rounded-2xl shadow-[0_4px_0_#e5e7eb] p-6">
          <div className="flex justify-center mb-4">
            <SkeletonPulse className="w-24 h-8 rounded-full" />
          </div>
          <SkeletonPulse className="w-3/4 h-4 mx-auto mb-2" />
          <SkeletonPulse className="w-1/2 h-4 mx-auto mb-6" />
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center">
                <SkeletonPulse className="w-14 h-14 rounded-full mx-auto mb-2" />
                <SkeletonPulse className="w-12 h-3 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Hard Truth Skeleton */}
        <div className="bg-white rounded-2xl shadow-[0_4px_0_#e5e7eb] p-4">
          <div className="flex gap-3">
            <SkeletonPulse className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1">
              <SkeletonPulse className="w-24 h-4 mb-2" />
              <SkeletonPulse className="w-full h-3 mb-1" />
              <SkeletonPulse className="w-3/4 h-3" />
            </div>
          </div>
        </div>

        {/* Sections Skeleton */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-[0_4px_0_#e5e7eb] overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <SkeletonPulse className="w-32 h-5" />
            </div>
            <div className="p-4 space-y-2">
              <SkeletonPulse className="w-full h-3" />
              <SkeletonPulse className="w-5/6 h-3" />
              <SkeletonPulse className="w-4/6 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Score circle component with color coding - Duolingo style
function ScoreCircle({ score, label }: { score: number; label: string }) {
  const getScoreStyle = (s: number) => {
    if (s >= 8) return { border: 'border-[#58cc02]', bg: 'bg-[#d7ffb8]', text: 'text-[#58a700]', label: '🔥', shadow: 'shadow-[0_4px_0_#58a700]' };
    if (s >= 6) return { border: 'border-[#1cb0f6]', bg: 'bg-[#ddf4ff]', text: 'text-[#1899d6]', label: '👍', shadow: 'shadow-[0_4px_0_#1899d6]' };
    if (s >= 4) return { border: 'border-[#ff9600]', bg: 'bg-[#fff4e0]', text: 'text-[#ea7900]', label: '🤔', shadow: 'shadow-[0_4px_0_#ea7900]' };
    return { border: 'border-[#ff4b4b]', bg: 'bg-[#ffe0e0]', text: 'text-[#ea2b2b]', label: '⚠️', shadow: 'shadow-[0_4px_0_#ea2b2b]' };
  };
  const style = getScoreStyle(score);
  
  return (
    <div className="text-center">
      <div className={`w-14 h-14 rounded-2xl border-2 ${style.border} ${style.bg} ${style.shadow} flex items-center justify-center mx-auto mb-1 transition-transform hover:scale-105`}>
        <span className={`text-xl font-black ${style.text}`}>{score}</span>
      </div>
      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{label}</div>
    </div>
  );
}

// Game comparison card
function CompetitorCard({ name, visits, revenue, rank }: { name: string; visits: string; revenue: string; rank: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 bg-pink-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{name}</div>
        <div className="text-xs text-gray-500 flex gap-2">
          <span>{visits} visits</span>
          <span>•</span>
          <span className="text-green-600">{revenue}/mo</span>
        </div>
      </div>
    </div>
  );
}

export default function ValidationPage() {
  const router = useRouter();
  const { project, loading } = useProject();
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validation, setValidation] = useState<ComprehensiveValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('');

  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  const readiness: ValidationReadiness = useMemo(() => {
    return checkValidationReadiness(project);
  }, [project]);

  // Get genre data for comparison (safe access)
  const genreData = useMemo(() => {
    try {
      const detectedGenre = validation?.genreAnalysis?.detectedGenre;
      if (!detectedGenre) return null;
      const primaryGenre = detectedGenre.toLowerCase().replace(/[\s\/]/g, '_');
      const genres = robloxGenreData.genres as Record<string, any>;
      return genres[primaryGenre] || genres['simulator'] || null;
    } catch {
      return null;
    }
  }, [validation]);

  // Dev test function - validates with test data
  const runDevTest = async (testData: Partial<Project>) => {
    setValidationState('validating');
    setError(null);
    setDevMode(true);

    // Debug: log what we're sending
    console.log('%c=== SENDING TO API ===', 'color: #ff6b00; font-weight: bold;');
    console.log('Title:', testData.finalTitle);
    console.log('Genre from questions:', testData.gameQuestions?.genre);
    console.log('Vibes:', testData.vibeChips);
    console.log('GameLoop nodes:', testData.gameLoop?.length);
    console.log('SkillTree nodes:', testData.skillTree?.length);
    console.log('Full test data:', testData);

    try {
      // Use test data directly - don't need current project
      const response = await fetch('/api/validateIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { id: 'dev-test', ...testData } }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to validate');
      }

      const result: ValidationResult = await response.json();
      setValidation(result);
      setValidationState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setValidationState('error');
    }
  };

  // Expose dev helpers immediately on mount
  useEffect(() => {
    // Standalone test function that doesn't depend on React state
    const testWithData = async (testData: Partial<Project>, name: string) => {
      console.log(`%c🎮 Testing: "${name}"`, 'color: #ff6b00; font-weight: bold;');
      setValidationState('validating');
      setAgentStatus('Running 4-agent analysis...');
      setDevMode(true);
      
      try {
        const res = await fetch('/api/validateComprehensive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: { id: 'dev-test', ...testData } }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          console.error('%c❌ API Error:', 'color: red;', err);
          setValidationState('error');
          setError(err.message || 'API Error');
          return;
        }
        
        const result = await res.json();
        console.log('%c✅ Comprehensive Validation Result:', 'color: green; font-weight: bold;');
        console.log('Overall Score:', result.finalVerdict?.overallScore);
        console.log('Verdict:', result.finalVerdict?.verdict);
        console.log('Market Score:', result.marketAnalysis?.score);
        console.log('Loop Score:', result.loopAnalysis?.score);
        console.log('Competitor Score:', result.competitorAnalysis?.score);
        
        setValidation(result);
        setValidationState('complete');
        setAgentStatus('');
      } catch (err) {
        console.error('%c❌ Fetch Error:', 'color: red;', err);
        setValidationState('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    (window as any).devTestBadGame = () => testWithData(BAD_GAME_DATA, 'Super Jump Obby 2 (BAD)');
    (window as any).devTestGoodGame = () => testWithData(GOOD_GAME_DATA, 'Possessed Academy (GOOD)');
    (window as any).devClearGame = () => {
      setValidation(null);
      setValidationState('idle');
      setDevMode(false);
      setAgentStatus('');
      console.log('%c🎮 Cleared', 'color: #00A2FF;');
    };

    console.log('%c🎮 Dev Commands Ready:', 'color: #58cc02; font-weight: bold;');
    console.log('  devTestBadGame()  - Test oversaturated obby');
    console.log('  devTestGoodGame() - Test horror social game');
    console.log('  devClearGame()    - Reset');
  }, []); // Empty deps - run once on mount

  // Auto-run validation
  useEffect(() => {
    if (project && validationState === 'idle' && aiEnabled && !devMode) {
      if (readiness.isReady) {
        runValidation();
      } else {
        setValidationState('incomplete');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, readiness.isReady]);

  const runValidation = async () => {
    if (!project) return;
    setValidationState('validating');
    setError(null);
    setAgentStatus('Starting 4-agent analysis...');

    try {
      setAgentStatus('Running Market, Loop & Competitor agents...');
      
      const response = await fetch('/api/validateComprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to validate');
      }

      const result: ComprehensiveValidation = await response.json();
      setValidation(result);
      setValidationState('complete');
      setAgentStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setValidationState('error');
    }
  };

  if (loading || !project) {
    return <CardSkeleton />;
  }

  if (!aiEnabled) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-4">
          <Gamepad2 className="w-16 h-16 mx-auto text-pink-500" />
          <h1 className="text-xl font-bold text-gray-900">AI Validation Disabled</h1>
          <p className="text-gray-500 text-sm">Enable AI to analyze your Roblox game idea.</p>
          <Button variant="outline" onClick={() => router.push('/skilltree')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Requirements checklist
  if (!devMode && (validationState === 'incomplete' || (validationState === 'idle' && !readiness.isReady))) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <Gamepad2 className="w-12 h-12 mx-auto text-pink-500" />
            <h1 className="text-xl font-bold text-gray-900">Complete Your Journey First</h1>
            <p className="text-gray-500 text-sm">We need more info about your Roblox game to validate it.</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_3px_0_#e5e7eb] space-y-3">
            {readiness.allRequirements.map((req) => (
              <div key={req.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  req.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {req.completed ? '✓' : '○'}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${req.completed ? 'text-green-600' : 'text-gray-900'}`}>
                    {req.label}
                  </div>
                  {!req.completed && <div className="text-xs text-gray-500">{req.description}</div>}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={() => router.push('/questions')}>
            Continue Journey
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Loading state - Skeleton
  if (validationState === 'validating') {
    return <ValidationSkeleton />;
  }

  // Error state
  if (validationState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-4">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Validation Failed</h1>
          <p className="text-gray-500 text-sm">{error}</p>
          <Button onClick={runValidation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!validation) return null;

  // Safe access to comprehensive validation properties
  const finalVerdict = validation.finalVerdict;
  const verdict = finalVerdict?.verdict || 'needs_work';
  const overallScore = finalVerdict?.overallScore || 0;
  const marketScore = validation.marketAnalysis?.score || 0;
  const loopScore = validation.loopAnalysis?.score || 0;
  const competitorScore = validation.competitorAnalysis?.score || 0;
  const summary = finalVerdict?.summary || '';
  const hardTruth = finalVerdict?.hardTruth || '';
  const strengths = finalVerdict?.topStrengths || [];
  const criticalIssues = finalVerdict?.criticalIssues || [];
  const dealbreakers = finalVerdict?.dealbreakers || [];
  const actionItems = finalVerdict?.actionItems || [];
  const buildRecommendation = finalVerdict?.buildRecommendation || '';
  const pivotSuggestions = finalVerdict?.pivotSuggestions || [];

  const verdictConfig = {
    strong: { label: 'Build It!', color: 'text-[#58a700]', bg: 'bg-[#d7ffb8]', border: 'border-[#58cc02]', shadow: 'shadow-[0_4px_0_#58a700]', emoji: '🚀' },
    promising: { label: 'Promising', color: 'text-[#1899d6]', bg: 'bg-[#ddf4ff]', border: 'border-[#1cb0f6]', shadow: 'shadow-[0_4px_0_#1899d6]', emoji: '👍' },
    needs_work: { label: 'Needs Work', color: 'text-[#ea7900]', bg: 'bg-[#fff4e0]', border: 'border-[#ff9600]', shadow: 'shadow-[0_4px_0_#ea7900]', emoji: '🛠️' },
    rethink: { label: 'Rethink', color: 'text-[#ea2b2b]', bg: 'bg-[#ffe0e0]', border: 'border-[#ff4b4b]', shadow: 'shadow-[0_4px_0_#ea2b2b]', emoji: '🔄' },
  }[verdict] || { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', shadow: 'shadow-[0_4px_0_#d1d5db]', emoji: '❓' };

  const benchmarks = robloxBenchmarks.retention_benchmarks;

  return (
    <div className="flex-1 overflow-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/skilltree')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="font-bold text-gray-900">Roblox Validator</span>
          <Button variant="ghost" size="sm" onClick={runValidation}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Dev Mode Banner */}
        {devMode && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧪</span>
              <div>
                <div className="text-purple-700 font-semibold text-sm">Dev Test Mode</div>
                <div className="text-purple-500 text-xs">Using test data</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setValidation(null); setValidationState('idle'); setDevMode(false); }}>
              Clear
            </Button>
          </div>
        )}

        {/* Verdict Card - Duolingo Style */}
        <div className={`${verdictConfig.bg} ${verdictConfig.border} border-2 rounded-2xl ${verdictConfig.shadow} p-6 text-center`}>
          <div className="text-5xl mb-3">{verdictConfig.emoji}</div>
          <div className={`text-2xl font-black ${verdictConfig.color} uppercase tracking-wide`}>{verdictConfig.label}</div>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-md mx-auto">{summary}</p>
          
          {/* Scores */}
          <div className="flex justify-center gap-3 mt-6 pt-4 border-t border-white/50">
            <ScoreCircle score={overallScore} label="Overall" />
            <ScoreCircle score={marketScore} label="Market" />
            <ScoreCircle score={loopScore} label="Loop" />
            <ScoreCircle score={competitorScore} label="Edge" />
          </div>
          
          {/* Score Legend */}
          <div className="flex justify-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-wider">
            <span className="text-[#58a700]">🔥 8+</span>
            <span className="text-[#1899d6]">👍 6-7</span>
            <span className="text-[#ea7900]">🤔 4-5</span>
            <span className="text-[#ea2b2b]">⚠️ 1-3</span>
          </div>
        </div>

        {/* Hard Truth & Build Recommendation - Duolingo Style */}
        {hardTruth && (
          <div className="space-y-3">
            <div className="bg-[#fff4e0] border-2 border-[#ff9600] rounded-2xl shadow-[0_4px_0_#ea7900] p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#ff9600] rounded-xl flex items-center justify-center text-xl shadow-[0_2px_0_#ea7900]">💡</div>
                <div className="flex-1">
                  <div className="font-bold text-[#ea7900] text-sm uppercase tracking-wide">Hard Truth</div>
                  <p className="text-gray-700 text-sm mt-1 leading-relaxed">{hardTruth}</p>
                </div>
              </div>
            </div>
            {buildRecommendation && (
              <div className="bg-[#ddf4ff] border-2 border-[#1cb0f6] rounded-2xl shadow-[0_4px_0_#1899d6] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#1cb0f6] rounded-xl flex items-center justify-center text-xl shadow-[0_2px_0_#1899d6]">🎯</div>
                  <div className="flex-1">
                    <div className="font-bold text-[#1899d6] text-sm uppercase tracking-wide">Recommendation</div>
                    <p className="text-gray-700 text-sm mt-1 leading-relaxed">{buildRecommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Your Competition - Duolingo Style */}
        {validation.competitorAnalysis?.directCompetitors && validation.competitorAnalysis.directCompetitors.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b-2 border-[#ff9600]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#ff9600] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#ea7900]">⚔️</div>
                <span className="font-bold text-[#ea7900] uppercase tracking-wide text-sm">Your Competition</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{validation.marketAnalysis?.genre || 'Unknown'} genre</p>
            </div>
            
            <div className="p-4 space-y-2">
              {validation.competitorAnalysis.directCompetitors.slice(0, 3).map((comp, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff9600] to-[#ff4b4b] text-white rounded-lg flex items-center justify-center font-black text-sm shadow-[0_2px_0_#ea7900]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{comp.name}</div>
                    <div className="text-xs text-gray-500">{comp.visits}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loop Insights - Duolingo Style */}
        {validation.loopAnalysis && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b-2 border-[#a560e8]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#a560e8] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#8b47cc]">🔄</div>
                <span className="font-bold text-[#8b47cc] uppercase tracking-wide text-sm">Loop Insights</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {validation.loopAnalysis.primaryLoop && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <div className="text-xs font-bold text-[#8b47cc] uppercase mb-1">Core Loop</div>
                  <div className="text-sm text-gray-700">{validation.loopAnalysis.primaryLoop}</div>
                </div>
              )}
              {validation.loopAnalysis.retention?.whyComeBackTomorrow && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="text-xs font-bold text-[#1899d6] uppercase mb-1">Why They Return</div>
                  <div className="text-sm text-gray-700">{validation.loopAnalysis.retention.whyComeBackTomorrow}</div>
                </div>
              )}
              {validation.loopAnalysis.sessionStructure?.oneMoreRoundFactor && (
                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                  <div className="text-xs font-bold text-[#58a700] uppercase mb-1">"One More Round" Factor</div>
                  <div className="text-sm text-gray-700">{validation.loopAnalysis.sessionStructure.oneMoreRoundFactor}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strengths - Duolingo Style */}
        {strengths.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-[#d7ffb8] px-4 py-3 border-b-2 border-[#58cc02] flex items-center gap-2">
              <div className="w-7 h-7 bg-[#58cc02] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#58a700]">✓</div>
              <span className="font-bold text-[#58a700] uppercase tracking-wide text-sm">Strengths</span>
            </div>
            <div className="p-4 space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-[#58cc02] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                  <span className="text-gray-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Issues - Duolingo Style */}
        {criticalIssues.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-[#fff4e0] px-4 py-3 border-b-2 border-[#ff9600] flex items-center gap-2">
              <div className="w-7 h-7 bg-[#ff9600] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#ea7900]">!</div>
              <span className="font-bold text-[#ea7900] uppercase tracking-wide text-sm">Issues to Fix</span>
            </div>
            <div className="p-4 space-y-2">
              {criticalIssues.map((c, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-[#ff9600] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">!</span>
                  <span className="text-gray-700">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dealbreakers - Duolingo Style */}
        {dealbreakers.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#ff4b4b] shadow-[0_4px_0_#ea2b2b] overflow-hidden">
            <div className="bg-[#ffe0e0] px-4 py-3 border-b-2 border-[#ff4b4b] flex items-center gap-2">
              <div className="w-7 h-7 bg-[#ff4b4b] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#ea2b2b]">✗</div>
              <span className="font-bold text-[#ea2b2b] uppercase tracking-wide text-sm">Dealbreakers</span>
            </div>
            <div className="p-4 space-y-2">
              {dealbreakers.map((d, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-[#ff4b4b] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">✗</span>
                  <span className="text-gray-700">{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items - Duolingo Style */}
        {actionItems.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-[#ddf4ff] px-4 py-3 border-b-2 border-[#1cb0f6] flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1cb0f6] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#1899d6]">📋</div>
              <span className="font-bold text-[#1899d6] uppercase tracking-wide text-sm">Action Items</span>
            </div>
            <div className="p-4 space-y-3">
              {actionItems.map((item, i) => (
                <div key={i} className={`p-3 rounded-xl border-2 ${
                  item.priority === 'high' ? 'border-[#ff4b4b] bg-[#ffe0e0]' :
                  item.priority === 'medium' ? 'border-[#ff9600] bg-[#fff4e0]' :
                  'border-[#1cb0f6] bg-[#ddf4ff]'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                      item.priority === 'high' ? 'bg-[#ff4b4b] text-white' :
                      item.priority === 'medium' ? 'bg-[#ff9600] text-white' :
                      'bg-[#1cb0f6] text-white'
                    }`}>{item.priority}</span>
                    <span className="font-bold text-sm text-gray-800">{item.action}</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-12">{item.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pivot Suggestions - Duolingo Style */}
        {pivotSuggestions.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-[#f0e6ff] px-4 py-3 border-b-2 border-[#a560e8] flex items-center gap-2">
              <div className="w-7 h-7 bg-[#a560e8] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#8b47cc]">💡</div>
              <span className="font-bold text-[#8b47cc] uppercase tracking-wide text-sm">Pivot Ideas</span>
            </div>
            <div className="p-4 space-y-2">
              {pivotSuggestions.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-[#a560e8] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">→</span>
                  <span className="text-gray-700">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data source */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by 4 specialized AI agents • Roblox market data
        </p>
      </div>

      {/* Continue Button - Duolingo Style */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-200">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/finalize')}
            className="w-full bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-4 px-6 rounded-2xl shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] transition-all uppercase tracking-wide flex items-center justify-center gap-2"
          >
            Continue to Game Plan
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
