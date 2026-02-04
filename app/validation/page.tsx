'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, Target, Clock, Lightbulb, HelpCircle, TrendingUp, Zap, RefreshCw, Flame, Users, TrendingDown, ArrowRight, ChevronRight, CircleDot, Play, Eye, DollarSign, Timer, BarChart2, Gamepad2, Trophy, Star } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CardSkeleton } from '@/components/LoadingScreen';
import { ValidationResult } from '@/lib/prompts';
import { checkValidationReadiness, ValidationReadiness } from '@/lib/validationRequirements';

type ValidationState = 'idle' | 'validating' | 'complete' | 'error' | 'incomplete';

const VERDICT_CONFIG = {
  strong: {
    icon: Trophy,
    color: 'text-emerald-400',
    bg: 'bg-gradient-to-br from-emerald-900/50 to-emerald-800/30',
    border: 'border-emerald-500/50',
    glow: 'shadow-emerald-500/20',
    label: 'Ready to Publish',
    tagline: 'Your experience has real potential',
  },
  promising: {
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-gradient-to-br from-blue-900/50 to-blue-800/30',
    border: 'border-blue-500/50',
    glow: 'shadow-blue-500/20',
    label: 'Worth Building',
    tagline: 'Good foundation, address the gaps',
  },
  needs_work: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-gradient-to-br from-amber-900/50 to-amber-800/30',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/20',
    label: 'Needs Work',
    tagline: 'Iterate on design before building',
  },
  rethink: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-gradient-to-br from-red-900/50 to-red-800/30',
    border: 'border-red-500/50',
    glow: 'shadow-red-500/20',
    label: 'Major Changes Needed',
    tagline: 'Fundamental issues to address',
  },
};

// Roblox-themed score display
function RobloxScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 8) return { ring: 'ring-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' };
    if (s >= 6) return { ring: 'ring-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/50' };
    if (s >= 4) return { ring: 'ring-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50' };
    return { ring: 'ring-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' };
  };
  
  const sizeMap = { sm: 'w-12 h-12 text-lg', md: 'w-16 h-16 text-2xl', lg: 'w-20 h-20 text-3xl' };
  const colors = getColor(score);
  
  return (
    <div className={`${sizeMap[size]} rounded-xl bg-zinc-900 ring-4 ${colors.ring} ${colors.glow} shadow-lg flex items-center justify-center`}>
      <span className={`font-black ${colors.text}`}>{score}</span>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  target,
  icon: Icon,
}: { 
  label: string; 
  value: string;
  target?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-zinc-500" />}
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      {target && <p className="text-xs text-zinc-600">Target: {target}</p>}
    </div>
  );
}

function GameChip({ name, stat }: { name: string; stat?: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
      <Gamepad2 className="h-3.5 w-3.5 text-red-400" />
      <span className="text-sm font-medium text-white">{name}</span>
      {stat && <span className="text-xs text-zinc-500">{stat}</span>}
    </div>
  );
}

