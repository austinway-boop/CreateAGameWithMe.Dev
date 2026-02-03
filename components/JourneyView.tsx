'use client';

import { useRouter } from 'next/navigation';
import { useProject } from '@/hooks/useProject';
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
  Play,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';

// Define the user journey steps with icons
const JOURNEY_STEPS = [
  { 
    path: 'create', 
    label: 'Setup', 
    description: 'Choose your platform and timeline',
    icon: Play, 
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-500'
  },
  { 
    path: 'ikigai', 
    altPath: 'idea',
    label: 'Ideate', 
    description: 'Build your game ideation canvas',
    icon: Lightbulb, 
    color: 'from-rose-400 to-rose-600',
    bgColor: 'bg-rose-500'
  },
  { 
    path: 'sparks', 
    label: 'Sparks', 
    description: 'Generate AI-powered game ideas',
    icon: Sparkles, 
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-500',
    optional: true
  },
  { 
    path: 'card', 
    label: 'Concept', 
    description: 'Reveal your concept card',
    icon: CreditCard, 
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-500'
  },
  { 
    path: 'finalize', 
    label: 'Refine', 
    description: 'Polish your game concept',
    icon: Pencil, 
    color: 'from-cyan-400 to-cyan-600',
    bgColor: 'bg-cyan-500'
  },
  { 
    path: 'gameloop', 
    label: 'Game Loop', 
    description: 'Design your core gameplay loop',
    icon: RefreshCw, 
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-500'
  },
  { 
    path: 'questions', 
    label: 'Details', 
    description: 'Answer key design questions',
    icon: HelpCircle, 
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-500'
  },
  { 
    path: 'skilltree', 
    label: 'Skills', 
    description: 'Map player skill progression',
    icon: GitBranch, 
    color: 'from-indigo-400 to-indigo-600',
    bgColor: 'bg-indigo-500'
  },
  { 
    path: 'validation', 
    label: 'Validate', 
    description: 'Get AI feedback on your concept',
    icon: CheckCircle2, 
    color: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-500'
  },
];

interface JourneyViewProps {
  currentStep?: string;
}

export function JourneyView({ currentStep }: JourneyViewProps) {
  const router = useRouter();
  const { project } = useProject();

  // Determine current step index from project's currentPage or prop
  const activePath = currentStep || project?.currentPage || 'create';
  const currentIndex = JOURNEY_STEPS.findIndex(
    (step) => step.path === activePath || step.altPath === activePath
  );

  const handleStepClick = (step: typeof JOURNEY_STEPS[0], index: number) => {
    if (index <= currentIndex) {
      router.push(`/${step.path}`);
    }
  };

  const progressPercent = Math.round((currentIndex / (JOURNEY_STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Your Journey</h1>
              <p className="text-xs text-slate-400">{progressPercent}% complete</p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-700">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Journey Path */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-700" />
          
          {/* Steps */}
          <div className="space-y-4">
            {JOURNEY_STEPS.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLocked = index > currentIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.path}
                  className={`relative flex items-center gap-4 ${
                    isLocked ? 'opacity-50' : ''
                  }`}
                >
                  {/* Node */}
                  <button
                    onClick={() => handleStepClick(step, index)}
                    disabled={isLocked}
                    className={`
                      relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center
                      transition-all duration-300 transform
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30' 
                        : isCurrent 
                          ? `bg-gradient-to-br ${step.color} shadow-xl ring-4 ring-white/20 scale-110`
                          : 'bg-slate-700'
                      }
                      ${!isLocked ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
                    `}
                  >
                    {isCompleted ? (
                      <Crown className="w-7 h-7" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6 text-slate-500" />
                    ) : (
                      <Icon className="w-7 h-7" />
                    )}
                    
                    {/* Pulse animation for current */}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-white" />
                    )}
                  </button>

                  {/* Content */}
                  <div 
                    className={`flex-1 ${!isLocked ? 'cursor-pointer' : ''}`}
                    onClick={() => !isLocked && handleStepClick(step, index)}
                  >
                    <div className={`
                      p-4 rounded-xl transition-all
                      ${isCurrent 
                        ? 'bg-slate-700/80 border border-slate-600' 
                        : isCompleted 
                          ? 'bg-slate-800/50'
                          : 'bg-slate-800/30'
                      }
                    `}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-400'}`}>
                            {step.label}
                          </h3>
                          <p className="text-sm text-slate-400 mt-0.5">{step.description}</p>
                        </div>
                        {!isLocked && (
                          <ChevronRight className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                        )}
                      </div>
                      
                      {/* Current step CTA */}
                      {isCurrent && (
                        <Button 
                          onClick={() => router.push(`/${step.path}`)}
                          className={`mt-3 w-full bg-gradient-to-r ${step.color} hover:opacity-90`}
                        >
                          {isCompleted ? 'Review' : index === 0 ? 'Start' : 'Continue'}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute left-12 top-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final destination */}
          <div className="relative flex items-center gap-4 mt-8 pt-4 border-t border-slate-700">
            <div className="z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400">Ready to Build!</h3>
              <p className="text-sm text-slate-400">Complete all steps to export your game design document</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
