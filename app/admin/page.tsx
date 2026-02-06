'use client';

import { useState, useEffect } from 'react';
import { Users, Flag, ChevronDown, ChevronRight, Clock, Gamepad2, AlertTriangle, Bot, TrendingUp, Trophy, RefreshCw, Zap, Target } from 'lucide-react';

// ============================================
// Types
// ============================================

interface AccountSummary {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count: {
    projects: number;
    validationRuns: number;
  };
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  projects: any[];
}

interface ReportItem {
  id: string;
  section: string;
  reportType: string;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  validationRun: {
    id: string;
    createdAt: string;
    result: any;
    project: { id: string; finalTitle: string; finalConcept: string };
  };
}

// ============================================
// Helpers
// ============================================

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function memberSince(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)}y ${Math.floor((diffDays % 365) / 30)}mo`;
}

const SECTION_LABELS: Record<string, string> = {
  verdict: 'Verdict', hardTruth: 'Hard Truth', competition: 'Competition',
  market: 'Market', firstSession: 'First 5 Minutes', loop: 'Core Loop',
  retention: 'Retention', dealbreakers: 'Dealbreakers',
};

// Reusable field display
function Field({ label, value, full }: { label: string; value: any; full?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className={`bg-gray-50 p-2.5 rounded-lg ${full ? 'col-span-2' : ''}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{display}</div>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] | undefined | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-gray-50 p-2.5 rounded-lg col-span-2">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-700">{item}</span>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon, children, defaultOpen }: { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        {icon}
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</span>
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

// ============================================
// Validation Result Display - Readable!
// ============================================

function ValidationResultView({ result }: { result: any }) {
  const fv = result?.finalVerdict;
  const ma = result?.marketAnalysis;
  const la = result?.loopAnalysis;
  const ca = result?.competitorAnalysis;

  return (
    <div className="space-y-3">
      {/* Final Verdict */}
      {fv && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase">Final Verdict</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
              fv.verdict === 'strong' ? 'bg-green-100 text-green-700' :
              fv.verdict === 'promising' ? 'bg-blue-100 text-blue-700' :
              fv.verdict === 'needs_work' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {fv.overallScore}/10 - {fv.verdict}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Summary" value={fv.summary} full />
            <Field label="Hard Truth" value={fv.hardTruth} full />
            <Field label="Build Recommendation" value={fv.buildRecommendation} full />
          </div>
          <ListField label="Top Strengths" items={fv.topStrengths} />
          <ListField label="Critical Issues" items={fv.criticalIssues} />
          <ListField label="Dealbreakers" items={fv.dealbreakers} />
          <ListField label="Pivot Suggestions" items={fv.pivotSuggestions} />
          {fv.actionItems?.length > 0 && (
            <div className="bg-white p-2 rounded-lg">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Action Items</div>
              {fv.actionItems.map((a: any, i: number) => (
                <div key={i} className="text-xs text-gray-700 flex items-start gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase px-1 py-0.5 rounded ${
                    a.priority === 'high' ? 'bg-red-100 text-red-600' :
                    a.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{a.priority}</span>
                  <span><strong>{a.action}</strong> — {a.reasoning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market Analysis */}
      {ma && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-bold text-cyan-700 uppercase">Market Analysis</span>
            <span className="ml-auto text-xs font-bold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">{ma.score}/10</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Genre" value={ma.genre} />
            <Field label="Market Size" value={ma.marketSize} />
            <Field label="Growth Trend" value={ma.growthTrend} />
            <Field label="Saturation" value={ma.saturationLevel} />
          </div>
          <ListField label="Sub-Genres" items={ma.subGenres} />
          <ListField label="Opportunity Windows" items={ma.opportunityWindows} />
          <ListField label="Risks" items={ma.risks} />
          {ma.audienceProfile && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Audience Age" value={ma.audienceProfile.ageRange} />
              <Field label="Spending Habits" value={ma.audienceProfile.spendingHabits} />
              <Field label="Play Patterns" value={ma.audienceProfile.playPatterns} full />
              <ListField label="Audience Interests" items={ma.audienceProfile.interests} />
            </div>
          )}
        </div>
      )}

      {/* Loop Analysis */}
      {la && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 uppercase">Loop Analysis</span>
            <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{la.score}/10</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary Loop" value={la.primaryLoop} full />
            <Field label="Loop Strength" value={la.loopStrength} full />
          </div>
          <ListField label="Core Mechanics" items={la.coreMechanics} />
          <ListField label="Secondary Loops" items={la.secondaryLoops} />

          {la.momentToMoment && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Core Verb" value={la.momentToMoment.coreVerb} />
              <Field label="Feeling" value={la.momentToMoment.feeling} />
              <Field label="Satisfaction Source" value={la.momentToMoment.satisfactionSource} full />
              <ListField label="Frustration Risks" items={la.momentToMoment.frustrationRisks} />
            </div>
          )}

          {la.firstSession && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Hook Moment" value={la.firstSession.hookMoment} />
              <Field label="Time to Fun" value={la.firstSession.timeToFun} />
              <Field label="Tutorial Risk" value={la.firstSession.tutorialRisk} />
              <Field label="Aha Moment" value={la.firstSession.ahaMoment} />
            </div>
          )}

          {la.retention && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Come Back Today" value={la.retention.whyComeBackToday} full />
              <Field label="Come Back Tomorrow" value={la.retention.whyComeBackTomorrow} full />
              <Field label="Come Back Next Week" value={la.retention.whyComeBackNextWeek} full />
              <ListField label="Daily Hooks" items={la.retention.dailyHooks} />
              <ListField label="Weekly Hooks" items={la.retention.weeklyHooks} />
              <ListField label="Retention Killers" items={la.retention.retentionKillers} />
            </div>
          )}

          {la.sessionStructure && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Ideal Session Length" value={la.sessionStructure.idealLength} />
              <Field label="One More Round Factor" value={la.sessionStructure.oneMoreRoundFactor} />
              <Field label="Session Flow" value={la.sessionStructure.sessionFlow} full />
              <ListField label="Natural Break Points" items={la.sessionStructure.naturalBreakPoints} />
            </div>
          )}

          {la.progression && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Short-Term Progression" value={la.progression.shortTerm} />
              <Field label="Medium-Term Progression" value={la.progression.mediumTerm} />
              <Field label="Long-Term Progression" value={la.progression.longTerm} />
              <Field label="Mastery Depth" value={la.progression.masteryDepth} />
              <Field label="Content Velocity" value={la.progression.contentVelocity} full />
            </div>
          )}

          {la.social && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Social Integration" value={la.social.integrationLevel} full />
              <ListField label="Co-op Elements" items={la.social.coopElements} />
              <ListField label="Competitive Elements" items={la.social.competitiveElements} />
              <ListField label="Social Hooks" items={la.social.socialHooks} />
              <ListField label="Viral Moments" items={la.social.viralMoments} />
            </div>
          )}

          {la.skillCurve && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Skill Floor" value={la.skillCurve.floorDescription} />
              <Field label="Skill Ceiling" value={la.skillCurve.ceilingDescription} />
              <ListField label="Skill Expression" items={la.skillCurve.skillExpression} />
              <ListField label="Learning Moments" items={la.skillCurve.learningMoments} />
            </div>
          )}

          <ListField label="Missing Elements" items={la.missingElements} />
          <ListField label="Critical Flaws" items={la.criticalFlaws} />
          <ListField label="Suggestions" items={la.suggestions} />
          <ListField label="Quick Wins" items={la.quickWins} />
        </div>
      )}

      {/* Competitor Analysis */}
      {ca && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase">Competitor Analysis</span>
            <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{ca.score}/10</span>
          </div>
          <Field label="Differentiation Analysis" value={ca.differentiationAnalysis} full />
          <Field label="Market Positioning" value={ca.marketPositioning} full />

          {ca.directCompetitors?.length > 0 && (
            <div className="bg-white p-2 rounded-lg col-span-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Direct Competitors</div>
              {ca.directCompetitors.map((c: any, i: number) => (
                <div key={i} className="text-xs text-gray-700 border-b border-gray-100 last:border-0 py-1.5">
                  <div className="font-medium text-gray-900">{c.name} <span className="text-gray-400 font-normal">({c.visits})</span></div>
                  <div className="text-green-700 mt-0.5">+ {c.whatTheyDoWell}</div>
                  <div className="text-red-700">- {c.weakness}</div>
                </div>
              ))}
            </div>
          )}
          <ListField label="Indirect Competitors" items={ca.indirectCompetitors} />
          <ListField label="Competitive Advantages" items={ca.competitiveAdvantages} />
          <ListField label="Competitive Disadvantages" items={ca.competitiveDisadvantages} />
        </div>
      )}
    </div>
  );
}

