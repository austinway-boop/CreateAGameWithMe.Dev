'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, Target, Clock, Lightbulb, HelpCircle, TrendingUp, Zap, RefreshCw, AlertOctagon, Flame, Users, TrendingDown, ArrowRight, ChevronRight, CircleDot, Play, Eye, DollarSign, Timer, BarChart2 } from 'lucide-react';
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
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Ready to Build',
    tagline: 'This has real potential on Roblox',
  },
  promising: {
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Worth Prototyping',
    tagline: 'Good foundation, address the gaps',
  },
  needs_work: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Needs Iteration',
    tagline: 'Rethink before building',
  },
  rethink: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Major Pivot Needed',
    tagline: 'Fundamental issues to address',
  },
};

function ScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 8) return { stroke: '#10b981', bg: 'bg-emerald-100' };
    if (s >= 6) return { stroke: '#3b82f6', bg: 'bg-blue-100' };
    if (s >= 4) return { stroke: '#f59e0b', bg: 'bg-amber-100' };
    return { stroke: '#ef4444', bg: 'bg-red-100' };
  };
  
  const sizeMap = { sm: 48, md: 64, lg: 80 };
  const strokeMap = { sm: 4, md: 5, lg: 6 };
  const fontMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
  
  const diameter = sizeMap[size];
  const strokeWidth = strokeMap[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const colors = getColor(score);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={diameter} height={diameter} className="-rotate-90">
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className={`absolute ${fontMap[size]} font-bold`}>{score}</span>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = 'text-muted-foreground' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

function CompetitorChip({ name, visits }: { name: string; visits?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs">
      <span className="font-medium">{name}</span>
      {visits && <span className="text-muted-foreground">({visits})</span>}
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
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] space-y-6">
          <div className="text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Validation Disabled</h1>
            <p className="text-muted-foreground">Enable AI to get feedback on your Roblox game concept.</p>
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
      <div className="flex-1 overflow-auto">
        <div className="max-w-[600px] mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
            <h1 className="text-xl font-semibold">Complete Your Concept First</h1>
            <p className="text-sm text-muted-foreground">
              We need more details to give you accurate Roblox market validation.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{readiness.completionPercentage}%</span>
                </div>
                <Progress value={readiness.completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {readiness.requiredMissing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Required</p>
              {readiness.requiredMissing.map((req) => (
                <button
                  key={req.id}
                  onClick={() => router.push(req.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors text-left"
                >
                  <CircleDot className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{req.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {readiness.recommendedMissing.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-600">Recommended</p>
              {readiness.recommendedMissing.map((req) => (
                <button
                  key={req.id}
                  onClick={() => router.push(req.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left"
                >
                  <CircleDot className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{req.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {readiness.isReady ? (
              <Button onClick={() => { setValidationState('idle'); runValidation(); }} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Run Validation
              </Button>
            ) : (
              <Button disabled className="gap-2">
                Complete Required Items First
              </Button>
            )}
            
            <Button variant="outline" onClick={() => router.push('/skilltree')} className="gap-2">
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
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div>
            <h1 className="text-lg font-semibold">Analyzing Your Roblox Game</h1>
            <p className="text-sm text-muted-foreground mt-1">Checking against current market data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (validationState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] space-y-4">
          <Card className="border-red-200">
            <CardContent className="pt-6 text-center space-y-4">
              <XCircle className="h-8 w-8 mx-auto text-red-500" />
              <p className="text-sm text-red-600">{error || 'Failed to validate'}</p>
              <Button onClick={runValidation} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Button onClick={runValidation} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Validate My Roblox Game
        </Button>
      </div>
    );
  }

  // Results UI
  const verdict = validation.verdict && VERDICT_CONFIG[validation.verdict] ? validation.verdict : 'needs_work';
  const verdictConfig = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[800px] mx-auto p-6 space-y-6 pb-12">
        
        {/* Hero Section - Verdict */}
        <div className={`rounded-xl p-6 ${verdictConfig.bg} ${verdictConfig.border} border`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <ScoreRing score={validation.overallScore ?? 5} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <VerdictIcon className={`h-5 w-5 ${verdictConfig.color}`} />
                <h1 className="text-xl font-bold">{verdictConfig.label}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{verdictConfig.tagline}</p>
              <p className="mt-3 text-sm">{validation.summary}</p>
            </div>
          </div>
        </div>

        {/* Hard Truth */}
        {validation.hardTruth && (
          <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
            <div className="flex gap-3">
              <Flame className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">The Hard Truth</p>
                <p className="text-sm text-orange-700 mt-1">{validation.hardTruth}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dealbreakers */}
        {validation.dealbreakers && validation.dealbreakers.length > 0 && (
          <div className="rounded-lg p-4 bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-800 mb-2">Must Fix Before Building</p>
            <ul className="space-y-1.5">
              {validation.dealbreakers.map((item, i) => (
                <li key={i} className="text-sm text-red-700 flex gap-2">
                  <span className="text-red-500">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            icon={Target}
            label="Market Fit"
            value={`${validation.marketFit?.score ?? '?'}/10`}
            color={validation.marketFit?.score >= 7 ? 'text-emerald-600' : validation.marketFit?.score >= 5 ? 'text-blue-600' : 'text-amber-600'}
          />
          <MetricCard
            icon={Clock}
            label="Scope"
            value={`${validation.scopeAssessment?.score ?? '?'}/10`}
            color={validation.scopeAssessment?.score >= 7 ? 'text-emerald-600' : validation.scopeAssessment?.score >= 5 ? 'text-blue-600' : 'text-amber-600'}
          />
          <MetricCard
            icon={Sparkles}
            label="Uniqueness"
            value={`${validation.uniqueness?.score ?? '?'}/10`}
            color={validation.uniqueness?.score >= 7 ? 'text-emerald-600' : validation.uniqueness?.score >= 5 ? 'text-blue-600' : 'text-amber-600'}
          />
          <MetricCard
            icon={Zap}
            label="Game Loop"
            value={`${validation.loopAnalysis?.score ?? '?'}/10`}
            color={validation.loopAnalysis?.score >= 7 ? 'text-emerald-600' : validation.loopAnalysis?.score >= 5 ? 'text-blue-600' : 'text-amber-600'}
          />
        </div>

        {/* Genre & Competition - Simplified */}
        {validation.genreAnalysis && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Genre</p>
                  <p className="font-semibold">{validation.genreAnalysis.detectedGenre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {validation.genreAnalysis.isHotGenre ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        <TrendingUp className="h-3 w-3" />
                        Hot Genre
                      </span>
                    ) : validation.genreAnalysis.trend?.includes('rising') ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <TrendingUp className="h-3 w-3" />
                        Rising
                      </span>
                    ) : validation.genreAnalysis.trend?.includes('declining') ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        <TrendingDown className="h-3 w-3" />
                        Declining
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Stable</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {validation.genreAnalysis.competitionLevel} competition
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phase</p>
                  <p className="text-sm font-medium capitalize">
                    {validation.genreAnalysis.lifecyclePhase?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              {validation.genreAnalysis.topCompetitors && validation.genreAnalysis.topCompetitors.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Top Competitors</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.genreAnalysis.topCompetitors.map((game, i) => (
                      <CompetitorChip key={i} name={game} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Retention & Engagement Predictions */}
        {validation.retentionAnalysis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-500" />
                Predicted Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Day 1</p>
                  <p className="text-lg font-bold">{validation.retentionAnalysis.predictedD1}</p>
                  <p className="text-xs text-muted-foreground">Target: 30%+</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Day 7</p>
                  <p className="text-lg font-bold">{validation.retentionAnalysis.predictedD7}</p>
                  <p className="text-xs text-muted-foreground">Target: 12%+</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Session</p>
                  <p className="text-lg font-bold">{validation.retentionAnalysis.sessionTimePrediction}</p>
                  <p className="text-xs text-muted-foreground">Target: 30m+</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{validation.retentionAnalysis.reasoning}</p>
            </CardContent>
          </Card>
        )}

        {/* Two Column: Market Fit & Scope */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Market Fit
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  validation.marketFit?.competitorCount === 'none' ? 'bg-emerald-100 text-emerald-700' :
                  validation.marketFit?.competitorCount === 'few' ? 'bg-blue-100 text-blue-700' :
                  validation.marketFit?.competitorCount === 'moderate' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {validation.marketFit?.competitorCount === 'none' ? 'Open Market' :
                   validation.marketFit?.competitorCount === 'few' ? 'Low Competition' :
                   validation.marketFit?.competitorCount === 'moderate' ? 'Competitive' :
                   'Saturated'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{validation.marketFit?.reasoning}</p>
              {validation.marketFit?.targetAudience && (
                <div>
                  <p className="text-xs font-medium">Target Players</p>
                  <p className="text-muted-foreground">{validation.marketFit.targetAudience}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Scope Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{validation.scopeAssessment?.reasoning}</p>
              {validation.scopeAssessment?.timeEstimate && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{validation.scopeAssessment.timeEstimate}</span>
                </div>
              )}
              {validation.scopeAssessment?.mvpSuggestion && (
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-800">MVP Suggestion</p>
                  <p className="text-xs text-emerald-700">{validation.scopeAssessment.mvpSuggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Viral & Social */}
        {validation.viralPotential && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="h-4 w-4 text-pink-500" />
                Viral & Social Potential
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  validation.viralPotential.streamerAppeal === 'high' ? 'bg-emerald-100 text-emerald-700' :
                  validation.viralPotential.streamerAppeal === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {validation.viralPotential.streamerAppeal === 'high' ? 'Highly Streamable' :
                   validation.viralPotential.streamerAppeal === 'medium' ? 'Moderately Streamable' :
                   'Low Stream Appeal'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{validation.viralPotential.reasoning}</p>
              {validation.viralPotential.socialFeatures && (
                <div>
                  <p className="text-xs font-medium">Social Features</p>
                  <p className="text-muted-foreground">{validation.viralPotential.socialFeatures}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monetization */}
        {validation.monetizationAnalysis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Monetization
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  validation.monetizationAnalysis.potentialLevel === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                  validation.monetizationAnalysis.potentialLevel === 'good' ? 'bg-blue-100 text-blue-700' :
                  validation.monetizationAnalysis.potentialLevel === 'moderate' ? 'bg-amber-100 text-amber-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {validation.monetizationAnalysis.potentialLevel} potential
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{validation.monetizationAnalysis.reasoning}</p>
              {validation.monetizationAnalysis.suggestedMethods && validation.monetizationAnalysis.suggestedMethods.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {validation.monetizationAnalysis.suggestedMethods.map((method, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-muted">{method}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prototype Test */}
        {validation.prototypeTest && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                <Eye className="h-4 w-4" />
                Quick Test Plan
                {validation.prototypeTest.canTestIn48Hours && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                    Testable in 48 hours
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <p className="text-xs font-medium text-blue-800">What to Test</p>
                <p className="text-blue-700">{validation.prototypeTest.whatToTest}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-800">Success Looks Like</p>
                <p className="text-blue-700">{validation.prototypeTest.successMetric}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pivot Suggestions */}
        {validation.pivotSuggestions && validation.pivotSuggestions.length > 0 && validation.overallScore < 7 && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-800">
                <ArrowRight className="h-4 w-4" />
                Consider These Pivots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {validation.pivotSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-indigo-700 flex gap-2">
                    <span className="text-indigo-400">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Strengths & Concerns - Simplified */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {validation.strengths?.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    {s}
                  </li>
                ))}
                {(!validation.strengths || validation.strengths.length === 0) && (
                  <li className="text-sm text-muted-foreground italic">None identified</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Concerns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {validation.concerns?.map((c, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-amber-500">!</span>
                    {c}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions & Questions - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {validation.suggestions?.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {validation.questions && validation.questions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-500" />
                Questions to Consider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {validation.questions.map((q, i) => (
                  <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                    <span className="text-blue-500">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={runValidation} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Re-validate
          </Button>
          <Button onClick={() => router.push('/card')} className="gap-2 sm:ml-auto">
            View Concept Card
          </Button>
        </div>
      </div>
    </div>
  );
}
