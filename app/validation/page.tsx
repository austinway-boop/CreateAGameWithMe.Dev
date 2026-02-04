'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, TrendingUp, RefreshCw, Flame, TrendingDown, ArrowRight, ChevronRight, CircleDot, Users, Eye, Star, Zap, Target, Clock } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CardSkeleton } from '@/components/LoadingScreen';
import { ValidationResult } from '@/lib/prompts';
import { checkValidationReadiness, ValidationReadiness } from '@/lib/validationRequirements';

type ValidationState = 'idle' | 'validating' | 'complete' | 'error' | 'incomplete';

// Format large numbers like Roblox does (1.2B, 500M, etc.)
function formatVisits(num: string | number): string {
  if (typeof num === 'string') return num;
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
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
        <div className="w-full max-w-md text-center space-y-4">
          <div className="text-4xl">🎮</div>
          <h1 className="text-xl font-bold">AI Validation Disabled</h1>
          <p className="text-muted-foreground text-sm">Enable AI to analyze your Roblox game idea.</p>
          <Button variant="outline" onClick={() => router.push('/skilltree')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Requirements checklist
  if (validationState === 'incomplete' || (validationState === 'idle' && !readiness.isReady)) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-4xl">📋</div>
            <h1 className="text-xl font-bold">Need More Info</h1>
            <p className="text-sm text-muted-foreground">
              Complete these to get accurate Roblox market analysis
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{readiness.completionPercentage}%</span>
            </div>
            <Progress value={readiness.completionPercentage} className="h-2" />
          </div>

          {readiness.requiredMissing.length > 0 && (
            <div className="space-y-2">
              {readiness.requiredMissing.map((req) => (
                <button
                  key={req.id}
                  onClick={() => router.push(req.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
                >
                  <CircleDot className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium flex-1">{req.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {readiness.recommendedMissing.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Optional but helps</p>
              {readiness.recommendedMissing.map((req) => (
                <button
                  key={req.id}
                  onClick={() => router.push(req.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm flex-1">{req.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          <div className="pt-4 space-y-3">
            {readiness.isReady && (
              <Button onClick={() => { setValidationState('idle'); runValidation(); }} className="w-full">
                Analyze My Game
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/skilltree')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <p className="font-medium">Analyzing your game...</p>
            <p className="text-sm text-muted-foreground">Comparing to top Roblox experiences</p>
          </div>
        </div>
      </div>
    );
  }

  if (validationState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <XCircle className="h-10 w-10 mx-auto text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={runValidation} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Button onClick={runValidation}>Analyze My Roblox Game</Button>
      </div>
    );
  }

  // Main Results
  const score = validation.overallScore ?? 5;
  const verdict = validation.verdict || 'needs_work';
  
  const verdictInfo = {
    strong: { emoji: '🚀', label: 'Looking Good', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    promising: { emoji: '👍', label: 'Has Potential', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    needs_work: { emoji: '⚠️', label: 'Needs Work', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    rethink: { emoji: '🔄', label: 'Rethink This', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  }[verdict];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6 pb-12">
        
        {/* Header */}
        <div className={`rounded-xl p-5 ${verdictInfo.bg} ${verdictInfo.border} border`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{verdictInfo.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-2xl font-bold ${verdictInfo.color}`}>{score}/10</span>
                <span className={`text-lg font-semibold ${verdictInfo.color}`}>{verdictInfo.label}</span>
              </div>
              <p className="mt-2 text-sm">{validation.summary}</p>
            </div>
          </div>
        </div>

        {/* Hard Truth */}
        {validation.hardTruth && (
          <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
            <div className="flex gap-3">
              <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-800 text-sm">Real Talk</p>
                <p className="text-sm text-orange-700 mt-1">{validation.hardTruth}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dealbreakers */}
        {validation.dealbreakers && validation.dealbreakers.length > 0 && (
          <div className="rounded-lg p-4 bg-red-50 border border-red-200">
            <p className="font-semibold text-red-800 text-sm mb-2">🛑 Fix These First</p>
            <ul className="space-y-1">
              {validation.dealbreakers.map((item, i) => (
                <li key={i} className="text-sm text-red-700 flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Genre + Competition */}
        {validation.genreAnalysis && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Genre</p>
                <p className="font-semibold text-lg">{validation.genreAnalysis.detectedGenre}</p>
              </div>
              {validation.genreAnalysis.isHotGenre ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </span>
              ) : validation.genreAnalysis.trend?.includes('declining') ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  <TrendingDown className="h-3 w-3" />
                  Declining
                </span>
              ) : null}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Competition</p>
                <p className="font-medium capitalize">{validation.genreAnalysis.competitionLevel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Phase</p>
                <p className="font-medium capitalize">{validation.genreAnalysis.lifecyclePhase?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Competitor Games */}
            {validation.genreAnalysis.topCompetitors && validation.genreAnalysis.topCompetitors.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">You&apos;re competing with:</p>
                <div className="space-y-1.5">
                  {validation.genreAnalysis.topCompetitors.slice(0, 3).map((game, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{game}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border p-3 text-center">
            <Target className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{validation.marketFit?.score ?? '?'}</p>
            <p className="text-xs text-muted-foreground">Market</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{validation.scopeAssessment?.score ?? '?'}</p>
            <p className="text-xs text-muted-foreground">Scope</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Star className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{validation.uniqueness?.score ?? '?'}</p>
            <p className="text-xs text-muted-foreground">Unique</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Zap className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold">{validation.loopAnalysis?.score ?? '?'}</p>
            <p className="text-xs text-muted-foreground">Loop</p>
          </div>
        </div>

        {/* Retention Prediction */}
        {validation.retentionAnalysis && (
          <div className="rounded-lg border p-4">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Will Players Come Back?
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{validation.retentionAnalysis.predictedD1}</p>
                <p className="text-xs text-muted-foreground">Day 1</p>
                <p className="text-xs text-green-600">need 30%+</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{validation.retentionAnalysis.predictedD7}</p>
                <p className="text-xs text-muted-foreground">Day 7</p>
                <p className="text-xs text-green-600">need 12%+</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{validation.retentionAnalysis.sessionTimePrediction}</p>
                <p className="text-xs text-muted-foreground">Session</p>
                <p className="text-xs text-green-600">need 30m+</p>
              </div>
            </div>
            {validation.retentionAnalysis.reasoning && (
              <p className="text-xs text-muted-foreground mt-3">{validation.retentionAnalysis.reasoning}</p>
            )}
          </div>
        )}

        {/* Viral/Streamer Potential */}
        {validation.viralPotential && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Streamer Appeal
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                validation.viralPotential.streamerAppeal === 'high' ? 'bg-green-100 text-green-700' :
                validation.viralPotential.streamerAppeal === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {validation.viralPotential.streamerAppeal}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{validation.viralPotential.reasoning}</p>
            {validation.viralPotential.socialFeatures && (
              <p className="text-sm mt-2"><strong>Social:</strong> {validation.viralPotential.socialFeatures}</p>
            )}
          </div>
        )}

        {/* Monetization */}
        {validation.monetizationAnalysis && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">💰 Robux Potential</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                validation.monetizationAnalysis.potentialLevel === 'excellent' ? 'bg-green-100 text-green-700' :
                validation.monetizationAnalysis.potentialLevel === 'good' ? 'bg-blue-100 text-blue-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {validation.monetizationAnalysis.potentialLevel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{validation.monetizationAnalysis.reasoning}</p>
            {validation.monetizationAnalysis.suggestedMethods && validation.monetizationAnalysis.suggestedMethods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {validation.monetizationAnalysis.suggestedMethods.map((method, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-muted">{method}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* What to Build First */}
        {validation.prototypeTest && (
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
            <p className="font-semibold text-blue-800 text-sm mb-2">🎯 Test This First</p>
            <p className="text-sm text-blue-700">{validation.prototypeTest.whatToTest}</p>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Success =</strong> {validation.prototypeTest.successMetric}
            </p>
          </div>
        )}

        {/* Pivots */}
        {validation.pivotSuggestions && validation.pivotSuggestions.length > 0 && score < 7 && (
          <div className="rounded-lg border p-4">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Consider Instead
            </p>
            <ul className="space-y-2">
              {validation.pivotSuggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="font-medium text-foreground">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths & Concerns */}
        <div className="grid md:grid-cols-2 gap-4">
          {validation.strengths && validation.strengths.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-green-800 text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </p>
              <ul className="space-y-1">
                {validation.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.concerns && validation.concerns.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Watch Out
              </p>
              <ul className="space-y-1">
                {validation.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-amber-700">• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Next Steps */}
        {validation.suggestions && validation.suggestions.length > 0 && (
          <div className="rounded-lg border p-4">
            <p className="font-semibold text-sm mb-2">📝 Next Steps</p>
            <ol className="space-y-1.5">
              {validation.suggestions.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="font-medium text-primary">{i + 1}.</span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Questions */}
        {validation.questions && validation.questions.length > 0 && (
          <div className="rounded-lg border p-4">
            <p className="font-semibold text-sm mb-2">❓ Answer These</p>
            <ul className="space-y-1.5">
              {validation.questions.map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={runValidation} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-analyze
          </Button>
          <Button onClick={() => router.push('/card')} className="ml-auto">
            View Concept Card
          </Button>
        </div>
      </div>
    </div>
  );
}
