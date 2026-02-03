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
  Trophy,
  ChevronRight
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const JOURNEY_STEPS = [
  { path: 'create', label: 'Setup', icon: Play, color: '#58CC02' },
  { path: 'ikigai', altPath: 'idea', label: 'Ideate', icon: Lightbulb, color: '#FF9600' },
  { path: 'sparks', label: 'Sparks', icon: Sparkles, color: '#CE82FF' },
  { path: 'card', label: 'Concept', icon: CreditCard, color: '#1CB0F6' },
  { path: 'finalize', label: 'Refine', icon: Pencil, color: '#FF4B4B' },
  { path: 'gameloop', label: 'Loop', icon: RefreshCw, color: '#58CC02' },
  { path: 'questions', label: 'Details', icon: HelpCircle, color: '#FF9600' },
  { path: 'skilltree', label: 'Skills', icon: GitBranch, color: '#CE82FF' },
  { path: 'validation', label: 'Validate', icon: CheckCircle2, color: '#FFD900' },
];

export function JourneyView({ currentStep }: { currentStep?: string }) {
  const router = useRouter();
  const { project } = useProject();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activePath = currentStep || project?.currentPage || 'create';
  const currentIndex = JOURNEY_STEPS.findIndex(
    (step) => step.path === activePath || step.altPath === activePath
  );

  // Auto-scroll to current step
  useEffect(() => {
    if (scrollRef.current) {
      const scrollPos = Math.max(0, (currentIndex * 120) - 100);
      scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleStepClick = (step: typeof JOURNEY_STEPS[0], index: number) => {
    if (index <= currentIndex) {
      router.push(`/${step.path}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#131F24] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[#2a3f4a]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD900] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#131F24]" />
            </div>
            <div>
              <h1 className="text-white font-bold">Game Creator</h1>
              <span className="text-gray-500 text-sm">{currentIndex + 1} of {JOURNEY_STEPS.length}</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="text-gray-500 hover:text-white text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-2">Your Journey</h2>
        <p className="text-gray-500 mb-8">Complete each step to build your game concept</p>

        {/* Horizontal scrolling path */}
        <div 
          ref={scrollRef}
          className="w-full max-w-4xl overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex items-center gap-2 px-8 min-w-max">
            {JOURNEY_STEPS.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isLocked = index > currentIndex;
              const Icon = step.icon;

              return (
                <div key={step.path} className="flex items-center">
                  {/* Node */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleStepClick(step, index)}
                      disabled={isLocked}
                      className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center
                        transition-transform
                        ${isCurrent ? 'scale-110' : ''}
                        ${!isLocked ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
                      `}
                      style={{
                        backgroundColor: isLocked ? '#2a3f4a' : step.color,
                        boxShadow: isLocked ? 'none' : `0 4px 0 ${darken(step.color, 40)}`,
                      }}
                    >
                      {isCompleted && (
                        <Crown 
                          className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-400" 
                          fill="currentColor" 
                        />
                      )}
                      
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-gray-600" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </button>

                    <span className={`mt-2 text-xs font-medium ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </span>

                    {isCurrent && (
                      <button
                        onClick={() => router.push(`/${step.path}`)}
                        className="mt-2 px-4 py-1.5 rounded-lg text-white text-xs font-bold"
                        style={{ backgroundColor: step.color }}
                      >
                        {currentIndex === 0 ? 'START' : 'GO'}
                      </button>
                    )}
                  </div>

                  {/* Connector line */}
                  {index < JOURNEY_STEPS.length - 1 && (
                    <div 
                      className="w-8 h-1 mx-1 rounded-full"
                      style={{
                        backgroundColor: index < currentIndex ? '#58CC02' : '#2a3f4a'
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Final trophy */}
            <div className="flex items-center">
              <div 
                className="w-8 h-1 mx-1 rounded-full"
                style={{ backgroundColor: currentIndex >= JOURNEY_STEPS.length - 1 ? '#58CC02' : '#2a3f4a' }}
              />
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentIndex >= JOURNEY_STEPS.length ? '#FFD900' : '#2a3f4a' }}
                >
                  <Trophy className={`w-6 h-6 ${currentIndex >= JOURNEY_STEPS.length ? 'text-[#131F24]' : 'text-gray-600'}`} />
                </div>
                <span className="mt-2 text-xs font-medium text-gray-600">Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current step card */}
        {JOURNEY_STEPS[currentIndex] && (
          <div className="mt-8 p-5 rounded-xl bg-[#1a2f38] border border-[#2a3f4a] max-w-md w-full">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: JOURNEY_STEPS[currentIndex].color }}
              >
                {(() => {
                  const CurrentIcon = JOURNEY_STEPS[currentIndex].icon;
                  return <CurrentIcon className="w-6 h-6 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">
                  {JOURNEY_STEPS[currentIndex].label}
                </h3>
                <p className="text-gray-500 text-sm">
                  {getDescription(JOURNEY_STEPS[currentIndex].path)}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${JOURNEY_STEPS[currentIndex].path}`)}
                className="p-3 rounded-lg text-white"
                style={{ backgroundColor: JOURNEY_STEPS[currentIndex].color }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function darken(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getDescription(path: string): string {
  const desc: Record<string, string> = {
    'create': 'Choose platform and timeline',
    'ikigai': 'Build your ideation canvas',
    'sparks': 'Generate AI game ideas',
    'card': 'Reveal your concept card',
    'finalize': 'Polish your concept',
    'gameloop': 'Design the core loop',
    'questions': 'Answer design questions',
    'skilltree': 'Map skill progression',
    'validation': 'Validate your concept',
  };
  return desc[path] || '';
}
