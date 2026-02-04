'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw, ChevronRight, Users, Eye, TrendingUp, TrendingDown, Zap, Target, Clock, AlertTriangle, Trophy, Gamepad2, DollarSign, BarChart3 } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/LoadingScreen';
import { ValidationResult } from '@/lib/prompts';
import { checkValidationReadiness, ValidationReadiness } from '@/lib/validationRequirements';
import { Project } from '@/lib/types';

// Import Roblox data
import robloxGenreData from '@/lib/data/robloxGenreData.json';
import robloxBenchmarks from '@/lib/data/robloxBenchmarks.json';

type ValidationState = 'idle' | 'validating' | 'complete' | 'error' | 'incomplete';

// ============================================
// DEV TEST DATA - Bad and Good game examples
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
    conceptParagraph: 'A basic obby game where players jump across platforms to reach checkpoints. Each level gets harder with more obstacles. Players can purchase level skips and speed boosts.',
    coreVerbs: ['Jump', 'Skip'],
    loopHook: 'Complete levels to unlock more levels',
  },
  finalTitle: 'Super Jump Obby 2',
  finalConcept: 'A basic obby game where players jump across platforms. Buy skips to progress faster.',
  gameQuestions: {
    oneSentence: 'Jump on platforms to beat levels',
    genre: 'Obby',
    genreSuccessRate: 'High',
    emotions: ['Satisfaction'],
    targetPlayer: 'Anyone who likes obbies',
    playerGames: ['Tower of Hell', 'Escape Room'],
    pricePoint: 'Free with paid skips',
    priceReason: 'Everyone does it',
    biggestRisk: 'Too many obbies exist',
    notFor: 'People who hate jumping',
    memorableThing: 'Its an obby',
  },
  currentPage: 'validation',
};

const GOOD_GAME_DATA: Partial<Project> = {
  hasIdea: true,
  platform: 'Roblox',
  teamSize: '2–5',
  timeHorizon: '3 months',
  ideaDescription: 'A social horror game where 4 players explore a haunted school at night. One player secretly becomes possessed and must sabotage the others without being caught. Features proximity voice chat, flickering lights, and procedurally generated events. Inspired by DOORS but with social deduction.',
  vibeChips: ['Horror', 'Social', 'Competitive'],
  structuredIdea: {
    title: 'Possessed Academy',
    conceptParagraph: 'A 4-player horror experience set in a procedurally haunted school. Players must complete objectives while one secretly possessed player tries to eliminate others. Proximity voice chat creates tense moments. Streamable highlights include dramatic reveals and close escapes.',
    coreVerbs: ['Survive', 'Deceive', 'Investigate', 'Escape'],
    loopHook: 'Trust no one - anyone could be possessed',
  },
  finalTitle: 'Possessed Academy',
  finalConcept: 'Social deduction meets horror. 4 players, one is possessed. Complete objectives, find the traitor, escape alive. Proximity voice chat for maximum tension.',
  gameQuestions: {
    oneSentence: 'Among Us meets DOORS in a haunted school',
    genre: 'Horror',
    genreSuccessRate: 'High - horror is trending',
    emotions: ['Fear', 'Suspicion', 'Relief', 'Excitement'],
    targetPlayer: 'Friend groups aged 13-18 who love horror streams',
    playerGames: ['DOORS', 'Piggy', 'Murder Mystery 2', 'Among Us'],
    pricePoint: 'Free with cosmetic skins and private servers',
    priceReason: 'Horror players spend on cosmetics that show status',
    biggestRisk: 'Needs 4 players minimum - matchmaking critical',
    notFor: 'Solo players, very young kids',
    memorableThing: 'The moment you realize your friend is possessed',
  },
  currentPage: 'validation',
};

// Global dev helpers type declaration
declare global {
  interface Window {
    devTestBadGame?: () => void;
    devTestGoodGame?: () => void;
    devClearGame?: () => void;
  }
}

