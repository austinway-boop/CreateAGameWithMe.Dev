'use client';

import { useState, useEffect, Suspense, Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, Paintbrush, Box, Music, Calendar,
  Loader2, Lock, Sparkles, Crown, Zap, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

// Error boundary — catches render crashes so one tab can't kill the whole page
class TabErrorBoundary extends Component<
  { children: ReactNode; tabName: string },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || 'Something went wrong' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto mt-16 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="font-bold text-gray-900">{this.props.tabName} ran into a problem</h3>
          <p className="text-sm text-gray-500">{this.state.error}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700"
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-load each tab component — only downloaded when the tab is first visited
const TabSpinner = () => <div className="flex justify-center pt-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
const DashboardOverview = dynamic(() => import('@/components/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })), { ssr: false, loading: TabSpinner });
const SketchToArt = dynamic(() => import('@/components/dashboard/SketchToArt').then(m => ({ default: m.SketchToArt })), { ssr: false, loading: TabSpinner });
const ImageTo3D = dynamic(() => import('@/components/dashboard/ImageTo3D').then(m => ({ default: m.ImageTo3D })), { ssr: false, loading: TabSpinner });
const MusicGenerator = dynamic(() => import('@/components/dashboard/MusicGenerator').then(m => ({ default: m.MusicGenerator })), { ssr: false, loading: TabSpinner });
const DevCalendar = dynamic(() => import('@/components/dashboard/DevCalendar').then(m => ({ default: m.DevCalendar })), { ssr: false, loading: TabSpinner });

type TabId = 'overview' | 'art' | '3d' | 'music' | 'calendar';

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard; requiresSub: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, requiresSub: false },
  { id: 'art', label: 'Art Studio', icon: Paintbrush, requiresSub: true },
  { id: '3d', label: '3D Lab', icon: Box, requiresSub: true },
  { id: 'music', label: 'Music', icon: Music, requiresSub: true },
  { id: 'calendar', label: 'Calendar', icon: Calendar, requiresSub: true },
];

function CreditBadge({ credits, onUpgrade }: { credits: CreditInfo; onUpgrade: () => void }) {
  const pct = credits.total > 0 ? Math.round((credits.remaining / credits.total) * 100) : 0;
  const planLabel = credits.plan === 'pro' ? 'Pro' : 'Starter';

  // Color based on remaining percentage
  const barColor = pct > 50 ? '#58cc02' : pct > 20 ? '#ff9600' : '#ff4b4b';
  const barShadow = pct > 50 ? '#58a700' : pct > 20 ? '#ea7900' : '#ea2b2b';

  return (
    <div className="flex items-center gap-3">
      {/* Credits display */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[0_3px_0_#e5e7eb] px-3 py-2 min-w-[140px]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" style={{ color: barColor }} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{planLabel}</span>
          </div>
          <span className="text-xs font-black text-gray-900">{credits.remaining}<span className="text-gray-400 font-bold">/{credits.total}</span></span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { project, loading: projectLoading } = useProject();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set<TabId>(['overview']));
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/ai/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch {
      // Default: no credits
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    setMountedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  };

  if (projectLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const needsSub = currentTab.requiresSub && !credits?.hasSubscription;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto">
          {/* Top row: title + credits */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-gray-900">
                {project?.finalTitle || 'Your Game'}
              </h1>
              <p className="text-xs text-gray-500">
                {[project?.platform, project?.teamSize, project?.timeHorizon].filter(Boolean).join(' \u00B7 ')}
              </p>
            </div>

            {/* Credits / Upgrade */}
            {creditsLoading ? (
              <div className="h-10 w-36 bg-gray-100 rounded-2xl animate-pulse" />
            ) : credits?.hasSubscription ? (
              <CreditBadge credits={credits} onUpgrade={() => router.push('/subscribe')} />
            ) : (
              <button
                onClick={() => router.push('/subscribe')}
                className="flex items-center gap-2 bg-[#58cc02] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] uppercase tracking-wide"
              >
                <Crown className="w-4 h-4" />
                Subscribe for AI Tools
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto -mb-[2px]">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const locked = tab.requiresSub && !credits?.hasSubscription;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'bg-gray-50 text-gray-900 border-[#58cc02] shadow-[inset_0_-2px_0_#58cc02]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#58cc02]' : ''}`} />
                  {tab.label}
                  {locked && <Lock className="w-3 h-3 text-gray-300 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto px-6 py-5 bg-gray-50">
        {needsSub ? (
          <div className="max-w-md mx-auto mt-16 text-center space-y-5">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb]">
              <Sparkles className="w-9 h-9 text-[#58cc02]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-1">
                Unlock {currentTab.label}
              </h2>
              <p className="text-gray-500 text-sm">
                Subscribe to get AI credits and access all creative tools for your game.
              </p>
            </div>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] uppercase tracking-wide text-sm"
            >
              View Plans
            </button>
          </div>
        ) : (
          <>
            {mountedTabs.has('overview') && (
              <div style={{ display: activeTab === 'overview' ? undefined : 'none' }}>
                <TabErrorBoundary tabName="Overview"><DashboardOverview /></TabErrorBoundary>
              </div>
            )}
            {mountedTabs.has('art') && (
              <div style={{ display: activeTab === 'art' ? undefined : 'none' }}>
                <TabErrorBoundary tabName="Art Studio"><SketchToArt credits={credits} onCreditsUpdate={fetchCredits} /></TabErrorBoundary>
              </div>
            )}
            {mountedTabs.has('3d') && (
              <div style={{ display: activeTab === '3d' ? undefined : 'none' }}>
                <TabErrorBoundary tabName="3D Lab"><ImageTo3D credits={credits} onCreditsUpdate={fetchCredits} /></TabErrorBoundary>
              </div>
            )}
            {mountedTabs.has('music') && (
              <div style={{ display: activeTab === 'music' ? undefined : 'none' }}>
                <TabErrorBoundary tabName="Music"><MusicGenerator credits={credits} onCreditsUpdate={fetchCredits} /></TabErrorBoundary>
              </div>
            )}
            {mountedTabs.has('calendar') && (
              <div style={{ display: activeTab === 'calendar' ? undefined : 'none' }}>
                <TabErrorBoundary tabName="Calendar"><DevCalendar credits={credits} onCreditsUpdate={fetchCredits} /></TabErrorBoundary>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
