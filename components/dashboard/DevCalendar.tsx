'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target, Loader2, Sparkles, Clock, ChevronDown, ChevronRight,
  Check, Calendar, RotateCcw, Coffee, CheckCircle2, Circle, Play,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

// ============================================
// Types
// ============================================

interface DailyGoal {
  id: string;
  title: string;
  hours: number;
  category: 'design' | 'art' | 'code' | 'audio' | 'testing' | 'polish' | 'planning';
  completed: boolean;
}

interface DayPlan {
  day: number;
  goals: DailyGoal[];
}

interface WeekPlan {
  week: number;
  focus: string;
  days: DayPlan[];
  milestone: string;
}

interface CalendarPlanData {
  weeks: WeekPlan[];
  totalWeeks: number;
  hoursPerDay: number;
  daysPerWeek: number;
  startDate: string;
}

interface Props {
  credits: CreditInfo | null;
  onCreditsUpdate: () => void;
}

type TodayInfo =
  | { status: 'not_started'; nextDate: Date }
  | { status: 'rest_day'; nextDate: Date }
  | { status: 'working_day'; weekIndex: number; dayIndex: number }
  | { status: 'completed' };

// ============================================
// Constants
// ============================================

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: 'Plan', color: '#6b7280', bg: '#f3f4f6' },
  design:   { label: 'Design', color: '#a560e8', bg: '#f3e8ff' },
  art:      { label: 'Art', color: '#ff9600', bg: '#fff7ed' },
  code:     { label: 'Code', color: '#58cc02', bg: '#f0fdf4' },
  audio:    { label: 'Audio', color: '#eab308', bg: '#fefce8' },
  testing:  { label: 'Test', color: '#ff4b4b', bg: '#fef2f2' },
  polish:   { label: 'Polish', color: '#1cb0f6', bg: '#eff6ff' },
};

const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8];

const DAYS_OPTIONS = [
  { value: 3, label: '3 days' },
  { value: 5, label: '5 days' },
  { value: 7, label: '7 days' },
];

// ============================================
// Helper Functions
// ============================================