// ============================================
// Project Data Display
// ============================================

function ProjectDataView({ project }: { project: any }) {
  const gq = project.gameQuestions;
  const si = project.structuredIdea;
  const ikigai = project.ikigai;
  const selectedSpark = project.selectedSpark;
  const gameLoop: any[] = Array.isArray(project.gameLoop) ? project.gameLoop : [];
  const skillTree: any[] = Array.isArray(project.skillTree) ? project.skillTree : [];

  return (
    <div className="space-y-3">
      {/* Basic Info */}
      <Section title="Onboarding & Setup" icon={<Gamepad2 className="w-3.5 h-3.5 text-pink-500" />} defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Has Idea?" value={project.hasIdea === true ? 'Yes' : project.hasIdea === false ? 'No (used Ikigai)' : 'Not set'} />
          <Field label="Platform" value={project.platform} />
          <Field label="Team Size" value={project.teamSize} />
          <Field label="Timeline" value={project.timeHorizon} />
          <Field label="Current Stage" value={project.currentPage} />
          <Field label="Created" value={formatDate(project.createdAt)} />
          <Field label="Last Updated" value={formatDate(project.updatedAt)} />
          <ListField label="Vibe Chips" items={project.vibeChips} />
        </div>
      </Section>

      {/* Idea Description */}
      {project.ideaDescription && (
        <Section title="Idea Description" icon={<Zap className="w-3.5 h-3.5 text-yellow-500" />} defaultOpen>
          <div className="text-sm text-gray-800 leading-relaxed">{project.ideaDescription}</div>
          {project.additionalContext && (
            <Field label="Additional Context" value={project.additionalContext} full />
          )}
        </Section>
      )}

      {/* Structured Idea (AI-refined) */}
      {si && (
        <Section title="Structured Idea (AI-refined)" icon={<Bot className="w-3.5 h-3.5 text-blue-500" />} defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Title" value={si.title} />
            <Field label="Loop Hook" value={si.loopHook} />
            <Field label="Concept Paragraph" value={si.conceptParagraph} full />
            <ListField label="Core Verbs" items={si.coreVerbs} />
          </div>
        </Section>
      )}

      {/* Final Title & Concept */}
      {(project.finalTitle || project.finalConcept) && (
        <Section title="Final Game Concept" icon={<Target className="w-3.5 h-3.5 text-green-600" />} defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Final Title" value={project.finalTitle} full />
            <Field label="Final Concept" value={project.finalConcept} full />
          </div>
        </Section>
      )}

      {/* Ikigai Path */}
      {ikigai && ikigai.chips && ikigai.chips.length > 0 && (
        <Section title={`Ikigai (${ikigai.chips.length} chips)`}>
          <div className="flex flex-wrap gap-1">
            {ikigai.chips.map((chip: any, i: number) => (
              <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-700">
                {chip.text} <span className="text-gray-400">({chip.categories?.join(', ')})</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Selected Spark */}
      {selectedSpark && (
        <Section title="Selected Spark Idea">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Spark Title" value={selectedSpark.title} />
            <Field label="Hook" value={selectedSpark.hook} />
            <Field label="Core Loop" value={selectedSpark.coreLoop} full />
            <Field label="Unique Mechanic" value={selectedSpark.uniqueMechanic} full />
            <Field label="Win/Lose Condition" value={selectedSpark.winLoseCondition} />
            <Field label="Scope Level" value={selectedSpark.scopeLevel} />
            <Field label="Prototype Plan" value={selectedSpark.prototypePlan} full />
            <ListField label="Why Fun" items={selectedSpark.whyFun} />
          </div>
        </Section>
      )}

      {/* Game Questions */}
      {gq && (
        <Section title="Game Questions" icon={<Flag className="w-3.5 h-3.5 text-indigo-500" />} defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <Field label="One Sentence" value={gq.oneSentence} full />
            <Field label="Genre" value={gq.genre} />
            <Field label="Genre Success Rate" value={gq.genreSuccessRate} />
            <Field label="Target Player" value={gq.targetPlayer} full />
            <Field label="Price Point" value={gq.pricePoint} />
            <Field label="Price Reason" value={gq.priceReason} />
            <Field label="Biggest Risk" value={gq.biggestRisk} full />
            <Field label="Not For" value={gq.notFor} full />
            <Field label="Memorable Thing" value={gq.memorableThing} full />
            <ListField label="Emotions" items={gq.emotions} />
            <ListField label="Player Games" items={gq.playerGames} />
          </div>
        </Section>
      )}

      {/* Game Loop */}
      {gameLoop.length > 0 && (
        <Section title={`Game Loop (${gameLoop.length} nodes)`} icon={<RefreshCw className="w-3.5 h-3.5 text-purple-500" />}>
          <div className="space-y-1">
            {gameLoop.map((node: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  node.type === 'action' ? 'bg-blue-100 text-blue-700' :
                  node.type === 'challenge' ? 'bg-red-100 text-red-700' :
                  node.type === 'reward' ? 'bg-green-100 text-green-700' :
                  node.type === 'decision' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{node.type}</span>
                <span className="text-gray-800 font-medium">{node.label}</span>
                {node.loopName && <span className="text-gray-400 text-[10px]">({node.loopName})</span>}
                <span className="text-gray-400 text-[10px] ml-auto">{node.loopType}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skill Tree */}
      {skillTree.length > 0 && (
        <Section title={`Skill Tree (${skillTree.length} skills)`}>
          <div className="space-y-1">
            {skillTree.map((skill: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  skill.level === 'core' ? 'bg-green-100 text-green-700' :
                  skill.level === 'advanced' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>{skill.level}</span>
                <span className="text-gray-800 font-medium">{skill.label}</span>
                {skill.dependencies?.length > 0 && (
                  <span className="text-gray-400 text-[10px] ml-auto">depends on: {skill.dependencies.join(', ')}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Concept Card */}
      {project.hasConceptCard && (
        <Section title="Concept Card">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Has Concept Card" value="Yes" />
            <Field label="Created At" value={project.conceptCardCreatedAt || '—'} />
            {project.conceptImage && (
              <div className="col-span-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Concept Image URL</div>
                <div className="text-xs text-blue-600 break-all">{project.conceptImage}</div>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function AccountRow({ account, onExpand, expanded }: { account: AccountSummary; onExpand: () => void; expanded: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        {account.image ? (
          <img src={account.image} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
            {(account.name || account.email)?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{account.name || 'No name'}</div>
          <div className="text-xs text-gray-500 truncate">{account.email}</div>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {memberSince(account.createdAt)}
          </div>
          <div className="flex items-center gap-1">
            <Gamepad2 className="w-3.5 h-3.5" />
            {account._count.projects} project{account._count.projects !== 1 ? 's' : ''}
          </div>
          <div className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {account._count.validationRuns} validation{account._count.validationRuns !== 1 ? 's' : ''}
          </div>
        </div>
      </button>
    </div>
  );
}

function UserDetailView({ userId }: { userId: string }) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [showValidation, setShowValidation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/admin/account/${userId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-4 text-sm text-gray-500 animate-pulse">Loading user data...</div>;
  if (!data) return <div className="p-4 text-sm text-red-500">Failed to load</div>;

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
      {/* User info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
        <span>Username: <strong className="text-gray-800">{data.username || '—'}</strong></span>
        <span>Onboarding: <strong className="text-gray-800">{data.onboardingComplete ? 'Complete' : 'Incomplete'}</strong></span>
        <span>Joined: <strong className="text-gray-800">{formatDate(data.createdAt)}</strong></span>
      </div>

      {data.projects.length === 0 && (
        <p className="text-sm text-gray-400 italic">No projects yet</p>
      )}

      {data.projects.map((project) => (
        <div key={project.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Project header */}
          <button
            onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
          >
            {expandedProject === project.id ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <Gamepad2 className="w-4 h-4 text-pink-500" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">
                {project.finalTitle || 'Untitled Project'}
              </div>
              <div className="text-xs text-gray-400">
                Stage: {project.currentPage} | Updated {timeAgo(project.updatedAt)} | Created {timeAgo(project.createdAt)}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {project.validationRuns?.length || 0} run{(project.validationRuns?.length || 0) !== 1 ? 's' : ''}
            </span>
          </button>

          {expandedProject === project.id && (
            <div className="border-t border-gray-100 p-3 space-y-4">
              {/* Toggle for user answers */}
              <div>
                <button
                  onClick={() => setShowAnswers(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                  className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                >
                  {showAnswers[project.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  All User Answers & Project Data
                </button>
                {showAnswers[project.id] && (
                  <div className="mt-2">
                    <ProjectDataView project={project} />
                  </div>
                )}
              </div>

              {/* Validation runs */}
              {project.validationRuns?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowValidation(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
                  >
                    {showValidation[project.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    AI Validation Runs ({project.validationRuns.length})
                  </button>
                  {showValidation[project.id] && (
                    <div className="mt-2 space-y-2">
                      {project.validationRuns.map((run: any) => (
                        <div key={run.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                            className="w-full flex items-center gap-2 p-2.5 hover:bg-gray-50 text-left text-xs"
                          >
                            {expandedRun === run.id ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                            <Bot className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-medium text-gray-700">{formatDate(run.createdAt)}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              run.result?.finalVerdict?.verdict === 'strong' ? 'bg-green-100 text-green-700' :
                              run.result?.finalVerdict?.verdict === 'promising' ? 'bg-blue-100 text-blue-700' :
                              run.result?.finalVerdict?.verdict === 'needs_work' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {run.result?.finalVerdict?.overallScore ?? '?'}/10 — {run.result?.finalVerdict?.verdict ?? 'unknown'}
                            </span>
                            {run.feedbackReports?.length > 0 && (
                              <span className="ml-auto bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {run.feedbackReports.length} report{run.feedbackReports.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </button>
                          {expandedRun === run.id && (
                            <div className="border-t border-gray-100 p-3 space-y-3">
                              <ValidationResultView result={run.result} />

                              {run.feedbackReports?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                                  <div className="text-xs font-bold text-red-700 uppercase">User Reports on This Run</div>
                                  {run.feedbackReports.map((rp: any) => (
                                    <div key={rp.id} className="bg-white p-2 rounded-lg text-xs flex items-start gap-2">
                                      <Flag className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-medium text-red-700">{SECTION_LABELS[rp.section] || rp.section}</span>
                                        <span className="mx-1 text-gray-400">|</span>
                                        <span className={`font-medium ${rp.reportType === 'inaccurate' ? 'text-red-600' : 'text-amber-600'}`}>{rp.reportType}</span>
                                        <span className="text-gray-400 ml-2">{formatDate(rp.createdAt)}</span>
                                        {rp.comment && <p className="text-gray-600 mt-1 italic">&ldquo;{rp.comment}&rdquo;</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function AdminPage() {
  const [tab, setTab] = useState<'accounts' | 'reports'>('accounts');
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then((r) => r.json())
      .then((d) => { setAccounts(d); setLoadingAccounts(false); })
      .catch(() => setLoadingAccounts(false));

    fetch('/api/admin/reports')
      .then((r) => r.json())
      .then((d) => { setReports(d); setLoadingReports(false); })
      .catch(() => setLoadingReports(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            tab === 'accounts' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Accounts
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'accounts' ? 'bg-white/20' : 'bg-gray-100'}`}>
            {accounts.length}
          </span>
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            tab === 'reports' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Flag className="w-4 h-4" />
          Reports
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            tab === 'reports' ? 'bg-white/20' : reports.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
          }`}>
            {reports.length}
          </span>
        </button>
      </div>

      {/* Accounts Tab */}
      {tab === 'accounts' && (
        <div className="space-y-2">
          {loadingAccounts ? (
            <div className="text-sm text-gray-500 p-4">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-gray-400 p-4 italic">No accounts yet</div>
          ) : (
            accounts.map((account) => (
              <div key={account.id}>
                <AccountRow
                  account={account}
                  expanded={expandedUser === account.id}
                  onExpand={() => setExpandedUser(expandedUser === account.id ? null : account.id)}
                />
                {expandedUser === account.id && <UserDetailView userId={account.id} />}
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-2">
          {loadingReports ? (
            <div className="text-sm text-gray-500 p-4">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Flag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No reports yet</p>
              <p className="text-xs text-gray-300 mt-1">Reports from users will appear here</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    report.reportType === 'inaccurate' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {report.reportType === 'inaccurate' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Flag className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        report.reportType === 'inaccurate' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{report.reportType}</span>
                      <span className="text-xs font-medium text-gray-600">{SECTION_LABELS[report.section] || report.section}</span>
                      <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">{report.user.name || report.user.email}</span>
                      {' reported on '}
                      <span className="font-medium">{report.validationRun.project.finalTitle || 'Untitled'}</span>
                    </div>
                    {report.comment && (
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg italic">&ldquo;{report.comment}&rdquo;</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                      <span className="font-medium">AI said: </span>
                      {report.section === 'verdict' && report.validationRun.result?.finalVerdict?.summary}
                      {report.section === 'hardTruth' && report.validationRun.result?.finalVerdict?.hardTruth}
                      {report.section === 'market' && `Genre: ${report.validationRun.result?.marketAnalysis?.genre}, Trend: ${report.validationRun.result?.marketAnalysis?.growthTrend}, Saturation: ${report.validationRun.result?.marketAnalysis?.saturationLevel}`}
                      {report.section === 'competition' && report.validationRun.result?.competitorAnalysis?.differentiationAnalysis}
                      {report.section === 'loop' && `${report.validationRun.result?.loopAnalysis?.primaryLoop} (Strength: ${report.validationRun.result?.loopAnalysis?.loopStrength})`}
                      {report.section === 'retention' && `Today: ${report.validationRun.result?.loopAnalysis?.retention?.whyComeBackToday} | Tomorrow: ${report.validationRun.result?.loopAnalysis?.retention?.whyComeBackTomorrow}`}
                      {report.section === 'firstSession' && `Hook: ${report.validationRun.result?.loopAnalysis?.firstSession?.hookMoment} | Time to Fun: ${report.validationRun.result?.loopAnalysis?.firstSession?.timeToFun}`}
                      {report.section === 'dealbreakers' && report.validationRun.result?.finalVerdict?.dealbreakers?.join('; ')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
