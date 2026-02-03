'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, Target, Clock, Lightbulb, HelpCircle, TrendingUp, Zap, RefreshCw, AlertOctagon, Flame, Beaker, Users, Gauge, TrendingDown, DollarSign, Tv, ArrowRight, BarChart3, Rocket, AlertCircle, ChevronRight, CircleDot } from 'lucide-react';
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
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300',
    label: 'Strong Concept',
    description: 'Ready to prototype',
  },
  promising: {
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    label: 'Promising',
    description: 'Good foundation, needs work',
  },
  needs_work: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    label: 'Needs Work',
    description: 'Significant issues to address',
  },
  rethink: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    label: 'Rethink',
    description: 'Fundamental problems',
  },
};

const COMPETITOR_LABELS = {
  none: { label: 'Blue Ocean', color: 'text-green-600' },
  few: { label: 'Low Competition', color: 'text-blue-600' },
  moderate: { label: 'Competitive', color: 'text-amber-600' },
  saturated: { label: 'Saturated Market', color: 'text-red-600' },
};

const RETENTION_LABELS = {
  high: { label: 'High Retention', color: 'text-green-600' },
  medium: { label: 'Medium Retention', color: 'text-blue-600' },
  low: { label: 'Low Retention', color: 'text-amber-600' },
  unclear: { label: 'Unclear', color: 'text-muted-foreground' },
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 8) return 'bg-green-500';
    if (s >= 6) return 'bg-blue-500';
    if (s >= 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/10</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

export default function ValidationPage() {
  const router = useRouter();
  const { project, loading, retryLoad } = useProject();
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  // Check validation readiness
  const readiness: ValidationReadiness = useMemo(() => {
    return checkValidationReadiness(project);
  }, [project]);

  useEffect(() => {
    if (project && validationState === 'idle' && aiEnabled) {
      // Only auto-run if ready
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
      // Send the full project for comprehensive validation
      const response = await fetch('/api/validateIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project, // Send full project for journey context
        }),
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
            <p className="text-muted-foreground">Enable AI to get feedback on your game concept.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/skilltree')} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Skill Tree
          </Button>
        </div>
      </div>
    );
  }

  // Show requirements checklist if not ready
  if (validationState === 'incomplete' || (validationState === 'idle' && !readiness.isReady)) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-[600px] mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
            <h1 className="text-2xl font-semibold tracking-tight">Complete Your Journey First</h1>
            <p className="text-muted-foreground">
              To get the most accurate validation, we need more information about your game.
            </p>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Journey Completion</span>
                  <span className="font-medium">{readiness.completionPercentage}%</span>
                </div>
                <Progress value={readiness.completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Required Items */}
          {readiness.requiredMissing.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertOctagon className="h-4 w-4" />
                  Required Before Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {readiness.requiredMissing.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => router.push(req.link)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white border border-red-200 hover:border-red-400 transition-colors text-left"
                  >
                    <CircleDot className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{req.label}</p>
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommended Items */}
          {readiness.recommendedMissing.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <Lightbulb className="h-4 w-4" />
                  Recommended for Better Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {readiness.recommendedMissing.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => router.push(req.link)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors text-left"
                  >
                    <CircleDot className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{req.label}</p>
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Items */}
          {readiness.allRequirements.some(r => r.completed) && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {readiness.allRequirements.filter(r => r.completed).map((req) => (
                  <div key={req.id} className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{req.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            {readiness.isReady ? (
              <Button onClick={() => { setValidationState('idle'); runValidation(); }} size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Run Full Validation
              </Button>
            ) : (
              <Button disabled size="lg" className="gap-2">
                <AlertCircle className="h-5 w-5" />
                Complete Required Items to Validate
              </Button>
            )}
            
            {readiness.isReady && readiness.recommendedMissing.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                You can validate now, but completing recommended items will give better results.
              </p>
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
        <div className="w-full max-w-[500px] space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight">Running Validation</h1>
              <p className="text-muted-foreground mt-1">Analyzing your concept with brutal honesty...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (validationState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] space-y-6">
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
              <p className="text-destructive">{error || 'Failed to validate concept'}</p>
              <Button onClick={runValidation}>
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
        <Button onClick={runValidation} size="lg" className="gap-2">
          <Sparkles className="h-5 w-5" />
          Validate My Concept
        </Button>
      </div>
    );
  }

  // Safe access with fallbacks
  const verdict = validation.verdict && VERDICT_CONFIG[validation.verdict] ? validation.verdict : 'needs_work';
  const verdictConfig = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictConfig.icon;
  const competitorCount = validation.marketFit?.competitorCount;
  const competitorConfig = competitorCount && COMPETITOR_LABELS[competitorCount] 
    ? COMPETITOR_LABELS[competitorCount] 
    : COMPETITOR_LABELS.moderate;
  const retentionPrediction = validation.loopAnalysis?.retentionPrediction;
  const retentionConfig = retentionPrediction && RETENTION_LABELS[retentionPrediction]
    ? RETENTION_LABELS[retentionPrediction]
    : RETENTION_LABELS.unclear;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[900px] mx-auto p-6 space-y-6">
        {/* Header with Overall Score */}
        <div className={`rounded-xl p-6 ${verdictConfig.bg} ${verdictConfig.border} border-2`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full bg-white/50`}>
              <VerdictIcon className={`h-8 w-8 ${verdictConfig.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{verdictConfig.label}</h1>
                <div className={`px-3 py-1 rounded-full text-xl font-bold ${verdictConfig.color} bg-white/70`}>
                  {validation.overallScore ?? '?'}/10
                </div>
              </div>
              <p className="text-muted-foreground mt-1">{verdictConfig.description}</p>
              <p className="mt-3 font-medium">{validation.summary}</p>
            </div>
          </div>
        </div>

        {/* Hard Truth - Most Important */}
        {validation.hardTruth && (
          <Card className="border-2 border-orange-300 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                <Flame className="h-4 w-4" />
                Hard Truth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-orange-900">{validation.hardTruth}</p>
            </CardContent>
          </Card>
        )}

        {/* Dealbreakers */}
        {validation.dealbreakers && validation.dealbreakers.length > 0 && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                <AlertOctagon className="h-4 w-4" />
                Dealbreakers — Must Fix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {validation.dealbreakers.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2 text-red-800">
                    <span className="text-red-600 font-bold">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScoreBar score={validation.marketFit?.score || 0} label="Market Fit" />
            <ScoreBar score={validation.scopeAssessment?.score || 0} label="Scope Feasibility" />
            <ScoreBar score={validation.uniqueness?.score || 0} label="Uniqueness" />
            <ScoreBar score={validation.loopAnalysis?.score || 0} label="Game Loop" />
          </CardContent>
        </Card>

        {/* Detailed Analysis Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Market Fit */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Market Fit
                <span className={`ml-auto text-xs font-medium ${competitorConfig.color}`}>
                  {competitorConfig.label}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{validation.marketFit?.reasoning}</p>
              {validation.marketFit?.targetAudience && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Target Audience:</p>
                  <p className="text-sm font-medium">{validation.marketFit.targetAudience}</p>
                </div>
              )}
              {validation.marketFit?.discoverabilityRisk && (
                <div>
                  <p className="text-xs text-muted-foreground">Discoverability Risk:</p>
                  <p className="text-sm">{validation.marketFit.discoverabilityRisk}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scope */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Scope Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{validation.scopeAssessment?.reasoning}</p>
              {validation.scopeAssessment?.timeEstimate && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Time Estimate:</p>
                  <p className="text-sm font-medium">{validation.scopeAssessment.timeEstimate}</p>
                </div>
              )}
              {validation.scopeAssessment?.biggestRisks && validation.scopeAssessment.biggestRisks.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Biggest Risks:</p>
                  <ul className="text-sm space-y-0.5">
                    {validation.scopeAssessment.biggestRisks.map((risk, i) => (
                      <li key={i} className="text-amber-700">• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.scopeAssessment?.mvpSuggestion && (
                <div className="bg-green-50 p-2 rounded border border-green-200">
                  <p className="text-xs text-green-700 font-medium">MVP Suggestion:</p>
                  <p className="text-sm text-green-800">{validation.scopeAssessment.mvpSuggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uniqueness */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Uniqueness
                {validation.uniqueness?.isGimmickOrCore && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                    validation.uniqueness.isGimmickOrCore === 'core' 
                      ? 'bg-green-100 text-green-700' 
                      : validation.uniqueness.isGimmickOrCore === 'gimmick'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {validation.uniqueness.isGimmickOrCore === 'core' ? 'Core Innovation' : 
                     validation.uniqueness.isGimmickOrCore === 'gimmick' ? 'Gimmick' : 'Unclear'}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{validation.uniqueness?.reasoning}</p>
              {validation.uniqueness?.differentiator && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Key Differentiator:</p>
                  <p className="text-sm font-medium text-purple-700">{validation.uniqueness.differentiator}</p>
                </div>
              )}
              {validation.uniqueness?.similarGames && validation.uniqueness.similarGames.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Similar Games:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {validation.uniqueness.similarGames.map((game, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{game}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loop Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Game Loop
                <span className={`ml-auto text-xs font-medium ${retentionConfig.color}`}>
                  {retentionConfig.label}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{validation.loopAnalysis?.reasoning}</p>
              {validation.loopAnalysis?.sessionLength && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Expected Session:</p>
                  <p className="text-sm font-medium">{validation.loopAnalysis.sessionLength}</p>
                </div>
              )}
              {validation.loopAnalysis?.missingElements && validation.loopAnalysis.missingElements.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Missing Elements:</p>
                  <ul className="text-sm space-y-0.5">
                    {validation.loopAnalysis.missingElements.map((el, i) => (
                      <li key={i} className="text-amber-600">• {el}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Genre Analysis - New Data-Driven Section */}
        {validation.genreAnalysis && (
          <Card className={`border-2 ${validation.genreAnalysis.isGreatConjunction ? 'border-emerald-300 bg-emerald-50' : 'border-purple-200 bg-purple-50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <BarChart3 className="h-4 w-4" />
                Market Data Analysis
                {validation.genreAnalysis.isGreatConjunction && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <Rocket className="h-3 w-3" />
                    Great Conjunction
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Detected Genre</p>
                  <p className="text-sm font-medium">{validation.genreAnalysis.detectedGenre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className={`text-sm font-bold ${
                    parseFloat(validation.genreAnalysis.successRate) >= 5 ? 'text-green-600' :
                    parseFloat(validation.genreAnalysis.successRate) >= 2 ? 'text-blue-600' :
                    parseFloat(validation.genreAnalysis.successRate) >= 1 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {validation.genreAnalysis.successRate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lifecycle Phase</p>
                  <p className={`text-sm font-medium ${
                    ['proto', 'definer', 'variant_window'].includes(validation.genreAnalysis.lifecyclePhase) ? 'text-green-600' :
                    validation.genreAnalysis.lifecyclePhase === 'mature' ? 'text-blue-600' :
                    'text-amber-600'
                  }`}>
                    {validation.genreAnalysis.lifecyclePhase.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className={`text-sm font-medium flex items-center gap-1 ${
                    validation.genreAnalysis.trend.includes('rising') ? 'text-green-600' :
                    validation.genreAnalysis.trend === 'stable' ? 'text-blue-600' :
                    'text-amber-600'
                  }`}>
                    {validation.genreAnalysis.trend.includes('rising') ? <TrendingUp className="h-3 w-3" /> :
                     validation.genreAnalysis.trend.includes('declining') ? <TrendingDown className="h-3 w-3" /> : null}
                    {validation.genreAnalysis.trend.replace('_', ' ')}
                  </p>
                </div>
              </div>
              {validation.genreAnalysis.isGreatConjunction && (
                <div className="bg-emerald-100 p-2 rounded border border-emerald-200 mt-2">
                  <p className="text-xs text-emerald-700 font-medium">🔥 Great Conjunction Active</p>
                  <p className="text-sm text-emerald-800">Player demand exceeds supply in this genre. Window is open for fast movers!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Viral Potential - New Section */}
        {validation.viralPotential && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tv className="h-4 w-4 text-pink-500" />
                Viral Potential
                <span className={`ml-auto text-xs font-medium ${
                  validation.viralPotential.streamerAppeal === 'high' ? 'text-green-600' :
                  validation.viralPotential.streamerAppeal === 'medium' ? 'text-blue-600' :
                  'text-muted-foreground'
                }`}>
                  {validation.viralPotential.streamerAppeal === 'high' ? '🔥 Highly Streamable' :
                   validation.viralPotential.streamerAppeal === 'medium' ? '📺 Moderately Streamable' :
                   '📝 Low Stream Appeal'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScoreBar score={validation.viralPotential.score} label="Viral Score" />
              <p className="text-sm text-muted-foreground">{validation.viralPotential.reasoning}</p>
              {validation.viralPotential.clipWorthiness && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Clip-Worthy Moments:</p>
                  <p className="text-sm">{validation.viralPotential.clipWorthiness}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Analysis - New Section */}
        {validation.pricingAnalysis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Pricing Analysis
                <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                  validation.pricingAnalysis.priceZone === 'impulse' ? 'bg-green-100 text-green-700' :
                  validation.pricingAnalysis.priceZone === 'uncanny_valley' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {validation.pricingAnalysis.priceZone === 'impulse' ? '💰 Impulse Zone' :
                   validation.pricingAnalysis.priceZone === 'uncanny_valley' ? '⚠️ Uncanny Valley' :
                   '💎 Premium Zone'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Suggested Price Range:</p>
                <p className="text-sm font-bold text-green-700">{validation.pricingAnalysis.suggestedRange}</p>
              </div>
              <p className="text-sm text-muted-foreground">{validation.pricingAnalysis.reasoning}</p>
              {validation.pricingAnalysis.priceZone === 'uncanny_valley' && (
                <div className="bg-amber-50 p-2 rounded border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium">⚠️ Price Warning</p>
                  <p className="text-sm text-amber-800">$10-25 is the "uncanny valley" - not cheap enough for impulse buys, not prestigious enough for hype. Consider $3-8 (viral) or $30+ (premium).</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prototype Test */}
        {validation.prototypeTest && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <Beaker className="h-4 w-4" />
                48-Hour Prototype Test
                <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                  validation.prototypeTest.canTestIn48Hours 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {validation.prototypeTest.canTestIn48Hours ? 'Possible' : 'Not Feasible'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-blue-600 font-medium">What to Test:</p>
                <p className="text-sm text-blue-900">{validation.prototypeTest.whatToTest}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Success Metric:</p>
                <p className="text-sm text-blue-900">{validation.prototypeTest.successMetric}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pivot Suggestions - New Section */}
        {validation.pivotSuggestions && validation.pivotSuggestions.length > 0 && validation.overallScore < 7 && (
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                <ArrowRight className="h-4 w-4" />
                Pivot Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-indigo-600 mb-2">Consider these alternatives to improve your odds:</p>
              <ul className="space-y-2">
                {validation.pivotSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm flex gap-2 text-indigo-800">
                    <span className="text-indigo-500 font-bold">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Strengths & Concerns */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {validation.strengths?.map((strength, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-green-500">✓</span>
                    {strength}
                  </li>
                ))}
                {(!validation.strengths || validation.strengths.length === 0) && (
                  <li className="text-sm text-muted-foreground italic">No clear strengths identified</li>
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
              <ul className="space-y-2">
                {validation.concerns?.map((concern, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-amber-500">!</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Actionable Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validation.suggestions?.map((suggestion, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              Questions to Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validation.questions?.map((question, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-blue-500">?</span>
                  {question}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-8">
          <Button onClick={runValidation} variant="outline" className="gap-2">
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
