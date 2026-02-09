'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, ChevronRight, Zap, AlertTriangle, Trophy, Gamepad2, TrendingUp, Flag, Bot, CheckCircle2, X } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/LoadingScreen';
import { ComprehensiveValidation } from '@/lib/validationAgents';
import { checkValidationReadiness, ValidationReadiness } from '@/lib/validationRequirements';
import { Project } from '@/lib/types';


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
        {/* AI Working Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative">
              <Bot className="w-10 h-10 text-pink-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="text-center">
              <div className="font-bold text-pink-700 text-lg">AI is Analyzing Your Game</div>
              <p className="text-pink-500 text-sm mt-1">4 specialized agents are reviewing your idea...</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Market Agent</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Loop Agent</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Competitor Agent</span>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Verdict Agent</span>
          </div>
          <p className="text-center text-xs text-pink-400 mt-3">This usually takes 15-30 seconds</p>
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
    if (s >= 8) return { border: 'border-[#58cc02]', bg: 'bg-[#d7ffb8]', text: 'text-[#58a700]', label: 'Great', shadow: 'shadow-[0_4px_0_#58a700]' };
    if (s >= 6) return { border: 'border-[#1cb0f6]', bg: 'bg-[#ddf4ff]', text: 'text-[#1899d6]', label: 'Good', shadow: 'shadow-[0_4px_0_#1899d6]' };
    if (s >= 4) return { border: 'border-[#ff9600]', bg: 'bg-[#fff4e0]', text: 'text-[#ea7900]', label: 'Fair', shadow: 'shadow-[0_4px_0_#ea7900]' };
    return { border: 'border-[#ff4b4b]', bg: 'bg-[#ffe0e0]', text: 'text-[#ea2b2b]', label: 'Low', shadow: 'shadow-[0_4px_0_#ea2b2b]' };
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

// Report button component for each feedback section
function ReportButton({ validationRunId, section, sectionLabel }: { validationRunId: string | null; section: string; sectionLabel: string }) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<'inaccurate' | 'unhelpful' | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!validationRunId) return null;

  const handleSubmit = async () => {
    if (!reportType) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reportFeedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationRunId, section, reportType, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => { setOpen(false); setSubmitted(false); setReportType(null); setComment(''); }, 1500);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-2">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Report submitted
      </div>
    );
  }

  return (
    <div className="relative mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Flag className="w-3 h-3" />
        Report issue
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-20 bg-white rounded-xl border border-gray-200 shadow-lg p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase">Report {sectionLabel}</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setReportType('inaccurate')}
              className={`flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-colors ${
                reportType === 'inaccurate' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Inaccurate
            </button>
            <button
              onClick={() => setReportType('unhelpful')}
              className={`flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-colors ${
                reportType === 'unhelpful' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Unhelpful
            </button>
          </div>
          <textarea
            placeholder="Optional: tell us more..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg p-2 mb-2 resize-none h-16 focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={handleSubmit}
            disabled={!reportType || submitting}
            className="w-full text-xs py-1.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
          >
            {submitting ? 'Sending...' : 'Submit Report'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ValidationPage() {
  const router = useRouter();
  const { project, loading } = useProject();
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validation, setValidation] = useState<ComprehensiveValidation | null>(null);
  const [validationRunId, setValidationRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [showPreviewOnly, setShowPreviewOnly] = useState(true);

  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  // Check if user has access (subscription or video unlock)
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/stripe/check');
        if (res.ok) {
          const data = await res.json();
          setHasAccess(data.hasAccess);
          if (data.hasAccess) {
            setShowPreviewOnly(false);
          }
        }
      } catch {
        // Default to no access
      } finally {
        setAccessChecked(true);
      }
    };
    checkAccess();
  }, []);

  const readiness: ValidationReadiness = useMemo(() => {
    return checkValidationReadiness(project);
  }, [project]);

  // Get genre data for comparison (safe access)
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

      const result = await response.json();
      const { validationRunId: runId, ...validationData } = result;
      setValidation(validationData as ComprehensiveValidation);
      setValidationRunId(runId || null);
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
                  {req.completed ? '+' : '-'}
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
  const dealbreakers = finalVerdict?.dealbreakers || [];

  const verdictConfig = {
    strong: { label: 'Build It!', color: 'text-[#58a700]', bg: 'bg-[#d7ffb8]', border: 'border-[#58cc02]', shadow: 'shadow-[0_4px_0_#58a700]' },
    promising: { label: 'Promising', color: 'text-[#1899d6]', bg: 'bg-[#ddf4ff]', border: 'border-[#1cb0f6]', shadow: 'shadow-[0_4px_0_#1899d6]' },
    needs_work: { label: 'Needs Work', color: 'text-[#ea7900]', bg: 'bg-[#fff4e0]', border: 'border-[#ff9600]', shadow: 'shadow-[0_4px_0_#ea7900]' },
    rethink: { label: 'Rethink', color: 'text-[#ea2b2b]', bg: 'bg-[#ffe0e0]', border: 'border-[#ff4b4b]', shadow: 'shadow-[0_4px_0_#ea2b2b]' },
  }[verdict] || { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', shadow: 'shadow-[0_4px_0_#d1d5db]' };

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
              <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">T</div>
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

        {/* AI Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Bot className="w-4 h-4" />
          <span className="font-medium">Analyzed by AI — 4 specialized agents</span>
        </div>

        {/* Main Score Card - Always Visible */}
        <div className={`${verdictConfig.bg} ${verdictConfig.border} border-2 rounded-2xl ${verdictConfig.shadow} p-6 text-center`}>
          <div className={`text-2xl font-black ${verdictConfig.color} uppercase tracking-wide`}>{verdictConfig.label}</div>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-md mx-auto">{summary}</p>
          
          {/* Overall Score - Prominent */}
          <div className="flex justify-center mt-6 pt-4 border-t border-white/50">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-2xl border-2 ${
                overallScore >= 8 ? 'border-[#58cc02] bg-[#d7ffb8] shadow-[0_4px_0_#58a700]' :
                overallScore >= 6 ? 'border-[#1cb0f6] bg-[#ddf4ff] shadow-[0_4px_0_#1899d6]' :
                overallScore >= 4 ? 'border-[#ff9600] bg-[#fff4e0] shadow-[0_4px_0_#ea7900]' :
                'border-[#ff4b4b] bg-[#ffe0e0] shadow-[0_4px_0_#ea2b2b]'
              } flex items-center justify-center mx-auto mb-2`}>
                <span className={`text-3xl font-black ${
                  overallScore >= 8 ? 'text-[#58a700]' :
                  overallScore >= 6 ? 'text-[#1899d6]' :
                  overallScore >= 4 ? 'text-[#ea7900]' :
                  'text-[#ea2b2b]'
                }`}>{overallScore}</span>
              </div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Overall Score</div>
            </div>
          </div>

          {/* Sub-scores only shown when user has access */}
          {!showPreviewOnly && (
            <div className="flex justify-center gap-3 mt-4">
              <ScoreCircle score={marketScore} label="Market" />
              <ScoreCircle score={loopScore} label="Loop" />
              <ScoreCircle score={competitorScore} label="Edge" />
            </div>
          )}

          <ReportButton validationRunId={validationRunId} section="verdict" sectionLabel="Verdict" />
        </div>

        {/* Preview Mode: See More */}
        {showPreviewOnly && !hasAccess && (
          <button
            onClick={() => router.push('/subscribe')}
            className="w-full bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-4 px-6 rounded-2xl shadow-[0_4px_0_#1899d6] hover:shadow-[0_2px_0_#1899d6] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2"
          >
            See Full Breakdown
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Full Validation Details - Gated behind access */}
        {!showPreviewOnly && (
        <>

        {/* Hard Truth */}
        {hardTruth && (
          <div className="bg-[#fff4e0] border-2 border-[#ff9600] rounded-2xl shadow-[0_4px_0_#ea7900] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#ff9600] rounded-xl flex items-center justify-center shadow-[0_2px_0_#ea7900]">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#ea7900] text-sm uppercase tracking-wide">Hard Truth</div>
                <p className="text-gray-700 text-sm mt-1 leading-relaxed">{hardTruth}</p>
                <ReportButton validationRunId={validationRunId} section="hardTruth" sectionLabel="Hard Truth" />
              </div>
            </div>
          </div>
        )}

        {/* Competition */}
        {validation.competitorAnalysis && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b-2 border-[#ff9600]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#ff9600] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#ea7900]">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#ea7900] uppercase tracking-wide text-sm">Competition</span>
                <span className="ml-auto text-xs bg-[#ff9600] text-white px-2 py-0.5 rounded-full font-bold">{competitorScore}/10</span>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Direct Competitors */}
              {validation.competitorAnalysis.directCompetitors?.length > 0 && (
                <div className="space-y-2">
                  {validation.competitorAnalysis.directCompetitors.slice(0, 3).map((comp, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-7 h-7 bg-[#ff9600] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{comp.name}</div>
                        <div className="text-xs text-gray-500">{comp.visits}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Differentiation */}
              {validation.competitorAnalysis.differentiationAnalysis && (
                <div className={`p-3 rounded-xl border ${
                  validation.competitorAnalysis.differentiationAnalysis.toLowerCase().includes('weak') ||
                  validation.competitorAnalysis.differentiationAnalysis.toLowerCase().includes('unclear') ||
                  validation.competitorAnalysis.differentiationAnalysis.toLowerCase().includes("doesn't")
                    ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="text-xs font-bold uppercase mb-1 text-gray-600">Your Differentiation</div>
                  <div className="text-sm text-gray-700">{validation.competitorAnalysis.differentiationAnalysis}</div>
                </div>
              )}

              {/* Advantages vs Disadvantages */}
              {(validation.competitorAnalysis.competitiveAdvantages?.length > 0 || validation.competitorAnalysis.competitiveDisadvantages?.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {validation.competitorAnalysis.competitiveAdvantages?.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                      <div className="text-xs font-bold text-green-700 uppercase mb-2">Your Edge</div>
                      <ul className="space-y-1">
                        {validation.competitorAnalysis.competitiveAdvantages.slice(0, 3).map((adv, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-green-500">+</span>
                            {adv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.competitorAnalysis.competitiveDisadvantages?.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                      <div className="text-xs font-bold text-red-700 uppercase mb-2">Gaps</div>
                      <ul className="space-y-1">
                        {validation.competitorAnalysis.competitiveDisadvantages.slice(0, 3).map((dis, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-red-500">-</span>
                            {dis}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <ReportButton validationRunId={validationRunId} section="competition" sectionLabel="Competition" />
            </div>
          </div>
        )}

        {/* Market */}
        {validation.marketAnalysis && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 border-b-2 border-[#1cb0f6]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#1cb0f6] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#1899d6]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#1899d6] uppercase tracking-wide text-sm">Market</span>
                <span className="ml-auto text-xs bg-[#1cb0f6] text-white px-2 py-0.5 rounded-full font-bold">{marketScore}/10</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Genre, Trend & Saturation */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 text-center">
                  <div className="text-[10px] font-bold text-[#1899d6] uppercase">Genre</div>
                  <div className="text-sm font-medium text-gray-800">{validation.marketAnalysis.genre}</div>
                </div>
                <div className={`p-2 rounded-xl border text-center ${
                  validation.marketAnalysis.growthTrend?.includes('rising') ? 'bg-green-50 border-green-200' :
                  validation.marketAnalysis.growthTrend?.includes('declining') ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="text-[10px] font-bold uppercase text-gray-600">Trend</div>
                  <div className="text-sm font-medium text-gray-800">{validation.marketAnalysis.growthTrend}</div>
                </div>
                <div className={`p-2 rounded-xl border text-center ${
                  validation.marketAnalysis.saturationLevel?.includes('extreme') || validation.marketAnalysis.saturationLevel?.includes('high') 
                    ? 'bg-red-50 border-red-200' :
                  validation.marketAnalysis.saturationLevel?.includes('low') ? 'bg-green-50 border-green-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="text-[10px] font-bold uppercase text-gray-600">Saturation</div>
                  <div className="text-sm font-medium text-gray-800">{validation.marketAnalysis.saturationLevel}</div>
                </div>
              </div>

              {/* Risks (most important for market) */}
              {validation.marketAnalysis.risks?.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-[#ea7900] uppercase mb-2">Market Risks</div>
                  <ul className="space-y-1">
                    {validation.marketAnalysis.risks.slice(0, 3).map((risk, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ReportButton validationRunId={validationRunId} section="market" sectionLabel="Market" />
            </div>
          </div>
        )}

        {/* First 5 Minutes */}
        {validation.loopAnalysis?.firstSession && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 border-b-2 border-[#ffc800]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#ffc800] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#e6b400]">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#b38f00] uppercase tracking-wide text-sm">First 5 Minutes</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-[#b38f00] uppercase mb-1">Time to Fun</div>
                  <div className="text-sm font-bold text-gray-800">{validation.loopAnalysis.firstSession.timeToFun}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-[#b38f00] uppercase mb-1">Tutorial Risk</div>
                  <div className="text-sm font-medium text-gray-800">{validation.loopAnalysis.firstSession.tutorialRisk}</div>
                </div>
              </div>
              
              {validation.loopAnalysis.firstSession.hookMoment && (
                <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                  <div className="text-xs font-bold text-[#58a700] uppercase mb-1">Hook Moment</div>
                  <div className="text-sm text-gray-700">{validation.loopAnalysis.firstSession.hookMoment}</div>
                </div>
              )}
              <ReportButton validationRunId={validationRunId} section="firstSession" sectionLabel="First 5 Minutes" />
            </div>
          </div>
        )}

        {/* Core Loop */}
        {validation.loopAnalysis && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b-2 border-[#a560e8]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#a560e8] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#8b47cc]">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#8b47cc] uppercase tracking-wide text-sm">Core Loop</span>
                <span className="ml-auto text-xs bg-[#a560e8] text-white px-2 py-0.5 rounded-full font-bold">{loopScore}/10</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {validation.loopAnalysis.primaryLoop && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <div className="text-sm text-gray-700 font-medium">{validation.loopAnalysis.primaryLoop}</div>
                </div>
              )}
              
              {validation.loopAnalysis.loopStrength && (
                <div className={`p-3 rounded-xl border ${
                  validation.loopAnalysis.loopStrength.includes('strong') ? 'bg-green-50 border-green-200' :
                  validation.loopAnalysis.loopStrength.includes('weak') ? 'bg-red-50 border-red-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="text-xs font-bold uppercase mb-1 text-gray-600">Loop Assessment</div>
                  <div className="text-sm text-gray-700">{validation.loopAnalysis.loopStrength}</div>
                </div>
              )}
              <ReportButton validationRunId={validationRunId} section="loop" sectionLabel="Core Loop" />
            </div>
          </div>
        )}

        {/* Retention Analysis */}
        {validation.loopAnalysis?.retention && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b-2 border-[#58cc02]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#58cc02] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#58a700]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#58a700] uppercase tracking-wide text-sm">Why Players Return</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Return Reasons */}
              <div className="space-y-2">
                {validation.loopAnalysis.retention.whyComeBackTomorrow && (
                  <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                    <div className="text-xs font-bold text-[#58a700] uppercase mb-1">Tomorrow</div>
                    <div className="text-sm text-gray-700">{validation.loopAnalysis.retention.whyComeBackTomorrow}</div>
                  </div>
                )}
                {validation.loopAnalysis.retention.whyComeBackNextWeek && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <div className="text-xs font-bold text-[#1899d6] uppercase mb-1">Next Week</div>
                    <div className="text-sm text-gray-700">{validation.loopAnalysis.retention.whyComeBackNextWeek}</div>
                  </div>
                )}
              </div>

              {/* Retention Killers */}
              {validation.loopAnalysis.retention.retentionKillers?.length > 0 && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                  <div className="text-xs font-bold text-[#ea2b2b] uppercase mb-2">Retention Killers</div>
                  <ul className="space-y-1">
                    {validation.loopAnalysis.retention.retentionKillers.map((killer, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">x</span>
                        {killer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ReportButton validationRunId={validationRunId} section="retention" sectionLabel="Retention" />
            </div>
          </div>
        )}

        {/* Dealbreakers */}
        {dealbreakers.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#ff4b4b] shadow-[0_4px_0_#ea2b2b] overflow-hidden">
            <div className="bg-[#ffe0e0] px-4 py-3 border-b-2 border-[#ff4b4b] flex items-center gap-2">
              <div className="w-7 h-7 bg-[#ff4b4b] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#ea2b2b]">x</div>
              <span className="font-bold text-[#ea2b2b] uppercase tracking-wide text-sm">Dealbreakers</span>
            </div>
            <div className="p-4 space-y-2">
              {dealbreakers.map((d, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-[#ff4b4b] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">x</span>
                  <span className="text-gray-700">{d}</span>
                </div>
              ))}
              <ReportButton validationRunId={validationRunId} section="dealbreakers" sectionLabel="Dealbreakers" />
            </div>
          </div>
        )}

        {/* Data source */}
        <p className="text-center text-xs text-gray-400 pb-4 mt-4">
          AI-powered analysis of market data, game loops, and competition
        </p>

        </>
        )}
      </div>

      {/* Continue Button - Duolingo Style */}
      {!showPreviewOnly && (
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
      )}
    </div>
  );
}
