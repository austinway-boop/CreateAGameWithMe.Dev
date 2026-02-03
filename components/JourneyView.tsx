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
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const JOURNEY_STEPS = [
  { path: 'create', label: 'Setup', icon: Play, color: '#ec4899' },
  { path: 'ikigai', altPath: 'idea', label: 'Ideate', icon: Lightbulb, color: '#FF9600' },
  { path: 'sparks', label: 'Sparks', icon: Sparkles, color: '#CE82FF' },
  { path: 'card', label: 'Concept', icon: CreditCard, color: '#1CB0F6' },
  { path: 'finalize', label: 'Refine', icon: Pencil, color: '#FF4B4B' },
  { path: 'gameloop', label: 'Loop', icon: RefreshCw, color: '#ec4899' },
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

  useEffect(() => {
    if (scrollRef.current) {
      const scrollPos = Math.max(0, (currentIndex * 140) - 100);
      scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleStepClick = (step: typeof JOURNEY_STEPS[0], index: number) => {
    if (index <= currentIndex) {
      router.push(`/${step.path}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-3 flex justify-end">
        <button 
          onClick={() => window.location.href = '/'}
          className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Journey</h2>
        <p className="text-gray-500 mb-8">Complete each step to build your game concept</p>

        {/* Scrollable path area */}
        <div 
          ref={scrollRef}
          className="w-full max-w-4xl overflow-x-auto py-8"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* SVG wavy path */}
          <div className="relative min-w-max px-4">
            <svg 
              className="absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none"
              width={(JOURNEY_STEPS.length + 1) * 140}
              height="120"
              style={{ top: '35px' }}
            >
              {/* Background path */}
              <path
                d={generatePath(JOURNEY_STEPS.length + 1)}
                fill="none"
                stroke="#fce7f3"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Progress path */}
              <path
                d={generatePath(JOURNEY_STEPS.length + 1)}
                fill="none"
                stroke="#ec4899"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${currentIndex * 140} 9999`}
              />
            </svg>

            {/* Nodes */}
            <div className="relative flex items-start" style={{ gap: '76px' }}>
              {JOURNEY_STEPS.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isLocked = index > currentIndex;
                const Icon = step.icon;
                
                // Alternate up and down
                const yOffset = index % 2 === 0 ? 0 : 40;

                return (
                  <div 
                    key={step.path} 
                    className="flex flex-col items-center"
                    style={{ marginTop: yOffset }}
                  >
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
                        backgroundColor: isLocked ? '#f3f4f6' : step.color,
                        boxShadow: isLocked ? 'none' : `0 4px 0 ${darken(step.color, 40)}`,
                      }}
                    >
                      {isCompleted && (
                        <Crown 
                          className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-500" 
                          fill="currentColor" 
                        />
                      )}
                      
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </button>

                    <span className={`mt-2 text-xs font-semibold ${
                      isCurrent ? 'text-gray-900' : isCompleted ? 'text-pink-500' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>

                    {isCurrent && (
                      <button
                        onClick={() => router.push(`/${step.path}`)}
                        className="mt-2 px-4 py-1.5 rounded-full text-white text-xs font-bold"
                        style={{ backgroundColor: step.color }}
                      >
                        {currentIndex === 0 ? 'START' : 'GO'}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Final trophy */}
              <div 
                className="flex flex-col items-center"
                style={{ marginTop: JOURNEY_STEPS.length % 2 === 0 ? 0 : 40 }}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: currentIndex >= JOURNEY_STEPS.length ? '#FFD900' : '#f3f4f6',
                    boxShadow: currentIndex >= JOURNEY_STEPS.length ? '0 4px 0 #b39700' : 'none'
                  }}
                >
                  <Trophy className={`w-6 h-6 ${currentIndex >= JOURNEY_STEPS.length ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className="mt-2 text-xs font-semibold text-gray-400">Finish</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current step card */}
        {JOURNEY_STEPS[currentIndex] && (
          <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-md w-full">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: JOURNEY_STEPS[currentIndex].color }}
              >
                {(() => {
                  const CurrentIcon = JOURNEY_STEPS[currentIndex].icon;
                  return <CurrentIcon className="w-6 h-6 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-bold">
                  {JOURNEY_STEPS[currentIndex].label}
                </h3>
                <p className="text-gray-500 text-sm">
                  {getDescription(JOURNEY_STEPS[currentIndex].path)}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${JOURNEY_STEPS[currentIndex].path}`)}
                className="p-3 rounded-xl text-white"
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

// Generate a wavy path
function generatePath(nodeCount: number): string {
  const spacing = 140;
  const amplitude = 20;
  let path = `M 32 ${60}`;
  
  for (let i = 1; i < nodeCount; i++) {
    const x = 32 + i * spacing;
    const prevX = 32 + (i - 1) * spacing;
    const y = i % 2 === 0 ? 60 : 60 + amplitude * 2;
    const prevY = (i - 1) % 2 === 0 ? 60 : 60 + amplitude * 2;
    
    const cp1x = prevX + spacing / 2;
    const cp1y = prevY;
    const cp2x = prevX + spacing / 2;
    const cp2y = y;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
  }
  
  return path;
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
