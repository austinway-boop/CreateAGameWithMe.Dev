'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, ChevronRight, Users, Eye, Zap, Target, Clock, AlertTriangle, Trophy, Gamepad2, DollarSign, TrendingUp } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CardSkeleton } from '@/components/LoadingScreen';
import { ValidationResult } from '@/lib/prompts';
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

// Score circle component with color coding
function ScoreCircle({ score, label }: { score: number; label: string }) {
  // Color based on score
  const getScoreStyle = (s: number) => {
    if (s >= 8) return { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Great' };
    if (s >= 6) return { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Good' };
    if (s >= 4) return { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Meh' };
    return { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Bad' };
  };
  const style = getScoreStyle(score);
  
  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-full border-4 ${style.border} ${style.bg} flex items-center justify-center mx-auto mb-1`}>
        <span className={`text-2xl font-black ${style.text}`}>{score}</span>
      </div>
      <div className="text-xs font-medium text-gray-700">{label}</div>
      <div className={`text-xs ${style.text}`}>{style.label}</div>
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
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

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
      console.log('Sending data:', testData);
      
      try {
        const res = await fetch('/api/validateIdea', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: { id: 'dev-test', ...testData } }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          console.error('%c❌ API Error:', 'color: red;', err);
          return;
        }
        
        const result = await res.json();
        console.log('%c✅ Validation Result:', 'color: green; font-weight: bold;');
        console.log('Overall Score:', result.overallScore);
        console.log('Verdict:', result.verdict);
        console.log('Genre:', result.genreAnalysis?.detectedGenre);
        console.log('Summary:', result.summary);
        console.log('Hard Truth:', result.hardTruth);
        console.log('Full result:', result);
        
        // Also update the UI
        setValidation(result);
        setValidationState('complete');
        setDevMode(true);
      } catch (err) {
        console.error('%c❌ Fetch Error:', 'color: red;', err);
      }
    };

    (window as any).devTestBadGame = () => testWithData(BAD_GAME_DATA, 'Super Jump Obby 2 (BAD)');
    (window as any).devTestGoodGame = () => testWithData(GOOD_GAME_DATA, 'Possessed Academy (GOOD)');
    (window as any).devClearGame = () => {
      setValidation(null);
      setValidationState('idle');
      setDevMode(false);
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

    try {
      const response = await fetch('/api/validateIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
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

  // Loading state
  if (validationState === 'validating') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <Gamepad2 className="absolute inset-0 m-auto w-8 h-8 text-pink-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Analyzing Your Game</h2>
            <p className="text-gray-500 text-sm">Comparing against Roblox market data...</p>
          </div>
        </div>
      </div>
    );
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

  // Safe access to all validation properties
  const verdict = validation.verdict || 'needs_work';
  const overallScore = validation.overallScore || 0;
  const marketScore = validation.marketFit?.score || 0;
  const loopScore = validation.loopAnalysis?.score || 0;
  const summary = validation.summary || '';
  const hardTruth = validation.hardTruth || '';
  const strengths = validation.strengths || [];
  const concerns = validation.concerns || [];
  const dealbreakers = validation.dealbreakers || [];
  const suggestions = validation.suggestions || [];

  const verdictConfig = {
    strong: { label: 'High Potential', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', emoji: '🚀' },
    promising: { label: 'Promising', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', emoji: '👍' },
    needs_work: { label: 'Needs Work', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', emoji: '⚠️' },
    rethink: { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', emoji: '🔄' },
  }[verdict] || { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', emoji: '❓' };

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

        {/* Verdict Card */}
        <div className={`${verdictConfig.bg} ${verdictConfig.border} border-2 rounded-2xl p-6 text-center`}>
          <div className="text-4xl mb-2">{verdictConfig.emoji}</div>
          <div className={`text-2xl font-bold ${verdictConfig.color}`}>{verdictConfig.label}</div>
          <p className="text-gray-600 mt-2 text-sm">{summary}</p>
          
          {/* Scores */}
          <div className="flex justify-center gap-6 mt-4">
            <ScoreCircle score={overallScore} label="Overall" />
            <ScoreCircle score={marketScore} label="Market Fit" />
            <ScoreCircle score={loopScore} label="Game Loop" />
          </div>
          
          {/* Score Legend */}
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span className="text-green-600">8-10 = Build it</span>
            <span className="text-blue-600">6-7 = Promising</span>
            <span className="text-amber-600">4-5 = Needs work</span>
            <span className="text-red-600">1-3 = Rethink</span>
          </div>
        </div>

        {/* Hard Truth */}
        {hardTruth && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-semibold text-amber-800 text-sm">The Hard Truth</div>
                <p className="text-amber-700 text-sm mt-1">{hardTruth}</p>
              </div>
            </div>
          </div>
        )}

        {/* Your Competition */}
        {genreData && (
          <div className="bg-white rounded-2xl shadow-[0_3px_0_#e5e7eb] overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-gray-900">Your Competition</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  genreData.competition_level === 'extreme' || genreData.competition_level === 'very_high'
                    ? 'bg-red-100 text-red-700'
                    : genreData.competition_level === 'high'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {(genreData.competition_level || 'unknown').replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{genreData.name} genre • #{genreData.popularity_rank} on Roblox</p>
            </div>
            
            <div className="p-4 space-y-2">
              {(genreData.top_games || []).slice(0, 3).map((game: any, i: number) => (
                <CompetitorCard
                  key={game.name}
                  name={game.name}
                  visits={game.visits}
                  revenue={game.monthly_revenue_estimate}
                  rank={i + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Retention Targets */}
        <div className="bg-white rounded-2xl shadow-[0_3px_0_#e5e7eb] overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-gray-900">Retention Targets</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Day 1 Retention</span>
                <span className="font-medium">{parsePercentage(validation.retentionAnalysis?.predictedD1, 25)}%</span>
              </div>
              <Progress value={parsePercentage(validation.retentionAnalysis?.predictedD1, 25)} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Target: {benchmarks.target_for_success.d1_minimum}%+</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Day 7 Retention</span>
                <span className="font-medium">{parsePercentage(validation.retentionAnalysis?.predictedD7, 10)}%</span>
              </div>
              <Progress value={parsePercentage(validation.retentionAnalysis?.predictedD7, 10) * 2} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">Target: {benchmarks.target_for_success.d7_minimum}%+</div>
            </div>
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_3px_0_#e5e7eb] overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="font-bold text-green-800">Strengths</span>
            </div>
            <div className="p-4 space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span className="text-gray-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_3px_0_#e5e7eb] overflow-hidden">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-bold text-amber-800">Concerns</span>
            </div>
            <div className="p-4 space-y-2">
              {concerns.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span className="text-gray-700">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dealbreakers */}
        {dealbreakers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_3px_0_#e5e7eb] overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-800">Critical Issues</span>
            </div>
            <div className="p-4 space-y-2">
              {dealbreakers.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span className="text-gray-700">{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_3px_0_#e5e7eb] overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="font-bold text-blue-800">Suggestions</span>
            </div>
            <div className="p-4 space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data source */}
        <p className="text-center text-xs text-gray-400">
          Data from Roblox Creator Hub & industry benchmarks
        </p>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto">
          <Button className="w-full" size="lg" onClick={() => router.push('/finalize')}>
            Continue to Game Plan
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
