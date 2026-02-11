'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Target, Loader2, Sparkles, Clock, ChevronDown, ChevronRight,
  Check, Calendar, RotateCcw, Coffee, CheckCircle2, Circle,
  Flame, Package,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

// ============================================
// Types
// ============================================

interface Task {
  id: string;
  title: string;
  why?: string;
  hours: number;
  category: 'design' | 'art' | 'code' | 'audio' | 'testing' | 'polish' | 'planning';
  completed: boolean;
}

interface DayPlan {
  day: number;
  goals: Task[];
}

interface WeekPlan {
  week: number;
  focus: string;
  deliverable?: string;
  days: DayPlan[];
  milestone: string;
}

interface CalendarPlanData {
  weeks: WeekPlan[];
  totalWeeks: number;
  hoursPerDay: number;
  daysPerWeek: number;
  startDate: string;
  timeline?: string;
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
const TIMELINE_OPTIONS = [
  { value: '1 week', label: '1 week' },
  { value: '1 month', label: '1 month' },
  { value: '3 months', label: '3 months' },
  { value: '6 months', label: '6 months' },
];

// ============================================
// Helpers (pure functions, no allocations on render)
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

  if (today < start) return { status: 'not_started', nextDate: start };

  if (!isWorkingDay(today, data.daysPerWeek)) {
    const next = new Date(today);
    for (let i = 1; i <= 7; i++) {
      next.setDate(next.getDate() + 1);
      if (isWorkingDay(next, data.daysPerWeek)) return { status: 'rest_day', nextDate: next };
    }
    return { status: 'completed' };
  }

  let workingDayIndex = 0;
  const cursor = new Date(start);
  while (!isSameDay(cursor, today)) {
    if (isWorkingDay(cursor, data.daysPerWeek)) workingDayIndex++;
    cursor.setDate(cursor.getDate() + 1);
    if (cursor > today) return { status: 'completed' };
  }

  const totalWorkingDays = (data.weeks || []).reduce((sum, w) => sum + (w.days?.length || 0), 0);
  if (workingDayIndex >= totalWorkingDays) return { status: 'completed' };

  const weekIndex = Math.floor(workingDayIndex / data.daysPerWeek);
  const dayIndex = workingDayIndex % data.daysPerWeek;
  return { status: 'working_day', weekIndex, dayIndex };
}

