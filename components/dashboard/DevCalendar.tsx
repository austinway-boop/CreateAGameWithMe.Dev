'use client';

import { useState } from 'react';
import { Calendar, Loader2, Sparkles, ChevronDown, ChevronRight, Lightbulb, Flag } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

interface Milestone {
  name: string;
  week: number;
  tasks: string[];
}

interface Phase {
  name: string;
  startWeek: number;
  endWeek: number;
  color: string;
  milestones: Milestone[];
}

interface CalendarData {
  phases: Phase[];
  totalWeeks: number;
  tips: string[];
}

interface Props {
  credits: CreditInfo | null;
  onCreditsUpdate: () => void;
}

export function DevCalendar({ credits, onCreditsUpdate }: Props) {
  const { project } = useProject();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const generateCalendar = async () => {
    if (!project?.id) { setError('No project found'); return; }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      setCalendarData(data.calendarData);
      // Expand all phases by default
      setExpandedPhases(new Set(data.calendarData.phases.map((p: Phase) => p.name)));
      onCreditsUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to generate calendar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePhase = (name: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // No calendar yet - show generator
  if (!calendarData) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-6 text-center">
          <Calendar className="w-12 h-12 mx-auto text-[#1cb0f6] mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">AI Development Calendar</h3>
          <p className="text-gray-500 text-sm mb-4">
            Generate a personalized development roadmap based on your game concept, team size, and timeline.
          </p>

          {project?.finalTitle && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-left space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-700">Game:</span>
                <span className="text-gray-600">{project.finalTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-700">Platform:</span>
                <span className="text-gray-600">{project.platform || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-700">Team:</span>
                <span className="text-gray-600">{project.teamSize || 'Solo'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-700">Timeline:</span>
                <span className="text-gray-600">{project.timeHorizon || '3 months'}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs mb-3">{error}</div>
          )}

          <button
            onClick={generateCalendar}
            disabled={isGenerating || !project?.id}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              !isGenerating && project?.id
                ? 'bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating calendar...</>
            ) : (
              <><Sparkles size={16} /> Generate Calendar (1 credit)</>
            )}
          </button>

          {credits && (
            <p className="text-center text-[11px] text-gray-400 mt-2">{credits.remaining} credits remaining</p>
          )}
        </div>
      </div>
    );
  }

  // Calendar view
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
          Development Roadmap &mdash; {calendarData.totalWeeks} Weeks
        </h3>
        <button
          onClick={generateCalendar}
          disabled={isGenerating}
          className="flex items-center gap-1 text-xs text-[#1cb0f6] font-bold hover:underline"
        >
          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Regenerate
        </button>
      </div>

      {/* Timeline visualization */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Week numbers */}
          <div className="flex mb-2">
            <div className="w-28 shrink-0" />
            <div className="flex-1 flex">
              {Array.from({ length: calendarData.totalWeeks }, (_, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-gray-400 font-bold">
                  W{i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Phase bars */}
          {calendarData.phases.map((phase) => {
            const startPct = ((phase.startWeek - 1) / calendarData.totalWeeks) * 100;
            const widthPct = ((phase.endWeek - phase.startWeek + 1) / calendarData.totalWeeks) * 100;
            return (
              <div key={phase.name} className="flex items-center mb-1.5">
                <div className="w-28 shrink-0 text-[10px] font-bold text-gray-700 truncate pr-2">{phase.name}</div>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute top-0 h-full rounded-lg opacity-90"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: phase.color,
                    }}
                  />
                  {/* Milestone dots */}
                  {phase.milestones.map((m) => {
                    const mPct = ((m.week - 1) / calendarData.totalWeeks) * 100;
                    return (
                      <div
                        key={m.name}
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 z-10"
                        style={{ left: `${mPct}%`, borderColor: phase.color }}
                        title={m.name}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Details */}
      <div className="space-y-2">
        {calendarData.phases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.name);
          return (
            <div key={phase.name} className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] overflow-hidden">
              <button
                onClick={() => togglePhase(phase.name)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
                <span className="font-bold text-gray-900 text-sm flex-1 text-left">{phase.name}</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  Week {phase.startWeek}–{phase.endWeek}
                </span>
                {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {phase.milestones.map((milestone) => (
                    <div key={milestone.name} className="pl-6 border-l-2" style={{ borderColor: phase.color }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Flag size={12} style={{ color: phase.color }} />
                        <span className="font-medium text-gray-800 text-xs">{milestone.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Week {milestone.week}</span>
                      </div>
                      <ul className="space-y-0.5">
                        {milestone.tasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                            <span className="text-gray-300 mt-0.5">&#x2022;</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {calendarData.tips && calendarData.tips.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 shadow-[0_3px_0_#fbbf24] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-amber-700 text-xs uppercase tracking-wide">Development Tips</span>
          </div>
          <ul className="space-y-1">
            {calendarData.tips.map((tip, i) => (
              <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">&#x2022;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
