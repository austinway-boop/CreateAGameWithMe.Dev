'use client';

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';

// Define the user journey steps
const JOURNEY_STEPS = [
  { path: 'create', label: 'Setup' },
  { path: 'ikigai', altPath: 'idea', label: 'Ideation' },
  { path: 'sparks', label: 'Sparks', optional: true },
  { path: 'card', label: 'Concept' },
  { path: 'finalize', label: 'Refine' },
  { path: 'gameloop', label: 'Game Loop' },
  { path: 'questions', label: 'Details' },
  { path: 'skilltree', label: 'Skills' },
  { path: 'validation', label: 'Validate' },
];

export function ProgressIndicator() {
  const pathname = usePathname();
  const currentPath = pathname?.split('/')[1] || '';

  // Find current step index
  const currentIndex = JOURNEY_STEPS.findIndex(
    (step) => step.path === currentPath || step.altPath === currentPath
  );

  // Don't show on onboarding or landing
  if (currentIndex === -1) return null;

  return (
    <div className="bg-muted/50 border-b">
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {JOURNEY_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isOptional = step.optional;

            return (
              <div key={step.path} className="flex items-center">
                {index > 0 && (
                  <div
                    className={`w-4 h-px mx-1 ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  } ${isOptional && !isCurrent && !isCompleted ? 'opacity-60' : ''}`}
                >
                  {isCompleted && <Check className="h-3 w-3" />}
                  <span className="whitespace-nowrap">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
