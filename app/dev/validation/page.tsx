'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { ComprehensiveValidation } from '@/lib/validationAgents';

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
  const [result, setResult] = useState<ComprehensiveValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<'bad' | 'good' | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [agentStatus, setAgentStatus] = useState<string>('');

  const runTest = async (data: Partial<Project>, type: 'bad' | 'good') => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTestType(type);
    setRawResponse('');
    setAgentStatus('Starting 4-agent analysis...');

    try {
      setAgentStatus('Running Market, Loop & Competitor agents in parallel...');
      
      const res = await fetch('/api/validateComprehensive', {
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

      setAgentStatus('Complete!');
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
            <p className="text-gray-600 font-medium">{agentStatus}</p>
            <p className="text-xs text-gray-400 mt-1">Running 4 specialized AI agents...</p>
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
            {/* Header with Final Verdict */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getVerdictColor(result.finalVerdict.verdict)}`}>
                    {result.finalVerdict.verdict.toUpperCase().replace('_', ' ')}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {testType === 'bad' ? 'Super Jump Obby 2' : 'Possessed Academy'}
                  </span>
                </div>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl ${getScoreColor(result.finalVerdict.overallScore)}`}>
                  {result.finalVerdict.overallScore}
                </div>
              </div>

              {/* Agent Sub-scores */}
              <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(result.marketAnalysis.score)}`}>
                    {result.marketAnalysis.score}
                  </div>
                  <div className="text-xs text-gray-500">Market Agent</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(result.loopAnalysis.score)}`}>
                    {result.loopAnalysis.score}
                  </div>
                  <div className="text-xs text-gray-500">Loop Agent</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(result.competitorAnalysis.score)}`}>
                    {result.competitorAnalysis.score}
                  </div>
                  <div className="text-xs text-gray-500">Competitor Agent</div>
                </div>
              </div>
            </div>

            {/* Summary & Hard Truth */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold mb-2">Executive Summary</h3>
              <p className="text-gray-700 mb-4">{result.finalVerdict.summary}</p>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold mb-1 text-red-600">Hard Truth</h3>
                <p className="text-red-800">{result.finalVerdict.hardTruth}</p>
              </div>
              
              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold mb-1 text-blue-600">Build Recommendation</h3>
                <p className="text-blue-800">{result.finalVerdict.buildRecommendation}</p>
              </div>
            </div>

            {/* Market Analysis Agent */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">🎯 Market Analysis</h3>
                <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreColor(result.marketAnalysis.score)}`}>
                  {result.marketAnalysis.score}/10
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="text-gray-500">Genre:</span> <strong>{result.marketAnalysis.genre}</strong></div>
                <div><span className="text-gray-500">Sub-genres:</span> {result.marketAnalysis.subGenres?.join(', ')}</div>
                <div><span className="text-gray-500">Market Size:</span> {result.marketAnalysis.marketSize}</div>
                <div><span className="text-gray-500">Trend:</span> {result.marketAnalysis.growthTrend}</div>
                <div><span className="text-gray-500">Saturation:</span> {result.marketAnalysis.saturationLevel}</div>
              </div>
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Audience Profile:</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>{result.marketAnalysis.audienceProfile?.ageRange}</strong> • 
                  {result.marketAnalysis.audienceProfile?.playPatterns} • 
                  {result.marketAnalysis.audienceProfile?.spendingHabits}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-green-700 mb-1">Opportunities</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {result.marketAnalysis.opportunityWindows?.map((o, i) => <li key={i}>• {o}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Risks</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {result.marketAnalysis.risks?.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Loop Analysis Agent - DETAILED */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">🔄 Game Loop & Playability Analysis</h3>
                <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreColor(result.loopAnalysis.score)}`}>
                  {result.loopAnalysis.score}/10
                </span>
              </div>
              
              {/* Core Loop Overview */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="font-medium text-gray-800 mb-2">Core Loop</div>
                <p className="text-sm text-gray-700">{result.loopAnalysis.primaryLoop}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Mechanics: {result.loopAnalysis.coreMechanics?.join(' → ')}
                </div>
                <div className="mt-1 text-xs">
                  <span className={`font-medium ${
                    result.loopAnalysis.loopStrength?.includes('strong') ? 'text-green-600' :
                    result.loopAnalysis.loopStrength?.includes('moderate') ? 'text-amber-600' : 'text-red-600'
                  }`}>Strength: {result.loopAnalysis.loopStrength}</span>
                </div>
              </div>

              {/* Moment-to-Moment Feel */}
              {result.loopAnalysis.momentToMoment && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">⚡ Moment-to-Moment Feel</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-blue-600 font-medium">Core Verb</div>
                      <div className="text-gray-700">{result.loopAnalysis.momentToMoment.coreVerb}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-xs text-purple-600 font-medium">How It Feels</div>
                      <div className="text-gray-700">{result.loopAnalysis.momentToMoment.feeling}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-xs text-green-600 font-medium">Satisfaction Source</div>
                      <div className="text-gray-700">{result.loopAnalysis.momentToMoment.satisfactionSource}</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-xs text-red-600 font-medium">Frustration Risks</div>
                      <div className="text-gray-700 text-xs">{result.loopAnalysis.momentToMoment.frustrationRisks?.join(', ')}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* First Session Experience */}
              {result.loopAnalysis.firstSession && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">🎮 First Session Experience</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Hook Moment:</span> {result.loopAnalysis.firstSession.hookMoment}</div>
                    <div><span className="text-gray-500">Time to Fun:</span> <strong>{result.loopAnalysis.firstSession.timeToFun}</strong></div>
                    <div><span className="text-gray-500">Tutorial Risk:</span> {result.loopAnalysis.firstSession.tutorialRisk}</div>
                    <div><span className="text-gray-500">Aha Moment:</span> {result.loopAnalysis.firstSession.ahaMoment}</div>
                  </div>
                </div>
              )}

              {/* Retention Deep Dive */}
              {result.loopAnalysis.retention && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">📈 Retention Analysis</div>
                  <div className="space-y-2 text-sm">
                    <div className="bg-green-50 p-2 rounded">
                      <span className="text-green-700 font-medium">Today:</span> {result.loopAnalysis.retention.whyComeBackToday}
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <span className="text-blue-700 font-medium">Tomorrow:</span> {result.loopAnalysis.retention.whyComeBackTomorrow}
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <span className="text-purple-700 font-medium">Next Week:</span> {result.loopAnalysis.retention.whyComeBackNextWeek}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-xs font-medium text-green-700 mb-1">Daily Hooks</div>
                      <ul className="text-xs text-gray-600">
                        {result.loopAnalysis.retention.dailyHooks?.map((h, i) => <li key={i}>• {h}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-red-700 mb-1">Retention Killers</div>
                      <ul className="text-xs text-red-600">
                        {result.loopAnalysis.retention.retentionKillers?.map((k, i) => <li key={i}>✗ {k}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Structure */}
              {result.loopAnalysis.sessionStructure && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">⏱️ Session Structure</div>
                  <div className="text-sm space-y-2">
                    <div><span className="text-gray-500">Ideal Length:</span> <strong>{result.loopAnalysis.sessionStructure.idealLength}</strong></div>
                    <div><span className="text-gray-500">"One More Round" Factor:</span> {result.loopAnalysis.sessionStructure.oneMoreRoundFactor}</div>
                    <div className="bg-gray-50 p-2 rounded mt-2">
                      <div className="text-xs text-gray-500 mb-1">Session Flow:</div>
                      <p className="text-gray-700">{result.loopAnalysis.sessionStructure.sessionFlow}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progression */}
              {result.loopAnalysis.progression && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">📊 Progression Systems</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-xs text-green-600 font-medium">Short-term</div>
                      <div className="text-xs text-gray-700">{result.loopAnalysis.progression.shortTerm}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-xs text-blue-600 font-medium">Medium-term</div>
                      <div className="text-xs text-gray-700">{result.loopAnalysis.progression.mediumTerm}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-xs text-purple-600 font-medium">Long-term</div>
                      <div className="text-xs text-gray-700">{result.loopAnalysis.progression.longTerm}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Mastery Depth:</span> {result.loopAnalysis.progression.masteryDepth}
                  </div>
                </div>
              )}

              {/* Social */}
              {result.loopAnalysis.social && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">👥 Social Integration: <span className={
                    result.loopAnalysis.social.integrationLevel === 'core' ? 'text-green-600' :
                    result.loopAnalysis.social.integrationLevel === 'moderate' ? 'text-blue-600' :
                    result.loopAnalysis.social.integrationLevel === 'minimal' ? 'text-amber-600' : 'text-red-600'
                  }>{result.loopAnalysis.social.integrationLevel}</span></div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {result.loopAnalysis.social.coopElements?.length > 0 && (
                      <div>
                        <div className="font-medium text-green-700 mb-1">Co-op Elements</div>
                        <ul className="text-gray-600">{result.loopAnalysis.social.coopElements.map((e, i) => <li key={i}>• {e}</li>)}</ul>
                      </div>
                    )}
                    {result.loopAnalysis.social.viralMoments?.length > 0 && (
                      <div>
                        <div className="font-medium text-purple-700 mb-1">Viral Moments</div>
                        <ul className="text-gray-600">{result.loopAnalysis.social.viralMoments.map((v, i) => <li key={i}>• {v}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skill Curve */}
              {result.loopAnalysis.skillCurve && (
                <div className="mb-4">
                  <div className="font-medium text-gray-800 mb-2">🎯 Skill & Mastery</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Skill Floor:</span> {result.loopAnalysis.skillCurve.floorDescription}</div>
                    <div><span className="text-gray-500">Skill Ceiling:</span> {result.loopAnalysis.skillCurve.ceilingDescription}</div>
                  </div>
                  {result.loopAnalysis.skillCurve.skillExpression?.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium text-gray-700">Skill Expression:</span> {result.loopAnalysis.skillCurve.skillExpression.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Problems */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {result.loopAnalysis.criticalFlaws?.length > 0 && (
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-sm font-medium text-red-700 mb-1">🚨 Critical Flaws</div>
                    <ul className="text-xs text-red-800 space-y-1">
                      {result.loopAnalysis.criticalFlaws.map((f, i) => <li key={i}>✗ {f}</li>)}
                    </ul>
                  </div>
                )}
                {result.loopAnalysis.missingElements?.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded">
                    <div className="text-sm font-medium text-amber-700 mb-1">⚠️ Missing Elements</div>
                    <ul className="text-xs text-amber-800 space-y-1">
                      {result.loopAnalysis.missingElements.map((m, i) => <li key={i}>• {m}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Quick Wins & Suggestions */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {result.loopAnalysis.quickWins?.length > 0 && (
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm font-medium text-green-700 mb-1">⚡ Quick Wins</div>
                    <ul className="text-xs text-green-800 space-y-1">
                      {result.loopAnalysis.quickWins.map((q, i) => <li key={i}>✓ {q}</li>)}
                    </ul>
                  </div>
                )}
                {result.loopAnalysis.suggestions?.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm font-medium text-blue-700 mb-1">💡 Suggestions</div>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {result.loopAnalysis.suggestions.map((s, i) => <li key={i}>→ {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Competitor Analysis Agent */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">⚔️ Competitor Analysis</h3>
                <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreColor(result.competitorAnalysis.score)}`}>
                  {result.competitorAnalysis.score}/10
                </span>
              </div>
              
              {/* Direct Competitors */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Direct Competitors</div>
                <div className="space-y-2">
                  {result.competitorAnalysis.directCompetitors?.map((c, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="font-medium">{c.name} <span className="text-gray-400 text-xs">{c.visits}</span></div>
                      <div className="text-xs mt-1">
                        <span className="text-green-600">✓ {c.whatTheyDoWell}</span>
                        <span className="mx-2">|</span>
                        <span className="text-red-600">✗ {c.weakness}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Differentiation Analysis</div>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{result.competitorAnalysis.differentiationAnalysis}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-green-700 mb-1">Advantages</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {result.competitorAnalysis.competitiveAdvantages?.map((a, i) => <li key={i}>• {a}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Disadvantages</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {result.competitorAnalysis.competitiveDisadvantages?.map((d, i) => <li key={i}>• {d}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Strengths & Issues */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold mb-2 text-green-700">Top Strengths</h3>
                <ul className="text-sm text-green-800 space-y-2">
                  {result.finalVerdict.topStrengths?.map((s, i) => <li key={i}>✓ {s}</li>)}
                </ul>
              </div>
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="font-bold mb-2 text-amber-700">Critical Issues</h3>
                <ul className="text-sm text-amber-800 space-y-2">
                  {result.finalVerdict.criticalIssues?.map((c, i) => <li key={i}>⚠ {c}</li>)}
                </ul>
              </div>
            </div>

            {/* Dealbreakers */}
            {result.finalVerdict.dealbreakers && result.finalVerdict.dealbreakers.length > 0 && (
              <div className="bg-red-100 rounded-xl p-6 border-2 border-red-300">
                <h3 className="font-bold mb-2 text-red-700">🚨 Dealbreakers</h3>
                <ul className="text-sm text-red-800 space-y-2">
                  {result.finalVerdict.dealbreakers.map((d, i) => <li key={i}>✗ {d}</li>)}
                </ul>
              </div>
            )}

            {/* Action Items */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold mb-4 text-lg">📋 Action Items</h3>
              <div className="space-y-3">
                {result.finalVerdict.actionItems?.map((item, i) => (
                  <div key={i} className={`p-3 rounded-lg border-l-4 ${
                    item.priority === 'high' ? 'border-red-500 bg-red-50' :
                    item.priority === 'medium' ? 'border-amber-500 bg-amber-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.priority === 'high' ? 'bg-red-200 text-red-800' :
                        item.priority === 'medium' ? 'bg-amber-200 text-amber-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>{item.priority.toUpperCase()}</span>
                      <span className="font-medium text-sm">{item.action}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pivot Suggestions (if low score) */}
            {result.finalVerdict.pivotSuggestions && result.finalVerdict.pivotSuggestions.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="font-bold mb-2 text-purple-700">💡 Pivot Suggestions</h3>
                <ul className="text-sm text-purple-800 space-y-2">
                  {result.finalVerdict.pivotSuggestions.map((p, i) => <li key={i}>→ {p}</li>)}
                </ul>
              </div>
            )}

            {/* Raw JSON */}
            <details className="bg-gray-800 rounded-xl p-4">
              <summary className="text-white font-bold cursor-pointer">Raw JSON Response (4 Agents)</summary>
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