// Format visits like Roblox (1.2B, 500M, etc.)
function formatNumber(num: string | number): string {
  if (typeof num === 'string') return num;
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

// Parse percentage from string like "25% (target: 30%+)"
function parsePercentage(str: string | undefined, fallback: number): number {
  if (!str) return fallback;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : fallback;
}

// Roblox-style game card
function GameCard({ name, visits, revenue, rank }: { name: string; visits: string; revenue: string; rank?: number }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 hover:border-[#00A2FF] transition-colors">
      <div className="flex items-start gap-3">
        {rank && (
          <div className="w-8 h-8 bg-gradient-to-br from-[#00A2FF] to-[#0066CC] rounded flex items-center justify-center text-white font-bold text-sm">
            #{rank}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{name}</div>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-[#00FF00]">
              <Eye className="w-3 h-3 inline mr-1" />
              {visits} visits
            </span>
            <span className="text-[#FFD700]">
              <DollarSign className="w-3 h-3 inline" />
              {revenue}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat card with Roblox styling
function StatCard({ label, value, subtext, icon: Icon, variant = 'default' }: { 
  label: string; 
  value: string | number; 
  subtext?: string;
  icon?: any;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variants = {
    default: 'border-[#333] text-white',
    success: 'border-[#00FF00] text-[#00FF00]',
    warning: 'border-[#FFD700] text-[#FFD700]',
    danger: 'border-[#FF4444] text-[#FF4444]',
  };
  
  return (
    <div className={`bg-[#1a1a1a] border ${variants[variant]} rounded-lg p-4`}>
      <div className="flex items-center gap-2 text-[#888] text-xs mb-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className={`text-2xl font-bold ${variant === 'default' ? 'text-white' : variants[variant].split(' ')[1]}`}>
        {value}
      </div>
      {subtext && <div className="text-[#666] text-xs mt-1">{subtext}</div>}
    </div>
  );
}

// Progress bar in Roblox style
function RobloxProgress({ value, max, label, benchmark }: { value: number; max: number; label: string; benchmark?: number }) {
  const percentage = Math.min((value / max) * 100, 100);
  const benchmarkPos = benchmark ? Math.min((benchmark / max) * 100, 100) : null;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#888]">{label}</span>
        <span className="text-white font-mono">{value}%</span>
      </div>
      <div className="relative h-3 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#333]">
        <div 
          className="absolute h-full bg-gradient-to-r from-[#00A2FF] to-[#00FF00] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
        {benchmarkPos && (
          <div 
            className="absolute h-full w-0.5 bg-[#FFD700]"
            style={{ left: `${benchmarkPos}%` }}
            title={`Benchmark: ${benchmark}%`}
          />
        )}
      </div>
    </div>
  );
}

export default function ValidationPage() {
  const router = useRouter();
  const { project, loading, updateProjectAndSave, resetProject } = useProject();
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  const readiness: ValidationReadiness = useMemo(() => {
    return checkValidationReadiness(project);
  }, [project]);

  // Get genre data for comparison
  const genreData = useMemo(() => {
    if (!validation?.genreAnalysis?.detectedGenre) return null;
    const primaryGenre = validation.genreAnalysis.detectedGenre.toLowerCase().replace(/[\s\/]/g, '_');
    const genres = robloxGenreData.genres as Record<string, any>;
    return genres[primaryGenre] || genres['simulator'];
  }, [validation]);

  // Run validation with custom project data
  const runValidationWithData = useCallback(async (projectData: Partial<Project>) => {
    setValidationState('validating');
    setError(null);
    setDevMode(true);

    try {
      // Merge with current project
      const testProject = { ...project, ...projectData };
      
      const response = await fetch('/api/validateIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: testProject }),
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
  }, [project]);

  // Expose dev helpers to window (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.devTestBadGame = () => {
        console.log('%c🎮 DEV: Loading BAD game data...', 'color: #FF4444; font-weight: bold;');
        console.log('%cGame: "Super Jump Obby 2" - Generic obby, solo dev, 6 month scope', 'color: #888;');
        runValidationWithData(BAD_GAME_DATA);
      };

      window.devTestGoodGame = () => {
        console.log('%c🎮 DEV: Loading GOOD game data...', 'color: #00FF00; font-weight: bold;');
        console.log('%cGame: "Possessed Academy" - Horror + social deduction, small team, 3 month scope', 'color: #888;');
        runValidationWithData(GOOD_GAME_DATA);
      };

      window.devClearGame = () => {
        console.log('%c🎮 DEV: Clearing test data...', 'color: #00A2FF; font-weight: bold;');
        setValidation(null);
        setValidationState('idle');
        setDevMode(false);
      };

      // Log available commands
      console.log('%c🎮 Validation Dev Commands Available:', 'color: #00A2FF; font-weight: bold; font-size: 14px;');
      console.log('%c  devTestBadGame()  - Test with a generic obby (should get low scores)', 'color: #FF4444;');
      console.log('%c  devTestGoodGame() - Test with horror social game (should get high scores)', 'color: #00FF00;');
      console.log('%c  devClearGame()    - Clear test data and reset', 'color: #888;');

      return () => {
        delete window.devTestBadGame;
        delete window.devTestGoodGame;
        delete window.devClearGame;
      };
    }
  }, [runValidationWithData]);

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
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="w-full max-w-md text-center space-y-4">
          <Gamepad2 className="w-16 h-16 mx-auto text-[#00A2FF]" />
          <h1 className="text-xl font-bold text-white">AI Validation Disabled</h1>
          <p className="text-[#888] text-sm">Enable AI to analyze your Roblox game idea.</p>
          <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a]" onClick={() => router.push('/skilltree')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Requirements checklist (skip in dev mode)
  if (!devMode && (validationState === 'incomplete' || (validationState === 'idle' && !readiness.isReady))) {
    return (
      <div className="flex-1 overflow-auto bg-[#0a0a0a]">
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <Gamepad2 className="w-12 h-12 mx-auto text-[#00A2FF]" />
            <h1 className="text-xl font-bold text-white">Complete Your Journey First</h1>
            <p className="text-[#888] text-sm">We need more info about your Roblox game to validate it properly.</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-3">
            {readiness.allRequirements.map((req) => (
              <div key={req.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${req.completed ? 'bg-[#00FF00]/20 text-[#00FF00]' : 'bg-[#333] text-[#666]'}`}>
                  {req.completed ? '✓' : '○'}
                </div>
                <div className="flex-1">
                  <div className={`text-sm ${req.completed ? 'text-[#00FF00]' : 'text-white'}`}>{req.label}</div>
                  {!req.completed && <div className="text-xs text-[#666]">{req.description}</div>}
                </div>
              </div>
            ))}
          </div>

          <Button 
            className="w-full bg-[#00A2FF] hover:bg-[#0088DD] text-white"
            onClick={() => router.push('/questions')}
          >
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
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#333] rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-[#00A2FF] border-t-transparent rounded-full animate-spin" />
            <Gamepad2 className="absolute inset-0 m-auto w-8 h-8 text-[#00A2FF]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Analyzing Your Game</h2>
            <p className="text-[#888] text-sm">Comparing against Roblox market data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (validationState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="w-full max-w-md text-center space-y-4">
          <AlertTriangle className="w-16 h-16 mx-auto text-[#FF4444]" />
          <h1 className="text-xl font-bold text-white">Validation Failed</h1>
          <p className="text-[#888] text-sm">{error}</p>
          <Button className="bg-[#00A2FF] hover:bg-[#0088DD] text-white" onClick={runValidation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Results
  if (!validation) return null;

  const verdict = validation.verdict || 'needs_work';
  const verdictConfig = {
    strong: { label: 'HIGH POTENTIAL', color: 'text-[#00FF00]', bg: 'bg-[#00FF00]/10', border: 'border-[#00FF00]', icon: '🚀' },
    promising: { label: 'PROMISING', color: 'text-[#00A2FF]', bg: 'bg-[#00A2FF]/10', border: 'border-[#00A2FF]', icon: '👍' },
    needs_work: { label: 'NEEDS ITERATION', color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]', icon: '⚠️' },
    rethink: { label: 'HIGH RISK', color: 'text-[#FF4444]', bg: 'bg-[#FF4444]/10', border: 'border-[#FF4444]', icon: '🔄' },
  }[verdict];

  const benchmarks = robloxBenchmarks.retention_benchmarks;
  const ccuTargets = robloxBenchmarks.concurrent_users_benchmarks;

  return (
    <div className="flex-1 overflow-auto bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#888] hover:text-white hover:bg-[#1a1a1a]"
            onClick={() => router.push('/skilltree')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#00A2FF]" />
            <span className="font-bold text-sm">ROBLOX VALIDATOR</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#888] hover:text-white hover:bg-[#1a1a1a]"
            onClick={runValidation}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Dev Mode Banner */}
        {devMode && (
          <div className="bg-[#FF00FF]/10 border border-[#FF00FF] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#FF00FF] text-lg">🧪</span>
              <div>
                <div className="text-[#FF00FF] font-bold text-sm">DEV TEST MODE</div>
                <div className="text-[#888] text-xs">Using test data - not your actual project</div>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-[#FF00FF] hover:bg-[#FF00FF]/20"
              onClick={() => {
                setValidation(null);
                setValidationState('idle');
                setDevMode(false);
              }}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Verdict Banner */}
        <div className={`${verdictConfig?.bg} ${verdictConfig?.border} border-2 rounded-xl p-6 text-center`}>
          <div className="text-4xl mb-2">{verdictConfig?.icon}</div>
          <div className={`text-2xl font-black ${verdictConfig?.color}`}>{verdictConfig?.label}</div>
          <div className="text-white/80 mt-2 text-sm max-w-md mx-auto">{validation.summary}</div>
          
          {/* Score Display */}
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="text-3xl font-black text-white">{validation.overallScore || 0}</div>
              <div className="text-[#888] text-xs">OVERALL</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-[#00FF00]">{validation.marketFit?.score || 0}</div>
              <div className="text-[#888] text-xs">MARKET FIT</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-[#00A2FF]">{validation.loopAnalysis?.score || 0}</div>
              <div className="text-[#888] text-xs">ENGAGEMENT</div>
            </div>
          </div>
        </div>

        {/* Platform Stats Banner */}
        <div className="bg-gradient-to-r from-[#00A2FF]/10 to-[#00FF00]/10 border border-[#333] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#00A2FF]" />
            <span className="text-xs font-semibold text-[#888]">ROBLOX PLATFORM (2025)</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">{formatNumber(robloxBenchmarks.platform_stats_2025.daily_active_users)}</div>
              <div className="text-[#888] text-xs">Daily Players</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#00FF00]">${formatNumber(robloxBenchmarks.platform_stats_2025.creator_earnings_annual)}</div>
              <div className="text-[#888] text-xs">Creator Earnings</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#FFD700]">{formatNumber(robloxBenchmarks.platform_stats_2025.total_experiences)}</div>
              <div className="text-[#888] text-xs">Total Games</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#00A2FF]">{robloxBenchmarks.platform_stats_2025.hours_per_day_average}h</div>
              <div className="text-[#888] text-xs">Avg Session</div>
            </div>
          </div>
        </div>

        {/* Genre Analysis with Real Games */}
        {genreData && (
          <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#00A2FF]/20 to-transparent px-4 py-3 border-b border-[#333]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FFD700]" />
                  <span className="font-bold">YOUR COMPETITION</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  genreData.competition_level === 'very_high' || genreData.competition_level === 'extreme' 
                    ? 'bg-[#FF4444]/20 text-[#FF4444]' 
                    : genreData.competition_level === 'high'
                    ? 'bg-[#FFD700]/20 text-[#FFD700]'
                    : 'bg-[#00FF00]/20 text-[#00FF00]'
                }`}>
                  {genreData.competition_level?.toUpperCase().replace('_', ' ')} COMPETITION
                </div>
              </div>
              <div className="text-[#888] text-sm mt-1">{genreData.name} genre • Rank #{genreData.popularity_rank} on Roblox</div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="text-xs text-[#888] mb-2">TOP GAMES IN THIS GENRE:</div>
              {genreData.top_games?.map((game: any, i: number) => (
                <GameCard 
                  key={game.name}
                  name={game.name}
                  visits={game.visits}
                  revenue={game.monthly_revenue_estimate}
                  rank={i + 1}
                />
              ))}
              
              <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                <div className="text-xs text-[#888] mb-2">WHAT MAKES THEM SUCCEED:</div>
                <div className="flex flex-wrap gap-2">
                  {genreData.success_signals?.map((signal: string) => (
                    <span key={signal} className="px-2 py-1 bg-[#00A2FF]/10 text-[#00A2FF] text-xs rounded">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retention Benchmarks */}
        <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00A2FF]" />
            <span className="font-bold">RETENTION TARGETS</span>
            <span className="text-[#888] text-xs ml-auto">Yellow line = target to hit</span>
          </div>
          
          <div className="p-4 space-y-4">
            <RobloxProgress 
              value={parsePercentage(validation.retentionAnalysis?.predictedD1, 25)}
              max={60}
              label="Day 1 Retention (predicted)"
              benchmark={benchmarks.target_for_success.d1_minimum}
            />
            <RobloxProgress 
              value={parsePercentage(validation.retentionAnalysis?.predictedD7, 10)}
              max={30}
              label="Day 7 Retention (predicted)"
              benchmark={benchmarks.target_for_success.d7_minimum}
            />
            {validation.retentionAnalysis?.reasoning && (
              <div className="text-sm text-[#888] bg-[#1a1a1a] rounded-lg p-3 mt-2">
                {validation.retentionAnalysis.reasoning}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
              <div className="bg-[#1a1a1a] rounded p-2">
                <div className="text-[#888]">Top 10%</div>
                <div className="text-white font-semibold">D1: {benchmarks.top_10_percent.d1}%</div>
              </div>
              <div className="bg-[#1a1a1a] rounded p-2">
                <div className="text-[#888]">Median</div>
                <div className="text-white font-semibold">D1: {benchmarks.median.d1}%</div>
              </div>
              <div className="bg-[#1a1a1a] rounded p-2">
                <div className="text-[#888]">Bottom 25%</div>
                <div className="text-white font-semibold">D1: {benchmarks.bottom_25_percent.d1}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* CCU & Revenue Potential */}
        <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00FF00]" />
            <span className="font-bold">CCU & REVENUE POTENTIAL</span>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
              {Object.entries(ccuTargets).map(([tier, data]: [string, any]) => (
                <div key={tier} className={`p-3 rounded-lg border ${
                  tier === 'viable' ? 'bg-[#00A2FF]/10 border-[#00A2FF]' : 'bg-[#1a1a1a] border-[#333]'
                }`}>
                  <div className="text-xs text-[#888] capitalize mb-1">{tier.replace('_', ' ')}</div>
                  <div className="text-lg font-bold text-white">{formatNumber(data.ccu)} CCU</div>
                  <div className="text-xs text-[#00FF00]">{data.monthly_revenue_estimate}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg">
              <div className="text-sm text-white">
                <span className="text-[#00A2FF] font-semibold">Your target:</span> Hit{' '}
                <span className="text-[#00FF00] font-bold">1,000 CCU</span> to make{' '}
                <span className="text-[#FFD700]">$10K-50K/month</span> through DevEx
              </div>
            </div>
          </div>
        </div>

        {/* Monetization */}
        <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#FFD700]" />
            <span className="font-bold">MONETIZATION STRATEGY</span>
          </div>
          
          <div className="p-4 space-y-4">
            {validation.monetizationAnalysis && (
              <div className="text-sm text-[#888]">
                {validation.monetizationAnalysis.reasoning}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {robloxBenchmarks.monetization_benchmarks.monetization_methods.slice(0, 4).map((method: any) => (
                <div key={method.method} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#333]">
                  <div className="font-semibold text-white text-sm">{method.method}</div>
                  <div className="text-xs text-[#888] mt-1">{method.typical_usage}</div>
                  <div className={`text-xs mt-1 ${
                    method.effectiveness.includes('High') ? 'text-[#00FF00]' : 'text-[#888]'
                  }`}>
                    {method.effectiveness}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-[#FFD700]/10 to-transparent rounded-lg p-3 border border-[#FFD700]/30">
              <div className="text-xs text-[#888] mb-1">PAYER CONVERSION BENCHMARKS</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-[#00FF00]">Excellent:</span>
                  <span className="text-white"> {robloxBenchmarks.monetization_benchmarks.payer_conversion.excellent}%</span>
                </div>
                <div>
                  <span className="text-[#00A2FF]">Good:</span>
                  <span className="text-white"> {robloxBenchmarks.monetization_benchmarks.payer_conversion.good}%</span>
                </div>
                <div>
                  <span className="text-[#888]">Average:</span>
                  <span className="text-white"> {robloxBenchmarks.monetization_benchmarks.payer_conversion.average}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Viral Potential */}
        {validation.viralPotential && (
          <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FF00FF]" />
              <span className="font-bold">VIRAL POTENTIAL</span>
              <span className={`ml-auto px-2 py-1 rounded text-xs font-bold ${
                (validation.viralPotential.score || 0) >= 7 ? 'bg-[#00FF00]/20 text-[#00FF00]' :
                (validation.viralPotential.score || 0) >= 5 ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                'bg-[#FF4444]/20 text-[#FF4444]'
              }`}>
                {validation.viralPotential.score}/10
              </span>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="text-sm text-[#888]">{validation.viralPotential.reasoning}</div>
              
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="text-xs text-[#888] mb-2">STREAMER APPEAL</div>
                <div className="text-sm text-white capitalize">{validation.viralPotential.streamerAppeal || 'unknown'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Dealbreakers / Red Flags */}
        {validation.dealbreakers && validation.dealbreakers.length > 0 && (
          <div className="bg-[#111] border border-[#FF4444] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#FF4444]/30 bg-[#FF4444]/10 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF4444]" />
              <span className="font-bold text-[#FF4444]">CRITICAL ISSUES</span>
            </div>
            
            <div className="p-4 space-y-2">
              {validation.dealbreakers.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-[#FF4444]">•</span>
                  <span className="text-[#888]">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {validation.suggestions && validation.suggestions.length > 0 && (
          <div className="bg-[#111] border border-[#00A2FF] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#00A2FF]/30 bg-[#00A2FF]/10 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-[#00A2FF]" />
              <span className="font-bold text-[#00A2FF]">SUGGESTIONS</span>
            </div>
            
            <div className="p-4 space-y-2">
              {validation.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 bg-[#00A2FF] text-black rounded flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-white">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anti-Patterns Warning */}
        <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#888]" />
            <span className="font-bold">ROBLOX ANTI-PATTERNS TO AVOID</span>
          </div>
          
          <div className="p-4 grid gap-2">
            {robloxBenchmarks.anti_patterns.development.slice(0, 3).map((pattern: any) => (
              <div key={pattern.pattern} className="flex items-center justify-between text-sm bg-[#1a1a1a] rounded p-2">
                <span className="text-[#888]">{pattern.pattern}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  pattern.failure_risk === 'Very High' ? 'bg-[#FF4444]/20 text-[#FF4444]' : 'bg-[#FFD700]/20 text-[#FFD700]'
                }`}>
                  {pattern.failure_risk} RISK
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="text-center py-4">
          <div className="text-[#444] text-xs">
            Data from: {(robloxGenreData.meta as any).data_sources.slice(0, 3).join(' • ')}
          </div>
        </div>

        {/* Continue Button */}
        <div className="sticky bottom-4 flex justify-center">
          <Button 
            className="bg-gradient-to-r from-[#00A2FF] to-[#00FF00] hover:from-[#0088DD] hover:to-[#00DD00] text-black font-bold px-8 shadow-lg shadow-[#00A2FF]/20"
            onClick={() => router.push('/finalize')}
          >
            Continue to Game Plan
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