/** Precompute ALL working day dates in one pass instead of per-day O(n) */
function precomputeDates(startDate: string, daysPerWeek: number, totalDays: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(startDate + 'T12:00:00');
  let count = 0;
  for (let i = 0; i < 1000 && count < totalDays; i++) {
    if (isWorkingDay(cursor, daysPerWeek)) {
      dates.push(new Date(cursor));
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function formatDeadline(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getProgress(data: CalendarPlanData) {
  let total = 0, completed = 0;
  for (const w of data.weeks || []) for (const d of w.days || []) for (const g of d.goals || []) { total++; if (g.completed) completed++; }
  return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getStreak(data: CalendarPlanData, todayInfo: TodayInfo): number {
  if (todayInfo.status !== 'working_day' || !data.weeks) return 0;
  let streak = 0;
  let wi = todayInfo.weekIndex, di = todayInfo.dayIndex - 1;
  while (true) {
    if (di < 0) { wi--; if (wi < 0) break; di = (data.weeks[wi]?.days?.length || 1) - 1; }
    const day = data.weeks[wi]?.days?.[di];
    if (!day || !day.goals?.length || !day.goals.every(g => g.completed)) break;
    streak++; di--;
  }
  const today = data.weeks[todayInfo.weekIndex]?.days?.[todayInfo.dayIndex];
  if (today && today.goals?.length > 0 && today.goals.every(g => g.completed)) streak++;
  return streak;
}

function getWeekHours(week: WeekPlan | null) {
  if (!week) return { done: 0, total: 0 };
  let done = 0, total = 0;
  for (const d of week.days || []) for (const g of d.goals || []) { total += g.hours; if (g.completed) done += g.hours; }
  return { done, total };
}

function isShortTimeline(data: CalendarPlanData): boolean {
  return data.totalWeeks <= 4;
}

// ============================================
// Component
// ============================================

export function DevCalendar({ credits, onCreditsUpdate }: Props) {
  const { project } = useProject();

  const [calendarData, setCalendarData] = useState<CalendarPlanData | null>(null);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [timeline, setTimeline] = useState('1 month');

  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const pendingSavesRef = useRef<Map<string, boolean>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const calendarIdRef = useRef<string | null>(null);

  useEffect(() => { calendarIdRef.current = calendarId; }, [calendarId]);

  useEffect(() => {
    if (project?.timeHorizon) setTimeline(project.timeHorizon);
  }, [project?.timeHorizon]);

  useEffect(() => {
    if (project?.id) loadCalendar();
    else setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const cid = calendarIdRef.current;
      if (pendingSavesRef.current.size > 0 && cid) {
        const entries = Array.from(pendingSavesRef.current.entries());
        pendingSavesRef.current.clear();
        entries.forEach(([gid, comp]) => {
          fetch('/api/ai/calendar', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendarId: cid, goalId: gid, completed: comp }),
          }).catch(() => {});
        });
      }
    };
  }, []);

  // Precompute all dates once when calendarData changes (not per-render)
  const dayDates = useMemo(() => {
    if (!calendarData?.weeks) return [];
    const totalDays = calendarData.weeks.reduce((sum, w) => sum + (w.days?.length || 0), 0);
    return precomputeDates(calendarData.startDate, calendarData.daysPerWeek, totalDays);
  }, [calendarData?.startDate, calendarData?.daysPerWeek, calendarData?.weeks?.length]);

  const loadCalendar = async () => {
    try {
      const res = await fetch(`/api/ai/calendar?projectId=${project!.id}`);
      if (res.ok) {
        const data = await res.json();
        const cal = data.calendarData;
        // Validate the data has the expected format (weeks array with days/goals)
        // Old calendar data (Gantt chart format) has "phases" instead of "weeks" — skip it
        if (cal && Array.isArray(cal.weeks) && cal.weeks.length > 0 && cal.weeks[0].days) {
          setCalendarData(cal);
          setCalendarId(data.id);
          if (cal.timeline) setTimeline(cal.timeline);
          const today = getTodayInfo(cal);
          if (today.status === 'working_day') setExpandedWeek(today.weekIndex);
          else if (cal.weeks.length > 0) setExpandedWeek(0);
        }
        // If old format, just show the setup form so user can regenerate
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
        body: JSON.stringify({ projectId: project.id, hoursPerDay, daysPerWeek, timeline, startDate: getLocalDateString() }),
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

  // toggleGoal does NOT depend on calendarData — uses functional setState
  const toggleGoal = useCallback((goalId: string) => {
    setCalendarData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          days: w.days.map(d => {
            const idx = d.goals.findIndex(g => g.id === goalId);
            if (idx === -1) return d;
            const newGoals = [...d.goals];
            newGoals[idx] = { ...newGoals[idx], completed: !newGoals[idx].completed };
            pendingSavesRef.current.set(goalId, newGoals[idx].completed);
            return { ...d, goals: newGoals };
          }),
        })),
      };
    });

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const cid = calendarIdRef.current;
      if (!cid) return;
      const entries = Array.from(pendingSavesRef.current.entries());
      pendingSavesRef.current.clear();
      entries.forEach(([gid, comp]) => {
        fetch('/api/ai/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendarId: cid, goalId: gid, completed: comp }),
        }).catch(console.error);
      });
    }, 800);
  }, []);

  const handleNewSchedule = useCallback(() => {
    setCalendarData(prev => {
      if (prev) {
        setHoursPerDay(prev.hoursPerDay);
        setDaysPerWeek(prev.daysPerWeek);
        if (prev.timeline) setTimeline(prev.timeline);
      }
      return null;
    });
    setCalendarId(null);
  }, []);

  // ============================================
  // Loading
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
            <h3 className="font-black text-gray-900 text-xl mb-1">Plan Your Release</h3>
            <p className="text-gray-500 text-sm">Break your game into tasks with deadlines so you ship on time.</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Timeline</label>
            <div className="flex gap-2">
              {TIMELINE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => setTimeline(t.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${
                    timeline === t.value ? 'bg-[#a560e8] text-white shadow-[0_3px_0_#8b47cc]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Hours per day</label>
            <div className="flex gap-2">
              {HOURS_OPTIONS.map(h => (
                <button key={h} onClick={() => setHoursPerDay(h)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${
                    hoursPerDay === h ? 'bg-[#58cc02] text-white shadow-[0_3px_0_#58a700]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{h}h</button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Days per week</label>
            <div className="flex gap-2">
              {DAYS_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setDaysPerWeek(d.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${
                    daysPerWeek === d.value ? 'bg-[#1cb0f6] text-white shadow-[0_3px_0_#0099dd]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>

          {project?.finalTitle && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{project.finalTitle}</p>
                <p className="text-xs text-gray-500">{[project.platform, project.teamSize].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
          )}

          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs mb-4">{error}</div>}

          <button onClick={generateCalendar} disabled={isGenerating || !project?.id}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
              !isGenerating && project?.id
                ? 'bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Building your schedule...</> : <><Sparkles size={16} /> Generate Schedule (1 credit)</>}
          </button>

          {credits && <p className="text-center text-[11px] text-gray-400 mt-2">{credits.remaining} credits remaining</p>}
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
  const todayWeek = todayInfo.status === 'working_day' ? calendarData.weeks[todayInfo.weekIndex] : null;
  const streak = getStreak(calendarData, todayInfo);
  const weekHours = getWeekHours(todayWeek);
  const shortPlan = isShortTimeline(calendarData);

  // Get precomputed date for a given week/day index
  const getDate = (wi: number, di: number): Date => {
    const idx = wi * calendarData.daysPerWeek + di;
    return dayDates[idx] || new Date();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress Header */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-gray-900 text-base">{project?.finalTitle || 'Your Game'}</h3>
            <p className="text-xs text-gray-500">
              {calendarData.timeline || `${calendarData.totalWeeks} weeks`} · {calendarData.hoursPerDay}h/day · {calendarData.daysPerWeek} days/wk
            </p>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5">
                <Flame size={14} className="text-orange-500" />
                <span className="text-xs font-black text-orange-600">{streak}</span>
              </div>
            )}
            <div className="text-right">
              <span className="text-xl font-black text-gray-900">{progress.percent}%</span>
              <p className="text-[10px] text-gray-400 font-medium">{progress.completed}/{progress.total} tasks</p>
            </div>
            <button onClick={handleNewSchedule} className="p-2 rounded-xl hover:bg-gray-100 group" title="New schedule">
              <RotateCcw size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress.percent}%`, backgroundColor: progress.percent === 100 ? '#58cc02' : '#1cb0f6' }} />
        </div>
      </div>

      {/* Today Card */}
      {todayInfo.status === 'working_day' && todayGoals.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#58cc02] shadow-[0_4px_0_#58a700] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#58cc02]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#58cc02]" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-sm">TODAY&apos;S TASKS</h4>
                <p className="text-[11px] text-gray-500">
                  {todayWeek?.focus} &middot; Week {(todayInfo as any).weekIndex + 1}, Day {(todayInfo as any).dayIndex + 1}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {weekHours.total > 0 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-600">{weekHours.done}h</span>
                  <span className="text-xs text-gray-400"> / {weekHours.total}h</span>
                  <p className="text-[9px] text-gray-400">this week</p>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <Clock size={12} />
                <span>{todayGoals.reduce((sum, g) => sum + g.hours, 0)}h today</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {todayGoals.map(task => {
              const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.planning;
              return (
                <button key={task.id} onClick={() => toggleGoal(task.id)}
                  className={`w-full flex items-start gap-3 px-3 py-3.5 rounded-xl text-left ${
                    task.completed ? 'bg-[#58cc02]/5' : 'bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <div className="mt-0.5">
                    {task.completed ? <CheckCircle2 size={22} className="text-[#58cc02]" /> : <Circle size={22} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                    {task.why && !task.completed && <span className="text-[10px] text-gray-400 block mt-0.5">{task.why}</span>}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ color: cat.color, backgroundColor: cat.bg }}>{cat.label}</span>
                  <span className="text-[10px] text-gray-400 font-medium shrink-0 mt-0.5">{task.hours}h</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {todayInfo.status === 'rest_day' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] p-5 text-center">
          <Coffee className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-gray-700 text-sm">Rest Day</p>
          <p className="text-xs text-gray-400 mt-0.5">Next session: {formatDeadline(todayInfo.nextDate)}</p>
        </div>
      )}
      {todayInfo.status === 'not_started' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] p-5 text-center">
          <Calendar className="w-8 h-8 mx-auto text-[#1cb0f6] mb-2" />
          <p className="font-bold text-gray-700 text-sm">Plan starts {formatDeadline(todayInfo.nextDate)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Review your tasks below</p>
        </div>
      )}
      {todayInfo.status === 'completed' && (
        <div className="bg-[#58cc02]/5 rounded-2xl border-2 border-[#58cc02] shadow-[0_3px_0_#58a700] p-5 text-center">
          <Check className="w-8 h-8 mx-auto text-[#58cc02] mb-2" />
          <p className="font-bold text-gray-900 text-sm">Schedule Complete!</p>
          <p className="text-xs text-gray-500 mt-0.5">You&apos;ve reached the end of your plan. Great work!</p>
        </div>
      )}

      {/* ── TASK LIST ── */}
      {shortPlan ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] p-4 space-y-4">
          {calendarData.weeks.map((week, wi) => (
            <div key={wi}>
              {calendarData.totalWeeks > 1 && (
                <div className="flex items-center gap-2 mb-3 mt-1">
                  {week.deliverable ? (
                    <><Package size={12} className="text-blue-500 shrink-0" /><span className="text-xs font-bold text-blue-700">{week.focus}</span><span className="text-[10px] text-blue-500">&mdash; {week.deliverable}</span></>
                  ) : (
                    <><Sparkles size={12} className="text-gray-400 shrink-0" /><span className="text-xs font-bold text-gray-600">{week.focus}</span></>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {week.days.map((day, di) => {
                  const isToday = todayInfo.status === 'working_day' && todayInfo.weekIndex === wi && todayInfo.dayIndex === di;
                  const dayDate = getDate(wi, di);
                  const allDone = day.goals.length > 0 && day.goals.every(g => g.completed);
                  const dayHours = day.goals.reduce((sum, g) => sum + g.hours, 0);
                  return (
                    <div key={di} className={`rounded-xl ${isToday ? 'bg-[#1cb0f6]/5 border border-[#1cb0f6]/20 p-3' : 'py-1'}`}>
                      <div className={`flex items-center gap-2 mb-2 ${isToday ? '' : 'px-1'}`}>
                        {isToday && <span className="text-[9px] font-black text-white bg-[#1cb0f6] px-2 py-0.5 rounded uppercase">Today</span>}
                        <span className={`text-xs font-bold ${allDone ? 'text-[#58cc02]' : isToday ? 'text-[#1cb0f6]' : 'text-gray-700'}`}>
                          Complete by {formatDeadline(dayDate)}
                        </span>
                        {allDone && <CheckCircle2 size={12} className="text-[#58cc02]" />}
                        <span className="text-[10px] text-gray-400 ml-auto">{dayHours}h</span>
                      </div>
                      <div className="space-y-1">
                        {day.goals.map(task => {
                          const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.planning;
                          return (
                            <button key={task.id} onClick={() => toggleGoal(task.id)}
                              className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left ${
                                task.completed ? 'opacity-50' : 'hover:bg-gray-50'
                              }`}>
                              <div className="mt-0.5">
                                {task.completed ? <CheckCircle2 size={18} className="text-[#58cc02]" /> : <Circle size={18} className="text-gray-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs block ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                                {task.why && !task.completed && <span className="text-[10px] text-gray-400 block mt-0.5">{task.why}</span>}
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ color: cat.color, backgroundColor: cat.bg }}>{cat.label}</span>
                              <span className="text-[10px] text-gray-400 font-medium shrink-0 mt-0.5">{task.hours}h</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {calendarData.weeks.map((week, wi) => {
            const isExpanded = expandedWeek === wi;
            const isCurrent = todayInfo.status === 'working_day' && todayInfo.weekIndex === wi;
            let weekDone = 0, weekTotal = 0;
            for (const d of week.days) for (const g of d.goals) { weekTotal++; if (g.completed) weekDone++; }
            const allDone = weekTotal > 0 && weekDone === weekTotal;

            return (
              <div key={wi} className={`bg-white rounded-2xl border-2 overflow-hidden ${
                isCurrent ? 'border-[#1cb0f6] shadow-[0_3px_0_#0099dd]'
                  : allDone ? 'border-[#58cc02]/30 shadow-[0_3px_0_#e5e7eb]'
                  : 'border-gray-200 shadow-[0_3px_0_#e5e7eb]'
              }`}>
                <button onClick={() => setExpandedWeek(isExpanded ? null : wi)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50">
                  {allDone ? <CheckCircle2 size={18} className="text-[#58cc02] shrink-0" /> : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center">
                      <span className="text-[8px] font-black text-gray-400">{week.week}</span>
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <span className={`font-bold text-sm ${isCurrent ? 'text-[#1cb0f6]' : allDone ? 'text-[#58cc02]' : 'text-gray-900'}`}>Week {week.week}</span>
                    <span className="text-xs text-gray-400 mx-1.5">&mdash;</span>
                    <span className="text-xs text-gray-500">{week.focus}</span>
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ${allDone ? 'text-[#58cc02]' : 'text-gray-400'}`}>{weekDone}/{weekTotal}</span>
                  {isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {week.deliverable && (
                      <div className="bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Package size={12} className="text-blue-500 shrink-0" />
                        <span className="text-xs text-blue-700 font-bold">Deliverable:</span>
                        <span className="text-xs text-blue-600">{week.deliverable}</span>
                      </div>
                    )}
                    {week.days.map((day, di) => {
                      const isToday = todayInfo.status === 'working_day' && todayInfo.weekIndex === wi && todayInfo.dayIndex === di;
                      const dayDate = getDate(wi, di);
                      const allDayDone = day.goals.length > 0 && day.goals.every(g => g.completed);
                      const dayHours = day.goals.reduce((sum, g) => sum + g.hours, 0);
                      return (
                        <div key={di} className={`rounded-xl ${isToday ? 'bg-[#1cb0f6]/5 border border-[#1cb0f6]/20 p-3' : 'py-1'}`}>
                          <div className={`flex items-center gap-2 mb-2 ${isToday ? '' : 'px-1'}`}>
                            {isToday && <span className="text-[9px] font-black text-white bg-[#1cb0f6] px-2 py-0.5 rounded uppercase">Today</span>}
                            <span className={`text-xs font-bold ${allDayDone ? 'text-[#58cc02]' : isToday ? 'text-[#1cb0f6]' : 'text-gray-700'}`}>
                              Complete by {formatDeadline(dayDate)}
                            </span>
                            {allDayDone && <CheckCircle2 size={12} className="text-[#58cc02]" />}
                            <span className="text-[10px] text-gray-400 ml-auto">{dayHours}h</span>
                          </div>
                          <div className="space-y-1">
                            {day.goals.map(task => {
                              const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.planning;
                              return (
                                <button key={task.id} onClick={() => toggleGoal(task.id)}
                                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left ${
                                    task.completed ? 'opacity-50' : 'hover:bg-gray-50'
                                  }`}>
                                  <div className="mt-0.5">
                                    {task.completed ? <CheckCircle2 size={18} className="text-[#58cc02]" /> : <Circle size={18} className="text-gray-300" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-xs block ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                                    {task.why && !task.completed && <span className="text-[10px] text-gray-400 block mt-0.5">{task.why}</span>}
                                  </div>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ color: cat.color, backgroundColor: cat.bg }}>{cat.label}</span>
                                  <span className="text-[10px] text-gray-400 font-medium shrink-0 mt-0.5">{task.hours}h</span>
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
      )}
    </div>
  );
}
