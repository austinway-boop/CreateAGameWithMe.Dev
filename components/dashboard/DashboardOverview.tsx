'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { ComprehensiveValidation } from '@/lib/validationAgents';
import { checkValidationReadiness } from '@/lib/validationRequirements';
import {
  Bot, RefreshCw, AlertTriangle, Gamepad2, Loader2,
  Trophy, TrendingUp, Zap,
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
      <div className={`w-16 h-16 rounded-2xl border-2 ${style.border} ${style.bg} ${style.shadow} flex items-center justify-center mx-auto mb-1.5`}>
        <span className={`text-2xl font-black ${style.text}`}>{score}</span>
      </div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export function DashboardOverview() {
  const { project } = useProject();
  const [validation, setValidation] = useState<ComprehensiveValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavedResult, setIsSavedResult] = useState(false);

  const readiness = useMemo(() => checkValidationReadiness(project), [project]);
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  useEffect(() => {
    if (project?.id && !validation && readiness.isReady && aiEnabled) {
      loadOrRunValidation();
    } else if (project && !readiness.isReady) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, readiness.isReady]);

  const loadOrRunValidation = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const savedRes = await fetch(`/api/validation-runs?projectId=${project.id}`);
      if (savedRes.ok) {
        const saved = await savedRes.json();
        if (saved.found && saved.result) {
          setValidation(saved.result as ComprehensiveValidation);
          setIsSavedResult(true);
          setLoading(false);
          return;
        }
      }
      await runValidation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const runValidation = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    setIsSavedResult(false);
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

  if (!readiness.isReady) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-8 text-center space-y-3">
          <Gamepad2 className="w-12 h-12 mx-auto text-pink-500" />
          <h2 className="text-lg font-black text-gray-900">Complete Your Journey First</h2>
          <p className="text-gray-500 text-[15px] leading-relaxed">Finish the game creation steps to see your AI validation results here.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 border-2 border-pink-200 text-center">
          <Bot className="w-12 h-12 text-pink-600 mx-auto mb-3" />
          <div className="font-black text-pink-700 text-xl">Loading Your Results</div>
          <p className="text-pink-500 text-[15px] mt-2">Checking for saved analysis...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4 text-pink-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-[0_4px_0_#fca5a5] p-8 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="text-lg font-black text-gray-900">Validation Failed</h2>
          <p className="text-gray-500 text-[15px]">{error}</p>
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
  const hardTruth = fv?.hardTruth || '';
  const dealbreakers = fv?.dealbreakers || [];

  const vc = {
    strong: { label: 'Build It!', color: 'text-[#58a700]', bg: 'bg-[#d7ffb8]', border: 'border-[#58cc02]', shadow: 'shadow-[0_4px_0_#58a700]' },
    promising: { label: 'Promising', color: 'text-[#1899d6]', bg: 'bg-[#ddf4ff]', border: 'border-[#1cb0f6]', shadow: 'shadow-[0_4px_0_#1899d6]' },
    needs_work: { label: 'Needs Work', color: 'text-[#ea7900]', bg: 'bg-[#fff4e0]', border: 'border-[#ff9600]', shadow: 'shadow-[0_4px_0_#ea7900]' },
    rethink: { label: 'Rethink', color: 'text-[#ea2b2b]', bg: 'bg-[#ffe0e0]', border: 'border-[#ff4b4b]', shadow: 'shadow-[0_4px_0_#ea2b2b]' },
  }[verdict] || { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', shadow: 'shadow-[0_4px_0_#d1d5db]' };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Bot className="w-4 h-4" />
          <span className="font-semibold">
            {isSavedResult ? 'Saved AI Analysis' : 'Analyzed by AI'} &mdash; 4 specialized agents
          </span>
        </div>
        <button onClick={runValidation} className="flex items-center gap-1.5 text-xs text-[#1cb0f6] font-bold hover:underline">
          <RefreshCw size={12} /> Re-analyze
        </button>
      </div>

      {/* Verdict Card */}
      <div className={`${vc.bg} ${vc.border} border-2 rounded-2xl ${vc.shadow} p-8 text-center`}>
        <div className={`text-3xl font-black ${vc.color} uppercase tracking-wide`}>{vc.label}</div>
        <p className="text-gray-700 mt-4 text-base leading-relaxed max-w-lg mx-auto">{fv?.summary}</p>
        <div className="flex justify-center mt-8 pt-5 border-t border-white/50">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-2xl border-2 ${
              overall >= 8 ? 'border-[#58cc02] bg-[#d7ffb8] shadow-[0_4px_0_#58a700]' :
              overall >= 6 ? 'border-[#1cb0f6] bg-[#ddf4ff] shadow-[0_4px_0_#1899d6]' :
              overall >= 4 ? 'border-[#ff9600] bg-[#fff4e0] shadow-[0_4px_0_#ea7900]' :
              'border-[#ff4b4b] bg-[#ffe0e0] shadow-[0_4px_0_#ea2b2b]'
            } flex items-center justify-center mx-auto mb-2`}>
              <span className={`text-4xl font-black ${
                overall >= 8 ? 'text-[#58a700]' : overall >= 6 ? 'text-[#1899d6]' : overall >= 4 ? 'text-[#ea7900]' : 'text-[#ea2b2b]'
              }`}>{overall}</span>
            </div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Overall Score</div>
          </div>
        </div>
        <div className="flex justify-center gap-5 mt-5">
          <ScoreCircle score={marketScore} label="Market" />
          <ScoreCircle score={loopScore} label="Loop" />
          <ScoreCircle score={compScore} label="Edge" />
        </div>
      </div>

      {/* Hard Truth */}
      {hardTruth && (
        <div className="bg-[#fff4e0] border-2 border-[#ff9600] rounded-2xl shadow-[0_4px_0_#ea7900] p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-[#ff9600] rounded-xl flex items-center justify-center shadow-[0_2px_0_#ea7900] shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-[#ea7900] text-sm uppercase tracking-wider mb-2">Hard Truth</h3>
              <p className="text-gray-800 text-[15px] leading-relaxed">{hardTruth}</p>
            </div>
          </div>
        </div>
      )}

      {/* Competition */}
      {validation.competitorAnalysis && (
        <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b-2 border-[#ff9600]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#ff9600] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#ea7900]">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-black text-[#ea7900] uppercase tracking-wider text-sm">Competition</h3>
              <span className="ml-auto text-xs bg-[#ff9600] text-white px-2.5 py-1 rounded-full font-black">{compScore}/10</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {validation.competitorAnalysis.directCompetitors?.length > 0 && (
              <div className="space-y-2.5">
                {validation.competitorAnalysis.directCompetitors.slice(0, 3).map((comp: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-[#ff9600] text-white rounded-lg flex items-center justify-center font-black text-sm">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-[15px]">{comp.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{comp.visits}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {validation.competitorAnalysis.differentiationAnalysis && (
              <div className={`p-4 rounded-xl border ${
                validation.competitorAnalysis.differentiationAnalysis.toLowerCase().includes('weak') ||
                validation.competitorAnalysis.differentiationAnalysis.toLowerCase().includes('unclear')
                  ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600">Your Differentiation</h4>
                <p className="text-[15px] text-gray-800 leading-relaxed">{validation.competitorAnalysis.differentiationAnalysis}</p>
              </div>
            )}
            {(validation.competitorAnalysis.competitiveAdvantages?.length > 0 || validation.competitorAnalysis.competitiveDisadvantages?.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {validation.competitorAnalysis.competitiveAdvantages?.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="text-xs font-black text-green-700 uppercase tracking-wider mb-2.5">Your Edge</h4>
                    <ul className="space-y-2">
                      {validation.competitorAnalysis.competitiveAdvantages.slice(0, 3).map((adv: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 leading-snug flex items-start gap-2"><span className="text-green-500 font-bold mt-px">+</span>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validation.competitorAnalysis.competitiveDisadvantages?.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="text-xs font-black text-red-700 uppercase tracking-wider mb-2.5">Gaps</h4>
                    <ul className="space-y-2">
                      {validation.competitorAnalysis.competitiveDisadvantages.slice(0, 3).map((dis: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 leading-snug flex items-start gap-2"><span className="text-red-500 font-bold mt-px">&minus;</span>{dis}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market */}
      {validation.marketAnalysis && (
        <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4 border-b-2 border-[#1cb0f6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#1cb0f6] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#1899d6]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-black text-[#1899d6] uppercase tracking-wider text-sm">Market</h3>
              <span className="ml-auto text-xs bg-[#1cb0f6] text-white px-2.5 py-1 rounded-full font-black">{marketScore}/10</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                <div className="text-[10px] font-black text-[#1899d6] uppercase tracking-wider">Genre</div>
                <div className="text-[15px] font-semibold text-gray-800 mt-1">{validation.marketAnalysis.genre}</div>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                validation.marketAnalysis.growthTrend?.includes('rising') ? 'bg-green-50 border-green-200' :
                validation.marketAnalysis.growthTrend?.includes('declining') ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">Trend</div>
                <div className="text-[15px] font-semibold text-gray-800 mt-1">{validation.marketAnalysis.growthTrend}</div>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                validation.marketAnalysis.saturationLevel?.includes('extreme') || validation.marketAnalysis.saturationLevel?.includes('high')
                  ? 'bg-red-50 border-red-200' : validation.marketAnalysis.saturationLevel?.includes('low') ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">Saturation</div>
                <div className="text-[15px] font-semibold text-gray-800 mt-1">{validation.marketAnalysis.saturationLevel}</div>
              </div>
            </div>
            {validation.marketAnalysis.risks?.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <h4 className="text-xs font-black text-[#ea7900] uppercase tracking-wider mb-3">Market Risks</h4>
                <ul className="space-y-2.5">
                  {validation.marketAnalysis.risks.slice(0, 3).map((risk: string, i: number) => (
                    <li key={i} className="text-[15px] text-gray-800 leading-relaxed flex items-start gap-2.5">
                      <span className="text-amber-500 mt-1 shrink-0">&#x2022;</span>{risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* First 5 Minutes */}
      {validation.loopAnalysis?.firstSession && (
        <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 border-b-2 border-[#ffc800]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#ffc800] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#e6b400]">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-black text-[#b38f00] uppercase tracking-wider text-sm">First 5 Minutes</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <h4 className="text-xs font-black text-[#b38f00] uppercase tracking-wider mb-1.5">Time to Fun</h4>
                <div className="text-[15px] font-bold text-gray-900">{validation.loopAnalysis.firstSession.timeToFun}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <h4 className="text-xs font-black text-[#b38f00] uppercase tracking-wider mb-1.5">Tutorial Risk</h4>
                <div className="text-[15px] font-semibold text-gray-800">{validation.loopAnalysis.firstSession.tutorialRisk}</div>
              </div>
            </div>
            {validation.loopAnalysis.firstSession.hookMoment && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="text-xs font-black text-[#58a700] uppercase tracking-wider mb-1.5">Hook Moment</h4>
                <p className="text-[15px] text-gray-800 leading-relaxed">{validation.loopAnalysis.firstSession.hookMoment}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Core Loop */}
      {validation.loopAnalysis && (
        <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-4 border-b-2 border-[#a560e8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#a560e8] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#8b47cc]">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h3 className="font-black text-[#8b47cc] uppercase tracking-wider text-sm">Core Loop</h3>
              <span className="ml-auto text-xs bg-[#a560e8] text-white px-2.5 py-1 rounded-full font-black">{loopScore}/10</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {validation.loopAnalysis.primaryLoop && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-[15px] text-gray-800 leading-relaxed font-medium">{validation.loopAnalysis.primaryLoop}</p>
              </div>
            )}
            {validation.loopAnalysis.loopStrength && (
              <div className={`p-4 rounded-xl border ${
                validation.loopAnalysis.loopStrength.includes('strong') ? 'bg-green-50 border-green-200' :
                validation.loopAnalysis.loopStrength.includes('weak') ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600">Loop Assessment</h4>
                <p className="text-[15px] text-gray-800 leading-relaxed">{validation.loopAnalysis.loopStrength}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retention */}
      {validation.loopAnalysis?.retention && (
        <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] shadow-[0_4px_0_#d1d5db] overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 border-b-2 border-[#58cc02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#58cc02] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#58a700]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-black text-[#58a700] uppercase tracking-wider text-sm">Why Players Return</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              {validation.loopAnalysis.retention.whyComeBackTomorrow && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <h4 className="text-xs font-black text-[#58a700] uppercase tracking-wider mb-1.5">Tomorrow</h4>
                  <p className="text-[15px] text-gray-800 leading-relaxed">{validation.loopAnalysis.retention.whyComeBackTomorrow}</p>
                </div>
              )}
              {validation.loopAnalysis.retention.whyComeBackNextWeek && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-xs font-black text-[#1899d6] uppercase tracking-wider mb-1.5">Next Week</h4>
                  <p className="text-[15px] text-gray-800 leading-relaxed">{validation.loopAnalysis.retention.whyComeBackNextWeek}</p>
                </div>
              )}
            </div>
            {validation.loopAnalysis.retention.retentionKillers?.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h4 className="text-xs font-black text-[#ea2b2b] uppercase tracking-wider mb-3">Retention Killers</h4>
                <ul className="space-y-2.5">
                  {validation.loopAnalysis.retention.retentionKillers.map((killer: string, i: number) => (
                    <li key={i} className="text-[15px] text-gray-800 leading-relaxed flex items-start gap-2.5">
                      <span className="text-red-500 font-bold mt-px shrink-0">&times;</span>{killer}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dealbreakers */}
      {dealbreakers.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#ff4b4b] shadow-[0_4px_0_#ea2b2b] overflow-hidden">
          <div className="bg-[#ffe0e0] px-5 py-4 border-b-2 border-[#ff4b4b] flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#ff4b4b] rounded-lg flex items-center justify-center text-white shadow-[0_2px_0_#ea2b2b]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-black text-[#ea2b2b] uppercase tracking-wider text-sm">Dealbreakers</h3>
          </div>
          <div className="p-5 space-y-3">
            {dealbreakers.map((d: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#ff4b4b] text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">!</span>
                <span className="text-[15px] text-gray-800 leading-relaxed">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-400 pb-4 mt-6">
        AI-powered analysis of market data, game loops, and competition
      </p>
    </div>
  );
}
