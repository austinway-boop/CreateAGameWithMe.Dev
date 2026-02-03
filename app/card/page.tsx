'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Download, ArrowRight } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ElectricBorder from '@/components/ElectricBorder';
import { CardSkeleton } from '@/components/LoadingScreen';
import html2canvas from 'html2canvas';

type Phase = 'idle' | 'flipping' | 'revealed';

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) => 
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  ENTER_TRANSITION_MS: 180
};

export default function ConceptCardPage() {
  const router = useRouter();
  const { project, loading, updateProject, retryLoad } = useProject();
  const [phase, setPhase] = useState<Phase>('idle');
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Refs for holographic tilt effect
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  // Tilt engine for smooth animation
  const tiltEngine = useMemo(() => {
    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };

      for (const [k, v] of Object.entries(properties)) {
        wrap.style.setProperty(k, v);
      }
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x: number, y: number) {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x: number, y: number) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs: number) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      }
    };
  }, []);

  const [isActive, setIsActive] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'revealed') return;
    const shell = shellRef.current;
    if (!shell) return;
    
    const rect = shell.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    tiltEngine.setTarget(x, y);
  }, [tiltEngine, phase]);

  const handlePointerEnter = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'revealed') return;
    const shell = shellRef.current;
    if (!shell) return;

    setIsActive(true);
    setIsEntering(true);
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      setIsEntering(false);
    }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

    const rect = shell.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    tiltEngine.setTarget(x, y);
  }, [tiltEngine, phase]);

  const handlePointerLeave = useCallback(() => {
    if (phase !== 'revealed') return;

    tiltEngine.toCenter();

    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        setIsActive(false);
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine, phase]);

  // Initialize tilt position when revealed
  useEffect(() => {
    if (phase !== 'revealed') return;

    const shell = shellRef.current;
    if (!shell) return;

    // Initialize position
    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
    };
  }, [phase, tiltEngine]);

  if (loading || !project) {
    return <CardSkeleton />;
  }

  // Need either an image OR concept data to show the card
  if (!project.conceptImage && !project.finalTitle && !project.selectedSpark) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No concept card generated yet.</p>
          <Button onClick={() => router.push(project.hasIdea ? '/idea' : '/sparks')}>
            {project.hasIdea ? 'Go to Idea Page' : 'Go to Sparks'}
          </Button>
        </div>
      </div>
    );
  }

  const handleReveal = () => {
    if (phase !== 'idle') return;
    setPhase('flipping');
    setTimeout(() => {
      setPhase('revealed');
      setShowActions(true);
      updateProject({
        hasConceptCard: true,
        conceptCardCreatedAt: new Date().toISOString(),
      });
    }, 800);
  };

  const downloadCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = `${project.finalTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-concept-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
    }
  };

  const coreVerbs = project.structuredIdea?.coreVerbs || [];
  const coreLoop = project.structuredIdea?.loopHook || '';

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {phase === 'revealed' ? 'Your Concept Card' : "We've created your Concept Card"}
          </h1>
          {phase === 'idle' && (
            <p className="text-muted-foreground mt-1 animate-pulse">Click to reveal</p>
          )}
          {phase === 'revealed' && (
            <p className="text-muted-foreground mt-1">Ideation complete — ready for validation</p>
          )}
        </div>

        {/* 3D Card Scene with Electric Border wrapper */}
        <div className="card-container mx-auto">
          {/* Electric border wraps the entire scene - positioned outside to avoid clipping */}
          {phase === 'revealed' && (
            <div className="electric-wrapper">
              <ElectricBorder 
                color="#d4af37" 
                speed={0.8} 
                chaos={0.08} 
                borderRadius={16}
              >
                <div className="electric-spacer" />
              </ElectricBorder>
            </div>
          )}
          
          <div 
            className="card-scene"
            onClick={handleReveal}
            style={{ cursor: phase === 'idle' ? 'pointer' : 'default' }}
          >
            {/* Card wrapper - CSS classes control transform/animation */}
            <div className={`card-wrapper ${phase}`}>
              {/* Card Back */}
              <div className="card-face card-back">
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cardGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cardGrid)" />
                </svg>
                <div className="diagonal-shine" />
                <div className="corner-frame top-left" />
                <div className="corner-frame top-right" />
                <div className="corner-frame bottom-left" />
                <div className="corner-frame bottom-right" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <p className="text-white/95 font-semibold tracking-[0.2em] text-lg">YOUR GAME</p>
                  <p className="text-white/50 text-sm mt-2">awaits</p>
                </div>
              </div>

              {/* Card Front */}
              <div 
                ref={wrapRef}
                className="card-face card-front pc-card-wrapper"
              >
                {/* Behind glow effect */}
                <div className="pc-behind" />
                
                <div 
                  ref={shellRef} 
                  className={`pc-card-shell ${isActive ? 'active' : ''} ${isEntering ? 'entering' : ''}`}
                  onPointerEnter={handlePointerEnter}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                >
                  <div 
                    ref={cardRef}
                    className="card-inner pc-card"
                  >
                    <div className="pc-inside">
                      {/* Holographic shine */}
                      <div className="pc-shine" />
                      
                      {/* Holographic glare */}
                      <div className="pc-glare" />
                      
                      {/* Download button */}
                      {showActions && (
                        <button onClick={downloadCard} className="download-btn" title="Download Card">
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Content */}
                      <div className="card-content">
                        <div className="card-image">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={project.conceptImage} alt={project.finalTitle} />
                          <div className="image-fade" />
                        </div>
                        
                        <div className="card-info">
                          <h2 className="card-title">{project.finalTitle}</h2>
                          <p className="card-concept">{project.finalConcept}</p>
                          
                          {coreVerbs.length > 0 && (
                            <div className="card-verbs">
                              {coreVerbs.map((verb) => (
                                <Badge key={verb} variant="secondary" className="text-xs">{verb}</Badge>
                              ))}
                            </div>
                          )}
                          
                          {coreLoop && (
                            <div className="card-loop">
                              <p className="loop-label">Core Loop</p>
                              <p className="loop-text">{coreLoop}</p>
                            </div>
                          )}
                          
                          <div className="card-meta">
                            {project.platform && <span>{project.platform}</span>}
                            {project.teamSize && <span>{project.teamSize}</span>}
                            {project.timeHorizon && <span>{project.timeHorizon}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button onClick={() => {
              updateProject({ currentPage: 'finalize' });
              router.push('/journey?completed=card');
            }} className="w-full gap-2" size="lg">
              Continue to Finalize
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="flex justify-center gap-4 text-sm">
              <button onClick={() => {
                updateProject({ currentPage: 'idea' });
                router.push('/idea');
              }} className="text-muted-foreground hover:text-foreground transition-colors">
                ← Edit Concept
              </button>
              <button onClick={() => {
                updateProject({ currentPage: 'create' });
                router.push('/create');
              }} className="text-muted-foreground hover:text-foreground transition-colors">
                Start New
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes flipCard {
          0% { 
            transform: translateZ(0) rotateY(0deg);
          }
          15% { 
            transform: translateZ(80px) rotateY(30deg);
          }
          50% { 
            transform: translateZ(120px) rotateY(90deg);
          }
          85% { 
            transform: translateZ(80px) rotateY(150deg);
          }
          100% { 
            transform: translateZ(0) rotateY(180deg);
          }
        }

        .card-container {
          position: relative;
          width: 380px;
          height: 520px;
        }

        .electric-wrapper {
          position: absolute;
          inset: -10px;
          z-index: 5;
          pointer-events: none;
        }

        .electric-spacer {
          width: 100%;
          height: 100%;
        }

        .card-scene {
          position: relative;
          width: 100%;
          height: 100%;
          perspective: 1200px;
          perspective-origin: center center;
        }

        .card-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .card-wrapper.idle {
          animation: floatCard 3s ease-in-out infinite;
        }

        .card-wrapper.flipping {
          animation: flipCard 0.8s ease-in-out forwards;
        }

        .card-wrapper.revealed {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 16px;
          overflow: visible;
        }

        .card-back {
          background: linear-gradient(145deg, #1a1a2e, #16213e, #0f3460);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .diagonal-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 70%);
          animation: shineMove 3s ease-in-out infinite;
        }

        @keyframes shineMove {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        .corner-frame {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: rgba(212, 175, 55, 0.4);
          border-style: solid;
          border-width: 0;
        }
        .corner-frame.top-left { top: 16px; left: 16px; border-top-width: 2px; border-left-width: 2px; border-radius: 8px 0 0 0; }
        .corner-frame.top-right { top: 16px; right: 16px; border-top-width: 2px; border-right-width: 2px; border-radius: 0 8px 0 0; }
        .corner-frame.bottom-left { bottom: 16px; left: 16px; border-bottom-width: 2px; border-left-width: 2px; border-radius: 0 0 0 8px; }
        .corner-frame.bottom-right { bottom: 16px; right: 16px; border-bottom-width: 2px; border-right-width: 2px; border-radius: 0 0 8px 0; }

        .card-front {
          transform: rotateY(180deg);
          background: transparent;
        }

        .card-inner {
          position: absolute;
          inset: 0;
          background: white;
          border-radius: 16px;
          overflow: hidden;
        }

        .download-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 20;
          padding: 8px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s;
          color: #374151;
        }
        .download-btn:hover {
          background: white;
          transform: scale(1.1);
        }

        .card-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 5;
        }

        .card-image {
          position: relative;
          height: 200px;
          flex-shrink: 0;
        }
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to top, white, transparent);
        }

        .card-info {
          flex: 1;
          padding: 16px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          background: white;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111;
          line-height: 1.3;
        }

        .card-concept {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-verbs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .card-loop {
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
        .loop-label {
          font-size: 0.6875rem;
          color: #9ca3af;
          margin-bottom: 2px;
        }
        .loop-text {
          font-size: 0.8125rem;
          color: #111;
          line-height: 1.4;
        }

        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 0.6875rem;
          color: #6b7280;
          margin-top: auto;
        }
        .card-meta span {
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