function isWorkingDay(date: Date, daysPerWeek: number): boolean {
  const dow = date.getDay();
  if (daysPerWeek === 7) return true;
  if (daysPerWeek === 5) return dow >= 1 && dow <= 5;
  if (daysPerWeek === 3) return dow === 1 || dow === 3 || dow === 5;
  return true;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getTodayInfo(data: CalendarPlanData): TodayInfo {
  const start = new Date(data.startDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (today < start) {
    return { status: 'not_started', nextDate: start };
  }

  // Check if today is a working day
  if (!isWorkingDay(today, data.daysPerWeek)) {
    const next = new Date(today);
    for (let i = 1; i <= 7; i++) {
      next.setDate(next.getDate() + 1);
      if (isWorkingDay(next, data.daysPerWeek)) {
        return { status: 'rest_day', nextDate: next };
      }
    }
    return { status: 'completed' };
  }

  // Count working days from start to today (0-indexed)
  let workingDayIndex = 0;
  const cursor = new Date(start);

  while (!isSameDay(cursor, today)) {
    if (isWorkingDay(cursor, data.daysPerWeek)) {
      workingDayIndex++;
    }
    cursor.setDate(cursor.getDate() + 1);
    // Safety: don't loop beyond today
    if (cursor > today) return { status: 'completed' };
  }

  const totalWorkingDays = data.weeks.reduce((sum, w) => sum + w.days.length, 0);

  if (workingDayIndex >= totalWorkingDays) {
    return { status: 'completed' };
  }

  const weekIndex = Math.floor(workingDayIndex / data.daysPerWeek);
  const dayIndex = workingDayIndex % data.daysPerWeek;

  return { status: 'working_day', weekIndex, dayIndex };
}

function getDateForWorkingDay(startDate: string, daysPerWeek: number, workingDayNumber: number): Date {
  const start = new Date(startDate + 'T12:00:00');
  const cursor = new Date(start);
  let count = 0;

  for (let i = 0; i < 500; i++) {
    if (isWorkingDay(cursor, daysPerWeek)) {
      count++;
      if (count === workingDayNumber) {
        return new Date(cursor);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return new Date(cursor);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getProgress(data: CalendarPlanData) {
  let total = 0;
  let completed = 0;
  for (const w of data.weeks) {
    for (const d of w.days) {
      for (const g of d.goals) {
        total++;
        if (g.completed) completed++;
      }
    }
  }
  return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

function getWeekProgress(week: WeekPlan) {
  let total = 0;
  let completed = 0;
  for (const d of week.days) {
    for (const g of d.goals) {
      total++;
      if (g.completed) completed++;
    }
  }
  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    allDone: total > 0 && completed === total,
  };
}

function getLocalDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================
// Component
// ============================================

export function DevCalendar({ credits, onCreditsUpdate }: Props) {
  const { project } = useProject();

  // Data state
  const [calendarData, setCalendarData] = useState<CalendarPlanData | null>(null);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup inputs
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  // View state
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Pending saves for goal completion
  const pendingSavesRef = useRef<Map<string, boolean>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing calendar on mount
  useEffect(() => {
    if (project?.id) {
      loadCalendar();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const loadCalendar = async () => {
    try {
      const res = await fetch(`/api/ai/calendar?projectId=${project!.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.calendarData) {
          setCalendarData(data.calendarData);
          setCalendarId(data.id);
          // Auto-expand current week
          const today = getTodayInfo(data.calendarData);
          if (today.status === 'working_day') {
            setExpandedWeek(today.weekIndex);
          } else if (data.calendarData.weeks?.length > 0) {
            setExpandedWeek(0);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendar = async () => {
    if (!project?.id) { setError('No project found'); return; }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          hoursPerDay,
          daysPerWeek,
          startDate: getLocalDateString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      setCalendarData(data.calendarData);
      setCalendarId(data.id);
      setExpandedWeek(0);
      onCreditsUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to generate schedule.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGoal = useCallback((goalId: string) => {
    if (!calendarData || !calendarId) return;

    // Find current state of the goal
    let newCompleted = false;
    for (const w of calendarData.weeks) {
      for (const d of w.days) {
        for (const g of d.goals) {
          if (g.id === goalId) newCompleted = !g.completed;
        }
      }
    }

    // Update local state
    setCalendarData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          days: w.days.map(d => ({
            ...d,
            goals: d.goals.map(g =>
              g.id === goalId ? { ...g, completed: newCompleted } : g
            ),
          })),
        })),
      };
    });

    // Batch pending saves
    pendingSavesRef.current.set(goalId, newCompleted);

    // Debounced batch save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const saves = new Map(pendingSavesRef.current);
      pendingSavesRef.current.clear();

      for (const [gid, comp] of saves) {
        fetch('/api/ai/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendarId, goalId: gid, completed: comp }),
        }).catch(console.error);
      }
    }, 800);
  }, [calendarData, calendarId]);

  const handleNewSchedule = () => {
    if (calendarData) {
      setHoursPerDay(calendarData.hoursPerDay);
      setDaysPerWeek(calendarData.daysPerWeek);
    }
    setCalendarData(null);
    setCalendarId(null);
  };

  // ============================================
  // Loading State
  // ============================================

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // ============================================
  // Setup View
  // ============================================

  if (!calendarData) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-8">
          <div className="text-center mb-8">
            <Target className="w-10 h-10 mx-auto text-[#58cc02] mb-3" />
            <h3 className="font-black text-gray-900 text-xl mb-1">Plan Your Schedule</h3>
            <p className="text-gray-500 text-sm">
              Get a daily breakdown of exactly what to work on and for how long.
            </p>
          </div>

          {/* Hours per day */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Hours per day
            </label>
            <div className="flex gap-2">
              {HOURS_OPTIONS.map(h => (
                <button
                  key={h}
                  onClick={() => setHoursPerDay(h)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    hoursPerDay === h
                      ? 'bg-[#58cc02] text-white shadow-[0_3px_0_#58a700]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Days per week */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Days per week
            </label>
            <div className="flex gap-2">
              {DAYS_OPTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDaysPerWeek(d.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    daysPerWeek === d.value
                      ? 'bg-[#1cb0f6] text-white shadow-[0_3px_0_#0099dd]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project info */}
          {project?.finalTitle && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{project.finalTitle}</p>
                <p className="text-xs text-gray-500">
                  {[project.platform, project.teamSize, project.timeHorizon].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs mb-4">{error}</div>
          )}

          <button
            onClick={generateCalendar}
            disabled={isGenerating || !project?.id}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              !isGenerating && project?.id
                ? 'bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <><Loader2 size={16} className="animate-spin" /> Building your schedule...</>
            ) : (
              <><Sparkles size={16} /> Generate Schedule (1 credit)</>
            )}
          </button>

          {credits && (
            <p className="text-center text-[11px] text-gray-400 mt-2">
              {credits.remaining} credits remaining
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // Calendar View
  // ============================================

  const progress = getProgress(calendarData);
  const todayInfo = getTodayInfo(calendarData);
  const todayGoals = todayInfo.status === 'working_day'
    ? calendarData.weeks[todayInfo.weekIndex]?.days[todayInfo.dayIndex]?.goals || []
    : [];
  const todayWeek = todayInfo.status === 'working_day'
    ? calendarData.weeks[todayInfo.weekIndex]
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* ── Progress Header ── */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-gray-900 text-base">
              {project?.finalTitle || 'Your Game'}
            </h3>
            <p className="text-xs text-gray-500">
              {calendarData.hoursPerDay}h/day · {calendarData.daysPerWeek} days/wk · {calendarData.totalWeeks} weeks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-black text-gray-900">{progress.percent}%</span>
              <p className="text-[10px] text-gray-400 font-medium">{progress.completed}/{progress.total} tasks</p>
            </div>
            <button
              onClick={handleNewSchedule}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all group"
              title="Create new schedule"
            >
              <RotateCcw size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percent}%`,
              backgroundColor: progress.percent === 100 ? '#58cc02' : '#1cb0f6',
            }}
          />
        </div>
      </div>

      {/* ── Today Card ── */}
      {todayInfo.status === 'working_day' && todayGoals.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#58cc02] shadow-[0_4px_0_#58a700] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#58cc02]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#58cc02]" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-sm">TODAY&apos;S GOALS</h4>
                <p className="text-[11px] text-gray-500">
                  {todayWeek?.focus} &middot; Week {(todayInfo as any).weekIndex + 1}, Day {(todayInfo as any).dayIndex + 1}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
              <Clock size={12} />
              <span>{todayGoals.reduce((sum, g) => sum + g.hours, 0)}h</span>
            </div>
          </div>

          <div className="space-y-2">
            {todayGoals.map((goal) => {
              const cat = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.planning;
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left ${
                    goal.completed
                      ? 'bg-[#58cc02]/5'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {goal.completed ? (
                    <CheckCircle2 size={22} className="text-[#58cc02] shrink-0" />
                  ) : (
                    <Circle size={22} className="text-gray-300 shrink-0" />
                  )}
                  <span className={`flex-1 text-sm font-medium ${goal.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {goal.title}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: cat.color, backgroundColor: cat.bg }}
                  >
                    {cat.label}
                  </span>
                  <span className="text-xs font-bold text-gray-400 shrink-0">
                    {goal.hours}h
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Status Messages ── */}
      {todayInfo.status === 'rest_day' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] p-5 text-center">
          <Coffee className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-gray-700 text-sm">Rest Day</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Next session: {formatDate(todayInfo.nextDate)}
          </p>
        </div>
      )}

      {todayInfo.status === 'not_started' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] p-5 text-center">
          <Calendar className="w-8 h-8 mx-auto text-[#1cb0f6] mb-2" />
          <p className="font-bold text-gray-700 text-sm">
            Plan starts {formatDate(todayInfo.nextDate)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Review your schedule below</p>
        </div>
      )}

      {todayInfo.status === 'completed' && (
        <div className="bg-[#58cc02]/5 rounded-2xl border-2 border-[#58cc02] shadow-[0_3px_0_#58a700] p-5 text-center">
          <Check className="w-8 h-8 mx-auto text-[#58cc02] mb-2" />
          <p className="font-bold text-gray-900 text-sm">Schedule Complete!</p>
          <p className="text-xs text-gray-500 mt-0.5">
            You&apos;ve reached the end of your plan. Great work!
          </p>
        </div>
      )}

      {/* ── Week List ── */}
      <div className="space-y-2">
        {calendarData.weeks.map((week, wi) => {
          const wp = getWeekProgress(week);
          const isExpanded = expandedWeek === wi;
          const isCurrent = todayInfo.status === 'working_day' && todayInfo.weekIndex === wi;

          return (
            <div
              key={wi}
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                isCurrent
                  ? 'border-[#1cb0f6] shadow-[0_3px_0_#0099dd]'
                  : wp.allDone
                    ? 'border-[#58cc02]/30 shadow-[0_3px_0_#e5e7eb]'
                    : 'border-gray-200 shadow-[0_3px_0_#e5e7eb]'
              }`}
            >
              {/* Week Header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : wi)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-all"
              >
                {wp.allDone ? (
                  <CheckCircle2 size={18} className="text-[#58cc02] shrink-0" />
                ) : isCurrent ? (
                  <Play size={16} className="text-[#1cb0f6] shrink-0 fill-[#1cb0f6]" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center">
                    <span className="text-[8px] font-black text-gray-400">{week.week}</span>
                  </div>
                )}

                <div className="flex-1 text-left min-w-0">
                  <span className={`font-bold text-sm ${isCurrent ? 'text-[#1cb0f6]' : wp.allDone ? 'text-[#58cc02]' : 'text-gray-900'}`}>
                    Week {week.week}
                  </span>
                  <span className="text-xs text-gray-400 mx-1.5">&mdash;</span>
                  <span className="text-xs text-gray-500">{week.focus}</span>
                </div>

                <span className={`text-[11px] font-bold shrink-0 ${wp.allDone ? 'text-[#58cc02]' : 'text-gray-400'}`}>
                  {wp.completed}/{wp.total}
                </span>

                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
              </button>

              {/* Week Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Milestone */}
                  {week.milestone && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-500 shrink-0" />
                      <span className="text-xs text-amber-700 font-medium">{week.milestone}</span>
                    </div>
                  )}

                  {/* Days */}
                  {week.days.map((day, di) => {
                    const isToday = todayInfo.status === 'working_day'
                      && todayInfo.weekIndex === wi
                      && todayInfo.dayIndex === di;
                    const dayDate = getDateForWorkingDay(
                      calendarData.startDate,
                      calendarData.daysPerWeek,
                      wi * calendarData.daysPerWeek + di + 1
                    );
                    const allDayDone = day.goals.length > 0 && day.goals.every(g => g.completed);
                    const dayHours = day.goals.reduce((sum, g) => sum + g.hours, 0);

                    return (
                      <div
                        key={di}
                        className={`rounded-xl transition-all ${
                          isToday
                            ? 'bg-[#1cb0f6]/5 border border-[#1cb0f6]/20 p-3'
                            : 'p-1'
                        }`}
                      >
                        {/* Day Header */}
                        <div className={`flex items-center gap-2 mb-1.5 ${isToday ? '' : 'px-2'}`}>
                          {isToday && (
                            <span className="text-[9px] font-black text-[#1cb0f6] bg-[#1cb0f6]/10 px-1.5 py-0.5 rounded uppercase">
                              Today
                            </span>
                          )}
                          <span className={`text-xs font-bold ${allDayDone ? 'text-gray-300' : isToday ? 'text-[#1cb0f6]' : 'text-gray-600'}`}>
                            Day {day.day}
                          </span>
                          <span className="text-[10px] text-gray-300">{formatDate(dayDate)}</span>
                          <span className="text-[10px] text-gray-300 ml-auto">{dayHours}h</span>
                        </div>

                        {/* Goals */}
                        <div className="space-y-1">
                          {day.goals.map((goal) => {
                            const cat = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.planning;
                            return (
                              <button
                                key={goal.id}
                                onClick={() => toggleGoal(goal.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                                  goal.completed
                                    ? 'opacity-50'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                {goal.completed ? (
                                  <CheckCircle2 size={16} className="text-[#58cc02] shrink-0" />
                                ) : (
                                  <Circle size={16} className="text-gray-300 shrink-0" />
                                )}
                                <span className={`flex-1 text-xs ${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {goal.title}
                                </span>
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ color: cat.color, backgroundColor: cat.bg }}
                                >
                                  {cat.label}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium shrink-0">
                                  {goal.hours}h
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
