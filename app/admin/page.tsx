'use client';

import { useState, useEffect } from 'react';
import { Users, Flag, ChevronDown, ChevronRight, Clock, Gamepad2, AlertTriangle } from 'lucide-react';

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

interface ValidationRunDetail {
  id: string;
  result: any;
  createdAt: string;
  feedbackReports: {
    id: string;
    section: string;
    reportType: string;
    comment: string | null;
    createdAt: string;
  }[];
}

interface ProjectDetail {
  id: string;
  finalTitle: string;
  finalConcept: string;
  platform: string;
  teamSize: string;
  timeHorizon: string;
  ideaDescription: string;
  vibeChips: string[];
  gameLoop: any;
  gameQuestions: any;
  skillTree: any;
  currentPage: string;
  createdAt: string;
  updatedAt: string;
  validationRuns: ValidationRunDetail[];
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  projects: ProjectDetail[];
}

interface ReportItem {
  id: string;
  section: string;
  reportType: string;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  validationRun: {
    id: string;
    createdAt: string;
    result: any;
    project: {
      id: string;
      finalTitle: string;
      finalConcept: string;
    };
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

function memberSince(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)}y ${Math.floor((diffDays % 365) / 30)}mo`;
}

const SECTION_LABELS: Record<string, string> = {
  verdict: 'Verdict',
  hardTruth: 'Hard Truth',
  competition: 'Competition',
  market: 'Market',
  firstSession: 'First 5 Minutes',
  loop: 'Core Loop',
  retention: 'Retention',
  dealbreakers: 'Dealbreakers',
};

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

  useEffect(() => {
    fetch(`/api/admin/account/${userId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading...</div>;
  if (!data) return <div className="p-4 text-sm text-red-500">Failed to load</div>;

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
      {data.projects.length === 0 && (
        <p className="text-sm text-gray-400 italic">No projects yet</p>
      )}
      {data.projects.map((project) => (
        <div key={project.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                Stage: {project.currentPage} | Updated {timeAgo(project.updatedAt)}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {project.validationRuns.length} run{project.validationRuns.length !== 1 ? 's' : ''}
            </span>
          </button>

          {expandedProject === project.id && (
            <div className="border-t border-gray-100 p-3 space-y-3">
              {/* Project answers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-600 uppercase">User Answers</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-500">Platform:</span> {project.platform || '—'}
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-500">Team:</span> {project.teamSize || '—'}
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-500">Timeline:</span> {project.timeHorizon || '—'}
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-500">Vibes:</span> {project.vibeChips?.join(', ') || '—'}
                  </div>
                </div>
                {project.finalConcept && (
                  <div className="bg-gray-50 p-2 rounded-lg text-xs">
                    <span className="font-medium text-gray-500">Concept:</span>
                    <p className="text-gray-700 mt-1">{project.finalConcept}</p>
                  </div>
                )}
                {project.ideaDescription && (
                  <div className="bg-gray-50 p-2 rounded-lg text-xs">
                    <span className="font-medium text-gray-500">Idea Description:</span>
                    <p className="text-gray-700 mt-1">{project.ideaDescription}</p>
                  </div>
                )}
                {project.gameQuestions && (
                  <div className="bg-gray-50 p-2 rounded-lg text-xs">
                    <span className="font-medium text-gray-500">Game Questions:</span>
                    <pre className="text-gray-700 mt-1 whitespace-pre-wrap text-[11px] max-h-48 overflow-auto">
                      {JSON.stringify(project.gameQuestions, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Validation runs */}
              {project.validationRuns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-600 uppercase">AI Validation Runs</h4>
                  {project.validationRuns.map((run) => (
                    <div key={run.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left text-xs"
                      >
                        {expandedRun === run.id ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                        <span className="text-gray-600">
                          Run {timeAgo(run.createdAt)} — Score: {(run.result as any)?.finalVerdict?.overallScore ?? '?'}/10 — {(run.result as any)?.finalVerdict?.verdict ?? 'unknown'}
                        </span>
                        {run.feedbackReports.length > 0 && (
                          <span className="ml-auto bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {run.feedbackReports.length} report{run.feedbackReports.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </button>
                      {expandedRun === run.id && (
                        <div className="border-t border-gray-100 p-2 space-y-2">
                          <div className="bg-blue-50 p-2 rounded text-[11px]">
                            <span className="font-medium text-blue-700">AI Feedback Summary:</span>
                            <p className="text-gray-700 mt-1">{(run.result as any)?.finalVerdict?.summary || 'No summary'}</p>
                            <p className="text-gray-600 mt-1 italic">{(run.result as any)?.finalVerdict?.hardTruth || ''}</p>
                          </div>
                          <pre className="text-[10px] bg-gray-50 p-2 rounded max-h-64 overflow-auto text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(run.result, null, 2)}
                          </pre>
                          {run.feedbackReports.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-red-600 uppercase">Reports on this run:</span>
                              {run.feedbackReports.map((rp) => (
                                <div key={rp.id} className="bg-red-50 p-2 rounded text-[11px] flex items-start gap-2">
                                  <Flag className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-medium text-red-700">{SECTION_LABELS[rp.section] || rp.section}</span>
                                    <span className="mx-1 text-gray-400">|</span>
                                    <span className={rp.reportType === 'inaccurate' ? 'text-red-600' : 'text-amber-600'}>{rp.reportType}</span>
                                    {rp.comment && <p className="text-gray-600 mt-0.5">{rp.comment}</p>}
                                    <span className="text-gray-400 ml-2">{timeAgo(rp.createdAt)}</span>
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
            tab === 'reports'
              ? 'bg-white/20'
              : reports.length > 0
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100'
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
                {expandedUser === account.id && (
                  <UserDetailView userId={account.id} />
                )}
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
                      }`}>
                        {report.reportType}
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        {SECTION_LABELS[report.section] || report.section}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(report.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">{report.user.name || report.user.email}</span>
                      {' reported on '}
                      <span className="font-medium">{report.validationRun.project.finalTitle || 'Untitled'}</span>
                    </div>
                    {report.comment && (
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg italic">
                        &ldquo;{report.comment}&rdquo;
                      </p>
                    )}
                    {/* Show the reported section snippet */}
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg max-h-32 overflow-auto">
                      <span className="font-medium">AI said: </span>
                      {report.section === 'verdict' && (report.validationRun.result as any)?.finalVerdict?.summary}
                      {report.section === 'hardTruth' && (report.validationRun.result as any)?.finalVerdict?.hardTruth}
                      {report.section === 'market' && `Genre: ${(report.validationRun.result as any)?.marketAnalysis?.genre}, Trend: ${(report.validationRun.result as any)?.marketAnalysis?.growthTrend}`}
                      {report.section === 'competition' && (report.validationRun.result as any)?.competitorAnalysis?.differentiationAnalysis}
                      {report.section === 'loop' && (report.validationRun.result as any)?.loopAnalysis?.primaryLoop}
                      {report.section === 'retention' && (report.validationRun.result as any)?.loopAnalysis?.retention?.whyComeBackTomorrow}
                      {report.section === 'firstSession' && (report.validationRun.result as any)?.loopAnalysis?.firstSession?.hookMoment}
                      {report.section === 'dealbreakers' && (report.validationRun.result as any)?.finalVerdict?.dealbreakers?.join('; ')}
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
