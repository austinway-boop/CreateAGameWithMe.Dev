'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PLATFORMS, TIME_HORIZONS } from '@/lib/types';

type Step = 'idea' | 'platform' | 'timeline';

export default function CreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { project, loading, updateProject, retryLoad } = useProject();
  const [step, setStep] = useState<Step>('idea');
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.onboardingComplete) {
      router.push('/onboarding');
    }
  }, [status, session, router]);

  // Auto-redirect to saved page if user has progress
  useEffect(() => {
    if (project && project.currentPage && project.currentPage !== 'create') {
      router.push(`/${project.currentPage}`);
    }
  }, [project, router]);

  if (loading || !project) {
    return <LoadingScreen onRetry={retryLoad} />;
  }

  // Don't render if not onboarded
  if (!session?.user?.onboardingComplete) {
    return null;
  }

  const handleIdeaSelect = (value: boolean) => {
    setHasIdea(value);
    updateProject({ hasIdea: value });
    setStep('platform');
  };

  const handlePlatformSelect = (value: string) => {
    updateProject({ platform: value, teamSize: 'Solo' });
    setStep('timeline');
  };

  const handleTimelineSelect = (value: string) => {
    const nextPage = hasIdea ? 'idea' : 'ikigai';
    updateProject({ timeHorizon: value, currentPage: nextPage });
    router.push(`/${nextPage}`);
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

  const steps: Step[] = ['idea', 'platform', 'timeline'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-muted-foreground">Let&apos;s get started</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
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
