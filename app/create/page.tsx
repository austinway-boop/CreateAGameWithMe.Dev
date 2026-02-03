'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lightbulb, Sparkles, ArrowLeft } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreateSkeleton } from '@/components/LoadingScreen';
import { PLATFORMS, TIME_HORIZONS } from '@/lib/types';

type Step = 'idea' | 'platform' | 'timeline';

export default function CreatePage() {
  const router = useRouter();
  const { data: session, status } = useAuth();
  const { project, loading, updateProject } = useProject();
  const [step, setStep] = useState<Step>('idea');
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.onboardingComplete) {
      router.push('/onboarding');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!hasRedirected.current && project && project.currentPage && project.currentPage !== 'create') {
      hasRedirected.current = true;
      router.push(`/${project.currentPage}`);
    }
  }, [project, router]);

  if (loading || !project) {
    return <CreateSkeleton />;
  }

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
    router.push('/journey?completed=create');
  };

  const steps: Step[] = ['idea', 'platform', 'timeline'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex items-center">
        {step !== 'idea' && (
          <button
            onClick={() => {
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) setStep(steps[currentIndex - 1]);
            }}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Progress bar */}
        <div className="w-full max-w-xs mb-8">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          {step === 'idea' && 'Do you have a game idea?'}
          {step === 'platform' && 'What platform?'}
          {step === 'timeline' && 'How much time do you have?'}
        </h1>

        {/* Options */}
        <div className="w-full max-w-sm space-y-3">
          {step === 'idea' && (
            <>
              <button
                onClick={() => handleIdeaSelect(true)}
                className="w-full p-4 rounded-xl bg-white shadow-[0_3px_0_#e5e7eb] 
                  hover:bg-gray-50 active:translate-y-0.5 active:shadow-none transition-all
                  flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400 shadow-[0_3px_0_#b45309] flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-gray-900">Yes, I have an idea</span>
              </button>
              <button
                onClick={() => handleIdeaSelect(false)}
                className="w-full p-4 rounded-xl bg-white shadow-[0_3px_0_#e5e7eb] 
                  hover:bg-gray-50 active:translate-y-0.5 active:shadow-none transition-all
                  flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500 shadow-[0_3px_0_#7c3aed] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-gray-900">No, help me brainstorm</span>
              </button>
            </>
          )}

          {step === 'platform' && PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => handlePlatformSelect(platform)}
              className={`w-full p-4 rounded-xl bg-white shadow-[0_3px_0_#e5e7eb] 
                hover:bg-gray-50 active:translate-y-0.5 active:shadow-none transition-all
                flex items-center justify-center font-bold
                ${project.platform === platform ? 'ring-2 ring-pink-500' : ''}`}
            >
              {platform}
            </button>
          ))}

          {step === 'timeline' && TIME_HORIZONS.map((horizon) => (
            <button
              key={horizon}
              onClick={() => handleTimelineSelect(horizon)}
              className={`w-full p-4 rounded-xl bg-white shadow-[0_3px_0_#e5e7eb] 
                hover:bg-gray-50 active:translate-y-0.5 active:shadow-none transition-all
                flex items-center justify-center font-bold
                ${project.timeHorizon === horizon ? 'ring-2 ring-pink-500' : ''}`}
            >
              {horizon}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
