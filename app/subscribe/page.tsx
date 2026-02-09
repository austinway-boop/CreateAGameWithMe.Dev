'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Play, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/plans';

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/validation');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubscribe = async (plan: 'starter' | 'pro') => {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  };

  const handleVideoEnd = async () => {
    setVideoWatched(true);
    setUnlocking(true);
    try {
      await fetch('/api/video-unlock', { method: 'POST' });
    } catch {
      // silent
    } finally {
      setUnlocking(false);
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#d7ffb8] border-2 border-[#58cc02] rounded-2xl shadow-[0_4px_0_#58a700] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-[#58a700]" />
          </div>
          <h1 className="text-xl font-black text-gray-900">You&apos;re in.</h1>
          <p className="text-gray-500 text-sm">Loading your full results...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/validation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="font-bold text-gray-900">Full Results</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {cancelled && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 text-center">
            <p className="text-amber-700 font-medium text-sm">No worries. You can try again or watch the video instead.</p>
          </div>
        )}

        {/* Context line */}
        <p className="text-center text-gray-500 text-sm pt-2">
          Watch the video below or grab a plan to see your full breakdown.
        </p>

        {/* Video */}
        <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb]">
          <div className="relative bg-gray-900 aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              onEnded={handleVideoEnd}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              controls={videoPlaying}
              playsInline
              preload="metadata"
            >
              <source src="" type="video/mp4" />
            </video>
            {!videoPlaying && !videoWatched && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
                onClick={handlePlayVideo}
              >
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                </div>
                <p className="text-white/70 text-xs mt-3">Watch to unlock results</p>
              </div>
            )}
            {videoWatched && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
                <CheckCircle2 className="w-10 h-10 text-[#58cc02] mb-2" />
                <p className="text-white font-bold text-sm">Done</p>
              </div>
            )}
          </div>
          {videoWatched && (
            <div className="p-3 bg-white">
              <button
                onClick={() => router.push('/validation')}
                disabled={unlocking}
                className="w-full bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {unlocking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    View Full Results
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-3 pt-1">
          {/* Starter */}
          <button
            onClick={() => handleSubscribe('starter')}
            disabled={!!loading}
            className="w-full text-left bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] hover:shadow-[0_2px_0_#e5e7eb] hover:translate-y-[2px] transition-all p-4 disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ddf4ff] border-2 border-[#1cb0f6] rounded-xl flex items-center justify-center shadow-[0_2px_0_#1899d6]">
                  <Zap className="w-5 h-5 text-[#1899d6]" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Starter</div>
                  <div className="text-xs text-gray-500">{PLANS.starter.credits} AI credits / mo</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loading === 'starter' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <>
                    <span className="text-lg font-black text-gray-900">{PLANS.starter.priceDisplay}</span>
                    <span className="text-xs text-gray-400">/mo</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {PLANS.starter.features.slice(0, -1).map((f, i) => (
                <span key={i} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </button>

          {/* Pro */}
          <button
            onClick={() => handleSubscribe('pro')}
            disabled={!!loading}
            className="w-full text-left bg-white rounded-2xl border-2 border-[#58cc02] shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] transition-all p-4 disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#d7ffb8] border-2 border-[#58cc02] rounded-xl flex items-center justify-center shadow-[0_2px_0_#58a700]">
                  <Zap className="w-5 h-5 text-[#58a700]" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    Pro
                    <span className="ml-2 text-[10px] bg-[#58cc02] text-white px-1.5 py-0.5 rounded font-bold uppercase align-middle whitespace-nowrap">Best Value</span>
                  </div>
                  <div className="text-xs text-gray-500">{PLANS.pro.credits} AI credits / mo</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {loading === 'pro' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <>
                    <span className="text-lg font-black text-gray-900">{PLANS.pro.priceDisplay}</span>
                    <span className="text-xs text-gray-400">/mo</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {PLANS.pro.features.slice(0, -1).map((f, i) => (
                <span key={i} className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400">
          Cancel anytime. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}
