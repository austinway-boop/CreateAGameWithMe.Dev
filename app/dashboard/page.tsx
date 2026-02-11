'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Paintbrush, Box, Music, Calendar,
  Loader2, Lock, Sparkles, Crown,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { SketchToArt } from '@/components/dashboard/SketchToArt';
import { ImageTo3D } from '@/components/dashboard/ImageTo3D';
import { MusicGenerator } from '@/components/dashboard/MusicGenerator';
import { DevCalendar } from '@/components/dashboard/DevCalendar';

type TabId = 'overview' | 'art' | '3d' | 'music' | 'calendar';

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard; requiresSub: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, requiresSub: false },
  { id: 'art', label: 'Art Studio', icon: Paintbrush, requiresSub: true },
  { id: '3d', label: '3D Lab', icon: Box, requiresSub: true },
  { id: 'music', label: 'Music', icon: Music, requiresSub: true },
  { id: 'calendar', label: 'Calendar', icon: Calendar, requiresSub: true },
];

function DashboardContent() {
  const router = useRouter();
  const { project, loading: projectLoading } = useProject();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
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
    if (TABS.find(t => t.id === tab)?.requiresSub && !credits?.hasSubscription) {
      // Show upgrade prompt instead of locking out entirely
      setActiveTab(tab);
      return;
    }
    setActiveTab(tab);
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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-gray-900">
                {project?.finalTitle || 'Your Game'}
              </h1>
              <p className="text-xs text-gray-500">
                {project?.platform} &middot; {project?.teamSize} &middot; {project?.timeHorizon}
              </p>
            </div>

            {/* Credit Badge */}
            {creditsLoading ? (
              <div className="h-9 w-28 bg-gray-100 rounded-xl animate-pulse" />
            ) : credits?.hasSubscription ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl px-3 py-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-sm font-black text-purple-700">{credits.remaining}</div>
                  <div className="text-[9px] text-purple-500 uppercase font-bold tracking-wide">Credits</div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push('/subscribe')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-[0_3px_0_#d97706] hover:shadow-[0_1px_0_#d97706] hover:translate-y-[2px] transition-all"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mb-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const locked = tab.requiresSub && !credits?.hasSubscription;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? 'bg-white text-gray-900 border-[#58cc02]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {locked && <Lock className="w-3 h-3 text-gray-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {needsSub ? (
          <div className="max-w-md mx-auto mt-12 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto border-2 border-purple-200 shadow-[0_4px_0_#c4b5fd]">
              <Lock className="w-7 h-7 text-purple-500" />
            </div>
            <h2 className="text-lg font-black text-gray-900">
              Unlock {currentTab.label}
            </h2>
            <p className="text-gray-500 text-sm">
              Subscribe to get AI credits and access all creative tools.
            </p>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm"
            >
              View Plans
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <DashboardOverview />}
            {activeTab === 'art' && <SketchToArt credits={credits} onCreditsUpdate={fetchCredits} />}
            {activeTab === '3d' && <ImageTo3D credits={credits} onCreditsUpdate={fetchCredits} />}
            {activeTab === 'music' && <MusicGenerator credits={credits} onCreditsUpdate={fetchCredits} />}
            {activeTab === 'calendar' && <DevCalendar credits={credits} onCreditsUpdate={fetchCredits} />}
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