function SectionCard({ 
  title, 
  icon: Icon, 
  iconColor = 'text-red-400',
  badge,
  badgeColor = 'bg-zinc-800 text-zinc-300',
  children 
}: { 
  title: string; 
  icon: React.ElementType;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        {children}
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

  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  const readiness: ValidationReadiness = useMemo(() => {
    return checkValidationReadiness(project);
  }, [project]);

  useEffect(() => {
    if (project && validationState === 'idle' && aiEnabled) {
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
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
        <div className="w-full max-w-[500px] space-y-6">
          <div className="text-center space-y-4">
            <Gamepad2 className="h-12 w-12 mx-auto text-red-400" />
            <h1 className="text-2xl font-bold text-white">AI Validation Disabled</h1>
            <p className="text-zinc-400">Enable AI to get market analysis for your Roblox experience.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/skilltree')} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Skill Tree
          </Button>
        </div>
      </div>
    );
  }

  // Requirements checklist
  if (validationState === 'incomplete' || (validationState === 'idle' && !readiness.isReady)) {
    return (
      <div className="flex-1 overflow-auto bg-zinc-950">
        <div className="max-w-[600px] mx-auto p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/25">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Complete Your Experience</h1>
            <p className="text-sm text-zinc-400">
              We need more details to analyze your Roblox game against market data.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Progress</span>
              <span className="font-bold text-white">{readiness.completionPercentage}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                style={{ width: `${readiness.completionPercentage}%` }}
              />
            </div>
          </div>

          {readiness.requiredMissing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <CircleDot className="h-4 w-4" />
                Required
              </p>
              {readiness.requiredMissing.map((req) => (
                <button
                  key={req.id}
                  onClick={() => router.push(req.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{req.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-400" />
                </button>
              ))}
            </div>
          )}

          {readiness.recommendedMissing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Recommended
              </p>
              {readiness.recommendedMissing.map((req) => (
                <button
                  key={req.id}
                  onClick={() => router.push(req.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{req.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-amber-400" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {readiness.isReady ? (
              <Button 
                onClick={() => { setValidationState('idle'); runValidation(); }} 
                className="gap-2 bg-red-500 hover:bg-red-600 text-white"
              >
                <Sparkles className="h-4 w-4" />
                Run Market Analysis
              </Button>
            ) : (
              <Button disabled className="gap-2 bg-zinc-800 text-zinc-500">
                Complete Required Items First
              </Button>
            )}
            
            <Button variant="outline" onClick={() => router.push('/skilltree')} className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Skill Tree
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (validationState === 'validating') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/25 animate-pulse">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Analyzing Your Experience</h1>
            <p className="text-sm text-zinc-400 mt-1">Checking Roblox market data...</p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-red-400 mx-auto" />
        </div>
      </div>
    );
  }

  if (validationState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
        <div className="w-full max-w-[400px] space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-4">
            <XCircle className="h-8 w-8 mx-auto text-red-400" />
            <p className="text-sm text-red-300">{error || 'Failed to validate'}</p>
            <Button onClick={runValidation} variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
        <Button onClick={runValidation} className="gap-2 bg-red-500 hover:bg-red-600 text-white">
          <Sparkles className="h-4 w-4" />
          Analyze My Roblox Experience
        </Button>
      </div>
    );
  }

  // Results UI
  const verdict = validation.verdict && VERDICT_CONFIG[validation.verdict] ? validation.verdict : 'needs_work';
  const verdictConfig = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="flex-1 overflow-auto bg-zinc-950">
      <div className="max-w-[850px] mx-auto p-6 space-y-5 pb-12">
        
        {/* Roblox Header */}
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Gamepad2 className="h-4 w-4 text-red-400" />
          <span>Roblox Market Analysis</span>
        </div>

        {/* Hero Verdict Card */}
        <div className={`rounded-2xl p-6 ${verdictConfig.bg} ${verdictConfig.border} border shadow-xl ${verdictConfig.glow}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <RobloxScore score={validation.overallScore ?? 5} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <VerdictIcon className={`h-5 w-5 ${verdictConfig.color}`} />
                <h1 className="text-xl font-black text-white">{verdictConfig.label}</h1>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">{verdictConfig.tagline}</p>
              <p className="mt-3 text-sm text-zinc-300">{validation.summary}</p>
            </div>
          </div>
        </div>

        {/* Hard Truth */}
        {validation.hardTruth && (
          <div className="rounded-xl p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <div className="flex gap-3">
              <Flame className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-300">The Hard Truth</p>
                <p className="text-sm text-orange-200/80 mt-1">{validation.hardTruth}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dealbreakers */}
        {validation.dealbreakers && validation.dealbreakers.length > 0 && (
          <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
            <p className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Must Fix Before Publishing
            </p>
            <ul className="space-y-1.5">
              {validation.dealbreakers.map((item, i) => (
                <li key={i} className="text-sm text-red-300/80 flex gap-2">
                  <span className="text-red-500">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            icon={Target}
            label="Market Fit"
            value={`${validation.marketFit?.score ?? '?'}/10`}
          />
          <StatBox
            icon={Clock}
            label="Scope"
            value={`${validation.scopeAssessment?.score ?? '?'}/10`}
          />
          <StatBox
            icon={Sparkles}
            label="Uniqueness"
            value={`${validation.uniqueness?.score ?? '?'}/10`}
          />
          <StatBox
            icon={Zap}
            label="Game Loop"
            value={`${validation.loopAnalysis?.score ?? '?'}/10`}
          />
        </div>

        {/* Genre & Competition */}
        {validation.genreAnalysis && (
          <SectionCard 
            title="Genre Analysis" 
            icon={Gamepad2}
            badge={validation.genreAnalysis.isHotGenre ? 'Hot Genre' : validation.genreAnalysis.trend}
            badgeColor={validation.genreAnalysis.isHotGenre ? 'bg-emerald-500/20 text-emerald-400' : 
                       validation.genreAnalysis.trend?.includes('rising') ? 'bg-blue-500/20 text-blue-400' :
                       validation.genreAnalysis.trend?.includes('declining') ? 'bg-amber-500/20 text-amber-400' :
                       'bg-zinc-800 text-zinc-400'}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-white">{validation.genreAnalysis.detectedGenre}</p>
                  <p className="text-xs text-zinc-500 capitalize">{validation.genreAnalysis.competitionLevel} competition • {validation.genreAnalysis.lifecyclePhase?.replace('_', ' ')} phase</p>
                </div>
                {validation.genreAnalysis.isHotGenre && (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-semibold">Trending</span>
                  </div>
                )}
              </div>
              
              {validation.genreAnalysis.topCompetitors && validation.genreAnalysis.topCompetitors.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Top Competitors on Roblox</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.genreAnalysis.topCompetitors.map((game, i) => (
                      <GameChip key={i} name={game} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Retention Predictions */}
        {validation.retentionAnalysis && (
          <SectionCard title="Predicted Retention" icon={BarChart2} iconColor="text-blue-400">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <StatBox label="Day 1" value={validation.retentionAnalysis.predictedD1} target="30%+" />
              <StatBox label="Day 7" value={validation.retentionAnalysis.predictedD7} target="12%+" />
              <StatBox label="Session" value={validation.retentionAnalysis.sessionTimePrediction} target="30m+" />
            </div>
            <p className="text-xs text-zinc-500">{validation.retentionAnalysis.reasoning}</p>
          </SectionCard>
        )}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Market Fit */}
          <SectionCard 
            title="Market Fit" 
            icon={Target} 
            iconColor="text-blue-400"
            badge={
              validation.marketFit?.competitorCount === 'none' ? 'Blue Ocean' :
              validation.marketFit?.competitorCount === 'few' ? 'Low Competition' :
              validation.marketFit?.competitorCount === 'moderate' ? 'Competitive' :
              'Saturated'
            }
            badgeColor={
              validation.marketFit?.competitorCount === 'none' ? 'bg-emerald-500/20 text-emerald-400' :
              validation.marketFit?.competitorCount === 'few' ? 'bg-blue-500/20 text-blue-400' :
              validation.marketFit?.competitorCount === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }
          >
            <p className="text-sm text-zinc-400 mb-3">{validation.marketFit?.reasoning}</p>
            {validation.marketFit?.targetAudience && (
              <div className="bg-zinc-800/50 rounded-lg p-2">
                <p className="text-xs text-zinc-500">Target Players</p>
                <p className="text-sm text-zinc-300">{validation.marketFit.targetAudience}</p>
              </div>
            )}
          </SectionCard>

          {/* Scope */}
          <SectionCard title="Scope Check" icon={Clock} iconColor="text-amber-400">
            <p className="text-sm text-zinc-400 mb-3">{validation.scopeAssessment?.reasoning}</p>
            {validation.scopeAssessment?.timeEstimate && (
              <div className="flex items-center gap-2 mb-3">
                <Timer className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-semibold text-white">{validation.scopeAssessment.timeEstimate}</span>
              </div>
            )}
            {validation.scopeAssessment?.mvpSuggestion && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                <p className="text-xs font-semibold text-emerald-400">MVP Suggestion</p>
                <p className="text-xs text-emerald-300/80">{validation.scopeAssessment.mvpSuggestion}</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Viral & Social */}
        {validation.viralPotential && (
          <SectionCard 
            title="Viral Potential" 
            icon={Play} 
            iconColor="text-pink-400"
            badge={
              validation.viralPotential.streamerAppeal === 'high' ? 'Highly Streamable' :
              validation.viralPotential.streamerAppeal === 'medium' ? 'Streamable' :
              'Low Stream Appeal'
            }
            badgeColor={
              validation.viralPotential.streamerAppeal === 'high' ? 'bg-pink-500/20 text-pink-400' :
              validation.viralPotential.streamerAppeal === 'medium' ? 'bg-blue-500/20 text-blue-400' :
              'bg-zinc-800 text-zinc-500'
            }
          >
            <p className="text-sm text-zinc-400 mb-2">{validation.viralPotential.reasoning}</p>
            {validation.viralPotential.socialFeatures && (
              <div className="bg-zinc-800/50 rounded-lg p-2">
                <p className="text-xs text-zinc-500">Social Features</p>
                <p className="text-sm text-zinc-300">{validation.viralPotential.socialFeatures}</p>
              </div>
            )}
          </SectionCard>
        )}

        {/* Monetization */}
        {validation.monetizationAnalysis && (
          <SectionCard 
            title="Monetization" 
            icon={DollarSign} 
            iconColor="text-green-400"
            badge={`${validation.monetizationAnalysis.potentialLevel} potential`}
            badgeColor={
              validation.monetizationAnalysis.potentialLevel === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
              validation.monetizationAnalysis.potentialLevel === 'good' ? 'bg-blue-500/20 text-blue-400' :
              validation.monetizationAnalysis.potentialLevel === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
              'bg-zinc-800 text-zinc-500'
            }
          >
            <p className="text-sm text-zinc-400 mb-3">{validation.monetizationAnalysis.reasoning}</p>
            {validation.monetizationAnalysis.suggestedMethods && validation.monetizationAnalysis.suggestedMethods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {validation.monetizationAnalysis.suggestedMethods.map((method, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400">{method}</span>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* Quick Test Plan */}
        {validation.prototypeTest && (
          <div className="rounded-xl p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Quick Test Plan</h3>
              </div>
              {validation.prototypeTest.canTestIn48Hours && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Testable in 48 hours
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-400">What to Test</p>
                <p className="text-sm text-blue-200/80">{validation.prototypeTest.whatToTest}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-400">Success Metric</p>
                <p className="text-sm text-blue-200/80">{validation.prototypeTest.successMetric}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pivot Suggestions */}
        {validation.pivotSuggestions && validation.pivotSuggestions.length > 0 && validation.overallScore < 7 && (
          <SectionCard title="Consider These Pivots" icon={ArrowRight} iconColor="text-indigo-400">
            <ul className="space-y-2">
              {validation.pivotSuggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-zinc-400 flex gap-2">
                  <span className="text-indigo-400 font-bold">{i + 1}.</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Strengths & Concerns */}
        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard title="Strengths" icon={CheckCircle2} iconColor="text-emerald-400">
            <ul className="space-y-1.5">
              {validation.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-zinc-400 flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  {s}
                </li>
              ))}
              {(!validation.strengths || validation.strengths.length === 0) && (
                <li className="text-sm text-zinc-600 italic">None identified</li>
              )}
            </ul>
          </SectionCard>

          <SectionCard title="Concerns" icon={AlertTriangle} iconColor="text-amber-400">
            <ul className="space-y-1.5">
              {validation.concerns?.map((c, i) => (
                <li key={i} className="text-sm text-zinc-400 flex gap-2">
                  <span className="text-amber-400">!</span>
                  {c}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Next Steps */}
        <SectionCard title="Next Steps" icon={Lightbulb} iconColor="text-amber-400">
          <ul className="space-y-1.5">
            {validation.suggestions?.map((s, i) => (
              <li key={i} className="text-sm text-zinc-400 flex gap-2">
                <span className="text-red-400 font-bold">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Questions */}
        {validation.questions && validation.questions.length > 0 && (
          <SectionCard title="Questions to Answer" icon={HelpCircle} iconColor="text-blue-400">
            <ul className="space-y-1.5">
              {validation.questions.map((q, i) => (
                <li key={i} className="text-sm text-zinc-500 flex gap-2">
                  <span className="text-blue-400">?</span>
                  {q}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={runValidation} 
            variant="outline" 
            size="sm" 
            className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            Re-analyze
          </Button>
          <Button 
            onClick={() => router.push('/card')} 
            className="gap-2 sm:ml-auto bg-red-500 hover:bg-red-600 text-white"
          >
            View Concept Card
          </Button>
        </div>
      </div>
    </div>
  );
}
