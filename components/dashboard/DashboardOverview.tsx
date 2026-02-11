'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { ComprehensiveValidation } from '@/lib/validationAgents';
import { checkValidationReadiness } from '@/lib/validationRequirements';
import {
  Bot, Trophy, TrendingUp, RefreshCw, AlertTriangle, Zap, Gamepad2,
  ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const getStyle = (s: number) => {
    if (s >= 8) return { border: 'border-[#58cc02]', bg: 'bg-[#d7ffb8]', text: 'text-[#58a700]', shadow: 'shadow-[0_4px_0_#58a700]' };
    if (s >= 6) return { border: 'border-[#1cb0f6]', bg: 'bg-[#ddf4ff]', text: 'text-[#1899d6]', shadow: 'shadow-[0_4px_0_#1899d6]' };
    if (s >= 4) return { border: 'border-[#ff9600]', bg: 'bg-[#fff4e0]', text: 'text-[#ea7900]', shadow: 'shadow-[0_4px_0_#ea7900]' };
    return { border: 'border-[#ff4b4b]', bg: 'bg-[#ffe0e0]', text: 'text-[#ea2b2b]', shadow: 'shadow-[0_4px_0_#ea2b2b]' };
  };
  const style = getStyle(score);
  return (
    <div className="text-center">
      <div className={`w-14 h-14 rounded-2xl border-2 ${style.border} ${style.bg} ${style.shadow} flex items-center justify-center mx-auto mb-1`}>
        <span className={`text-xl font-black ${style.text}`}>{score}</span>
      </div>
      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export function DashboardOverview() {
  const { project } = useProject();
  const [validation, setValidation] = useState<ComprehensiveValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readiness = useMemo(() => checkValidationReadiness(project), [project]);
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  useEffect(() => {
    if (project && !validation && !loading && readiness.isReady && aiEnabled) {
      runValidation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, readiness.isReady]);

  const runValidation = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/validateComprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) throw new Error('Failed to validate');
      const result = await res.json();
      const { validationRunId, ...data } = result;
      setValidation(data as ComprehensiveValidation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  // Not enough data yet
  if (!readiness.isReady) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-6 text-center space-y-3">
          <Gamepad2 className="w-10 h-10 mx-auto text-pink-500" />
          <h2 className="font-bold text-gray-900">Complete Your Journey First</h2>
          <p className="text-gray-500 text-sm">Finish the game creation steps to see your AI validation results here.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200 text-center">
          <Bot className="w-10 h-10 text-pink-600 mx-auto mb-3" />
          <div className="font-bold text-pink-700 text-lg">AI is Analyzing Your Game</div>
          <p className="text-pink-500 text-sm mt-1">4 specialized agents are reviewing your idea...</p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Market</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Loop</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Competitor</span>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full animate-pulse font-medium">Verdict</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-[0_4px_0_#fca5a5] p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
          <h2 className="font-bold text-gray-900">Validation Failed</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <Button onClick={runValidation} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!validation) return null;

  const fv = validation.finalVerdict;
  const verdict = fv?.verdict || 'needs_work';
  const overall = fv?.overallScore || 0;
  const marketScore = validation.marketAnalysis?.score || 0;
  const loopScore = validation.loopAnalysis?.score || 0;
  const compScore = validation.competitorAnalysis?.score || 0;

  const vc = {
    strong: { label: 'Build It!', color: 'text-[#58a700]', bg: 'bg-[#d7ffb8]', border: 'border-[#58cc02]', shadow: 'shadow-[0_4px_0_#58a700]' },
    promising: { label: 'Promising', color: 'text-[#1899d6]', bg: 'bg-[#ddf4ff]', border: 'border-[#1cb0f6]', shadow: 'shadow-[0_4px_0_#1899d6]' },
    needs_work: { label: 'Needs Work', color: 'text-[#ea7900]', bg: 'bg-[#fff4e0]', border: 'border-[#ff9600]', shadow: 'shadow-[0_4px_0_#ea7900]' },
    rethink: { label: 'Rethink', color: 'text-[#ea2b2b]', bg: 'bg-[#ffe0e0]', border: 'border-[#ff4b4b]', shadow: 'shadow-[0_4px_0_#ea2b2b]' },
  }[verdict] || { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', shadow: 'shadow-[0_4px_0_#d1d5db]' };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* AI Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Bot className="w-4 h-4" />
        <span className="font-medium">Analyzed by AI &mdash; 4 specialized agents</span>
      </div>

      {/* Verdict Card */}
      <div className={`${vc.bg} ${vc.border} border-2 rounded-2xl ${vc.shadow} p-6 text-center`}>
        <div className={`text-2xl font-black ${vc.color} uppercase tracking-wide`}>{vc.label}</div>
        <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-md mx-auto">{fv?.summary}</p>

        <div className="flex justify-center mt-6 pt-4 border-t border-white/50">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-2xl border-2 ${
              overall >= 8 ? 'border-[#58cc02] bg-[#d7ffb8] shadow-[0_4px_0_#58a700]' :
              overall >= 6 ? 'border-[#1cb0f6] bg-[#ddf4ff] shadow-[0_4px_0_#1899d6]' :
              overall >= 4 ? 'border-[#ff9600] bg-[#fff4e0] shadow-[0_4px_0_#ea7900]' :
              'border-[#ff4b4b] bg-[#ffe0e0] shadow-[0_4px_0_#ea2b2b]'
            } flex items-center justify-center mx-auto mb-2`}>
              <span className={`text-3xl font-black ${
                overall >= 8 ? 'text-[#58a700]' :
                overall >= 6 ? 'text-[#1899d6]' :
                overall >= 4 ? 'text-[#ea7900]' : 'text-[#ea2b2b]'
              }`}>{overall}</span>
            </div>
            <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Overall Score</div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <ScoreCircle score={marketScore} label="Market" />
          <ScoreCircle score={loopScore} label="Loop" />
          <ScoreCircle score={compScore} label="Edge" />
        </div>
      </div>

      {/* Hard Truth */}
      {fv?.hardTruth && (
        <div className="bg-[#fff4e0] border-2 border-[#ff9600] rounded-2xl shadow-[0_4px_0_#ea7900] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#ff9600] rounded-xl flex items-center justify-center shadow-[0_2px_0_#ea7900]">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[#ea7900] text-sm uppercase tracking-wide">Hard Truth</div>
              <p className="text-gray-700 text-sm mt-1 leading-relaxed">{fv.hardTruth}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      {validation.marketAnalysis && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Genre</div>
            <div className="text-sm font-medium text-gray-800 mt-1">{validation.marketAnalysis.genre}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Trend</div>
            <div className="text-sm font-medium text-gray-800 mt-1">{validation.marketAnalysis.growthTrend}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border-2 border-gray-200 shadow-[0_3px_0_#e5e7eb] text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Saturation</div>
            <div className="text-sm font-medium text-gray-800 mt-1">{validation.marketAnalysis.saturationLevel}</div>
          </div>
        </div>
      )}

      {/* Dealbreakers */}
      {fv?.dealbreakers && fv.dealbreakers.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#ff4b4b] shadow-[0_4px_0_#ea2b2b] overflow-hidden">
          <div className="bg-[#ffe0e0] px-4 py-3 border-b-2 border-[#ff4b4b] flex items-center gap-2">
            <div className="w-7 h-7 bg-[#ff4b4b] rounded-lg flex items-center justify-center text-white text-sm shadow-[0_2px_0_#ea2b2b]">!</div>
            <span className="font-bold text-[#ea2b2b] uppercase tracking-wide text-sm">Dealbreakers</span>
          </div>
          <div className="p-4 space-y-2">
            {fv.dealbreakers.map((d: string, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 bg-[#ff4b4b] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">!</span>
                <span className="text-gray-700">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
