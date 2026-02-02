'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, Target, Clock, Lightbulb, HelpCircle, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ValidationResult } from '@/lib/prompts';

type ValidationState = 'idle' | 'validating' | 'complete' | 'error';

const VERDICT_CONFIG = {
  strong: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Strong Concept',
    description: 'Ready to prototype!',
  },
  promising: {
    icon: TrendingUp,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Promising',
    description: 'Good foundation, needs refinement',
  },
  needs_work: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Needs Work',
    description: 'Has potential, but significant issues',
  },
  rethink: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Rethink',
    description: 'Fundamental problems to address',
  },
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

  // Auto-validate on page load if we haven't validated yet
  useEffect(() => {
    if (project && validationState === 'idle' && aiEnabled) {
      runValidation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const runValidation = async () => {
    if (!project) return;
    
    setValidationState('validating');
    setError(null);

    try {
      const response = await fetch('/api/validateIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.finalTitle,
          concept: project.finalConcept,
          platform: project.platform,
          teamSize: project.teamSize,
          timeHorizon: project.timeHorizon,
          gameLoop: project.gameLoop,
          vibes: project.vibeChips,
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
    return <LoadingScreen onRetry={retryLoad} message="Loading your concept..." />;
  }

  // If AI is disabled
  if (!aiEnabled) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] space-y-6">
          <div className="text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Validation Disabled</h1>
            <p className="text-muted-foreground">
              Enable AI to get feedback on your game concept.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Game Loop
          </Button>
        </div>
      </div>
    );
  }

  // Validating state
  if (validationState === 'validating') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight">Validating Your Concept</h1>
              <p className="text-muted-foreground mt-1">
                Analyzing market fit, scope, uniqueness, and game loop...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
          <Button variant="outline" onClick={() => router.back()} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Game Loop
          </Button>
        </div>
      </div>
    );
  }

  // Idle state (shouldn't normally see this)
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

  // Results state
  const verdictConfig = VERDICT_CONFIG[validation.verdict];
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[800px] mx-auto p-6 space-y-6">
        {/* Header with Overall Score */}
        <div className={`rounded-xl p-6 ${verdictConfig.bg} ${verdictConfig.border} border-2`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${verdictConfig.bg}`}>
              <VerdictIcon className={`h-8 w-8 ${verdictConfig.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{verdictConfig.label}</h1>
                <div className={`px-3 py-1 rounded-full text-lg font-bold ${verdictConfig.color} ${verdictConfig.bg}`}>
                  {validation.overallScore}/10
                </div>
              </div>
              <p className="text-muted-foreground mt-1">{verdictConfig.description}</p>
              <p className="mt-3">{validation.summary}</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScoreBar score={validation.marketFit.score} label="Market Fit" />
            <ScoreBar score={validation.scopeAssessment.score} label="Scope Feasibility" />
            <ScoreBar score={validation.uniqueness.score} label="Uniqueness" />
            <ScoreBar score={validation.loopAnalysis.score} label="Game Loop" />
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{validation.marketFit.reasoning}</p>
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
            <CardContent>
              <p className="text-sm text-muted-foreground">{validation.scopeAssessment.reasoning}</p>
              {validation.scopeAssessment.timeEstimate && (
                <p className="text-sm font-medium mt-2">
                  Estimated time: {validation.scopeAssessment.timeEstimate}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Uniqueness */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Uniqueness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{validation.uniqueness.reasoning}</p>
              {validation.uniqueness.similarGames.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Similar games:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {validation.uniqueness.similarGames.map((game, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {game}
                      </span>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{validation.loopAnalysis.reasoning}</p>
              {validation.loopAnalysis.missingElements.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Missing elements:</p>
                  <ul className="text-xs mt-1 space-y-0.5">
                    {validation.loopAnalysis.missingElements.map((el, i) => (
                      <li key={i} className="text-amber-600">• {el}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Strengths & Concerns */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {validation.strengths.map((strength, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-green-500">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Concerns */}
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Concerns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {validation.concerns.map((concern, i) => (
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
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validation.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Questions to Consider */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              Questions to Consider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validation.questions.map((question, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-blue-500">?</span>
                  {question}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Game Loop
          </Button>
          <Button variant="outline" onClick={() => router.push('/finalize')} className="gap-2">
            Edit Concept
          </Button>
          <Button onClick={runValidation} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Re-validate
          </Button>
          <Button onClick={() => router.push('/card')} className="gap-2 ml-auto">
            View Concept Card
          </Button>
        </div>
      </div>
    </div>
  );
}
