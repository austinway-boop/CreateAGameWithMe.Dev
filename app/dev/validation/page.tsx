'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { ValidationResult } from '@/lib/prompts';

// ============================================
// TEST DATA
// ============================================

const BAD_GAME_DATA: Partial<Project> = {
  hasIdea: true,
  platform: 'Roblox',
  teamSize: 'Solo',
  timeHorizon: '6 months',
  ideaDescription: 'An obby where you jump on platforms to reach the end. There are 100 levels and you can buy skips with Robux.',
  vibeChips: ['Action'],
  structuredIdea: {
    title: 'Super Jump Obby 2',
    conceptParagraph: 'A basic obby game where players jump across platforms to reach checkpoints.',
    coreVerbs: ['Jump', 'Skip'],
    loopHook: 'Complete levels to unlock more levels',
  },
  finalTitle: 'Super Jump Obby 2',
  finalConcept: 'A 100-level obby where players jump across platforms to reach checkpoints. Features include level skips for Robux, speed boost game passes, and a leaderboard. Its basically Tower of Hell but with easier jumps and more levels. Solo experience - no multiplayer features.',
  gameLoop: [
    { id: '1', type: 'action', label: 'Jump on platform', x: 100, y: 100, connections: ['2'], loopType: 'main' },
    { id: '2', type: 'challenge', label: 'Avoid falling', x: 200, y: 100, connections: ['3'], loopType: 'main' },
    { id: '3', type: 'reward', label: 'Reach checkpoint', x: 300, y: 100, connections: ['1'], loopType: 'main' },
  ],
  skillTree: [
    { id: '1', label: 'Basic Jumping', level: 'core', x: 100, y: 100, dependencies: [] },
    { id: '2', label: 'Timing', level: 'core', x: 200, y: 100, dependencies: [] },
  ],
  gameQuestions: {
    oneSentence: 'Jump on platforms to beat 100 levels',
    genre: 'Obby',
    genreSuccessRate: 'Low - extremely saturated',
    emotions: ['Satisfaction'],
    targetPlayer: 'Anyone who likes obbies',
    playerGames: ['Tower of Hell', 'Escape Room'],
    pricePoint: 'Free with paid skips (50 Robux per skip)',
    priceReason: 'Everyone does it this way',
    biggestRisk: 'There are thousands of obbies already',
    notFor: 'People who hate jumping games',
    memorableThing: 'Completing level 100',
  },
};

