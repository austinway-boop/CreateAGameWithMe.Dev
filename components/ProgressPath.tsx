'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  Lightbulb, 
  Sparkles, 
  CreditCard, 
  Pencil, 
  RefreshCw, 
  HelpCircle, 
  GitBranch, 
  CheckCircle2,
  Crown,
  Lock,
  Play
} from 'lucide-react';

// Define the user journey steps with icons
const JOURNEY_STEPS = [
  { path: 'create', altPath: null, label: 'Setup', icon: Play, color: 'bg-blue-500' },
  { path: 'ikigai', altPath: 'idea', label: 'Ideate', icon: Lightbulb, color: 'bg-rose-500' },
  { path: 'sparks', altPath: null, label: 'Sparks', icon: Sparkles, color: 'bg-amber-500', optional: true },
  { path: 'card', altPath: null, label: 'Concept', icon: CreditCard, color: 'bg-purple-500' },
  { path: 'finalize', altPath: null, label: 'Refine', icon: Pencil, color: 'bg-cyan-500' },
  { path: 'gameloop', altPath: null, label: 'Loop', icon: RefreshCw, color: 'bg-green-500' },
  { path: 'questions', altPath: null, label: 'Details', icon: HelpCircle, color: 'bg-orange-500' },
  { path: 'skilltree', altPath: null, label: 'Skills', icon: GitBranch, color: 'bg-indigo-500' },
  { path: 'validation', altPath: null, label: 'Validate', icon: CheckCircle2, color: 'bg-emerald-500' },
];

export function ProgressPath() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname?.split('/')[1] || '';

  // Find current step index
  const currentIndex = JOURNEY_STEPS.findIndex(
    (step) => step.path === currentPath || step.altPath === currentPath
  );

  // Don't show on onboarding or landing
  if (currentIndex === -1) return null;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Path container */}
        <div className="relative flex items-center justify-between min-w-max">
          {/* Connecting path line - background */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            preserveAspectRatio="none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                <stop offset={`${(currentIndex / (JOURNEY_STEPS.length - 1)) * 100}%`} stopColor="rgb(34, 197, 94)" />
                <stop offset={`${(currentIndex / (JOURNEY_STEPS.length - 1)) * 100}%`} stopColor="rgb(203, 213, 225)" />
                <stop offset="100%" stopColor="rgb(203, 213, 225)" />
              </linearGradient>
            </defs>
            {/* Wavy path */}
            <path
              d={generateWavyPath(JOURNEY_STEPS.length)}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
          </svg>

          {/* Step nodes */}
          {JOURNEY_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLocked = index > currentIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.path}
                className="relative flex flex-col items-center z-10"
                style={{ flex: '1 1 0' }}
              >
                {/* Node */}
                <button
                  onClick={() => {
                    if (isCompleted) {
                      router.push(`/${step.path}`);
                    }
                  }}
                  disabled={isLocked}
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300 transform
                    ${isCompleted 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:scale-110 cursor-pointer' 
                      : isCurrent 
                        ? `${step.color} text-white shadow-xl ring-4 ring-white dark:ring-slate-800 scale-110 animate-pulse-subtle`
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }
                    ${isLocked ? 'cursor-not-allowed' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Crown className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  
                  {/* Current indicator glow */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-current" />
                  )}
                </button>

                {/* Label */}
                <span 
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isCurrent 
                      ? 'text-foreground font-semibold' 
                      : isCompleted 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* Completion checkmark badge */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress text */}
        <div className="flex justify-center mt-2">
          <span className="text-xs text-muted-foreground">
            Step {currentIndex + 1} of {JOURNEY_STEPS.length} — {Math.round((currentIndex / (JOURNEY_STEPS.length - 1)) * 100)}% complete
          </span>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// Generate a wavy SVG path that connects all nodes
function generateWavyPath(numSteps: number): string {
  const width = 100; // percentage
  const height = 60; // pixels (height of the container)
  const centerY = height / 2;
  const amplitude = 8; // wave amplitude
  
  let path = `M 4 ${centerY}`;
  
  for (let i = 1; i < numSteps; i++) {
    const prevX = ((i - 1) / (numSteps - 1)) * (width - 8) + 4;
    const currX = (i / (numSteps - 1)) * (width - 8) + 4;
    const midX = (prevX + currX) / 2;
    
    // Alternate wave direction
    const waveDir = i % 2 === 0 ? -1 : 1;
    const controlY = centerY + (amplitude * waveDir);
    
    path += ` Q ${midX}% ${controlY}, ${currX}% ${centerY}`;
  }
  
  return path;
}
