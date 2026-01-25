'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Lightbulb, Sparkles, ArrowRight, Monitor, Users, Clock } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PLATFORMS, TEAM_SIZES, TIME_HORIZONS } from '@/lib/types';

type Step = 'idea' | 'platform' | 'team' | 'timeline';

export default function StartPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [step, setStep] = useState<Step>('idea');
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleIdeaSelect = (value: boolean) => {
    setHasIdea(value);
    updateProject({ hasIdea: value });
    setStep('platform');
  };

  const handlePlatformSelect = (value: string) => {
    updateProject({ platform: value });
    setStep('team');
  };

  const handleTeamSelect = (value: string) => {
    updateProject({ teamSize: value });
    setStep('timeline');
  };

  const handleTimelineSelect = (value: string) => {
    updateProject({ timeHorizon: value });
    // Navigate to next page
    if (hasIdea) {
      router.push('/idea');
    } else {
      router.push('/ikigai');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'idea':
        return (
          <>
            <h2 className="text-xl font-medium text-center">Do you have a game idea?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleIdeaSelect(true)}
                className="p-6 rounded-lg border-2 border-border hover:border-primary transition-all flex flex-col items-center gap-3"
              >
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Yes</span>
              </button>
              <button
                onClick={() => handleIdeaSelect(false)}
                className="p-6 rounded-lg border-2 border-border hover:border-primary transition-all flex flex-col items-center gap-3"
              >
                <Sparkles className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">No, help me</span>
              </button>
            </div>
          </>
        );

      case 'platform':
        return (
          <>
            <h2 className="text-xl font-medium text-center">What platform?</h2>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => handlePlatformSelect(platform)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    project.platform === platform
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </>
        );

      case 'team':
        return (
          <>
            <h2 className="text-xl font-medium text-center">Team size?</h2>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => handleTeamSelect(size)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    project.teamSize === size
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </>
        );

      case 'timeline':
        return (
          <>
            <h2 className="text-xl font-medium text-center">Timeline?</h2>
            <div className="grid grid-cols-2 gap-2">
              {TIME_HORIZONS.map((horizon) => (
                <button
                  key={horizon}
                  onClick={() => handleTimelineSelect(horizon)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    project.timeHorizon === horizon
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {horizon}
                </button>
              ))}
            </div>
          </>
        );
    }
  };

  const stepIndex = ['idea', 'platform', 'team', 'timeline'].indexOf(step);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Artify — CREATE</h1>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <Card className="border-2">
          <CardContent className="pt-6 space-y-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Back button */}
        {step !== 'idea' && (
          <button
            onClick={() => {
              const steps: Step[] = ['idea', 'platform', 'team', 'timeline'];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) {
                setStep(steps[currentIndex - 1]);
              }
            }}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