const GOOD_GAME_DATA: Partial<Project> = {
  hasIdea: true,
  platform: 'Roblox',
  teamSize: '2–5',
  timeHorizon: '3 months',
  ideaDescription: 'A social horror game where 4 players explore a haunted school at night. One player secretly becomes possessed by a ghost and must sabotage the others without being caught.',
  vibeChips: ['Horror', 'Social', 'Competitive'],
  structuredIdea: {
    title: 'Possessed Academy',
    conceptParagraph: 'A 4-player social horror experience set in a procedurally haunted school. Players must complete objectives while one secretly possessed player tries to eliminate others.',
    coreVerbs: ['Survive', 'Deceive', 'Investigate', 'Escape'],
    loopHook: 'Trust no one - your best friend might be possessed',
  },
  finalTitle: 'Possessed Academy',
  finalConcept: 'Among Us meets DOORS in a haunted school. 4 players spawn in a dark, abandoned school. One is secretly possessed by a ghost. Survivors must complete 5 objectives (find keys, restore power, solve ritual puzzles) to escape. The possessed player has ghost powers (teleport through walls, cause hallucinations, sabotage objectives) but must avoid being caught on security cameras or during group votes. Proximity voice chat means you can only hear nearby players. Rounds are 10-15 minutes. Monetization through cosmetic skins, private servers, and seasonal event passes.',
  gameLoop: [
    { id: '1', type: 'action', label: 'Explore school rooms', x: 100, y: 100, connections: ['2', '3'], loopType: 'main' },
    { id: '2', type: 'challenge', label: 'Complete objective', x: 200, y: 50, connections: ['4'], loopType: 'main' },
    { id: '3', type: 'challenge', label: 'Avoid possessed player', x: 200, y: 150, connections: ['5'], loopType: 'main' },
    { id: '4', type: 'reward', label: 'Progress toward escape', x: 300, y: 50, connections: ['1', '6'], loopType: 'main' },
    { id: '5', type: 'decision', label: 'Call emergency vote', x: 300, y: 150, connections: ['7'], loopType: 'main' },
    { id: '6', type: 'reward', label: 'Escape and win', x: 400, y: 100, connections: [], loopType: 'main' },
    { id: '7', type: 'action', label: 'Vote to exile player', x: 400, y: 150, connections: ['1'], loopType: 'main' },
    { id: '8', type: 'action', label: 'Use ghost powers', x: 100, y: 250, connections: ['9'], loopType: 'sub', loopName: 'Possessed' },
    { id: '9', type: 'challenge', label: 'Sabotage without being seen', x: 200, y: 250, connections: ['10'], loopType: 'sub', loopName: 'Possessed' },
    { id: '10', type: 'reward', label: 'Eliminate survivor', x: 300, y: 250, connections: ['8'], loopType: 'sub', loopName: 'Possessed' },
  ],
  skillTree: [
    { id: '1', label: 'Map Awareness', level: 'core', x: 100, y: 100, dependencies: [] },
    { id: '2', label: 'Sound Cues', level: 'core', x: 200, y: 100, dependencies: [] },
    { id: '3', label: 'Reading Player Behavior', level: 'advanced', x: 150, y: 200, dependencies: ['1', '2'] },
    { id: '4', label: 'Efficient Pathing', level: 'advanced', x: 250, y: 200, dependencies: ['1'] },
    { id: '5', label: 'Deception (as possessed)', level: 'advanced', x: 350, y: 200, dependencies: ['3'] },
    { id: '6', label: 'Vote Manipulation', level: 'expert', x: 200, y: 300, dependencies: ['3', '5'] },
    { id: '7', label: 'Speed Running Objectives', level: 'expert', x: 300, y: 300, dependencies: ['4'] },
  ],
  gameQuestions: {
    oneSentence: 'Among Us meets DOORS - 4 players, one is secretly possessed, escape the haunted school',
    genre: 'Horror / Social Deduction',
    genreSuccessRate: 'High - horror is trending fast, social deduction proven',
    emotions: ['Fear', 'Suspicion', 'Relief', 'Excitement', 'Betrayal'],
    targetPlayer: 'Friend groups aged 13-18 who watch horror streams, play Among Us and DOORS',
    playerGames: ['DOORS', 'Piggy', 'Murder Mystery 2', 'Among Us', 'Phasmophobia'],
    pricePoint: 'Free with cosmetic skins and private servers',
    priceReason: 'Horror players love showing off status through rare skins',
    biggestRisk: 'Requires exactly 4 players - need good matchmaking',
    notFor: 'Solo players, very young kids, players who hate social deduction',
    memorableThing: 'The moment you realize your best friend has been possessed the whole time',
  },
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function DevValidationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<'bad' | 'good' | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  const runTest = async (data: Partial<Project>, type: 'bad' | 'good') => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTestType(type);
    setRawResponse('');

    try {
      const res = await fetch('/api/validateIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { id: 'dev-test', ...data } }),
      });

      const json = await res.json();
      setRawResponse(JSON.stringify(json, null, 2));

      if (!res.ok) {
        setError(json.message || 'API Error');
        return;
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-blue-600 bg-blue-100';
    if (score >= 4) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'strong') return 'text-green-700 bg-green-100';
    if (verdict === 'promising') return 'text-blue-700 bg-blue-100';
    if (verdict === 'needs_work') return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Validation Dev Tester</h1>
        <p className="text-gray-600 mb-6">Test the AI validation with preset game data</p>

        {/* Test Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => runTest(BAD_GAME_DATA, 'bad')}
            disabled={loading}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && testType === 'bad' ? 'Testing...' : '🎮 Test BAD Game (Obby)'}
          </button>
          <button
            onClick={() => runTest(GOOD_GAME_DATA, 'good')}
            disabled={loading}
            className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && testType === 'good' ? 'Testing...' : '🎮 Test GOOD Game (Horror)'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl p-6 mb-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Validating with AI...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-red-700 mb-2">Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            {rawResponse && (
              <details>
                <summary className="cursor-pointer text-red-500 text-sm">Show debug info</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-64">{rawResponse}</pre>
              </details>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Header Scores */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getVerdictColor(result.verdict)}`}>
                    {result.verdict.toUpperCase().replace('_', ' ')}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {testType === 'bad' ? 'Super Jump Obby 2' : 'Possessed Academy'}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </div>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className={`text-xl font-bold ${getScoreColor(result.marketFit?.score || 0)}`}>
                    {result.marketFit?.score || '?'}
                  </div>
                  <div className="text-xs text-gray-500">Market</div>
                </div>
                <div>
                  <div className={`text-xl font-bold ${getScoreColor(result.loopAnalysis?.score || 0)}`}>
                    {result.loopAnalysis?.score || '?'}
                  </div>
                  <div className="text-xs text-gray-500">Loop</div>
                </div>
                <div>
                  <div className={`text-xl font-bold ${getScoreColor(result.uniqueness?.score || 0)}`}>
                    {result.uniqueness?.score || '?'}
                  </div>
                  <div className="text-xs text-gray-500">Unique</div>
                </div>
                <div>
                  <div className={`text-xl font-bold ${getScoreColor(result.scopeAssessment?.score || 0)}`}>
                    {result.scopeAssessment?.score || '?'}
                  </div>
                  <div className="text-xs text-gray-500">Scope</div>
                </div>
              </div>
            </div>

            {/* Genre Analysis */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold mb-2">Genre Analysis</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Detected:</span> {result.genreAnalysis?.detectedGenre}</div>
                <div><span className="text-gray-500">Competition:</span> {result.genreAnalysis?.competitionLevel}</div>
                <div><span className="text-gray-500">Phase:</span> {result.genreAnalysis?.lifecyclePhase}</div>
                <div><span className="text-gray-500">Trend:</span> {result.genreAnalysis?.trend}</div>
                <div><span className="text-gray-500">Hot Genre:</span> {result.genreAnalysis?.isHotGenre ? '🔥 Yes' : 'No'}</div>
                <div><span className="text-gray-500">Competitors:</span> {result.genreAnalysis?.topCompetitors?.join(', ')}</div>
              </div>
            </div>

            {/* Summary & Hard Truth */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold mb-2">Summary</h3>
              <p className="text-gray-700 mb-4">{result.summary}</p>
              
              <h3 className="font-bold mb-2 text-red-600">Hard Truth</h3>
              <p className="text-gray-700">{result.hardTruth}</p>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-bold mb-2 text-green-600">Strengths</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {result.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-bold mb-2 text-amber-600">Concerns</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {result.concerns?.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>

            {/* Dealbreakers */}
            {result.dealbreakers && result.dealbreakers.length > 0 && (
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="font-bold mb-2 text-red-600">Dealbreakers</h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {result.dealbreakers.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold mb-2 text-blue-600">Suggestions</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            {/* Raw JSON */}
            <details className="bg-gray-800 rounded-xl p-4">
              <summary className="text-white font-bold cursor-pointer">Raw JSON Response</summary>
              <pre className="mt-4 text-xs text-green-400 overflow-auto max-h-96">{rawResponse}</pre>
            </details>
          </div>
        )}

        {/* Test Data Preview */}
        <details className="mt-6 bg-white rounded-xl p-4">
          <summary className="font-bold cursor-pointer">View Test Data</summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-red-600 mb-2">BAD Game Data</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(BAD_GAME_DATA, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-bold text-green-600 mb-2">GOOD Game Data</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(GOOD_GAME_DATA, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
